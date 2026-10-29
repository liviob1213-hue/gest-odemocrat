import { NextResponse } from "next/server";

import { gerarOnboarding, RAMOS, type Ramo } from "@/lib/onboarding";

export const runtime = "nodejs";

/**
 * POST /api/onboarding
 * body: { clienteId: number, ramos: Ramo[] }
 *
 * Cria o checklist do fluxo do cliente (cap. 09) para o cliente informado.
 */
export async function POST(request: Request) {
  let body: { clienteId?: number; ramos?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const clienteId = Number(body.clienteId);
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    return NextResponse.json({ error: "clienteId invalido" }, { status: 422 });
  }

  const ramos = (body.ramos ?? ["trilho"]).filter((ramo): ramo is Ramo =>
    (RAMOS as readonly string[]).includes(ramo),
  );
  if (ramos.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um ramo" }, { status: 422 });
  }

  const criados = await gerarOnboarding(clienteId, ramos);
  return NextResponse.json({ criados });
}
