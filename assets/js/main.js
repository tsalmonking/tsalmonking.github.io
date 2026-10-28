/* Theme switch and blog depth filter. No dependencies. */

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

  /* ---------- blog depth filter ---------- */

  var filter = document.querySelector(".level-filter");
  if (filter) {
    var items = document.querySelectorAll(".post-list > li[data-level]");
    var empty = document.querySelector(".level-empty");

    var setLevel = function (level, updateUrl) {
      if (!filter.querySelector('button[data-level="' + level + '"]')) level = "all";
      filter.querySelectorAll("button[data-level]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-level") === level ? "true" : "false");
      });
      var shown = [];
      items.forEach(function (li) {
        var match = level === "all" || li.getAttribute("data-level") === level;
        li.hidden = !match;
        li.classList.remove("is-first", "is-last");
        if (match) shown.push(li);
      });
      if (shown.length) {
        shown[0].classList.add("is-first");
        shown[shown.length - 1].classList.add("is-last");
      }
      if (empty) empty.hidden = shown.length > 0;
      if (updateUrl && window.history && window.URL) {
        var url = new URL(window.location.href);
        if (level === "all") url.searchParams.delete("level");
        else url.searchParams.set("level", level);
        window.history.replaceState(null, "", url);
      }
    };

    filter.addEventListener("click", function (event) {
      var b = event.target.closest("button[data-level]");
      if (b) setLevel(b.getAttribute("data-level"), true);
    });

    var initial = "all";
    try { initial = new URLSearchParams(window.location.search).get("level") || "all"; } catch (e) { /* old browser */ }
    setLevel(initial, false);
  }

})();
