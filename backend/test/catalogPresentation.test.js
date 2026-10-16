import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCatalogBooks } from '../../frontend/src/services/bookCatalog.js';

test('catálogo une origens sem duplicar e preserva notas locais', () => {
  const saved = { _id: 'saved', googleBooksId: 'volume', idioma: 'pt', isbn: '978-123', mediaAvaliacoes: 4, totalAvaliacoes: 1 };
  const manual = { _id: 'manual', idioma: 'Português' };
  const remote = { googleBooksId: 'volume', localId: 'saved', idioma: 'pt', isbn: '978123' };
  const another = { googleBooksId: 'new', idioma: 'pt' };
  const result = mergeCatalogBooks([saved, manual], [remote, another, { googleBooksId: 'foreign', idioma: 'en' }, { googleBooksId: 'unknown' }]);
  assert.equal(result.length, 4);
  assert.equal(result[0].mediaAvaliacoes, 4);
  assert.equal(result[1].googleBooksId, undefined);
  assert.equal(result[2].googleBooksId, 'new');
});

test('livro importado encontrado na busca abre pelo ID local e não duplica ISBN', () => {
  const result = mergeCatalogBooks([], [{ googleBooksId: 'savedGoogle', localId: 'local', idioma: 'pt', isbn: '123-456' }, { googleBooksId: 'alternateGoogle', idioma: 'pt', isbn: '123456' }]);
  assert.equal(result.length, 1);
  assert.equal(result[0]._id, 'local');
});

test('pesquisa não reutiliza livros de consultas anteriores nem repete catálogo local nas próximas páginas', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const local = { _id: 'local', idioma: 'pt' };
  const remote = { googleBooksId: 'remote', idioma: 'pt' };
  assert.deepEqual(catalogPageBooks({ query: 'Brandon', localQuery: '', localBooks: [local], externalQuery: '', externalBooks: [remote] }), []);
  assert.equal(catalogPageBooks({ query: 'Brandon', localQuery: 'Brandon', localBooks: [local], externalQuery: 'Brandon', externalBooks: [remote] }).length, 2);
  const next = catalogPageBooks({ query: 'Brandon', localQuery: 'Brandon', localBooks: [local], externalQuery: 'Brandon', externalBooks: [remote], page: 2 });
  assert.deepEqual(next.map(book => book.googleBooksId), []);
});

 test('divide catálogo combinado em páginas de 15 sem perder livros locais', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const localBooks = Array.from({ length: 18 }, (_, index) => ({ _id: `local_${index}`, idioma: 'pt' }));
  const externalBooks = Array.from({ length: 20 }, (_, index) => ({ googleBooksId: `remote_${index}`, idioma: 'pt' }));
  const options = { query: '', localQuery: '', externalQuery: '', localBooks, externalBooks };
  const pages = [1, 2, 3].map(page => catalogPageBooks({ ...options, page }));
  assert.deepEqual(pages.map(page => page.length), [15, 15, 8]);
  assert.equal(new Set(pages.flat().map(book => book._id || book.googleBooksId)).size, 38);
 });


test('página parcial continua sem pular livros recebidos depois', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const externalBooks = Array.from({ length: 20 }, (_, index) => ({ googleBooksId: `partial_${index}`, idioma: 'pt' }));
  const options = { query: 'King', externalQuery: 'King', localBooks: [], localQuery: 'King' };
  const first = catalogPageBooks({ ...options, externalBooks: externalBooks.slice(0, 4), offset: 0 });
  const next = catalogPageBooks({ ...options, externalBooks, offset: first.length });
  assert.equal(next[0].googleBooksId, 'partial_4');
  assert.equal(new Set([...first, ...next].map(book => book.googleBooksId)).size, 19);
});


test('português externo aparece antes de inglês local', () => {
  const result = mergeCatalogBooks([{ _id: 'english', idioma: 'en-US' }], [{ googleBooksId: 'portuguese', idioma: 'pt-BR' }, { googleBooksId: 'spanish', idioma: 'es' }]);
  assert.deepEqual(result.map(book => book._id || book.googleBooksId), ['portuguese', 'english']);
});

