/*
 * Chips segmentados en pildora (referencias del cine y "Your Legend").
 * Son un grupo de botones conmutables (aria-pressed): cada uno es alcanzable con Tab, sin pestañas ARIA a medias.
 */
export default function Segmented({ options, value, onChange, label, isCompact = false }) {
  return (
    <div className={`segmented${isCompact ? ' segmented--compact' : ''}`} role="group" aria-label={label}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            className={`segmented__option${isActive ? ' segmented__option--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && <span className="segmented__count">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
