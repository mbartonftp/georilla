/* Fit the game to the visible screen, keyboard open or closed.

   The app is a fixed, full-height column (see "app shell" in style.css), so the page itself never scrolls.
   Its height comes from the visual viewport, which is the part of the page the player can actually see.
   On iPhone that shrinks when the on-screen keyboard opens (window.innerHeight doesn't), so tracking it
   keeps the prompt, answer box, Go button and suggestions above the keyboard; the globe shrinks to make room.
   While the keyboard is up, body gets the "kbd" class and the layout compacts further. */

const KEYBOARD_MIN = 120; // px the visible height must drop by before we call it a keyboard

export function isTyping(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return !el.readOnly && !["button", "submit", "checkbox", "radio", "range", "reset"].includes(el.type);
  return el.isContentEditable;
}

/** Whether the on-screen keyboard is (very likely) covering part of the page. */
export function keyboardOpen(visibleH: number, fullH: number, focused: Element | null): boolean {
  return isTyping(focused) && fullH - visibleH > KEYBOARD_MIN;
}

export function fitToViewport(doc: Document = document): void {
  const win = doc.defaultView!;
  const root = doc.documentElement, body = doc.body;
  let fullH = win.innerHeight;

  const apply = (): void => {
    const vv = win.visualViewport;
    const h = vv ? vv.height : win.innerHeight;
    // the largest height seen at this width is the keyboard-closed height (innerHeight can lag on iOS)
    fullH = Math.max(win.innerHeight, h);
    const kbd = keyboardOpen(h, fullH, doc.activeElement);
    root.style.setProperty("--app-h", `${Math.round(h)}px`);
    // iOS may still pan the visual viewport when an input is focused; follow it so the app stays in view
    root.style.setProperty("--app-top", `${Math.round(vv ? Math.max(0, vv.offsetTop) : 0)}px`);
    body.classList.toggle("kbd", kbd);
  };

  let raf = 0;
  const schedule = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
  win.visualViewport?.addEventListener("resize", schedule);
  win.visualViewport?.addEventListener("scroll", schedule);
  win.addEventListener("resize", schedule);
  win.addEventListener("orientationchange", () => { fullH = 0; schedule(); });
  // focus changes come before the keyboard animates; check again once it has settled
  const onFocus = (): void => { schedule(); setTimeout(schedule, 350); };
  doc.addEventListener("focusin", onFocus);
  doc.addEventListener("focusout", onFocus);
  // the page can't scroll, but iOS sometimes scrolls the window to "reveal" a focused input; undo that
  win.addEventListener("scroll", () => { if (win.scrollY !== 0) win.scrollTo(0, 0); }, { passive: true });
  apply();

  // the globe and map canvases size themselves on window resize; tell them when the globe's box changes
  const wrap = doc.getElementById("globewrap");
  if (wrap && "ResizeObserver" in win) {
    let last = 0;
    new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w !== last) { last = w; win.dispatchEvent(new Event("resize")); }
    }).observe(wrap);
  }
}
