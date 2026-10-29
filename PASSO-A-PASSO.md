# Conectar o sistema ao Supabase

São **duas** tarefas, nessa ordem:

1. **Criar as tabelas** — copiar e colar dois arquivos no SQL Editor. Fácil.
2. **Conectar o sistema ao banco** — duplo clique num arquivo que pergunta o que precisa.

Leva uns 10 minutos.

---

> ## 🟦 Não precisa digitar nada no PowerShell
>
> Na pasta do projeto existem três arquivos para **duplo clique**, na ordem:
>
> | Arquivo | Quando usar |
> |---|---|
> | **`PASSO-1-conectar-banco.cmd`** | Uma vez, para ligar o sistema ao seu Supabase |
> | **`PASSO-2-criar-tabelas.cmd`** | Alternativa à Parte 1 deste guia, se preferir não copiar e colar o SQL |
> | **`PASSO-3-iniciar-sistema.cmd`** | **Toda vez** que for usar o sistema |
>
> **Por que eles existem:** no Windows, o comando `npm` é um script do
> PowerShell, e o PowerShell vem configurado de fábrica para bloquear scripts.
> Por isso `npm run ...` devolve o erro
> *"a execução de scripts foi desabilitada neste sistema"*. Esses três arquivos
> contornam isso — não mexem em nenhuma configuração do seu computador.
>
> Se preferir usar o terminal mesmo assim, troque `npm` por **`npm.cmd`**:
> `npm.cmd run db:conectar`. Funciona igual.

> **Conferido na documentação oficial da Supabase em 28/10/2026.** O painel deles
> mudou de lugar algumas coisas — em especial, a *connection string* **saiu** de
> `Project Settings → Database` e hoje fica no botão **Connect**, no topo da página.

---

# PARTE 1 — Criar as tabelas

## Passo 1.1 — Abrir o SQL Editor

Clique neste link (ele já abre no seu projeto):

👉 **https://supabase.com/dashboard/project/_/sql**

> Se você tiver mais de um projeto, ele pede para escolher. Se preferir ir pelo
> menu: ícone **SQL Editor** na barra lateral esquerda (parece uma folha com `>_`).

Clique em **New query** (ou no `+` no topo da lista de queries).

## Passo 1.2 — Rodar o primeiro arquivo

1. Na pasta do projeto, entre na pasta **`supabase`**.
2. Abra o arquivo **`01-estrutura.sql`** com o Bloco de Notas.
   *(botão direito → Abrir com → Bloco de Notas)*
3. Selecione tudo: **Ctrl+A**. Copie: **Ctrl+C**.
4. Clique na caixa grande do SQL Editor e cole: **Ctrl+V**.
5. Clique em **Run** (canto inferior direito) ou aperte **Ctrl+Enter**.

Deve aparecer, embaixo, uma linha dizendo:

```
Estrutura criada: 34 tabelas.
```

## Passo 1.3 — Rodar o segundo arquivo

1. Clique em **New query** de novo (para limpar a caixa).
2. Repita o mesmo com o arquivo **`02-dados-do-manual.sql`**.
3. **Run**.

Esse segundo arquivo carrega o conteúdo do Manual de Gestão: os 7 POPs, a matriz
RACI, os 12 indicadores com seus sinais de alerta, as alçadas, os rituais, as
cláusulas do contrato social, as 27 pendências jurídicas e os 52 termos do
glossário.

## Passo 1.4 — Conferir

Abra 👉 **https://supabase.com/dashboard/project/_/editor**

Na lista da esquerda devem aparecer as tabelas: `clientes`, `contratos`,
`faturas`, `lancamentos`, `pops`, `indicadores`, `glossario`…

Clique em `pops` — devem estar lá os 7 procedimentos.

✅ **Parte 1 pronta.** As tabelas existem e o manual está dentro do banco.

> Pode rodar esses dois arquivos de novo quando quiser: eles não duplicam nem
> apagam nada.

---

# PARTE 2 — Conectar o sistema ao banco

Agora o sistema no seu computador precisa saber o endereço desse banco.

## Passo 2.1 — Copiar o endereço de conexão

1. Abra o seu projeto em **https://supabase.com/dashboard**
2. No **topo da página**, clique no botão **`Connect`**.

   > É esse botão, e não o menu de configurações. Era aí que o guia anterior
   > errava.

3. Abre uma janela com várias abas e caixas de texto. Role até achar o bloco
   **`Session pooler`**.
4. Copie a linha que começa com `postgresql://`.

   Ela é mais ou menos assim:

   ```
   postgresql://postgres.abcdefghijklm:[YOUR-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
   ```

> **Por que Session pooler e não as outras?**
> A *Direct connection* só funciona em rede com IPv6 — em internet residencial
> costuma dar erro. A *Transaction pooler* é para funções serverless e tem
> limitações que atrapalhariam aqui. A **Session pooler** funciona em qualquer
> rede e aguenta tudo que o sistema faz.

## Passo 2.2 — Rodar a conexão

Na pasta do projeto, dê **duplo clique** em:

### 📄 `PASSO-1-conectar-banco.cmd`

*(se preferir o terminal: `npm.cmd run db:conectar` — com o `.cmd`)*

Vai abrir uma janela preta. Ela vai:

1. **Pedir a connection string** → cole a que você copiou (Ctrl+V) e dê Enter.
2. **Pedir a senha do banco** → explicado no passo 2.3 abaixo.
3. Testar a conexão e criar o arquivo de configuração sozinho.

Se aparecer **"Conectado."**, acabou. Pule para o passo 2.4.

## Passo 2.3 — A senha do banco

O comando vai pedir a senha porque, na string que você copiou, existe um trecho
escrito `[YOUR-PASSWORD]` — é só um espaço reservado.

