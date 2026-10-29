// Reflex Fitness - site interactions (no dependencies)

// Enquiries open WhatsApp with the details pre-filled. Set the gym's WhatsApp
// number here, country code first, digits only (e.g. "919876543210").
const WHATSAPP_NUMBER = "";
const INSTAGRAM_URL = "https://www.instagram.com/reflex_fitness_/";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- Header: solid background after scrolling ----------
const header = $(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

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

// ---------- Scroll reveal ----------
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = $$(".section-head, .card, .coach, .plan, .split-copy, .split-visual, .map, .trial-form, .faq details, .insta-inner");

if ("IntersectionObserver" in window && !reducedMotion) {
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }),
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => io.observe(el));
}

// ---------- Enquiry form ----------
const form = $("#trial-form");
const status = $("#form-status");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  status.className = "form-status";

  let valid = true;
  $$("[required]", form).forEach((field) => {
    const ok = field.value.trim() !== "" && field.checkValidity();
    field.classList.toggle("invalid", !ok);
    if (!ok) valid = false;
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
