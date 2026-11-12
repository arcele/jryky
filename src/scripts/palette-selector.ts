import {
  defaultPalette, isPalette, palettes, paletteColors,
  customColors, isCustomColors, updateCustomColors, type PaletteId,
} from './palettes';

const slider = document.querySelector<HTMLInputElement>('#bubble-palette');
const panel = document.querySelector<HTMLElement>('.custom-theme-panel');

if (slider && panel) {
  const control = slider;
  const editor = panel;
  const swatches = Array.from(editor.querySelectorAll<HTMLInputElement>('input[type="color"]'));
  const storageKey = 'jryky.bubble-palette';
  const customStorageKey = 'jryky.custom-palette';
  let preference = 'auto';
  let customConfigured = false;

  try {
    const savedColors: unknown = JSON.parse(localStorage.getItem(customStorageKey) ?? 'null');
    if (isCustomColors(savedColors)) {
      updateCustomColors(savedColors);
      customConfigured = true;
    }
  } catch { /* Use the initial swatches if custom colors cannot be restored. */ }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'auto' || isPalette(stored)) preference = stored;
  } catch { /* The slider also works when storage is unavailable. */ }

  let activeId: PaletteId = isPalette(preference) ? preference : defaultPalette();
  if (activeId === 'custom' && !customConfigured) activeId = defaultPalette();
  control.max = String(palettes.length - 1);
  control.value = String(palettes.findIndex((palette) => palette.id === activeId));

  function apply(id: PaletteId) {
    const palette = palettes.find((item) => item.id === id)!;
    const root = document.documentElement;
    root.dataset.palette = id;
    root.style.setProperty('--portrait-orbit-light', paletteColors(palette, false)[0]);
    root.style.setProperty('--portrait-orbit-dark', paletteColors(palette, true)[0]);
    control.setAttribute('aria-valuetext', palette.label);
    activeId = id;
  }

  function savePreference() {
    try { localStorage.setItem(storageKey, activeId); } catch { /* Optional persistence. */ }
  }

  function closeEditor() {
    editor.classList.remove('is-open');
    control.value = String(palettes.findIndex((palette) => palette.id === activeId));
    control.setAttribute('aria-valuetext', palettes[Number(control.value)]!.label);
    if (editor.contains(document.activeElement)) control.focus({ preventScroll: true });
  }

  function openEditor() {
    swatches.forEach((swatch, index) => { swatch.value = customColors[index]!; });
    editor.hidden = false;
    requestAnimationFrame(() => {
      if (palettes[Number(control.value)]?.id !== 'custom') return;
      editor.classList.add('is-open');
      swatches[0]!.focus({ preventScroll: true });
    });
  }

  apply(activeId);
  control.closest<HTMLElement>('.palette-control')!.hidden = false;
  control.addEventListener('input', () => {
    const palette = palettes[Number(control.value)];
    if (!palette) return;
    control.setAttribute('aria-valuetext', palette.label);
    if (palette.id === 'custom') {
      if (customConfigured) {
        apply('custom');
        savePreference();
      }
      return;
    }
    editor.classList.remove('is-open');
    apply(palette.id);
    savePreference();
  });
  // Wait for dragging to finish before opening a color editor.
  control.addEventListener('change', () => {
    if (palettes[Number(control.value)]?.id === 'custom') openEditor();
  });

  editor.querySelector('[data-custom-apply]')!.addEventListener('click', () => {
    const colors = swatches.map((swatch) => swatch.value);
    if (!isCustomColors(colors)) return;
    updateCustomColors(colors);
    customConfigured = true;
    apply('custom');
    try { localStorage.setItem(customStorageKey, JSON.stringify(colors)); } catch { /* Optional persistence. */ }
    savePreference();
    closeEditor();
  });
  editor.querySelector('[data-custom-cancel]')!.addEventListener('click', closeEditor);
  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeEditor();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (editor.classList.contains('is-open') && event.target instanceof Node &&
        !editor.contains(event.target)) closeEditor();
  });
}
