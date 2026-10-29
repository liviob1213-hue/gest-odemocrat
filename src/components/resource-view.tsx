"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { excluir, listar, type Registro } from "@/lib/api-client";
import { valorCampo } from "@/lib/format";
import {
  requireResource,
  tableFields,
  type Field,
  type ResourceDef,
  type Tone,
} from "@/lib/resources";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { RecordForm } from "@/components/record-form";

/**
 * Tela padrao de um recurso: busca, filtros por select, tabela, criacao,
 * edicao e exclusao. Usada por quase todos os modulos do sistema.
 */

type Opcoes = Record<string, { value: number; label: string }[]>;

function tonalidade(field: Field, valor: unknown): Tone | undefined {
  if (field.type !== "select") return undefined;
  return field.options?.find((option) => option.value === String(valor))?.tone;
}

function Celula({ field, registro }: { field: Field; registro: Registro }) {
  const valor = registro[field.name];

  if (field.type === "ref") {
    const rotulo = registro[`${field.name}__label`];
    return <>{rotulo ? String(rotulo) : "—"}</>;
  }

  if (field.type === "select") {
    if (valor === null || valor === undefined || valor === "") return <>—</>;
    return <Badge tone={tonalidade(field, valor) ?? "neutral"}>{valorCampo(field, valor)}</Badge>;
  }

  if (field.type === "boolean") {
    return Number(valor) === 1 ? (
      <Badge tone="success">Sim</Badge>
    ) : (
      <span className="text-[var(--texto-fraco)]">Nao</span>
    );
  }

  return <>{valorCampo(field, valor)}</>;
}

export interface FiltroExtra {
  campo: string;
  rotulo: string;
}

