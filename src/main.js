import "./style.css";
import { loadWaitlist, submitWaitlist } from "./waitlist.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function wireHoverLock({
  items,
  getId,
  onShow,
  initial,
  root,
}) {
  let pinned = initial;
  let hovering = null;
  let timer = 0;

  const apply = () => onShow(hovering || pinned, pinned);

  items.forEach((item) => {
    const id = getId(item);
    item.addEventListener("mouseenter", () => {
      window.clearTimeout(timer);
      hovering = id;
      apply();
    });
    item.addEventListener("mouseleave", () => {
      timer = window.setTimeout(() => {
        if (hovering === id) {
          hovering = null;
          apply();
        }
      }, 90);
    });
    item.addEventListener("focus", () => {
      hovering = id;
      apply();
    });
    item.addEventListener("click", () => {
      pinned = id;
      hovering = null;
      apply();
    });
  });

  root?.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) {
      hovering = null;
      apply();
    }
  });

  apply();
  return {
    pin(id) {
      pinned = id;
      hovering = null;
      apply();
    },
  };
}

function setupPaths() {
  const root = document.querySelector("#walk");
  const buttons = [...document.querySelectorAll(".path")];
  if (!root || buttons.length === 0) return;

  const show = (id, pinned) => {
    document.querySelectorAll(".dossier").forEach((article) => {
      article.classList.toggle("is-current", article.dataset.path === id);
    });
    buttons.forEach((button) => {
      const on = button.dataset.path === id;
      button.classList.toggle("is-lit", on);
      button.setAttribute("aria-pressed", button.dataset.path === pinned ? "true" : "false");
    });
    document.querySelectorAll(".clip").forEach((clip) => {
      const key = clip.dataset.live;
      const playing = (key === "always" || key === id) && clip.querySelector(".sheet");
      clip.classList.toggle("is-live", Boolean(playing));
    });
  };

  wireHoverLock({
    items: buttons,
    getId: (button) => button.dataset.path,
    onShow: show,
    initial: "drifter",
    root,
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const current = document.querySelector(".dossier.is-current");
      if (!current) return;
      const rect = current.getBoundingClientRect();
      if (rect.top < 108 || rect.bottom > window.innerHeight - 8) {
        current.scrollIntoView({
          block: "start",
          behavior: reduceMotion.matches ? "auto" : "smooth",
        });
      }
    });
  });

  buttons.forEach((button, index) => {
    button.addEventListener("keydown", (event) => {
      const sideways = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
      if (!sideways.includes(event.key)) return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const next = buttons[(index + delta + buttons.length) % buttons.length];
      next.focus();
    });
  });
}

function setupMap() {
  const svg = document.querySelector(".map-svg");
  const items = [...document.querySelectorAll(".district-item")];
  const pins = [...document.querySelectorAll(".map-pin")];
  if (!svg || items.length === 0) return;

  const buttons = items.map((item) => item.querySelector(".district-btn"));
  const shapes = [...svg.querySelectorAll(".district")];
  let pinned = "den";
  let hovering = null;
  let timer = 0;

  const apply = () => {
    const id = hovering || pinned;
    svg.dataset.active = id;
    pins.forEach((pin) => pin.classList.toggle("is-hot", pin.dataset.pin === id));
    items.forEach((item) => {
      const on = item.dataset.district === id;
      item.classList.toggle("is-open", on);
      item.querySelector(".district-btn").setAttribute("aria-expanded", on ? "true" : "false");
    });
    shapes.forEach((shape) => shape.classList.toggle("is-hot", shape.dataset.district === id));
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.district === pinned ? "true" : "false");
    });
  };

  const preview = (id) => {
    window.clearTimeout(timer);
    hovering = id;
    apply();
  };

  const release = (id) => {
    timer = window.setTimeout(() => {
      if (hovering === id) {
        hovering = null;
        apply();
      }
    }, 90);
  };

  buttons.forEach((button) => {
    const id = button.dataset.district;
    button.addEventListener("mouseenter", () => preview(id));
    button.addEventListener("mouseleave", () => release(id));
    button.addEventListener("focus", () => preview(id));
    button.addEventListener("click", () => {
      pinned = id;
      hovering = null;
      apply();
    });
  });

  shapes.forEach((shape) => {
    const id = shape.dataset.district;
    shape.addEventListener("mouseenter", () => preview(id));
    shape.addEventListener("mouseleave", () => release(id));
    shape.addEventListener("click", () => {
      pinned = id;
      hovering = null;
      apply();
    });
  });

  document.querySelector("#city")?.addEventListener("focusout", (event) => {
    const city = document.querySelector("#city");
    if (!city.contains(event.relatedTarget)) {
      hovering = null;
      apply();
    }
  });

  apply();
}

