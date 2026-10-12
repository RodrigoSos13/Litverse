import poweredByGoogle from "../assets/google-books-powered-by.png";

export default function GoogleBooksAttribution({ className = "" }) {
  return <a href="https://books.google.com" target="_blank" rel="noopener noreferrer" aria-label="Google Books" className={`inline-flex shrink-0 items-center rounded-sm bg-white ${className}`}><img src={poweredByGoogle} alt="Powered by Google" width="62" height="30" className="block h-[30px] w-[62px] max-w-none" /></a>;
}
