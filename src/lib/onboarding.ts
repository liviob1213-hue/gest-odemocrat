import "server-only";

import { all, run } from "./db";

/**
 * Fluxo do cliente: da venda ao fechamento (cap. 09 do manual).
 *
 * Todo cliente passa pelo mesmo trilho administrativo antes de receber qualquer
 * entrega; o que muda e so o ramo de onboarding.
 */

export const RAMOS = ["trilho", "software", "educacao", "estrategia"] as const;
export type Ramo = (typeof RAMOS)[number];

export const TEMPLATES: Record<Ramo, { rotulo: string; itens: string[] }> = {
  trilho: {
    rotulo: "Trilho administrativo (todos os clientes)",
    itens: [
      "Venda fechada e registrada no CRM (Comercial)",
      "Contrato emitido e assinado (Administrador)",
      "Cobranca emitida (Administrador)",
      "NFS-e emitida (Administrador)",
      "Pagamento ou sinal confirmado - nada e liberado antes disso",
      "Receita lancada com a etiqueta da unidade de negocio",
    ],
  },
  software: {
    rotulo: "Software (CRM)",
    itens: [
      "Libera acessos e perfis",
      "Treina a equipe do gabinete",
      "CS acompanha o uso em 30 dias",
      "Cliente marcado como ativado",
    ],
  },
  educacao: {
    rotulo: "Workshop ou curso",
    itens: [
      "Confirma agenda e local",
      "Envia material preparatorio",
      "Executa o evento",
      "Coleta o NPS",
    ],
  },
  estrategia: {
    rotulo: "Estrategia e marketing",
    itens: [
      "Kickoff e cronograma",
      "Entregas com aprovacao do cliente",
      "Relatorio final ao cliente",
    ],
  },
};

/**
 * Gera o checklist de onboarding de um cliente, sem duplicar itens que ja
 * existam. Devolve quantos itens foram criados.
 */
export async function gerarOnboarding(clienteId: number, ramos: Ramo[]): Promise<number> {
  const jaExistem = await all<{ ramo: string; item: string }>(
    "SELECT ramo, item FROM onboarding_itens WHERE cliente_id = ?",
    [clienteId],
  );
  const existentes = new Set(jaExistem.map((row) => `${row.ramo}::${row.item}`));

  let criados = 0;
  for (const ramo of ramos) {
    const template = TEMPLATES[ramo];
    if (!template) continue;

    for (const [indice, item] of template.itens.entries()) {
      if (existentes.has(`${ramo}::${item}`)) continue;
      await run(
        `INSERT INTO onboarding_itens (cliente_id, ramo, ordem, item)
         VALUES (?, ?, ?, ?)`,
        [clienteId, ramo, indice + 1, item],
      );
      criados += 1;
    }
  }

  return criados;
}