**Se você souber a senha**, cole e pronto.

**Se não souber** (é o caso mais comum — ela só aparece uma vez, quando o projeto
é criado):

1. Abra 👉 **https://supabase.com/dashboard/project/_/database/settings**
2. Procure o bloco **Database password**.
3. Clique em **Reset database password**.
4. Clique em **Generate a password** (ele cria uma senha forte).
5. Confirme e **copie a senha**.
6. Volte ao terminal e cole.

> Resetar a senha **não apaga nada** do banco. Só troca a chave de entrada.
>
> Pode usar senha com símbolos — o comando faz a codificação necessária para você.

## Passo 2.4 — Abrir o sistema

Duplo clique em:

### 📄 `PASSO-3-iniciar-sistema.cmd`

Espere aparecer a palavra **Ready** e abra **http://localhost:3000** no navegador.

> **Deixe essa janela preta aberta** enquanto estiver usando o sistema — é ela
> que mantém tudo no ar. Para desligar, feche a janela.
>
> É esse o arquivo que você vai usar todo dia. Os passos 1 e 2 são só uma vez.

O painel abre **sem clientes e sem lançamentos** — os dados fictícios ficaram no
banco antigo, que foi descartado. O conteúdo do manual está todo lá.

Para confirmar que está tudo ligado: menu **Estrutura → Parâmetros do sistema**.
No topo tem um quadro **Banco de dados** dizendo o estado da conexão.

---

## Se algo der errado

| O que aparece | O que é | O que fazer |
|---|---|---|
| `npm : O arquivo npm.ps1 não pode ser carregado porque a execução de scripts foi desabilitada neste sistema` | Trava de segurança do Windows contra scripts do PowerShell. Não tem a ver com o sistema. | Use os arquivos de **duplo clique** (`PASSO-1`, `PASSO-2`, `PASSO-3`), ou digite **`npm.cmd`** no lugar de `npm`. |
| `O sistema ainda não foi conectado a um banco` | A Parte 2 não chegou ao fim. | Duplo clique em `PASSO-1-conectar-banco.cmd`. |
| `A senha está incorreta` | — | Refaça o passo 2.3 (Reset database password) e rode o `PASSO-1` de novo. |
| `O endereço do servidor não foi encontrado` | A string foi colada pela metade. | Copie a linha inteira do bloco Session pooler, de uma vez só. |
| `A conexão demorou demais` | — | Ou o projeto está pausado (abra o painel; se tiver um botão **Restore project**, clique e espere), ou você copiou a *Direct connection* em vez da *Session pooler*. |
| `As tabelas ainda não existem` | A Parte 1 não foi feita. | Volte ao passo 1.2, ou dê duplo clique em `PASSO-2-criar-tabelas.cmd`. |

Para um diagnóstico completo, duplo clique em `PASSO-2-criar-tabelas.cmd` — ou,
no terminal, `npm.cmd run db:testar`. Ele diz em português o que está faltando.

> **Quer resolver o PowerShell de vez?** Dá para liberar os scripts só para o seu
> usuário, com `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. É a solução
> recomendada pela própria Microsoft e é o que a maioria dos programadores faz —
> mas é uma mudança numa configuração de segurança do seu Windows, então é uma
> decisão sua, e não vou fazer isso por você. Os arquivos de duplo clique
> resolvem sem mexer em nada.

---

## Depois: colocando os dados reais

Na ordem que o próprio manual pede para o primeiro mês (capítulo 06):

1. **Estrutura → Pessoas e sócios** — troque os três nomes genéricos
   ("Sócio Administrador", etc.) pelos reais e confirme as quotas (40 / 30 / 30).
2. **Estrutura → Parâmetros** — informe o **saldo inicial de caixa** e o
   **custo fixo mensal**. Sem esses dois, o painel *estima* a reserva em vez de medir.
3. **CRM → Clientes** — cadastre os clientes atuais.
4. **Financeiro → Contratos** — valor, vencimento e meio de pagamento de cada um.
5. **Financeiro → Cobranças** — botão **Gerar cobranças do mês**: o sistema cria
   as faturas a partir dos contratos. Depois concilie com o extrato.
6. **Financeiro → Fluxo de caixa** — lance os custos fixos, por centro de custo.
7. **Financeiro → Capital e sócios** — defina o pró-labore (Cl. 8ª, § 5º).

> Quer ver o sistema com números antes de cadastrar os reais? Em
> **Estrutura → Parâmetros** tem **Carregar dados de exemplo** — e
> **Zerar todo o movimento** para limpar depois. Zerar apaga só o movimento; o
> conteúdo do manual fica.

---

## Segurança

- **O arquivo `.env.local` tem a senha do banco.** Não mande por WhatsApp, não
  poste em grupo, não suba para o GitHub. O `.gitignore` já bloqueia o envio.
- **A API pública do Supabase está trancada.** O `01-estrutura.sql` liga o
  *Row Level Security* em todas as tabelas e remove o acesso das chaves `anon` e
  `authenticated`. Sem isso, qualquer pessoa com a chave pública do projeto
  conseguiria ler contratos, faturas e atas. Se o painel mostrar um aviso
  *"RLS enabled, no policies"* — é intencional, está certo assim.
- **Backup.** O Supabase faz backup automático. Além dele, o link
  **Exportar backup (JSON)** no rodapé da barra lateral baixa tudo num arquivo.
- **Login.** O sistema ainda não tem tela de login — quem abre o endereço, entra.
  Rodando só na sua máquina isso não é problema. Se um dia for publicado na
  internet, precisa de autenticação antes. Me avise quando chegar essa hora.

---

*O time é a força. O vínculo é o caminho.*
