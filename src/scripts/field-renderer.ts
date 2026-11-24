import type { FieldFrame, RenderedDot } from './particle-field';

// Canvas sizing and painting are isolated from simulation state and page controls.
export function createFieldRenderer(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  fallenCanvas: HTMLCanvasElement | null,
) {
  const fallenContext = fallenCanvas?.getContext('2d') ?? context;
  let width = 0;
  let height = 0;

  function paint(dot: RenderedDot, fills: string[], layer: CanvasRenderingContext2D) {
    if (dot.alpha <= 0 || dot.x < -30 || dot.x > width + 30 || dot.y < -30 || dot.y > height + 30)
      return;
    layer.beginPath();
    layer.fillStyle = fills[dot.color]!;
    layer.globalAlpha = dot.alpha;
    layer.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    layer.fill();
  }

  return {
    resize(nextWidth: number, nextHeight: number, pixelRatio: number) {
      width = nextWidth;
      height = nextHeight;
      const dpr = Math.min(pixelRatio || 1, 2);
      for (const [field, ctx] of [
        [canvas, context],
        [fallenCanvas, fallenContext],
      ] as const) {
        if (!field) continue;
        field.width = Math.round(width * dpr);
        field.height = Math.round(height * dpr);
        field.style.width = `${width}px`;
        field.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    },
    render(frame: FieldFrame) {
      const fills = frame.colors.map((color) => `rgb(${color.join(', ')})`);
      context.clearRect(0, 0, width, height);
      if (fallenContext !== context) fallenContext.clearRect(0, 0, width, height);
      for (const dot of frame.orbit) paint(dot, fills, context);
      for (const dot of frame.fallen) paint(dot, fills, fallenContext);
      for (const dot of frame.bursts) paint(dot, fills, context);
      context.globalAlpha = 1;
      fallenContext.globalAlpha = 1;
    },
  };
}
