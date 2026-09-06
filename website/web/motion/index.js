/**
 * Entry point for the motion bundle.
 *
 * MADRASA is framework-free ES modules; GSAP and Lenis live behind this one
 * module so they load as a bundle separate from the React islands, and so a
 * clone without `npm install` still renders a fully working · if less animated
 * · site. `web/js/motion.js` is the bridge that loads it.
 *
 *   gsap@3.13.0 + ScrollTrigger + SplitText + CustomEase
 *   lenis@1.1.13
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

/**
 * The same curve as the CSS `--ease-out` token: a CSS `cubic-bezier(a,b,c,d)`
 * is the path `M0,0 C a,b c,d 1,1`. Scripted and CSS motion then agree.
 */
const EASE = CustomEase.create('madrasaOut', 'M0,0 C0.16,1 0.3,1 1,1');

/** Reveals fire a little before the element is fully on screen. */
const START = 'top 92%';

/**
 * Elements that scroll on their own · the facet rail, the react-select menu,
 * the typeahead panel. Lenis has to leave their wheel events alone, or the
 * page scrolls instead of the list.
 */
const NESTED = ['filters', 'rs__menu-list', 'typeahead', 'typeahead__list'];

/**
 * Starts the motion layer.
 *
 * @param {{onNestedScroll?: (node: Element) => boolean}} [options]
 * @returns {object} the API consumed by web/js/motion.js
 */
