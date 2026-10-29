import "server-only";

import { all, one, run, transaction, type Param } from "./db";

/**
 * Dados de exemplo.
 *
 * Servem para ver o sistema funcionando antes de ter numero real: um mes
 * tipico da DEMOCRAT.IA com as tres unidades de negocio rodando. Nenhum dado de
 * referencia do manual (POPs, RACI, indicadores, glossario, clausulas) e
 * tocado - so o movimento.
 */

/** Tabelas de movimento: o que o "limpar" apaga e o "carregar" preenche. */
const TABELAS_MOVIMENTO = [
  "indicador_leituras",
  "onboarding_itens",
  "interacoes",
  "entregas",
  "lancamentos",
  "faturas",
  "contratos",
  "negociacoes",
  "chamados",
  "roadmap_itens",
  "projetos",
  "eventos",
  "decisoes",
  "prioridades",
  "reunioes",
  "fechamentos_mensais",
  "clientes",
] as const;

function agora(): Date {
  return new Date();
}

function iso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Data deslocada em dias a partir de hoje. */
function dia(offset: number): string {
  const data = agora();
  data.setDate(data.getDate() + offset);
  return iso(data);
}

/** Competencia deslocada em meses a partir do mes atual. */
function mes(offset: number): string {
  const hoje = agora();
  return new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth() + offset, 1))
    .toISOString()
    .slice(0, 7);
}

async function idDe(tabela: string, coluna: string, valor: string): Promise<number | null> {
  const row = await one<{ id: number }>(
    `SELECT id FROM ${tabela} WHERE ${coluna} LIKE ? LIMIT 1`,
    [`${valor}%`],
  );
  return row?.id ?? null;
}

/** Insere uma linha e devolve o id gerado. */
async function inserir(tabela: string, colunas: string[], valores: Param[]): Promise<number> {
  const marcadores = colunas.map(() => "?").join(", ");
  const resultado = await run(
    `INSERT INTO ${tabela} (${colunas.join(", ")}) VALUES (${marcadores}) RETURNING id`,
    valores,
  );
  return Number(resultado.rows[0]?.id);
}

export async function limparMovimento(): Promise<Record<string, number>> {
  const apagados: Record<string, number> = {};
  await transaction(async () => {
    for (const tabela of TABELAS_MOVIMENTO) {
      const resultado = await run(`DELETE FROM ${tabela}`);
      apagados[tabela] = resultado.changes;
    }
  });
  return apagados;
}

