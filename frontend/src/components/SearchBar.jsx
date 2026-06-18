function SearchBar({ value, onChange }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-card">
      <label className="mb-2 block text-sm font-semibold text-stone-600" htmlFor="book-search">
        Pesquisar livros
      </label>
      <input
        id="book-search"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Digite um titulo ou autor"
        className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none transition focus:border-copper"
      />
    </div>
  );
}

export default SearchBar;
