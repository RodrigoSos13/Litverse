import poweredByGoogle from "../assets/google-books-powered-by.png";

export default function GoogleBooksAttribution({ className = "" }) {
  return (
    <a
      href="https://books.google.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Google Books"
      className={`inline-flex shrink-0 items-center rounded-md bg-[#cbd5e1] px-2 py-1 outline-none transition-colors hover:bg-[#e2e8f0] focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-midnight ${className}`}
    >
      <img
        src={poweredByGoogle}
        alt="Powered by Google"
        width="62"
        height="30"
        className="block h-[30px] w-[62px] max-w-none"
      />
    </a>
  );
}
