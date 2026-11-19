/*
 * Foto de perfil como en FoxTrips: recorte cuadrado centrado y reducido (256 px, WebP o JPEG).
 * Se guarda como imagen en linea de pocos KB dentro de los ajustes (sirve igual en modo local y en Supabase).
 */
const AVATAR_SIDE = 256;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

export const AVATAR_COLORS = [
  { value: 'coral', label: 'Coral', from: '#ffb08a', to: '#e2603c' },
  { value: 'oro', label: 'Oro', from: '#ffd98a', to: '#d9961e' },
  { value: 'menta', label: 'Menta', from: '#9be8cf', to: '#1f9e7d' },
  { value: 'cielo', label: 'Cielo', from: '#a9d2ff', to: '#2f6fc0' },
  { value: 'lila', label: 'Lila', from: '#d5c4ff', to: '#6b4fd1' },
  { value: 'rosa', label: 'Rosa', from: '#ffb6c8', to: '#c22c56' },
  { value: 'grafito', label: 'Grafito', from: '#8b8b95', to: '#2a2a30' }
];

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    image.src = url;
  });
}

export async function squareAvatar(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La imagen pesa demasiado (máximo 15 MB).');
  const image = await loadImage(file);
  const crop = Math.min(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(AVATAR_SIDE, crop);
  canvas.height = canvas.width;
  canvas.getContext('2d').drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL('image/webp', 0.82);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
}

export function avatarGradient(color) {
  const item = AVATAR_COLORS.find((entry) => entry.value === color) || AVATAR_COLORS[1];
  return `radial-gradient(circle at 30% 25%, ${item.from}, ${item.to} 70%)`;
}
