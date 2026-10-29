/**
 * Leitura do .env.local para os scripts de linha de comando.
 *
 * O Next ja carrega esse arquivo sozinho quando o sistema roda; os scripts
 * abaixo rodam fora do Next, por isso precisam ler na mao.
 */

import fs from "node:fs";
import path from "node:path";

export const VERDE = "\x1b[32m";
export const VERMELHO = "\x1b[31m";
export const AMARELO = "\x1b[33m";
export const AZUL = "\x1b[36m";
export const NEGRITO = "\x1b[1m";
export const FIM = "\x1b[0m";

/**
 * No Windows o `npm` e um script do PowerShell, que costuma vir bloqueado pela
 * politica de seguranca. O `npm.cmd` nao passa por essa trava, entao as
 * mensagens sempre sugerem a forma que funciona na maquina de quem esta lendo.
 */
export const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

export function lerEnvLocal() {
  const arquivo = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(arquivo)) {
    console.error(`
${VERMELHO}${NEGRITO}O sistema ainda nao foi conectado a um banco.${FIM}

Da um duplo clique no arquivo ${NEGRITO}PASSO-1-conectar-banco.cmd${FIM}, na pasta do projeto.
(ou, no terminal: ${NEGRITO}${NPM} run db:conectar${FIM})

Voce vai precisar da connection string do Supabase: abra o projeto em
${AZUL}https://supabase.com/dashboard${FIM}, clique no botao ${NEGRITO}Connect${FIM} no topo da pagina e
copie a linha do bloco ${NEGRITO}Session pooler${FIM}.

O PASSO-A-PASSO.md tem o caminho completo, com telas.
`);
    process.exit(1);
  }

  const conteudo = fs.readFileSync(arquivo, "utf8");
  for (const linha of conteudo.split("\n")) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;

    const separador = limpa.indexOf("=");
    if (separador === -1) continue;

    const chave = limpa.slice(0, separador).trim();
    let valor = limpa.slice(separador + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (!process.env[chave]) process.env[chave] = valor;
  }

  if (!process.env.DATABASE_URL) {
    console.error(`
${VERMELHO}${NEGRITO}O .env.local existe, mas nao tem a DATABASE_URL${FIM}

A linha precisa ficar assim (tudo numa linha so):

DATABASE_URL=postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
`);
    process.exit(1);
  }

  if (process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
    console.error(`
${VERMELHO}${NEGRITO}A senha ainda nao foi preenchida${FIM}

Na DATABASE_URL existe um trecho ${NEGRITO}[YOUR-PASSWORD]${FIM}.
Troque esse trecho inteiro (inclusive os colchetes) pela senha do banco.
`);
    process.exit(1);
  }

  return process.env.DATABASE_URL;
}

/** Esconde a senha antes de mostrar a string na tela. */
export function ocultarSenha(url) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:********@");
}
