/**
 * Valida os arquivos de supabase/ contra um PostgreSQL de verdade, rodando em
 * memoria (PGlite). Serve para pegar erro de sintaxe e de dialeto antes de
 * mandar o SQL para o Supabase.
 *
 * Uso: npm run db:validar
 */

import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const VERDE = "\x1b[32m";
const VERMELHO = "\x1b[31m";
const NEGRITO = "\x1b[1m";
const FIM = "\x1b[0m";

const db = new PGlite();
let falhas = 0;

async function etapa(titulo, fn) {
  process.stdout.write(`${titulo.padEnd(48, ".")} `);
  try {
    const extra = await fn();
    console.log(`${VERDE}ok${FIM}${typeof extra === "string" ? ` ${extra}` : ""}`);
  } catch (erro) {
    falhas += 1;
    console.log(`${VERMELHO}FALHOU${FIM}`);
    console.error(`  ${VERMELHO}${erro?.message ?? erro}${FIM}`);
  }
}

console.log(`\n${NEGRITO}Validando o SQL do Supabase num Postgres real (em memoria)${FIM}\n`);

for (const arquivo of ["01-estrutura.sql", "02-dados-do-manual.sql"]) {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase", arquivo), "utf8");
  await etapa(`Rodando ${arquivo}`, () => db.exec(sql));
}

await etapa("Rodando os dois de novo (idempotencia)", async () => {
  for (const arquivo of ["01-estrutura.sql", "02-dados-do-manual.sql"]) {
    const sql = fs.readFileSync(path.join(process.cwd(), "supabase", arquivo), "utf8");
    await db.exec(sql);
  }
});

await etapa("Conferindo as tabelas", async () => {
  const r = await db.query(`
    SELECT COUNT(*)::int AS n FROM pg_class c
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = 'public' AND c.relkind = 'r'`);
  const n = r.rows[0].n;
  if (n < 30) throw new Error(`esperava 30+ tabelas, achei ${n}`);
  return `(${n} tabelas)`;
});

await etapa("Conferindo os dados do manual", async () => {
  const r = await db.query(`
    SELECT (SELECT COUNT(*)::int FROM pops) AS pops,
           (SELECT COUNT(*)::int FROM raci) AS raci,
           (SELECT COUNT(*)::int FROM indicadores) AS indicadores,
           (SELECT COUNT(*)::int FROM glossario) AS glossario,
           (SELECT COUNT(*)::int FROM pendencias) AS pendencias,
           (SELECT COUNT(*)::int FROM cadeiras) AS cadeiras`);
  const d = r.rows[0];
  const esperado = { pops: 7, raci: 12, indicadores: 12, glossario: 52, pendencias: 27, cadeiras: 7 };
  for (const [chave, valor] of Object.entries(esperado)) {
    if (d[chave] !== valor) throw new Error(`${chave}: esperava ${valor}, achei ${d[chave]}`);
  }
  return `(POPs ${d.pops}, RACI ${d.raci}, glossario ${d.glossario})`;
});

await etapa("Conferindo as chaves estrangeiras do seed", async () => {
  const r = await db.query(`
    SELECT COUNT(*)::int AS n FROM cadeiras WHERE ocupante_id IS NOT NULL`);
  if (r.rows[0].n < 3) throw new Error("cadeiras sem ocupante ligado a pessoas");
  const p = await db.query(`
    SELECT COUNT(*)::int AS n FROM plano_contas WHERE centro_custo_id IS NOT NULL`);
  if (p.rows[0].n < 15) throw new Error("plano de contas sem centro de custo ligado");
});

await etapa("Conferindo o gatilho de atualizado_em", async () => {
  await db.exec(`INSERT INTO clientes (nome) VALUES ('Teste gatilho')`);
  await db.exec(`UPDATE clientes SET cidade = 'BH' WHERE nome = 'Teste gatilho'`);
  const r = await db.query(
    `SELECT (atualizado_em > criado_em) AS mudou FROM clientes WHERE nome = 'Teste gatilho'`,
  );
  if (r.rows[0].mudou !== true) throw new Error("atualizado_em nao foi atualizado");
  await db.exec(`DELETE FROM clientes WHERE nome = 'Teste gatilho'`);
});

await etapa("Conferindo que a sequencia de id continua certa", async () => {
  const r = await db.query(`INSERT INTO pessoas (nome) VALUES ('Teste id') RETURNING id`);
  const id = Number(r.rows[0].id);
  if (id <= 3) throw new Error(`id ${id} colidiria com o seed (esperava 4+)`);
  await db.exec(`DELETE FROM pessoas WHERE nome = 'Teste id'`);
});

/* -------------------------------------------------------------------------- */
/* As consultas do motor de indicadores                                        */
/* -------------------------------------------------------------------------- */

