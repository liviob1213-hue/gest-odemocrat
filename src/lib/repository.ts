import "server-only";

import { all, one, run, type Param, type Row } from "./db";
import { refFields, requireResource, type ResourceDef } from "./resources";

/**
 * Repositorio generico.
 *
 * Como todo recurso e descrito em `resources.ts`, as consultas sao montadas a
 * partir dos metadados: as colunas vem da definicao (nunca do corpo da
 * requisicao) e os valores vao sempre como parametros vinculados, o que elimina
 * injecao de SQL mesmo com a API totalmente generica.
 */

export interface ListOptions {
  search?: string;
  /** Filtros exatos por coluna: { status: "aberta" }. */
  filters?: Record<string, string | number>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface ListResult {
  rows: Row[];
  total: number;
}

function columnNames(resource: ResourceDef): string[] {
  return resource.fields.map((field) => field.name);
}

function assertColumn(resource: ResourceDef, column: string): string {
  if (!columnNames(resource).includes(column) && column !== "id") {
    throw new Error(`Coluna desconhecida em ${resource.key}: ${column}`);
  }
  return column;
}

/** Monta os LEFT JOINs que trazem o rotulo de cada relacionamento. */
function buildJoins(resource: ResourceDef) {
  const selects: string[] = ["t.id", "t.criado_em", "t.atualizado_em"];
  const joins: string[] = [];

  for (const field of resource.fields) {
    selects.push(`t.${field.name}`);
  }

  refFields(resource).forEach((field, index) => {
    const target = requireResource(field.ref!);
    const alias = `j${index}`;
    joins.push(
      `LEFT JOIN ${target.table} ${alias} ON ${alias}.id = t.${field.name}`,
    );
    selects.push(`${alias}.${target.labelField} AS ${field.name}__label`);
  });

  return { select: selects.join(", "), join: joins.join(" ") };
}

export async function listRecords(
  resourceKey: string,
  options: ListOptions = {},
): Promise<ListResult> {
  const resource = requireResource(resourceKey);
  const { select, join } = buildJoins(resource);

  const where: string[] = [];
  const params: Param[] = [];

  if (options.search && resource.searchFields.length > 0) {
    // ILIKE: no Postgres o LIKE diferencia maiusculas de minusculas; a busca da
    // tela nao deve diferenciar.
    const clause = resource.searchFields
      .map((field) => `t.${assertColumn(resource, field)}::text ILIKE ?`)
      .join(" OR ");
    where.push(`(${clause})`);
    for (let i = 0; i < resource.searchFields.length; i += 1) {
      params.push(`%${options.search}%`);
    }
  }

  for (const [column, value] of Object.entries(options.filters ?? {})) {
    if (value === "" || value === undefined || value === null) continue;
    where.push(`t.${assertColumn(resource, column)}::text = ?`);
    params.push(String(value));
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await one<{ total: number }>(
    `SELECT COUNT(*) AS total FROM ${resource.table} t ${join} ${whereSql}`,
    params,
  );

  const orderBy = options.orderBy
    ? options.orderBy
        .split(",")
        .map((part) => {
          const [column, direction] = part.trim().split(/\s+/);
          const dir = direction?.toUpperCase() === "DESC" ? "DESC" : "ASC";
          return `t.${assertColumn(resource, column)} ${dir}`;
        })
        .join(", ")
    : resource.defaultOrder;

  const limit = Math.min(Math.max(options.limit ?? 500, 1), 5000);
  const offset = Math.max(options.offset ?? 0, 0);

  const rows = await all<Row>(
    `SELECT ${select}
       FROM ${resource.table} t
       ${join}
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return { rows, total: Number(totalRow?.total ?? 0) };
}

export async function getRecord(
  resourceKey: string,
  id: number,
): Promise<Row | undefined> {
  const resource = requireResource(resourceKey);
  const { select, join } = buildJoins(resource);
  return one<Row>(
    `SELECT ${select} FROM ${resource.table} t ${join} WHERE t.id = ?`,
    [id],
  );
}

export async function createRecord(
  resourceKey: string,
  data: Record<string, Param>,
): Promise<Row> {
  const resource = requireResource(resourceKey);
  const columns = Object.keys(data).map((column) => assertColumn(resource, column));
  const placeholders = columns.map(() => "?").join(", ");

  const resultado = await run(
    `INSERT INTO ${resource.table} (${columns.join(", ")})
     VALUES (${placeholders})
     RETURNING id`,
    columns.map((column) => data[column]),
  );

  const novoId = Number(resultado.rows[0]?.id);
  return (await getRecord(resourceKey, novoId)) as Row;
}

export async function updateRecord(
  resourceKey: string,
  id: number,
  data: Record<string, Param>,
): Promise<Row | undefined> {
  const resource = requireResource(resourceKey);
  const columns = Object.keys(data).map((column) => assertColumn(resource, column));
  if (columns.length === 0) return getRecord(resourceKey, id);

  const assignments = columns.map((column) => `${column} = ?`).join(", ");
  await run(
    `UPDATE ${resource.table}
        SET ${assignments}, atualizado_em = now()
      WHERE id = ?`,
    [...columns.map((column) => data[column]), id],
  );

  return getRecord(resourceKey, id);
}

export async function deleteRecord(resourceKey: string, id: number): Promise<boolean> {
  const resource = requireResource(resourceKey);
  const resultado = await run(`DELETE FROM ${resource.table} WHERE id = ?`, [id]);
  return resultado.changes > 0;
}

/** Opcoes de um relacionamento, para montar os selects do formulario. */
export async function refOptions(
  resourceKey: string,
): Promise<{ value: number; label: string }[]> {
  const resource = requireResource(resourceKey);
  // O alias `t` e obrigatorio: os defaultOrder sao escritos com esse prefixo
  // para nao ficarem ambiguos quando a listagem faz LEFT JOIN.
  const rows = await all<Row>(
    `SELECT t.id, t.${resource.labelField} AS label
       FROM ${resource.table} t
      ORDER BY ${resource.defaultOrder}`,
  );
  return rows.map((row) => ({
    value: Number(row.id),
    label: String(row.label ?? `#${row.id}`),
  }));
}
