(() => {
  'use strict';

  /*
   * Browser / Android system Back integration for the single-page exam site.
   *
   * The site historically changes screens by replacing DOM content, so the
   * browser sees every catalog level as the same URL.  On a phone, pressing
   * the system Back button therefore leaves the site instead of returning to
   * the previous catalog level.
   *
   * This module adds one History API entry for each forward in-app navigation.
   * A browser/system Back then reuses the page's own visible Back button, so
   * existing catalog/exam return logic remains the single source of truth.
   * The on-page Back buttons are also routed through history.back(), keeping
   * browser history and UI history synchronized.
   */

  const SESSION_KEY = `exam-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let depth = 0;
  let suppressNavigationCapture = false;

  const FORWARD_SELECTOR = '.catalog-card:not([disabled]), .difficulty:not([disabled])';
  const BACK_SELECTOR = '#backBtn, .catalog-back, #chapterBackBtn';

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return !el.closest('.hidden');
  }

  function routeDescriptor(el) {
    if (!el) return null;
    if (el.id) return { type: 'id', value: el.id };

    const dataAttrs = [
      'data-subject',
      'data-chinese-semester',
      'data-chinese-lesson',
      'data-semester',
      'data-science-unit',
      'data-science-section'
    ];

    for (const attr of dataAttrs) {
      const value = el.getAttribute(attr);
      if (value) return { type: 'attr', attr, value };
    }

    if (el.classList.contains('difficulty')) {
      for (const value of ['easy', 'medium', 'hard']) {
        if (el.classList.contains(value)) return { type: 'difficulty', value };
      }
    }

    // Last-resort fallback for future catalog cards that do not yet have an id.
    const strong = el.querySelector('strong')?.textContent?.trim();
    if (strong) return { type: 'label', value: strong };
    return null;
  }

  function findRouteElement(route) {
    if (!route) return null;

    if (route.type === 'id') return document.getElementById(route.value);

    if (route.type === 'attr') {
      const escaped = window.CSS?.escape ? CSS.escape(route.value) : route.value.replace(/"/g, '\\"');
      return document.querySelector(`[${route.attr}="${escaped}"]`);
    }

    if (route.type === 'difficulty') {
      return document.querySelector(`.difficulty.${route.value}:not([disabled])`);
    }

    if (route.type === 'label') {
      return [...document.querySelectorAll('.catalog-card:not([disabled])')]
        .find(el => el.querySelector('strong')?.textContent?.trim() === route.value) || null;
    }

    return null;
  }

  function currentBackButton() {
    const examScreen = document.getElementById('examScreen');
    const examBack = document.getElementById('backBtn');
    if (examScreen && !examScreen.classList.contains('hidden') && isVisible(examBack)) return examBack;

    const catalogBack = [...document.querySelectorAll('#catalogContent .catalog-back')]
      .find(isVisible);
    if (catalogBack) return catalogBack;

    const chapterBack = document.getElementById('chapterBackBtn');
    if (isVisible(chapterBack)) return chapterBack;

    return null;
  }

  function clickWithoutHistoryCapture(el) {
    if (!el) return false;
    suppressNavigationCapture = true;
    try {
      el.click();
      return true;
    } finally {
      // Keep suppression through the current synchronous event dispatch only.
      queueMicrotask(() => { suppressNavigationCapture = false; });
    }
  }

  function performUiBackOneLevel() {
    const button = currentBackButton();
    if (!button) return false;
    return clickWithoutHistoryCapture(button);
  }

  function performUiForwardOneLevel(route) {
    const el = findRouteElement(route);
    if (!el || !isVisible(el) || el.disabled) return false;
    return clickWithoutHistoryCapture(el);
  }

  function installRootState() {
    // A fresh page load always starts at the subject menu.  Give that visible
    // root screen depth 0 without changing the URL.
    history.replaceState({
      ...(history.state || {}),
      examApp: true,
      examSession: SESSION_KEY,
      depth: 0,
      route: null
    }, '', location.href);
    depth = 0;
  }

  document.addEventListener('click', event => {
    if (suppressNavigationCapture) return;

    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const backButton = target.closest(BACK_SELECTOR);
    if (backButton && isVisible(backButton)) {
      if (depth > 0) {
        // Do not let the button run its callback directly.  Move browser
        // history first; popstate will then call the exact same button once.
        event.preventDefault();
        event.stopImmediatePropagation();
        history.back();
      }
      return;
    }

    const forward = target.closest(FORWARD_SELECTOR);
    if (!forward || !isVisible(forward) || forward.disabled) return;

    const route = routeDescriptor(forward);
    if (!route) return;

    const nextDepth = depth + 1;
    history.pushState({
      examApp: true,
      examSession: SESSION_KEY,
      depth: nextDepth,
      route
    }, '', location.href);
    depth = nextDepth;
  }, true);

  window.addEventListener('popstate', event => {
    const state = event.state;

    // A state from another document load/session is not ours to manage.
    if (!state || state.examApp !== true || state.examSession !== SESSION_KEY) return;

    const targetDepth = Number.isInteger(state.depth) ? state.depth : 0;

    if (targetDepth < depth) {
      // Android/browser Back. Normally this is exactly one level.  The loop
      // also handles history.go(-N) reasonably for synchronous catalog views.
      const steps = depth - targetDepth;
      for (let i = 0; i < steps; i++) {
        if (!performUiBackOneLevel()) break;
      }
      depth = targetDepth;
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    if (targetDepth > depth) {
      // Browser Forward support. A normal Forward is one level and can replay
      // the same card/button that originally opened the next view.
      if (performUiForwardOneLevel(state.route)) {
        depth = targetDepth;
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  });

  installRootState();
})();
