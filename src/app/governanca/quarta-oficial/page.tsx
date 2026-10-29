import Link from "next/link";

import {
  competenciaAtual,
  decisoesNoPrazo,
  getConfig,
  inadimplencia,
  mrr,
  ocupacaoProximosEventos,
  reservaMeses,
  saldoCaixa,
  vendasFechadasMes,
} from "@/lib/analytics";
import { all } from "@/lib/db";
import { brl, dataBr, num, pct } from "@/lib/format";
import { Badge, Card, CardTitle, Nota, PageHeader } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";
import { NovaQuartaOficial } from "@/components/nova-quarta-oficial";

export const dynamic = "force-dynamic";

const BLOCOS = [
  {
    numero: "0",
    titulo: "Abertura",
    tempo: "10 min",
    dono: "Administrador",
    conteudo: "Revisão do Registro de Decisões: o que foi entregue, o que atrasou e por quê",
  },
  {
    numero: "1",
    titulo: "Admin e financeiro",
    tempo: "15 min",
    dono: "Administrador",
    conteudo: "Caixa e reserva, inadimplência, contas da semana, contratos e notas pendentes",
  },
  {
    numero: "2",
    titulo: "Comercial e growth",
    tempo: "20 min",
    dono: "Comercial",
    conteudo: "Pipeline de SaaS e de cursos, vendas fechadas, churn, clientes em risco",
  },
  {
    numero: "3",
    titulo: "Produto e entrega",
    tempo: "20 min",
    dono: "Desenvolvimento",
    conteudo: "Roadmap do CRM, incidentes, agenda e logística dos próximos workshops",
  },
  {
    numero: "4",
    titulo: "Gargalos e decisões",
    tempo: "20 min",
    dono: "Todos",
    conteudo: "Temas que cruzam diretorias; cada um sai com decisão ou com prazo para decidir",
  },
  {
    numero: "5",
    titulo: "Fechamento",
    tempo: "5 min",
    dono: "Administrador",
    conteudo: "Leitura das decisões do dia com dono e prazo",
  },
];

