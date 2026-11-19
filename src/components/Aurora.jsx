/* Fondo aurora difuminado (referencia principal): tres manchas de color que cambian de tono por seccion */
export default function Aurora({ tone }) {
  return (
    <div className={`aurora aurora--${tone}`} aria-hidden="true">
      <span className="aurora__blob aurora__blob--one" />
      <span className="aurora__blob aurora__blob--two" />
      <span className="aurora__blob aurora__blob--three" />
      <span className="aurora__grain" />
    </div>
  );
}
