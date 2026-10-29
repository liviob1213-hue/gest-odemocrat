/**
 * Registro de recursos (metadados).
 *
 * Cada entidade do sistema e descrita uma unica vez aqui: colunas, tipos,
 * opcoes de select e relacionamentos. A partir desta descricao o sistema deriva
 * automaticamente:
 *
 *   - a API REST    (src/app/api/resources/[resource])
 *   - a validacao   (src/lib/validation.ts)
 *   - a tabela      (src/components/data-table.tsx)
 *   - o formulario  (src/components/record-form.tsx)
 *
 * Esse arquivo e compartilhado entre servidor e cliente: nao importe nada de
 * `server-only` aqui.
 */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

export type FieldType =
  | "text"
  | "textarea"
  | "lines" // texto multilinha em que cada linha e um item
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "month"
  | "select"
  | "boolean"
  | "ref";

export interface SelectOption {
  value: string;
  label: string;
  tone?: Tone;
}

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  /** Opcoes do select. */
  options?: SelectOption[];
  /** Relacionamento: resource de destino. */
  ref?: string;
  required?: boolean;
  /** Mostrar como coluna na tabela (padrao: true). */
  inTable?: boolean;
  /** Mostrar no formulario (padrao: true). */
  inForm?: boolean;
  /** Ocupa a largura inteira do formulario. */
  full?: boolean;
  help?: string;
  min?: number;
  max?: number;
  default?: string | number | boolean | null;
}

export interface ResourceDef {
  key: string;
  table: string;
  label: string;
  singular: string;
  group: string;
  /** Coluna usada como rotulo em relacionamentos. */
  labelField: string;
  fields: Field[];
  defaultOrder: string;
  searchFields: string[];
  description?: string;
  /** Recurso acessado apenas dentro de outro (nao ganha pagina propria). */
  nested?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Opcoes reutilizadas                                                         */
/* -------------------------------------------------------------------------- */

const DIRETORIAS: SelectOption[] = [
  { value: "Conselho", label: "Conselho de Socios", tone: "accent" },
  { value: "Administrativo", label: "Administrativo, Financeiro e Governanca", tone: "info" },
  { value: "Comercial", label: "Comercial, Growth e Marketing", tone: "success" },
  { value: "Desenvolvimento", label: "Desenvolvimento e Operacoes", tone: "warning" },
];

const PAPEIS_RACI: SelectOption[] = [
  { value: "R", label: "R - Responsavel", tone: "info" },
  { value: "A", label: "A - Aprovador", tone: "danger" },
  { value: "R/A", label: "R/A - Executa e aprova", tone: "accent" },
  { value: "C", label: "C - Consultado", tone: "warning" },
  { value: "I", label: "I - Informado", tone: "neutral" },
];

const MEIOS_PAGAMENTO: SelectOption[] = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartao" },
  { value: "kiwify", label: "Kiwify" },
  { value: "transferencia", label: "Transferencia" },
  { value: "dinheiro", label: "Dinheiro" },
];

const PRIORIDADES: SelectOption[] = [
  { value: "baixa", label: "Baixa", tone: "neutral" },
  { value: "media", label: "Media", tone: "warning" },
  { value: "alta", label: "Alta", tone: "danger" },
];

const PASTAS_DRIVE: SelectOption[] = [
  { value: "00_Governanca", label: "00_Governanca" },
  { value: "01_Admin_Financeiro", label: "01_Admin_Financeiro" },
  { value: "02_Comercial", label: "02_Comercial" },
  { value: "03_Produto_Operacoes", label: "03_Produto_Operacoes" },
  { value: "04_POPs", label: "04_POPs" },
];

/** Campos de auditoria presentes em todas as tabelas. */
export const AUDIT_FIELDS = ["id", "criado_em", "atualizado_em"];

/* -------------------------------------------------------------------------- */
/* Grupos de navegacao                                                         */
/* -------------------------------------------------------------------------- */

export const GROUPS: Record<string, { label: string; order: number }> = {
  crm: { label: "CRM e Clientes", order: 1 },
  financeiro: { label: "Financeiro", order: 2 },
  entrega: { label: "Entrega e Produto", order: 3 },
  governanca: { label: "Governanca", order: 4 },
  gestao: { label: "Gestao e Processos", order: 5 },
  juridico: { label: "Juridico e Societario", order: 6 },
  estrutura: { label: "Estrutura e Cadastros", order: 7 },
};

/* -------------------------------------------------------------------------- */
/* Recursos                                                                    */
/* -------------------------------------------------------------------------- */

