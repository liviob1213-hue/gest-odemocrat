import type { ReactNode } from "react";

import type { Tone } from "@/lib/resources";

/** Primitivos visuais sem estado - usaveis em server e client components. */

export function Card({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border bg-[var(--superficie)] shadow-[var(--sombra)] ${
        padding ? "p-4 sm:p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--texto-suave)]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Badge({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  title?: string;
}) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  const cor =
    tone === "danger"
      ? "var(--negativo)"
      : tone === "warning"
        ? "var(--atencao)"
        : tone === "success"
          ? "var(--positivo)"
          : "var(--texto)";

  return (
    <div className="rounded-xl border bg-[var(--superficie)] p-4 shadow-[var(--sombra)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
          {label}
        </span>
        {icon ? <span className="text-[var(--texto-fraco)]">{icon}</span> : null}
      </div>
      <div
        className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight"
        style={{ color: cor }}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs leading-snug text-[var(--texto-suave)]">{hint}</div>
      ) : null}
    </div>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acoes,
  capitulo,
}: {
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  capitulo?: string;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {capitulo ? (
          <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--destaque)]">
            {capitulo}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--texto-suave)]">
            {descricao}
          </p>
        ) : null}
      </div>
      {acoes ? <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div> : null}
    </header>
  );
}

export function EmptyState({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-semibold">{titulo}</p>
      {descricao ? (
        <p className="max-w-md text-xs leading-relaxed text-[var(--texto-suave)]">{descricao}</p>
      ) : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}

export function Progresso({
  valor,
  max = 100,
  tone = "accent",
}: {
  valor: number;
  max?: number;
  tone?: Tone;
}) {
  const pct = max > 0 ? Math.min(Math.max((valor / max) * 100, 0), 100) : 0;
  const cor =
    tone === "danger"
      ? "var(--negativo)"
      : tone === "warning"
        ? "var(--atencao)"
        : tone === "success"
          ? "var(--positivo)"
          : "var(--color-marca-600)";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--neutro-bg)]">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

export function Nota({ children, tone = "info" }: { children: ReactNode; tone?: Tone }) {
  const fundo =
    tone === "danger"
      ? "var(--negativo-bg)"
      : tone === "warning"
        ? "var(--atencao-bg)"
        : tone === "success"
          ? "var(--positivo-bg)"
          : "var(--info-bg)";
  const cor =
    tone === "danger"
      ? "var(--negativo)"
      : tone === "warning"
        ? "var(--atencao)"
        : tone === "success"
          ? "var(--positivo)"
          : "var(--info)";

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs leading-relaxed"
      style={{ background: fundo, color: cor, borderColor: `color-mix(in srgb, ${cor} 25%, transparent)` }}
    >
      {children}
    </div>
  );
}

/** Lista "rotulo: valor" usada nas fichas e nos cabecalhos de detalhe. */
export function CampoLeitura({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--texto-fraco)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
