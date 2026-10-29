import Link from "next/link";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { painel } from "@/lib/analytics";
import { brl, dataBr, mesBr, num, pct } from "@/lib/format";
import {
  GraficoDre,
  GraficoPipeline,
  GraficoProjecaoCaixa,
  GraficoResultadoMensal,
} from "@/components/charts";
import { Badge, Card, CardTitle, EmptyState, Nota, PageHeader, Progresso, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

const ROTULO_ETAPA: Record<string, string> = {
  prospeccao: "Prospecção",
  qualificacao: "Qualificação",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechada_ganha: "Ganha",
  fechada_perdida: "Perdida",
};

const ROTULO_CONTA: Record<string, string> = {
  operacional: "Operacional",
  reinvestimento: "Reinvestimento",
  impostos: "Impostos",
};

const ROTULO_DIRETORIA: Record<string, string> = {
  Administrativo: "Admin e financeiro",
  Comercial: "Comercial e growth",
  Desenvolvimento: "Desenvolvimento e operações",
  Conselho: "Conselho de sócios",
};

function formatarIndicador(valor: number | null, unidade: string): string {
  if (valor === null) return "—";
  switch (unidade) {
    case "moeda":
      return brl(valor);
    case "percentual":
      return pct(valor);
    case "meses":
      return `${num(valor, 1)} meses`;
    default:
      return num(valor, 1);
  }
}

export default async function PainelPage() {
  const dados = await painel();
  const etapasAbertas = ["prospeccao", "qualificacao", "proposta", "negociacao"];

  const pipelinePorEtapa = etapasAbertas.map((etapa) => {
    const linha = dados.pipelinePorEtapa.find((item) => item.etapa === etapa);
    return {
      etapa,
      rotulo: ROTULO_ETAPA[etapa],
      ponderado: linha?.ponderado ?? 0,
      total: linha?.total ?? 0,
    };
  });

  const metaPipeline = dados.metaVendasMes * 3;
  const reservaTone =
    dados.reservaMeses === null
      ? "neutral"
      : dados.reservaMeses < dados.reservaAlertaMeses
        ? "danger"
        : dados.reservaMeses < dados.reservaMetaMeses
          ? "warning"
          : "success";

  const indicadoresPorDiretoria = ["Administrativo", "Comercial", "Desenvolvimento"].map(
    (diretoria) => ({
      diretoria,
      itens: dados.indicadores.filter((indicador) => indicador.diretoria === diretoria),
    }),
  );

  return (
    <>
      <PageHeader
        capitulo="Painel de indicadores · visível para os 3 sócios o tempo todo"
        titulo="Painel da DEMOCRAT.IA"
        descricao={`Competência ${mesBr(dados.competencia)}. Caixa, margem e pipeline em número aberto, como manda o pilar "o time é a força".`}
        acoes={
          <Link href="/governanca/quarta-oficial" className="btn btn-primario">
            Preparar a Quarta Oficial
          </Link>
        }
      />

      {/* ----------------------------- Alertas ----------------------------- */}
      {dados.alertas.length > 0 ? (
        <Card className="mb-5" padding={false}>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TriangleAlert className="size-4 text-[var(--atencao)]" />
              Sinais de alerta ({dados.alertas.length})
            </h2>
            <span className="text-xs text-[var(--texto-suave)]">
              Bloco 4 da Quarta Oficial: gargalos e decisões
            </span>
          </div>
          <ul className="divide-y">
            {dados.alertas.slice(0, 12).map((alerta, indice) => (
              <li key={`${alerta.titulo}-${indice}`}>
                <Link
                  href={alerta.href}
                  className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--superficie-2)]"
                >
                  <span className="mt-0.5">
                    {alerta.nivel === "critico" ? (
                      <CircleAlert className="size-4 text-[var(--negativo)]" />
                    ) : alerta.nivel === "atencao" ? (
                      <TriangleAlert className="size-4 text-[var(--atencao)]" />
                    ) : (
                      <Info className="size-4 text-[var(--info)]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{alerta.titulo}</span>
                    <span className="block text-xs text-[var(--texto-suave)]">{alerta.detalhe}</span>
                  </span>
                  <Badge tone="neutral">{alerta.modulo}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Nota tone="success">
          <span className="flex items-center gap-2">
            <CircleCheck className="size-4" />
            Nenhum sinal de alerta ativo. Comece cadastrando contratos, lançamentos e o pipeline para
            que os 12 indicadores do capítulo 11 passem a ser calculados.
          </span>
        </Nota>
      )}

      {/* ------------------------------- KPIs ------------------------------ */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Stat
          label="Caixa"
          value={brl(dados.caixa)}
          hint={`Custo fixo ${dados.custoFixoMensal.origem === "estimado" ? "estimado" : "configurado"}: ${brl(dados.custoFixoMensal.valor)}/mês`}
        />
        <Stat
          label="Reserva de caixa"
          value={dados.reservaMeses === null ? "—" : `${num(dados.reservaMeses, 1)} meses`}
          tone={reservaTone}
          hint={
            dados.reservaMeses === null
              ? "Informe o custo fixo mensal em Parâmetros"
              : `Meta ${dados.reservaMetaMeses} meses · alerta abaixo de ${dados.reservaAlertaMeses}`
          }
        />
        <Stat
          label="MRR"
          value={brl(dados.mrr)}
          hint={dados.metaMrr > 0 ? `Meta ${brl(dados.metaMrr)}` : "Soma das licenças ativas"}
          icon={dados.mrr > 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
        />
        <Stat
          label="Inadimplência"
          value={dados.inadimplencia.percentual === null ? brl(dados.inadimplencia.valor) : pct(dados.inadimplencia.percentual)}
          tone={
            dados.inadimplencia.percentual !== null && dados.inadimplencia.percentual > 5
              ? "danger"
              : undefined
          }
          hint={`${dados.inadimplencia.faturas} fatura(s) vencida(s) · ${brl(dados.inadimplencia.valor)}`}
        />
        <Stat
          label="Pipeline ponderado"
          value={brl(dados.pipeline.ponderado)}
          tone={metaPipeline > 0 && dados.pipeline.ponderado < metaPipeline ? "warning" : undefined}
          hint={
            metaPipeline > 0
              ? `Precisa de 3x a meta: ${brl(metaPipeline)}`
              : `${dados.pipeline.quantidade} negociação(ões) em aberto`
          }
        />
        <Stat
          label="Decisões no prazo"
          value={pct(dados.decisoes.percentual)}
          tone={
            dados.decisoes.percentual !== null && dados.decisoes.percentual < 80 ? "danger" : undefined
          }
          hint={`${dados.decisoes.atrasadas} atrasada(s) · meta 80%`}
        />
      </div>

      {/* ----------------------------- Gráficos ---------------------------- */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            title="Receita, despesa e resultado"
            subtitle="Últimos 12 meses, somente lançamentos realizados"
          />
          <GraficoResultadoMensal dados={dados.serieMensal} />
        </Card>

        <Card>
          <CardTitle title="Projeção de caixa" subtitle="Saldo atual mais o que está previsto" />
          <GraficoProjecaoCaixa dados={dados.projecao} />
          <div className="mt-3 space-y-1.5">
            {dados.saldoPorConta.length > 0 ? (
              dados.saldoPorConta.map((conta) => (
                <div key={conta.conta} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--texto-suave)]">
                    {ROTULO_CONTA[conta.conta] ?? conta.conta}
                  </span>
                  <span className="font-semibold tabular-nums">{brl(conta.saldo)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--texto-fraco)]">
                Contas separadas: operacional, reinvestimento e impostos.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* -------------------------- DRE e pipeline -------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle
            title={`Resultado por unidade de negócio · ${mesBr(dados.competencia)}`}
            subtitle="Cada lançamento recebe a etiqueta da unidade; assim o DRE mostra quanto cada braço dá de lucro de verdade"
            action={
              <Link href="/financeiro/dre" className="btn btn-secundario btn-sm">
                DRE completo
              </Link>
            }
          />
          {dados.dre.length > 0 ? (
            <>
              <GraficoDre dados={dados.dre} />
              <table className="tabela mt-3">
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th className="num">Receita</th>
                    <th className="num">Custo</th>
                    <th className="num">Resultado</th>
                    <th className="num">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.dre.map((linha) => (
                    <tr key={linha.unidade}>
                      <td>{linha.unidade}</td>
                      <td className="num">{brl(linha.receita)}</td>
                      <td className="num">{brl(linha.custo)}</td>
                      <td
                        className="num font-semibold"
                        style={{ color: linha.resultado < 0 ? "var(--negativo)" : "var(--positivo)" }}
                      >
                        {brl(linha.resultado)}
                      </td>
                      <td className="num">{pct(linha.margemPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <EmptyState
              titulo="Sem lançamentos nesta competência"
              descricao="Cadastre receitas e despesas no fluxo de caixa com a etiqueta da unidade de negócio."
              acao={
                <Link href="/financeiro/fluxo-de-caixa" className="btn btn-primario btn-sm">
                  Ir para o fluxo de caixa
                </Link>
              }
            />
          )}
        </Card>

        <Card>
          <CardTitle
            title="Pipeline por etapa"
            subtitle="Valor ponderado pela chance de fechar"
            action={
              <Link href="/crm/pipeline" className="btn btn-secundario btn-sm">
                Abrir pipeline
              </Link>
            }
          />
          <GraficoPipeline dados={pipelinePorEtapa} />

          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs sm:grid-cols-4">
            <div>
              <p className="text-[var(--texto-fraco)]">Clientes ativos</p>
              <p className="text-base font-semibold">{dados.base.ativos}</p>
            </div>
            <div>
              <p className="text-[var(--texto-fraco)]">Em risco</p>
              <p className="text-base font-semibold text-[var(--atencao)]">{dados.base.emRisco}</p>
            </div>
            <div>
              <p className="text-[var(--texto-fraco)]">Churn do mês</p>
              <p className="text-base font-semibold">{pct(dados.churnPct)}</p>
            </div>
            <div>
              <p className="text-[var(--texto-fraco)]">Ativação</p>
              <p className="text-base font-semibold">{pct(dados.ativacaoPct)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------- Indicadores 11 -------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {indicadoresPorDiretoria.map((grupo) => (
          <Card key={grupo.diretoria}>
            <CardTitle
              title={ROTULO_DIRETORIA[grupo.diretoria]}
              subtitle="No máximo 4 números por diretoria, revisados toda quarta"
            />
            <ul className="space-y-2.5">
              {grupo.itens.map((indicador) => (
                <li key={indicador.id}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs leading-snug text-[var(--texto-suave)]">
                      {indicador.nome}
                    </span>
                    <span
                      className="shrink-0 text-sm font-semibold tabular-nums"
                      style={{ color: indicador.emAlerta ? "var(--negativo)" : "var(--texto)" }}
                    >
                      {formatarIndicador(indicador.valor, indicador.unidade)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[0.6875rem] text-[var(--texto-fraco)]">
                      {indicador.descricaoAlerta ?? "Sem sinal definido"}
                    </span>
                    {indicador.origem === "sem_dado" ? (
                      <Badge tone="neutral">sem dado</Badge>
                    ) : indicador.emAlerta ? (
                      <Badge tone="danger">alerta</Badge>
                    ) : (
                      <Badge tone="success">ok</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/gestao/indicadores"
              className="mt-3 inline-block text-xs font-semibold text-[var(--destaque)] hover:underline"
            >
              Ver detalhes e lançar leituras →
            </Link>
          </Card>
        ))}
      </div>

      {/* ------------------- Reinvestimento e eventos ---------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle
            title="Regra de caixa da Cláusula 9ª"
            subtitle={
              dados.reinvestimento.vigente
                ? `${dados.reinvestimento.percentual}% do lucro líquido vai para a conta de reinvestimento até ${dataBr(dados.reinvestimento.limite)}`
                : `A regra de reinvestimento venceu em ${dataBr(dados.reinvestimento.limite)}`
            }
          />
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-[var(--texto-fraco)]">Receita do mês</dt>
              <dd className="font-semibold tabular-nums">{brl(dados.reinvestimento.receita)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--texto-fraco)]">Custo do mês</dt>
              <dd className="font-semibold tabular-nums">{brl(dados.reinvestimento.custo)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--texto-fraco)]">Lucro líquido</dt>
              <dd
                className="font-semibold tabular-nums"
                style={{ color: dados.reinvestimento.lucro < 0 ? "var(--negativo)" : "var(--positivo)" }}
              >
                {brl(dados.reinvestimento.lucro)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--texto-fraco)]">Reinvestimento</dt>
              <dd className="font-semibold tabular-nums">{brl(dados.reinvestimento.reinvestimento)}</dd>
            </div>
          </dl>

          {dados.reinvestimento.porSocio.length > 0 ? (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-semibold text-[var(--texto-suave)]">
                Distribuição na proporção das quotas ({brl(dados.reinvestimento.distribuicao)})
              </p>
              <ul className="space-y-1.5">
                {dados.reinvestimento.porSocio.map((socio) => (
                  <li key={socio.nome} className="flex items-center justify-between text-xs">
                    <span>
                      {socio.nome} <span className="text-[var(--texto-fraco)]">({socio.quotaPct}%)</span>
                    </span>
                    <span className="font-semibold tabular-nums">{brl(socio.valor)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardTitle
            title="Próximas turmas e eventos"
            subtitle="Sinal mínimo de 50% antes de qualquer custo; ocupação abaixo de 60% a 15 dias é alerta"
            action={
              <Link href="/entrega/eventos" className="btn btn-secundario btn-sm">
                Ver todos
              </Link>
            }
          />
          {dados.proximosEventos.length > 0 ? (
            <ul className="space-y-3">
              {dados.proximosEventos.slice(0, 5).map((evento) => {
                const ocupacao = evento.ocupacao_pct as number | null;
                const dias = Number(evento.dias_para_evento ?? 0);
                return (
                  <li key={String(evento.id)}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{String(evento.nome)}</span>
                      <span className="shrink-0 text-xs text-[var(--texto-suave)]">
                        {dataBr(evento.data as string)} · {dias >= 0 ? `em ${dias} dias` : "passado"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progresso
                        valor={ocupacao ?? 0}
                        tone={ocupacao !== null && ocupacao < 60 ? "warning" : "success"}
                      />
                      <span className="shrink-0 text-xs tabular-nums text-[var(--texto-suave)]">
                        {Number(evento.inscritos ?? 0)}/{Number(evento.vagas ?? 0)} · {pct(ocupacao)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              titulo="Nenhum evento planejado"
              descricao="A unidade Educação é o que vende mais em ano eleitoral; cadastre as turmas para acompanhar ocupação e margem."
            />
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-3 text-xs">
            <div>
              <p className="text-[var(--texto-fraco)]">NPS pós-workshop</p>
              <p className="text-base font-semibold">{num(dados.npsEventos, 0)}</p>
            </div>
            <div>
              <p className="text-[var(--texto-fraco)]">1ª resposta (h)</p>
              <p className="text-base font-semibold">{num(dados.sla.mediaHoras, 1)}</p>
            </div>
            <div>
              <p className="text-[var(--texto-fraco)]">Chamados abertos</p>
              <p className="text-base font-semibold">{dados.sla.abertos}</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
