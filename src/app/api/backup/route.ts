import { NextResponse } from "next/server";

import { all } from "@/lib/db";
import { RESOURCES } from "@/lib/resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/backup
 *
 * Exporta o banco inteiro em JSON. Serve como backup legivel e como ponte para
 * planilha/ERP enquanto o processo ainda esta se estabilizando.
 */
export async function GET() {
  const dump: Record<string, unknown[]> = {};

  for (const resource of RESOURCES) {
    dump[resource.table] = await all(`SELECT * FROM ${resource.table}`);
  }
  dump.configuracoes = await all("SELECT * FROM configuracoes");

  const payload = {
    sistema: "DEMOCRAT.IA - Gestao",
    geradoEm: new Date().toISOString(),
    tabelas: dump,
  };

  const nome = `democratia-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
    },
  });
}
