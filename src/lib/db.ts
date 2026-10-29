import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, types, type PoolClient } from "pg";

/**
 * Conexao com o banco do Supabase (PostgreSQL).
 *
 * A string de conexao vem de DATABASE_URL, no arquivo `.env.local`.
 * Veja o PASSO-A-PASSO.md para saber onde copiar essa string no Supabase.
 *
 * Em desenvolvimento o Next recarrega os modulos a cada edicao, entao o pool
 * fica guardado no globalThis para nao abrir dezenas de conexoes.
 */

/* -------------------------------------------------------------------------- */
/* Conversao de tipos                                                          */
/* -------------------------------------------------------------------------- */

// Por padrao o driver converte `date` em objeto Date no fuso local, o que pode
// deslocar o dia. O sistema inteiro trabalha com texto 'AAAA-MM-DD', entao
// pedimos a data crua.
types.setTypeParser(1082, (valor) => valor); // date
types.setTypeParser(1114, (valor) => valor); // timestamp
types.setTypeParser(1184, (valor) => valor); // timestamptz

// numeric vem como texto (para nao perder precisao); aqui vira numero, porque
// todo calculo do sistema e feito em JavaScript.
types.setTypeParser(1700, (valor) => Number.parseFloat(valor));

// bigint (inclusive COUNT(*)) tambem vem como texto.
types.setTypeParser(20, (valor) => Number(valor));

/* -------------------------------------------------------------------------- */
/* Pool                                                                        */
/* -------------------------------------------------------------------------- */

export class ConfiguracaoAusenteError extends Error {
  constructor() {
    super(
      "DATABASE_URL nao encontrada. Crie o arquivo .env.local na pasta do projeto " +
        "com a string de conexao do Supabase. Veja o PASSO-A-PASSO.md.",
    );
    this.name = "ConfiguracaoAusenteError";
  }
}

type GlobalComPool = typeof globalThis & { __democratiaPool?: Pool };
const globalParaPool = globalThis as GlobalComPool;

/**
 * O Supabase exige TLS; um banco local (npm run db:local) nao fala TLS.
 * Detectamos pelo endereco, e DATABASE_SSL=desligado forca o desligamento.
 */
function ehBancoLocal(connectionString: string): boolean {
  return /@(127\.0\.0\.1|localhost|\[::1\])[:/]/.test(connectionString);
}

export function configuracaoSsl(connectionString: string) {
  const desligadoNoEnv = (process.env.DATABASE_SSL ?? "").toLowerCase() === "desligado";
  if (ehBancoLocal(connectionString) || desligadoNoEnv) return false;
  // O certificado do Supabase e de uma CA propria, por isso nao verificamos a
  // cadeia - a conexao continua criptografada.
  return { rejectUnauthorized: false };
}

/**
 * Quantas conexoes simultaneas o pool pode abrir.
 *
 * - Banco local (npm run db:local): atende uma conexao por vez; com uma so no
 *   pool as consultas simultaneas entram na fila em vez de derrubar o socket.
 * - Vercel: cada requisicao pode subir uma instancia nova da funcao, e cada uma
 *   teria o seu proprio pool. Varias conexoes por instancia estouram o limite
 *   do projeto no Supabase, entao ali e uma por instancia.
 * - Computador do time: o pooler do Supabase aguenta tranquilamente dez.
 */
function tamanhoDoPool(connectionString: string): number {
  if (ehBancoLocal(connectionString)) return 1;
  if (process.env.VERCEL) return 1;
  return 10;
}

function criarPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new ConfiguracaoAusenteError();

  return new Pool({
    connectionString,
    ssl: configuracaoSsl(connectionString),
    max: tamanhoDoPool(connectionString),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

export function getPool(): Pool {
  if (!globalParaPool.__democratiaPool) {
    globalParaPool.__democratiaPool = criarPool();
  }
  return globalParaPool.__democratiaPool;
}

/* -------------------------------------------------------------------------- */
/* Transacoes                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Enquanto uma transacao esta aberta, toda consulta feita dentro dela precisa
 * usar a MESMA conexao. O AsyncLocalStorage carrega essa conexao pelo contexto,
 * para que `all` / `one` / `run` continuem sendo chamados do mesmo jeito.
 */
const conexaoDaTransacao = new AsyncLocalStorage<PoolClient>();

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  const cliente = await getPool().connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await conexaoDaTransacao.run(cliente, fn);
    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw erro;
  } finally {
    cliente.release();
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers de consulta                                                         */
/* -------------------------------------------------------------------------- */

export type Row = Record<string, unknown>;
export type Param = string | number | boolean | null | Date;

/**
 * Converte os `?` do SQL nos marcadores `$1, $2...` que o Postgres usa.
 * Ignora o que estiver dentro de aspas simples.
 */
export function comMarcadores(sql: string): string {
  let saida = "";
  let dentroDeTexto = false;
  let indice = 0;

  for (let posicao = 0; posicao < sql.length; posicao += 1) {
    const caractere = sql[posicao];

    if (caractere === "'") {
      dentroDeTexto = !dentroDeTexto;
      saida += caractere;
      continue;
    }

    if (caractere === "?" && !dentroDeTexto) {
      indice += 1;
      saida += `$${indice}`;
      continue;
    }

    saida += caractere;
  }

  return saida;
}

async function executar(sql: string, params: Param[]) {
  const texto = comMarcadores(sql);
  const cliente = conexaoDaTransacao.getStore();
  if (cliente) return cliente.query(texto, params);
  return getPool().query(texto, params);
}

export async function all<T = Row>(sql: string, params: Param[] = []): Promise<T[]> {
  const resultado = await executar(sql, params);
  return resultado.rows as T[];
}

export async function one<T = Row>(
  sql: string,
  params: Param[] = [],
): Promise<T | undefined> {
  const resultado = await executar(sql, params);
  return resultado.rows[0] as T | undefined;
}

export async function run(sql: string, params: Param[] = []) {
  const resultado = await executar(sql, params);
  return {
    changes: resultado.rowCount ?? 0,
    rows: resultado.rows as Row[],
  };
}

/** Soma um SELECT que devolve uma unica coluna numerica chamada `total`. */
export async function sum(sql: string, params: Param[] = []): Promise<number> {
  const linha = await one<{ total: number | null }>(sql, params);
  return Number(linha?.total ?? 0);
}

export async function count(sql: string, params: Param[] = []): Promise<number> {
  return sum(sql, params);
}

/* -------------------------------------------------------------------------- */
/* Diagnostico                                                                 */
/* -------------------------------------------------------------------------- */

export interface EstadoConexao {
  ok: boolean;
  mensagem: string;
  tabelas?: number;
  estruturaPronta?: boolean;
  dadosDoManual?: boolean;
}

/** Usado pela tela de parametros e pelo script de teste. */
export async function verificarConexao(): Promise<EstadoConexao> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      mensagem:
        "Falta a DATABASE_URL. Crie o arquivo .env.local com a string de conexao do Supabase.",
    };
  }

  try {
    const tabelas = await sum(
      `SELECT COUNT(*) AS total
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'`,
    );

    if (tabelas === 0) {
      return {
        ok: true,
        tabelas: 0,
        estruturaPronta: false,
        dadosDoManual: false,
        mensagem:
          "Conectado no Supabase, mas o banco esta vazio. Rode `npm run db:instalar` para criar a estrutura.",
      };
    }

    const pops = await sum("SELECT COUNT(*) AS total FROM pops").catch(() => 0);

    return {
      ok: true,
      tabelas,
      estruturaPronta: true,
      dadosDoManual: pops > 0,
      mensagem:
        pops > 0
          ? `Conectado no Supabase. ${tabelas} tabelas, dados do manual carregados.`
          : `Conectado no Supabase. ${tabelas} tabelas, mas os dados do manual ainda nao foram carregados.`,
    };
  } catch (erro) {
    return { ok: false, mensagem: traduzirErro(erro) };
  }
}

/** Transforma os erros mais comuns do Postgres em algo legivel. */
export function traduzirErro(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro);

  if (mensagem.includes("ENOTFOUND") || mensagem.includes("EAI_AGAIN")) {
    return "Nao foi possivel encontrar o servidor. Confira se o endereco da DATABASE_URL foi copiado inteiro.";
  }
  if (mensagem.includes("password authentication failed")) {
    return "Senha do banco incorreta. Troque [YOUR-PASSWORD] na DATABASE_URL pela senha real do projeto.";
  }
  if (mensagem.includes("ETIMEDOUT") || mensagem.includes("timeout")) {
    return "A conexao demorou demais. Verifique a internet e se o projeto do Supabase nao esta pausado.";
  }
  if (mensagem.includes("does not exist") && mensagem.includes("relation")) {
    return "As tabelas ainda nao existem no banco. Rode `npm run db:instalar`.";
  }
  if (mensagem.includes("SASL") || mensagem.includes("SCRAM")) {
    return "A senha da DATABASE_URL parece vazia ou invalida. Confira se substituiu [YOUR-PASSWORD].";
  }
  return mensagem;
}
