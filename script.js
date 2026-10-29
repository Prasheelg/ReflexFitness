// Reflex Fitness - site interactions

// Enquiries open WhatsApp with the details pre-filled. Set the gym's WhatsApp
// number here, country code first, digits only (e.g. "919876543210").
const WHATSAPP_NUMBER = "";
const INSTAGRAM_URL = "https://www.instagram.com/reflex_fitness_/";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const header = $(".site-header");

// ---------- Smooth scrolling (Lenis from CDN; native scroll if it fails) ----------
let lenis = null;
if (window.Lenis && !reducedMotion) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

// In-page links glide to their section and stop below the fixed header
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    const offset = target === 0 ? 0 : -header.offsetHeight + 1;
    if (lenis) {
      lenis.scrollTo(target, { offset });
    } else {
      const y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
    }
    history.replaceState(null, "", id);
  })
);

// ---------- Mobile nav ----------
const toggle = $(".nav-toggle");
const nav = $("#site-nav");
const setNav = (open) => {
  nav.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
toggle.addEventListener("click", () => setNav(!nav.classList.contains("open")));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setNav(false)));

// Plan buttons pre-select the plan in the enquiry form
$$("[data-plan]").forEach((a) =>
  a.addEventListener("click", () => {
    $("#trial-form select[name=interest]").value = a.dataset.plan;
  })
);

// ---------- Scroll-linked effects ----------
const progress = $(".scroll-progress");
const hero = $(".hero");
const heroImg = $(".hero-img");
const heroInner = $(".hero-inner");
const marqueeTrack = $(".marquee-track");
const parallaxImgs = $$("[data-parallax]");
let lastY = window.scrollY;
let velocity = 0;
let marqueeX = 0;

function frame() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  velocity = velocity * 0.85 + (y - lastY) * 0.15;

  header.classList.toggle("scrolled", y > 20);
  if (!nav.classList.contains("open")) header.classList.toggle("tucked", y > 500 && y > lastY + 1);
  lastY = y;

  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  if (!reducedMotion) {
    // Hero: photo drifts slower than the page, text lifts and fades
    if (y < hero.offsetHeight) {
      heroImg.parentElement.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      heroInner.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
      heroInner.style.opacity = String(Math.max(0, 1 - y / (hero.offsetHeight * 0.75)));
    }

    // Marquee runs on its own and speeds up / reverses with scroll direction
    if (marqueeTrack) {
      marqueeX -= 0.6 + velocity * 0.35;
      const half = marqueeTrack.scrollWidth / 2;
      if (marqueeX <= -half) marqueeX += half;
      if (marqueeX > 0) marqueeX -= half;
      marqueeTrack.style.transform = `translate3d(${marqueeX}px, 0, 0)`;
    }

    // Images inside frames drift as they pass through the viewport
    parallaxImgs.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const t = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = `translate3d(0, ${t * -100 * Number(img.dataset.parallax)}%, 0)`;
    });
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Highlight the nav link for the section on screen
const navLinks = $$('.site-nav a[href^="#"]:not(.btn)');
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  navLinks.forEach((a) => {
    const s = $(a.getAttribute("href"));
    if (s) spy.observe(s);
  });
}

// ---------- Intro + scroll reveal ----------
if ("IntersectionObserver" in window && !reducedMotion) {
  $$(".stagger").forEach((group) =>
    [...group.children].forEach((child, i) => child.style.setProperty("--d", `${Math.min(i, 6) * 110}ms`))
  );
  const targets = $$(".reveal, .stagger > *, .photo-reveal");
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("in");
        io.unobserve(el);
        // once revealed, let hover effects use transform without the stagger delay
        if (el.parentElement.classList.contains("stagger")) {
          setTimeout(() => el.classList.add("settled"), 1100 + (parseInt(el.style.getPropertyValue("--d")) || 0));
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  targets.forEach((el) => io.observe(el));

  const start = () => document.body.classList.add("loaded");
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(start));
  setTimeout(start, 1200);
} else {
  document.body.classList.add("loaded", "no-js");
}

// ---------- 3D tilt on program cards ----------
if (canHover && !reducedMotion) {
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${y * -9}deg) rotateY(${x * 11}deg) translateY(-6px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });

  // Glow follows the cursor on team and plan cards
  $$(".glow").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );

  // Main buttons lean toward the cursor
  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
  });
}