export function ResourceView({
  resourceKey,
  capitulo,
  filtrosFixos,
  valoresFixos,
  titulo,
  descricao,
  acoesExtra,
  colunasOcultas,
  compacto = false,
  linkBase,
  aoMudar,
}: {
  resourceKey: string;
  capitulo?: string;
  /** Quando informado, a coluna de rotulo vira link para `${linkBase}${id}`. */
  linkBase?: string;
  /** Filtros aplicados sempre (ex.: { cliente_id: 3 }). */
  filtrosFixos?: Record<string, string | number>;
  /** Valores pre-preenchidos e travados no formulario. */
  valoresFixos?: Record<string, string | number>;
  titulo?: string;
  descricao?: React.ReactNode;
  acoesExtra?: React.ReactNode;
  colunasOcultas?: string[];
  compacto?: boolean;
  aoMudar?: () => void;
}) {
  const resource: ResourceDef = useMemo(() => requireResource(resourceKey), [resourceKey]);
  const colunas = useMemo(
    () => tableFields(resource).filter((field) => !colunasOcultas?.includes(field.name)),
    [resource, colunasOcultas],
  );

  const [linhas, setLinhas] = useState<Registro[]>([]);
  const [opcoes, setOpcoes] = useState<Opcoes>({});
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [emEdicao, setEmEdicao] = useState<Registro | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  // `filtrosFixos` e um objeto literal vindo da pagina: ele muda de identidade a
  // cada render. Comparamos pelo conteudo serializado para que o efeito de
  // carga nao entre em laco infinito.
  const chaveFiltrosFixos = JSON.stringify(filtrosFixos ?? {});

  const camposFiltraveis = useMemo(
    () =>
      resource.fields.filter(
        (field) =>
          field.type === "select" &&
          (field.options?.length ?? 0) > 1 &&
          !(field.name in (JSON.parse(chaveFiltrosFixos) as Record<string, unknown>)),
      ),
    [resource, chaveFiltrosFixos],
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await listar(resourceKey, {
        search: buscaAtiva,
        withOptions: 1,
        ...(JSON.parse(chaveFiltrosFixos) as Record<string, string | number>),
        ...filtros,
      });
      setLinhas(resposta.rows);
      setTotal(resposta.total);
      if (resposta.options) setOpcoes(resposta.options);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [resourceKey, buscaAtiva, filtros, chaveFiltrosFixos]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Debounce da busca para nao disparar uma consulta por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAtiva(busca.trim()), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  async function remover(registro: Registro) {
    const id = Number(registro.id);
    const rotulo = String(registro[resource.labelField] ?? `#${id}`);
    if (!window.confirm(`Excluir "${rotulo}"? Esta acao nao pode ser desfeita.`)) return;

    setExcluindo(id);
    try {
      await excluir(resourceKey, id);
      await carregar();
      aoMudar?.();
    } catch (falha) {
      window.alert(falha instanceof Error ? falha.message : "Erro ao excluir");
    } finally {
      setExcluindo(null);
    }
  }

  const barraFerramentas = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--texto-fraco)]" />
        <input
          className="campo pl-8"
          placeholder={`Buscar em ${resource.label.toLowerCase()}...`}
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
        />
      </div>

      {camposFiltraveis.map((field) => (
        <select
          key={field.name}
          className="campo min-w-[150px]"
          // `.campo` fixa width:100%; aqui o select precisa acompanhar o conteudo.
          style={{ width: "auto" }}
          value={filtros[field.name] ?? ""}
          onChange={(evento) =>
            setFiltros((anterior) => {
              const proximo = { ...anterior };
              if (evento.target.value === "") delete proximo[field.name];
              else proximo[field.name] = evento.target.value;
              return proximo;
            })
          }
        >
          <option value="">{field.label}: todos</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      <button type="button" className="btn btn-secundario btn-sm" onClick={() => void carregar()}>
        <RefreshCw className={`size-3.5 ${carregando ? "girando" : ""}`} />
        Atualizar
      </button>
    </div>
  );

  const tabela = (
    <div className="overflow-hidden rounded-xl border bg-[var(--superficie)] shadow-[var(--sombra)]">
      <div className="max-h-[70vh] overflow-auto">
        <table className="tabela">
          <thead>
            <tr>
              {colunas.map((field) => (
                <th
                  key={field.name}
                  className={
                    field.type === "currency" || field.type === "number" || field.type === "percent"
                      ? "num"
                      : undefined
                  }
                >
                  {field.label}
                </th>
              ))}
              <th className="w-24 text-right nao-imprimir">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((registro) => (
              <tr key={String(registro.id)}>
                {colunas.map((field) => (
                  <td
                    key={field.name}
                    className={
                      field.type === "currency" || field.type === "number" || field.type === "percent"
                        ? "num"
                        : undefined
                    }
                  >
                    {linkBase && field.name === resource.labelField ? (
                      <Link
                        href={`${linkBase}${registro.id}`}
                        className="font-medium text-[var(--destaque)] hover:underline"
                      >
                        {valorCampo(field, registro[field.name])}
                      </Link>
                    ) : (
                      <Celula field={field} registro={registro} />
                    )}
                  </td>
                ))}
                <td className="nao-imprimir">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="btn btn-fantasma btn-sm"
                      title="Editar"
                      onClick={() => {
                        setEmEdicao(registro);
                        setFormAberto(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-fantasma btn-sm text-[var(--negativo)]"
                      title="Excluir"
                      disabled={excluindo === Number(registro.id)}
                      onClick={() => void remover(registro)}
                    >
                      {excluindo === Number(registro.id) ? (
                        <Loader2 className="size-3.5 girando" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {carregando && linhas.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--texto-suave)]">
          <Loader2 className="size-4 girando" /> Carregando...
        </div>
      ) : null}

      {!carregando && linhas.length === 0 ? (
        <EmptyState
          titulo={`Nenhum registro em ${resource.label.toLowerCase()}`}
          descricao={
            buscaAtiva || Object.keys(filtros).length > 0
              ? "Nenhum resultado para a busca ou os filtros aplicados."
              : resource.description
          }
          acao={
            <button
              type="button"
              className="btn btn-primario btn-sm"
              onClick={() => {
                setEmEdicao(null);
                setFormAberto(true);
              }}
            >
              <Plus className="size-3.5" /> Criar o primeiro
            </button>
          }
        />
      ) : null}

      {erro ? (
        <p className="border-t px-4 py-2.5 text-xs text-[var(--negativo)]">{erro}</p>
      ) : null}

      {linhas.length > 0 ? (
        <p className="border-t px-4 py-2 text-xs text-[var(--texto-fraco)]">
          {linhas.length === total
            ? `${total} registro(s)`
            : `${linhas.length} de ${total} registro(s)`}
        </p>
      ) : null}
    </div>
  );

  const botaoNovo = (
    <button
      type="button"
      className="btn btn-primario"
      onClick={() => {
        setEmEdicao(null);
        setFormAberto(true);
      }}
    >
      <Plus className="size-4" /> Novo(a) {resource.singular.toLowerCase()}
    </button>
  );

  return (
    <>
      {compacto ? (
        <div className="flex items-center justify-between gap-3 pb-2">
          <h3 className="text-sm font-semibold">{titulo ?? resource.label}</h3>
          <div className="flex gap-2">
            {acoesExtra}
            {botaoNovo}
          </div>
        </div>
      ) : (
        <PageHeader
          capitulo={capitulo}
          titulo={titulo ?? resource.label}
          descricao={descricao ?? resource.description}
          acoes={
            <>
              {acoesExtra}
              {botaoNovo}
            </>
          }
        />
      )}

      {barraFerramentas}
      {tabela}

      {formAberto ? (
        <RecordForm
          resource={resource}
          registro={emEdicao}
          opcoes={opcoes}
          valoresFixos={valoresFixos}
          onFechar={() => {
            setFormAberto(false);
            setEmEdicao(null);
          }}
          onSalvo={() => {
            setFormAberto(false);
            setEmEdicao(null);
            void carregar();
            aoMudar?.();
          }}
        />
      ) : null}
    </>
  );
}
