// Match the mobile layout breakpoint without reducing the full canvas height.
const mobileLayout = window.matchMedia('(max-width: 720px)');
let interacted = false;
const interactionEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
const noteInteraction = () => { interacted = true; };
for (const event of interactionEvents) {
  window.addEventListener(event, noteInteraction, { passive: true, once: true });
}

function setInitialScroll(restored: boolean) {
  for (const event of interactionEvents) window.removeEventListener(event, noteInteraction);
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  // Reloads intentionally return to the introductory offset. Back/forward
  // navigation keeps browser restoration, and anchor links keep their target.
  const reloading = navigation?.type === 'reload';
  if (restored || navigation?.type === 'back_forward' || location.hash ||
      (!reloading && window.scrollY !== 0) || interacted) return;
  window.scrollTo({ top: mobileLayout.matches ? 145 : 122, left: 0, behavior: 'instant' });
}

if (document.readyState === 'complete') {
  requestAnimationFrame(() => setInitialScroll(false));
} else {
  // Run after the browser's page-show scroll restoration.
  window.addEventListener('pageshow', (event) => {
    requestAnimationFrame(() => setInitialScroll(event.persisted));
  }, { once: true });
}
