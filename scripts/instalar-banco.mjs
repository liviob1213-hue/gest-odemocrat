/**
 * Cria a estrutura do banco no Supabase e carrega os dados do manual.
 *
 * Uso: npm run db:instalar
 *
 * Roda os dois arquivos da pasta supabase/ na ordem. Pode ser rodado mais de
 * uma vez: nada e duplicado nem apagado.
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

import { AMARELO, AZUL, FIM, NEGRITO, NPM, VERDE, VERMELHO, lerEnvLocal, ocultarSenha } from "./lib-env.mjs";

const url = lerEnvLocal();
/** Um banco local (npm run db:local) nao fala TLS. */
const ehLocal = (u) => /@(127\.0\.0\.1|localhost|\[::1\])[:/]/.test(u);

const ARQUIVOS = [
  { nome: "01-estrutura.sql", descricao: "criando as tabelas" },
  { nome: "02-dados-do-manual.sql", descricao: "carregando os dados do manual" },
];

console.log(`
${NEGRITO}DEMOCRAT.IA - instalacao do banco${FIM}
Servidor: ${AZUL}${ocultarSenha(url)}${FIM}
`);

const cliente = new pg.Client({
  connectionString: url,
  ssl: ehLocal(url) ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

try {
  process.stdout.write("Conectando no Supabase... ");
  await cliente.connect();
  console.log(`${VERDE}ok${FIM}`);
} catch (erro) {
  console.log(`${VERMELHO}falhou${FIM}`);
  console.error(`\n${VERMELHO}${explicar(erro)}${FIM}\n`);
  process.exit(1);
}

try {
  for (const arquivo of ARQUIVOS) {
    const caminho = path.join(process.cwd(), "supabase", arquivo.nome);
    if (!fs.existsSync(caminho)) {
      console.error(`${VERMELHO}Arquivo nao encontrado: supabase/${arquivo.nome}${FIM}`);
      process.exit(1);
    }

    process.stdout.write(`${arquivo.nome} - ${arquivo.descricao}... `);
    const sql = fs.readFileSync(caminho, "utf8");
    // O driver aceita varios comandos numa chamada so quando nao ha parametros,
    // e e o servidor que separa os comandos - inclusive os blocos DO $$ ... $$.
    await cliente.query(sql);
    console.log(`${VERDE}ok${FIM}`);
  }

  const { rows } = await cliente.query(`
    SELECT
      (SELECT COUNT(*) FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r') AS tabelas,
      (SELECT COUNT(*) FROM pops) AS pops,
      (SELECT COUNT(*) FROM indicadores) AS indicadores,
      (SELECT COUNT(*) FROM glossario) AS glossario,
      (SELECT COUNT(*) FROM pendencias) AS pendencias,
      (SELECT COUNT(*) FROM clientes) AS clientes
  `);
  const r = rows[0];

  console.log(`
${VERDE}${NEGRITO}Banco pronto.${FIM}

  Tabelas criadas ......... ${r.tabelas}
  POPs do manual .......... ${r.pops}
  Indicadores ............. ${r.indicadores}
  Termos do glossario ..... ${r.glossario}
  Pendencias juridicas .... ${r.pendencias}
  Clientes cadastrados .... ${r.clientes}

Proximo passo: ${NEGRITO}${NPM} run dev (ou duplo clique em PASSO-3-iniciar-sistema.cmd)${FIM} e abra http://localhost:3000
`);
} catch (erro) {
  console.log(`${VERMELHO}falhou${FIM}`);
  console.error(`\n${VERMELHO}${explicar(erro)}${FIM}\n`);
  process.exitCode = 1;
} finally {
  await cliente.end();
}

function explicar(erro) {
  const mensagem = erro?.message ?? String(erro);

  if (mensagem.includes("ENOTFOUND") || mensagem.includes("EAI_AGAIN")) {
    return [
      "Nao foi possivel encontrar o servidor do Supabase.",
      "",
      "Confira se o endereco da DATABASE_URL foi copiado inteiro, sem quebrar a linha,",
      "e se a internet esta funcionando.",
    ].join("\n");
  }
  if (mensagem.includes("password authentication failed")) {
    return [
      "A senha do banco esta incorreta.",
      "",
      "No painel do Supabase: Project Settings > Database > Reset database password.",
      "Depois cole a senha nova na DATABASE_URL, no lugar de [YOUR-PASSWORD].",
    ].join("\n");
  }
  if (mensagem.includes("SASL") || mensagem.includes("SCRAM")) {
    return [
      "A senha da DATABASE_URL parece vazia ou com caracteres especiais sem codificacao.",
      "",
      `Se a sua senha tem ${AMARELO}@ : / ? # [ ]${FIM}${VERMELHO}, troque a senha por uma so com letras e numeros`,
      "em Project Settings > Database > Reset database password.",
    ].join("\n");
  }
  if (mensagem.includes("ETIMEDOUT") || mensagem.includes("timeout")) {
    return [
      "A conexao demorou demais e foi cancelada.",
      "",
      "Verifique se o projeto do Supabase nao esta pausado (projetos gratuitos pausam",
      "depois de alguns dias sem uso) e se voce copiou a string do Session pooler.",
    ].join("\n");
  }
  return mensagem;
}
