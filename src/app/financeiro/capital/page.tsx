import { competenciaAtual, getConfig, regraReinvestimento } from "@/lib/analytics";
import { all } from "@/lib/db";
import { brl, dataBr, diasAte, mesBr, pct } from "@/lib/format";
import { Badge, Card, CardTitle, Nota, PageHeader, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

/**
 * Capital, pro-labore e regra de lucros: traduz as clausulas 6a, 8a § 5o e 9a
 * do contrato social em numeros do mes.
 */
export default async function CapitalPage() {
  const config = await getConfig();
  const competencia = competenciaAtual();

  const [regra, socios, parcelas] = await Promise.all([
    regraReinvestimento(competencia, config),
    all<{ nome: string; quota_pct: number; pro_labore: number }>(
      "SELECT nome, quota_pct, pro_labore FROM pessoas WHERE tipo = 'socio' ORDER BY quota_pct DESC",
    ),
    all<Record<string, unknown>>("SELECT * FROM capital_parcelas ORDER BY vencimento"),
  ]);

  const capitalTotal = parcelas.reduce((total, parcela) => total + Number(parcela.valor ?? 0), 0);
  const integralizado = parcelas
    .filter((parcela) => parcela.status === "integralizada")
    .reduce((total, parcela) => total + Number(parcela.valor ?? 0), 0);
  const proLaboreTotal = socios.reduce((total, socio) => total + Number(socio.pro_labore ?? 0), 0);
  const somaQuotas = socios.reduce((total, socio) => total + Number(socio.quota_pct ?? 0), 0);

  return (
    <>
      <PageHeader
        capitulo="04 e 06 · Cláusulas 6ª, 8ª § 5º e 9ª"
        titulo="Capital, pró-labore e lucros"
        descricao="Capital de R$ 30.000 em 3 parcelas anuais; pró-labore fixado em conjunto pelos três; 50% do lucro líquido reinvestido até 31/07/2027 e o resto distribuído na proporção das quotas."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Capital subscrito"
          value={brl(capitalTotal)}
          hint={`Integralizado: ${brl(integralizado)}`}
        />
        <Stat
          label="A integralizar"
          value={brl(capitalTotal - integralizado)}
          tone={capitalTotal - integralizado > 0 ? "warning" : "success"}
        />
        <Stat
          label="Pró-labore mensal"
          value={brl(proLaboreTotal)}
          tone={proLaboreTotal === 0 ? "warning" : undefined}
          hint={
            proLaboreTotal === 0
              ? "Pendente: valor a definir no 1º Fechamento Mensal (Cl. 8ª, § 5º)"
              : "Soma dos três sócios"
          }
        />
        <Stat
          label={`Lucro líquido ${mesBr(competencia)}`}
          value={brl(regra.lucro)}
          tone={regra.lucro < 0 ? "danger" : "success"}
        />
      </div>

      {somaQuotas !== 100 && socios.length > 0 ? (
        <div className="mt-4">
          <Nota tone="warning">
            A soma das quotas cadastradas é {pct(somaQuotas)} — o contrato social prevê 40% / 30% /
            30%. Ajuste em Pessoas e sócios para que a distribuição de lucros fique correta.
          </Nota>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle
            title="Regra de caixa da Cláusula 9ª"
            subtitle={
              regra.vigente
                ? `Vigente até ${dataBr(regra.limite)}: ${regra.percentual}% do lucro líquido de cada mês vai para a conta de reinvestimento, separada da operação`
                : `A regra venceu em ${dataBr(regra.limite)} — o lucro passa a ser integralmente distribuível`
            }
          />
          <table className="tabela">
            <tbody>
              <tr>
                <td>Receita do mês</td>
                <td className="num font-semibold">{brl(regra.receita)}</td>
              </tr>
              <tr>
                <td>Custo do mês</td>
                <td className="num font-semibold">{brl(regra.custo)}</td>
              </tr>
              <tr>
                <td>Lucro líquido</td>
                <td
                  className="num font-semibold"
                  style={{ color: regra.lucro < 0 ? "var(--negativo)" : "var(--positivo)" }}
                >
                  {brl(regra.lucro)}
                </td>
              </tr>
              <tr>
                <td>
                  Reinvestimento ({regra.percentual}%)
                  <span className="ml-1 text-xs text-[var(--texto-fraco)]">
                    conta separada da operação
                  </span>
                </td>
                <td className="num font-semibold">{brl(regra.reinvestimento)}</td>
              </tr>
              <tr>
                <td>Disponível para distribuição</td>
                <td className="num font-semibold">{brl(regra.distribuicao)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs font-semibold text-[var(--texto-suave)]">
              Distribuição na proporção das quotas
            </p>
            {regra.porSocio.length > 0 ? (
              <ul className="space-y-1.5">
                {regra.porSocio.map((socio) => (
                  <li key={socio.nome} className="flex items-center justify-between text-sm">
                    <span>
                      {socio.nome}{" "}
                      <span className="text-xs text-[var(--texto-fraco)]">({socio.quotaPct}%)</span>
                    </span>
                    <span className="font-semibold tabular-nums">{brl(socio.valor)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--texto-fraco)]">Nenhum sócio cadastrado.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle
            title="Calendário de integralização"
            subtitle="Cláusula 6ª, item 6.2 — próximas parcelas em 31/07/2027 e 31/07/2028"
          />
          <table className="tabela">
            <thead>
              <tr>
                <th>Parcela</th>
                <th>Vencimento</th>
                <th className="num">Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((parcela) => {
                const dias = diasAte(parcela.vencimento as string);
                const integralizada = parcela.status === "integralizada";
                return (
                  <tr key={String(parcela.id)}>
                    <td className="max-w-[260px]">{String(parcela.descricao)}</td>
                    <td>
                      {dataBr(parcela.vencimento as string)}
                      {!integralizada && dias !== null ? (
                        <span className="ml-1 text-xs text-[var(--texto-fraco)]">
                          {dias < 0 ? `(${Math.abs(dias)}d atrasada)` : `(em ${dias}d)`}
                        </span>
                      ) : null}
                    </td>
                    <td className="num">{brl(Number(parcela.valor ?? 0))}</td>
                    <td>
                      <Badge
                        tone={
                          integralizada ? "success" : dias !== null && dias < 0 ? "danger" : "warning"
                        }
                      >
                        {integralizada ? "Integralizada" : "Pendente"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs font-semibold text-[var(--texto-suave)]">
              Quotas e pró-labore por sócio
            </p>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Sócio</th>
                  <th className="num">Quota</th>
                  <th className="num">Pró-labore</th>
                </tr>
              </thead>
              <tbody>
                {socios.map((socio) => (
                  <tr key={socio.nome}>
                    <td>{socio.nome}</td>
                    <td className="num">{pct(socio.quota_pct, 0)}</td>
                    <td className="num">{brl(socio.pro_labore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <ResourceView resourceKey="capital_parcelas" compacto titulo="Parcelas de capital" />
      </div>
    </>
  );
}
