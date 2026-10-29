-- ============================================================================
-- DEMOCRAT.IA - Dados do Manual de Gestao e Governanca v1 (outubro/2026)
--
-- Conteudo de referencia da empresa: cadeiras, cultura, alcadas, rituais, POPs,
-- matriz RACI, indicadores com sinais de alerta, clausulas do contrato social,
-- pendencias juridicas, documentos, capital e o glossario completo.
--
-- Rode este arquivo DEPOIS do 01-estrutura.sql.
-- Pode ser rodado mais de uma vez: cada bloco so insere se a tabela estiver vazia.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- pessoas (3 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO pessoas (id, nome, email, telefone, tipo, quota_pct, pro_labore, ativo, observacoes) VALUES
  (1, 'Socio Administrador', NULL, NULL, 'socio', 40, 0, true, 'Cadeira do Administrador (Cl. 8a, § 1o). Renomeie com o nome real.'),
  (2, 'Socio Comercial', NULL, NULL, 'socio', 30, 0, true, 'Cadeira Comercial (Cl. 8a, § 2o). Renomeie com o nome real.'),
  (3, 'Socio Desenvolvimento', NULL, NULL, 'socio', 30, 0, true, 'Cadeira de Desenvolvimento e Manutencao da Ferramenta (Cl. 8a, § 3o). Renomeie com o nome real.')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- unidades_negocio (3 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO unidades_negocio (id, nome, tipo_receita, indicador_principal, cor, ativo) VALUES
  (1, 'Software (CRM politico)', 'recorrente', 'MRR, churn mensal, inadimplencia', '#4f46e5', true),
  (2, 'Educacao (workshops e cursos)', 'por_turma', 'Margem por turma, ocupacao', '#0d9488', true),
  (3, 'Estrategia e marketing', 'por_projeto', 'Margem por projeto, prazo de entrega', '#b45309', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- centros_custo (5 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO centros_custo (id, nome, descricao, ativo) VALUES
  (1, 'Tecnologia e infraestrutura', 'Servidores, APIs de IA, ferramentas de dev', true),
  (2, 'Comercial e marketing', 'Anuncios, comissoes, eventos de prospeccao', true),
  (3, 'Entrega de cursos', 'Local, material, coffee, deslocamento', true),
  (4, 'Administrativo', 'Contabilidade, juridico, taxas da plataforma de pagamento', true),
  (5, 'Pessoas', 'Pro-labore, salarios, prestadores', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- plano_contas (23 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO plano_contas (id, codigo, nome, tipo, natureza, centro_custo_id, ativo) VALUES
  (1, '3.1.01', 'Licenca mensal do CRM (SaaS)', 'receita', 'variavel', NULL, true),
  (2, '3.1.02', 'Implantacao e treinamento', 'receita', 'variavel', NULL, true),
  (3, '3.2.01', 'Workshop / curso presencial', 'receita', 'variavel', NULL, true),
  (4, '3.2.02', 'Capacitacao online', 'receita', 'variavel', NULL, true),
  (5, '3.3.01', 'Projeto de estrategia', 'receita', 'variavel', NULL, true),
  (6, '3.3.02', 'Projeto de marketing', 'receita', 'variavel', NULL, true),
  (7, '4.1.01', 'Servidores e hospedagem', 'despesa', 'fixo', 1, true),
  (8, '4.1.02', 'APIs de IA', 'despesa', 'variavel', 1, true),
  (9, '4.1.03', 'Ferramentas de desenvolvimento', 'despesa', 'fixo', 1, true),
  (10, '4.2.01', 'Anuncios e trafego pago', 'despesa', 'variavel', 2, true),
  (11, '4.2.02', 'Comissoes de venda', 'despesa', 'variavel', 2, true),
  (12, '4.2.03', 'Eventos de prospeccao', 'despesa', 'variavel', 2, true),
  (13, '4.3.01', 'Local e estrutura do evento', 'despesa', 'variavel', 3, true),
  (14, '4.3.02', 'Material didatico', 'despesa', 'variavel', 3, true),
  (15, '4.3.03', 'Coffee break e alimentacao', 'despesa', 'variavel', 3, true),
  (16, '4.3.04', 'Deslocamento e hospedagem', 'despesa', 'variavel', 3, true),
  (17, '4.4.01', 'Contabilidade', 'despesa', 'fixo', 4, true),
  (18, '4.4.02', 'Juridico', 'despesa', 'variavel', 4, true),
  (19, '4.4.03', 'Taxas da plataforma de pagamento (Kiwify)', 'despesa', 'variavel', 4, true),
  (20, '4.4.04', 'Impostos sobre a receita', 'despesa', 'variavel', 4, true),
  (21, '4.5.01', 'Pro-labore dos socios', 'despesa', 'fixo', 5, true),
  (22, '4.5.02', 'Salarios e encargos', 'despesa', 'fixo', 5, true),
  (23, '4.5.03', 'Prestadores PJ', 'despesa', 'variavel', 5, true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- cadeiras (7 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO cadeiras (id, nome, diretoria, clausula, responsabilidades, ocupante_id, vaga_aberta, ordem_contratacao) VALUES
  (1, 'Conselho de Socios', 'Conselho', 'Contrato social', 'Quarta Oficial, alcadas, contrato social', NULL, false, NULL),
  (2, 'Administrativo, Financeiro e Governanca', 'Administrativo', 'Cl. 8a, § 1o', 'Financeiro e contabil; contratos e documentos; pessoas e RH; governanca e rituais', 1, false, NULL),
  (3, 'Comercial, Growth e Marketing', 'Comercial', 'Cl. 8a, § 2o', 'Vendas de SaaS; vendas de cursos e eventos; marketing e conteudo; sucesso do cliente', 2, false, NULL),
  (4, 'Desenvolvimento e Operacoes', 'Desenvolvimento', 'Cl. 8a, § 3o', 'Desenvolvimento CRM e IA; suporte e infraestrutura; logistica de cursos; entrega de projetos', 3, false, NULL),
  (5, 'SDR / Vendedor', 'Comercial', NULL, 'Prospeccao e agendamento de reunioes. Primeira contratacao prevista.', NULL, true, 1),
  (6, 'Analista administrativo-financeiro', 'Administrativo', NULL, 'Conciliacao, cobranca, documentos para a contabilidade.', NULL, true, 2),
  (7, 'Suporte e Sucesso do Cliente', 'Desenvolvimento', NULL, 'Atendimento de chamados e acompanhamento de uso da base.', NULL, true, 3)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- cultura (7 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO cultura (id, pilar, exige, verificacao, responsavel_id, ordem) VALUES
  (1, 'Missao: digitalizar e profissionalizar a gestao politica', 'Contrato e nota em ordem em todo cliente, sem excecao', 'Checklist de onboarding 100% preenchido antes de liberar acesso', NULL, 1),
  (2, 'Visao: sistema de gestao politica mais usado do Brasil', 'Todo processo repetido vira POP; nada depende de memoria', 'Biblioteca de POPs revisada no trimestral', NULL, 2),
  (3, 'Sinceridade', 'Problema e dito na reuniao, nao no corredor', 'Bloco de gargalos da Quarta Oficial sempre com pauta', NULL, 3),
  (4, 'Resolver', 'Quem traz um problema traz pelo menos uma proposta de solucao', 'Item sem proposta volta para o dono antes de entrar na pauta', NULL, 4),
  (5, 'Organizacao', 'Prazo combinado e prazo cumprido; documento mora no drive oficial', 'Registro de Decisoes com taxa de entrega no prazo', NULL, 5),
  (6, 'O time e a forca', 'Numero aberto entre os socios: caixa, margem, pipeline', 'Painel de indicadores visivel para os 3 socios o tempo todo', NULL, 6),
  (7, 'O vinculo e o caminho', 'Cliente e acompanhado depois da venda, nao so ate ela', 'Contato de sucesso do cliente registrado no CRM interno', NULL, 7)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- alcadas (6 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO alcadas (id, tipo_decisao, quem_decide, onde_registra, limite_valor, ordem) VALUES
  (1, 'Despesa recorrente ja orcada', 'Diretor da area', 'Lancamento financeiro', NULL, 1),
  (2, 'Despesa nova ate R$ 1.000', 'Diretor da area, avisando no grupo', 'Registro de Decisoes', 1000, 2),
  (3, 'Despesa nova acima de R$ 1.000 ou contrato acima de 6 meses', 'Quarta Oficial, maioria', 'Ata', 1000, 3),
  (4, 'Desconto fora da tabela de precos', 'Diretor Comercial ate 15%; acima disso, Quarta Oficial', 'CRM + ata', NULL, 4),
  (5, 'Contratacao e desligamento', 'Aprovacao na Quarta Oficial; execucao pelo Administrador (Cl. 8a, § 1o)', 'Ata', NULL, 5),
  (6, 'Emprestimo, mudanca de funcoes, entrada ou saida de socio', 'Unanimidade (Cl. 8a, § 4o)', 'Ata + alteracao contratual', NULL, 6)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- rituais (6 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO rituais (id, nome, quando, duracao, participantes, foco, ordem, ativo) VALUES
  (1, 'Segunda de Prioridades', 'Segunda, inicio do dia', '15 min', 'Socios (depois, lideres)', 'As 3 prioridades de cada diretoria na semana', 1, true),
  (2, 'Sessoes de trabalho', 'Livre, durante a semana', 'Variavel', 'Quem a tarefa exigir', 'Execucao; nada estrategico e decidido aqui', 2, true),
  (3, 'Quarta Oficial', 'Toda quarta, horario fixo', '90 min', 'Os 3 socios', 'Governanca, caixa, vendas, entrega e gargalos', 3, true),
  (4, 'Fechamento Mensal', '1a quarta do mes (substitui a Quarta Oficial)', '2h', 'Os 3 socios', 'DRE por unidade, indicadores, metas do mes seguinte', 4, true),
  (5, 'Planejamento Trimestral', '1a quarta de jan, abr, jul e out', 'Meio periodo', 'Os 3 socios', 'OKRs do trimestre, revisao do manual, orcamento', 5, true),
  (6, 'Planejamento Anual', 'Novembro', '1 dia', 'Os 3 socios', 'Metas do ano amarradas ao calendario eleitoral', 6, true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- pops (7 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO pops (id, codigo, nome, cadeira_dona, versao, objetivo, quando_usar, responsavel, aprovador, passos, checklist, revisao, ultima_revisao, prioridade, status, link_drive) VALUES
  (1, 'POP-ADM-01', 'Emissao de contrato, cobranca e NFS-e', 'Administrador', '1.0', 'Garantir que nenhum cliente receba entrega sem contrato assinado e nota emitida.', 'Assim que o Comercial marca a negociacao como fechada e ganha.', 'Administrador', 'Administrador', 'Receber as condicoes negociadas do Comercial
Emitir o contrato a partir do modelo de licenca
Colher a assinatura do cliente
Emitir a cobranca no meio de pagamento combinado
Emitir a NFS-e
Avisar Desenvolvimento para liberar o acesso', 'Contrato assinado e arquivado em 02_Comercial
Cobranca emitida
NFS-e emitida
Lancamento de receita criado com etiqueta da unidade de negocio', 'trimestral', NULL, 1, 'pendente', NULL),
  (2, 'POP-ADM-02', 'Cobranca de inadimplentes', 'Administrador', '1.0', 'Recuperar valores vencidos sem depender de memoria e sem liberar entrega para quem nao pagou.', 'Toda segunda, na conciliacao, para toda fatura vencida.', 'Administrador', 'Administrador', 'Listar faturas vencidas na conciliacao da segunda
Enviar a 1a cobranca (lembrete)
2a tentativa recusada: abrir cobranca formal
Avisar o Comercial sobre risco de cancelamento
Suspender acesso conforme contrato se nao houver acordo
Registrar acordo ou baixa no sistema', 'Nenhuma fatura vencida sem tentativa registrada
Inadimplencia do mes abaixo de 5% da receita
Clientes em risco marcados no CRM', 'trimestral', NULL, 2, 'pendente', NULL),
  (3, 'POP-ADM-03', 'Fechamento mensal', 'Administrador', '1.0', 'Fechar o mes com DRE por unidade de negocio, reinvestimento e distribuicao calculados.', 'Do dia 1 ao dia 10 de cada mes; apresentado na 1a quarta.', 'Administrador', 'Os 3 socios', 'Conciliar banco e plataforma de pagamento do mes
Enviar documentos a contabilidade ate o dia 5
Fechar o DRE por unidade de negocio ate o dia 10
Calcular lucro liquido, 50% de reinvestimento e distribuicao 40/30/30
Atualizar a reserva e o indicador de meses de caixa
Apresentar no Fechamento Mensal', 'Extrato 100% conciliado
Documentos enviados a contabilidade
DRE por unidade fechado
Reinvestimento transferido para a conta separada
Fechamento registrado no sistema', 'trimestral', NULL, 3, 'pendente', NULL),
  (4, 'POP-GOV-01', 'Pauta, conducao e ata da Quarta Oficial', 'Administrador', '1.0', 'Garantir que toda quarta termine com decisoes registradas, com dono e prazo.', 'Toda semana: pauta ate terca as 18h, reuniao na quarta.', 'Administrador', 'Administrador', 'Abrir a pauta e cobrar propostas de solucao ate terca as 18h
Recusar item que chegar sem proposta
Conduzir os 6 blocos no tempo (10/15/20/20/20/5)
Registrar cada decisao com dono e prazo
Ler as decisoes do dia no fechamento
Salvar a ata em 00_Governanca/Atas', 'Pauta enviada ate terca 18h
Registro de Decisoes revisado na abertura
Ata salva no drive
Toda decisao com dono e prazo', 'trimestral', NULL, 4, 'pendente', NULL),
  (5, 'POP-COM-01', 'Proposta comercial e funil de vendas', 'Comercial', '1.0', 'Padronizar proposta, desconto e atualizacao do funil.', 'A cada lead qualificado.', 'Comercial', 'Comercial', 'Qualificar o lead e registrar no CRM
Montar a proposta pela tabela de precos
Desconto ate 15%: decidir sozinho; acima: levar a Quarta Oficial
Registrar valor, probabilidade e previsao de fechamento
Atualizar a etapa a cada contato
Fechada e ganha: acionar o POP-ADM-01', 'Negociacao com valor e probabilidade preenchidos
Desconto dentro da alcada ou aprovado em ata
Proximo passo definido com data', 'trimestral', NULL, 5, 'pendente', NULL),
  (6, 'POP-PRO-01', 'Onboarding de cliente do CRM', 'Desenvolvimento', '1.0', 'Colocar o gabinete usando o produto e ativado em 30 dias.', 'Apos confirmacao de pagamento ou sinal.', 'Desenvolvimento', 'Desenvolvimento', 'Criar os perfis e liberar os acessos
Treinar a equipe do gabinete
Registrar o treinamento no CRM interno
Acompanhar o uso em 30 dias (CS)
Registrar contato de sucesso do cliente', 'Acessos liberados
Equipe treinada
Uso verificado em 30 dias
Cliente marcado como ativado', 'trimestral', NULL, 6, 'pendente', NULL),
  (7, 'POP-PRO-02', 'Organizacao e execucao de workshop', 'Desenvolvimento', '1.0', 'Executar o evento sem risco de caixa e com NPS medido.', 'A cada workshop ou curso vendido.', 'Desenvolvimento', 'Desenvolvimento', 'Confirmar sinal de no minimo 50% antes de qualquer custo
Confirmar agenda e local
Enviar material preparatorio aos inscritos
Executar o evento
Coletar o NPS
Lancar receita e custo com a etiqueta Educacao', 'Sinal de 50% recebido antes do primeiro custo
Local e material confirmados
NPS coletado
Margem da turma apurada', 'trimestral', NULL, 7, 'pendente', NULL)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- raci (12 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO raci (id, atividade, administrador, administrador_nota, comercial, comercial_nota, desenvolvimento, desenvolvimento_nota, observacao, ordem) VALUES
  (1, 'Contratos, notas fiscais e cobranca', 'R/A', 'Emite o contrato, colhe assinatura, emite a NFS-e e acompanha o pagamento', 'C', 'Passa as condicoes negociadas antes da emissao', 'I', 'E avisado para liberar o acesso', NULL, 1),
  (2, 'Fechamento financeiro e DRE', 'R/A', 'Concilia, fecha o mes com a contabilidade e apresenta o DRE', 'I', 'Recebe o resultado da sua unidade', 'I', 'Recebe os custos de tecnologia do mes', NULL, 2),
  (3, 'Orcamento anual', 'R', 'Monta o orcamento a partir dos numeros de cada area', 'C', 'Informa metas de venda e custos comerciais', 'C', 'Informa custos de infraestrutura e roadmap', 'A coletivo na Quarta Oficial', 3),
  (4, 'Precificacao de software e cursos', 'C', 'Valida margem e impacto no caixa', 'R/A', 'Define a tabela de precos e as condicoes', 'C', 'Informa o custo tecnico de cada plano', NULL, 4),
  (5, 'Prospeccao e fechamento de vendas', 'I', 'Recebe o contrato fechado para emitir', 'R/A', 'Prospecta, negocia e fecha', 'C', 'Apoia em demonstracoes tecnicas', NULL, 5),
  (6, 'Marketing e conteudo da marca', 'I', 'Acompanha o gasto com anuncios', 'R/A', 'Planeja e publica campanhas e conteudo', 'C', 'Valida o que e dito sobre o produto', NULL, 6),
  (7, 'Sucesso do cliente e renovacao', 'I', 'E avisado de riscos de cancelamento', 'R/A', 'Acompanha o cliente e conduz a renovacao', 'C', 'Traz dados de uso de cada cliente', NULL, 7),
  (8, 'Roadmap do CRM e da IA', 'C', 'Confirma se o orcamento comporta', 'C', 'Traz o que os clientes pedem', 'R/A', 'Decide prioridades e desenvolve', NULL, 8),
  (9, 'Suporte tecnico e seguranca de dados', 'C', 'E acionado em incidente com efeito contratual', 'I', 'E avisado para falar com o cliente', 'R/A', 'Atende chamados e protege a base', NULL, 9),
  (10, 'Logistica de workshops e eventos', 'C', 'Aprova o orcamento do evento', 'C', 'Informa inscritos e expectativas', 'R/A', 'Organiza local, material e execucao', NULL, 10),
  (11, 'Contratacao de pessoas', 'R', 'Conduz o processo e formaliza (Cl. 8a, § 1o)', 'C', 'Entrevista quando a vaga e da sua area', 'C', 'Entrevista quando a vaga e da sua area', 'A coletivo na Quarta Oficial', 11),
  (12, 'Manual de gestao e POPs', 'R/A', 'Mantem o manual e a biblioteca de POPs', 'C', 'Escreve e revisa os POPs comerciais', 'C', 'Escreve e revisa os POPs de produto', NULL, 12)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- indicadores (12 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO indicadores (id, nome, diretoria, frequencia, unidade, alerta_operador, alerta_valor, meta, descricao_alerta, calculo_automatico, ordem, ativo) VALUES
  (1, 'Meses de reserva de caixa', 'Administrativo', 'semanal', 'meses', 'menor', 3, NULL, 'Abaixo de 3 meses', 'reserva_meses', 1, true),
  (2, 'Inadimplencia (% da receita do mes)', 'Administrativo', 'semanal', 'percentual', 'maior', 5, NULL, 'Acima de 5%', 'inadimplencia_pct', 2, true),
  (3, 'Margem liquida por unidade de negocio', 'Administrativo', 'mensal', 'percentual', 'menor', 0, NULL, 'Unidade com margem negativa 2 meses seguidos', 'margem_liquida_pct', 3, true),
  (4, 'Decisoes entregues no prazo', 'Administrativo', 'semanal', 'percentual', 'menor', 80, NULL, 'Abaixo de 80%', 'decisoes_no_prazo_pct', 4, true),
  (5, 'MRR e novos clientes de SaaS', 'Comercial', 'semanal', 'moeda', 'menor', NULL, NULL, 'MRR caindo 2 meses seguidos', 'mrr', 5, true),
  (6, 'Churn mensal de SaaS', 'Comercial', 'mensal', 'percentual', 'maior', 3, NULL, 'Acima de 3% ao mes', 'churn_pct', 6, true),
  (7, 'Ocupacao das turmas', 'Comercial', 'por_evento', 'percentual', 'menor', 60, NULL, 'Abaixo de 60% a 15 dias do evento', 'ocupacao_pct', 7, true),
  (8, 'Pipeline ponderado', 'Comercial', 'semanal', 'moeda', 'menor', NULL, NULL, 'Menor que 3x a meta do mes', 'pipeline_ponderado', 8, true),
  (9, 'Uptime do CRM', 'Desenvolvimento', 'semanal', 'percentual', 'menor', 99.5, NULL, 'Abaixo de 99,5%', NULL, 9, true),
  (10, 'Tempo de primeira resposta no suporte', 'Desenvolvimento', 'semanal', 'numero', 'maior', 4, NULL, 'Acima de 4h uteis', 'primeira_resposta_horas', 10, true),
  (11, 'Ativacao: clientes usando o CRM toda semana', 'Desenvolvimento', 'mensal', 'percentual', 'menor', 70, NULL, 'Abaixo de 70% da base', 'ativacao_pct', 11, true),
  (12, 'Satisfacao pos-workshop (NPS)', 'Desenvolvimento', 'por_evento', 'nota', 'menor', 50, NULL, 'Abaixo de 50', 'nps_eventos', 12, true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- clausulas (7 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO clausulas (id, clausula, documento, resumo, aplicacao, ordem) VALUES
  (1, '8a, §§ 1o a 3o', 'contrato_social', 'Tres funcoes: Administrador, Comercial e Desenvolvimento e Manutencao da Ferramenta', 'Sao as tres diretorias do organograma', 1),
  (2, '8a, caput', 'contrato_social', 'Qualquer socio pode representar a empresa sozinho', 'As alcadas internas limitam isso na pratica', 2),
  (3, '8a, § 4o', 'contrato_social', 'Unanimidade para mudar funcoes, objeto, socios, contrato ou tomar emprestimo', 'Decidido so na Quarta Oficial, com registro em ata', 3),
  (4, '8a, § 5o', 'contrato_social', 'Pro-labore fixado em conjunto pelos tres', 'Valor a definir no primeiro Fechamento Mensal', 4),
  (5, '9a', 'contrato_social', '50% do lucro liquido reinvestido nos primeiros 12 meses (ate 31/07/2027)', 'Vira regra de caixa na secao Financeiro', 5),
  (6, '6a, item 6.2', 'contrato_social', 'Capital de R$ 30.000 integralizado em 3 parcelas anuais', 'Proximas parcelas em 31/07/2027 e 31/07/2028, no calendario do financeiro', 6),
  (7, '6a, item 6.5', 'contrato_social', 'Preferencia de 30 dias para os socios na venda de quotas', 'Referencia para o acordo de socios', 7)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- pendencias (27 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO pendencias (id, titulo, categoria, origem, descricao, responsavel_id, prazo, prioridade, status) VALUES
  (1, 'Clausula 4a, item 4.2: data de inicio das atividades errada', 'societario', 'Manual cap. 04', 'Diz que as atividades comecaram em 22/07/2027; o correto e 2026.', NULL, NULL, 'alta', 'aberta'),
  (2, 'Clausula 9a: conceito de lucro inconsistente', 'societario', 'Manual cap. 04', 'O item 9.1 fala em lucro liquido e o 9.2 em lucro bruto. Usar o mesmo conceito (liquido) nos dois.', NULL, NULL, 'alta', 'aberta'),
  (3, 'Clausula 9a, item 9.3: referencia inexistente', 'societario', 'Manual cap. 04', 'Cita um ''§ 1o'' que nao existe; a referencia certa e o item 9.1.', NULL, NULL, 'media', 'aberta'),
  (4, 'Clausula 10a: herdeiros entram automaticamente na sociedade', 'societario', 'Manual cap. 04', 'Em startup, o comum e prever so o pagamento dos haveres.', NULL, NULL, 'alta', 'aberta'),
  (5, 'Acordo de socios: vesting com cliff', 'societario', 'Manual cap. 04', 'A participacao e conquistada com o tempo de dedicacao.', NULL, NULL, 'alta', 'aberta'),
  (6, 'Acordo de socios: saida e exclusao de socio', 'societario', 'Manual cap. 04', 'O que acontece se um socio sai cedo, por vontade propria ou por falta grave.', NULL, NULL, 'alta', 'aberta'),
  (7, 'Acordo de socios: nao concorrencia e confidencialidade', 'societario', 'Manual cap. 04', NULL, NULL, NULL, 'media', 'aberta'),
  (8, 'Acordo de socios: propriedade intelectual', 'societario', 'Manual cap. 04', 'Codigo do CRM e conteudo dos cursos pertencem a empresa.', NULL, NULL, 'alta', 'aberta'),
  (9, 'Acordo de socios: empate e impasse', 'societario', 'Manual cap. 04', 'Como resolver empate e impasse entre os socios.', NULL, NULL, 'media', 'aberta'),
  (10, 'Corrigir CNPJ no contrato modelo', 'contrato_modelo', 'Manual cap. 05', 'No contrato esta 42.561.964/0001-13; no contrato social e 42.561.954/0001-13.', NULL, NULL, 'alta', 'aberta'),
  (11, 'Anexos I e II citam titular errado', 'contrato_modelo', 'Manual cap. 05', 'Citam ''SO MAIS UMA'' como titular da plataforma; o certo e DEMOCRAT LTDA.', NULL, NULL, 'alta', 'aberta'),
  (12, 'Uniformizar artigo da suspensao (art. 476)', 'contrato_modelo', 'Manual cap. 05', 'Clausula 4.1 cita art. 476 do Codigo Civil e o Anexo I (10.2) cita art. 477 para a mesma suspensao.', NULL, NULL, 'media', 'aberta'),
  (13, 'Teto de responsabilidade por vazamento', 'contrato_modelo', 'Manual cap. 05', 'Clausula 9.5 (c) faz a empresa responder integralmente por vazamento, sem teto. Avaliar com advogado.', NULL, NULL, 'alta', 'aberta'),
  (14, 'Revisar clausula 9.2 (acesso aos dados)', 'contrato_modelo', 'Manual cap. 05', 'Afirma que nem a equipe tecnica acessa os dados. Manter so se for tecnicamente verdade.', NULL, NULL, 'alta', 'aberta'),
  (15, 'Criar modelo de contrato de workshop/curso', 'contrato_modelo', 'Manual cap. 05', NULL, NULL, NULL, 'media', 'aberta'),
  (16, 'Criar modelo de contrato de consultoria estrategica', 'contrato_modelo', 'Manual cap. 05', NULL, NULL, NULL, 'media', 'aberta'),
  (17, 'Criar modelo de contrato de prestador PJ', 'contrato_modelo', 'Manual cap. 05', 'Com cessao de propriedade intelectual.', NULL, NULL, 'media', 'aberta'),
  (18, 'Nomear o encarregado de dados (DPO)', 'lgpd', 'Manual cap. 05 - fase 2', 'Citado na clausula 9.7; publicar o contato no site.', NULL, NULL, 'media', 'aberta'),
  (19, 'Validar enquadramento no Simples (Fator R)', 'tributario', 'Manual cap. 06', 'Objeto de software e de treinamento podem cair em anexos diferentes do Simples.', NULL, NULL, 'alta', 'aberta'),
  (20, 'Avaliar efeito da reforma tributaria nos contratos de 12 meses', 'tributario', 'Manual cap. 06', NULL, NULL, NULL, 'media', 'aberta'),
  (21, 'Listar todos os custos fixos atuais por centro de custo', 'financeiro', 'Manual cap. 06 - primeiro mes', NULL, NULL, NULL, 'alta', 'aberta'),
  (22, 'Listar contratos ativos com valor, vencimento e meio de pagamento', 'financeiro', 'Manual cap. 06 - primeiro mes', NULL, NULL, NULL, 'alta', 'aberta'),
  (23, 'Conciliar repasses da Kiwify com o extrato, descontando taxas', 'financeiro', 'Manual cap. 06 - primeiro mes', NULL, NULL, NULL, 'alta', 'aberta'),
  (24, 'Definir o valor do pro-labore (Cl. 8a, § 5o)', 'financeiro', 'Manual cap. 06 - primeiro mes', NULL, NULL, NULL, 'alta', 'aberta'),
  (25, 'Montar o calendario das parcelas de integralizacao do capital', 'financeiro', 'Manual cap. 06 - primeiro mes', NULL, NULL, NULL, 'media', 'aberta'),
  (26, 'Produzir a versao final do fluxo do cliente', 'comercial', 'Manual cap. 09', 'O manual traz uma sugestao da gestao; a versao final e da Diretoria Comercial.', NULL, NULL, 'media', 'aberta'),
  (27, 'Definir metas dos 12 indicadores no 1o Planejamento Trimestral', 'comercial', 'Manual cap. 11', 'A partir da linha de base real; revisar os sinais de alerta depois de 3 meses de dados.', NULL, NULL, 'alta', 'aberta')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- documentos (10 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO documentos (id, nome, categoria, pasta_drive, cliente_id, emissao, validade, responsavel_id, status, link, observacoes) VALUES
  (1, 'Contrato social DEMOCRAT LTDA (JUCEMG 31/07/2026)', 'societario', '00_Governanca', NULL, NULL, NULL, NULL, 'valido', NULL, 'CNPJ 42.561.954/0001-13'),
  (2, 'Certidao de exclusividade', 'certidao', '02_Comercial', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Kit de venda publica - inexigibilidade (art. 74, I, Lei 14.133/2021)'),
  (3, 'Certidao negativa federal', 'certidao', '01_Admin_Financeiro', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Controle de validade pelo Administrador'),
  (4, 'Certidao negativa estadual', 'certidao', '01_Admin_Financeiro', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Controle de validade pelo Administrador'),
  (5, 'Certidao negativa municipal', 'certidao', '01_Admin_Financeiro', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Controle de validade pelo Administrador'),
  (6, 'Certidao negativa FGTS', 'certidao', '01_Admin_Financeiro', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Controle de validade pelo Administrador'),
  (7, 'Certidao negativa trabalhista', 'certidao', '01_Admin_Financeiro', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Controle de validade pelo Administrador'),
  (8, 'Atestados de capacidade tecnica', 'atestado', '02_Comercial', NULL, NULL, NULL, NULL, 'pendente', NULL, 'De clientes atuais - kit de venda publica'),
  (9, 'Justificativa de preco', 'modelo', '02_Comercial', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Com contratos ja praticados com outros clientes'),
  (10, 'Contrato modelo de licenca do CRM', 'modelo', '02_Comercial', NULL, NULL, NULL, NULL, 'pendente', NULL, 'Em ajuste - ver pendencias de contrato modelo')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- capital_parcelas (3 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO capital_parcelas (id, descricao, vencimento, valor, status, data_pagamento, observacoes) VALUES
  (1, '1a parcela de integralizacao do capital (Cl. 6a, 6.2)', '2026-07-31', 10000, 'pendente', NULL, 'Confirmar se foi integralizada na constituicao'),
  (2, '2a parcela de integralizacao do capital (Cl. 6a, 6.2)', '2027-07-31', 10000, 'pendente', NULL, NULL),
  (3, '3a parcela de integralizacao do capital (Cl. 6a, 6.2)', '2028-07-31', 10000, 'pendente', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- glossario (52 registro(s))
-- ----------------------------------------------------------------------------
INSERT INTO glossario (id, termo, categoria, definicao, na_democratia) VALUES
  (1, 'Ata', 'gestao', 'Registro escrito do que foi discutido e decidido numa reuniao', 'Toda Quarta Oficial gera uma ata no drive'),
  (2, 'Alcada', 'gestao', 'Limite do que cada pessoa pode decidir sozinha', 'Diretor gasta ate R$ 1.000 sem reuniao'),
  (3, 'Cadeira', 'gestao', 'Funcao fixa da empresa, independente de quem ocupa', 'Administrador, Comercial, Desenvolvimento'),
  (4, 'Gargalo', 'gestao', 'Ponto que trava o andamento de outras tarefas', 'Contrato parado esperando assinatura'),
  (5, 'Growth', 'gestao', 'Area de crescimento: tudo que traz e mantem cliente', 'Diretoria Comercial e Growth'),
  (6, 'KPI (indicador)', 'gestao', 'Numero que mostra se uma area vai bem ou mal', 'Churn, MRR, uptime'),
  (7, 'OKR', 'gestao', 'Objetivo do trimestre + 2 ou 3 resultados mediveis que provam que ele foi atingido', '''Dobrar a base de gabinetes'' -> ''40 clientes ativos'''),
  (8, 'Organograma', 'gestao', 'Desenho de quem responde a quem', 'Conselho de Socios acima das 3 diretorias'),
  (9, 'Playbook', 'gestao', 'Conjunto de POPs de uma area inteira', 'Playbook comercial = todos os POPs de venda'),
  (10, 'POP', 'gestao', 'Procedimento Operacional Padrao: passo a passo escrito de uma tarefa que se repete', 'POP-ADM-01, emissao de contrato e NFS-e'),
  (11, 'RACI', 'gestao', 'Matriz que diz quem executa (R), aprova (A), e consultado (C) e informado (I)', 'Secao Matriz RACI'),
  (12, 'Registro de Decisoes', 'gestao', 'Planilha unica com toda decisao, dono, prazo e status', 'Revisado na abertura de toda Quarta Oficial'),
  (13, 'Ritual', 'gestao', 'Reuniao fixa, com dia, duracao e pauta definidos', 'Segunda de Prioridades, Quarta Oficial'),
  (14, 'Caixa minimo (reserva)', 'financeiro', 'Dinheiro guardado para pagar os custos fixos em meses ruins', 'Meta de 6 meses de custo fixo'),
  (15, 'Centro de custo', 'financeiro', '''Gaveta'' onde cada despesa e classificada', 'Tecnologia, Comercial, Cursos, Admin, Pessoas'),
  (16, 'Conciliacao bancaria', 'financeiro', 'Conferir se o que esta no controle bate com o extrato', 'Toda segunda-feira'),
  (17, 'Custo fixo', 'financeiro', 'Gasto que existe mesmo sem vender nada', 'Servidores, contabilidade, pro-labore'),
  (18, 'Distribuicao de lucros', 'financeiro', 'Parte do lucro paga aos socios na proporcao das quotas', '50% do lucro ate 07/2027 (Cl. 9a)'),
  (19, 'DRE', 'financeiro', 'Demonstrativo do Resultado: receita menos custos do mes = lucro ou prejuizo', 'Um DRE por unidade de negocio'),
  (20, 'Inadimplencia', 'financeiro', 'Valor vencido e nao pago pelos clientes', 'Cobranca a partir da 2a tentativa recusada'),
  (21, 'Integralizacao', 'financeiro', 'Colocar de fato no caixa o capital que o socio prometeu', '3 parcelas anuais (Cl. 6a)'),
  (22, 'Margem', 'financeiro', 'Quanto sobra de cada real vendido depois dos custos', 'Margem por turma de workshop'),
  (23, 'Plano de contas', 'financeiro', 'Lista padronizada de todas as categorias de receita e despesa', 'Base da planilha ou ERP financeiro'),
  (24, 'Pro-labore', 'financeiro', 'Remuneracao mensal do socio pelo trabalho, separada do lucro', 'Valor definido pelos 3 (Cl. 8a, § 5o)'),
  (25, 'Reinvestimento', 'financeiro', 'Parte do lucro que fica na empresa para crescer', '50% do lucro liquido ate 31/07/2027'),
  (26, 'Sazonalidade', 'financeiro', 'Variacao previsivel da receita conforme a epoca', 'Ano eleitoral vende mais curso e estrategia'),
  (27, 'Unidade de negocio', 'financeiro', 'Braco da empresa com receita e resultado proprios', 'Software, Educacao, Estrategia'),
  (28, 'Ativacao', 'comercial', 'Cliente que realmente usa o produto depois de comprar', 'Gabinete que usa o CRM toda semana'),
  (29, 'Churn', 'comercial', 'Percentual de clientes que cancelam no mes', '1 cancelamento em 50 clientes = 2%'),
  (30, 'CRM', 'comercial', 'Sistema que organiza contatos e o historico de relacionamento', 'O produto da empresa, para gabinetes'),
  (31, 'CS (Sucesso do Cliente)', 'comercial', 'Area que acompanha o cliente depois da venda para ele ter resultado e renovar', 'O ''vinculo'' dos valores, na pratica'),
  (32, 'MRR', 'comercial', 'Receita recorrente mensal: soma das licencas ativas no mes', '10 licencas x R$ 397 = R$ 3.970'),
  (33, 'NPS', 'comercial', 'Nota de 0 a 10 que mede se o cliente recomendaria a empresa', 'Pesquisa ao fim de cada workshop'),
  (34, 'Onboarding', 'comercial', 'Processo de colocar o cliente novo para usar o produto', 'Liberar acesso e treinar o gabinete'),
  (35, 'Pipeline (funil)', 'comercial', 'Lista de negociacoes em andamento, por etapa', 'Revisado no bloco Comercial da quarta'),
  (36, 'Pipeline ponderado', 'comercial', 'Valor do pipeline multiplicado pela chance de fechar', 'R$ 10 mil com 30% de chance = R$ 3 mil'),
  (37, 'Roadmap', 'comercial', 'Plano de quais funcionalidades serao desenvolvidas e quando', 'Responsabilidade da cadeira de Desenvolvimento'),
  (38, 'SaaS', 'comercial', 'Software vendido como assinatura, acessado pela internet', 'Modelo de licenca do CRM'),
  (39, 'SDR', 'comercial', 'Vendedor focado em prospectar e marcar reunioes', 'Provavel primeira contratacao comercial'),
  (40, 'SLA', 'comercial', 'Prazo de atendimento prometido ao cliente', 'Primeira resposta no suporte em ate 4h uteis'),
  (41, 'Uptime', 'comercial', 'Percentual do tempo em que o sistema ficou no ar', 'Meta acima de 99,5%'),
  (42, 'Acordo de socios', 'juridico', 'Contrato privado entre os socios com regras que nao vao no contrato social', 'Vesting, saida, nao concorrencia'),
  (43, 'Cliff', 'juridico', 'Prazo minimo antes de o socio comecar a ganhar participacao no vesting', 'Ex.: 12 meses'),
  (44, 'Contrato social', 'juridico', 'Documento registrado na Junta que cria a empresa e define socios e regras', 'Registrado na JUCEMG em 31/07/2026'),
  (45, 'Controlador e operador (LGPD)', 'juridico', 'Controlador decide o uso dos dados; operador trata os dados em nome dele', 'Gabinete = controlador; DEMOCRAT = operadora'),
  (46, 'DPO (encarregado)', 'juridico', 'Pessoa que responde por protecao de dados perante clientes e titulares', 'Pendencia da fase 2'),
  (47, 'Drag along', 'juridico', 'Se a maioria vende a empresa, obriga os outros a vender junto', 'Clausula do acordo de socios'),
  (48, 'Inexigibilidade', 'juridico', 'Contratacao publica sem licitacao quando so existe um fornecedor possivel', 'Venda com certidao de exclusividade'),
  (49, 'NFS-e', 'juridico', 'Nota fiscal eletronica de servico', 'Emitida a cada cobranca'),
  (50, 'Quotas', 'juridico', 'Partes em que o capital da empresa e dividido', '30.000 quotas: 40% / 30% / 30%'),
  (51, 'Tag along', 'juridico', 'Se um socio vende, os outros tem direito de vender nas mesmas condicoes', 'Clausula do acordo de socios'),
  (52, 'Vesting', 'juridico', 'Participacao do socio conquistada aos poucos, com o tempo de dedicacao', 'Protege a empresa se alguem sair cedo')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- configuracoes (15 parametro(s))
-- ----------------------------------------------------------------------------
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('custo_fixo_mensal', '0', 'Custo fixo mensal usado para calcular meses de reserva'),
  ('desconto_limite_comercial', '15', 'Desconto maximo que o Diretor Comercial aprova sozinho'),
  ('empresa_cidade', 'Lagoa Santa/MG', 'Sede'),
  ('empresa_cnpj', '42.561.954/0001-13', 'CNPJ do contrato social'),
  ('empresa_marca', 'DEMOCRAT.IA', 'Nome fantasia / marca'),
  ('empresa_nome', 'DEMOCRAT LTDA', 'Razao social'),
  ('meta_mrr', '0', 'Meta de MRR do mes'),
  ('meta_vendas_mes', '0', 'Meta de vendas do mes (usada no pipeline ponderado 3x)'),
  ('reinvestimento_ate', '2027-07-31', 'Fim da regra de reinvestimento de 50%'),
  ('reinvestimento_pct', '50', 'Percentual do lucro liquido reinvestido (Cl. 9a)'),
  ('reserva_alerta_meses', '3', 'Abaixo disso e alerta vermelho na Quarta Oficial'),
  ('reserva_meta_meses', '6', 'Meta de reserva de caixa, em meses de custo fixo'),
  ('saldo_inicial_caixa', '0', 'Saldo de caixa na data de inicio do controle'),
  ('sinal_minimo_evento_pct', '50', 'Sinal minimo antes de qualquer custo do evento'),
  ('sla_primeira_resposta_horas', '4', 'SLA de primeira resposta no suporte, em horas uteis')
ON CONFLICT (chave) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Acerta os contadores de id depois das insercoes com id explicito
-- ----------------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('pessoas', 'id'), COALESCE((SELECT MAX(id) FROM pessoas), 1));
SELECT setval(pg_get_serial_sequence('unidades_negocio', 'id'), COALESCE((SELECT MAX(id) FROM unidades_negocio), 1));
SELECT setval(pg_get_serial_sequence('centros_custo', 'id'), COALESCE((SELECT MAX(id) FROM centros_custo), 1));
SELECT setval(pg_get_serial_sequence('plano_contas', 'id'), COALESCE((SELECT MAX(id) FROM plano_contas), 1));
SELECT setval(pg_get_serial_sequence('cadeiras', 'id'), COALESCE((SELECT MAX(id) FROM cadeiras), 1));
SELECT setval(pg_get_serial_sequence('cultura', 'id'), COALESCE((SELECT MAX(id) FROM cultura), 1));
SELECT setval(pg_get_serial_sequence('alcadas', 'id'), COALESCE((SELECT MAX(id) FROM alcadas), 1));
SELECT setval(pg_get_serial_sequence('rituais', 'id'), COALESCE((SELECT MAX(id) FROM rituais), 1));
SELECT setval(pg_get_serial_sequence('pops', 'id'), COALESCE((SELECT MAX(id) FROM pops), 1));
SELECT setval(pg_get_serial_sequence('raci', 'id'), COALESCE((SELECT MAX(id) FROM raci), 1));
SELECT setval(pg_get_serial_sequence('indicadores', 'id'), COALESCE((SELECT MAX(id) FROM indicadores), 1));
SELECT setval(pg_get_serial_sequence('clausulas', 'id'), COALESCE((SELECT MAX(id) FROM clausulas), 1));
SELECT setval(pg_get_serial_sequence('pendencias', 'id'), COALESCE((SELECT MAX(id) FROM pendencias), 1));
SELECT setval(pg_get_serial_sequence('documentos', 'id'), COALESCE((SELECT MAX(id) FROM documentos), 1));
SELECT setval(pg_get_serial_sequence('capital_parcelas', 'id'), COALESCE((SELECT MAX(id) FROM capital_parcelas), 1));
SELECT setval(pg_get_serial_sequence('glossario', 'id'), COALESCE((SELECT MAX(id) FROM glossario), 1));
