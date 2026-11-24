type RGB = [number, number, number];
export type FieldColors = [RGB, RGB, RGB];
type FieldPhase = 'orbit' | 'fallen' | 'popping' | 'popped' | 'renewing';

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

export type RenderedDot = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: Dot['color'];
};

type FallenDot = RenderedDot & { velocityY: number };

export type FieldFrame = {
  colors: FieldColors;
  orbit: RenderedDot[];
  fallen: RenderedDot[];
  bursts: RenderedDot[];
};

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

// State and simulation use explicit time/settings, independently of browser controls.
// All time and delta arguments are measured in milliseconds.
export class ParticleField {
  private width = 0;
  private height = 0;
  private elapsed = 0;
  private effectTime = 0;
  private pointerX = 0;
  private pointerY = 0;
  private targetX = 0;
  private targetY = 0;
  private speedMultiplier: number;
  private previousDirection = 1;
  private targetDirection = 1;
  private directionChangeTime = -Infinity;
  private fromColors: FieldColors;
  private targetColors: FieldColors;
  private colorChangeTime = -Infinity;
  private readonly colorDuration = 800;
  private readonly fadeOutDuration = 1500;
  private readonly fadeInDuration = 750;
  private dots: Dot[] = [];
  private fallenDots: FallenDot[] = [];
  private readonly random = seededRandom(20140925);
  private createdDotCount = 0;
  private phaseValue: FieldPhase = 'orbit';
  private renewalStart = 0;
  private renewalDelay = this.fadeOutDuration;
  private popStart = 0;
  private poppedDots: RenderedDot[] = [];
  private readonly popDuration = 720;
  private densityPercent: number;
  private reducedMotion: boolean;

  constructor(options: {
    colors: FieldColors;
    density: number;
    speed: number;
    reducedMotion: boolean;
  }) {
    this.fromColors = options.colors;
    this.targetColors = options.colors;
    this.densityPercent = options.density;
    this.speedMultiplier = 3 ** ((options.speed - 100) / 100);
    this.reducedMotion = options.reducedMotion;
  }

  get phase() {
    return this.phaseValue;
  }

  get speed() {
    return this.speedMultiplier;
  }

  get reversed() {
    return this.targetDirection < 0;
  }

  resize(width: number, height: number) {
    if (this.width && this.height) {
      for (const dot of this.fallenDots) {
        dot.x *= width / this.width;
        dot.y = Math.min(height - dot.radius, (dot.y * height) / this.height);
      }
    }
    this.width = width;
    this.height = height;
    this.createDots();
  }

