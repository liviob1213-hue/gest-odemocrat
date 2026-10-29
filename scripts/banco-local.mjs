/**
 * Sobe um PostgreSQL local, em memoria, falando o protocolo de verdade.
 *
 * Uso: npm run db:local
 *
 * Serve para trabalhar sem internet ou para testar o sistema sem tocar no banco
 * do Supabase. O sistema conecta nele apontando a DATABASE_URL para:
 *
 *   postgresql://postgres:postgres@127.0.0.1:5433/postgres
 *
 * Os dados ficam em memoria: ao fechar o processo, tudo some.
 */

import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORTA = Number(process.env.PORTA_BANCO_LOCAL ?? 5433);

const VERDE = "\x1b[32m";
const AMARELO = "\x1b[33m";
const NEGRITO = "\x1b[1m";
const FIM = "\x1b[0m";

const db = await PGlite.create();

for (const arquivo of ["01-estrutura.sql", "02-dados-do-manual.sql"]) {
  const sql = fs.readFileSync(path.join(process.cwd(), "supabase", arquivo), "utf8");
  await db.exec(sql);
  console.log(`${VERDE}ok${FIM} ${arquivo}`);
}

const servidor = new PGLiteSocketServer({ db, port: PORTA, host: "127.0.0.1" });
await servidor.start();

console.log(`
${NEGRITO}Banco local no ar em 127.0.0.1:${PORTA}${FIM}

Para o sistema usar este banco, coloque no .env.local:

  ${NEGRITO}DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:${PORTA}/postgres${FIM}
  ${NEGRITO}DATABASE_SSL=desligado${FIM}

${AMARELO}Os dados somem quando este processo fechar. Para valer, use o Supabase.${FIM}

Ctrl+C para parar.
`);

for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, async () => {
    await servidor.stop();
    await db.close();
    process.exit(0);
  });
}
