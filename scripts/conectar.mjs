/**
 * Conecta o sistema ao Supabase, perguntando as informacoes e escrevendo o
 * arquivo .env.local sozinho.
 *
 * Uso: duplo clique em PASSO-1-conectar-banco.cmd, ou `npm run db:conectar`.
 *
 * Existe porque criar na mao um arquivo chamado ".env.local" no Windows e
 * chato: o Explorador esconde a extensao e nao gosta de nomes comecando com
 * ponto.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import pg from "pg";

import { NPM } from "./lib-env.mjs";

const VERDE = "\x1b[32m";
const VERMELHO = "\x1b[31m";
const AMARELO = "\x1b[33m";
const AZUL = "\x1b[36m";
const NEGRITO = "\x1b[1m";
const FIM = "\x1b[0m";

const leitor = readline.createInterface({ input: stdin, output: stdout });

/** Pergunta e encerra com mensagem clara se a entrada for fechada. */
async function perguntar(texto) {
  const resposta = await leitor.question(texto).catch(() => null);
  if (resposta === null || resposta === undefined) {
    encerrar("A entrada foi interrompida.", "Rode `${NPM} run db:conectar` de novo e responda as perguntas.");
  }
  return resposta;
}

/** Um banco local (npm run db:local) nao fala TLS. */
const ehLocal = (u) => /@(127\.0\.0\.1|localhost|\[::1\])[:/]/.test(u);

console.log(`
${NEGRITO}Conectar o sistema ao Supabase${FIM}

Vou pedir duas coisas e montar o arquivo de configuracao para voce.

${NEGRITO}Onde achar a primeira:${FIM}
  1. Abra o seu projeto em ${AZUL}https://supabase.com/dashboard${FIM}
  2. Clique no botao ${NEGRITO}Connect${FIM}, no ${NEGRITO}topo da pagina${FIM}
  3. Procure a secao ${NEGRITO}Session pooler${FIM} e copie a linha que comeca com postgresql://
`);

let url = (await perguntar(`${NEGRITO}Cole a connection string aqui:${FIM}\n> `)).trim();

// Tolera o usuario colar com aspas ou com o "DATABASE_URL=" na frente.
url = url.replace(/^DATABASE_URL\s*=\s*/i, "").replace(/^["']|["']$/g, "").trim();

if (!url.startsWith("postgres")) {
  encerrar(
    "Isso nao parece uma connection string.",
    "Ela precisa comecar com postgresql:// — copie a linha inteira da secao Session pooler.",
  );
}

// Uma string cortada no meio quebraria mais adiante com um erro ilegivel.
let endereco;
try {
  endereco = new URL(url);
} catch {
  endereco = null;
}
if (!endereco?.hostname) {
  encerrar(
    "A connection string esta incompleta.",
    "Faltou o endereco do servidor (a parte depois do @).",
    "Volte no botao Connect do Supabase e copie a linha inteira, de uma vez so.",
  );
}
if (!endereco.port) {
  encerrar(
    "A connection string esta sem a porta.",
    "A do Session pooler termina com :5432/postgres — copie a linha inteira.",
  );
}

if (/supabase\.co:5432/.test(url) && !url.includes("pooler")) {
  console.log(`
${AMARELO}Aviso: isso parece a "Direct connection", nao a "Session pooler".${FIM}
A direct connection so funciona em rede com IPv6 e costuma falhar em internet
residencial. Se o teste falhar, volte no botao Connect e copie a do Session pooler.
`);
}

/* --------------------------------- Senha ---------------------------------- */

const temPlaceholder = /\[YOUR-PASSWORD\]|\[SUA-SENHA\]/i.test(url);

if (temPlaceholder) {
  console.log(`
${NEGRITO}Agora a senha do banco.${FIM}

Se voce nao souber qual e (ela so aparece quando o projeto e criado):
  1. Abra ${AZUL}https://supabase.com/dashboard/project/_/database/settings${FIM}
  2. Procure ${NEGRITO}Database password${FIM} e clique em ${NEGRITO}Reset database password${FIM}
  3. Clique em ${NEGRITO}Generate a password${FIM}, confirme e copie a senha

Resetar a senha nao apaga nada do banco.
`);

  const senha = (await perguntar(`${NEGRITO}Cole a senha aqui:${FIM}\n> `)).trim();
  if (!senha) encerrar("Nenhuma senha foi informada.");

  // Caracteres reservados quebram a URL; o encode resolve sem o usuario saber.
  url = url.replace(/\[YOUR-PASSWORD\]|\[SUA-SENHA\]/i, encodeURIComponent(senha));
} else {
  console.log(`${VERDE}A senha ja veio preenchida na string.${FIM}`);
}

leitor.close();

/* -------------------------------- Testa ----------------------------------- */

console.log(`\nTestando a conexao...`);

const cliente = new pg.Client({
  connectionString: url,
  ssl: ehLocal(url) ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

try {
  await cliente.connect();
  const { rows } = await cliente.query(`
    SELECT COUNT(*) AS tabelas FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'`);
  const tabelas = Number(rows[0].tabelas);
  await cliente.end();

  gravar(url);

  console.log(`
${VERDE}${NEGRITO}Conectado.${FIM} Arquivo .env.local criado.

Banco: ${tabelas} tabela(s).
`);

  if (tabelas === 0) {
    console.log(`Proximo passo: ${NEGRITO}${NPM} run db:instalar (ou duplo clique em PASSO-2-criar-tabelas.cmd)${FIM} (cria as tabelas)\n`);
  } else {
    console.log(`Proximo passo: ${NEGRITO}${NPM} run dev (ou duplo clique em PASSO-3-iniciar-sistema.cmd)${FIM}\n`);
  }
} catch (erro) {
  await cliente.end().catch(() => undefined);
  const mensagem = erro?.message ?? String(erro);

  if (mensagem.includes("password authentication failed")) {
    encerrar(
      "A senha esta incorreta.",
      "Abra https://supabase.com/dashboard/project/_/database/settings",
      `e use o botao Reset database password. Depois rode ${NPM} run db:conectar de novo.`,
    );
  }
  if (mensagem.includes("ENOTFOUND") || mensagem.includes("EAI_AGAIN")) {
    encerrar(
      "O endereco do servidor nao foi encontrado.",
      "A string provavelmente foi colada pela metade. Copie a linha inteira.",
    );
  }
  if (mensagem.includes("ETIMEDOUT") || mensagem.includes("timeout")) {
    encerrar(
      "A conexao demorou demais.",
      "Duas causas comuns:",
      "  - o projeto do Supabase esta pausado (abra o painel e clique em Restore project)",
      "  - voce copiou a Direct connection em vez da Session pooler",
    );
  }
  encerrar("Nao consegui conectar.", mensagem);
}

/* -------------------------------------------------------------------------- */

function gravar(connectionString) {
  const arquivo = path.join(process.cwd(), ".env.local");
  const conteudo = `# Gerado por "${NPM} run db:conectar" em ${new Date().toLocaleString("pt-BR")}
#
# Este arquivo contem a SENHA do banco de dados da empresa.
# Nunca mande por WhatsApp, nunca poste em grupo, nunca suba para o GitHub.
#
# Para trocar de banco, rode de novo: ${NPM} run db:conectar

DATABASE_URL=${connectionString}
`;
  fs.writeFileSync(arquivo, conteudo, "utf8");
}

function encerrar(...linhas) {
  console.error(`\n${VERMELHO}${NEGRITO}${linhas[0]}${FIM}`);
  for (const linha of linhas.slice(1)) console.error(`${VERMELHO}${linha}${FIM}`);
  console.error("");
  process.exit(1);
}