  setPointer(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  setSpeed(percent: number) {
    this.speedMultiplier = 3 ** ((percent - 100) / 100);
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    if (value) {
      for (const dot of this.fallenDots) {
        dot.y = this.height - dot.radius;
        dot.velocityY = 0;
      }
    }
  }

  setColors(colors: FieldColors, time: number) {
    this.fromColors = this.interpolateColors(time);
    this.targetColors = colors;
    this.colorChangeTime = time;
  }

  setDensity(percent: number, time: number) {
    this.densityPercent = percent;
    const count = this.targetDotCount();
    const activeDots = this.dots.filter((dot) => dot.visibilityTarget === 1);
    if (activeDots.length > count) {
      for (const dot of activeDots.slice(count)) {
        dot.visibilityFrom = this.dotVisibility(dot, time);
        dot.visibilityTarget = 0;
        dot.visibilityStart = time;
      }
    } else {
      for (let index = activeDots.length; index < count; index++) {
        this.dots.push(this.createDot(false, time));
      }
    }
  }

  reverse(time: number) {
    this.previousDirection = this.rotationDirection(time);
    this.targetDirection *= -1;
    this.directionChangeTime = time;
  }

  dropOrRenew(time: number) {
    if (this.phaseValue !== 'orbit' && this.phaseValue !== 'fallen') return;
    if (this.phaseValue === 'orbit') {
      this.fallenDots = this.frame(time)
        .orbit.filter(
          (dot) =>
            dot.x + dot.radius >= 0 &&
            dot.x - dot.radius <= this.width &&
            dot.y + dot.radius >= 0 &&
            dot.y - dot.radius <= this.height,
        )
        .map((dot) => ({
          ...dot,
          y: this.reducedMotion ? this.height - dot.radius : dot.y,
          velocityY: 0,
        }));
      this.phaseValue = 'fallen';
    } else {
      this.renew(this.fadeOutDuration);
    }
  }

  popOrRenew(time: number) {
    if (this.phaseValue === 'popped') {
      this.renew(0);
    } else if (this.phaseValue === 'orbit') {
      this.poppedDots = this.frame(time).orbit;
      this.dots = [];
      this.popStart = this.effectTime;
      this.phaseValue = this.reducedMotion ? 'popped' : 'popping';
      if (this.reducedMotion) this.poppedDots = [];
    }
  }

  private renew(delay: number) {
    this.createDots();
    this.renewalStart = this.effectTime;
    this.renewalDelay = delay;
    this.phaseValue = 'renewing';
  }

  advance(delta: number, time: number) {
    this.effectTime += delta;
    this.advanceFallenDots(delta);
    this.elapsed += delta * this.speedMultiplier * this.rotationDirection(time);
    this.pointerX += (this.targetX - this.pointerX) * 0.035;
    this.pointerY += (this.targetY - this.pointerY) * 0.035;
  }

  update(time: number) {
    if (
      this.phaseValue === 'popping' &&
      (this.reducedMotion || this.effectTime - this.popStart >= this.popDuration)
    ) {
      this.poppedDots = [];
      this.phaseValue = 'popped';
    }
    this.dots = this.dots.filter(
      (dot) => dot.visibilityTarget !== 0 || this.dotVisibility(dot, time) > 0,
    );
    if (this.phaseValue === 'renewing' && this.renewalProgress().fadeIn >= 1) {
      this.fallenDots = [];
      this.phaseValue = 'orbit';
    }
  }

  // Sampling a frame never advances physics, removes particles, or changes phase.
  frame(time: number): FieldFrame {
    const { fadeIn, fadeOut } = this.renewalProgress();
    const orbit: RenderedDot[] = [];
    if (this.phaseValue === 'orbit' || this.phaseValue === 'renewing') {
      const opacity = this.phaseValue === 'renewing' ? fadeIn : 1;
      for (const dot of this.dots) {
        const alpha = dot.alpha * this.dotVisibility(dot, time) * opacity;
        if (alpha <= 0) continue;
        orbit.push({ ...this.orbitPosition(dot), radius: dot.radius, alpha, color: dot.color });
      }
    }
    const oldOpacity = this.phaseValue === 'renewing' ? 1 - fadeOut : 1;
    const fallen = this.fallenDots.map((dot) => ({
      x: dot.x,
      y: this.reducedMotion ? this.height - dot.radius : dot.y,
      radius: dot.radius,
      alpha: dot.alpha * oldOpacity,
      color: dot.color,
    }));
    return { colors: this.interpolateColors(time), orbit, fallen, bursts: this.popFragments() };
  }

  private popFragments(): RenderedDot[] {
    if (this.phaseValue !== 'popping' || this.reducedMotion) return [];
    const age = this.effectTime - this.popStart;
    return this.poppedDots.flatMap((dot, index) => {
      // A short stagger and inflation make each bubble rupture rather than vanish.
      const localAge = age - (index % 7) * 20;
      if (localAge < 80) {
        return [{ ...dot, radius: dot.radius * (1 + Math.max(0, localAge) / 400) }];
      }
      const progress = Math.min(1, (localAge - 80) / 520);
      if (progress >= 1) return [];
      return Array.from({ length: 7 }, (_, fragment) => {
        const angle = (fragment / 7) * Math.PI * 2 + index;
        const distance = dot.radius * (1 + 4 * (1 - (1 - progress) ** 2));
        return {
          x: dot.x + Math.cos(angle) * distance,
          y: dot.y + Math.sin(angle) * distance + progress * progress * 12,
          radius: dot.radius * 0.22 * (1 - progress),
          alpha: dot.alpha * (1 - progress),
          color: dot.color,
        };
      });
    });
  }

  private targetDotCount() {
    const baseline = this.width < 600 ? 100 : this.width < 1000 ? 150 : 220;
    return Math.round((baseline * this.densityPercent) / 100);
  }

  private createDot(visible: boolean, time: number): Dot {
    const depth = this.createdDotCount++ % 2 === 0 ? 0.55 : 1;
    const maxDistance = Math.max(this.width * 0.57, this.height * 0.8);
    return {
      angle: this.random() * Math.PI * 2,
      distance: Math.sqrt(this.random()) * maxDistance,
      radius: (2.5 + this.random() * 8) * (0.75 + depth * 0.3),
      alpha: 0.18 + this.random() * 0.56,
      color: Math.floor(this.random() * 3) as Dot['color'],
      depth,
      visibilityFrom: visible ? 1 : 0,
      visibilityTarget: 1,
      visibilityStart: time,
    };
  }

  private createDots() {
    this.dots = Array.from({ length: this.targetDotCount() }, () =>
      this.createDot(true, -Infinity),
    );
  }

  private dotVisibility(dot: Dot, time: number) {
    if (this.reducedMotion) return dot.visibilityTarget;
    const duration =
      dot.visibilityTarget > dot.visibilityFrom ? this.fadeInDuration : this.fadeOutDuration;
    const progress = Math.min(1, (time - dot.visibilityStart) / duration);
    return dot.visibilityFrom + (dot.visibilityTarget - dot.visibilityFrom) * progress;
  }

  private rotationDirection(time: number) {
    const progress = Math.min(1, (time - this.directionChangeTime) / 1000);
    const eased = (1 - Math.cos(progress * Math.PI)) / 2;
    return this.previousDirection + (this.targetDirection - this.previousDirection) * eased;
  }

  private interpolateColors(time: number): FieldColors {
    const progress = this.reducedMotion
      ? 1
      : Math.min(1, (time - this.colorChangeTime) / this.colorDuration);
    const eased = progress * progress * (3 - 2 * progress);
    return this.targetColors.map(
      (target, index) =>
        target.map(
          (channel, component) =>
            this.fromColors[index]![component]! +
            (channel - this.fromColors[index]![component]!) * eased,
        ) as RGB,
    ) as FieldColors;
  }

  private renewalProgress() {
    const age = this.reducedMotion ? Infinity : this.effectTime - this.renewalStart;
    return {
      fadeOut: Math.min(1, age / this.fadeOutDuration),
      fadeIn: Math.max(0, Math.min(1, (age - this.renewalDelay) / this.fadeInDuration)),
    };
  }

  private orbitPosition(dot: Dot) {
    const direction = dot.depth === 1 ? 1 : -1;
    const speed = dot.depth === 1 ? 0.000035 : 0.000018;
    const angle = dot.angle + this.elapsed * speed * direction;
    const stretch = this.width < 650 ? 0.82 : 1;
    return {
      x: this.width / 2 + this.pointerX * 20 + Math.cos(angle) * dot.distance * stretch,
      y: this.height * 0.43 + this.pointerY * 12 + Math.sin(angle) * dot.distance * 0.56,
    };
  }

  private advanceFallenDots(delta: number) {
    if (delta <= 0) return;
    const steps = Math.ceil(delta / 8);
    const step = delta / steps;
    for (const dot of this.fallenDots) {
      const floor = this.height - dot.radius;
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
}
