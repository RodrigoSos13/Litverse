function StarRating({ value, onChange, disabled = false }) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold text-mist">
        Sua avaliação
      </legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, Number(value) - star + 1));

          return (
            <div key={star} className="relative h-10 w-10">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 text-mist" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01Z" />
              </svg>
              <div className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 max-w-none text-copper" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01Z" />
                </svg>
              </div>
              {[star - 0.5, star].map((rating, half) => (
                <label key={rating} className={`absolute inset-y-0 w-1/2 cursor-pointer rounded focus-within:ring-2 focus-within:ring-copper ${half === 0 ? "left-0" : "right-0"}`}>
                  <input
                    type="radio"
                    name="nota"
                    value={rating}
                    checked={Number(value) === rating}
                    onChange={() => onChange(rating)}
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
        {value === "" ? "Selecione meia estrela ou uma estrela inteira." : `${value}/5`}
      </p>
    </fieldset>
  );
}

export default StarRating;
