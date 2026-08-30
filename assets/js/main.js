/* Theme switch + portrait perturbation toggle. No dependencies. */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- theme ---------- */

  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  var saved = read("theme");
  var prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(saved || (prefersDark ? "dark" : "light"));

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".theme-toggle");
    if (!btn) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next);
    store("theme", next);
  });

  /* ---------- portrait perturbation ---------- */

  var portrait = document.querySelector(".portrait");
  var epsBtn = document.querySelector(".eps button");
  var epsLabel = document.querySelector(".eps .label");

  if (portrait && epsBtn && epsLabel) {
    epsBtn.addEventListener("click", function () {
      var on = portrait.classList.toggle("is-perturbed");
      epsLabel.textContent = on ? "ε = 8/255" : "ε = 0";
      epsBtn.textContent = on ? "remove" : "perturb";
      epsBtn.setAttribute("aria-pressed", String(on));
    });
  }
})();
