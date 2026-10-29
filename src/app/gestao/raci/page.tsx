import { all } from "@/lib/db";
import { Badge, Card, CardTitle, Nota, PageHeader } from "@/components/ui";
import { ResourceView } from "@/components/resource-view";

export const dynamic = "force-dynamic";

const TOM_PAPEL: Record<string, "neutral" | "info" | "success" | "warning" | "danger" | "accent"> = {
  R: "info",
  A: "danger",
  "R/A": "accent",
  C: "warning",
  I: "neutral",
};

const LEGENDA = [
  {
    letra: "R",
    nome: "Responsável",
    significa: "Quem executa",
    pratica: "Põe a mão na massa e entrega a tarefa",
    regra: "Pode haver mais de um R",
  },
  {
    letra: "A",
    nome: "Aprovador",
    significa: "Quem responde pelo resultado",
    pratica: 'Dá o "ok" final e é cobrado se der errado',
    regra: "Só um A por atividade",
  },
  {
    letra: "C",
    nome: "Consultado",
    significa: "Quem opina antes",
    pratica: "É ouvido antes da decisão; a opinião dele muda o resultado",
    regra: "Conversa de mão dupla",
  },
  {
    letra: "I",
    nome: "Informado",
    significa: "Quem é avisado depois",
    pratica: "Fica sabendo do resultado para não ser pego de surpresa",
    regra: "Comunicação de mão única",
  },
];

function Papel({ papel, nota }: { papel: unknown; nota: unknown }) {
  if (!papel) return <span className="text-[var(--texto-fraco)]">—</span>;
  return (
    <div>
      <Badge tone={TOM_PAPEL[String(papel)] ?? "neutral"}>{String(papel)}</Badge>
      {nota ? (
        <p className="mt-1 text-xs leading-snug text-[var(--texto-suave)]">{String(nota)}</p>
      ) : null}
    </div>
  );
}

export default async function RaciPage() {
  const matriz = await all<Record<string, unknown>>("SELECT * FROM raci ORDER BY ordem, id");

  // Checagem de consistencia: uma atividade com dois aprovadores quebra a regra.
  const comDoisAprovadores = matriz.filter((linha) => {
    const papeis = [linha.administrador, linha.comercial, linha.desenvolvimento]
      .map((papel) => String(papel ?? ""))
      .filter((papel) => papel === "A" || papel === "R/A");
    return papeis.length > 1;
  });

  return (
    <>
      <PageHeader
        capitulo="10 · Matriz RACI"
        titulo="Matriz RACI"
        descricao="Para cada atividade: quem faz, quem responde pelo resultado, quem opina antes e quem só precisa saber depois. As colunas são cadeiras do contrato social (Cl. 8ª), não pessoas — quando um analista for contratado, ele assume o R e o diretor fica com o A."
      />

      <Card>
        <CardTitle title="Como ler as letras" />
        <table className="tabela">
          <thead>
            <tr>
              <th className="w-16">Letra</th>
              <th>Significa</th>
              <th>Na prática</th>
              <th>Regra</th>
            </tr>
          </thead>
          <tbody>
            {LEGENDA.map((item) => (
              <tr key={item.letra}>
                <td>
                  <Badge tone={TOM_PAPEL[item.letra]}>{item.letra}</Badge>
                </td>
                <td>
                  <span className="font-medium">{item.nome}</span> — {item.significa}
                </td>
                <td className="text-[var(--texto-suave)]">{item.pratica}</td>
                <td className="text-[var(--texto-suave)]">{item.regra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {comDoisAprovadores.length > 0 ? (
        <div className="mt-4">
          <Nota tone="warning">
            {comDoisAprovadores.length} atividade(s) com mais de um aprovador (A ou R/A). A regra é
            só um A por atividade — exceto orçamento anual e contratação, cujo A é coletivo na
            Quarta Oficial.
          </Nota>
        </div>
      ) : null}

      <Card className="mt-4">
        <CardTitle
          title="O que cada cadeira faz em cada situação"
          subtitle="Orçamento anual e contratação têm A coletivo na Quarta Oficial, conforme as alçadas"
        />
        <div className="overflow-x-auto">
          <table className="tabela">
            <thead>
              <tr>
                <th className="min-w-[180px]">Atividade</th>
                <th className="min-w-[220px]">Administrador</th>
                <th className="min-w-[220px]">Comercial</th>
                <th className="min-w-[220px]">Desenvolvimento e Ferramenta</th>
              </tr>
            </thead>
            <tbody>
              {matriz.map((linha) => (
                <tr key={String(linha.id)}>
                  <td>
                    <span className="font-medium">{String(linha.atividade)}</span>
                    {linha.observacao ? (
                      <p className="mt-0.5 text-xs text-[var(--texto-fraco)]">
                        {String(linha.observacao)}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <Papel papel={linha.administrador} nota={linha.administrador_nota} />
                  </td>
                  <td>
                    <Papel papel={linha.comercial} nota={linha.comercial_nota} />
                  </td>
                  <td>
                    <Papel papel={linha.desenvolvimento} nota={linha.desenvolvimento_nota} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6">
        <ResourceView resourceKey="raci" compacto titulo="Editar a matriz" />
      </div>
    </>
  );
}
