import { competenciaAtual, inadimplencia } from "@/lib/analytics";
import { all, sum } from "@/lib/db";
import { brl, dataBr, mesBr, pct } from "@/lib/format";
import { Badge, Card, CardTitle, Nota, PageHeader, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";
import { AcoesFaturamento } from "@/components/acoes-faturamento";

export const dynamic = "force-dynamic";

export default async function CobrancasPage() {
  const competencia = competenciaAtual();

  const [inad, faturadoMes, recebidoMes, semNota, aVencer, vencidas] = await Promise.all([
    inadimplencia(),
    sum(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM faturas
        WHERE COALESCE(competencia, to_char(vencimento, 'YYYY-MM')) = ? AND status <> 'cancelada'`,
      [competencia],
    ),
    sum(
      `SELECT COALESCE(SUM(COALESCE(valor_pago, valor)), 0) AS total FROM faturas
        WHERE status = 'paga' AND to_char(COALESCE(pagamento, vencimento), 'YYYY-MM') = ?`,
      [competencia],
    ),
    sum(
      `SELECT COUNT(*) AS total FROM faturas WHERE status = 'paga' AND nfse_emitida = false`,
    ),
    sum(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM faturas
        WHERE status = 'aberta' AND vencimento >= current_date`,
    ),
    all<Record<string, unknown>>(
      `SELECT f.id, f.valor, f.valor_pago, f.vencimento, f.tentativas_cobranca, f.ultima_cobranca,
              f.competencia, c.nome AS cliente, c.telefone, c.email,
              (current_date - f.vencimento) AS dias_atraso
         FROM faturas f
         JOIN clientes c ON c.id = f.cliente_id
        WHERE f.status IN ('aberta', 'vencida', 'negociada') AND f.vencimento < current_date
        ORDER BY f.vencimento`,
    ),
  ]);

  return (
    <>
      <PageHeader
        capitulo="05 e 06 · POP-ADM-01 e POP-ADM-02"
        titulo="Cobranças, NFS-e e inadimplência"
        descricao="Contrato e nota em ordem em todo cliente, sem exceção. A cobrança formal começa a partir da 2ª tentativa recusada e a inadimplência não deve passar de 5% da receita do mês."
        acoes={<AcoesFaturamento competencia={competencia} />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label={`Faturado ${mesBr(competencia)}`} value={brl(faturadoMes)} />
        <Stat label="Recebido no mês" value={brl(recebidoMes)} tone="success" />
        <Stat label="A vencer" value={brl(aVencer)} />
        <Stat
          label="Vencido"
          value={brl(inad.valor)}
          tone={inad.valor > 0 ? "danger" : undefined}
          hint={`${inad.faturas} fatura(s)`}
        />
        <Stat
          label="Inadimplência"
          value={pct(inad.percentual)}
          tone={inad.percentual !== null && inad.percentual > 5 ? "danger" : undefined}
          hint="Sinal de alerta: acima de 5%"
        />
      </div>

      {semNota > 0 ? (
        <div className="mt-4">
          <Nota tone="warning">
            {semNota} cobrança(s) paga(s) sem NFS-e emitida. O POP-ADM-01 só encerra com a nota
            emitida e o lançamento de receita criado com a etiqueta da unidade de negócio.
          </Nota>
        </div>
      ) : null}

      {vencidas.length > 0 ? (
        <Card className="mt-4">
          <CardTitle
            title="Fila de cobrança"
            subtitle="POP-ADM-02: listar na conciliação da segunda, 1ª cobrança, 2ª tentativa, cobrança formal, avisar o Comercial sobre risco de cancelamento"
          />
          <table className="tabela">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th className="num">Atraso</th>
                <th className="num">Valor em aberto</th>
                <th className="num">Tentativas</th>
                <th>Última cobrança</th>
                <th>Contato</th>
              </tr>
            </thead>
            <tbody>
              {vencidas.map((fatura) => {
                const dias = Number(fatura.dias_atraso ?? 0);
                const emAberto = Number(fatura.valor ?? 0) - Number(fatura.valor_pago ?? 0);
                const tentativas = Number(fatura.tentativas_cobranca ?? 0);
                return (
                  <tr key={String(fatura.id)}>
                    <td className="font-medium">{String(fatura.cliente)}</td>
                    <td>{mesBr(fatura.competencia as string)}</td>
                    <td>{dataBr(fatura.vencimento as string)}</td>
                    <td className="num">
                      <Badge tone={dias > 30 ? "danger" : dias > 7 ? "warning" : "neutral"}>
                        {dias} dia(s)
                      </Badge>
                    </td>
                    <td className="num font-semibold">{brl(emAberto)}</td>
                    <td className="num">
                      <Badge tone={tentativas >= 2 ? "danger" : tentativas === 1 ? "warning" : "neutral"}>
                        {tentativas}
                      </Badge>
                    </td>
                    <td>{dataBr(fatura.ultima_cobranca as string)}</td>
                    <td className="text-xs text-[var(--texto-suave)]">
                      {[fatura.telefone, fatura.email].filter(Boolean).join(" · ") || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : null}

      <div className="mt-6">
        <ResourceView resourceKey="faturas" compacto titulo="Todas as cobranças" />
      </div>
    </>
  );
}
