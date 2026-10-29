import { getConfig, indicadoresCalculados } from "@/lib/analytics";
import { all } from "@/lib/db";
import { brl, dataBr, num, pct } from "@/lib/format";
import { Badge, Card, CardTitle, Nota, PageHeader, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

const ROTULO_DIRETORIA: Record<string, string> = {
  Administrativo: "Admin e financeiro",
  Comercial: "Comercial e growth",
  Desenvolvimento: "Desenvolvimento e operações",
};

const ROTULO_FREQUENCIA: Record<string, string> = {
  semanal: "Semanal",
  mensal: "Mensal",
  por_evento: "Por evento",
};

function formatar(valor: number | null, unidade: string): string {
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

export default async function IndicadoresPage() {
  const config = await getConfig();
  const indicadores = await indicadoresCalculados(config);
  const emAlerta = indicadores.filter((indicador) => indicador.emAlerta);
  const semDado = indicadores.filter((indicador) => indicador.origem === "sem_dado");
  const semMeta = indicadores.filter((indicador) => indicador.meta === null);

  const ultimasLeituras = await all<Record<string, unknown>>(
    `SELECT l.id, l.data, l.valor, l.observacoes, i.nome AS indicador, i.unidade
       FROM indicador_leituras l
       JOIN indicadores i ON i.id = l.indicador_id
      ORDER BY l.data DESC, l.id DESC
      LIMIT 15`,
  );

  const grupos = ["Administrativo", "Comercial", "Desenvolvimento"];

  return (
    <>
      <PageHeader
        capitulo="11 · Indicadores por diretoria"
        titulo="Indicadores"
        descricao="Cada diretoria responde por no máximo 4 números, revisados toda quarta. O sistema calcula sozinho o que consegue derivar dos lançamentos, contratos e do CRM; o resto é lançado como leitura manual."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Indicadores ativos" value={String(indicadores.length)} />
        <Stat
          label="Em alerta"
          value={String(emAlerta.length)}
          tone={emAlerta.length > 0 ? "danger" : "success"}
        />
        <Stat label="Sem dado ainda" value={String(semDado.length)} tone={semDado.length > 0 ? "warning" : undefined} />
        <Stat
          label="Sem meta definida"
          value={String(semMeta.length)}
          hint="As metas saem do 1º Planejamento Trimestral"
        />
      </div>

      {semMeta.length > 0 ? (
        <div className="mt-4">
          <Nota tone="info">
            Os sinais de alerta cadastrados são pontos de partida usados em SaaS B2B e eventos. O
            manual pede que sejam ajustados depois de 3 meses de dados próprios, e que as metas de
            cada indicador saiam do primeiro Planejamento Trimestral, a partir da linha de base real.
          </Nota>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {grupos.map((diretoria) => {
          const itens = indicadores.filter((indicador) => indicador.diretoria === diretoria);
          if (itens.length === 0) return null;

          return (
            <Card key={diretoria}>
              <CardTitle
                title={ROTULO_DIRETORIA[diretoria] ?? diretoria}
                subtitle={`${itens.length} indicador(es) · no máximo 4 por diretoria`}
              />
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Indicador</th>
                    <th>Frequência</th>
                    <th className="num">Valor atual</th>
                    <th className="num">Meta</th>
                    <th>Sinal de alerta</th>
                    <th>Origem</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((indicador) => (
                    <tr key={indicador.id}>
                      <td className="font-medium">{indicador.nome}</td>
                      <td>
                        <Badge tone="neutral">
                          {ROTULO_FREQUENCIA[indicador.frequencia] ?? indicador.frequencia}
                        </Badge>
                      </td>
                      <td
                        className="num font-semibold"
                        style={{ color: indicador.emAlerta ? "var(--negativo)" : undefined }}
                      >
                        {formatar(indicador.valor, indicador.unidade)}
                      </td>
                      <td className="num">{formatar(indicador.meta, indicador.unidade)}</td>
                      <td className="text-xs text-[var(--texto-suave)]">
                        {indicador.descricaoAlerta ?? "—"}
                      </td>
                      <td>
                        <Badge tone={indicador.origem === "automatico" ? "accent" : "neutral"}>
                          {indicador.origem === "automatico"
                            ? "calculado"
                            : indicador.origem === "manual"
                              ? "leitura manual"
                              : "sem dado"}
                        </Badge>
                      </td>
                      <td>
                        {indicador.origem === "sem_dado" ? (
                          <Badge tone="neutral">—</Badge>
                        ) : indicador.emAlerta ? (
                          <Badge tone="danger">alerta</Badge>
                        ) : (
                          <Badge tone="success">ok</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>

      {ultimasLeituras.length > 0 ? (
        <Card className="mt-4">
          <CardTitle title="Últimas leituras lançadas" />
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Indicador</th>
                <th className="num">Valor</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {ultimasLeituras.map((leitura) => (
                <tr key={String(leitura.id)}>
                  <td>{dataBr(leitura.data as string)}</td>
                  <td>{String(leitura.indicador)}</td>
                  <td className="num">
                    {formatar(Number(leitura.valor), String(leitura.unidade))}
                  </td>
                  <td className="text-xs text-[var(--texto-suave)]">
                    {String(leitura.observacoes ?? "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <div className="mt-6 space-y-6">
        <ResourceView
          resourceKey="indicador_leituras"
          compacto
          titulo="Lançar leitura de indicador"
          descricao="Para os indicadores que o sistema não calcula sozinho, como uptime do CRM."
        />
        <ResourceView
          resourceKey="indicadores"
          compacto
          titulo="Definição dos indicadores"
        />
      </div>
    </>
  );
}
