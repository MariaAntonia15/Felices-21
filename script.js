/* ==========================================================================
   SORPRESA DE CUMPLEAÑOS — LÓGICA
   Los textos se cambian en config.js
   ========================================================================== */
(() => {
  "use strict";

  const C = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, props, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") n.className = v;
      else n.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return n;
  }

  const escena = $("#escena");
  const escenario = $("#escenario");
  const pista = $("#pista");
  const nombre = C.nombre || "";
  const edad = C.edad || 21;
  const textos = {
    intro: (C.intro && C.intro.texto) || "Tengo un regalo para ti…",
    introAbierto: (C.intro && C.intro.abierto) || "¡Sorpresa! 🎉",
    pistaCaja: (C.intro && C.intro.pista) || "Toca la caja para abrirla 🎁",
    pistaVelas: (C.velas && C.velas.pista) || "Toca las velas para soplarlas 🕯️",
    deseo: (C.velas && C.velas.deseo) || "Pide un deseo ✨"
  };

  /* ---------- Textos ---------- */
  $$("[data-nombre]").forEach((n) => { n.textContent = nombre; });
  $("#intro-texto").textContent = textos.intro;
  pista.textContent = textos.pistaCaja;
  $("#texto-pastel").textContent = C.textoPastel || "Feliz cumpleaños";
  const m = C.mensaje || {};
  $("#msj-titulo").textContent = m.titulo || "";
  $("#msj-texto").textContent = m.texto || "";
  $("#msj-firma").textContent = m.firma || "";

  /* ---------- Velas con los números de la edad ---------- */
  const velas = String(edad).split("").map((d) => {
    const b = el("button", { class: "vela", type: "button", "aria-label": `Vela ${d}: tócala para soplarla` },
      el("span", { class: "humo", "aria-hidden": "true" }),
      el("span", { class: "llama", "aria-hidden": "true" }),
      el("span", { class: "numero" }, d));
    b.addEventListener("click", (e) => { e.stopPropagation(); soplar(b); });
    $("#velas").append(b);
    return b;
  });

  /* ---------- Letreros que giran alrededor del pastel ---------- */
  const texto = C.letrero || `¡Felices ${edad}, ${nombre}!`;
  const corte = texto.indexOf(", ");
  const lineas = corte > 0 ? [texto.slice(0, corte + 1), texto.slice(corte + 2)] : [texto];
  const letreros = Array.from({ length: Math.max(1, C.cantidadLetreros || 2) }, () =>
    el("div", { class: "letrero" }, lineas.map((l) => el("span", {}, l))));
  letreros.forEach((l) => $("#letreros").append(l));

  let orbita = null;
  function medirOrbita() {
    const pastel = $("#pastel");
    const piso3 = $(".piso-3");
    const w = escenario.clientWidth;
    const anchoLetrero = Math.max(...letreros.map((l) => l.offsetWidth));
    const altoLetrero = Math.max(...letreros.map((l) => l.offsetHeight));
    // Que el letrero nunca se salga de la pantalla, ni en el celular
    const margenPantalla = window.innerWidth / 2 - anchoLetrero / 2 - 10;
    orbita = {
      rx: Math.max(0, Math.min(w * 0.62, margenPantalla)),
      ry: w * 0.1,
      cy: pastel.offsetTop + piso3.offsetTop + piso3.offsetHeight * 0.3 - altoLetrero / 2
    };
  }
  window.addEventListener("resize", () => { orbita = null; });

  let girando = false;
  function girarLetreros() {
    if (girando) return;
    girando = true;
    const inicio = performance.now();
    const paso = (t) => {
      if (!escena.classList.contains("abierto")) { girando = false; return; }
      if (!orbita) medirOrbita();
      const seg = (t - inicio) / 1000;
      letreros.forEach((l, i) => {
        const ang = (reduceMotion ? 0 : seg * 0.5) + (i * 2 * Math.PI) / letreros.length + Math.PI / 2;
        const frente = Math.sin(ang);                   // 1 = delante del pastel, -1 = detrás
        const x = orbita.rx * Math.cos(ang);
        const y = orbita.cy + orbita.ry * frente + Math.sin(seg * 1.6 + i) * 6;
        const esc = 0.8 + 0.2 * (frente + 1) / 2;
        l.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), ${y.toFixed(1)}px) scale(${esc.toFixed(3)}) rotate(${(Math.cos(ang) * -4).toFixed(2)}deg)`;
        l.style.zIndex = frente > 0 ? 5 : 2;
        l.style.filter = frente > 0 ? "none" : "brightness(.8)";
      });
      if (!reduceMotion) requestAnimationFrame(paso);
      else girando = false;
    };
    requestAnimationFrame(paso);
  }

  /* ---------- Abrir y volver a envolver ---------- */
  let abierto = false;
  function abrir() {
    if (abierto) return;
    abierto = true;
    Musica.alAbrir();
    $("#sonido").hidden = C.musica === false;
    escena.classList.add("agitando");
    setTimeout(() => {
      escena.classList.remove("agitando");
      escena.classList.add("abierto");
      $("#intro-texto").textContent = textos.introAbierto;
      orbita = null;
      girarLetreros();
      setTimeout(() => {
        const r = $("#pastel").getBoundingClientRect();
        Confeti.lanzar(r.left + r.width / 2, r.top + r.height * 0.3, 70);
        setTimeout(() => Confeti.lanzar(r.left + r.width * 0.2, r.top + r.height * 0.5, 30, true), 250);
        setTimeout(() => Confeti.lanzar(r.left + r.width * 0.8, r.top + r.height * 0.5, 30, true), 450);
        pista.textContent = textos.pistaVelas;
      }, 1300);
      setTimeout(() => escena.classList.add("sin-caja"), 1800);
      setTimeout(() => $("#mensaje").classList.add("visible"), 2400);
    }, 550);
  }
  $("#regalo").addEventListener("click", abrir);

  function envolver() {
    abierto = false;
    Musica.parar();
    escena.classList.remove("abierto", "sin-caja");
    $("#intro-texto").textContent = textos.intro;
    $("#mensaje").classList.remove("visible");
    velas.forEach((v) => v.classList.remove("apagada"));
    $("#reencender").hidden = true;
    pista.textContent = textos.pistaCaja;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }
  $("#envolver").addEventListener("click", envolver);

  /* ---------- Soplar las velas ---------- */
  function soplar(v) {
    if (!abierto || v.classList.contains("apagada")) return;
    v.classList.add("apagada");
    const r = v.getBoundingClientRect();
    Confeti.lanzar(r.left + r.width / 2, r.top + r.height * 0.3, 14, true);
    if (velas.every((x) => x.classList.contains("apagada"))) {
      setTimeout(() => {
        Confeti.grande();
        pista.textContent = textos.deseo;
        $("#reencender").hidden = false;
      }, 600);
    }
  }
  $("#reencender").addEventListener("click", () => {
    velas.forEach((v) => v.classList.remove("apagada"));
    $("#reencender").hidden = true;
    pista.textContent = textos.pistaVelas;
  });

  /* ---------- "Cumpleaños feliz" en cajita musical (sin archivos de audio) ---------- */
  const Musica = (() => {
    const activa = C.musica !== false;
    const btn = $("#sonido");
    let ctx = null;
    let salida = null;
    let sonando = false;
    let fin = null;
    // [nota, tiempos] — melodía tradicional (dominio público)
    const MELODIA = [
      ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
      ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
      ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
      ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3]
    ];
    const frecuencia = (n) => {
      const [, letra, oct] = n.match(/([A-G])(\d)/);
      const semitono = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letra];
      return 440 * Math.pow(2, ((Number(oct) + 1) * 12 + semitono - 69) / 12);
    };
    function nota(f, t, dur) {
      const g = ctx.createGain();
      g.connect(salida);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0006, t + Math.max(0.7, dur * 1.8));
      [[1, "sine", 1], [2, "sine", 0.28], [3, "triangle", 0.08]].forEach(([mult, tipo, vol]) => {
        const o = ctx.createOscillator();
        const gv = ctx.createGain();
        o.type = tipo;
        o.frequency.value = f * mult;
        gv.gain.value = vol;
        o.connect(gv).connect(g);
        o.start(t);
        o.stop(t + Math.max(0.8, dur * 1.9));
      });
    }
    function tocar() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      salida = ctx.createGain();
      salida.gain.value = 0.9;
      salida.connect(ctx.destination);
      const pulso = 0.46;
      let t = ctx.currentTime + 0.15;
      for (let vuelta = 0; vuelta < 2; vuelta++) {
        MELODIA.forEach(([n, d]) => { nota(frecuencia(n), t, d * pulso); t += d * pulso; });
        t += pulso * 2;
      }
      sonando = true;
      actualizar();
      clearTimeout(fin);
      fin = setTimeout(() => { sonando = false; actualizar(); }, (t - ctx.currentTime) * 1000);
    }
    function parar() {
      if (salida && ctx) {
        salida.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        const vieja = salida;
        setTimeout(() => vieja.disconnect(), 600);
      }
      salida = null;
      sonando = false;
      clearTimeout(fin);
      actualizar();
    }
    function actualizar() {
      btn.classList.toggle("silencio", !sonando);
      btn.setAttribute("aria-label", sonando ? "Pausar la música" : "Tocar Cumpleaños feliz");
    }
    btn.addEventListener("click", () => (sonando ? parar() : tocar()));
    return {
      alAbrir() { if (activa) tocar(); },
      parar
    };
  })();

  /* ---------- Confeti ---------- */
  const HEART = typeof Path2D !== "undefined"
    ? new Path2D("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")
    : null;
  function dibujarCorazon(ctx, x, y, s, color, alpha, rot = 0) {
    if (!HEART || alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const k = s / 24;
    ctx.scale(k, k);
    ctx.translate(-12, -12);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill(HEART);
    ctx.restore();
  }
  function lienzo(cv) {
    const ctx = cv.getContext("2d");
    const tam = { W: 0, H: 0 };
    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      tam.W = window.innerWidth;
      tam.H = window.innerHeight;
      cv.width = tam.W * dpr;
      cv.height = tam.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();
    window.addEventListener("resize", ajustar);
    return { ctx, tam };
  }
  const COLORES = ["#d9303f", "#ff6b6b", "#a8102e", "#f6d0cc", "#e3c27e", "#ffffff", "#c9a24f"];

  const Confeti = (() => {
    const { ctx, tam } = lienzo($("#confeti"));
    const parts = [];
    let corriendo = false;
    let ultimo = 0;
    function lanzar(x, y, n, soloCorazones) {
      if (reduceMotion) return;
      const fuerte = n > 40;
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const v = (fuerte ? 240 : 130) + Math.random() * (fuerte ? 440 : 230);
        const r = Math.random();
        parts.push({
          x, y,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v - (fuerte ? 280 : 150),
          s: 6 + Math.random() * 9,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 10,
          c: COLORES[(Math.random() * COLORES.length) | 0],
          forma: soloCorazones || r < 0.3 ? "h" : r < 0.75 ? "r" : "c",
          vida: 0,
          dur: 1.8 + Math.random() * 1.5
        });
      }
      if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(frame); }
    }
    function frame(t) {
      const dt = Math.min((t - ultimo) / 1000, 0.05);
      ultimo = t;
      ctx.clearRect(0, 0, tam.W, tam.H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vida += dt;
        p.vy += 480 * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const a = 1 - p.vida / p.dur;
        if (a <= 0 || p.y > tam.H + 40) { parts.splice(i, 1); continue; }
        if (p.forma === "h") dibujarCorazon(ctx, p.x, p.y, p.s * 1.7, p.c, a, p.rot * 0.15);
        else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.c;
          if (p.forma === "r") ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
          else { ctx.beginPath(); ctx.arc(0, 0, p.s / 3, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        }
      }
      if (parts.length) requestAnimationFrame(frame);
      else { corriendo = false; ctx.clearRect(0, 0, tam.W, tam.H); }
    }
    function grande() {
      lanzar(tam.W * 0.2, tam.H * 0.6, 60);
      setTimeout(() => lanzar(tam.W * 0.8, tam.H * 0.6, 60), 220);
      setTimeout(() => lanzar(tam.W * 0.5, tam.H * 0.4, 70), 440);
    }
    return { lanzar, grande };
  })();

  /* ---------- Fondo: destellos siempre, confeti suave cayendo al abrir ---------- */
  (function fondo() {
    if (reduceMotion) return;
    const { ctx, tam } = lienzo($("#fx"));
    const R = (a, b) => a + Math.random() * (b - a);
    const movil = tam.W < 700;
    const brillo = () => ({ t: "b", x: R(0, tam.W), y: R(0, tam.H), s: R(1, 2.2), vida: 0, dur: R(3, 7) });
    const papel = (inicial) => ({
      t: "p", x: R(0, tam.W), y: inicial ? R(-tam.H, 0) : R(-60, -20),
      s: R(5, 10), vy: R(35, 70), vx: R(-12, 12), rot: R(0, 6.28), vr: R(-3, 3), fase: R(0, 6.28),
      c: COLORES[(Math.random() * COLORES.length) | 0]
    });
    const parts = [];
    for (let i = 0; i < (movil ? 14 : 26); i++) { const b = brillo(); b.vida = R(0, b.dur); parts.push(b); }
    let hayPapeles = false;
    let ultimo = performance.now();
    function frame(t) {
      const dt = Math.min((t - ultimo) / 1000, 0.05);
      ultimo = t;
      ctx.clearRect(0, 0, tam.W, tam.H);
      const abiertoAhora = escena.classList.contains("abierto");
      if (abiertoAhora && !hayPapeles) {
        for (let i = 0; i < (movil ? 16 : 30); i++) parts.push(papel(true));
        hayPapeles = true;
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.t === "b") {
          p.vida += dt;
          if (p.vida > p.dur) Object.assign(p, brillo());
          const a = Math.sin((Math.PI * p.vida) / p.dur) * 0.8;
          if (a <= 0) continue;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = a;
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.s * 6);
          g.addColorStop(0, "rgba(255,236,200,.8)");
          g.addColorStop(1, "rgba(255,236,200,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.s * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          if (!abiertoAhora) { parts.splice(i, 1); continue; }
          p.fase += dt;
          p.y += p.vy * dt;
          p.x += (p.vx + Math.sin(p.fase * 2) * 20) * dt;
          p.rot += p.vr * dt;
          if (p.y > tam.H + 20) Object.assign(p, papel(false));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.abs(Math.sin(p.fase * 3)) * 0.8 + 0.2);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
          ctx.restore();
        }
      }
      if (!abiertoAhora) hayPapeles = false;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();
})();
