import { useId, useState } from "react";

function StarRating({ value, onChange, disabled = false }) {
  const name = useId();
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const preview = disabled ? value : hovered ?? focused ?? value;
  const hasValue = preview !== "" && preview != null;

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold text-mist">
        Sua avaliação
      </legend>
      <div className="flex gap-1" onPointerLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, Number(preview) - star + 1));

          return (
            <div key={star} className={`relative h-10 w-10 ${focused != null && Math.ceil(focused) === star ? "drop-shadow-[0_0_5px_rgba(216,162,74,0.7)]" : ""}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 text-mist" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01Z" />
              </svg>
              <div className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 max-w-none text-copper" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01Z" />
                </svg>
              </div>
              {[star - 0.5, star].map((rating, half) => (
                <label key={rating} className={`absolute inset-y-0 w-1/2 ${disabled ? "cursor-wait" : "cursor-pointer"} ${half === 0 ? "left-0" : "right-0"}`}
                  onPointerEnter={event => { if (!disabled && event.pointerType !== "touch") setHovered(rating); }}>
                  <input
                    type="radio"
                    name={name}
                    value={rating}
                    checked={Number(value) === rating}
                    onChange={() => { setHovered(null); onChange(rating); }}
                    onFocus={event => { if (event.target.matches(":focus-visible")) setFocused(rating); }}
                    onBlur={() => setFocused(null)}
                    aria-label={`${rating} de 5 estrelas`}
                    className="sr-only"
                    required
                  />
                </label>
              ))}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-mist" aria-live="polite">
        {hasValue ? `${Number(preview).toLocaleString("pt-BR")}/5` : "Selecione meia estrela ou uma estrela inteira."}
      </p>
    </fieldset>
  );
}

export default StarRating;
