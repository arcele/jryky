import { palettes, defaultPalette, paletteColors } from './palettes';

type RGB = [number, number, number];
type Colors = [RGB, RGB, RGB];

type Dot = {
  angle: number;
  distance: number;
  radius: number;
  alpha: number;
  color: 0 | 1 | 2;
  depth: number;
  visibilityFrom: number;
  visibilityTarget: number;
  visibilityStart: number;
};

type FallenDot = {
  x: number;
  y: number;
  velocityY: number;
  radius: number;
  alpha: number;
  color: Dot['color'];
};

const canvas = document.querySelector<HTMLCanvasElement>('.orbit-field');
const hero = document.querySelector<HTMLElement>('.hero');
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
    const fallenField = document.querySelector<HTMLCanvasElement>('.fallen-field');
    const fallenContext = fallenField?.getContext('2d') ?? ctx;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let speedMultiplier = 3 ** (((speedSlider?.valueAsNumber ?? 100) - 100) / 100);
    let previousDirection = 1;
    let targetDirection = 1;
    let directionChangeTime = -Infinity;

    function rotationDirection(time: number) {
      const progress = Math.min(1, (time - directionChangeTime) / 1000);
      const eased = (1 - Math.cos(progress * Math.PI)) / 2;
      return previousDirection + (targetDirection - previousDirection) * eased;
    }

    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let colors: Colors = readColors();
    let fromColors: Colors = colors;
    let targetColors: Colors = colors;
    let transitionStart = -Infinity;
    const transitionDuration = 800;
    const fadeOutDuration = 1500;
    const fadeInDuration = 750;
    let dots: Dot[] = [];
    let generation = 0;
    let fieldState: 'orbit' | 'fallen' | 'renewing' = 'orbit';
    let fallenDots: FallenDot[] = [];
    let effectTime = 0;
    let renewalStart = 0;
    let defaultDotCount = 0;
    let targetDotCount = 0;
    function dotVisibility(dot: Dot, time: number) {
      if (motionQuery.matches) return dot.visibilityTarget;
      const duration = dot.visibilityTarget > dot.visibilityFrom ? fadeInDuration : fadeOutDuration;
      const progress = Math.min(1, (time - dot.visibilityStart) / duration);
      return dot.visibilityFrom + (dot.visibilityTarget - dot.visibilityFrom) * progress;
    }

    function readColors(): Colors {
      const root = document.documentElement;
      const dark = root.dataset.theme === 'dark' ||
        (!root.dataset.theme && colorSchemeQuery.matches);
      const palette = palettes.find((item) => item.id === root.dataset.palette) ??
        palettes.find((item) => item.id === defaultPalette())!;
      return paletteColors(palette, dark).map((hex) =>
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
      const random = seededRandom(20140925 + generation);
      defaultDotCount = width < 600 ? 100 : width < 1000 ? 150 : 220;
      targetDotCount = Math.round(defaultDotCount * (densitySlider?.valueAsNumber ?? 100) / 100);
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
          visibilityFrom: index < targetDotCount ? 1 : 0,
          visibilityTarget: index < targetDotCount ? 1 : 0,
          visibilityStart: -Infinity,
        };
      });
    }

    function resize() {
      const bounds = host.getBoundingClientRect();
      const previousWidth = width;
      const previousHeight = height;
      width = bounds.width;
      height = bounds.height;
      if (previousWidth && previousHeight) {
        for (const dot of fallenDots) {
          dot.x *= width / previousWidth;
          dot.y = Math.min(height - dot.radius, dot.y * height / previousHeight);
        }
      }
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      field.width = Math.round(width * dpr);
      field.height = Math.round(height * dpr);
      field.style.width = `${width}px`;
      field.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fallenField) {
        fallenField.width = field.width;
        fallenField.height = field.height;
        fallenField.style.width = field.style.width;
        fallenField.style.height = field.style.height;
        fallenContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      createDots();
      start();
    }

    function orbitPosition(dot: Dot) {
      const direction = dot.depth === 1 ? 1 : -1;
      const speed = dot.depth === 1 ? 0.000035 : 0.000018;
      const angle = dot.angle + elapsed * speed * direction;
      const stretch = width < 650 ? 0.82 : 1;
      return {
        x: width / 2 + pointerX * 20 + Math.cos(angle) * dot.distance * stretch,
        y: height * 0.43 + pointerY * 12 + Math.sin(angle) * dot.distance * 0.56,
      };
    }

    function paintDot(x: number, y: number, radius: number, alpha: number, color: string, layer = ctx) {
      if (alpha <= 0 || x < -30 || x > width + 30 || y < -30 || y > height + 30) return;
      layer.beginPath();
      layer.fillStyle = color;
      layer.globalAlpha = alpha;
      layer.arc(x, y, radius, 0, Math.PI * 2);
      layer.fill();
    }

    function advanceFallenDots(delta: number) {
      // Small physics steps keep impacts consistent across different frame rates.
      const steps = Math.ceil(delta / 8);
      const step = delta / steps;
      for (const dot of fallenDots) {
        const floor = height - dot.radius;
        if (dot.y >= floor && dot.velocityY === 0) continue;
        const restitution = 0.38 + dot.radius * 0.008;
        for (let index = 0; index < steps; index++) {
          dot.velocityY += 0.0014 * step;
          dot.y += dot.velocityY * step;
          if (dot.y >= floor) {
            dot.y = floor;
            dot.velocityY = -dot.velocityY * restitution;
            if (Math.abs(dot.velocityY) < 0.06) {
              dot.velocityY = 0;
              break;
            }
          }
        }
      }
    }

    function draw() {
      const now = performance.now();
      colors = interpolateColors(now);
      const fills = colors.map((color) => `rgb(${color.join(', ')})`);
      ctx.clearRect(0, 0, width, height);
      if (fallenContext !== ctx) fallenContext.clearRect(0, 0, width, height);

      const renewalAge = motionQuery.matches ? Infinity : effectTime - renewalStart;
      const fadeOutProgress = Math.min(1, renewalAge / fadeOutDuration);
      const fadeInProgress = Math.max(0, Math.min(1, (renewalAge - fadeOutDuration) / fadeInDuration));
      if (fieldState === 'renewing' && fadeInProgress >= 1) {
        fallenDots = [];
        fieldState = 'orbit';
        if (dropButton) dropButton.disabled = false;
      }

      if (fieldState !== 'fallen') {
        const opacity = fieldState === 'renewing' ? fadeInProgress : 1;
        for (const dot of dots) {
          const visibility = dotVisibility(dot, now);
          if (visibility <= 0) continue;
          const position = orbitPosition(dot);
          paintDot(position.x, position.y, dot.radius, dot.alpha * visibility * opacity, fills[dot.color]!);
        }
      }

      const oldOpacity = fieldState === 'renewing' ? 1 - fadeOutProgress : 1;
      for (const dot of fallenDots) {
        const floor = height - dot.radius;
        const y = motionQuery.matches ? floor : dot.y;
        paintDot(dot.x, y, dot.radius, dot.alpha * oldOpacity, fills[dot.color]!, fallenContext);
      }
      ctx.globalAlpha = 1;
      fallenContext.globalAlpha = 1;
    }

    function animate(time: number) {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      effectTime += delta;
      advanceFallenDots(delta);
      elapsed += delta * speedMultiplier * rotationDirection(time);
      pointerX += (targetX - pointerX) * 0.035;
      pointerY += (targetY - pointerY) * 0.035;
      draw();
      frameId = requestAnimationFrame(animate);
    }

    function start() {
      cancelAnimationFrame(frameId);
      if (motionQuery.matches) {
        for (const dot of fallenDots) {
          dot.y = height - dot.radius;
          dot.velocityY = 0;
        }
      }
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
        targetDotCount = Math.round(defaultDotCount * slider.valueAsNumber / 100);
        dots.forEach((dot, index) => {
          const target = index < targetDotCount ? 1 : 0;
          if (dot.visibilityTarget === target) return;
          // Reverse an in-progress fade from its current opacity.
          dot.visibilityFrom = dotVisibility(dot, now);
          dot.visibilityTarget = target;
          dot.visibilityStart = now;
        });
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

    if (reverseButton) {
      const button = reverseButton;
      button.closest<HTMLElement>('.field-actions')!.hidden = false;
      button.addEventListener('click', () => {
        const now = performance.now();
        previousDirection = rotationDirection(now);
        targetDirection *= -1;
        directionChangeTime = now;
        button.classList.toggle('is-reversed', targetDirection < 0);
        button.setAttribute('aria-pressed', String(targetDirection < 0));
      });
    }

    if (dropButton) {
      const button = dropButton;
      button.closest<HTMLElement>('.field-actions')!.hidden = false;
      button.addEventListener('click', () => {
        if (fieldState === 'renewing') return;
        if (fieldState === 'orbit') {
          const now = performance.now();
          fallenDots = dots.map((dot) => {
            const position = orbitPosition(dot);
            return {
              x: position.x,
              y: position.y,
              velocityY: 0,
              radius: dot.radius,
              alpha: dot.alpha * dotVisibility(dot, now),
              color: dot.color,
            };
          }).filter((dot) => dot.alpha > 0 && dot.x + dot.radius >= 0 && dot.x - dot.radius <= width &&
            dot.y + dot.radius >= 0 && dot.y - dot.radius <= height);
          if (motionQuery.matches) {
            for (const dot of fallenDots) {
              dot.y = height - dot.radius;
              dot.velocityY = 0;
            }
          }
          fieldState = 'fallen';
          button.classList.add('is-dropped');
          button.setAttribute('aria-label', 'Create a new dot field');
          button.title = 'Create a new dot field';
        } else {
          generation++;
          createDots();
          renewalStart = effectTime;
          fieldState = 'renewing';
          button.disabled = true;
          button.classList.remove('is-dropped');
          button.setAttribute('aria-label', 'Drop dots');
          button.title = 'Drop dots';
        }
        draw();
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
