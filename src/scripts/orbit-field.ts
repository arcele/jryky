import { palettes, defaultPalette } from './palettes';

type RGB = [number, number, number];
type Colors = [RGB, RGB, RGB];

type Dot = {
  angle: number;
  distance: number;
  radius: number;
  alpha: number;
  color: 0 | 1 | 2;
  depth: number;
};

const canvas = document.querySelector<HTMLCanvasElement>('.orbit-field');
const hero = document.querySelector<HTMLElement>('.hero');
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
    if (Number.isFinite(value) && value >= min && value <= max &&
        Number.isInteger((value - min) / step)) {
      slider.value = String(value);
    }
  } catch { /* Keep the default when browser storage is unavailable. */ }
}

// Restore before creating the dot pool or starting the first animation frame.
restoreSlider(densitySlider, 'jryky.dot-density');
restoreSlider(speedSlider, 'jryky.dot-speed');


if (canvas && hero) {
  const context = canvas.getContext('2d');

  if (context) {
    const field = canvas;
    const host = hero;
    const ctx = context;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let speedMultiplier = 3 ** (((speedSlider?.valueAsNumber ?? 100) - 100) / 100);
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let colors: Colors = readColors();
    let fromColors: Colors = colors;
    let targetColors: Colors = colors;
    let transitionStart = -Infinity;
    const transitionDuration = 800;
    let dots: Dot[] = [];
    let defaultDotCount = 0;
    let targetDotCount = 0;
    let previousDotCount = 0;
    let densityChangeTime = -Infinity;

    function visibleDotCount(time: number) {
      if (motionQuery.matches) return targetDotCount;
      const progress = Math.min(1, (time - densityChangeTime) / 220);
      return previousDotCount + (targetDotCount - previousDotCount) * progress;
    }

    function readColors(): Colors {
      const root = document.documentElement;
      const dark = root.dataset.theme === 'dark' ||
        (!root.dataset.theme && colorSchemeQuery.matches);
      const palette = palettes.find((item) => item.id === root.dataset.palette) ??
        palettes.find((item) => item.id === defaultPalette())!;
      return palette[dark ? 'dark' : 'light'].map((hex) =>
        [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)) as RGB,
      ) as Colors;
    }

    function interpolateColors(time: number): Colors {
      const progress = motionQuery.matches ? 1 : Math.min(1, (time - transitionStart) / transitionDuration);
      const eased = progress * progress * (3 - 2 * progress);
      return targetColors.map((target, index) => target.map((channel, component) =>
        fromColors[index]![component]! + (channel - fromColors[index]![component]!) * eased,
      ) as RGB) as Colors;
    }

    function changeColors() {
      const now = performance.now();
      // Start from the current blended colors, even during rapid switching.
      fromColors = interpolateColors(now);
      targetColors = readColors();
      transitionStart = now;
      draw();
    }

    function seededRandom(seed: number) {
      let state = seed >>> 0;
      return () => {
        state += 0x6d2b79f5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    }

    function createDots() {
      const random = seededRandom(20140925);
      defaultDotCount = width < 600 ? 100 : width < 1000 ? 150 : 220;
      targetDotCount = Math.round(defaultDotCount * (densitySlider?.valueAsNumber ?? 100) / 100);
      previousDotCount = targetDotCount;
      // Keep a seeded pool so changing density never regenerates existing dots.
      const maxCount = Math.round(defaultDotCount * Number(densitySlider?.max ?? 100) / 100);
      const maxDistance = Math.max(width * 0.57, height * 0.8);

      dots = Array.from({ length: maxCount }, (_, index) => {
        const depth = index % 2 === 0 ? 0.55 : 1;
        return {
          angle: random() * Math.PI * 2,
          distance: Math.sqrt(random()) * maxDistance,
          radius: (2.5 + random() * 8) * (0.75 + depth * 0.3),
          alpha: 0.18 + random() * 0.56,
          color: Math.floor(random() * 3) as 0 | 1 | 2,
          depth,
        };
      });
    }

    function resize() {
      const bounds = host.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      field.width = Math.round(width * dpr);
      field.height = Math.round(height * dpr);
      field.style.width = `${width}px`;
      field.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createDots();
      start();
    }

    function draw() {
      const now = performance.now();
      colors = interpolateColors(now);
      const count = visibleDotCount(now);
      const fills = colors.map((color) => `rgb(${color.join(', ')})`);
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2 + pointerX * 20;
      const centerY = height * 0.43 + pointerY * 12;

      for (let index = 0; index < Math.ceil(count); index++) {
        const dot = dots[index]!;
        const visibility = Math.min(1, count - index);
        const direction = dot.depth === 1 ? 1 : -1;
        const speed = dot.depth === 1 ? 0.000035 : 0.000018;
        const angle = dot.angle + elapsed * speed * direction;
        const stretch = width < 650 ? 0.82 : 1;
        const x = centerX + Math.cos(angle) * dot.distance * stretch;
        const y = centerY + Math.sin(angle) * dot.distance * 0.56;

        if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;

        ctx.beginPath();
        ctx.fillStyle = fills[dot.color]!;
        ctx.globalAlpha = dot.alpha * visibility;
        ctx.arc(x, y, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function animate(time: number) {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      elapsed += delta * speedMultiplier;
      pointerX += (targetX - pointerX) * 0.035;
      pointerY += (targetY - pointerY) * 0.035;
      draw();
      frameId = requestAnimationFrame(animate);
    }

    function start() {
      cancelAnimationFrame(frameId);
      if (motionQuery.matches || document.hidden) {
        draw();
        return;
      }
      lastTime = performance.now();
      frameId = requestAnimationFrame(animate);
    }

    host.addEventListener('pointermove', (event) => {
      const bounds = host.getBoundingClientRect();
      targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
    });

    host.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
    });

    if (densitySlider) {
      const slider = densitySlider;
      slider.setAttribute('aria-valuetext', `${slider.value}% of default`);
      slider.closest<HTMLElement>('.density-control')!.hidden = false;
      slider.addEventListener('input', () => {
        const now = performance.now();
        previousDotCount = visibleDotCount(now);
        targetDotCount = Math.round(defaultDotCount * slider.valueAsNumber / 100);
        densityChangeTime = now;
        slider.setAttribute('aria-valuetext', `${slider.value}% of default`);
        try { localStorage.setItem('jryky.dot-density', slider.value); } catch { /* Optional persistence. */ }
        if (motionQuery.matches) draw();
      });
    }

    if (speedSlider) {
      const slider = speedSlider;
      slider.setAttribute('aria-valuetext', `${speedMultiplier.toFixed(2)}× normal speed`);
      slider.closest<HTMLElement>('.speed-control')!.hidden = false;
      slider.addEventListener('input', () => {
        // Accumulate scaled time so speed changes never jump orbital phase.
        speedMultiplier = 3 ** ((slider.valueAsNumber - 100) / 100);
        slider.setAttribute('aria-valuetext', `${speedMultiplier.toFixed(2)}× normal speed`);
        try { localStorage.setItem('jryky.dot-speed', slider.value); } catch { /* Optional persistence. */ }
      });
    }

    document.addEventListener('visibilitychange', start);
    motionQuery.addEventListener('change', start);
    colorSchemeQuery.addEventListener('change', changeColors);
    new ResizeObserver(resize).observe(host);

    const themeObserver = new MutationObserver(changeColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] });
  }
}
