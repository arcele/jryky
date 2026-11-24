import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, Script } from 'node:vm';
import ts from 'typescript';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const compiledScripts = new Map();

class Element extends EventTarget {
  constructor(document, parent = null) {
    super();
    this.document = document;
    this.parent = parent;
    this.hidden = true;
    this.disabled = false;
    this.attributes = new Map();
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, enabled = !classes.has(name)) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    };
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  closest() {
    return this.parent;
  }

  contains(target) {
    for (let node = target; node; node = node.parent) {
      if (node === this) return true;
    }
    return false;
  }

  focus() {
    this.document.activeElement = this;
  }

  click() {
    if (this.disabled) return;
    this.focus();
    this.dispatchEvent(new Event('click'));
  }
}

class Input extends Element {
  constructor(document, parent, { min = '', max = '', step = '1', value = '100' } = {}) {
    super(document, parent);
    Object.assign(this, { min, max, step, value, defaultValue: value });
  }

  get valueAsNumber() {
    return Number(this.value);
  }
}

function canvas(document) {
  const element = new Element(document);
  const context = {
    dots: [],
    globalAlpha: 1,
    fillStyle: '',
    setTransform() {},
    clearRect() {
      this.dots = [];
    },
    beginPath() {},
    arc(x, y, radius) {
      this.pendingDot = { x, y, radius };
    },
    fill() {
      this.dots.push({ ...this.pendingDot, alpha: this.globalAlpha, color: this.fillStyle });
    },
  };
  element.style = {};
  element.getContext = () => context;
  return { element, context };
}