export const RESOURCES: ResourceDef[] = [
  /* ------------------------------- Estrutura ------------------------------ */
  {
    key: "pessoas",
    table: "pessoas",
    label: "Pessoas e socios",
    singular: "Pessoa",
    group: "estrutura",
    labelField: "nome",
    defaultOrder: "t.tipo, t.nome",
    searchFields: ["nome", "email"],
    description:
      "Socios e contratados. A quota define a proporcao da distribuicao de lucros (40/30/30).",
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      {
        name: "tipo",
        label: "Vinculo",
        type: "select",
        required: true,
        options: [
          { value: "socio", label: "Socio", tone: "accent" },
          { value: "contratado", label: "Contratado", tone: "info" },
          { value: "prestador", label: "Prestador PJ", tone: "neutral" },
        ],
      },
      { name: "email", label: "E-mail", type: "text" },
      { name: "telefone", label: "Telefone", type: "text" },
      { name: "quota_pct", label: "Quota (%)", type: "percent", help: "Participacao societaria" },
      { name: "pro_labore", label: "Pro-labore", type: "currency", help: "Cl. 8a, § 5o" },
      { name: "ativo", label: "Ativo", type: "boolean", default: true },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "cadeiras",
    table: "cadeiras",
    label: "Cadeiras e organograma",
    singular: "Cadeira",
    group: "estrutura",
    labelField: "nome",
    defaultOrder: "CASE t.diretoria WHEN 'Conselho' THEN 0 WHEN 'Administrativo' THEN 1 WHEN 'Comercial' THEN 2 ELSE 3 END, t.vaga_aberta, t.nome",
    searchFields: ["nome", "responsabilidades"],
    description:
      "A empresa se organiza por cadeiras, nao por pessoas: cada funcao tem dono, rotina e indicador.",
    fields: [
      { name: "nome", label: "Cadeira", type: "text", required: true },
      { name: "diretoria", label: "Diretoria", type: "select", required: true, options: DIRETORIAS },
      { name: "clausula", label: "Clausula do contrato", type: "text" },
      { name: "ocupante_id", label: "Ocupante", type: "ref", ref: "pessoas" },
      { name: "vaga_aberta", label: "Vaga aberta", type: "boolean" },
      {
        name: "ordem_contratacao",
        label: "Ordem de contratacao",
        type: "number",
        help: "1 SDR/vendedor, 2 analista adm-financeiro, 3 suporte e CS",
      },
      { name: "responsabilidades", label: "Responsabilidades", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "unidades_negocio",
    table: "unidades_negocio",
    label: "Unidades de negocio",
    singular: "Unidade de negocio",
    group: "estrutura",
    labelField: "nome",
    defaultOrder: "t.id",
    searchFields: ["nome"],
    description:
      "Estrutura por funcao, resultado por unidade de negocio: o dinheiro e medido separado para Software, Educacao e Estrategia.",
    fields: [
      { name: "nome", label: "Unidade", type: "text", required: true },
      {
        name: "tipo_receita",
        label: "Tipo de receita",
        type: "select",
        options: [
          { value: "recorrente", label: "Recorrente (licenca mensal)", tone: "accent" },
          { value: "por_turma", label: "Por turma ou evento", tone: "info" },
          { value: "por_projeto", label: "Por projeto", tone: "warning" },
        ],
      },
      { name: "indicador_principal", label: "Indicador principal", type: "text", full: true },
      { name: "cor", label: "Cor", type: "text" },
      { name: "ativo", label: "Ativa", type: "boolean", default: true },
    ],
  },
  {
    key: "centros_custo",
    table: "centros_custo",
    label: "Centros de custo",
    singular: "Centro de custo",
    group: "estrutura",
    labelField: "nome",
    defaultOrder: "t.nome",
    searchFields: ["nome", "descricao"],
    description: "A gaveta onde cada despesa e classificada.",
    fields: [
      { name: "nome", label: "Centro de custo", type: "text", required: true },
      { name: "descricao", label: "Descricao", type: "textarea", full: true },
      { name: "ativo", label: "Ativo", type: "boolean", default: true },
    ],
  },
  {
    key: "plano_contas",
    table: "plano_contas",
    label: "Plano de contas",
    singular: "Conta",
    group: "estrutura",
    labelField: "nome",
    defaultOrder: "t.codigo",
    searchFields: ["codigo", "nome"],
    description: "Lista padronizada de todas as categorias de receita e despesa.",
    fields: [
      { name: "codigo", label: "Codigo", type: "text", required: true },
      { name: "nome", label: "Conta", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "receita", label: "Receita", tone: "success" },
          { value: "despesa", label: "Despesa", tone: "danger" },
        ],
      },
      {
        name: "natureza",
        label: "Natureza",
        type: "select",
        options: [
          { value: "fixo", label: "Fixo", tone: "warning" },
          { value: "variavel", label: "Variavel", tone: "neutral" },
        ],
      },
      { name: "centro_custo_id", label: "Centro de custo", type: "ref", ref: "centros_custo" },
      { name: "ativo", label: "Ativa", type: "boolean", default: true },
    ],
  },
  {
    key: "cultura",
    table: "cultura",
    label: "Cultura em regras",
    singular: "Pilar de cultura",
    group: "gestao",
    labelField: "pilar",
    defaultOrder: "t.ordem, t.id",
    searchFields: ["pilar", "exige"],
    description:
      "Cada valor so existe se tiver um comportamento que da pra cobrar. A gente contrata e desliga pelos valores.",
    fields: [
      { name: "pilar", label: "Pilar", type: "text", required: true },
      { name: "exige", label: "O que exige na pratica", type: "textarea", required: true, full: true },
      { name: "verificacao", label: "Como a gente verifica", type: "textarea", required: true, full: true },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
    ],
  },

  /* ---------------------------------- CRM --------------------------------- */
  {
    key: "clientes",
    table: "clientes",
    label: "Clientes",
    singular: "Cliente",
    group: "crm",
    labelField: "nome",
    defaultOrder: "t.nome",
    searchFields: ["nome", "documento", "responsavel_nome", "email", "cidade"],
    description: "Base de clientes de todas as unidades de negocio, com status e sucesso do cliente.",
    fields: [
      { name: "nome", label: "Cliente", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "gabinete", label: "Gabinete parlamentar", tone: "accent" },
          { value: "partido", label: "Partido", tone: "info" },
          { value: "orgao_publico", label: "Orgao publico", tone: "warning" },
          { value: "empresa", label: "Empresa", tone: "neutral" },
          { value: "pessoa_fisica", label: "Pessoa fisica", tone: "neutral" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "prospect", label: "Prospect", tone: "neutral" },
          { value: "onboarding", label: "Onboarding", tone: "info" },
          { value: "ativo", label: "Ativo", tone: "success" },
          { value: "em_risco", label: "Em risco", tone: "warning" },
          { value: "inadimplente", label: "Inadimplente", tone: "danger" },
          { value: "cancelado", label: "Cancelado", tone: "neutral" },
        ],
      },
      { name: "unidade_negocio_id", label: "Unidade de negocio", type: "ref", ref: "unidades_negocio" },
      { name: "documento", label: "CNPJ / CPF", type: "text" },
      { name: "responsavel_nome", label: "Contato no cliente", type: "text" },
      { name: "email", label: "E-mail", type: "text" },
      { name: "telefone", label: "Telefone", type: "text" },
      { name: "cidade", label: "Cidade", type: "text" },
      { name: "uf", label: "UF", type: "text" },
      {
        name: "origem",
        label: "Origem",
        type: "select",
        options: [
          { value: "indicacao", label: "Indicacao" },
          { value: "inbound", label: "Inbound" },
          { value: "prospeccao", label: "Prospeccao ativa" },
          { value: "evento", label: "Evento" },
          { value: "licitacao", label: "Licitacao / inexigibilidade" },
        ],
      },
      { name: "responsavel_cs_id", label: "Responsavel de CS", type: "ref", ref: "pessoas" },
      { name: "data_inicio", label: "Cliente desde", type: "date" },
      { name: "ultimo_contato_cs", label: "Ultimo contato de CS", type: "date" },
      { name: "nps", label: "NPS", type: "number", min: 0, max: 10 },
      { name: "setor_publico", label: "Setor publico", type: "boolean", inTable: false },
      { name: "data_cancelamento", label: "Data de cancelamento", type: "date", inTable: false },
      { name: "motivo_cancelamento", label: "Motivo do cancelamento", type: "text", inTable: false, full: true },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "negociacoes",
    table: "negociacoes",
    label: "Pipeline de vendas",
    singular: "Negociacao",
    group: "crm",
    labelField: "titulo",
    defaultOrder: "t.previsao_fechamento IS NULL, t.previsao_fechamento",
    searchFields: ["titulo", "lead_nome", "lead_contato"],
    description:
      "Funil por etapa. O pipeline ponderado (valor x probabilidade) deve ficar acima de 3x a meta do mes.",
    fields: [
      { name: "titulo", label: "Negociacao", type: "text", required: true },
      {
        name: "etapa",
        label: "Etapa",
        type: "select",
        required: true,
        options: [
          { value: "prospeccao", label: "Prospeccao", tone: "neutral" },
          { value: "qualificacao", label: "Qualificacao", tone: "info" },
          { value: "proposta", label: "Proposta", tone: "accent" },
          { value: "negociacao", label: "Negociacao", tone: "warning" },
          { value: "fechada_ganha", label: "Fechada - ganha", tone: "success" },
          { value: "fechada_perdida", label: "Fechada - perdida", tone: "danger" },
        ],
      },
      { name: "valor", label: "Valor", type: "currency", required: true },
      { name: "probabilidade", label: "Probabilidade (%)", type: "percent", min: 0, max: 100 },
      { name: "unidade_negocio_id", label: "Unidade de negocio", type: "ref", ref: "unidades_negocio" },
      { name: "cliente_id", label: "Cliente (se ja existe)", type: "ref", ref: "clientes" },
      { name: "lead_nome", label: "Lead", type: "text", help: "Quando ainda nao e cliente" },
      { name: "lead_contato", label: "Contato do lead", type: "text", inTable: false },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "data_abertura", label: "Aberta em", type: "date", inTable: false },
      { name: "previsao_fechamento", label: "Previsao de fechamento", type: "date" },
      { name: "data_fechamento", label: "Fechada em", type: "date", inTable: false },
      {
        name: "desconto_pct",
        label: "Desconto (%)",
        type: "percent",
        help: "Ate 15% o Diretor Comercial aprova sozinho; acima disso vai para a Quarta Oficial",
      },
      { name: "desconto_aprovado_por", label: "Desconto aprovado por", type: "text", inTable: false },
      { name: "proximo_passo", label: "Proximo passo", type: "text", full: true },
      { name: "motivo_perda", label: "Motivo da perda", type: "text", inTable: false, full: true },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "interacoes",
    table: "interacoes",
    label: "Interacoes",
    singular: "Interacao",
    group: "crm",
    labelField: "resumo",
    defaultOrder: "t.data DESC, t.id DESC",
    searchFields: ["resumo", "proximo_passo"],
    description: "Historico de relacionamento: o vinculo e o caminho.",
    fields: [
      { name: "data", label: "Data", type: "date", required: true },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes" },
      { name: "negociacao_id", label: "Negociacao", type: "ref", ref: "negociacoes" },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "comercial", label: "Comercial", tone: "info" },
          { value: "sucesso_cliente", label: "Sucesso do cliente", tone: "success" },
          { value: "suporte", label: "Suporte", tone: "warning" },
          { value: "cobranca", label: "Cobranca", tone: "danger" },
        ],
      },
      {
        name: "canal",
        label: "Canal",
        type: "select",
        options: [
          { value: "reuniao", label: "Reuniao" },
          { value: "ligacao", label: "Ligacao" },
          { value: "whatsapp", label: "WhatsApp" },
          { value: "email", label: "E-mail" },
          { value: "visita", label: "Visita" },
          { value: "suporte", label: "Suporte" },
        ],
      },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "resumo", label: "Resumo", type: "textarea", required: true, full: true },
      { name: "proximo_passo", label: "Proximo passo", type: "text", full: true },
    ],
  },
  {
    key: "onboarding_itens",
    table: "onboarding_itens",
    label: "Onboarding do cliente",
    singular: "Item de onboarding",
    group: "crm",
    labelField: "item",
    defaultOrder: "t.cliente_id, t.ordem, t.id",
    searchFields: ["item"],
    nested: true,
    description: "Fluxo do cliente: trilho administrativo + ramo de onboarding (cap. 09).",
    fields: [
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes", required: true },
      {
        name: "ramo",
        label: "Ramo",
        type: "select",
        required: true,
        options: [
          { value: "trilho", label: "Trilho administrativo", tone: "accent" },
          { value: "software", label: "Software (CRM)", tone: "info" },
          { value: "educacao", label: "Workshop ou curso", tone: "success" },
          { value: "estrategia", label: "Estrategia e marketing", tone: "warning" },
        ],
      },
      { name: "item", label: "Item", type: "text", required: true, full: true },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "prazo", label: "Prazo", type: "date" },
      { name: "concluido", label: "Concluido", type: "boolean" },
      { name: "concluido_em", label: "Concluido em", type: "date", inTable: false },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },

  /* ------------------------------ Financeiro ------------------------------ */
  {
    key: "lancamentos",
    table: "lancamentos",
    label: "Fluxo de caixa",
    singular: "Lancamento",
    group: "financeiro",
    labelField: "descricao",
    defaultOrder: "t.data DESC, t.id DESC",
    searchFields: ["descricao", "fornecedor", "documento", "observacoes"],
    description:
      "Todo lancamento recebe a etiqueta da unidade de negocio e do centro de custo. Assim o DRE mostra quanto cada braco da de lucro de verdade.",
    fields: [
      { name: "data", label: "Data", type: "date", required: true },
      { name: "descricao", label: "Descricao", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "receita", label: "Receita", tone: "success" },
          { value: "despesa", label: "Despesa", tone: "danger" },
        ],
      },
      { name: "valor", label: "Valor", type: "currency", required: true },
      {
        name: "status",
        label: "Situacao",
        type: "select",
        required: true,
        options: [
          { value: "previsto", label: "Previsto", tone: "warning" },
          { value: "realizado", label: "Realizado", tone: "success" },
          { value: "cancelado", label: "Cancelado", tone: "neutral" },
        ],
      },
      {
        name: "conta",
        label: "Conta",
        type: "select",
        required: true,
        options: [
          { value: "operacional", label: "Operacional", tone: "info" },
          { value: "reinvestimento", label: "Reinvestimento", tone: "accent" },
          { value: "impostos", label: "Impostos", tone: "warning" },
        ],
        help: "Contas separadas: operacional, reinvestimento e impostos",
      },
      { name: "unidade_negocio_id", label: "Unidade de negocio", type: "ref", ref: "unidades_negocio" },
      { name: "centro_custo_id", label: "Centro de custo", type: "ref", ref: "centros_custo" },
      { name: "plano_conta_id", label: "Conta do plano", type: "ref", ref: "plano_contas" },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes", inTable: false },
      { name: "competencia", label: "Competencia", type: "month", inTable: false },
      { name: "fornecedor", label: "Fornecedor", type: "text", inTable: false },
      { name: "meio_pagamento", label: "Meio de pagamento", type: "select", options: MEIOS_PAGAMENTO, inTable: false },
      { name: "custo_fixo", label: "Custo fixo", type: "boolean", help: "Entra no calculo de meses de reserva" },
      { name: "recorrente", label: "Recorrente", type: "boolean", inTable: false },
      { name: "conciliado", label: "Conciliado", type: "boolean", help: "Conciliacao bancaria toda segunda" },
      { name: "documento", label: "Documento / NF", type: "text", inTable: false },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "contratos",
    table: "contratos",
    label: "Contratos",
    singular: "Contrato",
    group: "financeiro",
    labelField: "numero",
    defaultOrder: "t.status, t.fim IS NULL, t.fim",
    searchFields: ["numero", "objeto", "observacoes"],
    description:
      "Contratos ativos com valor, vencimento e meio de pagamento - o primeiro item do financeiro no mes 1.",
    fields: [
      { name: "numero", label: "Numero", type: "text" },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes", required: true },
      { name: "unidade_negocio_id", label: "Unidade de negocio", type: "ref", ref: "unidades_negocio" },
      { name: "objeto", label: "Objeto", type: "text", full: true },
      { name: "valor", label: "Valor", type: "currency", required: true },
      {
        name: "periodicidade",
        label: "Periodicidade",
        type: "select",
        required: true,
        options: [
          { value: "mensal", label: "Mensal", tone: "accent" },
          { value: "trimestral", label: "Trimestral", tone: "info" },
          { value: "semestral", label: "Semestral", tone: "info" },
          { value: "anual", label: "Anual", tone: "warning" },
          { value: "unico", label: "Pagamento unico", tone: "neutral" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "rascunho", label: "Rascunho", tone: "neutral" },
          { value: "aguardando_assinatura", label: "Aguardando assinatura", tone: "warning" },
          { value: "ativo", label: "Ativo", tone: "success" },
          { value: "suspenso", label: "Suspenso", tone: "danger" },
          { value: "encerrado", label: "Encerrado", tone: "neutral" },
        ],
      },
      { name: "inicio", label: "Inicio", type: "date" },
      { name: "fim", label: "Fim", type: "date" },
      { name: "dia_vencimento", label: "Dia de vencimento", type: "number", min: 1, max: 31 },
      { name: "meio_pagamento", label: "Meio de pagamento", type: "select", options: MEIOS_PAGAMENTO },
      { name: "assinado", label: "Assinado", type: "boolean" },
      { name: "data_assinatura", label: "Data da assinatura", type: "date", inTable: false },
      { name: "renovacao_automatica", label: "Renovacao automatica", type: "boolean", inTable: false },
      {
        name: "inexigibilidade",
        label: "Inexigibilidade de licitacao",
        type: "boolean",
        inTable: false,
        help: "Venda publica por certidao de exclusividade (art. 74, I, Lei 14.133/2021)",
      },
      { name: "link_drive", label: "Link no drive", type: "text", inTable: false, full: true },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "faturas",
    table: "faturas",
    label: "Cobrancas e NFS-e",
    singular: "Fatura",
    group: "financeiro",
    labelField: "descricao",
    defaultOrder: "t.status = 'paga', t.vencimento",
    searchFields: ["descricao", "nfse_numero", "observacoes"],
    description:
      "Cobranca, nota e inadimplencia. A inadimplencia nao deve passar de 5% da receita do mes.",
    fields: [
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes", required: true },
      { name: "descricao", label: "Descricao", type: "text" },
      { name: "contrato_id", label: "Contrato", type: "ref", ref: "contratos", inTable: false },
      { name: "unidade_negocio_id", label: "Unidade de negocio", type: "ref", ref: "unidades_negocio" },
      { name: "competencia", label: "Competencia", type: "month" },
      { name: "valor", label: "Valor", type: "currency", required: true },
      { name: "vencimento", label: "Vencimento", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "aberta", label: "Aberta", tone: "info" },
          { value: "paga", label: "Paga", tone: "success" },
          { value: "vencida", label: "Vencida", tone: "danger" },
          { value: "negociada", label: "Negociada", tone: "warning" },
          { value: "cancelada", label: "Cancelada", tone: "neutral" },
        ],
      },
      { name: "pagamento", label: "Data do pagamento", type: "date" },
      { name: "valor_pago", label: "Valor pago", type: "currency", inTable: false },
      { name: "nfse_emitida", label: "NFS-e emitida", type: "boolean" },
      { name: "nfse_numero", label: "Numero da NFS-e", type: "text", inTable: false },
      { name: "tentativas_cobranca", label: "Tentativas de cobranca", type: "number" },
      { name: "ultima_cobranca", label: "Ultima cobranca", type: "date", inTable: false },
      { name: "meio_pagamento", label: "Meio de pagamento", type: "select", options: MEIOS_PAGAMENTO, inTable: false },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "fechamentos_mensais",
    table: "fechamentos_mensais",
    label: "Fechamentos mensais",
    singular: "Fechamento mensal",
    group: "financeiro",
    labelField: "competencia",
    defaultOrder: "t.competencia DESC",
    searchFields: ["competencia", "observacoes"],
    description:
      "Lucro, reinvestimento (50% ate 31/07/2027) e distribuicao na proporcao das quotas. Docs a contabilidade ate o dia 5; DRE fechado ate o dia 10.",
    fields: [
      { name: "competencia", label: "Competencia", type: "month", required: true },
      { name: "receita", label: "Receita", type: "currency" },
      { name: "custo", label: "Custo", type: "currency" },
      { name: "lucro_liquido", label: "Lucro liquido", type: "currency" },
      { name: "reinvestimento", label: "Reinvestimento", type: "currency" },
      { name: "distribuicao", label: "Distribuicao", type: "currency" },
      { name: "reserva_saldo", label: "Saldo da reserva", type: "currency" },
      { name: "reserva_meses", label: "Reserva (meses)", type: "number" },
      { name: "docs_contabilidade_em", label: "Docs a contabilidade", type: "date", inTable: false },
      { name: "dre_fechado_em", label: "DRE fechado em", type: "date", inTable: false },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "aberto", label: "Aberto", tone: "warning" },
          { value: "fechado", label: "Fechado", tone: "success" },
        ],
      },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "capital_parcelas",
    table: "capital_parcelas",
    label: "Integralizacao do capital",
    singular: "Parcela de capital",
    group: "financeiro",
    labelField: "descricao",
    defaultOrder: "t.vencimento",
    searchFields: ["descricao"],
    description: "Capital de R$ 30.000 integralizado em 3 parcelas anuais (Cl. 6a, item 6.2).",
    fields: [
      { name: "descricao", label: "Descricao", type: "text", required: true },
      { name: "vencimento", label: "Vencimento", type: "date", required: true },
      { name: "valor", label: "Valor", type: "currency", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "pendente", label: "Pendente", tone: "warning" },
          { value: "integralizada", label: "Integralizada", tone: "success" },
        ],
      },
      { name: "data_pagamento", label: "Data do pagamento", type: "date" },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },

  /* ------------------------------- Entrega -------------------------------- */
  {
    key: "eventos",
    table: "eventos",
    label: "Turmas e eventos",
    singular: "Evento",
    group: "entrega",
    labelField: "nome",
    defaultOrder: "t.data DESC",
    searchFields: ["nome", "cidade", "local"],
    description:
      "Unidade Educacao. Sinal de no minimo 50% antes de qualquer custo do evento; ocupacao abaixo de 60% a 15 dias e alerta.",
    fields: [
      { name: "nome", label: "Evento", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "workshop", label: "Workshop", tone: "accent" },
          { value: "curso", label: "Curso", tone: "info" },
          { value: "capacitacao", label: "Capacitacao", tone: "success" },
          { value: "palestra", label: "Palestra", tone: "neutral" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "planejado", label: "Planejado", tone: "neutral" },
          { value: "confirmado", label: "Confirmado", tone: "info" },
          { value: "realizado", label: "Realizado", tone: "success" },
          { value: "cancelado", label: "Cancelado", tone: "danger" },
        ],
      },
      { name: "data", label: "Data", type: "date" },
      { name: "data_fim", label: "Data final", type: "date", inTable: false },
      { name: "cidade", label: "Cidade", type: "text" },
      { name: "local", label: "Local", type: "text", inTable: false },
      { name: "vagas", label: "Vagas", type: "number" },
      { name: "inscritos", label: "Inscritos", type: "number" },
      { name: "preco_ingresso", label: "Preco por inscrito", type: "currency", inTable: false },
      { name: "receita_prevista", label: "Receita prevista", type: "currency", inTable: false },
      { name: "receita_realizada", label: "Receita realizada", type: "currency" },
      { name: "custo_previsto", label: "Custo previsto", type: "currency", inTable: false },
      { name: "custo_realizado", label: "Custo realizado", type: "currency" },
      { name: "sinal_recebido", label: "Sinal recebido", type: "currency", help: "Minimo 50% antes do primeiro custo" },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "material_enviado", label: "Material preparatorio enviado", type: "boolean", inTable: false },
      { name: "nps", label: "NPS", type: "number", min: 0, max: 100 },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "projetos",
    table: "projetos",
    label: "Projetos de estrategia",
    singular: "Projeto",
    group: "entrega",
    labelField: "nome",
    defaultOrder: "t.status, t.prazo_entrega",
    searchFields: ["nome", "observacoes"],
    description: "Unidade Estrategia e marketing: margem por projeto e prazo de entrega.",
    fields: [
      { name: "nome", label: "Projeto", type: "text", required: true },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes" },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "estrategia", label: "Estrategia", tone: "accent" },
          { value: "marketing", label: "Marketing", tone: "info" },
          { value: "consultoria", label: "Consultoria", tone: "warning" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "planejado", label: "Planejado", tone: "neutral" },
          { value: "em_andamento", label: "Em andamento", tone: "info" },
          { value: "em_aprovacao", label: "Em aprovacao", tone: "warning" },
          { value: "entregue", label: "Entregue", tone: "success" },
          { value: "cancelado", label: "Cancelado", tone: "danger" },
        ],
      },
      { name: "valor", label: "Valor", type: "currency", required: true },
      { name: "custo_previsto", label: "Custo previsto", type: "currency", inTable: false },
      { name: "custo_realizado", label: "Custo realizado", type: "currency" },
      { name: "kickoff", label: "Kickoff", type: "date" },
      { name: "prazo_entrega", label: "Prazo de entrega", type: "date" },
      { name: "entregue_em", label: "Entregue em", type: "date", inTable: false },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "relatorio_final", label: "Relatorio final ao cliente", type: "boolean", inTable: false },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "entregas",
    table: "entregas",
    label: "Entregas do projeto",
    singular: "Entrega",
    group: "entrega",
    labelField: "nome",
    defaultOrder: "t.projeto_id, t.prazo",
    searchFields: ["nome"],
    nested: true,
    fields: [
      { name: "projeto_id", label: "Projeto", type: "ref", ref: "projetos", required: true },
      { name: "nome", label: "Entrega", type: "text", required: true, full: true },
      { name: "prazo", label: "Prazo", type: "date" },
      { name: "entregue_em", label: "Entregue em", type: "date" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "pendente", label: "Pendente", tone: "neutral" },
          { value: "em_andamento", label: "Em andamento", tone: "info" },
          { value: "entregue", label: "Entregue", tone: "warning" },
          { value: "aprovada", label: "Aprovada", tone: "success" },
        ],
      },
      { name: "aprovada", label: "Aprovada pelo cliente", type: "boolean" },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "chamados",
    table: "chamados",
    label: "Suporte e SLA",
    singular: "Chamado",
    group: "entrega",
    labelField: "assunto",
    defaultOrder: "t.status = 'resolvido', t.abertura DESC",
    searchFields: ["assunto", "descricao"],
    description: "SLA de primeira resposta: 4h uteis. Acima disso e alerta na Quarta Oficial.",
    fields: [
      { name: "assunto", label: "Assunto", type: "text", required: true },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes" },
      {
        name: "severidade",
        label: "Severidade",
        type: "select",
        required: true,
        options: [
          { value: "baixa", label: "Baixa", tone: "neutral" },
          { value: "media", label: "Media", tone: "info" },
          { value: "alta", label: "Alta", tone: "warning" },
          { value: "critica", label: "Critica", tone: "danger" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "aberto", label: "Aberto", tone: "warning" },
          { value: "em_andamento", label: "Em andamento", tone: "info" },
          { value: "aguardando_cliente", label: "Aguardando cliente", tone: "neutral" },
          { value: "resolvido", label: "Resolvido", tone: "success" },
        ],
      },
      { name: "abertura", label: "Abertura", type: "date", required: true },
      { name: "primeira_resposta", label: "Primeira resposta", type: "date" },
      {
        name: "primeira_resposta_horas",
        label: "Primeira resposta (horas uteis)",
        type: "number",
        help: "SLA prometido: 4h uteis",
      },
      { name: "fechamento", label: "Fechamento", type: "date", inTable: false },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "incidente", label: "Incidente", type: "boolean", help: "Incidente com efeito contratual" },
      { name: "descricao", label: "Descricao", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "roadmap_itens",
    table: "roadmap_itens",
    label: "Roadmap do CRM e da IA",
    singular: "Item de roadmap",
    group: "entrega",
    labelField: "titulo",
    defaultOrder: "t.status, t.prioridade DESC",
    searchFields: ["titulo", "descricao"],
    description: "Prioridades decididas pela cadeira de Desenvolvimento, com o que os clientes pedem como insumo.",
    fields: [
      { name: "titulo", label: "Item", type: "text", required: true },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "feature", label: "Feature", tone: "accent" },
          { value: "melhoria", label: "Melhoria", tone: "info" },
          { value: "bug", label: "Bug", tone: "danger" },
          { value: "ia", label: "IA", tone: "success" },
          { value: "infraestrutura", label: "Infraestrutura", tone: "warning" },
        ],
      },
      { name: "prioridade", label: "Prioridade", type: "select", required: true, options: PRIORIDADES },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "backlog", label: "Backlog", tone: "neutral" },
          { value: "planejado", label: "Planejado", tone: "info" },
          { value: "em_desenvolvimento", label: "Em desenvolvimento", tone: "warning" },
          { value: "entregue", label: "Entregue", tone: "success" },
          { value: "descartado", label: "Descartado", tone: "neutral" },
        ],
      },
      {
        name: "origem",
        label: "Origem",
        type: "select",
        options: [
          { value: "cliente", label: "Pedido de cliente" },
          { value: "time", label: "Time" },
          { value: "estrategia", label: "Estrategia" },
        ],
      },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes", inTable: false },
      { name: "trimestre", label: "Trimestre", type: "text", help: "Ex.: 2027-T1" },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "descricao", label: "Descricao", type: "textarea", inTable: false, full: true },
    ],
  },

  /* ------------------------------ Governanca ------------------------------ */
  {
    key: "reunioes",
    table: "reunioes",
    label: "Quarta Oficial e rituais",
    singular: "Reuniao",
    group: "governanca",
    labelField: "data",
    defaultOrder: "t.data DESC",
    searchFields: ["presentes", "bloco4_gargalos", "para_proxima"],
    description:
      "Pauta enviada ate terca as 18h. Item que chega sem proposta de solucao nao entra. Toda decisao sai com dono e prazo.",
    fields: [
      {
        name: "tipo",
        label: "Ritual",
        type: "select",
        required: true,
        options: [
          { value: "quarta_oficial", label: "Quarta Oficial", tone: "accent" },
          { value: "fechamento_mensal", label: "Fechamento Mensal", tone: "info" },
          { value: "planejamento_trimestral", label: "Planejamento Trimestral", tone: "warning" },
          { value: "planejamento_anual", label: "Planejamento Anual", tone: "danger" },
          { value: "segunda_prioridades", label: "Segunda de Prioridades", tone: "neutral" },
        ],
      },
      { name: "data", label: "Data", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "agendada", label: "Agendada", tone: "warning" },
          { value: "realizada", label: "Realizada", tone: "success" },
          { value: "cancelada", label: "Cancelada", tone: "neutral" },
        ],
      },
      { name: "presentes", label: "Presentes", type: "text", full: true },
      { name: "pauta_enviada", label: "Pauta enviada ate terca 18h", type: "boolean" },
      { name: "caixa", label: "Caixa", type: "currency" },
      { name: "reserva_meses", label: "Reserva (meses)", type: "number" },
      { name: "mrr", label: "MRR", type: "currency" },
      { name: "vendas_fechadas", label: "Vendas fechadas", type: "currency" },
      { name: "inadimplencia_pct", label: "Inadimplencia (%)", type: "percent" },
      { name: "proximo_evento", label: "Proximo evento", type: "text", inTable: false },
      { name: "bloco0_abertura", label: "0. Abertura - revisao do Registro de Decisoes", type: "textarea", inTable: false, full: true },
      { name: "bloco1_admin", label: "1. Admin e financeiro", type: "textarea", inTable: false, full: true },
      { name: "bloco2_comercial", label: "2. Comercial e growth", type: "textarea", inTable: false, full: true },
      { name: "bloco3_produto", label: "3. Produto e entrega", type: "textarea", inTable: false, full: true },
      { name: "bloco4_gargalos", label: "4. Gargalos e decisoes", type: "textarea", inTable: false, full: true },
      { name: "para_proxima", label: "Para a proxima quarta", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "decisoes",
    table: "decisoes",
    label: "Registro de Decisoes",
    singular: "Decisao",
    group: "governanca",
    labelField: "decisao",
    defaultOrder: "t.status = 'entregue', t.prazo IS NULL, t.prazo",
    searchFields: ["decisao", "contexto"],
    description:
      "A memoria da empresa: toda decisao com dono, prazo e status. Revisado na abertura de toda Quarta Oficial. Meta de entrega no prazo: 80%.",
    fields: [
      { name: "data", label: "Data", type: "date", required: true },
      { name: "decisao", label: "Decisao", type: "textarea", required: true, full: true },
      { name: "dono_id", label: "Dono", type: "ref", ref: "pessoas" },
      { name: "prazo", label: "Prazo", type: "date" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "pendente", label: "Pendente", tone: "warning" },
          { value: "em_andamento", label: "Em andamento", tone: "info" },
          { value: "entregue", label: "Entregue", tone: "success" },
          { value: "atrasada", label: "Atrasada", tone: "danger" },
          { value: "cancelada", label: "Cancelada", tone: "neutral" },
        ],
      },
      { name: "entregue_em", label: "Entregue em", type: "date" },
      { name: "diretoria", label: "Diretoria", type: "select", options: DIRETORIAS },
      {
        name: "alcada",
        label: "Alcada",
        type: "select",
        options: [
          { value: "diretor_area", label: "Diretor da area (ja orcado)" },
          { value: "diretor_ate_1000", label: "Diretor, despesa nova ate R$ 1.000" },
          { value: "quarta_maioria", label: "Quarta Oficial, maioria" },
          { value: "unanimidade", label: "Unanimidade (Cl. 8a, § 4o)" },
        ],
      },
      { name: "reuniao_id", label: "Reuniao", type: "ref", ref: "reunioes", inTable: false },
      { name: "contexto", label: "Contexto", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "prioridades",
    table: "prioridades",
    label: "Prioridades da semana",
    singular: "Prioridade",
    group: "governanca",
    labelField: "descricao",
    defaultOrder: "t.semana DESC, t.diretoria",
    searchFields: ["descricao"],
    description: "As 3 prioridades de cada diretoria na semana, definidas na Segunda de Prioridades.",
    fields: [
      { name: "semana", label: "Semana (segunda-feira)", type: "date", required: true },
      { name: "diretoria", label: "Diretoria", type: "select", required: true, options: DIRETORIAS },
      { name: "descricao", label: "Prioridade", type: "text", required: true, full: true },
      { name: "dono_id", label: "Dono", type: "ref", ref: "pessoas" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "pendente", label: "Pendente", tone: "warning" },
          { value: "em_andamento", label: "Em andamento", tone: "info" },
          { value: "concluida", label: "Concluida", tone: "success" },
          { value: "nao_feita", label: "Nao feita", tone: "danger" },
        ],
      },
    ],
  },
  {
    key: "alcadas",
    table: "alcadas",
    label: "Alcadas de decisao",
    singular: "Alcada",
    group: "governanca",
    labelField: "tipo_decisao",
    defaultOrder: "t.ordem, t.id",
    searchFields: ["tipo_decisao", "quem_decide"],
    description:
      "O contrato permite que qualquer socio assine sozinho; as alcadas sao o acordo interno de quem decide o que sem reuniao.",
    fields: [
      { name: "tipo_decisao", label: "Tipo de decisao", type: "text", required: true, full: true },
      { name: "quem_decide", label: "Quem decide", type: "text", required: true, full: true },
      { name: "onde_registra", label: "Onde fica registrado", type: "text", required: true },
      { name: "limite_valor", label: "Limite de valor", type: "currency" },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
    ],
  },
  {
    key: "rituais",
    table: "rituais",
    label: "Calendario de rituais",
    singular: "Ritual",
    group: "governanca",
    labelField: "nome",
    defaultOrder: "t.ordem, t.id",
    searchFields: ["nome", "foco"],
    description:
      "Cada ritual tem um horizonte diferente e nao invade o do outro. Decisao estrategica so vale se passar pela Quarta Oficial.",
    fields: [
      { name: "nome", label: "Ritual", type: "text", required: true },
      { name: "quando", label: "Quando", type: "text", required: true },
      { name: "duracao", label: "Duracao", type: "text" },
      { name: "participantes", label: "Quem", type: "text" },
      { name: "foco", label: "Foco", type: "textarea", full: true },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
      { name: "ativo", label: "Ativo", type: "boolean", default: true },
    ],
  },

  /* ----------------------------- Gestao / POPs ---------------------------- */
  {
    key: "pops",
    table: "pops",
    label: "Biblioteca de POPs",
    singular: "POP",
    group: "gestao",
    labelField: "codigo",
    defaultOrder: "t.prioridade, t.codigo",
    searchFields: ["codigo", "nome", "objetivo"],
    description:
      "Nenhum processo vive na cabeca de um socio: se acontece mais de duas vezes, vira um POP de uma pagina.",
    fields: [
      { name: "codigo", label: "Codigo", type: "text", required: true },
      { name: "nome", label: "Procedimento", type: "text", required: true },
      { name: "cadeira_dona", label: "Cadeira dona", type: "text", required: true },
      { name: "versao", label: "Versao", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "pendente", label: "A escrever", tone: "danger" },
          { value: "rascunho", label: "Rascunho", tone: "warning" },
          { value: "publicado", label: "Publicado", tone: "success" },
          { value: "em_revisao", label: "Em revisao", tone: "info" },
        ],
      },
      { name: "revisao", label: "Periodicidade de revisao", type: "text" },
      { name: "ultima_revisao", label: "Ultima revisao", type: "date" },
      { name: "objetivo", label: "Objetivo", type: "textarea", inTable: false, full: true },
      { name: "quando_usar", label: "Quando usar (gatilho)", type: "textarea", inTable: false, full: true },
      { name: "responsavel", label: "Responsavel (R)", type: "text", inTable: false },
      { name: "aprovador", label: "Aprovador (A)", type: "text", inTable: false },
      { name: "passos", label: "Passo a passo", type: "lines", inTable: false, full: true, help: "Um passo por linha" },
      { name: "checklist", label: "Checklist de conclusao", type: "lines", inTable: false, full: true, help: "Um item por linha" },
      { name: "link_drive", label: "Link no drive", type: "text", inTable: false, full: true },
      { name: "prioridade", label: "Ordem de prioridade", type: "number", inTable: false },
    ],
  },
  {
    key: "raci",
    table: "raci",
    label: "Matriz RACI",
    singular: "Atividade RACI",
    group: "gestao",
    labelField: "atividade",
    defaultOrder: "t.ordem, t.id",
    searchFields: ["atividade"],
    description:
      "R executa, A responde pelo resultado (so um por atividade), C opina antes, I e avisado depois. As colunas sao cadeiras, nao pessoas.",
    fields: [
      { name: "atividade", label: "Atividade", type: "text", required: true, full: true },
      { name: "administrador", label: "Administrador", type: "select", options: PAPEIS_RACI },
      { name: "administrador_nota", label: "Administrador - o que faz", type: "textarea", inTable: false, full: true },
      { name: "comercial", label: "Comercial", type: "select", options: PAPEIS_RACI },
      { name: "comercial_nota", label: "Comercial - o que faz", type: "textarea", inTable: false, full: true },
      { name: "desenvolvimento", label: "Desenvolvimento", type: "select", options: PAPEIS_RACI },
      { name: "desenvolvimento_nota", label: "Desenvolvimento - o que faz", type: "textarea", inTable: false, full: true },
      { name: "observacao", label: "Observacao", type: "text", full: true },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
    ],
  },
  {
    key: "indicadores",
    table: "indicadores",
    label: "Indicadores por diretoria",
    singular: "Indicador",
    group: "gestao",
    labelField: "nome",
    defaultOrder: "t.ordem, t.id",
    searchFields: ["nome", "descricao_alerta"],
    description:
      "Cada diretoria responde por no maximo 4 numeros, revisados toda quarta. As metas saem do primeiro Planejamento Trimestral.",
    fields: [
      { name: "nome", label: "Indicador", type: "text", required: true },
      { name: "diretoria", label: "Diretoria", type: "select", required: true, options: DIRETORIAS },
      {
        name: "frequencia",
        label: "Frequencia",
        type: "select",
        required: true,
        options: [
          { value: "semanal", label: "Semanal", tone: "info" },
          { value: "mensal", label: "Mensal", tone: "accent" },
          { value: "por_evento", label: "Por evento", tone: "warning" },
        ],
      },
      {
        name: "unidade",
        label: "Unidade",
        type: "select",
        required: true,
        options: [
          { value: "numero", label: "Numero" },
          { value: "moeda", label: "Reais" },
          { value: "percentual", label: "Percentual" },
          { value: "meses", label: "Meses" },
          { value: "nota", label: "Nota" },
        ],
      },
      {
        name: "alerta_operador",
        label: "Alerta quando",
        type: "select",
        required: true,
        options: [
          { value: "menor", label: "Valor abaixo do limite" },
          { value: "maior", label: "Valor acima do limite" },
        ],
      },
      { name: "alerta_valor", label: "Limite de alerta", type: "number" },
      { name: "meta", label: "Meta", type: "number" },
      { name: "descricao_alerta", label: "Sinal de alerta (texto)", type: "text", full: true },
      { name: "calculo_automatico", label: "Chave de calculo automatico", type: "text", inTable: false, help: "Preenchido quando o sistema calcula sozinho" },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
      { name: "ativo", label: "Ativo", type: "boolean", default: true },
    ],
  },
  {
    key: "indicador_leituras",
    table: "indicador_leituras",
    label: "Leituras de indicadores",
    singular: "Leitura",
    group: "gestao",
    labelField: "valor",
    defaultOrder: "t.data DESC, t.id DESC",
    searchFields: ["observacoes"],
    nested: true,
    fields: [
      { name: "indicador_id", label: "Indicador", type: "ref", ref: "indicadores", required: true },
      { name: "data", label: "Data", type: "date", required: true },
      { name: "valor", label: "Valor", type: "number", required: true },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },

  /* ------------------------------- Juridico ------------------------------- */
  {
    key: "documentos",
    table: "documentos",
    label: "Documentos e certidoes",
    singular: "Documento",
    group: "juridico",
    labelField: "nome",
    defaultOrder: "t.validade IS NULL, t.validade",
    searchFields: ["nome", "observacoes"],
    description:
      "Drive oficial e fonte unica da verdade: documento fora do drive oficial nao existe. Inclui o kit de venda publica com controle de validade.",
    fields: [
      { name: "nome", label: "Documento", type: "text", required: true },
      {
        name: "categoria",
        label: "Categoria",
        type: "select",
        required: true,
        options: [
          { value: "certidao", label: "Certidao", tone: "warning" },
          { value: "contrato", label: "Contrato", tone: "info" },
          { value: "atestado", label: "Atestado de capacidade tecnica", tone: "success" },
          { value: "ata", label: "Ata", tone: "accent" },
          { value: "societario", label: "Societario", tone: "danger" },
          { value: "modelo", label: "Modelo", tone: "neutral" },
          { value: "outro", label: "Outro", tone: "neutral" },
        ],
      },
      { name: "pasta_drive", label: "Pasta no drive", type: "select", options: PASTAS_DRIVE },
      { name: "cliente_id", label: "Cliente", type: "ref", ref: "clientes", inTable: false },
      { name: "emissao", label: "Emissao", type: "date" },
      { name: "validade", label: "Validade", type: "date" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "valido", label: "Valido", tone: "success" },
          { value: "vencido", label: "Vencido", tone: "danger" },
          { value: "pendente", label: "Pendente", tone: "warning" },
          { value: "nao_aplicavel", label: "Nao aplicavel", tone: "neutral" },
        ],
      },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "link", label: "Link", type: "text", inTable: false, full: true },
      { name: "observacoes", label: "Observacoes", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "clausulas",
    table: "clausulas",
    label: "Clausulas e governanca",
    singular: "Clausula",
    group: "juridico",
    labelField: "clausula",
    defaultOrder: "t.ordem, t.id",
    searchFields: ["clausula", "resumo", "aplicacao"],
    description:
      "O contrato social define as funcoes, o capital e a regra de lucros; o manual transforma essas clausulas em rotina.",
    fields: [
      { name: "clausula", label: "Clausula", type: "text", required: true },
      {
        name: "documento",
        label: "Documento",
        type: "select",
        required: true,
        options: [
          { value: "contrato_social", label: "Contrato social", tone: "accent" },
          { value: "acordo_socios", label: "Acordo de socios", tone: "warning" },
          { value: "contrato_licenca", label: "Contrato de licenca", tone: "info" },
        ],
      },
      { name: "resumo", label: "O que diz", type: "textarea", required: true, full: true },
      { name: "aplicacao", label: "Como entra na gestao", type: "textarea", full: true },
      { name: "ordem", label: "Ordem", type: "number", inTable: false },
    ],
  },
  {
    key: "pendencias",
    table: "pendencias",
    label: "Pendencias e correcoes",
    singular: "Pendencia",
    group: "juridico",
    labelField: "titulo",
    defaultOrder: "t.status = 'resolvida', CASE t.prioridade WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END",
    searchFields: ["titulo", "descricao", "origem"],
    description:
      "Tudo que o manual aponta como pendente: correcoes no contrato social, acordo de socios, contrato modelo, LGPD fase 2 e tributario.",
    fields: [
      { name: "titulo", label: "Pendencia", type: "text", required: true, full: true },
      {
        name: "categoria",
        label: "Categoria",
        type: "select",
        required: true,
        options: [
          { value: "societario", label: "Societario", tone: "danger" },
          { value: "contrato_modelo", label: "Contrato modelo", tone: "warning" },
          { value: "lgpd", label: "LGPD e compliance", tone: "info" },
          { value: "tributario", label: "Tributario", tone: "accent" },
          { value: "financeiro", label: "Financeiro", tone: "success" },
          { value: "comercial", label: "Comercial", tone: "neutral" },
          { value: "produto", label: "Produto", tone: "neutral" },
          { value: "juridico", label: "Juridico", tone: "danger" },
        ],
      },
      { name: "prioridade", label: "Prioridade", type: "select", required: true, options: PRIORIDADES },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "aberta", label: "Aberta", tone: "danger" },
          { value: "em_andamento", label: "Em andamento", tone: "warning" },
          { value: "resolvida", label: "Resolvida", tone: "success" },
          { value: "descartada", label: "Descartada", tone: "neutral" },
        ],
      },
      { name: "responsavel_id", label: "Responsavel", type: "ref", ref: "pessoas" },
      { name: "prazo", label: "Prazo", type: "date" },
      { name: "origem", label: "Origem no manual", type: "text" },
      { name: "descricao", label: "Descricao", type: "textarea", inTable: false, full: true },
    ],
  },
  {
    key: "glossario",
    table: "glossario",
    label: "Glossario",
    singular: "Termo",
    group: "juridico",
    labelField: "termo",
    defaultOrder: "t.categoria, t.termo",
    searchFields: ["termo", "definicao", "na_democratia"],
    description: "Todo termo tecnico do manual, explicado do jeito que se explicaria para um contratado no primeiro dia.",
    fields: [
      { name: "termo", label: "Termo", type: "text", required: true },
      {
        name: "categoria",
        label: "Categoria",
        type: "select",
        required: true,
        options: [
          { value: "gestao", label: "Gestao e rotina", tone: "accent" },
          { value: "financeiro", label: "Financeiro", tone: "success" },
          { value: "comercial", label: "Comercial e produto", tone: "info" },
          { value: "juridico", label: "Societario e juridico", tone: "warning" },
        ],
      },
      { name: "definicao", label: "O que e", type: "textarea", required: true, full: true },
      { name: "na_democratia", label: "Na DEMOCRAT.IA", type: "textarea", full: true },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Acessores                                                                   */
/* -------------------------------------------------------------------------- */

const byKey = new Map(RESOURCES.map((r) => [r.key, r]));

export function getResource(key: string): ResourceDef | undefined {
  return byKey.get(key);
}

export function requireResource(key: string): ResourceDef {
  const resource = byKey.get(key);
  if (!resource) throw new Error(`Recurso desconhecido: ${key}`);
  return resource;
}

export function tableFields(resource: ResourceDef): Field[] {
  return resource.fields.filter((f) => f.inTable !== false);
}

export function formFields(resource: ResourceDef): Field[] {
  return resource.fields.filter((f) => f.inForm !== false);
}

export function refFields(resource: ResourceDef): Field[] {
  return resource.fields.filter((f) => f.type === "ref" && f.ref);
}
