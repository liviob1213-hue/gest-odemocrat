"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

import { ApiError, atualizar, criar, type Registro } from "@/lib/api-client";
import { formFields, type Field, type ResourceDef } from "@/lib/resources";
import { competenciaIso, hojeIso } from "@/lib/format";

/**
 * Formulario gerado a partir dos metadados do recurso.
 *
 * Nenhuma tela escreve campos a mao: alterar `resources.ts` muda o formulario,
 * a tabela e a validacao da API ao mesmo tempo.
 */

type Opcoes = Record<string, { value: number; label: string }[]>;

function valorInicial(field: Field, registro: Registro | null): string {
  if (registro && registro[field.name] !== undefined && registro[field.name] !== null) {
    const bruto = registro[field.name];
    if (field.type === "boolean") return Number(bruto) === 1 ? "1" : "0";
    if (field.type === "date") return String(bruto).slice(0, 10);
    if (field.type === "month") return String(bruto).slice(0, 7);
    return String(bruto);
  }

  if (field.default !== undefined && field.default !== null) {
    if (typeof field.default === "boolean") return field.default ? "1" : "0";
    return String(field.default);
  }

  if (!registro) {
    // Valores de partida que poupam digitacao em cadastros novos.
    if (field.type === "boolean") return "0";
    if (field.type === "date" && /^(data|abertura|inicio|semana)$/.test(field.name)) return hojeIso();
    if (field.type === "month") return competenciaIso();
    if (field.type === "select" && field.required) return field.options?.[0]?.value ?? "";
  }

  return "";
}

function paraEnvio(field: Field, valor: string): unknown {
  if (field.type === "boolean") return valor === "1";
  if (valor === "") return field.required ? "" : null;
  if (field.type === "number" || field.type === "currency" || field.type === "percent") {
    return Number(valor.replace(",", "."));
  }
  if (field.type === "ref") return Number(valor);
  return valor;
}

export function RecordForm({
  resource,
  registro,
  opcoes,
  valoresFixos,
  onFechar,
  onSalvo,
}: {
  resource: ResourceDef;
  registro: Registro | null;
  opcoes: Opcoes;
  /** Campos pre-preenchidos e travados (ex.: cliente_id numa ficha). */
  valoresFixos?: Record<string, number | string>;
  onFechar: () => void;
  onSalvo: (row: Registro) => void;
}) {
  const campos = useMemo(() => formFields(resource), [resource]);
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    for (const field of campos) inicial[field.name] = valorInicial(field, registro);
    for (const [chave, valor] of Object.entries(valoresFixos ?? {})) {
      inicial[chave] = String(valor);
    }
    return inicial;
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const primeiroCampo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    primeiroCampo.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, []);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  function definir(nome: string, valor: string) {
    setValores((anterior) => ({ ...anterior, [nome]: valor }));
    setErros(({ [nome]: _removido, ...resto }) => resto);
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErroGeral(null);
    setErros({});

    const payload: Registro = {};
    for (const field of campos) {
      payload[field.name] = paraEnvio(field, valores[field.name] ?? "");
    }

    try {
      const resposta = registro?.id
        ? await atualizar(resource.key, Number(registro.id), payload)
        : await criar(resource.key, payload);
      onSalvo(resposta.row);
    } catch (erro) {
      if (erro instanceof ApiError && erro.errors.length > 0) {
        setErros(Object.fromEntries(erro.errors.map((item) => [item.field, item.message])));
        setErroGeral("Confira os campos destacados.");
      } else {
        setErroGeral(erro instanceof Error ? erro.message : "Erro ao salvar");
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-3 sm:p-6">
      <form
        onSubmit={enviar}
        className="aparecer my-auto w-full max-w-3xl rounded-xl border bg-[var(--superficie)] shadow-[var(--sombra-lg)]"
      >
        <header className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold">
              {registro?.id ? `Editar ${resource.singular.toLowerCase()}` : `Novo(a) ${resource.singular.toLowerCase()}`}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--texto-suave)]">{resource.label}</p>
          </div>
          <button type="button" onClick={onFechar} className="btn btn-fantasma btn-sm" aria-label="Fechar">
            <X className="size-4" />
          </button>
        </header>

        <div className="grid max-h-[65vh] grid-cols-1 gap-x-4 gap-y-3.5 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          {campos.map((field, indice) => {
            const travado = valoresFixos && field.name in valoresFixos;
            const erro = erros[field.name];
            const wrapper = field.full || field.type === "textarea" || field.type === "lines";

            return (
              <div
                key={field.name}
                ref={indice === 0 ? primeiroCampo : undefined}
                className={wrapper ? "sm:col-span-2" : undefined}
              >
                {field.type === "boolean" ? (
                  <label className="flex cursor-pointer items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[var(--color-marca-600)]"
                      checked={valores[field.name] === "1"}
                      disabled={travado}
                      onChange={(evento) => definir(field.name, evento.target.checked ? "1" : "0")}
                    />
                    <span>
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.help ? (
                        <span className="block text-xs text-[var(--texto-suave)]">{field.help}</span>
                      ) : null}
                    </span>
                  </label>
                ) : (
                  <>
                    <label className="rotulo" htmlFor={`campo-${field.name}`}>
                      {field.label}
                      {field.required ? <span className="text-[var(--negativo)]"> *</span> : null}
                    </label>

                    {field.type === "select" ? (
                      <select
                        id={`campo-${field.name}`}
                        className="campo"
                        value={valores[field.name] ?? ""}
                        disabled={travado}
                        onChange={(evento) => definir(field.name, evento.target.value)}
                      >
                        {!field.required ? <option value="">—</option> : null}
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "ref" ? (
                      <select
                        id={`campo-${field.name}`}
                        className="campo"
                        value={valores[field.name] ?? ""}
                        disabled={travado}
                        onChange={(evento) => definir(field.name, evento.target.value)}
                      >
                        <option value="">—</option>
                        {(opcoes[field.name] ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" || field.type === "lines" ? (
                      <textarea
                        id={`campo-${field.name}`}
                        className="campo"
                        rows={field.type === "lines" ? 6 : 3}
                        value={valores[field.name] ?? ""}
                        disabled={travado}
                        onChange={(evento) => definir(field.name, evento.target.value)}
                      />
                    ) : (
                      <input
                        id={`campo-${field.name}`}
                        className="campo"
                        type={
                          field.type === "date"
                            ? "date"
                            : field.type === "month"
                              ? "month"
                              : field.type === "number" || field.type === "currency" || field.type === "percent"
                                ? "number"
                                : "text"
                        }
                        step={field.type === "currency" ? "0.01" : field.type === "number" || field.type === "percent" ? "any" : undefined}
                        min={field.min}
                        max={field.max}
                        value={valores[field.name] ?? ""}
                        disabled={travado}
                        onChange={(evento) => definir(field.name, evento.target.value)}
                      />
                    )}

                    {erro ? (
                      <p className="mt-1 text-xs font-medium text-[var(--negativo)]">{erro}</p>
                    ) : field.help ? (
                      <p className="mt-1 text-xs leading-snug text-[var(--texto-suave)]">{field.help}</p>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <p className="text-xs text-[var(--negativo)]">{erroGeral}</p>
          <div className="flex gap-2">
            <button type="button" onClick={onFechar} className="btn btn-secundario">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? <Loader2 className="size-4 girando" /> : null}
              {registro?.id ? "Salvar alteracoes" : "Criar"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
