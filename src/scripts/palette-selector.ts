import { defaultPalette, isPalette } from './palettes';

const selector = document.querySelector<HTMLSelectElement>('#bubble-palette');
if (selector) {
  const storageKey = 'jryky.bubble-palette';
  let preference = 'auto';
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'auto' || isPalette(stored)) preference = stored;
  } catch { /* The selector also works when storage is unavailable. */ }

  function apply(value: string) {
    document.documentElement.dataset.palette = isPalette(value) ? value : defaultPalette();
  }
  selector.value = preference;
  apply(preference);
  selector.closest<HTMLElement>('.palette-control')!.hidden = false;
  selector.addEventListener('change', () => {
    apply(selector.value);
    try { localStorage.setItem(storageKey, selector.value); } catch { /* Optional persistence. */ }
  });
}
