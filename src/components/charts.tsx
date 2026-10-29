"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, brlCompacto, mesCurto } from "@/lib/format";

/** Graficos do painel e do financeiro. */

const EIXO = { fontSize: 11, fill: "var(--texto-fraco)" };

function Caixa({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-[var(--superficie)] px-3 py-2 text-xs shadow-[var(--sombra-md)]">
      {label ? <p className="mb-1 font-semibold">{mesCurto(String(label))}</p> : null}
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2 tabular-nums">
          <span className="size-2 rounded-sm" style={{ background: item.color }} />
          <span className="text-[var(--texto-suave)]">{item.name}:</span>
          <span className="font-semibold">{brl(item.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

export function GraficoResultadoMensal({
  dados,
}: {
  dados: { competencia: string; receita: number; despesa: number; resultado: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--borda)" />
        <XAxis dataKey="competencia" tickFormatter={mesCurto} tick={EIXO} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={brlCompacto} tick={EIXO} tickLine={false} axisLine={false} width={64} />
        <Tooltip content={<Caixa />} cursor={{ fill: "var(--neutro-bg)", opacity: 0.5 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar name="Receita" dataKey="receita" fill="var(--positivo)" radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Bar name="Despesa" dataKey="despesa" fill="var(--negativo)" radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Line name="Resultado" type="monotone" dataKey="resultado" stroke="var(--color-marca-500)" strokeWidth={2} dot={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoProjecaoCaixa({
  dados,
}: {
  dados: { competencia: string; entradas: number; saidas: number; saldoProjetado: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-marca-500)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-marca-500)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--borda)" />
        <XAxis dataKey="competencia" tickFormatter={mesCurto} tick={EIXO} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={brlCompacto} tick={EIXO} tickLine={false} axisLine={false} width={64} />
        <Tooltip content={<Caixa />} />
        <Area
          name="Saldo projetado"
          type="monotone"
          dataKey="saldoProjetado"
          stroke="var(--color-marca-600)"
          strokeWidth={2}
          fill="url(#gradSaldo)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GraficoDre({
  dados,
}: {
  dados: { unidade: string; receita: number; custo: number; resultado: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, dados.length * 64)}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--borda)" />
        <XAxis type="number" tickFormatter={brlCompacto} tick={EIXO} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="unidade" tick={EIXO} tickLine={false} axisLine={false} width={140} />
        <Tooltip content={<Caixa />} cursor={{ fill: "var(--neutro-bg)", opacity: 0.5 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar name="Receita" dataKey="receita" fill="var(--positivo)" radius={[0, 3, 3, 0]} maxBarSize={14} />
        <Bar name="Custo" dataKey="custo" fill="var(--negativo)" radius={[0, 3, 3, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const CORES_ETAPA: Record<string, string> = {
  prospeccao: "var(--neutro)",
  qualificacao: "var(--info)",
  proposta: "var(--color-marca-500)",
  negociacao: "var(--atencao)",
};

export function GraficoPipeline({
  dados,
}: {
  dados: { etapa: string; rotulo: string; ponderado: number; total: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--borda)" />
        <XAxis dataKey="rotulo" tick={EIXO} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={brlCompacto} tick={EIXO} tickLine={false} axisLine={false} width={64} />
        <Tooltip
          content={<Caixa />}
          cursor={{ fill: "var(--neutro-bg)", opacity: 0.5 }}
        />
        <Bar name="Pipeline ponderado" dataKey="ponderado" radius={[3, 3, 0, 0]} maxBarSize={48}>
          {dados.map((item) => (
            <Cell key={item.etapa} fill={CORES_ETAPA[item.etapa] ?? "var(--color-marca-500)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