const CONSULTAS = {
  "saldo de caixa": `
    SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS total
      FROM lancamentos WHERE status = 'realizado'`,

  "custo fixo mensal": `
    SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos
     WHERE tipo = 'despesa' AND custo_fixo = true AND status = 'realizado'
       AND COALESCE(competencia, to_char(data, 'YYYY-MM')) IN ('2026-08','2026-09','2026-10')`,

  inadimplencia: `
    SELECT COALESCE(SUM(valor - COALESCE(valor_pago, 0)), 0) AS total, COUNT(*) AS quantidade
      FROM faturas
     WHERE status IN ('aberta','vencida','negociada') AND vencimento < current_date`,

  "pipeline ponderado": `
    SELECT COALESCE(SUM(valor), 0) AS total,
           COALESCE(SUM(valor * probabilidade / 100.0), 0) AS ponderado, COUNT(*) AS quantidade
      FROM negociacoes WHERE etapa IN ('prospeccao','qualificacao','proposta','negociacao')`,

  "vendas fechadas no mes": `
    SELECT COALESCE(SUM(valor), 0) AS total FROM negociacoes
     WHERE etapa = 'fechada_ganha' AND to_char(data_fechamento, 'YYYY-MM') = '2026-10'`,

  "base de clientes": `
    SELECT COUNT(*) FILTER (WHERE status = 'ativo') AS ativos,
           COUNT(*) FILTER (WHERE status = 'em_risco') AS em_risco,
           COUNT(*) FILTER (WHERE status = 'inadimplente') AS inadimplentes,
           COUNT(*) FILTER (WHERE status = 'onboarding') AS onboarding
      FROM clientes`,

  churn: `
    SELECT COUNT(*) AS total FROM clientes
     WHERE data_inicio IS NOT NULL AND data_inicio < '2026-10-01'::date
       AND (data_cancelamento IS NULL OR to_char(data_cancelamento, 'YYYY-MM') >= '2026-10')`,

  ativacao: `
    SELECT COUNT(DISTINCT c.id) AS total FROM clientes c
     WHERE c.status = 'ativo'
       AND (c.ultimo_contato_cs >= current_date - INTERVAL '30 days'
            OR EXISTS (SELECT 1 FROM interacoes i
                        WHERE i.cliente_id = c.id AND i.data >= current_date - INTERVAL '30 days'))`,

  "decisoes no prazo": `
    SELECT COUNT(*) AS avaliadas,
           COUNT(*) FILTER (WHERE entregue_em IS NOT NULL AND prazo IS NOT NULL AND entregue_em <= prazo) AS no_prazo
      FROM decisoes
     WHERE status IN ('entregue','atrasada')
        OR (status IN ('pendente','em_andamento') AND prazo IS NOT NULL AND prazo < current_date)`,

  "ocupacao de eventos": `
    SELECT id, nome, data, vagas, inscritos,
           CASE WHEN vagas > 0 THEN (inscritos * 100.0 / vagas) ELSE NULL END AS ocupacao_pct,
           (data - current_date) AS dias_para_evento
      FROM eventos WHERE status IN ('planejado','confirmado') AND data IS NOT NULL ORDER BY data`,

  "SLA do suporte": `
    SELECT AVG(primeira_resposta_horas)::float8 AS media,
           COUNT(*) FILTER (WHERE primeira_resposta_horas > 4) AS fora
      FROM chamados WHERE primeira_resposta_horas IS NOT NULL`,

  "NPS dos eventos": `
    SELECT AVG(nps)::float8 AS media FROM eventos WHERE nps IS NOT NULL AND status = 'realizado'`,

  "DRE por unidade": `
    SELECT l.unidade_negocio_id AS unidade_id, u.nome AS unidade, u.id AS ordem,
           COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) AS receita,
           COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0) AS custo
      FROM lancamentos l LEFT JOIN unidades_negocio u ON u.id = l.unidade_negocio_id
     WHERE l.status IN ('realizado') AND COALESCE(l.competencia, to_char(l.data, 'YYYY-MM')) = '2026-10'
     GROUP BY l.unidade_negocio_id, u.nome, u.id ORDER BY u.id NULLS LAST`,

  "serie mensal": `
    SELECT COALESCE(competencia, to_char(data, 'YYYY-MM')) AS competencia,
           COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receita,
           COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesa
      FROM lancamentos WHERE status = 'realizado' GROUP BY 1`,

  "despesas por centro de custo": `
    SELECT c.nome AS centro, COALESCE(SUM(l.valor), 0) AS total
      FROM lancamentos l LEFT JOIN centros_custo c ON c.id = l.centro_custo_id
     WHERE l.tipo = 'despesa' AND l.status = 'realizado'
       AND COALESCE(l.competencia, to_char(l.data, 'YYYY-MM')) = '2026-10'
     GROUP BY l.centro_custo_id, c.nome ORDER BY total DESC`,

  "decisoes por dono": `
    SELECT p.nome AS dono,
           COUNT(*) FILTER (WHERE d.status IN ('pendente','em_andamento')) AS abertas,
           COUNT(*) FILTER (WHERE d.status IN ('pendente','em_andamento','atrasada')
                              AND d.prazo IS NOT NULL AND d.prazo < current_date) AS atrasadas,
           COUNT(*) FILTER (WHERE d.status = 'entregue') AS entregues
      FROM decisoes d LEFT JOIN pessoas p ON p.id = d.dono_id
     GROUP BY d.dono_id, p.nome ORDER BY atrasadas DESC, abertas DESC`,

  "decisoes pendentes da quarta": `
    SELECT d.id, d.decisao, d.prazo, d.status, p.nome AS dono, (current_date - d.prazo) AS atraso
      FROM decisoes d LEFT JOIN pessoas p ON p.id = d.dono_id
     WHERE d.status IN ('pendente','em_andamento','atrasada') ORDER BY d.prazo NULLS LAST`,

  "fila de cobranca": `
    SELECT f.id, f.valor, f.vencimento, c.nome AS cliente, (current_date - f.vencimento) AS dias_atraso
      FROM faturas f JOIN clientes c ON c.id = f.cliente_id
     WHERE f.status IN ('aberta','vencida','negociada') AND f.vencimento < current_date
     ORDER BY f.vencimento`,

  "indicadores com ultima leitura": `
    SELECT i.*, (SELECT l.valor FROM indicador_leituras l
                  WHERE l.indicador_id = i.id ORDER BY l.data DESC, l.id DESC LIMIT 1) AS ultima_leitura
      FROM indicadores i WHERE i.ativo = true ORDER BY i.ordem, i.id`,

  "certidoes vencendo": `
    SELECT nome, validade FROM documentos
     WHERE validade IS NOT NULL AND validade <= current_date + INTERVAL '30 days' ORDER BY validade`,

  "resumo do cliente": `
    SELECT (SELECT COUNT(*) FROM contratos WHERE cliente_id = 1 AND status = 'ativo') AS contratos,
           (SELECT COALESCE(SUM(CASE periodicidade
                WHEN 'mensal' THEN valor WHEN 'trimestral' THEN valor / 3.0
                WHEN 'semestral' THEN valor / 6.0 WHEN 'anual' THEN valor / 12.0
                ELSE 0 END), 0) FROM contratos WHERE cliente_id = 1 AND status = 'ativo') AS mrr,
           (SELECT COALESCE(SUM(valor - COALESCE(valor_pago, 0)), 0) FROM faturas
             WHERE cliente_id = 1 AND status IN ('aberta','vencida','negociada')
               AND vencimento < current_date) AS vencido`,

  "organograma": `
    SELECT c.*, p.nome AS ocupante FROM cadeiras c
      LEFT JOIN pessoas p ON p.id = c.ocupante_id
     ORDER BY c.vaga_aberta, c.ordem_contratacao NULLS LAST, c.nome`,
};

