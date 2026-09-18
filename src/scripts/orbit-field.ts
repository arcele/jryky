type Dot = {
  angle: number;
  distance: number;
  radius: number;
  alpha: number;
  color: 0 | 1;
  depth: number;
};

const canvas = document.querySelector<HTMLCanvasElement>('.orbit-field');
const hero = document.querySelector<HTMLElement>('.hero');

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
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let colors: [string, string] = readColors();
    let dots: Dot[] = [];

    function readColors() {
      const styles = getComputedStyle(document.documentElement);
      return [
        styles.getPropertyValue('--dot-primary').trim() || '#075985',
        styles.getPropertyValue('--dot-secondary').trim() || '#c9c1bc',
      ] as [string, string];
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
      const count = width < 600 ? 100 : width < 1000 ? 150 : 220;
      const maxDistance = Math.max(width * 0.57, height * 0.8);

      dots = Array.from({ length: count }, (_, index) => {
        const depth = index % 2 === 0 ? 0.55 : 1;
        return {
          angle: random() * Math.PI * 2,
          distance: Math.sqrt(random()) * maxDistance,
          radius: (2.5 + random() * 8) * (0.75 + depth * 0.3),
          alpha: 0.18 + random() * 0.56,
          color: random() > 0.42 ? 0 : 1,
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
      colors = readColors();
      createDots();
      start();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2 + pointerX * 20;
      const centerY = height * 0.43 + pointerY * 12;

      for (const dot of dots) {
        const direction = dot.depth === 1 ? 1 : -1;
        const speed = dot.depth === 1 ? 0.000035 : 0.000018;
        const angle = dot.angle + elapsed * speed * direction;
        const stretch = width < 650 ? 0.82 : 1;
        const x = centerX + Math.cos(angle) * dot.distance * stretch;
        const y = centerY + Math.sin(angle) * dot.distance * 0.56;

        if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;

        ctx.beginPath();
        ctx.fillStyle = colors[dot.color];
        ctx.globalAlpha = dot.alpha;
        ctx.arc(x, y, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function animate(time: number) {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      elapsed += delta;
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

    document.addEventListener('visibilitychange', start);
    motionQuery.addEventListener('change', start);
    colorSchemeQuery.addEventListener('change', () => {
      colors = readColors();
      draw();
    });
    new ResizeObserver(resize).observe(host);

    const themeObserver = new MutationObserver(() => {
      colors = readColors();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}
