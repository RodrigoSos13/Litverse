import { useEffect, useState } from "react";

export default function BookCover({ url, title, className = "h-full w-full rounded-xl object-contain" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed) return <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-line bg-midnight/50 p-4 text-center text-mist"><span aria-hidden="true" className="font-display text-4xl text-copper">L</span><span className="line-clamp-3 text-sm">{title}</span><span className="text-xs">Capa não disponível</span></div>;
  return <img src={url} alt={`Capa de ${title}`} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