export function createMotion(options = {}) {
  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    // Touch keeps its native momentum: syncing it costs more than it buys and
    // is the first thing that feels wrong on a phone.
    syncTouch: false,
    autoResize: true,
    prevent: (node) => {
      if (!node || node.nodeType !== 1) return false;
      if (NESTED.some((name) => node.classList.contains(name))) return true;
      return Boolean(options.onNestedScroll?.(node));
    },
  });

  // GSAP drives the loop so tweens and scroll position advance on one clock.
  // lagSmoothing(0) stops GSAP from jumping the playhead after a stall, which
  // would otherwise desynchronise scrubbed tweens from the scroll position.
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const refresh = () => ScrollTrigger.refresh();

  function debounce(fn, wait) {
    let timer;
    return () => { clearTimeout(timer); timer = setTimeout(fn, wait); };
  }

  /* Late-loading images (institution logos) change the page height after the
     triggers are placed, so measurements are refreshed when the body resizes. */
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(debounce(refresh, 150)) : null;
  resizeObserver?.observe(document.body);

  /** SplitText instances for the current page; reverted when it unmounts. */
  let splits = [];

  /* --- Reveal on scroll ---------------------------------------------------
     Pages build their nodes detached and call reveal() before appending, so a
     trigger created here would measure a zero-height element and fire at once.
     Every reveal is therefore queued and its trigger created on the next frame,
     by which point the node is in the document and can be measured. */
  const queue = [];
  let flushHandle = 0;

  function createTrigger(node, delay) {
    ScrollTrigger.create({
      trigger: node,
      start: START,
      once: true,
      onEnter: () => gsap.to(node, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        delay: delay / 1000,
        ease: EASE,
        overwrite: 'auto',
        onComplete: () => gsap.set(node, { clearProps: 'opacity,visibility,transform' }),
      }),
    });
  }

  function flush() {
    flushHandle = 0;
    for (const [node, delay] of queue.splice(0)) {
      // Nodes built and then discarded never reach the document; drop them.
      if (node.isConnected) createTrigger(node, delay);
    }
    refresh();
  }

  /**
   * Reveal-on-scroll for a single node, replacing the CSS-transition version in
   * web/js/dom.js. `data-reveal="in"` is set up front so the element is visible
   * by default and GSAP's inline styles own the hidden state · if a tween never
   * runs, nothing is stranded at opacity 0.
   */
  function reveal(node, delay = 0) {
    node.dataset.reveal = 'in';
    gsap.set(node, { autoAlpha: 0, y: 16 });
    queue.push([node, delay]);
    if (!flushHandle) flushHandle = requestAnimationFrame(flush);
  }

  /* --- Headings ----------------------------------------------------------- */

  /**
   * Line-mask reveal for a heading. `autoSplit` re-splits after a font swap or
   * a resize, which is the only way the line boxes stay correct; returning the
   * tween from onSplit lets GSAP clean it up across those re-splits.
   */
  function splitHeading(node, { chars = false, delay = 0 } = {}) {
    if (!node) return;
    splits.push(SplitText.create(node, {
      type: chars ? 'chars,words,lines' : 'lines',
      mask: 'lines',
      // A single-token class: GSAP derives the mask class by suffixing every
      // word, so `split-line` would become `split-mask-line-mask`.
      linesClass: 'splitline',
      aria: 'auto',
      autoSplit: true,
      onSplit: (self) => (chars
        ? gsap.from(self.chars, {
            yPercent: 60,
            autoAlpha: 0,
            duration: 0.8,
            delay,
            ease: EASE,
            stagger: { each: 0.016, from: 'random' },
          })
        : gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.9,
            delay,
            ease: EASE,
            stagger: 0.08,
          })),
    }));
  }

  /** Counts a stat up to the number already present in the markup. */
  function countUp(node) {
    const target = Number(node.textContent.trim());
    if (!Number.isFinite(target) || target <= 0) return;
    const state = { value: 0 };
    ScrollTrigger.create({
      trigger: node,
      start: START,
      once: true,
      onEnter: () => gsap.to(state, {
        value: target,
        duration: 1.1,
        ease: 'power1.out',
        onUpdate: () => { node.textContent = String(Math.round(state.value)); },
        onComplete: () => { node.textContent = String(target); },
      }),
    });
  }

  /**
   * Hero exit: the decoration drifts slower than the page while the content
   * lifts and fades. The pattern is already inset -12% and 120% tall and the
   * watermark is clipped by design, so both have room to move.
   */
  function heroParallax(hero) {
    const scrollTrigger = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 };
    const pattern = hero.querySelector('.hero__pattern');
    const watermark = hero.querySelector('.hero__watermark');

    if (pattern) gsap.to(pattern, { yPercent: 8, ease: 'none', scrollTrigger });
    if (watermark) {
      // The watermark is centred with `transform: translateY(-58%)`; GSAP has
      // to own that offset, or the first tween drops it to the baseline.
      gsap.set(watermark, { yPercent: -58, y: 0 });
      gsap.to(watermark, { y: 60, ease: 'none', scrollTrigger });
    }
    // Keep interactive content opaque and stationary. Fading its ancestor also
    // fades the search dropdown, exposing the following section through it.
  }

  /* --- Page lifecycle ----------------------------------------------------- */

  /** Runs once per rendered page, after its nodes are in the document. */
  function enter(root) {
    const hero = root.querySelector('.hero');
    if (hero) {
      splitHeading(hero.querySelector('.hero__title'), { chars: true, delay: 0.1 });
      heroParallax(hero);
    } else {
      splitHeading(root.querySelector('h1'));
    }
    root.querySelectorAll('.stat__n').forEach(countUp);
    refresh();
  }

  /**
   * Runs before a page is torn down. The queue is deliberately left alone: the
   * incoming page has already filled it (pages build and reveal their nodes
   * before they are mounted), and flush() drops anything that never made it
   * into the document.
   */
  function leave() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    splits.forEach((split) => split.revert());
    splits = [];
  }

  function scrollTo(target, { immediate = false, offset = 0 } = {}) {
    lenis.scrollTo(target, { immediate, offset, force: true });
  }

  function destroy() {
    leave();
    resizeObserver?.disconnect();
    if (flushHandle) cancelAnimationFrame(flushHandle);
    gsap.ticker.remove(tick);
    lenis.destroy();
  }

  return { lenis, reveal, enter, leave, scrollTo, refresh, destroy };
}
