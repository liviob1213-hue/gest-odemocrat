import "server-only";

import { all, one, sum, type Row } from "./db";

/**
 * Motor de indicadores.
 *
 * Calcula, a partir dos lancamentos, contratos, faturas e do CRM, os 12
 * indicadores do capitulo 11 do manual e os compara com os sinais de alerta
 * cadastrados. Tudo que o painel e a Quarta Oficial mostram sai daqui.
 */

/* -------------------------------------------------------------------------- */
/* Datas e configuracao                                                        */
/* -------------------------------------------------------------------------- */

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function competenciaAtual(): string {
  return hoje().slice(0, 7);
}

/** Lista das ultimas N competencias, da mais antiga para a mais recente. */
export function ultimasCompetencias(quantidade: number, fim = competenciaAtual()): string[] {
  const [ano, mes] = fim.split("-").map(Number);
  const saida: string[] = [];
  for (let i = quantidade - 1; i >= 0; i -= 1) {
    const data = new Date(Date.UTC(ano, mes - 1 - i, 1));
    saida.push(data.toISOString().slice(0, 7));
  }
  return saida;
}

export async function getConfig(): Promise<Record<string, string>> {
  const rows = await all<{ chave: string; valor: string | null }>(
    "SELECT chave, valor FROM configuracoes",
  );
  return Object.fromEntries(rows.map((row) => [row.chave, row.valor ?? ""]));
}

function configNumber(config: Record<string, string>, chave: string, padrao = 0): number {
  const valor = Number(config[chave]);
  return Number.isFinite(valor) ? valor : padrao;
}

/* -------------------------------------------------------------------------- */
/* Caixa e reserva                                                             */
/* -------------------------------------------------------------------------- */

/** Saldo de caixa: tudo que ja foi realizado, mais o saldo inicial informado. */
export async function saldoCaixa(config: Record<string, string>): Promise<number> {
  const realizado = await sum(
    `SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS total
       FROM lancamentos
      WHERE status = 'realizado'`,
  );
  return configNumber(config, "saldo_inicial_caixa") + realizado;
}

/** Saldo por conta (operacional, reinvestimento, impostos). */
export async function saldoPorConta(): Promise<{ conta: string; saldo: number }[]> {
  return all<{ conta: string; saldo: number }>(
    `SELECT conta,
            COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS saldo
       FROM lancamentos
      WHERE status = 'realizado'
      GROUP BY conta
      ORDER BY conta`,
  );
}

/**
 * Custo fixo mensal. Usa o valor configurado; se ainda nao houver, estima pela
 * media dos ultimos 3 meses de despesas marcadas como custo fixo.
 */
export async function custoFixoMensal(
  config: Record<string, string>,
): Promise<{ valor: number; origem: "configurado" | "estimado" }> {
  const configurado = configNumber(config, "custo_fixo_mensal");
  if (configurado > 0) return { valor: configurado, origem: "configurado" };

  const meses = ultimasCompetencias(3);
  const total = await sum(
    `SELECT COALESCE(SUM(valor), 0) AS total
       FROM lancamentos
      WHERE tipo = 'despesa' AND custo_fixo = true AND status = 'realizado'
        AND COALESCE(competencia, to_char(data, 'YYYY-MM')) IN (?, ?, ?)`,
    meses,
  );
  return { valor: total / 3, origem: "estimado" };
}

export async function reservaMeses(config: Record<string, string>): Promise<number | null> {
  const { valor } = await custoFixoMensal(config);
  if (valor <= 0) return null;
  return (await saldoCaixa(config)) / valor;
}

/* -------------------------------------------------------------------------- */
/* Receita recorrente e inadimplencia                                          */
/* -------------------------------------------------------------------------- */

const FATOR_PERIODICIDADE: Record<string, number> = {
  mensal: 1,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
  unico: 0,
};

/** MRR: soma das licencas ativas normalizada para o mes. */
export async function mrr(): Promise<number> {
  const rows = await all<{ periodicidade: string; valor: number }>(
    `SELECT periodicidade, valor
       FROM contratos
      WHERE status = 'ativo'`,
  );
  return rows.reduce(
    (total, row) => total + row.valor * (FATOR_PERIODICIDADE[row.periodicidade] ?? 0),
    0,
  );
}

