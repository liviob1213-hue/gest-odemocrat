import { NextResponse } from "next/server";

import { all, run } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await all<{ chave: string; valor: string | null; descricao: string | null }>(
    "SELECT chave, valor, descricao FROM configuracoes ORDER BY chave",
  );
  return NextResponse.json({ rows });
}

/**
 * PATCH /api/configuracoes
 * body: { "custo_fixo_mensal": "12000", ... }
 *
 * Atualiza apenas chaves que ja existem - a lista de parametros e fechada.
 */
export async function PATCH(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const chaves = await all<{ chave: string }>("SELECT chave FROM configuracoes");
  const existentes = new Set(chaves.map((row) => row.chave));

  const desconhecidas = Object.keys(body).filter((chave) => !existentes.has(chave));
  if (desconhecidas.length > 0) {
    return NextResponse.json(
      { error: `Parametro desconhecido: ${desconhecidas.join(", ")}` },
      { status: 422 },
    );
  }

  for (const [chave, valor] of Object.entries(body)) {
    await run(
      "UPDATE configuracoes SET valor = ?, atualizado_em = now() WHERE chave = ?",
      [String(valor ?? ""), chave],
    );
  }

  return NextResponse.json({ ok: true, atualizadas: Object.keys(body).length });
}