const catalogBooks = (start, length) => Array.from({ length }, (_, index) => ({ googleBooksId: `page_${start + index}`, idioma: 'pt', urlCapa: 'https://example.com/cover.jpg' }));

test('próxima página ignora lotes vazios e duplicados antes de mostrar livros', async () => {
  const { loadCatalogPage, catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const first = catalogBooks(0, 15);
  const calls = [];
  const batches = [
    { livros: [], nextIndex: 80, hasMore: true },
    { livros: first, nextIndex: 120, hasMore: true },
    { livros: catalogBooks(15, 15), nextIndex: 160, hasMore: true },
  ];
  const result = await loadCatalogPage({ previousResult: { livros: first, nextIndex: 40, hasMore: true }, offset: 15, fetchBatch: async cursor => { calls.push(cursor); return batches.shift(); } });
  assert.deepEqual(calls, [40, 80, 120]);
  const page = catalogPageBooks({ query: 'autor', externalQuery: 'autor', localBooks: [], externalBooks: result.livros, offset: 15 });
  assert.deepEqual(page.map(book => book.googleBooksId), catalogBooks(15, 15).map(book => book.googleBooksId));
});

test('fim da busca sem novos livros preserva resultados existentes', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  const first = catalogBooks(0, 15);
  const result = await loadCatalogPage({ previousResult: { livros: first, nextIndex: 40, hasMore: true }, offset: 15, fetchBatch: async () => ({ livros: [], nextIndex: 40, hasMore: false }) });
  assert.deepEqual(result.livros, first);
  assert.equal(result.hasMore, false);
});

test('busca limitada pode retomar pelo cursor sem criar página vazia', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  const result = await loadCatalogPage({ offset: 0, maxRequests: 2, fetchBatch: async cursor => ({ livros: [], nextIndex: cursor + 40, hasMore: true }) });
  assert.equal(result.nextIndex, 80);
  assert.equal(result.hasMore, true);
  const next = await loadCatalogPage({ previousResult: result, fetchBatch: async cursor => {
    assert.equal(cursor, 80);
    return { livros: catalogBooks(0, 4), nextIndex: 84, hasMore: false };
  } });
  assert.equal(next.livros.length, 4);
});

test('cursor sem avanço não causa repetição infinita', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  await assert.rejects(loadCatalogPage({ fetchBatch: async () => ({ livros: [], nextIndex: 0, hasMore: true }) }), /não avançou/);
});

test('página completa em memória não faz nova consulta', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  const previousResult = { livros: catalogBooks(0, 30), nextIndex: 60, hasMore: true };
  const result = await loadCatalogPage({ previousResult, offset: 15, fetchBatch: async () => { assert.fail('consulta desnecessária'); } });
  assert.deepEqual(result.livros, previousResult.livros);
});


test('voltar a uma página parcial mantém o limite anterior sem repetir livros da seguinte', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const options = { query: 'autor', externalQuery: 'autor', externalBooks: catalogBooks(0, 21), localBooks: [] };
  const previous = catalogPageBooks({ ...options, offset: 0, end: 6 });
  const next = catalogPageBooks({ ...options, offset: 6 });
  assert.equal(previous.length, 6);
  assert.equal(new Set([...previous, ...next].map(book => book.googleBooksId)).size, 21);
});


test('prioriza capas em cada idioma sem excluir livros sem capa', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const externalBooks = [
    { googleBooksId: 'pt_without', idioma: 'pt', urlCapa: '' },
    { googleBooksId: 'en_without', idioma: 'en' },
    { googleBooksId: 'pt_cover', idioma: 'pt', urlCapa: 'https://example.com/pt.jpg' },
    { googleBooksId: 'en_cover', idioma: 'en', urlCapa: 'https://example.com/en.jpg' },
    { googleBooksId: 'pt_blank', idioma: 'pt', urlCapa: '   ' },
  ];
  const result = catalogPageBooks({ query: 'autor', externalQuery: 'autor', localBooks: [], externalBooks });
  assert.deepEqual(result.map(book => book.googleBooksId), ['pt_cover', 'pt_without', 'pt_blank', 'en_cover', 'en_without']);
});

