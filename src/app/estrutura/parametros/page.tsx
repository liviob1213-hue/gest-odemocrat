import { all, verificarConexao } from "@/lib/db";
import { Card, CardTitle, Nota, PageHeader } from "@/components/ui";
import { FormularioParametros } from "@/components/formulario-parametros";
import { AcoesDemo } from "@/components/acoes-demo";

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  const conexao = await verificarConexao();
  const parametros = await all<{ chave: string; valor: string | null; descricao: string | null }>(
    "SELECT chave, valor, descricao FROM configuracoes ORDER BY chave",
  );

  return (
    <>
      <PageHeader
        capitulo="06 · O que precisa existir no primeiro mês"
        titulo="Parâmetros do sistema"
        descricao="Os números que o sistema usa para calcular reserva de caixa, alertas e a regra de reinvestimento. Preencha o custo fixo mensal e o saldo inicial para que o painel pare de estimar e passe a medir."
      />
      <Card className="mb-4">
        <CardTitle
          title="Banco de dados"
          subtitle="Os dados ficam no seu projeto do Supabase, não neste computador"
        />
        <Nota tone={conexao.ok ? "success" : "danger"}>{conexao.mensagem}</Nota>
      </Card>

      <FormularioParametros parametros={parametros} />
      <div className="mt-4">
        <AcoesDemo />
      </div>
    </>
  );
}
