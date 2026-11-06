// Each palette has three color slots; repeat a color for two-color themes.
// Add palettes here; the selector and canvas share this registry.
export const palettes = [
  { id: 'ocean', label: 'Ocean', light: ['#0877ad', '#c9c1bc', '#0877ad'], dark: ['#35b8ed', '#807773', '#35b8ed'] },
  { id: 'violet', label: 'Purple / Magenta', light: ['#7c3aed', '#db2777', '#7c3aed'], dark: ['#b497ff', '#f062c0', '#b497ff'] },
  { id: 'fall', label: 'Fall', light: ['#d76a14', '#80502d', '#d6a313'], dark: ['#f39642', '#b58158', '#f2cc55'] },
  { id: 'spring', label: 'Spring', light: ['#399343', '#d4ae18', '#399343'], dark: ['#76cf83', '#f2d65b', '#76cf83'] },
  { id: 'pretty-in-pink', label: 'Pretty in Pink', light: ['#e51b82', '#cc548d', '#f3a9cc'], dark: ['#ff4ba6', '#e981b5', '#ffc1df'] },
  { id: 'greyscale', label: 'Greyscale', light: ['#555555', '#858585', '#b8b8b8'], dark: ['#d4d4d4', '#a0a0a0', '#707070'] },
] as const;

export type PaletteId = (typeof palettes)[number]['id'];
export const isPalette = (value: string | null): value is PaletteId =>
  palettes.some((palette) => palette.id === value);

// Central place for future seasonal/date rules. Explicit choices take precedence.
export function defaultPalette(): PaletteId {
  return 'ocean';
}
