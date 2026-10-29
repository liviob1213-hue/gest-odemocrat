"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, TriangleAlert } from "lucide-react";

import { atualizar, listar, type Registro } from "@/lib/api-client";
import { brl, dataBr, diasAte, pct } from "@/lib/format";
import { requireResource } from "@/lib/resources";
import { Badge, Card, Nota, PageHeader, Stat } from "@/components/ui";
import { RecordForm } from "@/components/record-form";

/**
 * Funil de vendas em quadro (kanban).
 *
 * Arrastar o cartao entre colunas muda a etapa da negociacao. O desconto acima
 * de 15% aparece destacado porque, pela alcada, passa a depender da Quarta
 * Oficial e nao mais do Diretor Comercial.
 */

const COLUNAS = [
  { etapa: "prospeccao", rotulo: "Prospecção", cor: "var(--neutro)" },
  { etapa: "qualificacao", rotulo: "Qualificação", cor: "var(--info)" },
  { etapa: "proposta", rotulo: "Proposta", cor: "var(--color-marca-500)" },
  { etapa: "negociacao", rotulo: "Negociação", cor: "var(--atencao)" },
  { etapa: "fechada_ganha", rotulo: "Fechada — ganha", cor: "var(--positivo)" },
  { etapa: "fechada_perdida", rotulo: "Fechada — perdida", cor: "var(--negativo)" },
] as const;

const LIMITE_DESCONTO_COMERCIAL = 15;

