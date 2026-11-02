// Helpers so any colour an admin picks for a rumah sukan stays readable.

function rgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or navy text, whichever reads better on this background. */
export function onColor(hex = '#1E7B3A') {
  return luminance(hex) > 0.35 ? '#14213D' : '#FFFFFF';
}

/** A pale tint of the colour (88% white) for badges. */
export function tintOf(hex = '#1E7B3A') {
  const [r, g, b] = rgb(hex).map((v) => Math.round(v + (255 - v) * 0.85));
  return `rgb(${r}, ${g}, ${b})`;
}
