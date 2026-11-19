/* Lineas en onda decorativas (referencia de Trabajo: cabecera y tarjeta negra) */
export default function Waves() {
  return (
    <svg className="waves" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {Array.from({ length: 9 }, (_, index) => (
        <path key={index} d={`M0 ${70 + index * 4} C 70 ${10 + index * 6}, 150 ${130 - index * 3}, 300 ${40 + index * 5}`} />
      ))}
    </svg>
  );
}
