"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardTitle, Nota } from "@/components/ui";

/**
 * Carga de exemplo e zeramento do movimento.
 *
 * O "limpar" apaga apenas dados operacionais; POPs, RACI, indicadores,
 * clausulas, pendencias e glossario (o conteudo do manual) ficam intactos.
 */
export function AcoesDemo() {
  const router = useRouter();
  const [rodando, setRodando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function executar(acao: "carregar" | "limpar") {
    if (
      acao === "limpar" &&
      !window.confirm(
        "Apagar TODO o movimento (clientes, contratos, cobranças, lançamentos, pipeline, atas e decisões)? Os dados do manual — POPs, RACI, indicadores, cláusulas, pendências e glossário — são preservados.",
      )
    ) {
      return;
    }
    if (
      acao === "carregar" &&
      !window.confirm(
        "Carregar os dados de exemplo substitui todo o movimento existente. Continuar?",
      )
    ) {
      return;
    }

    setRodando(acao);
    setMensagem(null);
    try {
      const resposta = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      const corpo = (await resposta.json()) as Record<string, unknown>;
      if (!resposta.ok) throw new Error(String(corpo.error ?? "Erro"));
      setMensagem(
        acao === "carregar"
          ? `Dados de exemplo carregados: ${corpo.clientes} clientes e ${corpo.lancamentos} lançamentos.`
          : `Movimento zerado: ${corpo.apagados} registro(s) apagado(s).`,
      );
      router.refresh();
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao executar");
    } finally {
      setRodando(null);
    }
  }

  return (
    <Card>
      <CardTitle
        title="Dados de exemplo"
        subtitle="Para conhecer o sistema antes de ter número real, ou para zerar tudo e começar com os dados da empresa"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-secundario"
          disabled={rodando !== null}
          onClick={() => void executar("carregar")}
        >
          {rodando === "carregar" ? <Loader2 className="size-4 girando" /> : null}
          Carregar dados de exemplo
        </button>
        <button
          type="button"
          className="btn btn-perigo"
          disabled={rodando !== null}
          onClick={() => void executar("limpar")}
        >
          {rodando === "limpar" ? <Loader2 className="size-4 girando" /> : null}
          Zerar todo o movimento
        </button>
        {mensagem ? <span className="text-xs text-[var(--texto-suave)]">{mensagem}</span> : null}
      </div>

      <div className="mt-3">
        <Nota tone="warning">
          Antes de zerar, baixe um backup pelo link na barra lateral. O movimento apagado não volta.
        </Nota>
      </div>
    </Card>
  );
}
