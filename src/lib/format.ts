import type { Field } from "./resources";

/** Formatacao em pt-BR usada na tabela, nos cartoes e nos graficos. */

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function brl(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return moeda.format(valor);
}

export function brlCompacto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return moedaCompacta.format(valor);
}

export function num(valor: number | null | undefined, digitos = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digitos }).format(valor);
}

export function pct(valor: number | null | undefined, digitos = 1): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digitos }).format(valor)}%`;
}

/** 2026-10-21 -> 21/10/2026 */
export function dataBr(valor: string | null | undefined): string {
  if (!valor) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!match) return valor;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** 2026-10 -> out/2026 */
export function mesBr(valor: string | null | undefined): string {
  if (!valor) return "—";
  const match = /^(\d{4})-(\d{2})/.exec(valor);
  if (!match) return valor;
  return `${MESES[Number(match[2]) - 1]}/${match[1]}`;
}

/** Rotulo curto para eixos de grafico: out/26 */
export function mesCurto(valor: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(valor);
  if (!match) return valor;
  return `${MESES[Number(match[2]) - 1]}/${match[1].slice(2)}`;
}

export function valorCampo(field: Field, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";

  switch (field.type) {
    case "currency":
      return brl(Number(valor));
    case "percent":
      return pct(Number(valor));
    case "number":
      return num(Number(valor));
    case "date":
      return dataBr(String(valor));
    case "month":
      return mesBr(String(valor));
    case "boolean":
      return Number(valor) === 1 || valor === true ? "Sim" : "Nao";
    case "select": {
      const option = field.options?.find((item) => item.value === String(valor));
      return option?.label ?? String(valor);
    }
    default:
      return String(valor);
  }
}

/** Dias entre hoje e uma data ISO (negativo = passado). */
export function diasAte(data: string | null | undefined): number | null {
  if (!data) return null;
  const alvo = new Date(`${data.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function hojeIso(): string {
  const agora = new Date();
  const offset = agora.getTimezoneOffset() * 60_000;
  return new Date(agora.getTime() - offset).toISOString().slice(0, 10);
}

export function competenciaIso(): string {
  return hojeIso().slice(0, 7);
}

/** Segunda-feira da semana de uma data. */
export function segundaDaSemana(base = hojeIso()): string {
  const data = new Date(`${base}T00:00:00`);
  const diaSemana = data.getDay(); // 0 = domingo
  const ajuste = diaSemana === 0 ? -6 : 1 - diaSemana;
  data.setDate(data.getDate() + ajuste);
  const offset = data.getTimezoneOffset() * 60_000;
  return new Date(data.getTime() - offset).toISOString().slice(0, 10);
}

export { numero as formatadorNumero };
