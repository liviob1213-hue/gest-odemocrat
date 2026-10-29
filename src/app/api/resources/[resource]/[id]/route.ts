import { NextResponse } from "next/server";

import { traduzirErro } from "@/lib/db";
import { deleteRecord, getRecord, updateRecord } from "@/lib/repository";
import { getResource } from "@/lib/resources";
import { validateRecord } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ resource: string; id: string }> };

async function resolver({ params }: Context) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  const registroId = Number(id);
  return { key, resource, registroId };
}

export async function GET(_request: Request, context: Context) {
  const { key, resource, registroId } = await resolver(context);
  if (!resource) return NextResponse.json({ error: "Recurso desconhecido" }, { status: 404 });

  const row = await getRecord(key, registroId);
  if (!row) return NextResponse.json({ error: "Registro nao encontrado" }, { status: 404 });
  return NextResponse.json({ row });
}

/** PATCH - atualiza apenas as colunas enviadas. */
export async function PATCH(request: Request, context: Context) {
  const { key, resource, registroId } = await resolver(context);
  if (!resource) return NextResponse.json({ error: "Recurso desconhecido" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const resultado = validateRecord(resource, body, true);
  if (!resultado.ok) {
    return NextResponse.json({ error: "Dados invalidos", errors: resultado.errors }, { status: 422 });
  }

  try {
    const row = await updateRecord(key, registroId, resultado.data);
    if (!row) return NextResponse.json({ error: "Registro nao encontrado" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json({ error: traduzirErro(error) }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { key, resource, registroId } = await resolver(context);
  if (!resource) return NextResponse.json({ error: "Recurso desconhecido" }, { status: 404 });

  try {
    const apagado = await deleteRecord(key, registroId);
    if (!apagado) return NextResponse.json({ error: "Registro nao encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        error:
          mensagem.includes("foreign key") || mensagem.includes("violates")
            ? "Nao e possivel excluir: existem registros ligados a este."
            : traduzirErro(error),
      },
      { status: 409 },
    );
  }
}
