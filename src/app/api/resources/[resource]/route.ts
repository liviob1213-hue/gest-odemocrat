import { NextResponse } from "next/server";

import { traduzirErro } from "@/lib/db";
import { createRecord, listRecords, refOptions } from "@/lib/repository";
import { getResource, refFields } from "@/lib/resources";
import { validateRecord } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ resource: string }> };

/**
 * GET /api/resources/:resource
 *
 * Parametros aceitos:
 *   search     busca livre nos campos declarados em searchFields
 *   orderBy    "coluna" ou "coluna desc"
 *   limit, offset
 *   withOptions=1  devolve tambem as opcoes de cada relacionamento
 *   qualquer outro parametro e tratado como filtro exato por coluna
 */
export async function GET(request: Request, { params }: Context) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) {
    return NextResponse.json({ error: `Recurso desconhecido: ${key}` }, { status: 404 });
  }

  const url = new URL(request.url);
  const reservados = new Set(["search", "orderBy", "limit", "offset", "withOptions"]);
  const filters: Record<string, string> = {};
  for (const [chave, valor] of url.searchParams.entries()) {
    if (!reservados.has(chave)) filters[chave] = valor;
  }

  try {
    const { rows, total } = await listRecords(key, {
      search: url.searchParams.get("search") ?? undefined,
      orderBy: url.searchParams.get("orderBy") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 500),
      offset: Number(url.searchParams.get("offset") ?? 0),
      filters,
    });

    const payload: Record<string, unknown> = { rows, total };

    if (url.searchParams.get("withOptions") === "1") {
      const options: Record<string, { value: number; label: string }[]> = {};
      for (const field of refFields(resource)) {
        options[field.name] = await refOptions(field.ref!);
      }
      payload.options = options;
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: traduzirErro(error) }, { status: 400 });
  }
}

/** POST /api/resources/:resource - cria um registro. */
export async function POST(request: Request, { params }: Context) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) {
    return NextResponse.json({ error: `Recurso desconhecido: ${key}` }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const resultado = validateRecord(resource, body, false);
  if (!resultado.ok) {
    return NextResponse.json({ error: "Dados invalidos", errors: resultado.errors }, { status: 422 });
  }

  try {
    const row = await createRecord(key, resultado.data);
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: traduzirErro(error) }, { status: 400 });
  }
}
