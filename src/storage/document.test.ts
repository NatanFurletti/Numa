import { readDocument, writeDocument, type DocumentSpec } from './document';

interface Note {
  text: string;
  done: boolean;
}

const parseNote = (doc: Record<string, unknown>): Note | null =>
  typeof doc.text === 'string' ? { text: doc.text, done: doc.done === true } : null;

const v1: DocumentSpec<Note> = { version: 1, parse: parseNote };

// Versão 2 fictícia: na 1, o campo se chamava `title`.
const v2: DocumentSpec<Note> = {
  version: 2,
  migrations: { 1: ({ title, ...rest }) => ({ ...rest, text: title }) },
  parse: parseNote,
};

describe('writeDocument', () => {
  it('grava o JSON com o schemaVersion junto dos dados (DATA §1)', () => {
    expect(JSON.parse(writeDocument({ text: 'oi', done: false }, v1))).toEqual({
      schemaVersion: 1,
      text: 'oi',
      done: false,
    });
  });
});

describe('readDocument', () => {
  it('nada salvo → sem dados e sem erro', () => {
    expect(readDocument(null, v1)).toEqual({ data: null });
  });

  it('lê o que foi gravado', () => {
    const raw = writeDocument({ text: 'oi', done: true }, v1);

    expect(readDocument(raw, v1)).toEqual({ data: { text: 'oi', done: true } });
  });

  it('migra da versão anterior (fixture real da v1)', () => {
    const fixture = '{"schemaVersion":1,"title":"conta difícil","done":true}';

    expect(readDocument(fixture, v2)).toEqual({ data: { text: 'conta difícil', done: true } });
  });

  it('JSON ilegível → sem dados, com o erro', () => {
    const result = readDocument('{quebrado', v1);

    expect(result.data).toBeNull();
    expect(result.error).toMatch(/ilegível/);
  });

  it('não é um objeto → sem dados, com o erro', () => {
    expect(readDocument('[1,2]', v1).error).toMatch(/ilegível/);
    expect(readDocument('null', v1).error).toMatch(/ilegível/);
  });

  it('sem schemaVersion ou de uma versão mais nova → sem dados, com o erro', () => {
    expect(readDocument('{"text":"oi"}', v1).error).toMatch(/versão/);
    expect(readDocument('{"schemaVersion":3,"text":"oi"}', v2).error).toMatch(/versão/);
  });

  it('falta a migração de uma versão → sem dados, com o erro', () => {
    const spec: DocumentSpec<Note> = { version: 3, migrations: {}, parse: parseNote };

    expect(readDocument('{"schemaVersion":1,"text":"oi"}', spec).error).toMatch(/migração/);
  });

  it('dados que não passam na validação → sem dados, com o erro', () => {
    expect(readDocument('{"schemaVersion":1,"text":42}', v1).error).toMatch(/inválido/);
  });
});
