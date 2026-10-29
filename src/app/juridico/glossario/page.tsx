import { all } from "@/lib/db";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

const CATEGORIAS = [
  { chave: "gestao", titulo: "Gestão e rotina" },
  { chave: "financeiro", titulo: "Financeiro" },
  { chave: "comercial", titulo: "Comercial e produto" },
  { chave: "juridico", titulo: "Societário e jurídico" },
];

export default async function GlossarioPage() {
  const termos = await all<Record<string, unknown>>(
    "SELECT * FROM glossario ORDER BY categoria, termo",
  );

  return (
    <>
      <PageHeader
        capitulo="12 · Glossário"
        titulo="Glossário"
        descricao="Todo termo técnico do manual, explicado do jeito que se explicaria para um contratado no primeiro dia."
      />

      <div className="space-y-4">
        {CATEGORIAS.map((categoria) => {
          const lista = termos.filter((termo) => termo.categoria === categoria.chave);
          if (lista.length === 0) return null;

          return (
            <Card key={categoria.chave}>
              <CardTitle title={categoria.titulo} subtitle={`${lista.length} termo(s)`} />
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                {lista.map((termo) => (
                  <div key={String(termo.id)} className="border-b pb-3 last:border-b-0">
                    <p className="text-sm font-semibold">{String(termo.termo)}</p>
                    <p className="mt-0.5 text-sm leading-snug text-[var(--texto-suave)]">
                      {String(termo.definicao)}
                    </p>
                    {termo.na_democratia ? (
                      <p className="mt-1 text-xs leading-snug text-[var(--destaque)]">
                        Na DEMOCRAT.IA: {String(termo.na_democratia)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <ResourceView resourceKey="glossario" compacto titulo="Editar o glossário" />
      </div>
    </>
  );
}