test('ordena capas antes de separar páginas quando ainda não há páginas fixadas', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const externalBooks = catalogBooks(0, 30).map((book, index) => ({ ...book, urlCapa: index >= 15 ? 'https://example.com/cover.jpg' : '' }));
  const options = { query: 'autor', externalQuery: 'autor', localBooks: [], externalBooks };
  const first = catalogPageBooks({ ...options, page: 1 });
  const second = catalogPageBooks({ ...options, page: 2 });
  assert.deepEqual(first.map(book => book.googleBooksId), catalogBooks(15, 15).map(book => book.googleBooksId));
  assert.equal(new Set([...first, ...second].map(book => book.googleBooksId)).size, 30);
});


test('busca capas além do primeiro lote e adia livros sem capa sem perdê-los', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  const without = catalogBooks(0, 15).map(book => ({ ...book, urlCapa: '' }));
  const withCovers = catalogBooks(15, 15);
  let calls = 0;
  const first = await loadCatalogPage({ fetchBatch: async () => {
    calls++;
    return calls === 1 ? { livros: without, nextIndex: 15, hasMore: true } : { livros: withCovers, nextIndex: 30, hasMore: false };
  } });
  assert.equal(calls, 2);
  assert.deepEqual(first.orderedBooks.slice(0, 15), withCovers);
  const next = await loadCatalogPage({ previousResult: first, offset: 15, fetchBatch: async () => assert.fail('busca esgotada') });
  assert.deepEqual(next.orderedBooks.slice(0, 15), withCovers);
  assert.deepEqual(next.orderedBooks.slice(15), without);
});

test('novas capas não deslocam livros de páginas já vistas', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  const firstBooks = catalogBooks(0, 15).map(book => ({ ...book, urlCapa: '' }));
  const first = await loadCatalogPage({ maxRequests: 1, fetchBatch: async () => ({ livros: firstBooks, nextIndex: 15, hasMore: true }) });
  const next = await loadCatalogPage({ previousResult: first, offset: 15, fetchBatch: async () => ({ livros: catalogBooks(15, 15), nextIndex: 30, hasMore: false }) });
  assert.deepEqual(next.orderedBooks.slice(0, 15), firstBooks);
  assert.equal(new Set(next.orderedBooks.map(book => book.googleBooksId)).size, 30);
});


test('resposta externa vazia não esconde livros locais recebidos depois', async () => {
  const { catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const local = { _id: 'late_local', idioma: 'pt', titulo: 'Livro local' };
  const result = catalogPageBooks({ query: '', localQuery: '', localBooks: [local], externalQuery: '', externalBooks: [], orderedBooks: [] });
  assert.equal(result.length, 1);
  assert.equal(result[0]._id, local._id);
});

test('catálogo local permanece visível quando a busca externa falha', async () => {
  const { loadCatalogPage, catalogPageBooks } = await import('../../frontend/src/services/bookCatalog.js');
  const local = { _id: 'offline_local', idioma: 'pt' };
  const result = await loadCatalogPage({ localBooks: [local], fetchBatch: async () => { throw new Error('indisponível'); } });
  const page = catalogPageBooks({ query: '', localQuery: '', localBooks: [local], orderedBooks: result?.orderedBooks, externalBooks: [] });
  assert.equal(page[0]._id, local._id);
});

test('publica primeiros livros enquanto busca lotes adicionais com capas', async () => {
  const { loadCatalogPage } = await import('../../frontend/src/services/bookCatalog.js');
  let calls = 0;
  const progress = [];
  await loadCatalogPage({ onProgress: result => progress.push(result.orderedBooks.length), fetchBatch: async () => {
    calls++;
    if (calls === 2) assert.deepEqual(progress, [1]);
    return { livros: [{ googleBooksId: `progress_${calls}`, idioma: 'pt' }], nextIndex: calls, hasMore: calls < 2 };
  } });
  assert.deepEqual(progress, [1, 2]);
});