export default async function QuartaOficialPage() {
  const config = await getConfig();

  const [
    caixa,
    reserva,
    receitaRecorrente,
    inad,
    vendas,
    decisoes,
    eventos,
    pendentes,
    reunioes,
  ] = await Promise.all([
    saldoCaixa(config),
    reservaMeses(config),
    mrr(),
    inadimplencia(),
    vendasFechadasMes(competenciaAtual()),
    decisoesNoPrazo(),
    ocupacaoProximosEventos(),
    all<Record<string, unknown>>(
      `SELECT d.id, d.decisao, d.prazo, d.status, d.diretoria, p.nome AS dono,
              (current_date - d.prazo) AS atraso
         FROM decisoes d
         LEFT JOIN pessoas p ON p.id = d.dono_id
        WHERE d.status IN ('pendente', 'em_andamento', 'atrasada')
        ORDER BY d.prazo NULLS LAST`,
    ),
    all<Record<string, unknown>>(
      `SELECT * FROM reunioes WHERE tipo = 'quarta_oficial' ORDER BY data DESC LIMIT 1`,
    ),
  ]);

  const proximoEvento = eventos[0];
  const ultimaReuniao = reunioes[0];

  const numeros = {
    caixa,
    reserva_meses: reserva ?? 0,
    mrr: receitaRecorrente,
    vendas_fechadas: vendas,
    inadimplencia_pct: inad.percentual ?? 0,
    proximo_evento: proximoEvento
      ? `${String(proximoEvento.nome)} · ${dataBr(proximoEvento.data as string)}`
      : "",
  };

  return (
    <>
      <PageHeader
        capitulo="08 · Quarta Oficial: pauta, ata e registro de decisões"
        titulo="Quarta Oficial"
        descricao="90 minutos. Pauta enviada até terça às 18h; item que chega sem proposta de solução não entra. Começa cobrando o que foi decidido na semana anterior e termina com cada decisão tendo um dono e um prazo."
        acoes={<NovaQuartaOficial numeros={numeros} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            title="Números da semana"
            subtitle="Calculados pelo sistema no momento em que você abre esta tela — é o que entra no bloco 1 da ata"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--texto-fraco)]">Caixa</p>
              <p className="text-lg font-semibold tabular-nums">{brl(caixa)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--texto-fraco)]">Reserva (meses)</p>
              <p
                className="text-lg font-semibold tabular-nums"
                style={{ color: reserva !== null && reserva < 3 ? "var(--negativo)" : undefined }}
              >
                {reserva === null ? "—" : num(reserva, 1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--texto-fraco)]">MRR</p>
              <p className="text-lg font-semibold tabular-nums">{brl(receitaRecorrente)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--texto-fraco)]">Vendas fechadas no mês</p>
              <p className="text-lg font-semibold tabular-nums">{brl(vendas)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--texto-fraco)]">Inadimplência</p>
              <p
                className="text-lg font-semibold tabular-nums"
                style={{
                  color: inad.percentual !== null && inad.percentual > 5 ? "var(--negativo)" : undefined,
                }}
              >
                {pct(inad.percentual)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--texto-fraco)]">Próximo evento</p>
              <p className="text-sm font-semibold">
                {proximoEvento ? String(proximoEvento.nome) : "—"}
              </p>
              {proximoEvento ? (
                <p className="text-xs text-[var(--texto-suave)]">
                  {dataBr(proximoEvento.data as string)}
                </p>
              ) : null}
            </div>
          </div>

          {reserva !== null && reserva < 3 ? (
            <div className="mt-4">
              <Nota tone="danger">
                Alerta vermelho da Quarta Oficial: a reserva está abaixo de 3 meses de custo fixo.
              </Nota>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardTitle
            title="Roteiro dos 90 minutos"
            subtitle="Cada bloco tem dono e tempo"
          />
          <ol className="space-y-2.5">
            {BLOCOS.map((bloco) => (
              <li key={bloco.numero} className="flex gap-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-[var(--destaque-bg)] text-xs font-bold text-[var(--destaque)]">
                  {bloco.numero}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {bloco.titulo}{" "}
                    <span className="font-normal text-[var(--texto-fraco)]">
                      · {bloco.tempo} · {bloco.dono}
                    </span>
                  </p>
                  <p className="text-xs leading-snug text-[var(--texto-suave)]">{bloco.conteudo}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle
          title={`Bloco 0 · Revisão do Registro de Decisões (${pendentes.length} em aberto)`}
          subtitle={`Taxa de entrega no prazo: ${pct(decisoes.percentual)} — a meta é 80%`}
          action={
            <Link href="/governanca/decisoes" className="btn btn-secundario btn-sm">
              Abrir registro completo
            </Link>
          }
        />
        {pendentes.length > 0 ? (
          <table className="tabela">
            <thead>
              <tr>
                <th>Decisão</th>
                <th>Dono</th>
                <th>Diretoria</th>
                <th>Prazo</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map((decisao) => {
                const atraso = decisao.prazo ? Number(decisao.atraso ?? 0) : null;
                return (
                  <tr key={String(decisao.id)}>
                    <td className="max-w-[460px]">{String(decisao.decisao)}</td>
                    <td>{String(decisao.dono ?? "—")}</td>
                    <td>{String(decisao.diretoria ?? "—")}</td>
                    <td>{dataBr(decisao.prazo as string)}</td>
                    <td>
                      {atraso !== null && atraso > 0 ? (
                        <Badge tone="danger">atrasada {atraso}d</Badge>
                      ) : (
                        <Badge tone="warning">{String(decisao.status)}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--texto-fraco)]">
            Nenhuma decisão em aberto. Toda decisão da quarta deve ser registrada com dono e prazo.
          </p>
        )}
      </Card>

      {ultimaReuniao ? (
        <Card className="mt-4">
          <CardTitle
            title={`Última ata · ${dataBr(ultimaReuniao.data as string)}`}
            subtitle={String(ultimaReuniao.presentes ?? "Presentes não informados")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["0. Abertura", ultimaReuniao.bloco0_abertura],
              ["1. Admin e financeiro", ultimaReuniao.bloco1_admin],
              ["2. Comercial e growth", ultimaReuniao.bloco2_comercial],
              ["3. Produto e entrega", ultimaReuniao.bloco3_produto],
              ["4. Gargalos e decisões", ultimaReuniao.bloco4_gargalos],
              ["Para a próxima quarta", ultimaReuniao.para_proxima],
            ].map(([titulo, conteudo]) => (
              <div key={String(titulo)}>
                <p className="text-xs font-semibold text-[var(--texto-suave)]">{String(titulo)}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-snug">
                  {conteudo ? String(conteudo) : "—"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="mt-6">
        <ResourceView resourceKey="reunioes" compacto titulo="Atas e rituais registrados" />
      </div>
    </>
  );
}
