import type { ValidationError } from "./validation";

/** Cliente HTTP usado pelos componentes de tela. */

export type Registro = Record<string, unknown>;

export interface ListaResposta {
  rows: Registro[];
  total: number;
  options?: Record<string, { value: number; label: string }[]>;
}

export class ApiError extends Error {
  readonly errors: ValidationError[];

  constructor(message: string, errors: ValidationError[] = []) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (!resposta.ok) {
    let mensagem = `Falha na requisicao (${resposta.status})`;
    let errors: ValidationError[] = [];
    try {
      const corpo = (await resposta.json()) as { error?: string; errors?: ValidationError[] };
      mensagem = corpo.error ?? mensagem;
      errors = corpo.errors ?? [];
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new ApiError(mensagem, errors);
  }

  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

export function listar(
  resource: string,
  params: Record<string, string | number | undefined> = {},
): Promise<ListaResposta> {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === "") continue;
    query.set(chave, String(valor));
  }
  const sufixo = query.toString() ? `?${query}` : "";
  return requisicao<ListaResposta>(`/api/resources/${resource}${sufixo}`);
}

export function criar(resource: string, dados: Registro): Promise<{ row: Registro }> {
  return requisicao(`/api/resources/${resource}`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizar(
  resource: string,
  id: number,
  dados: Registro,
): Promise<{ row: Registro }> {
  return requisicao(`/api/resources/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export function excluir(resource: string, id: number): Promise<{ ok: true }> {
  return requisicao(`/api/resources/${resource}/${id}`, { method: "DELETE" });
}

export function salvarConfiguracoes(valores: Record<string, string>) {
  return requisicao<{ ok: true; atualizadas: number }>("/api/configuracoes", {
    method: "PATCH",
    body: JSON.stringify(valores),
  });
}

export function gerarOnboarding(clienteId: number, ramos: string[]) {
  return requisicao<{ criados: number }>("/api/onboarding", {
    method: "POST",
    body: JSON.stringify({ clienteId, ramos }),
  });
}

export function acaoFaturamento(acao: string, competencia?: string) {
  return requisicao<Record<string, unknown>>("/api/faturamento", {
    method: "POST",
    body: JSON.stringify({ acao, competencia }),
  });
}
