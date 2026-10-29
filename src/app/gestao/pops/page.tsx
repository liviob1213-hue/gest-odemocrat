import { all } from "@/lib/db";
import { dataBr } from "@/lib/format";
import { Badge, Card, CardTitle, Nota, PageHeader, Stat } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

const TOM_STATUS: Record<string, "neutral" | "info" | "success" | "warning" | "danger"> = {
  pendente: "danger",
  rascunho: "warning",
  publicado: "success",
  em_revisao: "info",
};

const ROTULO_STATUS: Record<string, string> = {
  pendente: "A escrever",
  rascunho: "Rascunho",
  publicado: "Publicado",
  em_revisao: "Em revisão",
};

function linhas(texto: unknown): string[] {
  return String(texto ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);
}

export default async function PopsPage() {
  const pops = await all<Record<string, unknown>>(
    "SELECT * FROM pops ORDER BY prioridade, codigo",
  );

  const publicados = pops.filter((pop) => pop.status === "publicado").length;
  const pendentes = pops.filter((pop) => pop.status === "pendente").length;

  return (
    <>
      <PageHeader
        capitulo="05 · Biblioteca de POPs"
        titulo="Procedimentos Operacionais Padrão"
        descricao="Nenhum processo vive na cabeça de um sócio: se acontece mais de duas vezes, vira um procedimento escrito de uma página. Todo POP tem dono (cadeira, não pessoa) e revisão trimestral."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="POPs mapeados" value={String(pops.length)} />
        <Stat label="Publicados" value={String(publicados)} tone="success" />
        <Stat
          label="Ainda a escrever"
          value={String(pendentes)}
          tone={pendentes > 0 ? "danger" : "success"}
        />
      </div>

      {pendentes > 0 ? (
        <div className="mt-4">
          <Nota tone="warning">
            {pendentes} POP(s) prioritário(s) ainda não escrito(s). O conteúdo abaixo é o esqueleto
            que o manual define; preencha os passos e publique para que a biblioteca saia do papel.
          </Nota>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {pops.map((pop) => {
          const passos = linhas(pop.passos);
          const checklist = linhas(pop.checklist);
          const status = String(pop.status);

          return (
            <Card key={String(pop.id)}>
              <header className="mb-3 flex items-start justify-between gap-3 border-b pb-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-[var(--destaque)]">
                    {String(pop.codigo)}
                  </p>
                  <h2 className="text-sm font-semibold">{String(pop.nome)}</h2>
                  <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                    Versão {String(pop.versao)} · Dono: {String(pop.cadeira_dona)} · Revisão{" "}
                    {String(pop.revisao)}
                    {pop.ultima_revisao
                      ? ` · última em ${dataBr(pop.ultima_revisao as string)}`
                      : ""}
                  </p>
                </div>
                <Badge tone={TOM_STATUS[status] ?? "neutral"}>
                  {ROTULO_STATUS[status] ?? status}
                </Badge>
              </header>

              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
                    Objetivo
                  </dt>
                  <dd className="leading-snug">{String(pop.objetivo ?? "—")}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
                    Quando usar
                  </dt>
                  <dd className="leading-snug">{String(pop.quando_usar ?? "—")}</dd>
                </div>
                <div className="flex gap-6">
                  <div>
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
                      Responsável (R)
                    </dt>
                    <dd>{String(pop.responsavel ?? "—")}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
                      Aprovador (A)
                    </dt>
                    <dd>{String(pop.aprovador ?? "—")}</dd>
                  </div>
                </div>
              </dl>

              {passos.length > 0 ? (
                <div className="mt-3">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
                    Passo a passo
                  </p>
                  <ol className="mt-1 space-y-1">
                    {passos.map((passo, indice) => (
                      <li key={passo} className="flex gap-2 text-sm leading-snug">
                        <span className="shrink-0 font-semibold text-[var(--texto-fraco)]">
                          {indice + 1}.
                        </span>
                        <span>{passo}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {checklist.length > 0 ? (
                <div className="mt-3 rounded-lg bg-[var(--superficie-2)] p-3">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
                    Checklist de conclusão
                  </p>
                  <ul className="mt-1 space-y-1">
                    {checklist.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-snug">
                        <span className="shrink-0 text-[var(--texto-fraco)]">☐</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <ResourceView resourceKey="pops" compacto titulo="Editar a biblioteca de POPs" />
      </div>
    </>
  );
}
