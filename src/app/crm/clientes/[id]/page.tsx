import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { all, one, type Row } from "@/lib/db";
import { brl, dataBr, pct } from "@/lib/format";
import { TEMPLATES } from "@/lib/onboarding";
import { Badge, Card, CardTitle, CampoLeitura, Nota, PageHeader, Progresso, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";
import { OnboardingGerador, OnboardingPainel } from "@/components/onboarding-painel";

export const dynamic = "force-dynamic";

const TONS_STATUS: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  prospect: "neutral",
  onboarding: "info",
  ativo: "success",
  em_risco: "warning",
  inadimplente: "danger",
  cancelado: "neutral",
};

const ROTULO_STATUS: Record<string, string> = {
  prospect: "Prospect",
  onboarding: "Onboarding",
  ativo: "Ativo",
  em_risco: "Em risco",
  inadimplente: "Inadimplente",
  cancelado: "Cancelado",
};

export default async function FichaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = Number(id);
  if (!Number.isInteger(clienteId)) notFound();

  const cliente = await one<Row>(
    `SELECT c.*, u.nome AS unidade, p.nome AS responsavel_cs
       FROM clientes c
       LEFT JOIN unidades_negocio u ON u.id = c.unidade_negocio_id
       LEFT JOIN pessoas p ON p.id = c.responsavel_cs_id
      WHERE c.id = ?`,
    [clienteId],
  );
  if (!cliente) notFound();

  const resumo = await one<{
    contratos: number;
    mrr: number;
    faturado: number;
    recebido: number;
    vencido: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM contratos WHERE cliente_id = ? AND status = 'ativo') AS contratos,
       (SELECT COALESCE(SUM(CASE periodicidade
            WHEN 'mensal' THEN valor
            WHEN 'trimestral' THEN valor / 3.0
            WHEN 'semestral' THEN valor / 6.0
            WHEN 'anual' THEN valor / 12.0
            ELSE 0 END), 0)
          FROM contratos WHERE cliente_id = ? AND status = 'ativo') AS mrr,
       (SELECT COALESCE(SUM(valor), 0) FROM faturas WHERE cliente_id = ? AND status <> 'cancelada') AS faturado,
       (SELECT COALESCE(SUM(COALESCE(valor_pago, valor)), 0) FROM faturas WHERE cliente_id = ? AND status = 'paga') AS recebido,
       (SELECT COALESCE(SUM(valor - COALESCE(valor_pago, 0)), 0) FROM faturas
         WHERE cliente_id = ? AND status IN ('aberta', 'vencida', 'negociada') AND vencimento < current_date) AS vencido`,
    [clienteId, clienteId, clienteId, clienteId, clienteId],
  );

  const onboarding = await all<Row>(
    `SELECT id, ramo, ordem, item, prazo, concluido, concluido_em
       FROM onboarding_itens
      WHERE cliente_id = ?
      ORDER BY CASE ramo WHEN 'trilho' THEN 0 ELSE 1 END, ramo, ordem, id`,
    [clienteId],
  );

  const interacoes = await all<Row>(
    `SELECT i.id, i.data, i.canal, i.tipo, i.resumo, i.proximo_passo, p.nome AS responsavel
       FROM interacoes i
       LEFT JOIN pessoas p ON p.id = i.responsavel_id
      WHERE i.cliente_id = ?
      ORDER BY i.data DESC, i.id DESC
      LIMIT 12`,
    [clienteId],
  );

  const concluidos = onboarding.filter((item) => item.concluido === true).length;
  const status = String(cliente.status);

  return (
    <>
      <Link
        href="/crm/clientes"
        className="nao-imprimir mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--destaque)] hover:underline"
      >
        <ArrowLeft className="size-3.5" /> Voltar para clientes
      </Link>

      <PageHeader
        capitulo="09 · Fluxo do cliente: da venda ao fechamento"
        titulo={String(cliente.nome)}
        descricao={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={TONS_STATUS[status] ?? "neutral"}>{ROTULO_STATUS[status] ?? status}</Badge>
            {cliente.unidade ? <Badge tone="accent">{String(cliente.unidade)}</Badge> : null}
            {cliente.setor_publico === true ? (
              <Badge tone="warning">Setor público · inexigibilidade</Badge>
            ) : null}
            <span className="text-xs text-[var(--texto-suave)]">
              {[cliente.cidade, cliente.uf].filter(Boolean).join("/") || "Sem cidade informada"}
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Contratos ativos" value={String(resumo?.contratos ?? 0)} />
        <Stat label="MRR do cliente" value={brl(resumo?.mrr ?? 0)} />
        <Stat label="Total faturado" value={brl(resumo?.faturado ?? 0)} />
        <Stat label="Recebido" value={brl(resumo?.recebido ?? 0)} tone="success" />
        <Stat
          label="Vencido"
          value={brl(resumo?.vencido ?? 0)}
          tone={(resumo?.vencido ?? 0) > 0 ? "danger" : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardTitle title="Dados cadastrais" />
          <dl className="grid grid-cols-2 gap-3">
            <CampoLeitura label="CNPJ / CPF">{String(cliente.documento ?? "—")}</CampoLeitura>
            <CampoLeitura label="Contato">{String(cliente.responsavel_nome ?? "—")}</CampoLeitura>
            <CampoLeitura label="E-mail">{String(cliente.email ?? "—")}</CampoLeitura>
            <CampoLeitura label="Telefone">{String(cliente.telefone ?? "—")}</CampoLeitura>
            <CampoLeitura label="Cliente desde">{dataBr(cliente.data_inicio as string)}</CampoLeitura>
            <CampoLeitura label="Origem">{String(cliente.origem ?? "—")}</CampoLeitura>
            <CampoLeitura label="Responsável de CS">
              {String(cliente.responsavel_cs ?? "—")}
            </CampoLeitura>
            <CampoLeitura label="Último contato de CS">
              {dataBr(cliente.ultimo_contato_cs as string)}
            </CampoLeitura>
            <CampoLeitura label="NPS">{cliente.nps === null ? "—" : String(cliente.nps)}</CampoLeitura>
            <CampoLeitura label="Cancelamento">
              {dataBr(cliente.data_cancelamento as string)}
            </CampoLeitura>
          </dl>
          {cliente.observacoes ? (
            <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-[var(--texto-suave)]">
              {String(cliente.observacoes)}
            </p>
          ) : null}
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle
            title="Onboarding"
            subtitle="Trilho administrativo comum a todos os clientes, mais o ramo da unidade de negócio"
          />

          {onboarding.length > 0 ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <Progresso
                  valor={concluidos}
                  max={onboarding.length}
                  tone={concluidos === onboarding.length ? "success" : "accent"}
                />
                <span className="shrink-0 text-xs font-semibold tabular-nums">
                  {concluidos}/{onboarding.length} · {pct((concluidos / onboarding.length) * 100, 0)}
                </span>
              </div>

              <OnboardingPainel itens={onboarding} />
            </>
          ) : (
            <Nota tone="info">
              Este cliente ainda não tem checklist de onboarding. Gere o trilho administrativo e o
              ramo correspondente — nada é liberado antes do pagamento ou do sinal.
            </Nota>
          )}

          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs font-semibold text-[var(--texto-suave)]">
              Gerar checklist a partir do manual
            </p>
            <OnboardingGerador
              clienteId={clienteId}
              ramos={Object.entries(TEMPLATES).map(([chave, valor]) => ({
                chave,
                rotulo: valor.rotulo,
              }))}
            />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle title="Últimas interações" subtitle="O cliente é acompanhado depois da venda, não só até ela" />
          {interacoes.length > 0 ? (
            <ol className="space-y-3">
              {interacoes.map((item) => (
                <li key={String(item.id)} className="border-l-2 pl-3" style={{ borderColor: "var(--borda-forte)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{dataBr(item.data as string)}</span>
                    <Badge tone="neutral">{String(item.canal)}</Badge>
                    <Badge tone={item.tipo === "cobranca" ? "danger" : "info"}>{String(item.tipo)}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-snug">{String(item.resumo)}</p>
                  {item.proximo_passo ? (
                    <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                      Próximo passo: {String(item.proximo_passo)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-6 text-center text-xs text-[var(--texto-fraco)]">
              Nenhuma interação registrada ainda.
            </p>
          )}
        </Card>

        <Card padding={false} className="p-4 sm:p-5">
          <ResourceView
            resourceKey="interacoes"
            compacto
            titulo="Registrar interação"
            filtrosFixos={{ cliente_id: clienteId }}
            valoresFixos={{ cliente_id: clienteId }}
            colunasOcultas={["cliente_id", "negociacao_id"]}
          />
        </Card>
      </div>

      <div className="mt-4 space-y-4">
        <Card>
          <ResourceView
            resourceKey="contratos"
            compacto
            titulo="Contratos deste cliente"
            filtrosFixos={{ cliente_id: clienteId }}
            valoresFixos={{ cliente_id: clienteId }}
            colunasOcultas={["cliente_id"]}
          />
        </Card>

        <Card>
          <ResourceView
            resourceKey="faturas"
            compacto
            titulo="Cobranças deste cliente"
            filtrosFixos={{ cliente_id: clienteId }}
            valoresFixos={{ cliente_id: clienteId }}
            colunasOcultas={["cliente_id"]}
          />
        </Card>

        <Card>
          <ResourceView
            resourceKey="chamados"
            compacto
            titulo="Chamados de suporte"
            filtrosFixos={{ cliente_id: clienteId }}
            valoresFixos={{ cliente_id: clienteId }}
            colunasOcultas={["cliente_id"]}
          />
        </Card>
      </div>
    </>
  );
}
