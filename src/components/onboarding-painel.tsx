"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { atualizar, gerarOnboarding } from "@/lib/api-client";
import { dataBr, hojeIso } from "@/lib/format";
import { Badge } from "@/components/ui";

/**
 * Checklist do fluxo do cliente (cap. 09), marcavel direto na ficha.
 */

type Item = Record<string, unknown>;

const ROTULO_RAMO: Record<string, string> = {
  trilho: "Trilho administrativo",
  software: "Software (CRM)",
  educacao: "Workshop ou curso",
  estrategia: "Estratégia e marketing",
};

const TOM_RAMO: Record<string, "accent" | "info" | "success" | "warning"> = {
  trilho: "accent",
  software: "info",
  educacao: "success",
  estrategia: "warning",
};

export function OnboardingPainel({ itens }: { itens: Item[] }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState<number | null>(null);

  async function alternar(item: Item) {
    const id = Number(item.id);
    const concluido = Number(item.concluido) === 1;
    setSalvando(id);
    try {
      await atualizar("onboarding_itens", id, {
        concluido: !concluido,
        concluido_em: concluido ? null : hojeIso(),
      });
      router.refresh();
    } catch (erro) {
      window.alert(erro instanceof Error ? erro.message : "Erro ao atualizar");
    } finally {
      setSalvando(null);
    }
  }

  const porRamo = itens.reduce<Record<string, Item[]>>((acumulado, item) => {
    const ramo = String(item.ramo);
    acumulado[ramo] = [...(acumulado[ramo] ?? []), item];
    return acumulado;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(porRamo).map(([ramo, lista]) => (
        <div key={ramo}>
          <div className="mb-1.5 flex items-center gap-2">
            <Badge tone={TOM_RAMO[ramo] ?? "neutral"}>{ROTULO_RAMO[ramo] ?? ramo}</Badge>
            <span className="text-xs text-[var(--texto-fraco)]">
              {lista.filter((item) => Number(item.concluido) === 1).length}/{lista.length}
            </span>
          </div>
          <ul className="space-y-1">
            {lista.map((item) => {
              const concluido = Number(item.concluido) === 1;
              return (
                <li key={String(item.id)}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 hover:bg-[var(--superficie-2)]">
                    {salvando === Number(item.id) ? (
                      <Loader2 className="mt-0.5 size-4 girando text-[var(--texto-fraco)]" />
                    ) : (
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-[var(--color-marca-600)]"
                        checked={concluido}
                        onChange={() => void alternar(item)}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-sm leading-snug"
                        style={{
                          textDecoration: concluido ? "line-through" : undefined,
                          color: concluido ? "var(--texto-fraco)" : undefined,
                        }}
                      >
                        {String(item.item)}
                      </span>
                      {item.prazo || item.concluido_em ? (
                        <span className="block text-[0.6875rem] text-[var(--texto-fraco)]">
                          {item.concluido_em
                            ? `Concluído em ${dataBr(item.concluido_em as string)}`
                            : `Prazo ${dataBr(item.prazo as string)}`}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function OnboardingGerador({
  clienteId,
  ramos,
}: {
  clienteId: number;
  ramos: { chave: string; rotulo: string }[];
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<string[]>(["trilho"]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [enviando, setEnviando] = useState(false);

  async function gerar() {
    if (selecionados.length === 0) return;
    setEnviando(true);
    setMensagem(null);
    try {
      const resposta = await gerarOnboarding(clienteId, selecionados);
      setMensagem(
        resposta.criados > 0
          ? `${resposta.criados} item(ns) adicionado(s) ao checklist.`
          : "Nenhum item novo: o checklist já estava completo para os ramos escolhidos.",
      );
      iniciar(() => router.refresh());
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao gerar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {ramos.map((ramo) => (
          <label key={ramo.chave} className="flex cursor-pointer items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              className="size-3.5 accent-[var(--color-marca-600)]"
              checked={selecionados.includes(ramo.chave)}
              onChange={(evento) =>
                setSelecionados((atual) =>
                  evento.target.checked
                    ? [...atual, ramo.chave]
                    : atual.filter((item) => item !== ramo.chave),
                )
              }
            />
            {ramo.rotulo}
          </label>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          className="btn btn-secundario btn-sm"
          onClick={() => void gerar()}
          disabled={enviando || pendente || selecionados.length === 0}
        >
          {enviando || pendente ? <Loader2 className="size-3.5 girando" /> : null}
          Gerar checklist
        </button>
        {mensagem ? <span className="text-xs text-[var(--texto-suave)]">{mensagem}</span> : null}
      </div>
    </div>
  );
}
