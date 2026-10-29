# Publicar o sistema na Vercel

Guia para colocar o sistema no ar e ter um link que os três sócios acessam.

> ## ⚠️ Leia antes de publicar
>
> **O sistema não tem tela de login.** Publicado na Vercel, ele ganha um endereço
> na internet — e quem tiver esse endereço entra, lê **e altera** tudo:
> contratos, faturas, atas da Quarta Oficial, dados dos clientes.
>
> O endereço não fica secreto só por ser estranho: endereços da Vercel aparecem
> em registros públicos de certificado e acabam descobertos por robôs.
>
> **Antes de colocar dado real lá dentro, faça o Passo 4** (senha de acesso).
> São dois minutos e fecha a porta.

---

## Passo 1 — Pegar a string de conexão certa para a Vercel

A string que você usa no seu computador é a **Session pooler**. Na Vercel é
diferente: lá o sistema roda em funções que sobem e descem o tempo todo, abrindo
muitas conexões curtas. Para isso o Supabase tem outra porta.

1. Abra o projeto em **https://supabase.com/dashboard**
2. Clique em **Connect**, no topo da página
3. Procure o bloco **Transaction pooler** *(não é o Session pooler desta vez)*
4. Copie a linha — ela termina com **`:6543/postgres`**
5. Troque `[YOUR-PASSWORD]` pela senha do banco

Guarde essa linha, você vai colar no Passo 3.

---

## Passo 2 — Importar o projeto na Vercel

1. Abra **https://vercel.com** e entre com a sua conta do GitHub
2. Clique em **Add New...** → **Project**
3. Procure o repositório **`gest-odemocrat`** e clique em **Import**
4. **Não clique em Deploy ainda** — antes, faça o passo 3

A Vercel reconhece o Next.js sozinho. Não mexa em Framework Preset, Build
Command nem Output Directory.

---

## Passo 3 — Informar o banco de dados

Ainda na tela de importação, abra **Environment Variables** e adicione:

| Name | Value |
|---|---|
| `DATABASE_URL` | a string do **Transaction pooler** que você copiou no Passo 1 |

Agora sim, clique em **Deploy** e espere uns 2 minutos.

Ao final a Vercel mostra o endereço do sistema, algo como
`https://gest-odemocrat.vercel.app`.

---

## Passo 4 — Fechar a porta com uma senha ⚠️

**Faça isso antes de cadastrar dado real.**

1. No painel da Vercel, abra o projeto
2. **Settings** → **Environment Variables**
3. Adicione:

   | Name | Value |
   |---|---|
   | `SENHA_ACESSO` | uma senha que vocês três combinem |

4. Vá em **Deployments**, clique nos três pontinhos do deploy mais recente e
   escolha **Redeploy**

Pronto. Agora o endereço pede senha antes de abrir. O navegador vai perguntar
usuário e senha — **o usuário pode ser qualquer coisa**, o que vale é a senha.

> **Isso é uma porta com cadeado, não um login de verdade.** Todo mundo usa a
> mesma senha e o sistema não registra quem fez o quê. Para a fase 2 o certo é
> um usuário por sócio, com registro de alterações. Enquanto isso, essa senha
> impede que um estranho abra o sistema.
>
> No seu computador nada muda: sem a variável `SENHA_ACESSO`, o sistema abre
> direto como sempre.

---

## Passo 5 — Conferir

Abra o endereço da Vercel e vá em **Estrutura → Parâmetros do sistema**. O
quadro **Banco de dados** no topo deve dizer que está conectado, com as 34
tabelas.

Se der erro de conexão, quase sempre é uma destas:

| Problema | Solução |
|---|---|
| Esqueceu de trocar `[YOUR-PASSWORD]` | Corrija a `DATABASE_URL` em Settings → Environment Variables e faça **Redeploy** |
| Usou a string do **Session pooler** (porta 5432) | Troque pela do **Transaction pooler** (porta 6543) |
| Projeto do Supabase pausado | Abra o painel do Supabase e clique em **Restore project** |

> Toda vez que você mudar uma variável de ambiente, precisa fazer **Redeploy** —
> a Vercel só aplica as variáveis em um deploy novo.

---

## Depois: como atualizar o sistema

A Vercel fica ligada no GitHub. Toda vez que uma alteração for enviada para o
repositório, ela publica sozinha a versão nova, em uns 2 minutos.

---

## O que fica guardado onde

| Onde | O quê |
|---|---|
| **GitHub** (público) | O código do sistema. Nenhuma senha — o `.gitignore` bloqueia o `.env.local`. |
| **Vercel** | O sistema rodando, e as variáveis `DATABASE_URL` e `SENHA_ACESSO` (ficam guardadas e não aparecem no código). |
| **Supabase** | Os dados da empresa: clientes, contratos, faturas, lançamentos, atas. |

O repositório é público, então **qualquer pessoa consegue ler o código** — mas o
código não contém dado nenhum da empresa nem senha nenhuma. Os dados estão no
Supabase, protegidos pela senha do banco.

---

*O time é a força. O vínculo é o caminho.*
