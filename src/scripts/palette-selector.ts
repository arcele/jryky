import { defaultPalette, isPalette, palettes } from './palettes';

const slider = document.querySelector<HTMLInputElement>('#bubble-palette');
if (slider) {
  const storageKey = 'jryky.bubble-palette';
  let preference = 'auto';
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'auto' || isPalette(stored)) preference = stored;
  } catch { /* The slider also works when storage is unavailable. */ }

  const initialId = isPalette(preference) ? preference : defaultPalette();
  slider.max = String(palettes.length - 1);
  slider.value = String(palettes.findIndex((palette) => palette.id === initialId));

  function apply() {
    const palette = palettes[Number(slider!.value)];
    if (!palette) return;
    const root = document.documentElement;
    root.dataset.palette = palette.id;
    root.style.setProperty('--portrait-orbit-light', palette.light[0]);
    root.style.setProperty('--portrait-orbit-dark', palette.dark[0]);
    slider!.setAttribute('aria-valuetext', palette.label);
    return palette.id;
  }
  apply();
  slider.closest<HTMLElement>('.palette-control')!.hidden = false;
  slider.addEventListener('input', () => {
    const id = apply();
    if (id) {
      try { localStorage.setItem(storageKey, id); } catch { /* Optional persistence. */ }
    }
  });
}
