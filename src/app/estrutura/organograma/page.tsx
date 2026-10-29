import { all } from "@/lib/db";
import { Badge, Card, CardTitle, Nota, PageHeader } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

const DIRETORIAS = [
  {
    chave: "Administrativo",
    titulo: "Administrativo, Financeiro e Governança",
    clausula: "Administrador · Cl. 8ª, § 1º",
    cor: "var(--info)",
  },
  {
    chave: "Comercial",
    titulo: "Comercial, Growth e Marketing",
    clausula: "Comercial · Cl. 8ª, § 2º",
    cor: "var(--positivo)",
  },
  {
    chave: "Desenvolvimento",
    titulo: "Desenvolvimento e Operações",
    clausula: "Desenvolvimento · Cl. 8ª, § 3º",
    cor: "var(--atencao)",
  },
];

export default async function OrganogramaPage() {
  const cadeiras = await all<Record<string, unknown>>(
    `SELECT c.*, p.nome AS ocupante
       FROM cadeiras c
       LEFT JOIN pessoas p ON p.id = c.ocupante_id
      ORDER BY c.vaga_aberta, c.ordem_contratacao NULLS LAST, c.nome`,
  );
  const unidades = await all<Record<string, unknown>>(
    "SELECT * FROM unidades_negocio WHERE ativo = true ORDER BY id",
  );
  const vagas = cadeiras
    .filter((cadeira) => cadeira.vaga_aberta === true)
    .sort((a, b) => Number(a.ordem_contratacao ?? 99) - Number(b.ordem_contratacao ?? 99));

  const conselho = cadeiras.find((cadeira) => cadeira.diretoria === "Conselho");

  return (
    <>
      <PageHeader
        capitulo="03 · Organograma escalável"
        titulo="Organograma"
        descricao="A empresa se organiza por cadeiras, não por pessoas: cada função tem dono, rotina e indicador, e quem entrar no time senta numa cadeira que já existe. Hoje os 3 sócios ocupam várias cadeiras ao mesmo tempo."
      />

      {conselho ? (
        <Card className="mb-4">
          <div className="text-center">
            <p className="text-sm font-semibold">{String(conselho.nome)}</p>
            <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
              {String(conselho.responsabilidades ?? "")}
            </p>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {DIRETORIAS.map((diretoria) => {
          const daDiretoria = cadeiras.filter(
            (cadeira) => cadeira.diretoria === diretoria.chave,
          );
          const titular = daDiretoria.find((cadeira) => cadeira.vaga_aberta !== true);
          const abertas = daDiretoria.filter((cadeira) => cadeira.vaga_aberta === true);

          return (
            <Card key={diretoria.chave}>
              <div
                className="mb-3 border-l-[3px] pl-3"
                style={{ borderColor: diretoria.cor }}
              >
                <h2 className="text-sm font-semibold">{diretoria.titulo}</h2>
                <p className="text-xs text-[var(--texto-suave)]">{diretoria.clausula}</p>
              </div>

              {titular ? (
                <div className="mb-3 rounded-lg bg-[var(--superficie-2)] p-3">
                  <p className="text-xs font-semibold text-[var(--texto-fraco)]">Ocupante</p>
                  <p className="text-sm font-medium">{String(titular.ocupante ?? "Cadeira vaga")}</p>
                  <ul className="mt-2 space-y-0.5">
                    {String(titular.responsabilidades ?? "")
                      .split(";")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .map((item) => (
                        <li key={item} className="text-xs text-[var(--texto-suave)]">
                          · {item}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {abertas.map((cadeira) => (
                <div
                  key={String(cadeira.id)}
                  className="mb-2 rounded-lg border border-dashed p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{String(cadeira.nome)}</span>
                    <Badge tone="warning">
                      {cadeira.ordem_contratacao
                        ? `${cadeira.ordem_contratacao}ª contratação`
                        : "vaga"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                    {String(cadeira.responsabilidades ?? "")}
                  </p>
                </div>
              ))}
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardTitle
          title="Resultado medido por unidade de negócio"
          subtitle="Workshops, estratégia e software não viram departamentos novos: são unidades que atravessam as três diretorias"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {unidades.map((unidade) => (
            <div
              key={String(unidade.id)}
              className="rounded-lg border-l-[3px] bg-[var(--superficie-2)] p-3"
              style={{ borderColor: String(unidade.cor ?? "var(--destaque)") }}
            >
              <p className="text-sm font-semibold">{String(unidade.nome)}</p>
              <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
                {String(unidade.indicador_principal ?? "")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {vagas.length > 0 ? (
        <div className="mt-4">
          <Nota tone="info">
            Ordem natural de contratação quando o time crescer:{" "}
            {vagas
              .map((vaga, indice) => `(${indice + 1}) ${String(vaga.nome)}`)
              .join(", ")}
            . Nenhuma dessas entradas muda o desenho do organograma.
          </Nota>
        </div>
      ) : null}

      <div className="mt-6">
        <ResourceView resourceKey="cadeiras" compacto titulo="Cadeiras" />
      </div>
    </>
  );
}
