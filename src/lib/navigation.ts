/** Estrutura do menu lateral. Espelha os capitulos do manual. */

export interface NavItem {
  label: string;
  href: string;
  /** Nome do icone em lucide-react. */
  icon: string;
  hint?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_PAINEL: NavItem = {
  label: "Painel",
  href: "/",
  icon: "LayoutDashboard",
  hint: "Numero aberto entre os socios",
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "CRM e Clientes",
    items: [
      { label: "Pipeline de vendas", href: "/crm/pipeline", icon: "Kanban" },
      { label: "Clientes", href: "/crm/clientes", icon: "Users" },
      { label: "Interacoes", href: "/crm/interacoes", icon: "MessagesSquare" },
      { label: "Onboarding", href: "/crm/onboarding", icon: "ListChecks" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Fluxo de caixa", href: "/financeiro/fluxo-de-caixa", icon: "ArrowRightLeft" },
      { label: "DRE por unidade", href: "/financeiro/dre", icon: "ChartColumnBig" },
      { label: "Contratos", href: "/financeiro/contratos", icon: "FileSignature" },
      { label: "Cobrancas e NFS-e", href: "/financeiro/cobrancas", icon: "ReceiptText" },
      { label: "Fechamento mensal", href: "/financeiro/fechamentos", icon: "CalendarCheck" },
      { label: "Capital e socios", href: "/financeiro/capital", icon: "Landmark" },
    ],
  },
  {
    label: "Entrega e Produto",
    items: [
      { label: "Turmas e eventos", href: "/entrega/eventos", icon: "GraduationCap" },
      { label: "Projetos", href: "/entrega/projetos", icon: "FolderKanban" },
      { label: "Entregas", href: "/entrega/entregas", icon: "PackageCheck" },
      { label: "Suporte e SLA", href: "/entrega/chamados", icon: "Headset" },
      { label: "Roadmap", href: "/entrega/roadmap", icon: "Route" },
    ],
  },
  {
    label: "Governanca",
    items: [
      { label: "Quarta Oficial", href: "/governanca/quarta-oficial", icon: "Gavel" },
      { label: "Registro de Decisoes", href: "/governanca/decisoes", icon: "ClipboardList" },
      { label: "Prioridades da semana", href: "/governanca/prioridades", icon: "Target" },
      { label: "Alcadas de decisao", href: "/governanca/alcadas", icon: "ShieldCheck" },
      { label: "Calendario de rituais", href: "/governanca/rituais", icon: "CalendarDays" },
    ],
  },
  {
    label: "Gestao e Processos",
    items: [
      { label: "Indicadores", href: "/gestao/indicadores", icon: "Gauge" },
      { label: "Biblioteca de POPs", href: "/gestao/pops", icon: "BookOpenCheck" },
      { label: "Matriz RACI", href: "/gestao/raci", icon: "Grid3x3" },
      { label: "Cultura em regras", href: "/gestao/cultura", icon: "HeartHandshake" },
    ],
  },
  {
    label: "Juridico e Societario",
    items: [
      { label: "Pendencias", href: "/juridico/pendencias", icon: "TriangleAlert" },
      { label: "Documentos e certidoes", href: "/juridico/documentos", icon: "FolderOpen" },
      { label: "Clausulas", href: "/juridico/clausulas", icon: "Scale" },
      { label: "Glossario", href: "/juridico/glossario", icon: "BookA" },
    ],
  },
  {
    label: "Estrutura",
    items: [
      { label: "Organograma", href: "/estrutura/organograma", icon: "Network" },
      { label: "Pessoas e socios", href: "/estrutura/pessoas", icon: "UserRound" },
      { label: "Unidades de negocio", href: "/estrutura/unidades", icon: "Boxes" },
      { label: "Centros de custo", href: "/estrutura/centros-custo", icon: "Wallet" },
      { label: "Plano de contas", href: "/estrutura/plano-de-contas", icon: "ListTree" },
      { label: "Parametros do sistema", href: "/estrutura/parametros", icon: "Settings" },
    ],
  },
];
