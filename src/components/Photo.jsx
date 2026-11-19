/* Imagen con <picture>, medidas y carga diferida (SKILLS.md) */
export default function Photo({ photo, className = '', isEager = false, isDecorative = false }) {
  return (
    <picture className={className}>
      <source srcSet={photo.src} type="image/jpeg" />
      <img
        className="photo__img"
        src={photo.src}
        alt={isDecorative ? '' : photo.alt}
        width="960"
        height="640"
        loading={isEager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