export function PipelineBoard() {
  const resource = useMemo(() => requireResource("negociacoes"), []);
  const [linhas, setLinhas] = useState<Registro[]>([]);
  const [opcoes, setOpcoes] = useState<Record<string, { value: number; label: string }[]>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [emEdicao, setEmEdicao] = useState<Registro | null>(null);
  const [formAberto, setFormAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await listar("negociacoes", { withOptions: 1, limit: 1000 });
      setLinhas(resposta.rows);
      if (resposta.options) setOpcoes(resposta.options);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function mover(id: number, etapa: string) {
    const anterior = linhas;
    // Atualizacao otimista: a coluna muda na hora e volta atras se a API falhar.
    setLinhas((atual) =>
      atual.map((linha) => (Number(linha.id) === id ? { ...linha, etapa } : linha)),
    );
    try {
      const payload: Registro = { etapa };
      if (etapa === "fechada_ganha" || etapa === "fechada_perdida") {
        payload.data_fechamento = new Date().toISOString().slice(0, 10);
        payload.probabilidade = etapa === "fechada_ganha" ? 100 : 0;
      }
      await atualizar("negociacoes", id, payload);
      await carregar();
    } catch (falha) {
      setLinhas(anterior);
      setErro(falha instanceof Error ? falha.message : "Erro ao mover");
    }
  }

  const abertas = linhas.filter((linha) =>
    ["prospeccao", "qualificacao", "proposta", "negociacao"].includes(String(linha.etapa)),
  );
  const totalPonderado = abertas.reduce(
    (total, linha) => total + Number(linha.valor ?? 0) * (Number(linha.probabilidade ?? 0) / 100),
    0,
  );
  const totalAberto = abertas.reduce((total, linha) => total + Number(linha.valor ?? 0), 0);
  const ganhas = linhas.filter((linha) => linha.etapa === "fechada_ganha");
  const descontosAcimaDaAlcada = linhas.filter(
    (linha) =>
      Number(linha.desconto_pct ?? 0) > LIMITE_DESCONTO_COMERCIAL &&
      !String(linha.desconto_aprovado_por ?? "").trim(),
  );

  return (
    <>
      <PageHeader
        capitulo="Bloco 2 da Quarta Oficial · Comercial e growth"
        titulo="Pipeline de vendas"
        descricao="Arraste o cartão para mudar a etapa. O pipeline ponderado precisa ficar acima de 3x a meta do mês; abaixo disso é sinal de alerta."
        acoes={
          <>
            <button type="button" className="btn btn-secundario" onClick={() => void carregar()}>
              <RefreshCw className={`size-4 ${carregando ? "girando" : ""}`} />
              Atualizar
            </button>
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => {
                setEmEdicao(null);
                setFormAberto(true);
              }}
            >
              <Plus className="size-4" /> Nova negociação
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pipeline aberto" value={brl(totalAberto)} hint={`${abertas.length} negociação(ões)`} />
        <Stat label="Pipeline ponderado" value={brl(totalPonderado)} hint="Valor × probabilidade" />
        <Stat
          label="Fechadas — ganhas"
          value={brl(ganhas.reduce((total, linha) => total + Number(linha.valor ?? 0), 0))}
          hint={`${ganhas.length} venda(s)`}
          tone="success"
        />
        <Stat
          label="Descontos fora da alçada"
          value={String(descontosAcimaDaAlcada.length)}
          tone={descontosAcimaDaAlcada.length > 0 ? "danger" : undefined}
          hint="Acima de 15% precisa de ata da Quarta Oficial"
        />
      </div>

      {descontosAcimaDaAlcada.length > 0 ? (
        <div className="mb-4">
          <Nota tone="warning">
            <span className="flex items-start gap-2">
              <TriangleAlert className="mt-px size-4 shrink-0" />
              <span>
                {descontosAcimaDaAlcada.length} negociação(ões) com desconto acima de 15% e sem
                aprovação registrada: {descontosAcimaDaAlcada.map((linha) => String(linha.titulo)).join(", ")}.
                Pela alçada, o Diretor Comercial aprova até 15%; acima disso a decisão é da Quarta
                Oficial e precisa constar em ata.
              </span>
            </span>
          </Nota>
        </div>
      ) : null}

      {erro ? (
        <div className="mb-4">
          <Nota tone="danger">{erro}</Nota>
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLUNAS.map((coluna) => {
          const cartoes = linhas.filter((linha) => String(linha.etapa) === coluna.etapa);
          const soma = cartoes.reduce((total, linha) => total + Number(linha.valor ?? 0), 0);

          return (
            <div
              key={coluna.etapa}
              onDragOver={(evento) => {
                evento.preventDefault();
                setAlvo(coluna.etapa);
              }}
              onDragLeave={() => setAlvo((atual) => (atual === coluna.etapa ? null : atual))}
              onDrop={(evento) => {
                evento.preventDefault();
                setAlvo(null);
                if (arrastando !== null) void mover(arrastando, coluna.etapa);
                setArrastando(null);
              }}
              className="flex w-[270px] shrink-0 flex-col rounded-xl border bg-[var(--superficie-2)] transition-colors"
              style={{
                borderColor: alvo === coluna.etapa ? coluna.cor : undefined,
                background: alvo === coluna.etapa ? "var(--superficie)" : undefined,
              }}
            >
              <header className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: coluna.cor }} />
                  <span className="text-xs font-semibold">{coluna.rotulo}</span>
                  <span className="text-xs text-[var(--texto-fraco)]">{cartoes.length}</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-[var(--texto-suave)]">
                  {brl(soma)}
                </span>
              </header>

              <div className="flex-1 space-y-2 p-2">
                {cartoes.map((linha) => {
                  const dias = diasAte(linha.previsao_fechamento as string | null);
                  const desconto = Number(linha.desconto_pct ?? 0);

                  return (
                    <article
                      key={String(linha.id)}
                      draggable
                      onDragStart={() => setArrastando(Number(linha.id))}
                      onDragEnd={() => setArrastando(null)}
                      className="group cursor-grab rounded-lg border bg-[var(--superficie)] p-2.5 shadow-[var(--sombra)] active:cursor-grabbing"
                      style={{ opacity: arrastando === Number(linha.id) ? 0.4 : 1 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[0.8125rem] font-semibold leading-snug">
                          {String(linha.titulo)}
                        </p>
                        <button
                          type="button"
                          className="btn btn-fantasma btn-sm opacity-0 transition-opacity group-hover:opacity-100"
                          title="Editar"
                          onClick={() => {
                            setEmEdicao(linha);
                            setFormAberto(true);
                          }}
                        >
                          <Pencil className="size-3" />
                        </button>
                      </div>

                      <p className="mt-0.5 truncate text-xs text-[var(--texto-suave)]">
                        {String(linha.cliente_id__label ?? linha.lead_nome ?? "Lead sem nome")}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {brl(Number(linha.valor ?? 0))}
                        </span>
                        <span className="text-xs tabular-nums text-[var(--texto-fraco)]">
                          {pct(Number(linha.probabilidade ?? 0), 0)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {linha.unidade_negocio_id__label ? (
                          <Badge tone="accent">{String(linha.unidade_negocio_id__label)}</Badge>
                        ) : null}
                        {desconto > 0 ? (
                          <Badge tone={desconto > LIMITE_DESCONTO_COMERCIAL ? "danger" : "neutral"}>
                            −{pct(desconto, 0)}
                          </Badge>
                        ) : null}
                        {dias !== null && !String(linha.etapa).startsWith("fechada") ? (
                          <Badge tone={dias < 0 ? "danger" : dias <= 7 ? "warning" : "neutral"}>
                            {dias < 0 ? `${Math.abs(dias)}d atrasada` : `${dias}d`}
                          </Badge>
                        ) : null}
                      </div>

                      {linha.proximo_passo ? (
                        <p className="mt-2 border-t pt-1.5 text-[0.6875rem] leading-snug text-[var(--texto-suave)]">
                          <span className="font-semibold">Próximo passo:</span>{" "}
                          {String(linha.proximo_passo)}
                        </p>
                      ) : null}

                      {linha.previsao_fechamento ? (
                        <p className="mt-1 text-[0.625rem] text-[var(--texto-fraco)]">
                          Previsão: {dataBr(linha.previsao_fechamento as string)}
                        </p>
                      ) : null}
                    </article>
                  );
                })}

                {cartoes.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-[var(--texto-fraco)]">
                    Arraste cartões para cá
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {carregando && linhas.length === 0 ? (
        <Card className="mt-4">
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--texto-suave)]">
            <Loader2 className="size-4 girando" /> Carregando pipeline...
          </p>
        </Card>
      ) : null}

      {formAberto ? (
        <RecordForm
          resource={resource}
          registro={emEdicao}
          opcoes={opcoes}
          onFechar={() => {
            setFormAberto(false);
            setEmEdicao(null);
          }}
          onSalvo={() => {
            setFormAberto(false);
            setEmEdicao(null);
            void carregar();
          }}
        />
      ) : null}
    </>
  );
}
