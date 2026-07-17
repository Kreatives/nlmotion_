/* ============================================================
   NL MOTION — main.js
   Lenis smooth scroll + rustige GSAP reveals.
   Alles is guarded: valt een CDN weg, dan blijft de site leesbaar.
   ============================================================ */

document.documentElement.classList.add("js");

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  /* ---------- Hero-video: autoplay forceren op mobiel (iOS/Android) ---------- */
  const heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.setAttribute("muted", "");
    heroVideo.playsInline = true;
    const tryPlay = () => {
      const p = heroVideo.play();
      if (p && p.catch) p.catch(() => {});
    };
    tryPlay();
    heroVideo.addEventListener("canplay", tryPlay, { once: true });
    heroVideo.addEventListener("loadeddata", tryPlay, { once: true });
    // Val terug op de eerste interactie als de browser autoplay blokkeert
    ["touchstart", "pointerdown", "scroll"].forEach((ev) =>
      window.addEventListener(ev, tryPlay, { once: true, passive: true })
    );
    // Hervat bij terugkomen naar het tabblad
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });
  }

  /* ---------- Nav: scroll-state + mobiel menu ---------- */
  const nav = document.querySelector("[data-nav]");
  const setNavState = () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  setNavState();
  window.addEventListener("scroll", setNavState, { passive: true });

  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      links.style.display = open ? "flex" : "";
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        links.style.display = "";
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !prefersReduced) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* Interne ankers netjes laten scrollen (met of zonder Lenis) */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -76 });
      else target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Geen GSAP of reduced motion: alles direct tonen ---------- */
  const showAll = () => {
    document.querySelectorAll("[data-reveal], [data-reveal-group] > *").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  };
  if (!hasGsap || prefersReduced) {
    showAll();
    document.querySelectorAll(".method .step").forEach((s) => {
      s.classList.add("is-active");
      s.style.setProperty("--line", "1");
    });
    return;
  }

  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);

  /* Lenis en ScrollTrigger synchroon houden */
  if (lenis && window.ScrollTrigger) {
    lenis.on("scroll", window.ScrollTrigger.update);
  }

  const EASE = "power3.out";

  /* ---------- Hero-titel: woord voor woord, met behoud van spaties ---------- */
  const heroTitle = document.querySelector("[data-split]");
  if (heroTitle && window.SplitText) {
    const split = new window.SplitText(heroTitle, {
      type: "lines,words",
      linesClass: "split-line",
    });
    gsap.set(heroTitle, { opacity: 1 });
    gsap.from(split.words, {
      yPercent: 110,
      opacity: 0,
      duration: 1,
      ease: EASE,
      stagger: 0.045,
      delay: 0.15,
    });
  } else if (heroTitle) {
    gsap.to(heroTitle, { opacity: 1, y: 0, duration: 1, ease: EASE, delay: 0.15 });
    gsap.set(heroTitle, { y: 24 });
  }

  /* ---------- Hero: overige losse elementen ---------- */
  const heroReveals = document.querySelectorAll(".hero [data-reveal]");
  gsap.set(heroReveals, { opacity: 0, y: 24 });
  gsap.to(heroReveals, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: EASE,
    stagger: 0.1,
    delay: 0.45,
  });

  /* ---------- Scroll-reveals: losse elementen ---------- */
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    if (el.closest(".hero")) return;
    gsap.set(el, { opacity: 0, y: 28 });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: EASE,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });

  /* ---------- Scroll-reveals: groepen met stagger ---------- */
  gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
    const items = group.children;
    gsap.set(items, { opacity: 0, y: 28 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: EASE,
      stagger: 0.09,
      scrollTrigger: { trigger: group, start: "top 82%" },
    });
  });

  /* ---------- Methode: tijdlijn-lijn volgt de scroll van bolletje naar bolletje ---------- */
  const methodSteps = document.querySelector(".method__steps");
  if (methodSteps && window.ScrollTrigger) {
    const steps = gsap.utils.toArray(".method .step");
    const n = steps.length;
    if (steps[0]) steps[0].classList.add("is-active");
    window.ScrollTrigger.create({
      trigger: methodSteps,
      start: "top 65%",
      end: "bottom 75%",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress * n;
        steps.forEach((step, i) => {
          const local = Math.max(0, Math.min(1, p - i));
          step.style.setProperty("--line", local.toFixed(3));
          step.classList.toggle("is-active", p >= i);
        });
      },
    });
  }

  /* ---------- FAQ: ScrollTrigger verversen bij open/dicht ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });
})();
