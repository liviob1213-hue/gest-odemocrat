# DEMOCRAT.IA — Sistema de Gestão e Governança

Sistema interno da **DEMOCRAT LTDA** (Lagoa Santa/MG) que transforma o
*Manual de Gestão e Governança v1* (outubro/2026) em software: cada capítulo do
manual virou um módulo com cadastro, cálculo e sinal de alerta.

---

## Como rodar

Os dados ficam no **Supabase** (PostgreSQL na nuvem). A primeira vez exige
conectar o projeto — o guia completo, passo a passo e sem jargão, está em
**[PASSO-A-PASSO.md](PASSO-A-PASSO.md)**.

Para publicar na internet: **[DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)**.

> ⚠️ **O sistema não tem tela de login.** Publicado na internet, quem tiver o
> endereço lê e altera tudo. Existe uma trava simples por senha, que liga ao
> definir a variável de ambiente `SENHA_ACESSO` — veja o passo 4 do
> DEPLOY-VERCEL.md. Sem essa variável (uso local), nada muda.

Resumo para quem já conhece:

```bash
npm install
npm run db:conectar    # pergunta a connection string e grava o .env.local
npm run db:instalar    # cria as tabelas e carrega o manual
npm run dev
```

Abra <http://localhost:3000>.

> **No Windows**, o PowerShell bloqueia o `npm` por padrão
> (*"a execução de scripts foi desabilitada neste sistema"*, porque o `npm` é um
> `.ps1`). Use **`npm.cmd`** no lugar de `npm`, ou os três arquivos de duplo
> clique na raiz do projeto: `PASSO-1-conectar-banco.cmd`,
> `PASSO-2-criar-tabelas.cmd` e `PASSO-3-iniciar-sistema.cmd`.

A connection string fica no botão **Connect**, no topo da página do projeto no
Supabase, bloco **Session pooler**.

Para gerar a versão de produção:

```bash
npm run build
npm start
```

### Comandos disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o sistema em modo desenvolvimento |
| `npm run db:conectar` | Pergunta a connection string, testa e grava o `.env.local` |
| `npm run db:testar` | Testa a conexão e diz, em português, o que falta |
| `npm run db:instalar` | Cria a estrutura e carrega os dados do manual |
| `npm run db:validar` | Roda os arquivos SQL num PostgreSQL em memória e confere todas as consultas do sistema |
| `npm run db:local` | Sobe um PostgreSQL temporário na porta 5433, para trabalhar sem internet |

### Dados de exemplo

Em **Estrutura → Parâmetros do sistema** há dois botões:

- **Carregar dados de exemplo** — preenche um mês típico de operação (8 clientes,
  contratos, cobranças, lançamentos, pipeline, eventos, projetos, atas e decisões)
  para você conhecer o sistema antes de ter número real.
- **Zerar todo o movimento** — apaga só os dados operacionais. O conteúdo do
  manual (POPs, RACI, indicadores, cláusulas, pendências, glossário) permanece.

Baixe um backup pelo link na barra lateral antes de zerar.

---

## O que cada módulo cobre

| Módulo | Capítulo do manual | O que faz |
| --- | --- | --- |
| **Painel** | 11 — Indicadores | Caixa, reserva, MRR, inadimplência, pipeline ponderado, decisões no prazo, DRE do mês, projeção de caixa e a varredura de sinais de alerta |
| **Pipeline de vendas** | 08 (bloco 2) | Funil em quadro, arrastável. Marca desconto acima de 15% que, pela alçada, depende da Quarta Oficial |
| **Clientes** | 02 e 09 | Ficha com contratos, cobranças, chamados, interações e o checklist de onboarding do fluxo do cliente |
| **Onboarding** | 09 — Fluxo do cliente | Trilho administrativo comum + ramo (Software, Educação, Estratégia), gerado a partir do modelo do manual |
| **Fluxo de caixa** | 06 | Lançamentos com etiqueta de unidade de negócio, centro de custo e conta (operacional / reinvestimento / impostos); conciliação |
| **DRE por unidade** | 06 | Receita menos custo por braço da empresa, com a série dos últimos 6 meses e o alerta de margem negativa por 2 meses |
| **Contratos** | 05 | Valor, vencimento, meio de pagamento, assinatura e inexigibilidade (art. 74, I, Lei 14.133/2021) |
| **Cobranças e NFS-e** | POP-ADM-01 e 02 | Geração das cobranças do mês a partir dos contratos, fila de inadimplentes e lançamento automático no caixa |
| **Fechamento mensal** | 06 | Lucro, reinvestimento e distribuição por competência |
| **Capital e sócios** | Cl. 6ª, 8ª § 5º e 9ª | Integralização em 3 parcelas, pró-labore e a regra dos 50% até 31/07/2027 |
| **Turmas e eventos** | Unidade Educação | Ocupação, sinal mínimo de 50% antes de qualquer custo, margem e NPS |
| **Projetos e entregas** | Unidade Estratégia | Kickoff, cronograma, entregas com aprovação e relatório final |
| **Suporte e SLA** | 11 | Chamados, primeira resposta em 4h úteis, incidentes |
| **Roadmap** | RACI — Roadmap do CRM e da IA | Prioridades da cadeira de Desenvolvimento |
| **Quarta Oficial** | 08 | Roteiro dos 6 blocos, números da semana calculados pelo sistema e abertura da ata com um clique |
| **Registro de Decisões** | 08 | Decisão, dono, prazo, status e a taxa de entrega no prazo (meta 80%) |
| **Prioridades da semana** | 07 | As 3 prioridades de cada diretoria |
| **Alçadas e rituais** | 04 e 07 | Quem decide o quê sem reunião; calendário dos 6 rituais |
| **Indicadores** | 11 | Os 12 números, com cálculo automático onde possível e leitura manual onde não |
| **POPs** | 05 | Biblioteca no formato de uma página: objetivo, gatilho, R/A, passos e checklist |
| **Matriz RACI** | 10 | Atividade × cadeira, com checagem de "só um A por atividade" |
| **Cultura em regras** | 02 | Pilar, o que exige na prática e como a gente verifica |
| **Pendências** | 04 e 05 | As 27 correções que o manual aponta: contrato social, acordo de sócios, contrato modelo, LGPD e tributário |
| **Documentos** | 05 | Drive oficial e kit de venda pública, com controle de validade das certidões |
| **Organograma** | 03 | Conselho, três diretorias, cadeiras vagas na ordem de contratação e as unidades de negócio |

