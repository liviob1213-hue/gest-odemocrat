/**
 * Testa a conexao com o Supabase e diz, em portugues, o que esta faltando.
 *
 * Uso: npm run db:testar
 */

import pg from "pg";

import { AZUL, FIM, NEGRITO, NPM, VERDE, VERMELHO, AMARELO, lerEnvLocal, ocultarSenha } from "./lib-env.mjs";

const url = lerEnvLocal();
/** Um banco local (npm run db:local) nao fala TLS. */
const ehLocal = (u) => /@(127\.0\.0\.1|localhost|\[::1\])[:/]/.test(u);

console.log(`
${NEGRITO}Teste de conexao com o Supabase${FIM}
Servidor: ${AZUL}${ocultarSenha(url)}${FIM}
`);

const cliente = new pg.Client({
  connectionString: url,
  ssl: ehLocal(url) ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
});

try {
  process.stdout.write("1. Conectando............ ");
  await cliente.connect();
  console.log(`${VERDE}ok${FIM}`);

  process.stdout.write("2. Lendo o banco......... ");
  const { rows } = await cliente.query(`
    SELECT COUNT(*) AS tabelas
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
  `);
  const tabelas = Number(rows[0].tabelas);
  console.log(`${VERDE}ok${FIM} (${tabelas} tabelas)`);

  if (tabelas === 0) {
    console.log(`
${AMARELO}${NEGRITO}A conexao funciona, mas o banco ainda esta vazio.${FIM}

Rode agora: ${NEGRITO}${NPM} run db:instalar (ou duplo clique em PASSO-2-criar-tabelas.cmd)${FIM}
`);
    process.exit(0);
  }

  process.stdout.write("3. Dados do manual....... ");
  const dados = await cliente.query(`
    SELECT
      (SELECT COUNT(*) FROM pops) AS pops,
      (SELECT COUNT(*) FROM indicadores) AS indicadores,
      (SELECT COUNT(*) FROM glossario) AS glossario,
      (SELECT COUNT(*) FROM clientes) AS clientes,
      (SELECT COUNT(*) FROM lancamentos) AS lancamentos
  `);
  const d = dados.rows[0];

  if (Number(d.pops) === 0) {
    console.log(`${AMARELO}faltando${FIM}`);
    console.log(`
Rode ${NEGRITO}${NPM} run db:instalar (ou duplo clique em PASSO-2-criar-tabelas.cmd)${FIM} para carregar os dados do manual.
`);
    process.exit(0);
  }

  console.log(`${VERDE}ok${FIM}`);
  console.log(`
${VERDE}${NEGRITO}Tudo certo.${FIM}

  POPs .................... ${d.pops}
  Indicadores ............. ${d.indicadores}
  Termos do glossario ..... ${d.glossario}
  Clientes ................ ${d.clientes}
  Lancamentos ............. ${d.lancamentos}

Pode rodar ${NEGRITO}${NPM} run dev (ou duplo clique em PASSO-3-iniciar-sistema.cmd)${FIM}.
`);
} catch (erro) {
  console.log(`${VERMELHO}falhou${FIM}`);
  console.error(`\n${VERMELHO}${erro?.message ?? erro}${FIM}\n`);
  process.exitCode = 1;
} finally {
  await cliente.end().catch(() => undefined);
}
