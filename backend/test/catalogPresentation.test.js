import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeCatalogBooks } from '../../frontend/src/services/bookCatalog.js';

test('catálogo une origens sem duplicar e preserva notas locais', () => {
  const saved = { _id: 'saved', googleBooksId: 'volume', idioma: 'pt', isbn: '978-123', mediaAvaliacoes: 4, totalAvaliacoes: 1 };
  const manual = { _id: 'manual', idioma: 'Português' };
  const remote = { googleBooksId: 'volume', localId: 'saved', idioma: 'pt', isbn: '978123' };
  const another = { googleBooksId: 'new', idioma: 'pt' };
  const result = mergeCatalogBooks([saved, manual], [remote, another, { googleBooksId: 'foreign', idioma: 'en' }, { googleBooksId: 'unknown' }]);
  assert.equal(result.length, 3);
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
