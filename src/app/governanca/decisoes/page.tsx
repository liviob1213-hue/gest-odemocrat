import { decisoesNoPrazo } from "@/lib/analytics";
import { all, sum } from "@/lib/db";
import { pct } from "@/lib/format";
import { Card, CardTitle, PageHeader, Progresso, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

export default async function DecisoesPage() {
  const [metricas, total, abertas, porDono] = await Promise.all([
    decisoesNoPrazo(),
    sum("SELECT COUNT(*) AS total FROM decisoes"),
    sum("SELECT COUNT(*) AS total FROM decisoes WHERE status IN ('pendente', 'em_andamento')"),
    all<{ dono: string | null; abertas: number; atrasadas: number; entregues: number }>(
      `SELECT p.nome AS dono,
              COUNT(*) FILTER (WHERE d.status IN ('pendente', 'em_andamento')) AS abertas,
              COUNT(*) FILTER (
                WHERE d.status IN ('pendente', 'em_andamento', 'atrasada')
                  AND d.prazo IS NOT NULL AND d.prazo < current_date
              ) AS atrasadas,
              COUNT(*) FILTER (WHERE d.status = 'entregue') AS entregues
         FROM decisoes d
         LEFT JOIN pessoas p ON p.id = d.dono_id
        GROUP BY d.dono_id, p.nome
        ORDER BY atrasadas DESC, abertas DESC`,
    ),
  ]);

  return (
    <>
      <PageHeader
        capitulo="08 · Registro de Decisões"
        titulo="Registro de Decisões"
        descricao="Uma lista única, sempre aberta, com data, decisão, dono, prazo e status. É ela que a abertura da Quarta Oficial revisa toda semana — com o tempo, vira a memória da empresa: qualquer contratado consegue entender por que as coisas são como são."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Decisões registradas" value={String(total)} />
        <Stat label="Em aberto" value={String(abertas)} />
        <Stat
          label="Com prazo vencido"
          value={String(metricas.atrasadas)}
          tone={metricas.atrasadas > 0 ? "danger" : "success"}
        />
        <Stat
          label="Entregues no prazo"
          value={pct(metricas.percentual)}
          tone={metricas.percentual !== null && metricas.percentual < 80 ? "danger" : "success"}
          hint="Indicador semanal do Admin · meta 80%"
        />
      </div>

      {metricas.avaliadas > 0 ? (
        <Card className="mt-4">
          <CardTitle
            title="Taxa de entrega no prazo"
            subtitle={`${metricas.entregues} de ${metricas.avaliadas} decisões avaliadas foram entregues dentro do prazo`}
          />
          <Progresso
            valor={metricas.percentual ?? 0}
            tone={(metricas.percentual ?? 0) < 80 ? "danger" : "success"}
          />
        </Card>
      ) : null}

      {porDono.length > 0 ? (
        <Card className="mt-4">
          <CardTitle title="Por dono" subtitle="Toda decisão tem um dono e um prazo" />
          <table className="tabela">
            <thead>
              <tr>
                <th>Dono</th>
                <th className="num">Em aberto</th>
                <th className="num">Atrasadas</th>
                <th className="num">Entregues</th>
              </tr>
            </thead>
            <tbody>
              {porDono.map((linha) => (
                <tr key={linha.dono ?? "sem-dono"}>
                  <td>{linha.dono ?? "Sem dono definido"}</td>
                  <td className="num">{linha.abertas}</td>
                  <td
                    className="num font-semibold"
                    style={{ color: linha.atrasadas > 0 ? "var(--negativo)" : undefined }}
                  >
                    {linha.atrasadas}
                  </td>
                  <td className="num">{linha.entregues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <div className="mt-6">
        <ResourceView resourceKey="decisoes" compacto titulo="Todas as decisões" />
      </div>
    </>
  );
}