// ---------- Gallery: drag to scroll, arrow buttons ----------
const gallery = $(".gallery");
const shots = $$(".shot", gallery);
let dragMoved = false;
{
  let down = false;
  let startX = 0;
  let startScroll = 0;
  gallery.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = true;
    dragMoved = false;
    startX = e.clientX;
    startScroll = gallery.scrollLeft;
  });
  window.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) {
      dragMoved = true;
      gallery.classList.add("dragging");
    }
    gallery.scrollLeft = startScroll - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    gallery.classList.remove("dragging");
  });
}
const step = () => (shots[0] ? shots[0].offsetWidth + 16 : 400);
$$(".gallery-nav .round-btn").forEach((b) =>
  b.addEventListener("click", () => gallery.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: "smooth" }))
);
gallery.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") gallery.scrollBy({ left: step(), behavior: "smooth" });
  if (e.key === "ArrowLeft") gallery.scrollBy({ left: -step(), behavior: "smooth" });
});
// Let a vertical wheel over the gallery keep scrolling the page
gallery.setAttribute("data-lenis-prevent-touch", "");

// ---------- Lightbox ----------
const lb = $("#lightbox");
const lbImg = $("img", lb);
const lbCap = $("figcaption", lb);
let lbIndex = 0;
let lastFocus = null;

function showShot(i) {
  lbIndex = (i + shots.length) % shots.length;
  const img = $("img", shots[lbIndex]);
  lbImg.classList.remove("ready");
  lbImg.onload = () => requestAnimationFrame(() => lbImg.classList.add("ready"));
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  if (lbImg.complete) requestAnimationFrame(() => lbImg.classList.add("ready"));
  lbCap.textContent = `${img.alt}  ·  ${lbIndex + 1} / ${shots.length}`;
}
function openLightbox(i) {
  lastFocus = document.activeElement;
  lb.hidden = false;
  document.body.classList.add("lb-open");
  if (lenis) lenis.stop();
  showShot(i);
  requestAnimationFrame(() => lb.classList.add("open"));
  $(".lb-close", lb).focus();
}
function closeLightbox() {
  lb.classList.remove("open");
  document.body.classList.remove("lb-open");
  if (lenis) lenis.start();
  setTimeout(() => (lb.hidden = true), 350);
  if (lastFocus) lastFocus.focus();
}
shots.forEach((s, i) => {
  s.tabIndex = 0;
  s.setAttribute("role", "button");
  s.addEventListener("click", () => {
    if (!dragMoved) openLightbox(i);
  });
  s.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(i);
    }
  });
});
$(".lb-close", lb).addEventListener("click", closeLightbox);
$(".lb-prev", lb).addEventListener("click", () => showShot(lbIndex - 1));
$(".lb-next", lb).addEventListener("click", () => showShot(lbIndex + 1));
lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") showShot(lbIndex + 1);
  if (e.key === "ArrowLeft") showShot(lbIndex - 1);
});
// Swipe between photos on touch screens
{
  let sx = null;
  lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) showShot(lbIndex + (dx < 0 ? 1 : -1));
    sx = null;
  });
}

// ---------- FAQ: smooth open / close ----------
$$(".faq details").forEach((d) => {
  const summary = $("summary", d);
  const body = $(".faq-body", d);
  summary.addEventListener("click", (e) => {
    if (reducedMotion || !body.animate) return;
    e.preventDefault();
    if (d.open) {
      const anim = body.animate({ height: [`${body.offsetHeight}px`, "0px"], opacity: [1, 0] }, { duration: 350, easing: "ease-in-out" });
      anim.onfinish = () => (d.open = false);
    } else {
      d.open = true;
      body.animate({ height: ["0px", `${body.offsetHeight}px`], opacity: [0, 1] }, { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" });
    }
  });
});

// ---------- Enquiry form ----------
const form = $("#trial-form");
const status = $("#form-status");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  status.className = "form-status";

  let valid = true;
  $$("[required]", form).forEach((field) => {
    const ok = field.value.trim() !== "" && field.checkValidity();
    field.classList.remove("invalid");
    if (!ok) {
      void field.offsetWidth; // restart the shake animation
      field.classList.add("invalid");
      valid = false;
    }
  });
  if (!valid) {
    status.textContent = "Please fill in your name and phone number.";
    status.classList.add("err");
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  const text = [
    "Hi Reflex Fitness, I'd like to know more about membership.",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Interested in: ${data.interest}`,
    data.message ? `Goals: ${data.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (WHATSAPP_NUMBER) {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    status.textContent = "Opening WhatsApp to send your enquiry...";
    status.classList.add("ok");
  } else {
    window.open(INSTAGRAM_URL, "_blank", "noopener");
    status.textContent = "Thanks! Send us a DM on Instagram (@reflex_fitness_) and we'll get back to you.";
    status.classList.add("ok");
  }
});

// ---------- Footer year ----------
$("#year").textContent = new Date().getFullYear();
