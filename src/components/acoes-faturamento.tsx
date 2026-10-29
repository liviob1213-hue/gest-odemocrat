"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { acaoFaturamento } from "@/lib/api-client";
import { mesBr } from "@/lib/format";

/**
 * Rotinas do POP-ADM-01 e POP-ADM-02 disparadas pela tela:
 * gerar as cobrancas do mes a partir dos contratos ativos, marcar vencidas e
 * lancar no fluxo de caixa o que ja foi pago.
 */
export function AcoesFaturamento({ competencia }: { competencia: string }) {
  const router = useRouter();
  const [rodando, setRodando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function executar(acao: string, rotulo: string) {
    setRodando(acao);
    setMensagem(null);
    try {
      const resposta = await acaoFaturamento(acao, competencia);
      const criadas = Number(resposta.criadas ?? resposta.criados ?? resposta.atualizadas ?? 0);
      setMensagem(
        criadas > 0
          ? `${rotulo}: ${criadas} registro(s).`
          : `${rotulo}: nada a fazer, já estava em ordem.`,
      );
      router.refresh();
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao executar");
    } finally {
      setRodando(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primario"
          disabled={rodando !== null}
          onClick={() => void executar("gerar_competencia", `Cobranças de ${mesBr(competencia)}`)}
        >
          {rodando === "gerar_competencia" ? <Loader2 className="size-4 girando" /> : null}
          Gerar cobranças de {mesBr(competencia)}
        </button>
        <button
          type="button"
          className="btn btn-secundario"
          disabled={rodando !== null}
          onClick={() => void executar("marcar_vencidas", "Faturas vencidas")}
        >
          {rodando === "marcar_vencidas" ? <Loader2 className="size-4 girando" /> : null}
          Marcar vencidas
        </button>
        <button
          type="button"
          className="btn btn-secundario"
          disabled={rodando !== null}
          onClick={() => void executar("lancar_pagas", "Lançamentos de receita")}
        >
          {rodando === "lancar_pagas" ? <Loader2 className="size-4 girando" /> : null}
          Lançar pagas no caixa
        </button>
      </div>
      {mensagem ? (
        <span className="text-xs text-[var(--texto-suave)]">{mensagem}</span>
      ) : null}
    </div>
  );
}
