import { NextResponse } from "next/server";

import { carregarDemo, limparMovimento } from "@/lib/demo";

export const runtime = "nodejs";

/**
 * POST /api/demo
 *
 * acao = "carregar": preenche o sistema com um mes tipico de operacao.
 * acao = "limpar":   apaga TODO o movimento (clientes, financeiro, governanca),
 *                    preservando os dados de referencia do manual.
 */
export async function POST(request: Request) {
  let body: { acao?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  if (body.acao === "limpar") {
    const apagados = await limparMovimento();
    const total = Object.values(apagados).reduce((soma, valor) => soma + valor, 0);
    return NextResponse.json({ ok: true, apagados: total });
  }

  if (body.acao === "carregar") {
    const limpeza = await limparMovimento();
    const resultado = await carregarDemo();
    return NextResponse.json({
      ok: true,
      substituidos: Object.values(limpeza).reduce((soma, valor) => soma + valor, 0),
      ...resultado,
    });
  }

  return NextResponse.json({ error: "Acao desconhecida" }, { status: 422 });
}
