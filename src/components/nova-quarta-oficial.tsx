"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { criar } from "@/lib/api-client";
import { hojeIso } from "@/lib/format";

/**
 * Cria a ata da quarta ja com os numeros da semana preenchidos pelo sistema,
 * para que o bloco 1 nao dependa de alguem copiar valores a mao.
 */
export function NovaQuartaOficial({
  numeros,
}: {
  numeros: {
    caixa: number;
    reserva_meses: number;
    mrr: number;
    vendas_fechadas: number;
    inadimplencia_pct: number;
    proximo_evento: string;
  };
}) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function abrirAta() {
    setCriando(true);
    setErro(null);
    try {
      await criar("reunioes", {
        tipo: "quarta_oficial",
        data: hojeIso(),
        status: "agendada",
        pauta_enviada: false,
        presentes: "",
        caixa: numeros.caixa,
        reserva_meses: Number(numeros.reserva_meses.toFixed(2)),
        mrr: numeros.mrr,
        vendas_fechadas: numeros.vendas_fechadas,
        inadimplencia_pct: Number(numeros.inadimplencia_pct.toFixed(2)),
        proximo_evento: numeros.proximo_evento || null,
        bloco0_abertura: null,
        bloco1_admin: null,
        bloco2_comercial: null,
        bloco3_produto: null,
        bloco4_gargalos: null,
        para_proxima: null,
      });
      router.refresh();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao criar a ata");
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className="btn btn-primario" onClick={() => void abrirAta()} disabled={criando}>
        {criando ? <Loader2 className="size-4 girando" /> : <Plus className="size-4" />}
        Abrir ata de hoje com os números
      </button>
      {erro ? <span className="text-xs text-[var(--negativo)]">{erro}</span> : null}
    </div>
  );
}
