import { competenciaAtual, dre, ultimasCompetencias } from "@/lib/analytics";
import { all } from "@/lib/db";
import { brl, mesBr, pct } from "@/lib/format";
import { GraficoDre } from "@/components/charts";
import { Card, CardTitle, EmptyState, Nota, PageHeader, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * DRE por unidade de negocio, com a serie dos ultimos 6 meses ao lado para
 * pegar o sinal de alerta "unidade com margem negativa 2 meses seguidos".
 */
export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string; previsto?: string }>;
}) {
  const parametros = await searchParams;
  const competencia =
    parametros.competencia && /^\d{4}-\d{2}$/.test(parametros.competencia)
      ? parametros.competencia
      : competenciaAtual();
  const incluirPrevisto = parametros.previsto === "1";

  const meses = ultimasCompetencias(6, competencia);

  const [linhas, unidades, serieBruta] = await Promise.all([
    dre(competencia, incluirPrevisto),
    all<{ id: number; nome: string }>(
      "SELECT id, nome FROM unidades_negocio WHERE ativo = true ORDER BY id",
    ),
    Promise.all(meses.map(async (mes) => ({ mes, linhas: await dre(mes) }))),
  ]);

  const receita = linhas.reduce((total, linha) => total + linha.receita, 0);
  const custo = linhas.reduce((total, linha) => total + linha.custo, 0);
  const resultado = receita - custo;

  // Matriz unidade x competencia para o acompanhamento de margem.
  const serie = serieBruta;
  const margemPorUnidade = unidades.map((unidade) => ({
    unidade: unidade.nome,
    valores: serie.map(({ mes, linhas: linhasDoMes }) => {
      const linha = linhasDoMes.find((item) => item.unidadeId === unidade.id);
      return { mes, resultado: linha?.resultado ?? 0, margem: linha?.margemPct ?? null };
    }),
  }));

  const alertasMargem = margemPorUnidade.filter((item) => {
    const ultimos = item.valores.slice(-2);
    return (
      ultimos.length === 2 &&
      ultimos.every((valor) => valor.margem !== null && valor.margem < 0)
    );
  });

  const competenciasDisponiveis = ultimasCompetencias(18);

  return (
    <>
      <PageHeader
        capitulo="06 · Três unidades de negócio, um caixa"
        titulo="DRE por unidade de negócio"
        descricao="Receita menos custos do mês, separado por braço da empresa. É isso que mostra quanto Software, Educação e Estratégia dão de lucro de verdade."
        acoes={
          <form className="flex gap-2" action="/financeiro/dre">
            <select name="competencia" defaultValue={competencia} className="campo w-auto">
              {competenciasDisponiveis.map((mes) => (
                <option key={mes} value={mes}>
                  {mesBr(mes)}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="previsto"
                value="1"
                defaultChecked={incluirPrevisto}
                className="size-3.5 accent-[var(--color-marca-600)]"
              />
              Incluir previsto
            </label>
            <button type="submit" className="btn btn-secundario">
              Aplicar
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={`Receita · ${mesBr(competencia)}`} value={brl(receita)} tone="success" />
        <Stat label="Custo" value={brl(custo)} tone="danger" />
        <Stat
          label="Resultado"
          value={brl(resultado)}
          tone={resultado < 0 ? "danger" : "success"}
          hint={receita > 0 ? `Margem de ${pct((resultado / receita) * 100)}` : undefined}
        />
      </div>

      {alertasMargem.length > 0 ? (
        <div className="mt-4">
          <Nota tone="danger">
            Sinal de alerta do capítulo 11: {alertasMargem.map((item) => item.unidade).join(", ")} com
            margem negativa dois meses seguidos.
          </Nota>
        </div>
      ) : null}

      <Card className="mt-4">
        <CardTitle
          title={`Resultado por unidade · ${mesBr(competencia)}`}
          subtitle={
            incluirPrevisto
              ? "Inclui lançamentos previstos"
              : "Somente lançamentos realizados"
          }
        />

        {linhas.length > 0 ? (
          <>
            <GraficoDre dados={linhas} />

            <table className="tabela mt-4">
              <thead>
                <tr>
                  <th>Unidade de negócio</th>
                  <th className="num">Receita</th>
                  <th className="num">Custo</th>
                  <th className="num">Resultado</th>
                  <th className="num">Margem</th>
                  <th className="num">% da receita</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.unidade}>
                    <td className="font-medium">{linha.unidade}</td>
                    <td className="num">{brl(linha.receita)}</td>
                    <td className="num">{brl(linha.custo)}</td>
                    <td
                      className="num font-semibold"
                      style={{ color: linha.resultado < 0 ? "var(--negativo)" : "var(--positivo)" }}
                    >
                      {brl(linha.resultado)}
                    </td>
                    <td className="num">{pct(linha.margemPct)}</td>
                    <td className="num">
                      {receita > 0 ? pct((linha.receita / receita) * 100) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-semibold">Total</td>
                  <td className="num font-semibold">{brl(receita)}</td>
                  <td className="num font-semibold">{brl(custo)}</td>
                  <td
                    className="num font-semibold"
                    style={{ color: resultado < 0 ? "var(--negativo)" : "var(--positivo)" }}
                  >
                    {brl(resultado)}
                  </td>
                  <td className="num font-semibold">
                    {receita > 0 ? pct((resultado / receita) * 100) : "—"}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <EmptyState
            titulo="Sem lançamentos nesta competência"
            descricao="O DRE é montado a partir dos lançamentos do fluxo de caixa, agrupados pela etiqueta da unidade de negócio."
          />
        )}
      </Card>

      <Card className="mt-4">
        <CardTitle
          title="Resultado por unidade nos últimos 6 meses"
          subtitle="A sazonalidade eleitoral aparece aqui: Educação e Estratégia sobem em ano de eleição, o SaaS segura o caixa no meio do ciclo"
        />
        <div className="overflow-x-auto">
          <table className="tabela">
            <thead>
              <tr>
                <th>Unidade</th>
                {meses.map((mes) => (
                  <th key={mes} className="num">
                    {mesBr(mes)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {margemPorUnidade.map((item) => (
                <tr key={item.unidade}>
                  <td className="font-medium">{item.unidade}</td>
                  {item.valores.map((valor) => (
                    <td
                      key={valor.mes}
                      className="num"
                      style={{
                        color:
                          valor.resultado < 0
                            ? "var(--negativo)"
                            : valor.resultado > 0
                              ? "var(--positivo)"
                              : "var(--texto-fraco)",
                      }}
                    >
                      {valor.resultado === 0 ? "—" : brl(valor.resultado)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