console.log("");
for (const [nome, sql] of Object.entries(CONSULTAS)) {
  await etapa(`Consulta: ${nome}`, () => db.query(sql));
}

/* -------------------------------------------------------------------------- */
/* As consultas geradas pelo repositorio generico                              */
/* -------------------------------------------------------------------------- */

console.log("");

const { RESOURCES, requireResource } = await carregarRecursos();

await etapa("Listagem gerada para cada recurso", async () => {
  for (const recurso of RESOURCES) {
    const selects = ["t.id", "t.criado_em", "t.atualizado_em"];
    const joins = [];
    for (const campo of recurso.fields) selects.push(`t.${campo.name}`);

    recurso.fields
      .filter((campo) => campo.type === "ref" && campo.ref)
      .forEach((campo, indice) => {
        const alvo = requireResource(campo.ref);
        joins.push(`LEFT JOIN ${alvo.table} j${indice} ON j${indice}.id = t.${campo.name}`);
        selects.push(`j${indice}.${alvo.labelField} AS ${campo.name}__label`);
      });

    const busca = recurso.searchFields.map((campo) => `t.${campo}::text ILIKE '%x%'`).join(" OR ");

    await db.query(
      `SELECT ${selects.join(", ")} FROM ${recurso.table} t ${joins.join(" ")}
        ${busca ? `WHERE (${busca})` : ""}
        ORDER BY ${recurso.defaultOrder} LIMIT 5 OFFSET 0`,
    );
    await db.query(
      `SELECT COUNT(*) AS total FROM ${recurso.table} t ${joins.join(" ")}`,
    );
    await db.query(
      `SELECT t.id, t.${recurso.labelField} AS label FROM ${recurso.table} t
        ORDER BY ${recurso.defaultOrder}`,
    );
  }
  return `(${RESOURCES.length} recursos)`;
});

/* -------------------------------------------------------------------------- */

await db.close();

if (falhas > 0) {
  console.log(`\n${VERMELHO}${NEGRITO}${falhas} verificacao(oes) falharam.${FIM}\n`);
  process.exit(1);
}
console.log(`\n${VERDE}${NEGRITO}Tudo certo: o SQL roda num PostgreSQL de verdade.${FIM}\n`);

/**
 * Carrega o registro de recursos direto do TypeScript.
 * O Node 23+ remove as anotacoes de tipo sozinho ao importar um .ts.
 */
async function carregarRecursos() {
  const caminho = path.join(process.cwd(), "src", "lib", "resources.ts");
  return import(`file:///${caminho.replace(/\\/g, "/")}`);
}
