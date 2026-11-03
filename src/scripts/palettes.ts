// Add palettes here; the selector and canvas share this registry.
export const palettes = [
  { id: 'ocean', label: 'Ocean', light: ['#0877ad', '#c9c1bc'], dark: ['#35b8ed', '#807773'] },
  { id: 'violet', label: 'Purple / Magenta', light: ['#7c3aed', '#db2777'], dark: ['#b497ff', '#f062c0'] },
] as const;

export type PaletteId = (typeof palettes)[number]['id'];
export const isPalette = (value: string | null): value is PaletteId =>
  palettes.some((palette) => palette.id === value);

// Central place for future seasonal/date rules. Explicit choices take precedence.
export function defaultPalette(): PaletteId {
  return 'ocean';
}
