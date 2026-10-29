import Link from "next/link";

import {
  competenciaAtual,
  custoFixoMensal,
  getConfig,
  projecaoCaixa,
  saldoCaixa,
  saldoPorConta,
  serieMensal,
} from "@/lib/analytics";
import { all, sum } from "@/lib/db";
import { brl, mesBr, num } from "@/lib/format";
import { GraficoProjecaoCaixa, GraficoResultadoMensal } from "@/components/charts";
import { Card, CardTitle, Nota, PageHeader, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

const ROTULO_CONTA: Record<string, string> = {
  operacional: "Operacional",
  reinvestimento: "Reinvestimento",
  impostos: "Impostos",
};

export default async function FluxoDeCaixaPage() {
  const config = await getConfig();
  const competencia = competenciaAtual();

  const [
    caixa,
    custoFixo,
    contas,
    receitaMes,
    despesaMes,
    naoConciliados,
    previstoMes,
    porCentroCusto,
    serie,
    projecao,
  ] = await Promise.all([
    saldoCaixa(config),
    custoFixoMensal(config),
    saldoPorConta(),
    sum(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos
        WHERE tipo = 'receita' AND status = 'realizado'
          AND COALESCE(competencia, to_char(data, 'YYYY-MM')) = ?`,
      [competencia],
    ),
    sum(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM lancamentos
        WHERE tipo = 'despesa' AND status = 'realizado'
          AND COALESCE(competencia, to_char(data, 'YYYY-MM')) = ?`,
      [competencia],
    ),
    sum(
      `SELECT COUNT(*) AS total FROM lancamentos
        WHERE status = 'realizado' AND conciliado = false`,
    ),
    sum(
      `SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS total
         FROM lancamentos
        WHERE status = 'previsto' AND COALESCE(competencia, to_char(data, 'YYYY-MM')) = ?`,
      [competencia],
    ),
    all<{ centro: string | null; total: number }>(
      `SELECT c.nome AS centro, COALESCE(SUM(l.valor), 0) AS total
         FROM lancamentos l
         LEFT JOIN centros_custo c ON c.id = l.centro_custo_id
        WHERE l.tipo = 'despesa' AND l.status = 'realizado'
          AND COALESCE(l.competencia, to_char(l.data, 'YYYY-MM')) = ?
        GROUP BY l.centro_custo_id, c.nome
        ORDER BY total DESC`,
      [competencia],
    ),
    serieMensal(12),
    projecaoCaixa(6, config),
  ]);

  const totalCentros = porCentroCusto.reduce((total, linha) => total + linha.total, 0);

  return (
    <>
      <PageHeader
        capitulo="06 · Financeiro e contábil"
        titulo="Fluxo de caixa"
        descricao="Todo lançamento recebe a etiqueta da unidade de negócio e do centro de custo. Contas separadas: operacional, reinvestimento e impostos — o imposto é provisionado quando a receita entra."
        acoes={
          <Link href="/financeiro/dre" className="btn btn-secundario">
            Ver DRE por unidade
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Saldo em caixa" value={brl(caixa)} />
        <Stat label={`Receita ${mesBr(competencia)}`} value={brl(receitaMes)} tone="success" />
        <Stat label={`Despesa ${mesBr(competencia)}`} value={brl(despesaMes)} tone="danger" />
        <Stat
          label="Resultado do mês"
          value={brl(receitaMes - despesaMes)}
          tone={receitaMes - despesaMes < 0 ? "danger" : "success"}
          hint={`Previsto ainda no mês: ${brl(previstoMes)}`}
        />
        <Stat
          label="Custo fixo mensal"
          value={brl(custoFixo.valor)}
          hint={
            custoFixo.origem === "estimado"
              ? "Estimado pela média dos 3 últimos meses"
              : "Configurado em Parâmetros"
          }
        />
      </div>

      {naoConciliados > 0 ? (
        <div className="mt-4">
          <Nota tone="warning">
            {naoConciliados} lançamento(s) realizado(s) ainda sem conciliação. A rotina financeira
            prevê conciliação bancária e da plataforma de pagamento toda segunda-feira, com os
            repasses da Kiwify batendo com o extrato, descontando as taxas.
          </Nota>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle title="Receita, despesa e resultado" subtitle="Últimos 12 meses" />
          <GraficoResultadoMensal dados={serie} />
        </Card>

        <Card>
          <CardTitle title="Projeção de caixa" subtitle="Saldo atual mais os lançamentos previstos" />
          <GraficoProjecaoCaixa dados={projecao} />

          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs font-semibold text-[var(--texto-suave)]">Saldo por conta</p>
            {contas.length > 0 ? (
              <ul className="space-y-1.5">
                {contas.map((conta) => (
                  <li key={conta.conta} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--texto-suave)]">
                      {ROTULO_CONTA[conta.conta] ?? conta.conta}
                    </span>
                    <span className="font-semibold tabular-nums">{brl(conta.saldo)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--texto-fraco)]">Nenhum lançamento realizado ainda.</p>
            )}
          </div>
        </Card>
      </div>

      {porCentroCusto.length > 0 ? (
        <Card className="mt-4">
          <CardTitle
            title={`Despesas por centro de custo · ${mesBr(competencia)}`}
            subtitle="A gaveta onde cada despesa é classificada"
          />
          <table className="tabela">
            <thead>
              <tr>
                <th>Centro de custo</th>
                <th className="num">Valor</th>
                <th className="num">% do total</th>
              </tr>
            </thead>
            <tbody>
              {porCentroCusto.map((linha) => (
                <tr key={linha.centro ?? "sem"}>
                  <td>{linha.centro ?? "Sem centro de custo"}</td>
                  <td className="num">{brl(linha.total)}</td>
                  <td className="num">
                    {totalCentros > 0 ? `${num((linha.total / totalCentros) * 100, 1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <div className="mt-6">
        <ResourceView resourceKey="lancamentos" compacto titulo="Lançamentos" />
      </div>
    </>
  );
}
