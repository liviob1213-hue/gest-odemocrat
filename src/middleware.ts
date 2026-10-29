import { NextResponse, type NextRequest } from "next/server";

/**
 * Trava de acesso por senha.
 *
 * O sistema nao tem tela de login. Rodando no computador do time isso nao e
 * problema, mas publicado na internet (Vercel) qualquer pessoa que descubra o
 * endereco consegue ler contratos, faturas, atas e dados de clientes - e
 * tambem alterar e apagar.
 *
 * Esta trava so liga quando existe a variavel de ambiente SENHA_ACESSO:
 *
 *   - sem SENHA_ACESSO  -> nada muda (uso local continua direto, sem senha)
 *   - com SENHA_ACESSO  -> o navegador pede usuario e senha antes de abrir
 *                          (qualquer usuario; o que vale e a senha)
 *
 * E uma protecao simples, de porta fechada. Nao substitui um login de verdade,
 * com um usuario por socio e registro de quem fez o que - isso continua na
 * lista do que falta para a fase 2.
 */

/** Comparacao de tempo constante, para nao vazar a senha pelo tempo de resposta. */
function senhaConfere(fornecida: string, esperada: string): boolean {
  if (fornecida.length !== esperada.length) return false;
  let diferenca = 0;
  for (let i = 0; i < fornecida.length; i += 1) {
    diferenca |= fornecida.charCodeAt(i) ^ esperada.charCodeAt(i);
  }
  return diferenca === 0;
}

function pedirSenha() {
  return new NextResponse("Acesso restrito - DEMOCRAT.IA", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="DEMOCRAT.IA - Gestao", charset="UTF-8"',
    },
  });
}

export function middleware(request: NextRequest) {
  const esperada = process.env.SENHA_ACESSO;
  if (!esperada) return NextResponse.next();

  const autorizacao = request.headers.get("authorization");
  if (!autorizacao?.startsWith("Basic ")) return pedirSenha();

  let fornecida: string;
  try {
    const decodificado = atob(autorizacao.slice(6));
    fornecida = decodificado.slice(decodificado.indexOf(":") + 1);
  } catch {
    return pedirSenha();
  }

  return senhaConfere(fornecida, esperada) ? NextResponse.next() : pedirSenha();
}

export const config = {
  // Protege tudo, inclusive a API e o backup. Deixa passar so os arquivos
  // estaticos do proprio Next, que nao expoem dado nenhum.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