function setFieldError(input, message) {
  const error = document.getElementById(input.getAttribute("aria-describedby"));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (!error) return;
  error.hidden = !message;
  error.textContent = message || "";
}

function setupWaitlist() {
  const form = document.querySelector("#waitlist-form");
  const success = document.querySelector("#waitlist-success");
  const prior = document.querySelector("#waitlist-prior");
  if (!form || !success) return;

  const email = form.querySelector("#email");
  const street = form.querySelector("#street");
  const formError = document.querySelector("#form-error");
  const again = document.querySelector("#waitlist-again");

  const existing = loadWaitlist();
  if (prior && existing.length > 0) {
    const last = existing[existing.length - 1];
    prior.hidden = false;
    prior.textContent = `This browser already has ${last.email} written down.`;
  }

  const clearErrors = () => {
    setFieldError(email, "");
    setFieldError(street, "");
    if (formError) {
      formError.hidden = true;
      formError.textContent = "";
    }
  };

  email.addEventListener("input", () => setFieldError(email, ""));
  street.addEventListener("input", () => setFieldError(street, ""));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    const submit = form.querySelector("[type='submit']");
    submit.disabled = true;

    try {
      const result = await submitWaitlist({
        email: email.value,
        streetName: street.value,
      });

      if (!result.ok) {
        if (result.errors.email) setFieldError(email, result.errors.email);
        if (result.errors.streetName) setFieldError(street, result.errors.streetName);
        if (result.errors.form && formError) {
          formError.hidden = false;
          formError.textContent = result.errors.form;
        }
        (result.errors.email ? email : result.errors.streetName ? street : formError)?.focus();
        return;
      }

      const body = document.querySelector("#success-body");
      const held = document.querySelector("#success-name");
      body.textContent = `When the door opens, word goes to ${result.entry.email}.`;
      if (result.entry.streetName) {
        held.textContent = `${result.entry.streetName} is the street name held on this browser. The real book can still say no.`;
      } else {
        held.textContent = "No street name yet. You can pick one later. The city will have opinions.";
      }
      form.hidden = true;
      success.hidden = false;
      if (prior) prior.hidden = true;
      success.focus();
    } finally {
      submit.disabled = false;
    }
  });

  again?.addEventListener("click", () => {
    form.reset();
    clearErrors();
    success.hidden = true;
    form.hidden = false;
    email.focus();
  });
}

function setupPlaceholders() {
  document.querySelectorAll("a.placeholder").forEach((link) => {
    link.addEventListener("click", (event) => event.preventDefault());
  });
}

function setupTickerPause() {
  const ticker = document.querySelector(".ticker");
  if (!ticker || reduceMotion.matches) return;
  ticker.addEventListener("mouseenter", () => ticker.classList.add("is-paused"));
  ticker.addEventListener("mouseleave", () => ticker.classList.remove("is-paused"));
  ticker.addEventListener("focusin", () => ticker.classList.add("is-paused"));
  ticker.addEventListener("focusout", () => ticker.classList.remove("is-paused"));
}

setupPaths();
setupMap();
setupWaitlist();
setupPlaceholders();
setupTickerPause();
