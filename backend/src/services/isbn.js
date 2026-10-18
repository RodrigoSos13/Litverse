export const normalizeIsbn = value => typeof value === "string" ? value.replace(/[\s-]/g, "").toUpperCase() : "";

export function isValidIsbn(value) {
  const isbn = normalizeIsbn(value);
  if (/^\d{9}[\dX]$/.test(isbn)) {
    return [...isbn].reduce((sum, digit, index) => sum + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0) % 11 === 0;
  }
  if (/^97[89]\d{10}$/.test(isbn)) {
    return [...isbn].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === 0;
  }
  return false;
}