---

## Arquitetura

```
supabase/
  01-estrutura.sql   Tabelas, índices, gatilhos e segurança (RLS)
  02-dados-do-manual.sql
                     O conteúdo do manual virado em dados
src/
  lib/
    db.ts            Pool de conexão com o Postgres + helpers de consulta
    resources.ts     Registro de metadados de TODAS as entidades
    validation.ts    Validação derivada dos metadados (zod)
    repository.ts    CRUD genérico com SQL parametrizado
    analytics.ts     Motor de indicadores, DRE, projeções e alertas
    onboarding.ts    Modelos do fluxo do cliente (cap. 09)
    demo.ts          Carga de exemplo e zeramento do movimento
  app/
    api/resources/   API REST genérica (lista, cria, edita, exclui)
    api/faturamento  Rotinas do POP-ADM-01 e 02
    api/backup       Exportação completa em JSON
    (páginas)        Uma rota por módulo
  components/
    resource-view    Tela padrão: busca, filtros, tabela, formulário modal
    record-form      Formulário gerado a partir dos metadados
    pipeline-board   Funil arrastável
    charts           Gráficos (Recharts)
```

**A ideia central:** cada entidade é descrita **uma única vez** em
[`src/lib/resources.ts`](src/lib/resources.ts) — colunas, tipos, opções de
select e relacionamentos. A partir dessa descrição o sistema deriva sozinho a
API REST, a validação com mensagens em português, a tabela com filtros e o
formulário. Acrescentar um campo novo em qualquer módulo é editar uma linha.

As consultas montam as colunas a partir dos metadados e passam **todo** valor
como parâmetro vinculado, então a API genérica não abre espaço para injeção de
SQL. Colunas desconhecidas em filtros ou ordenação são recusadas.

### Banco de dados

PostgreSQL no Supabase, acessado pelo driver `pg` com a connection string do
**Session pooler**. O acesso é direto ao banco, e não pela API REST automática
do Supabase: o sistema faz agregações (DRE por unidade, série de 12 meses,
pipeline ponderado, projeção de caixa) que só o SQL resolve bem.

Detalhes que importam na prática:

- **Datas voltam como texto `AAAA-MM-DD`.** Um type parser desliga a conversão
  automática para `Date`, que deslocaria o dia conforme o fuso.
- **`numeric` volta como número**, não como texto — todo cálculo é feito em JS.
- **Transações usam `AsyncLocalStorage`** para garantir que tudo dentro de um
  `transaction()` use a mesma conexão do pool.
- **A API pública do Supabase fica travada.** O `01-estrutura.sql` liga RLS em
  todas as tabelas sem criar policy nenhuma e revoga o acesso dos papéis `anon`
  e `authenticated`. Sem isso, a chave pública do projeto daria acesso de
  leitura a contratos, faturas e atas.

Requer **Node 20 ou superior** (testado no Node 24).

---

## Backup

- **Exportar backup (JSON)** — link no rodapé da barra lateral; baixa todas as
  tabelas em um arquivo legível, que também serve de ponte para planilha ou ERP.
- O Supabase faz backup automático do banco.

O arquivo `.env.local` guarda a senha do banco e está no `.gitignore`: nunca
deve ir para o repositório.

---

## Primeiros passos sugeridos

Depois de conectar o Supabase ([PASSO-A-PASSO.md](PASSO-A-PASSO.md)), siga o
que o próprio manual pede para o primeiro mês (capítulo 06):

1. **Estrutura → Pessoas e sócios**: troque os três nomes genéricos pelos reais
   e confirme as quotas (40 / 30 / 30).
2. **Estrutura → Parâmetros**: informe o saldo inicial de caixa e o custo fixo
   mensal — sem eles o painel estima a reserva em vez de medir.
3. **Fluxo de caixa**: lance todos os custos fixos atuais, por centro de custo.
4. **Contratos**: cadastre os contratos ativos com valor, vencimento e meio de
   pagamento.
5. **Cobranças**: use *Gerar cobranças do mês* e concilie os repasses da Kiwify
   com o extrato, descontando as taxas.
6. **Capital e sócios**: defina o pró-labore (Cl. 8ª, § 5º) e confira o
   calendário de integralização.
7. **Indicadores**: no primeiro Planejamento Trimestral, defina as metas a
   partir da linha de base real — os sinais de alerta cadastrados são pontos de
   partida, para revisar depois de 3 meses de dados próprios.

---

*O time é a força. O vínculo é o caminho.*
