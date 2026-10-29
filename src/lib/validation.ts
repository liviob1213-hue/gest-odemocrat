import { z } from "zod";

import { formFields, type Field, type ResourceDef } from "./resources";

/**
 * Validacao derivada dos metadados de `resources.ts`.
 *
 * Um unico lugar define o tipo de cada coluna, entao a API nunca aceita um
 * payload que o banco nao suporta e o erro que volta para a tela ja vem com o
 * rotulo do campo em portugues.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

/** Trata string vazia como ausencia de valor. */
function blankToNull(value: unknown) {
  if (value === "" || value === undefined) return null;
  return value;
}

function baseSchema(field: Field): z.ZodTypeAny {
  switch (field.type) {
    case "number":
    case "currency":
    case "percent": {
      let schema = z.coerce.number({
        invalid_type_error: `${field.label}: informe um numero`,
      });
      if (field.min !== undefined) {
        schema = schema.min(field.min, `${field.label}: minimo ${field.min}`);
      }
      if (field.max !== undefined) {
        schema = schema.max(field.max, `${field.label}: maximo ${field.max}`);
      }
      return schema;
    }

    case "boolean":
      return z.union([z.boolean(), z.literal(0), z.literal(1), z.literal("true"), z.literal("false")]);

    case "date":
      return z.string().regex(DATE_RE, `${field.label}: use o formato AAAA-MM-DD`);

    case "month":
      return z.string().regex(MONTH_RE, `${field.label}: use o formato AAAA-MM`);

    case "ref":
      return z.coerce
        .number({ invalid_type_error: `${field.label}: selecione um registro` })
        .int()
        .positive(`${field.label}: selecione um registro`);

    case "select": {
      const valores = (field.options ?? []).map((option) => option.value);
      return z.string().refine((value) => valores.includes(value), {
        message: `${field.label}: valor invalido`,
      });
    }

    case "text":
    case "textarea":
    case "lines":
    default:
      return field.required
        ? z.string().trim().min(1, `${field.label} e obrigatorio`)
        : z.string();
  }
}

function fieldSchema(field: Field): z.ZodTypeAny {
  const base = baseSchema(field);
  if (field.required) {
    return z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      base,
    );
  }
  return z.preprocess(blankToNull, base.nullable());
}

/** Converte o valor validado no formato aceito pelo Postgres. */
function toSqlValue(field: Field, value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (field.type === "boolean") {
    return value === true || value === 1 || value === "true";
  }
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  return String(value);
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; data: Record<string, string | number | boolean | null> }
  | { ok: false; errors: ValidationError[] };

/**
 * Valida o corpo de uma requisicao contra o recurso.
 *
 * @param partial quando true (PATCH), apenas as chaves enviadas sao validadas.
 */
export function validateRecord(
  resource: ResourceDef,
  body: unknown,
  partial = false,
): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: [{ field: "_", message: "Corpo da requisicao invalido" }] };
  }

  const input = body as Record<string, unknown>;
  const fields = formFields(resource);
  const data: Record<string, string | number | boolean | null> = {};
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const sent = Object.prototype.hasOwnProperty.call(input, field.name);
    if (partial && !sent) continue;

    // Checkbox nao enviado em um POST completo vale "falso".
    const raw = sent ? input[field.name] : field.type === "boolean" ? false : undefined;

    if (!partial && field.required && (raw === undefined || raw === null || raw === "")) {
      errors.push({ field: field.name, message: `${field.label} e obrigatorio` });
      continue;
    }

    const parsed = fieldSchema(field).safeParse(raw);
    if (!parsed.success) {
      errors.push({
        field: field.name,
        message: parsed.error.issues[0]?.message ?? `${field.label}: valor invalido`,
      });
      continue;
    }

    data[field.name] = toSqlValue(field, parsed.data);
  }

  if (errors.length > 0) return { ok: false, errors };
  if (Object.keys(data).length === 0) {
    return { ok: false, errors: [{ field: "_", message: "Nada para salvar" }] };
  }

  return { ok: true, data };
}