// This fixture models the browser interfaces the page uses, not CSS/layout or native color UI.
// Production modules run unchanged. Tests observe controls and rendered circles only.
export function createPage({
  saved = new Map(),
  storageBlocked = false,
  reducedMotion = false,
  dark = false,
  width = 599,
  height = 450,
  navigation = 'navigate',
  hash = '',
  scrollY = 0,
  readyState = 'complete',
} = {}) {
  let now = 0;
  let nextFrameId = 0;
  const frames = new Map();
  const mutationObservers = [];
  const resizeCallbacks = [];
  const mutations = new Set();
  const modules = new Map();
  const document = new EventTarget();
  Object.assign(document, { hidden: false, readyState, activeElement: null });

  const root = new Element(document);
  const properties = new Map();
  root.style = {
    setProperty: (name, value) => properties.set(name, value),
    getPropertyValue: (name) => properties.get(name) ?? '',
  };
  root.dataset = new Proxy(
    {},
    {
      set(target, key, value) {
        target[key] = value;
        mutations.add('data-' + key);
        return true;
      },
    },
  );
  document.documentElement = root;

  const themeContainer = new Element(document);
  const densityContainer = new Element(document);
  const speedContainer = new Element(document);
  const actions = new Element(document);
  const panel = new Element(document);
  const theme = new Input(document, themeContainer, { min: '0', value: '0' });
  const density = new Input(document, densityContainer, { min: '50', max: '150' });
  const speed = new Input(document, speedContainer, { min: '0', max: '200' });
  const reverse = new Element(document, actions);
  const drop = new Element(document, actions);
  const pop = new Element(document, actions);
  const apply = new Element(document, panel);
  const cancel = new Element(document, panel);
  const swatches = ['#7c3aed', '#db2777', '#f3a9cc'].map(
    (value) => new Input(document, panel, { value }),
  );
  panel.querySelectorAll = () => swatches;
  panel.querySelector = (selector) =>
    ({ '[data-custom-apply]': apply, '[data-custom-cancel]': cancel })[selector] ?? null;

  const orbit = canvas(document);
  const fallen = canvas(document);
  const hero = new Element(document);
  hero.getBoundingClientRect = () => ({ width, height, top: 0, left: 0 });
  const selectors = {
    '.hero': hero,
    '.orbit-field': orbit.element,
    '.fallen-field': fallen.element,
    '.custom-theme-panel': panel,
    '#bubble-palette': theme,
    '#dot-density': density,
    '#dot-speed': speed,
    '#reverse-dots': reverse,
    '#drop-dots': drop,
    '#pop-dots': pop,
  };
  document.querySelector = (selector) => selectors[selector] ?? null;

  const motion = new EventTarget();
  motion.matches = reducedMotion;
  const scheme = new EventTarget();
  scheme.matches = dark;
  const window = new EventTarget();
  const scrolls = [];
  Object.assign(window, {
    devicePixelRatio: 1,
    scrollY,
    matchMedia(query) {
      if (query.includes('reduced-motion')) return motion;
      if (query.includes('color-scheme')) return scheme;
      return { matches: width <= 720 };
    },
    scrollTo(value) {
      window.scrollY = value.top;
      scrolls.push(value.top);
    },
  });

  const context = createContext({
    console,
    window,
    document,
    Node: Element,
    location: { hash },
    performance: {
      now: () => now,
      getEntriesByType: () => [{ type: navigation }],
    },
    localStorage: {
      getItem(key) {
        if (storageBlocked) throw new Error('Storage unavailable');
        return saved.get(key) ?? null;
      },
      setItem(key, value) {
        if (storageBlocked) throw new Error('Storage unavailable');
        saved.set(key, String(value));
      },
    },
    requestAnimationFrame(callback) {
      frames.set(++nextFrameId, callback);
      return nextFrameId;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        resizeCallbacks.push(this.callback);
        this.callback();
      }
    },
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(_target, options) {
        mutationObservers.push({ callback: this.callback, ...options });
      }
    },
  });

  function loadModule(file) {
    const path = resolve(projectRoot, 'src/scripts', file);
    if (modules.has(path)) return modules.get(path).exports;
    if (!compiledScripts.has(path)) {
      const source = readFileSync(path, 'utf8');
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      });
      compiledScripts.set(
        path,
        new Script('(function(require, module, exports) {' + outputText + '\n})', {
          filename: path,
        }),
      );
    }
    const module = { exports: {} };
    modules.set(path, module);
    const require = (specifier) => {
      assert.ok(specifier.startsWith('./'), 'Fixture only loads local page modules');
      return loadModule(resolve(dirname(path), specifier + '.ts'));
    };
    compiledScripts.get(path).runInContext(context)(require, module, module.exports);
    return module.exports;
  }

  function flushMutations() {
    const changed = new Set(mutations);
    mutations.clear();
    for (const observer of mutationObservers) {
      if (observer.attributeFilter.some((attribute) => changed.has(attribute))) observer.callback();
    }
  }

  function frame(milliseconds = 0) {
    now += milliseconds;
    flushMutations();
    const callbacks = [...frames.values()];
    frames.clear();
    for (const callback of callbacks) callback(now);
  }

  function advance(milliseconds) {
    while (milliseconds > 0) {
      const step = Math.min(16, milliseconds);
      frame(step);
      milliseconds -= step;
    }
  }

  loadModule('initial-scroll.ts');
  loadModule('palette-selector.ts');
  loadModule('orbit-field.ts');
  frame();

  return {
    theme,
    density,
    speed,
    reverse,
    drop,
    pop,
    panel,
    swatches,
    apply,
    cancel,
    root,
    scrolls,
    saved,
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    frame,
    advance,
    orbitDots: () => orbit.context.dots,
    fallenDots: () => fallen.context.dots,
    pendingFrames: () => frames.size,
    setSlider(input, value, commit = true) {
      input.value = String(value);
      input.focus();
      input.dispatchEvent(new Event('input'));
      if (commit) input.dispatchEvent(new Event('change'));
      flushMutations();
    },
    selectTheme(id) {
      const index = loadModule('palettes.ts').palettes.findIndex((palette) => palette.id === id);
      assert.ok(index >= 0, 'Requested palette must exist');
      this.setSlider(theme, index);
    },
    resize(newWidth, newHeight) {
      width = newWidth;
      height = newHeight;
      for (const callback of resizeCallbacks) callback();
      frame();
    },
    setDark(value) {
      scheme.matches = value;
      scheme.dispatchEvent(new Event('change'));
    },
    setReducedMotion(value) {
      motion.matches = value;
      motion.dispatchEvent(new Event('change'));
    },
    setHidden(value) {
      document.hidden = value;
      document.dispatchEvent(new Event('visibilitychange'));
    },
    interact() {
      window.dispatchEvent(new Event('wheel'));
    },
    pageShow(persisted = false) {
      const event = new Event('pageshow');
      Object.defineProperty(event, 'persisted', { value: persisted });
      window.dispatchEvent(event);
      frame();
    },
    escape() {
      const event = new Event('keydown', { cancelable: true });
      Object.defineProperty(event, 'key', { value: 'Escape' });
      panel.dispatchEvent(event);
    },
  };
}