export async function inadimplencia(): Promise<{
  valor: number;
  percentual: number | null;
  faturas: number;
}> {
  const vencido = await one<{ total: number; quantidade: number }>(
    `SELECT COALESCE(SUM(valor - COALESCE(valor_pago, 0)), 0) AS total,
            COUNT(*) AS quantidade
       FROM faturas
      WHERE status IN ('aberta', 'vencida', 'negociada') AND vencimento < current_date`,
  );

  const faturadoMes = await sum(
    `SELECT COALESCE(SUM(valor), 0) AS total
       FROM faturas
      WHERE COALESCE(competencia, to_char(vencimento, 'YYYY-MM')) = ?
        AND status <> 'cancelada'`,
    [competenciaAtual()],
  );

  const valor = Number(vencido?.total ?? 0);
  return {
    valor,
    percentual: faturadoMes > 0 ? (valor / faturadoMes) * 100 : null,
    faturas: Number(vencido?.quantidade ?? 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Pipeline                                                                    */
/* -------------------------------------------------------------------------- */

const ETAPAS_ABERTAS = ["prospeccao", "qualificacao", "proposta", "negociacao"];

export async function pipeline(): Promise<{
  total: number;
  ponderado: number;
  quantidade: number;
}> {
  const row = await one<{ total: number; ponderado: number; quantidade: number }>(
    `SELECT COALESCE(SUM(valor), 0) AS total,
            COALESCE(SUM(valor * probabilidade / 100.0), 0) AS ponderado,
            COUNT(*) AS quantidade
       FROM negociacoes
      WHERE etapa IN (${ETAPAS_ABERTAS.map(() => "?").join(", ")})`,
    ETAPAS_ABERTAS,
  );
  return {
    total: Number(row?.total ?? 0),
    ponderado: Number(row?.ponderado ?? 0),
    quantidade: Number(row?.quantidade ?? 0),
  };
}

export async function pipelinePorEtapa(): Promise<
  { etapa: string; total: number; ponderado: number; quantidade: number }[]
> {
  return all(
    `SELECT etapa,
            COALESCE(SUM(valor), 0) AS total,
            COALESCE(SUM(valor * probabilidade / 100.0), 0) AS ponderado,
            COUNT(*) AS quantidade
       FROM negociacoes
      GROUP BY etapa`,
  );
}

export async function vendasFechadasMes(competencia = competenciaAtual()): Promise<number> {
  return sum(
    `SELECT COALESCE(SUM(valor), 0) AS total
       FROM negociacoes
      WHERE etapa = 'fechada_ganha' AND to_char(data_fechamento, 'YYYY-MM') = ?`,
    [competencia],
  );
}

/* -------------------------------------------------------------------------- */
/* Base de clientes: churn e ativacao                                          */
/* -------------------------------------------------------------------------- */

export async function baseClientes() {
  const row = await one<{
    ativos: number;
    em_risco: number;
    inadimplentes: number;
    onboarding: number;
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'ativo') AS ativos,
       COUNT(*) FILTER (WHERE status = 'em_risco') AS em_risco,
       COUNT(*) FILTER (WHERE status = 'inadimplente') AS inadimplentes,
       COUNT(*) FILTER (WHERE status = 'onboarding') AS onboarding
     FROM clientes`,
  );
  return {
    ativos: Number(row?.ativos ?? 0),
    emRisco: Number(row?.em_risco ?? 0),
    inadimplentes: Number(row?.inadimplentes ?? 0),
    onboarding: Number(row?.onboarding ?? 0),
  };
}

/** Churn do mes: cancelamentos sobre a base que existia no inicio do mes. */
export async function churnMes(competencia = competenciaAtual()): Promise<number | null> {
  const cancelados = await sum(
    `SELECT COUNT(*) AS total
       FROM clientes
      WHERE to_char(data_cancelamento, 'YYYY-MM') = ?`,
    [competencia],
  );
  const baseInicio = await sum(
    `SELECT COUNT(*) AS total
       FROM clientes
      WHERE data_inicio IS NOT NULL AND data_inicio < ?::date
        AND (data_cancelamento IS NULL OR to_char(data_cancelamento, 'YYYY-MM') >= ?)`,
    [`${competencia}-01`, competencia],
  );
  if (baseInicio <= 0) return null;
  return (cancelados / baseInicio) * 100;
}

/**
 * Ativacao: proporcao da base ativa com registro de uso/contato nos ultimos 30
 * dias. Enquanto o CRM proprio nao expor telemetria, o proxy e a interacao
 * registrada (o manual pede "clientes usando o CRM toda semana").
 */
export async function ativacaoPct(): Promise<number | null> {
  const { ativos } = await baseClientes();
  if (ativos <= 0) return null;
  const comUso = await sum(
    `SELECT COUNT(DISTINCT c.id) AS total
       FROM clientes c
      WHERE c.status = 'ativo'
        AND (
          c.ultimo_contato_cs >= current_date - INTERVAL '30 days'
          OR EXISTS (
            SELECT 1 FROM interacoes i
             WHERE i.cliente_id = c.id AND i.data >= current_date - INTERVAL '30 days'
          )
        )`,
  );
  return (comUso / ativos) * 100;
}

/* -------------------------------------------------------------------------- */
/* Governanca: decisoes no prazo                                               */
/* -------------------------------------------------------------------------- */

export async function decisoesNoPrazo(): Promise<{
  percentual: number | null;
  entregues: number;
  avaliadas: number;
  atrasadas: number;
}> {
  const row = await one<{ avaliadas: number; no_prazo: number }>(
    `SELECT COUNT(*) AS avaliadas,
            COUNT(*) FILTER (
              WHERE entregue_em IS NOT NULL AND prazo IS NOT NULL AND entregue_em <= prazo
            ) AS no_prazo
       FROM decisoes
      WHERE status IN ('entregue', 'atrasada')
         OR (status IN ('pendente', 'em_andamento') AND prazo IS NOT NULL AND prazo < current_date)`,
  );
  const atrasadas = await sum(
    `SELECT COUNT(*) AS total
       FROM decisoes
      WHERE status IN ('pendente', 'em_andamento', 'atrasada')
        AND prazo IS NOT NULL AND prazo < current_date`,
  );

  const avaliadas = Number(row?.avaliadas ?? 0);
  const noPrazo = Number(row?.no_prazo ?? 0);
  return {
    percentual: avaliadas > 0 ? (noPrazo / avaliadas) * 100 : null,
    entregues: noPrazo,
    avaliadas,
    atrasadas,
  };
}

/* -------------------------------------------------------------------------- */
/* Educacao e suporte                                                          */
/* -------------------------------------------------------------------------- */

export async function ocupacaoProximosEventos(): Promise<Row[]> {
  return all<Row>(
    `SELECT id, nome, data, vagas, inscritos, sinal_recebido, receita_prevista, status,
            CASE WHEN vagas > 0 THEN (inscritos * 100.0 / vagas) ELSE NULL END AS ocupacao_pct,
            (data - current_date) AS dias_para_evento
       FROM eventos
      WHERE status IN ('planejado', 'confirmado') AND data IS NOT NULL
      ORDER BY data`,
  );
}

export async function npsEventos(): Promise<number | null> {
  const row = await one<{ media: number | null }>(
    `SELECT AVG(nps)::float8 AS media
       FROM eventos
      WHERE nps IS NOT NULL AND status = 'realizado'`,
  );
  return row?.media ?? null;
}

export async function slaSuporte(): Promise<{
  mediaHoras: number | null;
  foraDoSla: number;
  abertos: number;
}> {
  const row = await one<{ media: number | null; fora: number }>(
    `SELECT AVG(primeira_resposta_horas)::float8 AS media,
            COUNT(*) FILTER (WHERE primeira_resposta_horas > 4) AS fora
       FROM chamados
      WHERE primeira_resposta_horas IS NOT NULL`,
  );
  const abertos = await sum(
    `SELECT COUNT(*) AS total FROM chamados WHERE status <> 'resolvido'`,
  );
  return {
    mediaHoras: row?.media ?? null,
    foraDoSla: Number(row?.fora ?? 0),
    abertos,
  };
}

/* -------------------------------------------------------------------------- */
/* DRE por unidade de negocio                                                  */
/* -------------------------------------------------------------------------- */

export interface LinhaDre {
  unidade: string;
  unidadeId: number | null;
  receita: number;
  custo: number;
  resultado: number;
  margemPct: number | null;
}

export async function dre(competencia: string, incluirPrevisto = false): Promise<LinhaDre[]> {
  const statusFiltro = incluirPrevisto ? "('realizado', 'previsto')" : "('realizado')";

  const rows = await all<{
    unidade_id: number | null;
    unidade: string | null;
    receita: number;
    custo: number;
  }>(
    `SELECT l.unidade_negocio_id AS unidade_id,
            u.nome AS unidade,
            u.id AS ordem,
            COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) AS receita,
            COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0) AS custo
       FROM lancamentos l
       LEFT JOIN unidades_negocio u ON u.id = l.unidade_negocio_id
      WHERE l.status IN ${statusFiltro}
        AND COALESCE(l.competencia, to_char(l.data, 'YYYY-MM')) = ?
      GROUP BY l.unidade_negocio_id, u.nome, u.id
      ORDER BY u.id NULLS LAST`,
    [competencia],
  );

  return rows.map((row) => {
    const resultado = row.receita - row.custo;
    return {
      unidade: row.unidade ?? "Nao alocado (overhead)",
      unidadeId: row.unidade_id,
      receita: row.receita,
      custo: row.custo,
      resultado,
      margemPct: row.receita > 0 ? (resultado / row.receita) * 100 : null,
    };
  });
}

/** Serie mensal de receita, despesa e resultado. */
export async function serieMensal(
  meses = 12,
): Promise<{ competencia: string; receita: number; despesa: number; resultado: number }[]> {
  const competencias = ultimasCompetencias(meses);
  const rows = await all<{ competencia: string; receita: number; despesa: number }>(
    `SELECT COALESCE(competencia, to_char(data, 'YYYY-MM')) AS competencia,
            COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receita,
            COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesa
       FROM lancamentos
      WHERE status = 'realizado'
      GROUP BY 1`,
  );
  const mapa = new Map(rows.map((row) => [row.competencia, row]));

  return competencias.map((competencia) => {
    const row = mapa.get(competencia);
    const receita = Number(row?.receita ?? 0);
    const despesa = Number(row?.despesa ?? 0);
    return { competencia, receita, despesa, resultado: receita - despesa };
  });
}

/** Projecao de caixa: realizado + previsto por mes a frente. */
export async function projecaoCaixa(meses = 6, config: Record<string, string>) {
  let saldo = await saldoCaixa(config);
  const atual = competenciaAtual();
  const [ano, mes] = atual.split("-").map(Number);

  const previstos = await all<{ competencia: string; receita: number; despesa: number }>(
    `SELECT COALESCE(competencia, to_char(data, 'YYYY-MM')) AS competencia,
            COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receita,
            COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesa
       FROM lancamentos
      WHERE status = 'previsto'
      GROUP BY 1`,
  );
  const mapa = new Map(previstos.map((row) => [row.competencia, row]));

  const saida: { competencia: string; entradas: number; saidas: number; saldoProjetado: number }[] = [];
  for (let i = 0; i < meses; i += 1) {
    const competencia = new Date(Date.UTC(ano, mes - 1 + i, 1)).toISOString().slice(0, 7);
    const row = mapa.get(competencia);
    const entradas = Number(row?.receita ?? 0);
    const saidas = Number(row?.despesa ?? 0);
    saldo += entradas - saidas;
    saida.push({ competencia, entradas, saidas, saldoProjetado: saldo });
  }
  return saida;
}

/* -------------------------------------------------------------------------- */
/* Regra de reinvestimento (Cl. 9a)                                            */
/* -------------------------------------------------------------------------- */

export async function regraReinvestimento(
  competencia = competenciaAtual(),
  config: Record<string, string>,
) {
  const limite = config["reinvestimento_ate"] || "2027-07-31";
  const pct = configNumber(config, "reinvestimento_pct", 50);
  const vigente = `${competencia}-01` <= limite;

  const linhas = await dre(competencia);
  const receita = linhas.reduce((total, linha) => total + linha.receita, 0);
  const custo = linhas.reduce((total, linha) => total + linha.custo, 0);
  const lucro = receita - custo;

  const reinvestimento = vigente && lucro > 0 ? (lucro * pct) / 100 : 0;
  const distribuicao = lucro > 0 ? lucro - reinvestimento : 0;

  const socios = await all<{ nome: string; quota_pct: number }>(
    `SELECT nome, quota_pct FROM pessoas
      WHERE tipo = 'socio' AND ativo = true
      ORDER BY quota_pct DESC`,
  );

  return {
    competencia,
    vigente,
    percentual: pct,
    limite,
    receita,
    custo,
    lucro,
    reinvestimento,
    distribuicao,
    porSocio: socios.map((socio) => ({
      nome: socio.nome,
      quotaPct: socio.quota_pct,
      valor: (distribuicao * socio.quota_pct) / 100,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Indicadores e alertas                                                       */
/* -------------------------------------------------------------------------- */

export interface IndicadorCalculado {
  id: number;
  nome: string;
  diretoria: string;
  frequencia: string;
  unidade: string;
  meta: number | null;
  alertaOperador: string;
  alertaValor: number | null;
  descricaoAlerta: string | null;
  valor: number | null;
  origem: "automatico" | "manual" | "sem_dado";
  emAlerta: boolean;
}

/** Valores que o sistema sabe calcular sozinho, por chave de calculo. */
async function valoresAutomaticos(
  config: Record<string, string>,
): Promise<Record<string, number | null>> {
  const [inad, pipe, dreAtual, eventos, reserva, receitaRecorrente, churn, sla, ativacao, nps, decisoes] =
    await Promise.all([
      inadimplencia(),
      pipeline(),
      dre(competenciaAtual()),
      ocupacaoProximosEventos(),
      reservaMeses(config),
      mrr(),
      churnMes(),
      slaSuporte(),
      ativacaoPct(),
      npsEventos(),
      decisoesNoPrazo(),
    ]);

  const receitaTotal = dreAtual.reduce((total, linha) => total + linha.receita, 0);
  const resultadoTotal = dreAtual.reduce((total, linha) => total + linha.resultado, 0);
  const ocupacoes = eventos
    .map((evento) => evento.ocupacao_pct as number | null)
    .filter((valor): valor is number => typeof valor === "number");

  return {
    reserva_meses: reserva,
    inadimplencia_pct: inad.percentual,
    margem_liquida_pct: receitaTotal > 0 ? (resultadoTotal / receitaTotal) * 100 : null,
    decisoes_no_prazo_pct: decisoes.percentual,
    mrr: receitaRecorrente,
    churn_pct: churn,
    ocupacao_pct: ocupacoes.length > 0 ? Math.min(...ocupacoes) : null,
    pipeline_ponderado: pipe.ponderado,
    primeira_resposta_horas: sla.mediaHoras,
    ativacao_pct: ativacao,
    nps_eventos: nps,
  };
}

export async function indicadoresCalculados(
  config: Record<string, string>,
): Promise<IndicadorCalculado[]> {
  const automaticos = await valoresAutomaticos(config);

  const indicadores = await all<Row>(
    `SELECT i.*,
            (SELECT l.valor FROM indicador_leituras l
              WHERE l.indicador_id = i.id ORDER BY l.data DESC, l.id DESC LIMIT 1) AS ultima_leitura
       FROM indicadores i
      WHERE i.ativo = true
      ORDER BY i.ordem, i.id`,
  );

  return indicadores.map((row) => {
    const chave = row.calculo_automatico as string | null;
    const automatico = chave ? automaticos[chave] : undefined;
    const manual = row.ultima_leitura as number | null;

    let valor: number | null = null;
    let origem: IndicadorCalculado["origem"] = "sem_dado";

    if (automatico !== undefined && automatico !== null) {
      valor = automatico;
      origem = "automatico";
    } else if (manual !== null && manual !== undefined) {
      valor = manual;
      origem = "manual";
    }

    const alertaValor = row.alerta_valor as number | null;
    const operador = String(row.alerta_operador);
    const emAlerta =
      valor !== null && alertaValor !== null
        ? operador === "menor"
          ? valor < alertaValor
          : valor > alertaValor
        : false;

    return {
      id: Number(row.id),
      nome: String(row.nome),
      diretoria: String(row.diretoria),
      frequencia: String(row.frequencia),
      unidade: String(row.unidade),
      meta: (row.meta as number | null) ?? null,
      alertaOperador: operador,
      alertaValor,
      descricaoAlerta: (row.descricao_alerta as string | null) ?? null,
      valor,
      origem,
      emAlerta,
    };
  });
}

export interface Alerta {
  nivel: "critico" | "atencao" | "info";
  titulo: string;
  detalhe: string;
  modulo: string;
  href: string;
}

/** Varredura completa: o que precisa ir para a pauta da Quarta Oficial. */
export async function alertas(config: Record<string, string>): Promise<Alerta[]> {
  const saida: Alerta[] = [];

  const [indicadores, inad, decisoes, sla] = await Promise.all([
    indicadoresCalculados(config),
    inadimplencia(),
    decisoesNoPrazo(),
    slaSuporte(),
  ]);

  for (const indicador of indicadores) {
    if (!indicador.emAlerta) continue;
    saida.push({
      nivel: indicador.diretoria === "Administrativo" ? "critico" : "atencao",
      titulo: indicador.nome,
      detalhe: indicador.descricaoAlerta ?? "Fora do sinal de alerta",
      modulo: "Indicadores",
      href: "/gestao/indicadores",
    });
  }

  if (inad.faturas > 0) {
    saida.push({
      nivel: "critico",
      titulo: `${inad.faturas} fatura(s) vencida(s)`,
      detalhe: `Total em aberto de ${inad.valor.toFixed(2)}. POP-ADM-02 - cobranca de inadimplentes.`,
      modulo: "Cobrancas",
      href: "/financeiro/cobrancas",
    });
  }

  if (decisoes.atrasadas > 0) {
    saida.push({
      nivel: "atencao",
      titulo: `${decisoes.atrasadas} decisao(oes) com prazo vencido`,
      detalhe: "Cobrar na abertura da Quarta Oficial.",
      modulo: "Registro de Decisoes",
      href: "/governanca/decisoes",
    });
  }

  const semAssinatura = await sum(
    `SELECT COUNT(*) AS total FROM contratos
      WHERE status = 'aguardando_assinatura' OR (status = 'ativo' AND assinado = false)`,
  );
  if (semAssinatura > 0) {
    saida.push({
      nivel: "critico",
      titulo: `${semAssinatura} contrato(s) sem assinatura`,
      detalhe: "Contrato e nota em ordem em todo cliente, sem excecao.",
      modulo: "Contratos",
      href: "/financeiro/contratos",
    });
  }

  const semNota = await sum(
    `SELECT COUNT(*) AS total FROM faturas WHERE status = 'paga' AND nfse_emitida = false`,
  );
  if (semNota > 0) {
    saida.push({
      nivel: "atencao",
      titulo: `${semNota} cobranca(s) paga(s) sem NFS-e`,
      detalhe: "POP-ADM-01 - emissao de contrato, cobranca e NFS-e.",
      modulo: "Cobrancas",
      href: "/financeiro/cobrancas",
    });
  }

  const certidoes = await all<{ nome: string; validade: string }>(
    `SELECT nome, validade FROM documentos
      WHERE validade IS NOT NULL AND validade <= current_date + INTERVAL '30 days'
      ORDER BY validade`,
  );
  for (const certidao of certidoes) {
    saida.push({
      nivel: certidao.validade < hoje() ? "critico" : "atencao",
      titulo: certidao.nome,
      detalhe:
        certidao.validade < hoje()
          ? `Vencida em ${certidao.validade}.`
          : `Vence em ${certidao.validade}.`,
      modulo: "Documentos",
      href: "/juridico/documentos",
    });
  }

  const sinalMinimo = configNumber(config, "sinal_minimo_evento_pct", 50);
  const eventos = await all<Row>(
    `SELECT nome, data, vagas, inscritos, sinal_recebido, receita_prevista,
            (data - current_date) AS dias
       FROM eventos
      WHERE status IN ('planejado', 'confirmado') AND data IS NOT NULL`,
  );
  for (const evento of eventos) {
    const prevista = Number(evento.receita_prevista ?? 0);
    const sinal = Number(evento.sinal_recebido ?? 0);
    const dias = Number(evento.dias ?? 999);
    if (prevista > 0 && (sinal / prevista) * 100 < sinalMinimo) {
      saida.push({
        nivel: "atencao",
        titulo: `Sinal abaixo de ${sinalMinimo}%: ${evento.nome}`,
        detalhe: "Nenhum custo do evento deve ser assumido antes do sinal.",
        modulo: "Eventos",
        href: "/entrega/eventos",
      });
    }
    const vagas = Number(evento.vagas ?? 0);
    const inscritos = Number(evento.inscritos ?? 0);
    if (vagas > 0 && dias <= 15 && dias >= 0 && (inscritos / vagas) * 100 < 60) {
      saida.push({
        nivel: "atencao",
        titulo: `Ocupacao baixa: ${evento.nome}`,
        detalhe: `${inscritos}/${vagas} inscritos a ${dias} dias do evento.`,
        modulo: "Eventos",
        href: "/entrega/eventos",
      });
    }
  }

  const popsPendentes = await sum(
    `SELECT COUNT(*) AS total FROM pops WHERE status = 'pendente'`,
  );
  if (popsPendentes > 0) {
    saida.push({
      nivel: "info",
      titulo: `${popsPendentes} POP(s) prioritario(s) ainda nao escrito(s)`,
      detalhe: "Nenhum processo vive na cabeca de um socio.",
      modulo: "POPs",
      href: "/gestao/pops",
    });
  }

  const pendenciasAltas = await sum(
    `SELECT COUNT(*) AS total FROM pendencias
      WHERE status IN ('aberta', 'em_andamento') AND prioridade = 'alta'`,
  );
  if (pendenciasAltas > 0) {
    saida.push({
      nivel: "atencao",
      titulo: `${pendenciasAltas} pendencia(s) de prioridade alta`,
      detalhe: "Correcoes de contrato, acordo de socios e tributario.",
      modulo: "Pendencias",
      href: "/juridico/pendencias",
    });
  }

  if (sla.foraDoSla > 0) {
    saida.push({
      nivel: "atencao",
      titulo: `${sla.foraDoSla} chamado(s) com primeira resposta acima de 4h`,
      detalhe: "SLA prometido ao cliente: primeira resposta em 4h uteis.",
      modulo: "Suporte",
      href: "/entrega/chamados",
    });
  }

  const naoConciliados = await sum(
    `SELECT COUNT(*) AS total FROM lancamentos
      WHERE status = 'realizado' AND conciliado = false`,
  );
  if (naoConciliados > 0) {
    saida.push({
      nivel: "info",
      titulo: `${naoConciliados} lancamento(s) sem conciliacao`,
      detalhe: "Conciliacao bancaria e da plataforma de pagamento: toda segunda.",
      modulo: "Fluxo de caixa",
      href: "/financeiro/fluxo-de-caixa",
    });
  }

  const ordem = { critico: 0, atencao: 1, info: 2 };
  return saida.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

/* -------------------------------------------------------------------------- */
/* Pacote do painel                                                            */
/* -------------------------------------------------------------------------- */

export async function painel() {
  const config = await getConfig();
  const competencia = competenciaAtual();

  const [
    caixa,
    contas,
    custoFixo,
    reserva,
    receitaRecorrente,
    inad,
    pipe,
    etapas,
    vendas,
    base,
    churn,
    ativacao,
    nps,
    sla,
    decisoes,
    dreAtual,
    serie,
    projecao,
    reinvestimento,
    eventos,
    indicadores,
    listaAlertas,
  ] = await Promise.all([
    saldoCaixa(config),
    saldoPorConta(),
    custoFixoMensal(config),
    reservaMeses(config),
    mrr(),
    inadimplencia(),
    pipeline(),
    pipelinePorEtapa(),
    vendasFechadasMes(competencia),
    baseClientes(),
    churnMes(competencia),
    ativacaoPct(),
    npsEventos(),
    slaSuporte(),
    decisoesNoPrazo(),
    dre(competencia),
    serieMensal(12),
    projecaoCaixa(6, config),
    regraReinvestimento(competencia, config),
    ocupacaoProximosEventos(),
    indicadoresCalculados(config),
    alertas(config),
  ]);

  return {
    config,
    competencia,
    caixa,
    saldoPorConta: contas,
    custoFixoMensal: custoFixo,
    reservaMeses: reserva,
    reservaMetaMeses: configNumber(config, "reserva_meta_meses", 6),
    reservaAlertaMeses: configNumber(config, "reserva_alerta_meses", 3),
    mrr: receitaRecorrente,
    metaMrr: configNumber(config, "meta_mrr"),
    inadimplencia: inad,
    pipeline: pipe,
    pipelinePorEtapa: etapas,
    metaVendasMes: configNumber(config, "meta_vendas_mes"),
    vendasFechadasMes: vendas,
    base,
    churnPct: churn,
    ativacaoPct: ativacao,
    npsEventos: nps,
    sla,
    decisoes,
    dre: dreAtual,
    serieMensal: serie,
    projecao,
    reinvestimento,
    proximosEventos: eventos,
    indicadores,
    alertas: listaAlertas,
  };
}

export type PainelData = Awaited<ReturnType<typeof painel>>;
