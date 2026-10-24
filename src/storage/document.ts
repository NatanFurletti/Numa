// Documentos salvos com `schemaVersion` e migrações (docs/DATA.md §1.4).
// Dados ilegíveis nunca travam o app: a leitura devolve `data: null` e o motivo em `error`,
// e quem chama volta aos padrões.

type Doc = Record<string, unknown>;

export interface DocumentSpec<T> {
  /** Versão atual do formato. */
  version: number;
  /** `migrations[n]` converte um documento da versão n para a n + 1. */
  migrations?: Record<number, (doc: Doc) => Doc>;
  /** Valida o documento já na versão atual. null = inválido. */
  parse: (doc: Doc) => T | null;
}

export interface ReadResult<T> {
  data: T | null;
  error?: string;
}

export function writeDocument<T extends object>(data: T, spec: DocumentSpec<T>): string {
  return JSON.stringify({ schemaVersion: spec.version, ...data });
}

function parseJson(raw: string): Doc | null {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Doc)
      : null;
  } catch {
    return null;
  }
}

export function readDocument<T>(raw: string | null, spec: DocumentSpec<T>): ReadResult<T> {
  if (raw === null) return { data: null };

  const json = parseJson(raw);
  if (!json) return { data: null, error: 'documento ilegível' };

  const { schemaVersion, ...fields } = json;
  if (typeof schemaVersion !== 'number' || schemaVersion < 1 || schemaVersion > spec.version) {
    return { data: null, error: `versão desconhecida: ${String(schemaVersion)}` };
  }

  let doc: Doc = fields;
  for (let v = schemaVersion; v < spec.version; v++) {
    const migrate = spec.migrations?.[v];
    if (!migrate) return { data: null, error: `falta a migração da versão ${v}` };
    doc = migrate(doc);
  }

  const data = spec.parse(doc);
  return data === null ? { data: null, error: 'conteúdo inválido' } : { data };
}
