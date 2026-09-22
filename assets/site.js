/* Puente Legal — interacciones del prototipo (v3). Sin dependencias. */
(function () {
  "use strict";
  var WA = "573223685085";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desk = window.matchMedia("(min-width: 960px)");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function track(o) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(o); }
  function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  var params = new URLSearchParams(location.search);

  /* WhatsApp con mensaje según el contexto */
  $$("[data-wa]").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-wa") || "Hola, Puente Legal. Quiero una asesoría.");
    a.target = "_blank"; a.rel = "noopener";
  });

  /* Conversiones: en producción se conectan a GA4 / Google Ads */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-conv]");
    if (el) track({ event: el.getAttribute("data-conv"), location: el.getAttribute("data-loc") || "" });
    var ar = e.target.closest("[data-area]");
    var sel = document.getElementById("f-area");
    if (ar && sel && ar.tagName === "A") sel.value = ar.getAttribute("data-area");
  });

  /* Header: estado al bajar, menú móvil con Esc y clic fuera */
  var header = $(".site-header");
  if (header) {
    var mb = $(".menu-btn", header);
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    var closeMenu = function (focus) {
      if (!header.classList.contains("nav-open")) return;
      header.classList.remove("nav-open"); if (mb) { mb.setAttribute("aria-expanded", "false"); if (focus) mb.focus(); }
    };
    if (mb) mb.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      mb.setAttribute("aria-expanded", open);
    });
    $$(".nav-links a", header).forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(true); });
    document.addEventListener("click", function (e) { if (!header.contains(e.target)) closeMenu(false); });
  }

  /* Notas del prototipo: apagadas por defecto y plegadas */
  var pt = $(".proto-toggle");
  var notes = $$(".proto-note");
  function setProto(on) {
    doc.classList.toggle("proto-on", on);
    if (pt) pt.setAttribute("aria-pressed", on);
    store("pl-proto", on ? "1" : "0");
  }
  if (pt) {
    var lbl = $("span", pt); if (lbl) lbl.textContent = "Notas del prototipo (" + notes.length + ")";
    pt.addEventListener("click", function () { setProto(!doc.classList.contains("proto-on")); });
  }
  setProto(store("pl-proto") === "1");

  /* ---------- Titulares que se revelan por palabra o por letra ----------
     [data-split="words|chars"]: cada palabra sube desde su línea con un blur leve.
     Accesible: el texto completo queda en un .sr-only y las piezas van en aria-hidden.
     [data-split-load] entra al cargar; el resto al entrar en pantalla. */
  function splitText(el) {
    if (el.getAttribute("data-split-done")) return;
    var chars = el.getAttribute("data-split") === "chars", k = 0;
    var tmp = document.createElement("div"); tmp.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, " ");
    var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = tmp.textContent.replace(/\s+/g, " ").trim();
    var wrapNode = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { if (n.tagName !== "BR" && !n.classList.contains("sr-only")) { wrapNode(n); n.setAttribute("aria-hidden", "true"); } return; }
        if (n.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
          var sw = document.createElement("span"); sw.className = "sw"; sw.setAttribute("aria-hidden", "true");
          (chars ? w.split("") : [w]).forEach(function (t) {
            var sc = document.createElement("span"); sc.className = "sc"; sc.style.setProperty("--k", k++); sc.textContent = t; sw.appendChild(sc);
          });
          frag.appendChild(sw);
        });
        n.parentNode.replaceChild(frag, n);
      });
    };
    wrapNode(el);
    el.insertBefore(sr, el.firstChild);
    el.setAttribute("data-split-done", "1");
  }
  var splits = $$("[data-split]");
  splits.forEach(splitText);
  var showSplit = function (el) { el.classList.add("is-in"); };
  if (reduce || !("IntersectionObserver" in window)) splits.forEach(showSplit);
  else {
    var sio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { showSplit(x.target); sio.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    splits.forEach(function (el) {
      if (el.hasAttribute("data-split-load")) { setTimeout(function () { showSplit(el); }, 150); return; }
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) requestAnimationFrame(function () { showSplit(el); });
      else sio.observe(el);
    });
  }

  /* ---------- Botones: barrido, flecha que sale y entra, texto que rueda ---------- */
  $$(".btn, .nav-links a:not(.btn)").forEach(function (el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      var t = n.textContent.trim();
      var r = document.createElement("span"); r.className = "roll";
      var a = document.createElement("span"); a.className = "roll-a"; a.textContent = t;
      var b = document.createElement("span"); b.className = "roll-b"; b.setAttribute("aria-hidden", "true"); b.textContent = t;
      r.appendChild(a); r.appendChild(b);
      el.replaceChild(r, n);
    });
    var ar = el.querySelector(".i-flecha");
    if (ar && !ar.parentNode.classList.contains("arw")) {
      var w = document.createElement("span"); w.className = "arw"; w.setAttribute("aria-hidden", "true");
      ar.parentNode.insertBefore(w, ar); w.appendChild(ar); w.appendChild(ar.cloneNode(true));
    }
  });

  /* Border trail: solo corre mientras el botón está en pantalla */
  var trails = $$(".btn-trail");
  if (trails.length && "IntersectionObserver" in window && !reduce) {
    var trio = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle("is-live", x.isIntersecting); }); });
    trails.forEach(function (b) { trio.observe(b); });
  }

  /* Imán: el CTA se acerca (máx. 6 px) al cursor; solo con puntero fino */
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    $$("[data-magnet]").forEach(function (el) {
      var zone = el.parentElement;
      zone.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), reach = Math.max(r.width, 160);
        if (d > reach) { el.style.translate = "0 0"; return; }
        var f = 1 - d / reach;
        el.style.translate = (dx / reach * 6 * (0.4 + f)).toFixed(1) + "px " + (dy / reach * 6 * (0.4 + f)).toFixed(1) + "px";
      });
      zone.addEventListener("pointerleave", function () { el.style.translate = "0 0"; });
    });
  }

  /* Barra de progreso del header: CSS scroll-timeline, con respaldo en JS */
  var bars = $$(".progreso");
  if (bars.length && !(window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()"))) {
    var pTick = false;
    var paintBar = function () {
      pTick = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var v = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bars.forEach(function (b) { b.style.setProperty("--p", v.toFixed(4)); });
    };
    window.addEventListener("scroll", function () { if (!pTick) { pTick = true; requestAnimationFrame(paintBar); } }, { passive: true });
    paintBar();
  }

  /* Revelado escalonado: solo lo que arranca fuera de pantalla */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("rv-in"); en.target.classList.remove("rv-pending"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(function (el) {
      var sib = el.parentElement ? $$(":scope > .rv", el.parentElement) : [el];
      el.style.setProperty("--i", Math.max(0, sib.indexOf(el)));
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("rv-pending"); io.observe(el); }
    });
  }

  /* Cifras que cuentan una vez */
  function countUp(el) {
    var to = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = to + suf; return; }
    var t0 = null;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { countUp(x.target); cio.unobserve(x.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Servicios: traductor de situaciones ---------- */
  var board = $(".board");
  var sits = board ? $$(".sit", board) : [];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function openSit(sit, via, opts) {
    opts = opts || {};
    sits.forEach(function (s) {
      if (s !== sit && s.classList.contains("is-open")) {
        s.classList.remove("is-open"); $(".ficha", s).classList.remove("is-in");
        $(".sit-btn", s).setAttribute("aria-expanded", "false");
      }
    });
    var btn = $(".sit-btn", sit), f = $(".ficha", sit);
    sit.classList.add("is-open"); btn.setAttribute("aria-expanded", "true");
    board.classList.add("has-open");
    f.classList.remove("is-in");
    requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add("is-in"); }); });
    var c = $(".f-count", f); if (c) c.textContent = pad(sits.indexOf(sit) + 1) + " / " + pad(sits.length);
    var slug = $(".sit-h", sit).id;
    if (!opts.noHash && history.replaceState) history.replaceState(null, "", "#" + slug);
    track({ event: "situacion_abierta", servicio: slug, via: via });
  }
  function closeSit(sit) {
    sit.classList.remove("is-open"); $(".ficha", sit).classList.remove("is-in");
    $(".sit-btn", sit).setAttribute("aria-expanded", "false");
    if (!sits.some(function (s) { return s.classList.contains("is-open"); })) board.classList.remove("has-open");
  }
  function scrollToEl(el) { el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); }
  if (board) {
    sits.forEach(function (sit, i) {
      var btn = $(".sit-btn", sit);
      btn.addEventListener("click", function () {
        var top0 = btn.getBoundingClientRect().top;
        if (sit.classList.contains("is-open") && !desk.matches) closeSit(sit);
        else if (!sit.classList.contains("is-open")) openSit(sit, "clic");
        if (!desk.matches) window.scrollBy(0, btn.getBoundingClientRect().top - top0);
      });
      btn.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowDown") n = sits[Math.min(sits.length - 1, i + 1)];
        if (e.key === "ArrowUp") n = sits[Math.max(0, i - 1)];
        if (e.key === "Home") n = sits[0];
        if (e.key === "End") n = sits[sits.length - 1];
        if (n) { e.preventDefault(); $(".sit-btn", n).focus(); }
      });
      var go = function (d) { return function () { openSit(sits[(i + d + sits.length) % sits.length], d > 0 ? "siguiente" : "anterior"); }; };
      var pv = $(".f-prev", sit), nx = $(".f-nxt", sit), nm = $(".f-next", sit);
      if (pv) pv.addEventListener("click", go(-1));
      if (nx) nx.addEventListener("click", go(1));
      if (nm) nm.addEventListener("click", function () {
        var nsit = sits[(i + 1) % sits.length];
        openSit(nsit, "siguiente"); var b = $(".sit-btn", nsit); b.focus({ preventScroll: true }); scrollToEl($(".sit-h", nsit));
      });
    });
    var route = function (hash, scroll) {
      if (!hash || hash.length < 2) return false;
      var el = document.getElementById(hash.slice(1));
      if (!el || !board.contains(el)) return false;
      if (el.classList.contains("sit-h")) { openSit(el.closest(".sit"), "enlace", { noHash: true }); if (scroll) scrollToEl(el); return true; }
      if (el.classList.contains("area-head")) {
        if (desk.matches) { var first = el.parentElement.querySelector(".sit"); if (first) openSit(first, "area", { noHash: true }); }
        if (scroll) scrollToEl(el);
        return true;
      }
      return false;
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (a && route(a.getAttribute("href"), true)) { e.preventDefault(); if (history.replaceState) history.replaceState(null, "", a.getAttribute("href")); }
    });
    var sv = params.get("servicio");
    if (sv && document.getElementById(sv)) route("#" + sv, true);
    else if (location.hash) route(location.hash, false);
  }

  /* ---------- Diagnóstico ---------- */
  var diag = document.getElementById("diagnostico");
  var setSector = function () {};
  if (diag) {
    var boxes = $$("input[type=checkbox]", diag);
    var trSet = $(".diag-tr", diag);
    var sw = $(".switch", diag);
    var swBtns = $$("[data-set-sector]", diag);
    var dbr = $(".dbridge", diag), dbN = 0, num = $(".gauge-num b", diag);
    /* Puente de tablas: una tabla por requisito; el arco se completa y "tu empresa" avanza */
    var buildDB = function (total) {
      if (!dbr || dbN === total) return; dbN = total;
      var x0 = 20, x1 = 280, gap = 3, pw = (x1 - x0 - gap * (total - 1)) / total, planks = "";
      for (var i = 0; i < total; i++) planks += '<rect class="db-plank" x="' + (x0 + i * (pw + gap)).toFixed(1) + '" y="94" width="' + pw.toFixed(1) + '" height="8" rx="1.5"/>';
      dbr.innerHTML = '<svg viewBox="0 0 300 150"><path class="db-water" d="M0 140H300"/><path class="db-bank" d="M0 100H20V150M300 100H280V150"/>' +
        '<path class="db-pier" d="M150 150V104"/>' + planks +
        '<path class="db-arch" pathLength="1" d="M20 100C63 36 107 36 150 100M150 100C193 36 237 36 280 100"/></svg>' +
        '<span class="db-trav"></span><span class="db-l">Hoy</span><span class="db-r">En regla</span>';
    };
    var pill = $(".pill", diag), vT = $(".verdict strong", diag), vP = $(".verdict p", diag);
    var cta = document.getElementById("diag-wa"), status = document.getElementById("diag-status");
    var bar = $(".diag-bar", diag), reset = $(".diag-reset", diag);
    var sector = "otro", touched = false, shown = 0;
    var LV = {
      neutro: { pill: "Sin respuestas", t: "Marca lo que ya tienes al día.", p: "Tu resultado aparece aquí." },
      alto: { pill: "Riesgo alto", t: "Tu empresa está expuesta a sanciones.", p: "Revisemos lo pendiente antes de una inspección." },
      medio: { pill: "Frentes abiertos", t: "Vas bien, pero hay frentes abiertos.", p: "Cierra lo pendiente antes de que te lo exijan." },
      bajo: { pill: "En regla", t: "Tu empresa se ve en regla.", p: "Una revisión al año te mantiene al día." }
    };
    var visible = function () { return boxes.filter(function (b) { return !b.closest("[hidden]"); }); };
    var animNum = function (from, to, total) {
      if (reduce) { num.textContent = to + "/" + total; return; }
      var t0 = null;
      var step = function (t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - p, 3);
        num.textContent = Math.round(from + (to - from) * e) + "/" + total; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    var save = function () {
      var checks = {}; boxes.forEach(function (b) { if (b.checked) checks[b.id] = 1; });
      store("pl-diag-v2", JSON.stringify({ sector: sector, checks: checks }));
    };
    var update = function () {
      var vis = visible(), total = vis.length, n = vis.filter(function (b) { return b.checked; }).length;
      var key = (!touched && n === 0) ? "neutro" : (n / total <= .4 ? "alto" : n / total <= .8 ? "medio" : "bajo");
      var L = LV[key];
      buildDB(total);
      if (dbr) {
        $$(".db-plank", dbr).forEach(function (r, i) { r.classList.toggle("on", i < n); r.style.transitionDelay = reduce ? "0s" : (i * 40) + "ms"; });
        var arc = $(".db-arch", dbr); if (arc) arc.style.strokeDashoffset = 1 - n / total;
        var tv = $(".db-trav", dbr); if (tv) tv.style.left = (6 + 88 * n / total) + "%";
        dbr.classList.toggle("done", n === total);
      }
      animNum(shown, n, total); shown = n;
      pill.textContent = L.pill; pill.dataset.level = key; vT.textContent = L.t; vP.textContent = L.p;
      if (status && key !== "neutro") status.textContent = n + " de " + total + " requisitos al día. " + L.pill + ".";
      if (bar) {
        bar.querySelector("b").textContent = n + "/" + total;
        bar.querySelector(".db-t").textContent = L.pill;
        bar.querySelector("i").style.setProperty("--p", n / total);
      }
      var missing = vis.filter(function (b) { return !b.checked; }).map(function (b) { return "• " + b.dataset.label; });
      var msg = "Hola, Puente Legal. Hice el diagnóstico (sector: " + (sector === "transporte" ? "transporte de carga" : "otro") + "): " +
        n + "/" + total + " al día." + (missing.length ? "\nMe falta:\n" + missing.join("\n") : "") + "\nQuiero una asesoría.";
      cta.href = waLink(msg); cta.target = "_blank"; cta.rel = "noopener";
      cta.setAttribute("aria-disabled", key === "neutro" ? "true" : "false");
    };
    setSector = function (s, silent) {
      sector = s === "transporte" ? "transporte" : "otro";
      swBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-set-sector") === sector); });
      if (sw) sw.classList.toggle("is-yes", sector === "transporte");
      trSet.hidden = sector !== "transporte";
      update(); save();
      if (!silent) track({ event: "diag_sector", sector: sector });
    };
    swBtns.forEach(function (b) { b.addEventListener("click", function () { setSector(b.getAttribute("data-set-sector")); }); });
    boxes.forEach(function (b) {
      b.addEventListener("change", function () {
        if (!touched) { touched = true; track({ event: "diag_start" }); }
        update(); save();
      });
    });
    if (reset) reset.addEventListener("click", function () {
      boxes.forEach(function (b) { b.checked = false; }); touched = false; update(); save();
    });
    try {
      var saved = JSON.parse(store("pl-diag-v2") || "null");
      if (saved) { boxes.forEach(function (b) { b.checked = !!(saved.checks || {})[b.id]; }); touched = boxes.some(function (b) { return b.checked; }); }
      setSector(params.get("sector") === "transporte" ? "transporte" : (saved && saved.sector) || "otro", true);
    } catch (e) { setSector("otro", true); }
    document.addEventListener("click", function (e) { if (e.target.closest("[data-sector='transporte']")) setSector("transporte"); });
  }

  /* ---------- Cómo trabajamos: el puente se dibuja con el scroll ---------- */
  var proc = document.getElementById("como-trabajamos");
  if (proc && $(".bridge", proc)) {
    var bridge = $(".bridge", proc), stepsEl = $(".steps", proc), stepLis = $$(".steps li", proc);
    var bpaths = bridge ? $$("path", bridge) : [];
    var paint = function () {
      var ref = (bridge && bridge.offsetParent) ? bridge : stepsEl;
      var r = ref.getBoundingClientRect();
      var t = Math.min(1, Math.max(0, (window.innerHeight * .9 - r.top) / (window.innerHeight * .6)));
      if (reduce) t = 1;
      bpaths.forEach(function (p) { p.style.strokeDashoffset = 1 - t; });
      stepsEl.style.setProperty("--p", t);
      stepLis.forEach(function (li, i) { li.classList.toggle("on", t >= (i + .5) / stepLis.length); });
    };
    bpaths.forEach(function (p) { p.style.strokeDasharray = 1; });
    var ticking = false, live = false;
    var onS = function () { if (!live || ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; paint(); }); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { live = en[0].isIntersecting; if (live) paint(); }).observe(proc);
      window.addEventListener("scroll", onS, { passive: true });
    }
    paint();
  }


  /* ---------- Puentes que se arman: motor de dibujo por scroll ----------
     [data-draw="sticky|view|time"] contiene:
       path[data-seg="ini,fin"]      se dibuja entre esas fracciones del progreso
       [data-kind="fade"][data-seg]  aparece (opacidad) en ese tramo
       [data-on="x"] / [data-off="x"] reciben .on / .off desde ese punto
       [data-movepct="p:x;p:x"]      se mueve en % (left) por tramos
       [data-pan]                    escenario ancho que sigue al viajero (móvil)
       [data-tx|data-ty="p:px;p:px"] parallax: desplazamiento (propiedad translate)
       [data-tz="p:px;p:px"]         profundidad 3D: translateZ de una cámara
       [data-fill]                   el texto se ilumina palabra a palabra
     Modos: sticky (escena fijada), view (se arma al entrar), through (todo el paso por pantalla), time.
     ?drawp=0.5 fija el progreso de todos (solo para revisar capturas). */
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var forceP = params.has("drawp") ? clamp(+params.get("drawp")) : null;
  $$("[data-draw]").forEach(function (root) {
    var mode = root.getAttribute("data-draw");
    var segs = $$("[data-seg]", root).map(function (el) {
      var a = el.getAttribute("data-seg").split(",");
      return { el: el, s: +a[0], e: +a[1], fade: el.getAttribute("data-kind") === "fade" };
    });
    var ons = $$("[data-on]", root).map(function (el) { return { el: el, at: +el.getAttribute("data-on") }; });
    var offs = $$("[data-off]", root).map(function (el) { return { el: el, at: +el.getAttribute("data-off") }; });
    var movs = $$("[data-movepct]", root).map(function (el) {
      return { el: el, x: 0, st: el.getAttribute("data-movepct").split(";").map(function (x) { return x.split(":").map(Number); }) };
    });
    var stage = $("[data-pan]", root), vp = stage && stage.parentElement;
    var parse = function (v) { return v.split(";").map(function (x) { return x.split(":").map(Number); }); };
    var tfs = $$("[data-tx],[data-ty],[data-tz]", root).map(function (el) {
      return { el: el, tx: el.hasAttribute("data-tx") && parse(el.getAttribute("data-tx")),
               ty: el.hasAttribute("data-ty") && parse(el.getAttribute("data-ty")),
               tz: el.hasAttribute("data-tz") && parse(el.getAttribute("data-tz")) };
    });
    var fws = [];
    $$("[data-fill]", root).forEach(function (el) {
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 1) { walk(n); return; }
          if (n.nodeType !== 3) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; }
            var sp = document.createElement("span"); sp.className = "fw"; sp.textContent = w; frag.appendChild(sp); fws.push(sp);
          });
          n.parentNode.replaceChild(frag, n);
        });
      };
      walk(el);
    });
    var interp = function (st, p) {
      if (p <= st[0][0]) return st[0][1];
      for (var i = 1; i < st.length; i++) if (p <= st[i][0]) { var a = st[i - 1], b = st[i]; return a[1] + (b[1] - a[1]) * ((p - a[0]) / (b[0] - a[0] || 1)); }
      return st[st.length - 1][1];
    };
    var last = -1;
    var set = function (p, still) {
      if (Math.abs(p - last) < .0004) return; last = p;
      if (!still) tfs.forEach(function (o) {
        if (o.tx || o.ty) o.el.style.translate = (o.tx ? interp(o.tx, p) : 0).toFixed(1) + "px " + (o.ty ? interp(o.ty, p) : 0).toFixed(1) + "px";
        if (o.tz) o.el.style.transform = "translateZ(" + interp(o.tz, p).toFixed(1) + "px)";
      });
      if (fws.length) { var lit = Math.round(clamp((p - .18) / .42) * fws.length); fws.forEach(function (w, i) { w.classList.toggle("lit", i < lit); }); }
      segs.forEach(function (o) {
        var t = clamp((p - o.s) / (o.e - o.s || 1));
        if (o.fade) { o.el.style.opacity = t; o.el.style.transform = "translateY(" + ((1 - t) * -12).toFixed(1) + "px)"; }
        else o.el.style.strokeDashoffset = (1 - t).toFixed(4);
      });
      ons.forEach(function (o) { o.el.classList.toggle("on", p >= o.at); });
      offs.forEach(function (o) { o.el.classList.toggle("off", p >= o.at); });
      movs.forEach(function (o) { o.x = interp(o.st, p); o.el.style.left = o.x.toFixed(2) + "%"; });
      if (stage && vp && movs[0]) {
        var extra = stage.offsetWidth - vp.offsetWidth;
        if (extra > 1) { var f = clamp((movs[0].x - 18) / (90 - 18)); stage.style.transform = "translateX(" + (-extra * f).toFixed(1) + "px)"; }
        else stage.style.transform = "";
      }
    };
    if (forceP !== null) { set(forceP); return; }
    if (reduce) { set(1, true); return; }
    if (mode === "time") {
      set(0);
      var dur = +(root.getAttribute("data-dur") || 2400);
      var play = function () {
        var t0 = null;
        var st = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur); set(k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); if (k < 1) requestAnimationFrame(st); };
        requestAnimationFrame(st);
      };
      if ("IntersectionObserver" in window) {
        var tio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { play(); tio.disconnect(); } }, { threshold: .3 });
        tio.observe(root);
      } else set(1);
      return;
    }
    var sticky = mode === "sticky" ? $(".hx-sticky", root) : null;
    var calc = function () {
      var r = root.getBoundingClientRect(), vh = window.innerHeight;
      if (sticky) {
        var top = parseFloat(getComputedStyle(sticky).top) || 0, tot = root.offsetHeight - sticky.offsetHeight;
        return tot > 20 ? clamp((top - r.top) / tot) : 1;
      }
      if (mode === "through") return clamp((vh - r.top) / (vh + r.height));
      return clamp((vh * .9 - r.top) / (vh * .55));
    };
    var ticking = false, live = true;
    var onS = function () { if (!live || ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; set(calc()); }); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { live = en[0].isIntersecting; if (live) set(calc()); }, { rootMargin: "120px 0px" }).observe(root);
    }
    window.addEventListener("scroll", onS, { passive: true });
    window.addEventListener("resize", function () { last = -1; set(calc()); });
    set(calc());
  });


  /* ---------- Animaciones en bucle: solo corren en pantalla ---------- */
  if ("IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle("is-live", x.isIntersecting); }); });
    $$(".loop").forEach(function (el) { lio.observe(el); });
    /* [data-inview]: se revela una vez (cortinas de imagen, tarjetas) */
    var vio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); vio.unobserve(x.target); } });
    }, { threshold: .15 });
    $$("[data-inview]").forEach(function (el) { if (reduce) el.classList.add("is-in"); else vio.observe(el); });
  } else {
    $$(".loop").forEach(function (el) { el.classList.add("is-live"); });
    $$("[data-inview]").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Cuatro tramos: acordeón; cada tramo dibuja su ilustración al abrirse ---------- */
  var acc = $(".acc");
  if (acc) {
    var accPs = $$(".acc-p", acc), wideAcc = window.matchMedia("(min-width: 901px)");
    var openAcc = function (el) { accPs.forEach(function (x) { x.classList.toggle("is-open", x === el); }); };
    accPs.forEach(function (el) {
      el.addEventListener("pointerenter", function () { if (wideAcc.matches) openAcc(el); });
      el.addEventListener("focus", function () { if (wideAcc.matches) openAcc(el); });
    });
    var syncAcc = function () {
      if (!wideAcc.matches) accPs.forEach(function (x) { x.classList.add("is-open"); });
      else if (accPs.filter(function (x) { return x.classList.contains("is-open"); }).length !== 1) openAcc(accPs[0]);
    };
    syncAcc(); wideAcc.addEventListener("change", syncAcc);
    if ("IntersectionObserver" in window && !reduce) {
      var aio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) x.target.classList.add("in-view"); }); }, { threshold: .35 });
      accPs.forEach(function (el) { aio.observe(el); });
    } else accPs.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Hoja del diagnóstico: se inclina hacia el cursor ---------- */
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    $$("[data-tilt]").forEach(function (wrap) {
      var paper = wrap.firstElementChild;
      wrap.addEventListener("pointermove", function (e) {
        var r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        paper.style.transform = "rotate(-2deg) rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 8).toFixed(2) + "deg)";
      });
      wrap.addEventListener("pointerleave", function () { paper.style.transform = ""; });
    });
    /* Cierre: el punto de fuga del corredor de arcos sigue al cursor */
    $$(".c3").forEach(function (sec) {
      var scene = $(".c3-scene", sec);
      sec.addEventListener("pointermove", function (e) {
        var r = sec.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        scene.style.perspectiveOrigin = (64 + x * 10).toFixed(1) + "% " + (46 + y * 10).toFixed(1) + "%";
      });
      sec.addEventListener("pointerleave", function () { scene.style.perspectiveOrigin = ""; });
    });
  }

  /* QA del prototipo: ?qa=.selector salta a esa sección y deja todo revelado (con ?drawp= fija el motor) */
  if (params.has("qa")) {
    $$("[data-split]").forEach(function (el) { el.classList.add("is-in"); });
    $$("[data-inview]").forEach(function (el) { el.classList.add("is-in"); });
    $$(".acc-p").forEach(function (el) { el.classList.add("in-view"); });
    $$(".loop").forEach(function (el) { el.classList.add("is-live"); });
    var qt = document.querySelector(params.get("qa"));
    if (qt) window.scrollTo(0, qt.getBoundingClientRect().top + window.scrollY - 70);
  }

  /* Contacto: el área llega preseleccionada desde un servicio (?area=) */
  var fArea = document.getElementById("f-area");
  if (fArea && params.get("area")) {
    var want = params.get("area");
    $$("option", fArea).forEach(function (o) { if (o.textContent === want) fArea.value = want; });
  }

  /* Especialidad: los íconos se trazan al entrar */
  var esp = $(".esp-list");
  if (esp && "IntersectionObserver" in window) {
    $$("li", esp).forEach(function (li, i) { li.style.setProperty("--i", i); });
    var eio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { esp.classList.add("draw"); eio.disconnect(); } }, { threshold: .4 });
    eio.observe(esp);
  }

  /* ---------- Equipo: carrusel en móvil ---------- */
  var team = $(".team");
  if (team) {
    var members = $$(".member", team);
    var cnt = $(".team-ctrl span");
    var cur = 0;
    if ("IntersectionObserver" in window) {
      var tio = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting && x.intersectionRatio >= .6) {
            cur = members.indexOf(x.target);
            members.forEach(function (m) { m.classList.toggle("is-current", m === x.target && !desk.matches); });
            if (cnt) cnt.textContent = (cur + 1) + " / " + members.length;
          }
        });
      }, { root: team, threshold: [.6] });
      members.forEach(function (m) { tio.observe(m); });
    }
    var move = function (d) {
      var nx = members[Math.max(0, Math.min(members.length - 1, cur + d))];
      team.scrollTo({ left: nx.offsetLeft - team.offsetLeft - parseFloat(getComputedStyle(team).paddingLeft), behavior: reduce ? "auto" : "smooth" });
    };
    var tp = $(".team-ctrl .prev"), tn = $(".team-ctrl .next");
    if (tp) tp.addEventListener("click", function () { move(-1); });
    if (tn) tn.addEventListener("click", function () { move(1); });
  }

  /* Perfiles */
  $$("[data-bio]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = document.getElementById(b.getAttribute("data-bio"));
      if (d && d.showModal) { d.showModal(); doc.style.overflow = "hidden"; }
    });
  });
  $$("dialog.bio").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest(".bio-close")) d.close(); });
    d.addEventListener("close", function () { doc.style.overflow = ""; });
  });

  /* Formularios (modo demo) */
  $$("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var ok = $(".form-ok", f);
      if (ok) { ok.hidden = false; ok.focus(); }
      var area = f.querySelector("#f-area");
      track({ event: "lead_form", form: f.id, area: area ? area.value : "" });
    });
  });

  /* WhatsApp flotante: se esconde en Contacto y mientras se escribe */
  var waf = $(".wa-float"), contacto = document.getElementById("contacto");
  if (waf && contacto && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { waf.classList.toggle("is-hidden", en[0].isIntersecting); }, { threshold: .15 }).observe(contacto);
  }
  document.addEventListener("focusin", function (e) { if (e.target.matches("input, select, textarea")) doc.classList.add("typing"); });
  document.addEventListener("focusout", function (e) { if (e.target.matches("input, select, textarea")) doc.classList.remove("typing"); });

  /* ---------- Noticias: filtros ---------- */
  var list = document.getElementById("news-list");
  if (list) {
    var cards = $$(".card", list);
    var catBtns = $$(".cats button");
    var q = document.getElementById("news-q");
    var empty = document.getElementById("news-empty");
    var countEl = document.getElementById("news-count");
    var cat = "todas";
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var term = norm(q.value.trim()), shownN = 0;
      cards.forEach(function (c) {
        var cats = (c.dataset.cat || "").split(" ");
        var ok = (cat === "todas" || cats.indexOf(cat) > -1) && (!term || norm(c.textContent).indexOf(term) > -1);
        c.hidden = !ok; if (ok) shownN++;
      });
      empty.hidden = shownN > 0;
      if (countEl) countEl.textContent = "Mostrando " + shownN + (shownN === 1 ? " artículo" : " artículos");
    };
    var run = function () { if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply(); };
    catBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        cat = b.dataset.cat;
        catBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        run();
      });
    });
    q.addEventListener("input", apply);
  }

  /* ---------- Artículo ---------- */
  var prose = $(".prose");
  if (prose) {
    var tocLinks = $$(".toc a");
    var heads = tocLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var onRead = function () {
      var c = 0;
      heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 140) c = i; });
      tocLinks.forEach(function (a, i) { a.classList.toggle("on", i === c); });
    };
    onRead(); window.addEventListener("scroll", onRead, { passive: true });
    var toc = $("details.toc");
    if (toc && window.matchMedia("(max-width: 800px)").matches) toc.open = false;
  }
  var copy = $("[data-copy]");
  if (copy) copy.addEventListener("click", function () {
    var done = function () { $("span", copy).textContent = "Enlace copiado"; };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });
  $$("[data-share]").forEach(function (a) {
    var u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
    a.href = a.dataset.share === "wa" ? "https://wa.me/?text=" + t + "%20" + u : "https://www.linkedin.com/sharing/share-offsite/?url=" + u;
    a.target = "_blank"; a.rel = "noopener";
  });

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
