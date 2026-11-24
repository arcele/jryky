import { palettes, defaultPalette, paletteColors } from './palettes';
import { ParticleField, type FieldColors } from './particle-field';
import { createFieldRenderer } from './field-renderer';

const canvas = document.querySelector<HTMLCanvasElement>('.orbit-field');
const hero = document.querySelector<HTMLElement>('.hero');
const windButton = document.querySelector<HTMLButtonElement>('#wind-dots');
const popButton = document.querySelector<HTMLButtonElement>('#pop-dots');
const dropButton = document.querySelector<HTMLButtonElement>('#drop-dots');
const reverseButton = document.querySelector<HTMLButtonElement>('#reverse-dots');
const speedSlider = document.querySelector<HTMLInputElement>('#dot-speed');
const densitySlider = document.querySelector<HTMLInputElement>('#dot-density');

function restoreSlider(slider: HTMLInputElement | null, storageKey: string) {
  if (!slider) return;
  slider.value = slider.defaultValue;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null || stored.trim() === '') return;
    const value = Number(stored);
    const min = Number(slider.min);
    const max = Number(slider.max);
    const step = Number(slider.step);
    if (
      Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      Number.isInteger((value - min) / step)
    ) {
      slider.value = String(value);
    }
  } catch {
    /* Keep the default when browser storage is unavailable. */
  }
}

// Restore before creating the dot pool or starting the first animation frame.
restoreSlider(densitySlider, 'jryky.dot-density');
restoreSlider(speedSlider, 'jryky.dot-speed');

if (canvas && hero) {
  const context = canvas.getContext('2d');
  if (context) {
    const host = hero;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const renderer = createFieldRenderer(
      canvas,
      context,
      document.querySelector<HTMLCanvasElement>('.fallen-field'),
    );
    const particles = new ParticleField({
      colors: readColors(),
      density: densitySlider?.valueAsNumber ?? 100,
      speed: speedSlider?.valueAsNumber ?? 100,
      reducedMotion: motionQuery.matches,
    });
    let frameId = 0;
    let lastTime = performance.now();

    function readColors(): FieldColors {
      const root = document.documentElement;
      const dark =
        root.dataset.theme === 'dark' || (!root.dataset.theme && colorSchemeQuery.matches);
      const palette =
        palettes.find((item) => item.id === root.dataset.palette) ??
        palettes.find((item) => item.id === defaultPalette())!;
      return paletteColors(palette, dark).map((hex) =>
        [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)),
      ) as FieldColors;
    }

    function syncActionControls() {
      const phase = particles.phase;
      if (popButton) {
        const popped = phase === 'popping' || phase === 'popped';
        popButton.classList.toggle('is-popped', popped);
        popButton.disabled = phase !== 'orbit' && phase !== 'popped';
        const label = popped ? 'Create a new dot field' : 'Pop dots';
        popButton.setAttribute('aria-label', label);
        popButton.title = label;
      }
      if (windButton) {
        const blown = phase === 'blowing' || phase === 'blown';
        windButton.classList.toggle('wind-left', particles.windDirection === -1);
        windButton.classList.toggle('is-blown', blown);
        windButton.disabled = phase !== 'orbit' && phase !== 'blown';
        const label = blown ? 'Create a new dot field' : 'Blow dots away';
        windButton.setAttribute('aria-label', label);
        windButton.title = label;
      }
      if (!dropButton) return;
      const dropped = particles.phase === 'fallen';
      dropButton.classList.toggle('is-dropped', dropped);
      dropButton.disabled = phase !== 'orbit' && phase !== 'fallen';
      const label = dropped ? 'Create a new dot field' : 'Drop dots';
      dropButton.setAttribute('aria-label', label);
      dropButton.title = label;
    }

    function render(time = performance.now()) {
      const previousPhase = particles.phase;
      particles.update(time);
      renderer.render(particles.frame(time));
      if (particles.phase !== previousPhase) syncActionControls();
    }

    function animate(time: number) {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      particles.advance(delta, time);
      render(time);
      frameId = requestAnimationFrame(animate);
    }

    function start() {
      cancelAnimationFrame(frameId);
      particles.setReducedMotion(motionQuery.matches);
      if (motionQuery.matches || document.hidden) {
        render();
        return;
      }
      lastTime = performance.now();
      frameId = requestAnimationFrame(animate);
    }

    function resize() {
      const bounds = host.getBoundingClientRect();
      renderer.resize(bounds.width, bounds.height, window.devicePixelRatio);
      particles.resize(bounds.width, bounds.height);
      start();
    }

    function changeColors() {
      const now = performance.now();
      particles.setColors(readColors(), now);
      render(now);
    }

    host.addEventListener('pointermove', (event) => {
      const bounds = host.getBoundingClientRect();
      particles.setPointer(
        (event.clientX - bounds.left) / bounds.width - 0.5,
        (event.clientY - bounds.top) / bounds.height - 0.5,
      );
    });
    host.addEventListener('pointerleave', () => particles.setPointer(0, 0));

    if (densitySlider) {
      const slider = densitySlider;
      slider.setAttribute('aria-valuetext', `${slider.value}% of default`);
      slider.closest<HTMLElement>('.density-control')!.hidden = false;
      slider.addEventListener('input', () => {
        particles.setDensity(slider.valueAsNumber, performance.now());
        slider.setAttribute('aria-valuetext', `${slider.value}% of default`);
        try {
          localStorage.setItem('jryky.dot-density', slider.value);
        } catch {
          /* Optional persistence. */
        }
        if (motionQuery.matches) render();
      });
    }

    if (speedSlider) {
      const slider = speedSlider;
      slider.setAttribute('aria-valuetext', `${particles.speed.toFixed(2)}× normal speed`);
      slider.closest<HTMLElement>('.speed-control')!.hidden = false;
      slider.addEventListener('input', () => {
        particles.setSpeed(slider.valueAsNumber);
        slider.setAttribute('aria-valuetext', `${particles.speed.toFixed(2)}× normal speed`);
        try {
          localStorage.setItem('jryky.dot-speed', slider.value);
        } catch {
          /* Optional persistence. */
        }
      });
    }

    if (reverseButton) {
      const button = reverseButton;
      button.closest<HTMLElement>('.field-actions')!.hidden = false;
      button.addEventListener('click', () => {
        particles.reverse(performance.now());
        button.classList.toggle('is-reversed', particles.reversed);
        button.setAttribute('aria-pressed', String(particles.reversed));
      });
    }

    if (dropButton) {
      const button = dropButton;
      button.closest<HTMLElement>('.field-actions')!.hidden = false;
      button.addEventListener('click', () => {
        particles.dropOrRenew(performance.now());
        syncActionControls();
        render();
      });
    }

    if (popButton) {
      const button = popButton;
      button.closest<HTMLElement>('.field-actions')!.hidden = false;
      button.addEventListener('click', () => {
        particles.popOrRenew(performance.now());
        syncActionControls();
        render();
      });
    }

    if (windButton) {
      const button = windButton;
      button.closest<HTMLElement>('.field-actions')!.hidden = false;
      button.addEventListener('click', () => {
        particles.blowOrRenew(performance.now(), Math.random() < 0.5 ? -1 : 1);
        syncActionControls();
        render();
      });
    }

    document.addEventListener('visibilitychange', start);
    motionQuery.addEventListener('change', start);
    colorSchemeQuery.addEventListener('change', changeColors);
    new ResizeObserver(resize).observe(host);

    const themeObserver = new MutationObserver(changeColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-palette'],
    });
  }
}