export async function carregarDemo(): Promise<{ clientes: number; lancamentos: number }> {
  const [
    unSoftware,
    unEducacao,
    unEstrategia,
    socioAdmin,
    socioComercial,
    socioDev,
    ccTecnologia,
    ccComercial,
    ccCursos,
    ccAdmin,
    ccPessoas,
  ] = await Promise.all([
    idDe("unidades_negocio", "nome", "Software"),
    idDe("unidades_negocio", "nome", "Educacao"),
    idDe("unidades_negocio", "nome", "Estrategia"),
    idDe("pessoas", "nome", "Socio Administrador"),
    idDe("pessoas", "nome", "Socio Comercial"),
    idDe("pessoas", "nome", "Socio Desenvolvimento"),
    idDe("centros_custo", "nome", "Tecnologia"),
    idDe("centros_custo", "nome", "Comercial"),
    idDe("centros_custo", "nome", "Entrega de cursos"),
    idDe("centros_custo", "nome", "Administrativo"),
    idDe("centros_custo", "nome", "Pessoas"),
  ]);

  let totalLancamentos = 0;

  const COLS_LANCAMENTO = [
    "data", "competencia", "descricao", "tipo", "valor", "status", "conta",
    "unidade_negocio_id", "centro_custo_id", "cliente_id", "fatura_id",
    "fornecedor", "custo_fixo", "recorrente", "conciliado",
  ];

  await transaction(async () => {
    /* -------------------------------- Clientes ------------------------------ */
    const clientes: [string, string, string, string, string, number, number, number | null][] = [
      ["Gabinete Dep. Est. Ana Ribeiro", "gabinete", "Belo Horizonte", "MG", "ativo", 397, -240, 9],
      ["Gabinete Ver. Carlos Nunes", "gabinete", "Lagoa Santa", "MG", "ativo", 397, -200, 10],
      ["Gabinete Dep. Fed. Marina Alves", "gabinete", "Brasilia", "DF", "ativo", 997, -150, 8],
      ["Gabinete Ver. Paulo Tavares", "gabinete", "Contagem", "MG", "em_risco", 397, -120, 6],
      ["Gabinete Dep. Est. Rui Monteiro", "gabinete", "Betim", "MG", "inadimplente", 397, -95, null],
      ["Diretorio Municipal - Sete Lagoas", "partido", "Sete Lagoas", "MG", "ativo", 597, -70, 9],
      ["Camara Municipal de Pedro Leopoldo", "orgao_publico", "Pedro Leopoldo", "MG", "onboarding", 1497, -20, null],
      ["Gabinete Ver. Helena Castro", "gabinete", "Nova Lima", "MG", "cancelado", 397, -300, 4],
    ];

    const idsClientes: number[] = [];
    for (const [indice, cliente] of clientes.entries()) {
      const [nome, tipo, cidade, uf, status, , inicioOffset, nps] = cliente;
      const id = await inserir(
        "clientes",
        [
          "nome", "tipo", "cidade", "uf", "status", "unidade_negocio_id",
          "responsavel_cs_id", "data_inicio", "data_cancelamento", "nps",
          "ultimo_contato_cs", "origem", "setor_publico", "telefone", "email",
        ],
        [
          nome, tipo, cidade, uf, status, unSoftware,
          indice % 2 === 0 ? socioComercial : socioDev,
          dia(inicioOffset),
          status === "cancelado" ? dia(-25) : null,
          nps,
          status === "ativo" ? dia(-(indice * 3 + 2)) : dia(-45),
          ["indicacao", "inbound", "prospeccao", "evento", "licitacao"][indice % 5],
          tipo === "orgao_publico",
          `(31) 9${String(80000000 + indice * 11111).slice(0, 8)}`,
          `contato${indice + 1}@exemplo.com.br`,
        ],
      );
      idsClientes.push(id);
    }

    /* ------------------------------- Contratos ------------------------------ */
    const idsContratos: (number | null)[] = [];
    for (const [indice, cliente] of clientes.entries()) {
      const [nome, tipo, , , status, valor, inicioOffset] = cliente;
      if (status === "cancelado") {
        idsContratos.push(null);
        continue;
      }
      const assinado = status !== "onboarding";
      const id = await inserir(
        "contratos",
        [
          "numero", "cliente_id", "unidade_negocio_id", "objeto", "valor",
          "periodicidade", "dia_vencimento", "inicio", "meio_pagamento",
          "assinado", "data_assinatura", "status", "inexigibilidade",
        ],
        [
          `CT-2026-${String(indice + 1).padStart(3, "0")}`,
          idsClientes[indice],
          unSoftware,
          `Licenca mensal do CRM politico - ${nome}`,
          valor,
          "mensal",
          [5, 10, 15, 20][indice % 4],
          dia(inicioOffset),
          indice % 3 === 0 ? "pix" : "boleto",
          assinado,
          assinado ? dia(inicioOffset + 2) : null,
          status === "inadimplente" ? "suspenso" : "ativo",
          tipo === "orgao_publico",
        ],
      );
      idsContratos.push(id);
    }

    /* -------------------------- Faturas e lancamentos ----------------------- */
    for (let offsetMes = -3; offsetMes <= 0; offsetMes += 1) {
      const competencia = mes(offsetMes);

      for (const [indice, cliente] of clientes.entries()) {
        const [nome, , , , status, valor] = cliente;
        const contratoId = idsContratos[indice];
        if (!contratoId) continue;
        if (status === "onboarding" && offsetMes < 0) continue;

        const diaVencimento = [5, 10, 15, 20][indice % 4];
        const vencimento = `${competencia}-${String(diaVencimento).padStart(2, "0")}`;
        const atrasada = status === "inadimplente";
        const doMesAtual = offsetMes === 0;
        const paga = !atrasada && (!doMesAtual || indice % 2 === 0);
        const comNota = paga && indice % 4 !== 3;

        const faturaId = await inserir(
          "faturas",
          [
            "cliente_id", "contrato_id", "unidade_negocio_id", "competencia",
            "descricao", "valor", "vencimento", "pagamento", "valor_pago",
            "status", "nfse_emitida", "nfse_numero", "tentativas_cobranca",
            "ultima_cobranca", "meio_pagamento",
          ],
          [
            idsClientes[indice], contratoId, unSoftware, competencia,
            `Licenca CRM ${competencia} - ${nome}`,
            valor, vencimento,
            paga ? vencimento : null,
            paga ? valor : 0,
            paga ? "paga" : atrasada ? "vencida" : "aberta",
            comNota,
            comNota ? `2026${String(indice + 1).padStart(4, "0")}` : null,
            atrasada ? 2 : 0,
            atrasada ? dia(-5) : null,
            indice % 3 === 0 ? "pix" : "boleto",
          ],
        );

        if (paga) {
          await inserir("lancamentos", COLS_LANCAMENTO, [
            vencimento, competencia, `Recebimento licenca CRM - ${nome}`,
            "receita", valor, "realizado", "operacional",
            unSoftware, null, idsClientes[indice], faturaId,
            null, false, true, true,
          ]);
          totalLancamentos += 1;
        }
      }

      /* ------------------------ Despesas recorrentes ----------------------- */
      const despesas: [string, number, number | null, boolean, string | null][] = [
        ["Servidores e hospedagem", 890, ccTecnologia, true, "Cloud"],
        ["APIs de IA", 640, ccTecnologia, false, "Provedor de IA"],
        ["Ferramentas de desenvolvimento", 310, ccTecnologia, true, "Assinaturas"],
        ["Contabilidade", 720, ccAdmin, true, "Escritorio contabil"],
        ["Taxas da plataforma de pagamento", 180, ccAdmin, false, "Kiwify"],
        ["Anuncios e trafego pago", 1200, ccComercial, false, "Meta Ads"],
        ["Pro-labore dos socios", 9000, ccPessoas, true, null],
      ];

      for (const [descricao, valor, centro, fixo, fornecedor] of despesas) {
        await inserir("lancamentos", COLS_LANCAMENTO, [
          `${competencia}-08`, competencia, descricao,
          "despesa", valor, "realizado", "operacional",
          centro === ccTecnologia ? unSoftware : null, centro, null, null,
          fornecedor, fixo, true, offsetMes !== 0,
        ]);
        totalLancamentos += 1;
      }
    }

    /* -------------------------------- Eventos ------------------------------- */
    const COLS_EVENTO = [
      "nome", "tipo", "data", "cidade", "local", "vagas", "inscritos",
      "preco_ingresso", "receita_prevista", "receita_realizada",
      "custo_previsto", "custo_realizado", "sinal_recebido", "responsavel_id",
      "material_enviado", "nps", "status",
    ];

    await inserir("eventos", COLS_EVENTO, [
      "Workshop Gestao de Mandato - turma BH", "workshop", dia(-38),
      "Belo Horizonte", "Centro de convencoes", 40, 34, 450,
      15300, 15300, 6200, 6480, 7650, socioDev, true, 72, "realizado",
    ]);
    await inserir("eventos", COLS_EVENTO, [
      "Capacitacao Comunicacao Parlamentar", "curso", dia(12),
      "Sete Lagoas", "Auditorio da Camara", 35, 18, 390,
      13650, 0, 5400, 0, 3400, socioDev, false, null, "confirmado",
    ]);
    await inserir("eventos", COLS_EVENTO, [
      "Workshop Pre-campanha 2028", "workshop", dia(48),
      "Contagem", "A definir", 50, 9, 520,
      26000, 0, 9800, 0, 0, socioDev, false, null, "planejado",
    ]);

    // Receita e custo do evento ja realizado, com a etiqueta Educacao.
    await inserir("lancamentos", COLS_LANCAMENTO, [
      dia(-38), mes(-1), "Receita do Workshop Gestao de Mandato - turma BH",
      "receita", 15300, "realizado", "operacional",
      unEducacao, null, null, null, null, false, false, true,
    ]);
    await inserir("lancamentos", COLS_LANCAMENTO, [
      dia(-40), mes(-1), "Local, material e coffee - turma BH",
      "despesa", 6480, "realizado", "operacional",
      unEducacao, ccCursos, null, null, "Fornecedores do evento", false, false, true,
    ]);
    totalLancamentos += 2;

    /* -------------------------------- Projetos ------------------------------ */
    const COLS_PROJETO = [
      "nome", "cliente_id", "tipo", "valor", "custo_previsto", "custo_realizado",
      "kickoff", "prazo_entrega", "entregue_em", "responsavel_id", "status",
      "relatorio_final",
    ];

    const projeto1 = await inserir("projetos", COLS_PROJETO, [
      "Plano de comunicacao digital - Dep. Marina Alves", idsClientes[2], "marketing",
      18000, 7000, 6200, dia(-55), dia(-10), dia(-12), socioComercial, "entregue", true,
    ]);
    const projeto2 = await inserir("projetos", COLS_PROJETO, [
      "Diagnostico de base eleitoral - Sete Lagoas", idsClientes[5], "estrategia",
      24000, 9000, 3100, dia(-18), dia(32), null, socioComercial, "em_andamento", false,
    ]);

    const COLS_ENTREGA = ["projeto_id", "nome", "prazo", "entregue_em", "aprovada", "status"];
    await inserir("entregas", COLS_ENTREGA, [projeto1, "Diagnostico de redes", dia(-40), dia(-41), true, "aprovada"]);
    await inserir("entregas", COLS_ENTREGA, [projeto1, "Plano editorial de 90 dias", dia(-20), dia(-22), true, "aprovada"]);
    await inserir("entregas", COLS_ENTREGA, [projeto1, "Relatorio final", dia(-10), dia(-12), true, "aprovada"]);
    await inserir("entregas", COLS_ENTREGA, [projeto2, "Mapeamento de liderancas", dia(2), null, false, "em_andamento"]);
    await inserir("entregas", COLS_ENTREGA, [projeto2, "Relatorio de base eleitoral", dia(28), null, false, "pendente"]);

    await inserir("lancamentos", COLS_LANCAMENTO, [
      dia(-10), mes(0), "Projeto de marketing - Dep. Marina Alves",
      "receita", 18000, "realizado", "operacional",
      unEstrategia, null, idsClientes[2], null, null, false, false, true,
    ]);
    await inserir("lancamentos", COLS_LANCAMENTO, [
      dia(-30), mes(-1), "Prestadores do projeto de marketing",
      "despesa", 6200, "realizado", "operacional",
      unEstrategia, ccPessoas, null, null, "Prestadores PJ", false, false, true,
    ]);
    await inserir("lancamentos", COLS_LANCAMENTO, [
      dia(20), mes(1), "1a parcela - Diagnostico de base eleitoral",
      "receita", 12000, "previsto", "operacional",
      unEstrategia, null, idsClientes[5], null, null, false, false, false,
    ]);
    totalLancamentos += 3;

    /* ------------------------------- Pipeline ------------------------------- */
    const negociacoes: [string, string, number, number, number | null, number][] = [
      ["Licenca CRM - Gabinete Dep. Sofia Lima", "proposta", 997, 60, unSoftware, 14],
      ["Licenca CRM - Gabinete Ver. Joao Prado", "negociacao", 397, 75, unSoftware, 7],
      ["Licenca CRM - Gabinete Dep. Est. Luis Faria", "qualificacao", 597, 30, unSoftware, 25],
      ["Pacote 5 licencas - Bancada Municipal Betim", "proposta", 1985, 45, unSoftware, 20],
      ["Workshop fechado - Camara de Ibirite", "negociacao", 12000, 70, unEducacao, 10],
      ["Capacitacao - Diretorio Estadual", "prospeccao", 18000, 15, unEducacao, 40],
      ["Consultoria de pre-campanha - Dep. Rui Monteiro", "qualificacao", 32000, 25, unEstrategia, 35],
      ["Plano de midia - Ver. Helena Castro", "prospeccao", 9000, 10, unEstrategia, 50],
      ["Licenca CRM - Camara de Pedro Leopoldo", "fechada_ganha", 1497, 100, unSoftware, -20],
      ["Licenca CRM - Gabinete Ver. Tiago Moura", "fechada_perdida", 397, 0, unSoftware, -15],
    ];

    for (const [indice, negociacao] of negociacoes.entries()) {
      const [titulo, etapa, valor, probabilidade, unidade, prazo] = negociacao;
      const fechada = etapa.startsWith("fechada");
      await inserir(
        "negociacoes",
        [
          "titulo", "lead_nome", "unidade_negocio_id", "etapa", "valor",
          "probabilidade", "desconto_pct", "desconto_aprovado_por",
          "responsavel_id", "data_abertura", "previsao_fechamento",
          "data_fechamento", "motivo_perda", "proximo_passo",
        ],
        [
          titulo, titulo.split(" - ")[1] ?? titulo, unidade, etapa, valor,
          probabilidade, indice === 3 ? 20 : indice === 1 ? 10 : 0, null,
          socioComercial, dia(-30 + indice * 2), dia(prazo),
          fechada ? dia(prazo) : null,
          etapa === "fechada_perdida" ? "Preco acima do orcamento do gabinete" : null,
          fechada
            ? null
            : ["Enviar proposta revisada", "Agendar demonstracao", "Confirmar orcamento", "Follow-up por WhatsApp"][indice % 4],
        ],
      );
    }

    /* ------------------------------ Interacoes ------------------------------ */
    const COLS_INTERACAO = ["cliente_id", "data", "canal", "tipo", "responsavel_id", "resumo", "proximo_passo"];
    await inserir("interacoes", COLS_INTERACAO, [idsClientes[0], dia(-4), "reuniao", "sucesso_cliente", socioDev, "Check-in de 30 dias: equipe usando o CRM diariamente, pediu relatorio de demandas por bairro.", "Levar o pedido para o roadmap"]);
    await inserir("interacoes", COLS_INTERACAO, [idsClientes[3], dia(-8), "ligacao", "sucesso_cliente", socioComercial, "Uso caiu desde a mudanca de chefe de gabinete. Cliente marcado como em risco.", "Agendar retreinamento da equipe"]);
    await inserir("interacoes", COLS_INTERACAO, [idsClientes[4], dia(-5), "whatsapp", "cobranca", socioAdmin, "2a tentativa de cobranca recusada. Acesso suspenso conforme contrato.", "Abrir cobranca formal"]);
    await inserir("interacoes", COLS_INTERACAO, [idsClientes[6], dia(-12), "visita", "comercial", socioComercial, "Kickoff do contrato por inexigibilidade. Certidoes entregues e conferidas.", "Liberar acessos ate sexta"]);
    await inserir("interacoes", COLS_INTERACAO, [idsClientes[2], dia(-11), "email", "comercial", socioComercial, "Relatorio final do plano de comunicacao aprovado pelo gabinete.", "Propor renovacao trimestral"]);

    /* ------------------------------- Chamados ------------------------------- */
    const COLS_CHAMADO = [
      "cliente_id", "assunto", "severidade", "abertura", "primeira_resposta",
      "primeira_resposta_horas", "fechamento", "responsavel_id", "status",
      "incidente", "descricao",
    ];
    await inserir("chamados", COLS_CHAMADO, [idsClientes[0], "Erro ao importar lista de contatos", "media", dia(-9), dia(-9), 2.5, dia(-8), socioDev, "resolvido", false, "Planilha com colunas fora do padrao."]);
    await inserir("chamados", COLS_CHAMADO, [idsClientes[2], "Lentidao no painel de demandas", "alta", dia(-6), dia(-6), 1.5, dia(-5), socioDev, "resolvido", false, "Indice faltando na consulta de demandas."]);
    await inserir("chamados", COLS_CHAMADO, [idsClientes[5], "Pedido de novo perfil de acesso", "baixa", dia(-3), dia(-2), 6.0, null, socioDev, "em_andamento", false, "Perfil somente leitura para assessoria."]);
    await inserir("chamados", COLS_CHAMADO, [idsClientes[1], "Indisponibilidade de 12 minutos", "critica", dia(-2), dia(-2), 0.5, dia(-2), socioDev, "resolvido", true, "Queda do provedor. Comunicado enviado aos clientes."]);

    /* -------------------------------- Roadmap ------------------------------- */
    const COLS_ROADMAP = ["titulo", "tipo", "prioridade", "origem", "cliente_id", "trimestre", "responsavel_id", "status", "descricao"];
    await inserir("roadmap_itens", COLS_ROADMAP, ["Relatorio de demandas por bairro", "feature", "alta", "cliente", idsClientes[0], "2027-T1", socioDev, "planejado", "Pedido recorrente dos gabinetes municipais."]);
    await inserir("roadmap_itens", COLS_ROADMAP, ["Resumo de demandas por IA", "ia", "alta", "estrategia", null, "2027-T1", socioDev, "em_desenvolvimento", "Diferencial de venda para gabinetes federais."]);
    await inserir("roadmap_itens", COLS_ROADMAP, ["App mobile para assessores", "feature", "media", "cliente", null, "2027-T2", socioDev, "backlog", null]);
    await inserir("roadmap_itens", COLS_ROADMAP, ["Monitoramento de uptime com alerta", "infraestrutura", "alta", "time", null, "2027-T1", socioDev, "planejado", "Necessario para medir o indicador de uptime."]);

    /* ------------------------------ Governanca ------------------------------ */
    await inserir(
      "reunioes",
      [
        "tipo", "data", "presentes", "pauta_enviada", "caixa", "reserva_meses",
        "mrr", "vendas_fechadas", "inadimplencia_pct", "proximo_evento",
        "bloco0_abertura", "bloco1_admin", "bloco2_comercial", "bloco3_produto",
        "bloco4_gargalos", "para_proxima", "status",
      ],
      [
        "quarta_oficial", dia(-7), "Os 3 socios", true, 41200, 2.4, 4679, 1497, 4.8,
        "Capacitacao Comunicacao Parlamentar",
        "3 decisoes entregues, 1 atrasada (modelo de contrato de workshop).",
        "Reserva ainda abaixo de 3 meses. Inadimplencia em 4,8%, dentro do limite.",
        "Pipeline ponderado abaixo de 3x a meta. Camara de Pedro Leopoldo fechada por inexigibilidade.",
        "Incidente de 12 minutos no CRM; comunicado enviado. Capacitacao com 18 de 35 inscritos.",
        "Ocupacao da capacitacao e o gargalo da semana: decidido reforcar divulgacao com o diretorio.",
        "Fechar o modelo de contrato de workshop e revisar a tabela de precos.",
        "realizada",
      ],
    );

    const COLS_DECISAO = ["data", "decisao", "contexto", "dono_id", "prazo", "entregue_em", "status", "alcada", "diretoria"];
    await inserir("decisoes", COLS_DECISAO, [dia(-7), "Reforcar a divulgacao da Capacitacao com o diretorio estadual", "Ocupacao em 51% a 19 dias do evento", socioComercial, dia(-1), dia(-2), "entregue", "diretor_area", "Comercial"]);
    await inserir("decisoes", COLS_DECISAO, [dia(-7), "Fechar o modelo de contrato de workshop com o advogado", "Pendencia do capitulo 05", socioAdmin, dia(3), null, "em_andamento", "quarta_maioria", "Administrativo"]);
    await inserir("decisoes", COLS_DECISAO, [dia(-14), "Definir o valor do pro-labore no proximo Fechamento Mensal", "Cl. 8a, § 5o", socioAdmin, dia(-3), null, "atrasada", "unanimidade", "Administrativo"]);
    await inserir("decisoes", COLS_DECISAO, [dia(-7), "Priorizar o resumo de demandas por IA no trimestre", "Diferencial de venda para gabinetes federais", socioDev, dia(10), null, "pendente", "diretor_area", "Desenvolvimento"]);
    await inserir("decisoes", COLS_DECISAO, [dia(-21), "Suspender o acesso do Gabinete Dep. Est. Rui Monteiro", "2a tentativa de cobranca recusada", socioAdmin, dia(-18), dia(-18), "entregue", "diretor_area", "Administrativo"]);

    const segunda = (() => {
      const data = agora();
      const ajuste = data.getDay() === 0 ? -6 : 1 - data.getDay();
      data.setDate(data.getDate() + ajuste);
      return iso(data);
    })();

    const COLS_PRIORIDADE = ["semana", "diretoria", "descricao", "dono_id", "status"];
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Administrativo", "Conciliar Kiwify e extrato do mes", socioAdmin, "em_andamento"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Administrativo", "Emitir as NFS-e pendentes", socioAdmin, "pendente"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Administrativo", "Fechar o modelo de contrato de workshop", socioAdmin, "pendente"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Comercial", "Levar a proposta da bancada de Betim ao fechamento", socioComercial, "em_andamento"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Comercial", "Subir a ocupacao da capacitacao para 60%", socioComercial, "em_andamento"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Comercial", "Agendar 5 demonstracoes novas", socioComercial, "pendente"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Desenvolvimento", "Entregar o resumo de demandas por IA em beta", socioDev, "em_andamento"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Desenvolvimento", "Subir o monitoramento de uptime", socioDev, "pendente"]);
    await inserir("prioridades", COLS_PRIORIDADE, [segunda, "Desenvolvimento", "Liberar acessos da Camara de Pedro Leopoldo", socioDev, "concluida"]);

    /* ---------------------------- Onboarding ------------------------------- */
    const COLS_ONBOARDING = ["cliente_id", "ramo", "ordem", "item", "concluido", "concluido_em"];
    const trilho = [
      "Venda fechada e registrada no CRM (Comercial)",
      "Contrato emitido e assinado (Administrador)",
      "Cobranca emitida (Administrador)",
      "NFS-e emitida (Administrador)",
      "Pagamento ou sinal confirmado - nada e liberado antes disso",
      "Receita lancada com a etiqueta da unidade de negocio",
    ];
    const software = [
      "Libera acessos e perfis",
      "Treina a equipe do gabinete",
      "CS acompanha o uso em 30 dias",
      "Cliente marcado como ativado",
    ];
    // Cliente em onboarding: trilho quase pronto, ramo de software comecando.
    for (const [indice, item] of trilho.entries()) {
      await inserir("onboarding_itens", COLS_ONBOARDING, [
        idsClientes[6], "trilho", indice + 1, item,
        indice < 4, indice < 4 ? dia(-14 + indice) : null,
      ]);
    }
    for (const [indice, item] of software.entries()) {
      await inserir("onboarding_itens", COLS_ONBOARDING, [
        idsClientes[6], "software", indice + 1, item, false, null,
      ]);
    }

    /* --------------------------- Leituras manuais --------------------------- */
    const uptime = await idDe("indicadores", "nome", "Uptime do CRM");
    if (uptime) {
      const COLS_LEITURA = ["indicador_id", "data", "valor", "observacoes"];
      await inserir("indicador_leituras", COLS_LEITURA, [uptime, dia(-21), 99.9, null]);
      await inserir("indicador_leituras", COLS_LEITURA, [uptime, dia(-14), 99.8, null]);
      await inserir("indicador_leituras", COLS_LEITURA, [uptime, dia(-7), 99.3, "Queda de 12 minutos do provedor"]);
      await inserir("indicador_leituras", COLS_LEITURA, [uptime, dia(-1), 99.7, null]);
    }

    /* ---------------------------- Fechamento ------------------------------- */
    await run(
      `INSERT INTO fechamentos_mensais (competencia, status, observacoes)
       VALUES (?, 'aberto', 'Fechamento do mes anterior em andamento - DRE ate o dia 10')`,
      [mes(-1)],
    );
  });

  const totalClientes = await all<{ id: number }>("SELECT id FROM clientes");

  return { clientes: totalClientes.length, lancamentos: totalLancamentos };
}
