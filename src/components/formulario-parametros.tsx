"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";

import { salvarConfiguracoes } from "@/lib/api-client";
import { Card, CardTitle, Nota } from "@/components/ui";

/**
 * Edicao dos parametros do sistema. A lista de chaves e fechada no servidor,
 * entao a tela nao consegue criar configuracoes novas por engano.
 */

interface Parametro {
  chave: string;
  valor: string | null;
  descricao: string | null;
}

const GRUPOS: { titulo: string; subtitulo: string; chaves: string[] }[] = [
  {
    titulo: "Identificação da empresa",
    subtitulo: "Usada nos cabeçalhos e nos documentos",
    chaves: ["empresa_nome", "empresa_marca", "empresa_cnpj", "empresa_cidade"],
  },
  {
    titulo: "Caixa e reserva",
    subtitulo:
      "Reserva de 6 meses de custo fixo é a meta; abaixo de 3 meses é alerta vermelho na Quarta Oficial",
    chaves: ["saldo_inicial_caixa", "custo_fixo_mensal", "reserva_meta_meses", "reserva_alerta_meses"],
  },
  {
    titulo: "Regra de lucros (Cláusula 9ª)",
    subtitulo: "50% do lucro líquido reinvestido nos primeiros 12 meses",
    chaves: ["reinvestimento_pct", "reinvestimento_ate"],
  },
  {
    titulo: "Metas comerciais",
    subtitulo: "O pipeline ponderado precisa ficar acima de 3x a meta do mês",
    chaves: ["meta_mrr", "meta_vendas_mes", "desconto_limite_comercial"],
  },
  {
    titulo: "Entrega e eventos",
    subtitulo: "SLA de suporte e sinal mínimo antes de qualquer custo de evento",
    chaves: ["sla_primeira_resposta_horas", "sinal_minimo_evento_pct"],
  },
];

export function FormularioParametros({ parametros }: { parametros: Parametro[] }) {
  const router = useRouter();
  const mapa = Object.fromEntries(parametros.map((item) => [item.chave, item]));
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(parametros.map((item) => [item.chave, item.valor ?? ""])),
  );
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    setErro(null);
    try {
      await salvarConfiguracoes(valores);
      setMensagem("Parâmetros salvos. O painel já está usando os novos valores.");
      router.refresh();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  const soltos = parametros.filter(
    (item) => !GRUPOS.some((grupo) => grupo.chaves.includes(item.chave)),
  );

  function campo(chave: string) {
    const parametro = mapa[chave];
    if (!parametro) return null;
    const ehData = chave.endsWith("_ate");

    return (
      <div key={chave}>
        <label className="rotulo" htmlFor={`param-${chave}`}>
          {chave.replace(/_/g, " ")}
        </label>
        <input
          id={`param-${chave}`}
          className="campo"
          type={ehData ? "date" : "text"}
          value={valores[chave] ?? ""}
          onChange={(evento) =>
            setValores((anterior) => ({ ...anterior, [chave]: evento.target.value }))
          }
        />
        {parametro.descricao ? (
          <p className="mt-1 text-xs leading-snug text-[var(--texto-suave)]">
            {parametro.descricao}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {GRUPOS.map((grupo) => (
        <Card key={grupo.titulo}>
          <CardTitle title={grupo.titulo} subtitle={grupo.subtitulo} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {grupo.chaves.map((chave) => campo(chave))}
          </div>
        </Card>
      ))}

      {soltos.length > 0 ? (
        <Card>
          <CardTitle title="Outros parâmetros" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {soltos.map((item) => campo(item.chave))}
          </div>
        </Card>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primario" onClick={() => void salvar()} disabled={salvando}>
          {salvando ? <Loader2 className="size-4 girando" /> : <Save className="size-4" />}
          Salvar parâmetros
        </button>
        {mensagem ? <span className="text-xs text-[var(--positivo)]">{mensagem}</span> : null}
        {erro ? <span className="text-xs text-[var(--negativo)]">{erro}</span> : null}
      </div>

      <Nota tone="info">
        O manual recomenda começar o controle de receitas e despesas antes de construir o sistema
        próprio — &ldquo;sistema próprio automatiza um processo que já funciona; não cria o
        processo&rdquo;. Use o botão de exportar backup na barra lateral para levar os dados a uma
        planilha ou ERP sempre que precisar.
      </Nota>
    </div>
  );
}
