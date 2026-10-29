import { NextResponse } from "next/server";

import { all, one, run, transaction } from "@/lib/db";

export const runtime = "nodejs";

const FATOR: Record<string, number> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

/** Mes cheio da competencia, como data de vencimento valida. */
function vencimentoDoMes(competencia: string, dia: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const diaValido = Math.min(Math.max(dia || 10, 1), ultimoDia);
  return `${competencia}-${String(diaValido).padStart(2, "0")}`;
}

/** A competencia cai num mes de cobranca do contrato? */
function cobraNestaCompetencia(
  competencia: string,
  inicio: string | null,
  periodicidade: string,
): boolean {
  if (periodicidade === "unico") return false;
  const passo = FATOR[periodicidade];
  if (!passo) return false;
  if (passo === 1) return true;
  if (!inicio) return true;

  const [anoInicio, mesInicio] = inicio.slice(0, 7).split("-").map(Number);
  const [ano, mes] = competencia.split("-").map(Number);
  const diferenca = (ano - anoInicio) * 12 + (mes - mesInicio);
  return diferenca >= 0 && diferenca % passo === 0;
}

/**
 * POST /api/faturamento
 *
 * acao = "gerar_competencia": cria as cobrancas do mes a partir dos contratos
 *        ativos, sem duplicar o que ja existe (POP-ADM-01).
 * acao = "lancar_pagas": lanca no fluxo de caixa as faturas pagas que ainda
 *        nao tem lancamento de receita.
 * acao = "marcar_vencidas": passa para "vencida" toda fatura aberta com
 *        vencimento no passado.
 */
export async function POST(request: Request) {
  let body: { acao?: string; competencia?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const competencia = body.competencia ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(competencia)) {
    return NextResponse.json({ error: "Competencia invalida (use AAAA-MM)" }, { status: 422 });
  }

  switch (body.acao) {
    case "gerar_competencia":
      return NextResponse.json(await gerarCompetencia(competencia));
    case "lancar_pagas":
      return NextResponse.json(await lancarPagas());
    case "marcar_vencidas":
      return NextResponse.json(await marcarVencidas());
    default:
      return NextResponse.json({ error: "Acao desconhecida" }, { status: 422 });
  }
}

async function gerarCompetencia(competencia: string) {
  const contratos = await all<{
    id: number;
    cliente_id: number;
    unidade_negocio_id: number | null;
    valor: number;
    periodicidade: string;
    dia_vencimento: number | null;
    inicio: string | null;
    fim: string | null;
    meio_pagamento: string | null;
    objeto: string | null;
  }>(
    `SELECT id, cliente_id, unidade_negocio_id, valor, periodicidade, dia_vencimento,
            inicio, fim, meio_pagamento, objeto
       FROM contratos
      WHERE status = 'ativo'`,
  );

  let criadas = 0;
  const ignoradas: string[] = [];

  await transaction(async () => {
    for (const contrato of contratos) {
      if (!cobraNestaCompetencia(competencia, contrato.inicio, contrato.periodicidade)) continue;
      if (contrato.inicio && contrato.inicio.slice(0, 7) > competencia) continue;
      if (contrato.fim && contrato.fim.slice(0, 7) < competencia) continue;

      const jaExiste = await one<{ id: number }>(
        "SELECT id FROM faturas WHERE contrato_id = ? AND competencia = ?",
        [contrato.id, competencia],
      );
      if (jaExiste) {
        ignoradas.push(`Contrato ${contrato.id}: cobranca de ${competencia} ja existe`);
        continue;
      }

      await run(
        `INSERT INTO faturas
           (cliente_id, contrato_id, unidade_negocio_id, competencia, descricao,
            valor, vencimento, status, meio_pagamento)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'aberta', ?)`,
        [
          contrato.cliente_id,
          contrato.id,
          contrato.unidade_negocio_id,
          competencia,
          contrato.objeto ?? `Cobranca ${competencia}`,
          contrato.valor,
          vencimentoDoMes(competencia, contrato.dia_vencimento ?? 10),
          contrato.meio_pagamento,
        ],
      );
      criadas += 1;
    }
  });

  return { criadas, ignoradas, competencia };
}

async function lancarPagas() {
  const faturas = await all<{
    id: number;
    cliente_id: number;
    unidade_negocio_id: number | null;
    competencia: string | null;
    descricao: string | null;
    valor: number;
    valor_pago: number | null;
    pagamento: string | null;
    meio_pagamento: string | null;
  }>(
    `SELECT f.id, f.cliente_id, f.unidade_negocio_id, f.competencia, f.descricao,
            f.valor, f.valor_pago, f.pagamento, f.meio_pagamento
       FROM faturas f
      WHERE f.status = 'paga'
        AND NOT EXISTS (SELECT 1 FROM lancamentos l WHERE l.fatura_id = f.id)`,
  );

  let criados = 0;
  await transaction(async () => {
    for (const fatura of faturas) {
      const data = fatura.pagamento ?? new Date().toISOString().slice(0, 10);
      await run(
        `INSERT INTO lancamentos
           (data, competencia, descricao, tipo, valor, status, conta,
            unidade_negocio_id, cliente_id, fatura_id, meio_pagamento)
         VALUES (?, ?, ?, 'receita', ?, 'realizado', 'operacional', ?, ?, ?, ?)`,
        [
          data,
          fatura.competencia ?? data.slice(0, 7),
          fatura.descricao ?? `Recebimento da fatura #${fatura.id}`,
          fatura.valor_pago && fatura.valor_pago > 0 ? fatura.valor_pago : fatura.valor,
          fatura.unidade_negocio_id,
          fatura.cliente_id,
          fatura.id,
          fatura.meio_pagamento,
        ],
      );
      criados += 1;
    }
  });

  return { criados };
}

async function marcarVencidas() {
  const resultado = await run(
    `UPDATE faturas
        SET status = 'vencida'
      WHERE status = 'aberta' AND vencimento < current_date`,
  );
  return { atualizadas: resultado.changes };
}
