/* ═══════════════════════════════════════════════════════════════════════════
   Casa María · «Un solo trazo»
   La línea de cobre de su logo no se corta: dibuja la casa en la cortina,
   firma «Casa María», abre la casa como una ventana hacia el hero, enmarca
   las fotos con la forma del tejado, baja por la página como un hilo,
   dibuja la casa por dentro y cierra la casa de la tarjeta de contacto.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue (la casa encendida, las cifras,
   la foto de la ventana que se elige); lo que se apaga es el viaje.

   Las opiniones viven en js/opiniones.js: este archivo no depende de él.
   Todos los trazos que GSAP anima con pathLength="1" llevan autoRound:false
   (si no, GSAP redondea 1px → 0px y el trazo aparece de golpe).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  if (gsapReady) gsap.registerPlugin(ST);
  html.classList.add(movimiento ? 'con-movimiento' : 'sin-movimiento');

  /* lo mismo que data/config.json, por si el JSON no llega (abierto con doble clic) */
  var CONFIG = {
    telefono: '685 875 949', telefonoEnlace: '+34685875949',
    email: 'casamaria.olivenza@gmail.com', whatsapp: null,
    booking: 'https://www.booking.com/hotel/es/casa-maria-olivenza.es.html'
  };
  var CASA_LOGO = [[148.6, 209], [148.6, 96.6], [248.5, 24], [349.4, 98.2], [349.4, 209]];   /* silueta cerrada */
  var CENTRO_LOGO = [249, 118];

  function $(s, r) { return (r || document).querySelector(s); }
  function todos(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function densidad() { return html.classList.contains('densidad-sobria') ? 'sobria' : 'trazo'; }
  function esMovil() { return window.matchMedia('(max-width: 860px)').matches; }
  function alturaCabecera() { var c = $('#cabecera'); return c ? c.offsetHeight : 72; }
  function refrescar() { if (ST) ST.refresh(); }
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esperar(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function cuandoVisible(nodos, umbral, alEntrar, margen) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral, rootMargin: margen || '0px' });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  window.CasaMaria = window.CasaMaria || {};
  window.CasaMaria.densidad = densidad;
  window.CasaMaria.movimiento = movimiento;

  /* ───────────────────────── fotos: data/fotos.json ───────────────────────── */
  var promesaFotos = null;
  function cargarFotos() {
    if (!promesaFotos) {
      promesaFotos = (window.fetch ? fetch('data/fotos.json') : Promise.reject())
        .then(function (r) { if (!r.ok) throw new Error('fotos'); return r.json(); })
        .then(function (d) { var m = {}; d.fotos.forEach(function (f) { m[f.id] = f; }); return m; });
    }
    return promesaFotos;
  }
  function picture(f, sizes, carga, alt) {
    var set = function (ext) { return f.anchos.map(function (a) { return 'assets/fotos/' + f.id + '-' + a + '.' + ext + ' ' + a + 'w'; }).join(', '); };
    var mayor = f.anchos[f.anchos.length - 1];
    var p = document.createElement('picture');
    ['avif', 'webp'].forEach(function (ext) {
      var s = document.createElement('source');
      s.type = 'image/' + ext; s.srcset = set(ext); s.sizes = sizes; p.appendChild(s);
    });
    var img = document.createElement('img');
    img.src = 'assets/fotos/' + f.id + '-' + mayor + '.jpg';
    img.srcset = set('jpg'); img.sizes = sizes;
    img.width = mayor; img.height = Math.round(f.h * mayor / f.w);
    img.alt = alt == null ? f.alt : alt;
    img.decoding = 'async';
    if (carga !== 'eager') img.loading = 'lazy';
    p.appendChild(img);
    return p;
  }

  if (window.fetch) {
    fetch('data/config.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (!c) return;
      Object.keys(CONFIG).forEach(function (k) { if (k in c) CONFIG[k] = c[k]; });
      document.dispatchEvent(new CustomEvent('config-cargada'));
    }).catch(function () {});
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }
  window.CasaMaria.lenis = lenis;

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    if (destino === 0) { if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo(0, 0); return; }
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.5 }); return; }
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id === '#inicio' ? 0 : id);
  });

  /* ───────────────────── titulares partidos (char-reveal) ───────────────────── */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', texto);
    var piezas = [];
    function trocear(cadena, destino) {
      cadena.split(/(\s+)/).forEach(function (trozo) {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { destino.appendChild(document.createTextNode(' ')); return; }
        var caja = document.createElement('span');
        caja.className = 'palabra';
        caja.setAttribute('aria-hidden', 'true');
        if (modo === 'letras') {
          Array.from(trozo).forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'letra'; s.textContent = c;
            caja.appendChild(s); piezas.push(s);
          });
        } else {
          var s = document.createElement('span');
          s.className = 'palabra-int'; s.textContent = trozo;
          caja.appendChild(s); piezas.push(s);
        }
        destino.appendChild(caja);
      });
    }
    var hijos = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    hijos.forEach(function (n) {
      if (n.nodeType === 3) { trocear(n.textContent, el); return; }
      if (n.nodeType === 1) {
        var envoltura = n.cloneNode(false);
        envoltura.setAttribute('aria-hidden', 'true');
        el.appendChild(envoltura);
        trocear(n.textContent, envoltura);
      }
    });
    return piezas;
  }
  function revelar(el, piezas, retardo) {
    var letras = el.dataset.revelar === 'letras';
    gsap.to(piezas, {
      y: 0, yPercent: 0, duration: 1.15, ease: 'expo.out', delay: retardo || 0,
      stagger: letras ? Math.min(0.028, 1.1 / piezas.length) : 0.07
    });
  }

  /* ─────────────────── la cortina: avisar del momento de apertura ─────────────────── */
  var cortinaAbierta = false;
  function avisarApertura() {
    if (cortinaAbierta) return;
    cortinaAbierta = true;
    document.dispatchEvent(new CustomEvent('cortina-abre'));
  }
  function alAbrirse(fn) { if (cortinaAbierta) fn(); else document.addEventListener('cortina-abre', fn, { once: true }); }
  window.CasaMaria.alAbrirse = alAbrirse;

  todos('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) { alAbrirse(function () { revelar(el, piezas, 0.35); }); return; }
    /* una sola vez: IntersectionObserver (ScrollTrigger once:true no dispara si ya está en pantalla) */
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ═══════════════ cortina: el trazo que firma y se abre ═══════════════ */
  (function cortina() {
    var cort = $('#cortina');
    var heroLogo = $('#hero-logo');
    if (!cort) { avisarApertura(); return; }
    var hecho = false;

    function retirar() {
      if (hecho) return;
      hecho = true;
      avisarApertura();
      if (heroLogo) heroLogo.classList.remove('es-esperando');
      cort.classList.add('fuera');
      html.classList.add('cortina-fuera');
      /* con Lenis, lagSmoothing(0) al retirarla, nunca antes (el tirón de la carga saltaría el trazo) */
      if (gsapReady) gsap.ticker.lagSmoothing(0);
      refrescar();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }
    window.CasaMaria.retirarCortina = retirar;

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 0 : 60);
      return;
    }

    var muro = $('#cortina-muro'), muroD = $('#cortina-muro-d');
    var caja = $('#cortina-logo'), lugar = $('#cortina-lugar');
    var logoHero = $('#logo-hero');
    heroLogo.classList.add('es-esperando');

    /* clon del logo del hero: ids renombrados y url(#…) actualizados */
    var clon = logoHero.cloneNode(true);
    clon.removeAttribute('id');
    clon.removeAttribute('role');
    clon.removeAttribute('aria-labelledby');
    clon.setAttribute('aria-hidden', 'true');
    var titulo = clon.querySelector('title'); if (titulo) titulo.remove();
    var mapa = {};
    todos('[id]', clon).forEach(function (n) { mapa[n.id] = n.id + '-cortina'; n.id = mapa[n.id]; });
    todos('*', clon).forEach(function (n) {
      ['mask', 'clip-path', 'fill', 'filter'].forEach(function (a) {
        var v = n.getAttribute(a);
        if (v && v.indexOf('url(#') === 0) {
          var id = v.slice(5, -1);
          if (mapa[id]) n.setAttribute(a, 'url(#' + mapa[id] + ')');
        }
      });
    });
    caja.appendChild(clon);
    var casa = clon.querySelector('.logo-svg__casa');
    var trazos = todos('.firma__trazo', clon);
    gsap.set(casa, { strokeDasharray: '1 1', strokeDashoffset: 1 });
    gsap.set(trazos, { strokeDasharray: '1 1', strokeDashoffset: 1, opacity: 0 });

    /* el muro: un rectángulo con la silueta de la casa como agujero (evenodd) */
    var w = 0, h = 0;
    var hueco = { x: 0, y: 0, s: 0 };
    function pintarMuro() {
      var d = 'M0 0H' + w + 'V' + h + 'H0Z';
      if (hueco.s > 0.0005) {
        d += 'M' + CASA_LOGO.map(function (p) {
          return (hueco.x + (p[0] - CENTRO_LOGO[0]) * hueco.s).toFixed(1) + ' ' + (hueco.y + (p[1] - CENTRO_LOGO[1]) * hueco.s).toFixed(1);
        }).join('L') + 'Z';
      }
      muroD.setAttribute('d', d);
    }
    function medir() {
      w = window.innerWidth; h = window.innerHeight;
      muro.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      pintarMuro();
    }
    medir();
    cort.classList.add('cortina--pintada');       /* ya hay muro: el fondo provisional se quita */
    window.addEventListener('resize', medir);

    var inicio = null, k = 1, sMax = 1;
    function prepararApertura() {
      var r = caja.getBoundingClientRect();
      inicio = r;
      k = r.width / 460;
      hueco.x = r.left + CENTRO_LOGO[0] * k;
      hueco.y = r.top + CENTRO_LOGO[1] * k;
      sMax = (Math.max(w, h) / 200) * 4.2;
    }
    var vuelo = { p: 0 };
    function volar() {
      if (!inicio) return;
      var t = logoHero.getBoundingClientRect();
      var esc = 1 + (t.width / inicio.width - 1) * vuelo.p;
      var x = (t.left - inicio.left) * vuelo.p, y = (t.top - inicio.top) * vuelo.p;
      caja.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + esc.toFixed(4) + ')';
    }
    function aterrizar() {
      /* medida para verificar.mjs: el clon tiene que acabar encima del logo real */
      var a = caja.getBoundingClientRect(), b = logoHero.getBoundingClientRect();
      window.CasaMaria.aterrizaje = { dx: Math.abs(a.left - b.left), dy: Math.abs(a.top - b.top), dw: Math.abs(a.width - b.width) };
      heroLogo.classList.remove('es-esperando');
      caja.style.opacity = '0';
    }

    var T_TRAZO = 0.08, D_TRAZO = 0.82;
    var T_FIRMA = T_TRAZO + D_TRAZO - 0.12, D_FIRMA = 1.0;
    var T_AP = T_FIRMA + D_FIRMA + 0.12;
    var tl = gsap.timeline({ paused: true, onComplete: retirar });
    window.CasaMaria.cortina = { get tl() { return tl; } };

    /* 1 · la casa, de un solo trazo: pared, tejado, chimenea, tejado, pared */
    tl.to(casa, { strokeDashoffset: 0, duration: D_TRAZO, ease: 'power2.inOut', autoRound: false }, T_TRAZO);
    /* 2 · la firma sigue su esqueleto, sin pausa; cada trazo dura lo que mide */
    var largos = trazos.map(function (t) { return parseFloat(t.getAttribute('data-largo')) || 50; });
    var suma = largos.reduce(function (a, b) { return a + b; }, 0);
    var t0 = T_FIRMA;
    trazos.forEach(function (tr, i) {
      var d = D_FIRMA * largos[i] / suma / 0.88;
      tl.set(tr, { opacity: 1 }, t0);
      tl.to(tr, { strokeDashoffset: 0, duration: d, ease: 'power1.inOut', autoRound: false }, t0);
      t0 += d * 0.88;
    });
    /* 3 · «Olivenza» asienta el espaciado */
    tl.fromTo(lugar, { letterSpacing: '.9em', opacity: 0 }, { letterSpacing: '.34em', opacity: 1, duration: 0.85, ease: 'expo.out', immediateRender: false }, T_FIRMA + 0.5);
    /* 4 · la casa se vuelve ventana: el agujero crece hasta el contorno… */
    tl.call(prepararApertura, null, T_AP - 0.01)
      .call(avisarApertura, null, T_AP)
      .to(hueco, { s: function () { return k; }, duration: 0.32, ease: 'power2.out', onUpdate: pintarMuro }, T_AP)
      .to(caja, { '--tinta-logo': '#825A50', duration: 0.75, ease: 'power1.inOut' }, T_AP)
      .to(lugar, { opacity: 0, y: 12, duration: 0.3, ease: 'power2.in' }, T_AP + 0.15)
    /* …y se abre del todo mientras el logo vuela a su sitio en el hero */
      .to(hueco, { s: function () { return sMax; }, duration: 1.0, ease: 'expo.inOut', onUpdate: pintarMuro }, T_AP + 0.3)
      .to(vuelo, { p: 1, duration: 1.0, ease: 'expo.inOut', onUpdate: volar, onComplete: aterrizar }, T_AP + 0.3);

    /* arranca enseguida: el logo es SVG y no espera a la letra (como mucho 450 ms) */
    var arrancada = false;
    function arrancar() { if (!arrancada) { arrancada = true; tl.play(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 450);

    /* quien empieza a bajar no espera: la cortina acelera, no se corta */
    function prisa() { if (!hecho) tl.timeScale(3); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });

    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(function () { if (!hecho) { aterrizar(); retirar(); } }, 6000);
  })();

  /* ═══════════════ hero: ventana con forma de casa ═══════════════ */
  (function hero() {
    var seccion = $('#inicio');
    var ventana = $('#ventana');
    if (!seccion || !ventana) return;
    var trazo = $('#ventana-trazo');
    var svg = trazo.ownerSVGElement;
    var fotosCaja = $('#ventana-fotos');
    var fotos = todos('.ventana__foto', ventana);
    var puntos = todos('#ventana-puntos button');

    /* el contorno se dibuja en píxeles reales: con viewBox estirado, pathLength se rompe */
    function trazarVentana() {
      var W = ventana.clientWidth, H = ventana.clientHeight;
      if (!W || !H) return;
      var alero = 0.37 * W, cx = 0.172 * W;
      var yc = alero * (1 - 2 * 0.172), tope = yc - 0.197 * W;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      trazo.setAttribute('d', 'M0 ' + H + 'V' + alero.toFixed(1) + 'L' + cx.toFixed(1) + ' ' + yc.toFixed(1) +
        'V' + tope.toFixed(1) + 'V' + yc.toFixed(1) + 'L' + (W / 2).toFixed(1) + ' 0L' + W + ' ' + alero.toFixed(1) + 'V' + H);
    }
    trazarVentana();
    if ('ResizeObserver' in window) new ResizeObserver(trazarVentana).observe(ventana);
    window.addEventListener('resize', esperar(trazarVentana, 120));

    /* fotos en fundido lento, una cada ~5 s; los puntos eligen y detienen el pase */
    var actual = 0, temporizador = null, parado = reduce, encima = false;
    function mostrar(i) {
      actual = (i + fotos.length) % fotos.length;
      fotos.forEach(function (f, k) { f.classList.toggle('es-activa', k === actual); });
      puntos.forEach(function (p, k) { p.setAttribute('aria-pressed', k === actual ? 'true' : 'false'); });
    }
    function programar() {
      clearTimeout(temporizador);
      if (parado) return;
      temporizador = setTimeout(function () { if (!encima && !document.hidden) mostrar(actual + 1); programar(); }, 5200);
    }
    puntos.forEach(function (p, k) { p.addEventListener('click', function () { parado = true; clearTimeout(temporizador); mostrar(k); }); });
    ventana.addEventListener('pointerenter', function () { encima = true; });
    ventana.addEventListener('pointerleave', function () { encima = false; });
    ventana.addEventListener('focusin', function () { encima = true; });
    ventana.addEventListener('focusout', function () { encima = false; });
    alAbrirse(programar);
    window.CasaMaria.ventana = { mostrar: mostrar, get actual() { return actual; } };

    if (!movimiento) return;
    var marco = ventana.querySelector('.ventana__marco');
    var resto = todos('.hero__datos li, .hero__acciones > *, .ventana__puntos', seccion);
    gsap.set(trazo, { strokeDashoffset: 1 });
    gsap.set(marco, { opacity: 0 });
    gsap.set(fotosCaja, { scale: 1.12 });
    gsap.set(resto, { opacity: 0, y: 18 });
    alAbrirse(function () {
      gsap.to(trazo, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', autoRound: false, delay: 0.25 });
      gsap.to(marco, { opacity: 1, duration: 1.1, ease: 'power2.out', delay: 0.55 });
      gsap.to(fotosCaja, { scale: 1, duration: 2.2, ease: 'expo.out', delay: 0.55 });
      gsap.to(resto, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.75 });
    });
    /* paralaje suave dentro de la máscara */
    gsap.fromTo(fotosCaja, { yPercent: -3 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: seccion, start: 'top top', end: 'bottom top', scrub: true }
    });
  })();

  /* ═══════════════ el hilo: un único path generado desde las anclas ═══════════════ */
  var hilo = (function () {
    var svg = $('#hilo'), path = $('#hilo-d'), main = $('#contenido'), hero = $('#inicio');
    if (!svg || !path || !main) return { construir: function () {} };
    var tramos = [], total = 0, listo = false;

    function caja(el) {
      var r = el.getBoundingClientRect(), m = main.getBoundingClientRect();
      return { l: r.left - m.left, t: r.top - m.top, r: r.right - m.left, b: r.bottom - m.top, w: r.width, h: r.height };
    }
    function visible(el) { return el.offsetParent !== null && el.getBoundingClientRect().height > 0; }
    function n(v) { return Math.round(v * 10) / 10; }

    function construir() {
      listo = false;
      if (densidad() !== 'trazo') return;
      var W = main.clientWidth, H = main.scrollHeight;
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var movil = esMovil();
      var margen = parseFloat(getComputedStyle(hero).paddingLeft) || 16;
      var xIzq = movil ? 8 : Math.max(14, margen - 34);
      var xDer = movil ? 8 : Math.min(W - 14, W - margen + 34);

      /* nace donde acaba la pared derecha de la ventana del hero (en móvil, la izquierda) */
      var vent = $('#ventana');
      var vc = caja(vent || hero);
      var cur = movil ? [xIzq, vc.b] : [vc.r, vc.b];
      var d = 'M' + n(cur[0]) + ' ' + n(cur[1]);
      tramos = [];
      function empuja(trozo, ya, yb, fin) {
        tramos.push({ ini: cur.slice(), d: trozo, ya: ya, yb: Math.max(ya + 1, yb) });
        d += trozo; cur = fin;
      }
      /* curva con tangentes verticales (baja «colgando») */
      function bajar(x, y) {
        var dy = Math.max(30, (y - cur[1]) * 0.5);
        empuja('C' + n(cur[0]) + ' ' + n(cur[1] + dy) + ' ' + n(x) + ' ' + n(y - dy) + ' ' + n(x) + ' ' + n(y), cur[1], y, [x, y]);
      }

      todos('[data-hilo]', main).forEach(function (el) {
        if (!visible(el)) return;
        var tipo = el.getAttribute('data-hilo');
        var c = caja(el);
        if (tipo === 'izq' || tipo === 'der') {
          var x = tipo === 'izq' ? xIzq : xDer;
          var y1 = c.t + Math.min(90, c.h * 0.15), y2 = c.b - Math.min(90, c.h * 0.15);
          bajar(x, y1);
          empuja('L' + n(x) + ' ' + n(y2), y1, y2, [x, y2]);
        } else if (tipo === 'marco') {
          /* el marco es la casa entera alrededor de la foto: baja por el lado de la foto que da al
             margen (cruzando la página por el hueco entre secciones, nunca por encima del texto),
             sigue la pared hasta abajo, el suelo, la otra pared, el tejado y vuelve al alero */
          var foto = el.querySelector('.marco__foto') || el;
          var f = caja(foto);
          var sc = caja(el.closest('section') || el);
          var o = movil ? 8 : 14;
          var L = f.l - o, R = f.r + o, B = f.b + o, T = f.t - o * 1.35;
          var alero = f.t + 0.37 * f.w - o * 0.35, cx = (f.l + f.r) / 2;
          var derecha = !movil && cx > W / 2;
          var X0 = derecha ? R : L, X1 = derecha ? L : R;
          var entrada = movil ? alero - 40 : Math.min(alero - 30, sc.t + 90);
          bajar(X0, entrada);
          empuja('V' + n(alero), entrada, T, [X0, alero]);
          empuja('V' + n(B) + 'H' + n(X1) + 'V' + n(alero) + 'L' + n(cx) + ' ' + n(T) + 'L' + n(X0) + ' ' + n(alero), T, B, [X0, alero]);
        } else if (tipo === 'fin') {
          /* entra por la chimenea de la casa de la tarjeta (la casa la dibuja su propio trazo) */
          var svgT = el.querySelector('svg') || el;
          var s = caja(svgT), kk = s.w / 460;
          var px = s.l + 183.1 * kk, py = s.t + 32 * kk;
          bajar(px, py - 70);
          empuja('V' + n(py + 3), py - 70, py, [px, py + 3]);
        }
      });
      path.setAttribute('d', d);
      /* largo de cada tramo, midiéndolo con un path de prueba */
      var prueba = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(prueba);
      var acum = 0;
      tramos.forEach(function (t) {
        prueba.setAttribute('d', 'M' + n(t.ini[0]) + ' ' + n(t.ini[1]) + t.d);
        var L = prueba.getTotalLength();
        t.L0 = acum; acum += L; t.L1 = acum;
      });
      svg.removeChild(prueba);
      total = acum;
      listo = total > 0;
      actualizar(true);
    }

    function fraccion() {
      var m = main.getBoundingClientRect();
      var cabeza = window.innerHeight * 0.66 - m.top;
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.pageYOffset >= maxScroll - 4) return 1;
      var L = 0;
      for (var i = 0; i < tramos.length; i++) {
        var t = tramos[i];
        if (cabeza >= t.yb) { L = t.L1; continue; }
        if (cabeza > t.ya) L = t.L0 + (t.L1 - t.L0) * (cabeza - t.ya) / (t.yb - t.ya);
        break;
      }
      return total ? L / total : 0;
    }
    function actualizar(inmediato) {
      if (!listo) return;
      if (!movimiento) { path.style.strokeDashoffset = '0'; return; }
      var off = 1 - fraccion();
      if (inmediato === true) gsap.set(path, { strokeDashoffset: off });
      else gsap.to(path, { strokeDashoffset: off, duration: 0.6, ease: 'power3.out', overwrite: true, autoRound: false });
    }
    if (lenis) lenis.on('scroll', actualizar);
    else window.addEventListener('scroll', actualizar, { passive: true });

    var reconstruir = esperar(construir, 160);
    window.addEventListener('resize', reconstruir);
    if ('ResizeObserver' in window) new ResizeObserver(reconstruir).observe(main);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reconstruir);
    if (ST) ST.addEventListener('refresh', reconstruir);
    document.addEventListener('densidad-cambiada', reconstruir);
    document.addEventListener('cortina-retirada', reconstruir);
    construir();
    window.CasaMaria.hilo = { construir: construir, get total() { return total; }, get tramos() { return tramos; }, fraccion: fraccion };
    return { construir: construir };
  })();

  /* ───────────────── cifras que cuentan al entrar ───────────────── */
  function formatear(v, dec) { return dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v)); }
  function contar(el) {
    var fin = parseFloat(el.getAttribute('data-contar'));
    var dec = parseInt(el.getAttribute('data-decimales') || '0', 10);
    if (!movimiento) { el.textContent = formatear(fin, dec); return; }
    var t0 = null, dur = 1500;
    (function paso(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 4);
      el.textContent = formatear(fin * e, dec);
      if (k < 1) requestAnimationFrame(paso);
    })(performance.now());
  }
  window.CasaMaria.contar = contar;
  var cifras = todos('[data-contar]').filter(function (el) { return !el.closest('[data-modulo="opiniones"]'); });
  if (movimiento) cifras.forEach(function (el) { el.textContent = formatear(0, parseInt(el.getAttribute('data-decimales') || '0', 10)); });
  cuandoVisible(cifras, 0.6, contar);

  /* ───────────────── inventario: el hilo subraya cada línea ───────────────── */
  cuandoVisible(todos('.inventario li'), 0.7, function (li) { li.classList.add('es-visible'); });

  /* ───────────────── la casa de la tarjeta: la cierra el trazo ───────────────── */
  (function tarjeta() {
    var chim = $('#tarjeta-chimenea'), izq = $('#tarjeta-izq'), der = $('#tarjeta-der');
    var logo = $('.tarjeta__logo');
    if (!chim || !movimiento) return;
    gsap.set([chim, izq, der], { strokeDashoffset: 1 });
    var tl = gsap.timeline({ paused: true });
    tl.to(chim, { strokeDashoffset: 0, duration: 0.18, ease: 'none', autoRound: false }, 0)
      .to(izq, { strokeDashoffset: 0, duration: 0.3, ease: 'power1.out', autoRound: false }, 0.18)
      .to(der, { strokeDashoffset: 0, duration: 0.82, ease: 'power1.inOut', autoRound: false }, 0.18);
    ST.create({ trigger: logo, start: 'top 64%', end: 'top 26%', scrub: 0.6, animation: tl });
    window.CasaMaria.tarjetaTl = tl;
  })();

  /* ═══════════════ galería de una estancia (dialog) ═══════════════ */
  var galeria = (function () {
    var dlg = $('#galeria');
    if (!dlg || typeof dlg.showModal !== 'function') return null;
    var nombre = $('#galeria-nombre'), cuenta = $('#galeria-cuenta'), figura = $('#galeria-figura');
    var minis = $('#galeria-miniaturas'), equipo = $('#galeria-equipo');
    var lista = [], i = 0, origen = null, fotos = {};

    function pintar() {
      var f = fotos[lista[i]];
      figura.textContent = '';
      if (f) figura.appendChild(picture(f, '(max-width: 860px) 100vw, 1000px', 'eager'));
      cuenta.textContent = 'Foto ' + (i + 1) + ' de ' + lista.length;
      todos('button', minis).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      var activa = minis.children[i];
      if (activa && activa.scrollIntoView) activa.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function ir(d) { if (!lista.length) return; i = (i + d + lista.length) % lista.length; pintar(); }
    function abrir(titulo, ids, inicio, equipamiento, desde) {
      return cargarFotos().then(function (m) {
        fotos = m;
        lista = ids.filter(function (id) { return m[id]; });
        i = limitar(inicio || 0, 0, lista.length - 1);
        origen = desde || document.activeElement;
        nombre.textContent = titulo;
        equipo.textContent = '';
        (equipamiento || []).forEach(function (e) { var li = document.createElement('li'); li.textContent = e; equipo.appendChild(li); });
        equipo.hidden = !(equipamiento && equipamiento.length);
        minis.textContent = '';
        lista.forEach(function (id, k) {
          var li = document.createElement('li');
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Foto ' + (k + 1) + ': ' + m[id].alt);
          b.appendChild(picture(m[id], '52px', 'lazy', ''));
          b.addEventListener('click', function () { i = k; pintar(); });
          li.appendChild(b); minis.appendChild(li);
        });
        pintar();
        if (!dlg.open) dlg.showModal();
        if (lenis) lenis.stop();
        $('#galeria-sig').focus({ preventScroll: true });
      });
    }
    $('#galeria-ant').addEventListener('click', function () { ir(-1); });
    $('#galeria-sig').addEventListener('click', function () { ir(1); });
    $('#galeria-cerrar').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      if (lenis) lenis.start();
      if (origen && origen.focus) origen.focus({ preventScroll: true });
    });
    /* deslizar con el dedo */
    var x0 = null;
    figura.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    figura.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
    });
    var api = { abrir: abrir, get indice() { return i; }, get lista() { return lista.slice(); } };
    window.CasaMaria.galeria = api;
    return api;
  })();

  /* ═══════════════ 3 · la casa abierta, pintada desde data/casa.json ═══════════════ */
  (function casaAbierta() {
    var seccion = $('#casa-abierta');
    if (!seccion || !window.fetch) return;
    var corte = $('#corte'), lineas = $('#corte-lineas'), celdasCaja = $('#corte-celdas');
    var humo = seccion.querySelector('.corte__humo');
    var noche = $('#abierta-noche');
    var pNum = $('#panel-num'), pNombre = $('#panel-nombre'), pResumen = $('#panel-resumen');
    var pLista = $('#panel-lista'), pVer = $('#panel-ver'), pMarcas = $('#panel-marcas');
    var pestanas = $('#abierta-pestanas'), listaMovil = $('#abierta-lista');
    var datos = null, fotos = {}, estancias = [], porOrden = [], celdas = {}, fichas = {}, tabs = {};
    var disparo = null, observador = null, obsNoche = null, modoActual = '', seleccion = -1, encendidas = 0;

    /* geometría del corte (viewBox 1000 × 760): la casa del logo, con sus proporciones */
    var G = { x0: 170, x1: 730, suelo: 720, forjado: 470, alero: 230, cima: 23, patioX1: 950, patioTecho: 560 };
    var pend = (G.alero - G.cima) / ((G.x1 - G.x0) / 2);
    var chimX = G.x0 + 0.172 * (G.x1 - G.x0), chimBase = G.alero - pend * (chimX - G.x0), chimTope = chimBase - 0.197 * (G.x1 - G.x0);
    var MURO_D = 'M' + G.x0 + ' ' + G.suelo + 'V' + G.alero + 'L' + chimX.toFixed(1) + ' ' + chimBase.toFixed(1) + 'V' + chimTope.toFixed(1) +
      'V' + chimBase.toFixed(1) + 'L' + ((G.x0 + G.x1) / 2) + ' ' + G.cima + 'L' + G.x1 + ' ' + G.alero + 'V' + G.suelo;

    function filas() {
      var porPlanta = { alta: [], baja: [], patio: [] };
      estancias.forEach(function (e) { (porPlanta[e.planta] || porPlanta.baja).push(e); });
      var rects = {}, tabiques = [];
      function repartir(lista, x0, x1, y0, y1) {
        var total = lista.reduce(function (a, e) { return a + (e.peso || 1); }, 0), x = x0;
        lista.forEach(function (e, i) {
          var ancho = (x1 - x0) * (e.peso || 1) / total;
          rects[e.id] = { x: x + 5, y: y0 + 5, w: ancho - 10, h: y1 - y0 - 10 };
          x += ancho;
          if (i < lista.length - 1) tabiques.push([x, y0, x, y1]);
        });
      }
      repartir(porPlanta.alta, G.x0, G.x1, G.alero, G.forjado);
      repartir(porPlanta.baja, G.x0, G.x1, G.forjado, G.suelo);
      repartir(porPlanta.patio, G.x1, G.patioX1, G.patioTecho, G.suelo);
      return { rects: rects, tabiques: tabiques };
    }

    function dibujarLineas(tabiques) {
      var ns = 'http://www.w3.org/2000/svg';
      lineas.textContent = '';
      function linea(cls, d, extra) {
        var p = document.createElementNS(ns, 'path');
        p.setAttribute('class', cls); p.setAttribute('d', d);
        if (extra) Object.keys(extra).forEach(function (k) { p.setAttribute(k, extra[k]); });
        lineas.appendChild(p); return p;
      }
      linea('suelo', 'M110 ' + G.suelo + 'H990');
      linea('patio-linea', 'M' + G.x1 + ' ' + G.patioTecho + 'H' + G.patioX1 + 'V' + G.suelo);
      linea('tabique', 'M' + G.x0 + ' ' + G.forjado + 'H' + G.x1);
      tabiques.forEach(function (t) { linea('tabique', 'M' + t[0].toFixed(1) + ' ' + t[1] + 'V' + t[3]); });
      var muro = linea('muro', MURO_D, { pathLength: '1', id: 'corte-muro' });
      var placa = document.createElementNS(ns, 'text');
      placa.setAttribute('class', 'placa'); placa.setAttribute('x', (G.x0 + G.x1) / 2); placa.setAttribute('y', G.alero - 26);
      placa.setAttribute('text-anchor', 'middle'); placa.textContent = 'C/ La Higuera, 13';
      lineas.appendChild(placa);
      humo.style.left = (chimX / 10) + '%';
      humo.style.top = (chimTope / 7.6) + '%';
      return muro;
    }

    var muro = null;
    function crearCeldas() {
      var g = filas();
      muro = dibujarLineas(g.tabiques);
      celdasCaja.textContent = '';
      estancias.forEach(function (e) {
        var r = g.rects[e.id];
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'celda';
        b.setAttribute('data-estancia', e.id);
        b.setAttribute('data-planta', e.planta);
        b.setAttribute('aria-label', e.nombre + ': ver sus ' + e.fotos.length + ' fotos');
        b.style.left = (r.x / 10) + '%';
        b.style.top = (r.y / 7.6) + '%';
        b.style.width = (r.w / 10) + '%';
        b.style.height = (r.h / 7.6) + '%';
        var f = fotos[e.portada || e.fotos[0]];
        if (f) b.appendChild(picture(f, '(max-width: 860px) 30vw, 16vw', 'lazy', ''));
        var s = document.createElement('span');
        s.className = 'celda__nombre'; s.textContent = e.corto || e.nombre; s.setAttribute('aria-hidden', 'true');
        b.appendChild(s);
        b.addEventListener('click', function () { seleccionar(e.indice); abrirGaleria(e, b); });
        ['pointerenter', 'focus'].forEach(function (ev) {
          b.addEventListener(ev, function () { if (modoActual === 'quieta') mostrar(e.indice); });
        });
        celdasCaja.appendChild(b);
        celdas[e.id] = b;
      });
      marcarPequenas();
    }
    function marcarPequenas() {
      estancias.forEach(function (e) {
        var c = celdas[e.id];
        if (c) c.classList.toggle('es-pequena', c.offsetWidth < 92 || c.offsetHeight < 46);
      });
    }

    function crearMarcas() {
      pMarcas.textContent = '';
      porOrden.forEach(function () { pMarcas.appendChild(document.createElement('li')); });
    }

    function crearFichas() {
      listaMovil.textContent = '';
      porOrden.forEach(function (e) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ficha-estancia'; b.setAttribute('data-estancia', e.id);
        var f = fotos[e.portada || e.fotos[0]];
        if (f) b.appendChild(picture(f, '84px', 'lazy', ''));
        var small = document.createElement('small'); small.textContent = String(e.orden).padStart(2, '0') + ' · ' + nombrePlanta(e.planta);
        var bb = document.createElement('b'); bb.textContent = e.nombre;
        var sp = document.createElement('span'); sp.textContent = e.resumen + ' Ver ' + e.fotos.length + ' fotos.';
        b.appendChild(small); b.appendChild(bb); b.appendChild(sp);
        b.addEventListener('click', function () {
          encenderHasta(Math.max(encendidas, porOrden.indexOf(e) + 1));
          seleccionar(e.indice);
          abrirGaleria(e, b);
        });
        li.appendChild(b); listaMovil.appendChild(li);
        fichas[e.id] = b;
      });
    }

    function crearPestanas() {
      pestanas.textContent = '';
      porOrden.forEach(function (e) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'pestana-' + e.id;
        b.setAttribute('aria-controls', 'abierta-panel'); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
        b.textContent = e.nombre;
        b.addEventListener('click', function () { seleccionar(e.indice); });
        b.addEventListener('keydown', function (ev) {
          var k = porOrden.indexOf(e);
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
            ev.preventDefault();
            var sig = porOrden[(k + (ev.key === 'ArrowRight' ? 1 : -1) + porOrden.length) % porOrden.length];
            seleccionar(sig.indice); tabs[sig.id].focus();
          }
        });
        pestanas.appendChild(b);
        tabs[e.id] = b;
      });
    }

    function nombrePlanta(id) {
      var p = (datos.plantas || []).filter(function (x) { return x.id === id; })[0];
      return p ? p.nombre : id;
    }

    function mostrar(i) {
      var e = estancias[i];
      if (!e) {
        pNum.textContent = 'La casa entera';
        pNombre.textContent = '150 m² en dos plantas';
        pResumen.textContent = 'Tres dormitorios, dos baños (uno con jacuzzi), salón y comedor, cocina y patio.';
        pLista.textContent = '';
        pVer.hidden = true;
        return;
      }
      pNum.textContent = String(porOrden.indexOf(e) + 1).padStart(2, '0') + ' / ' + String(porOrden.length).padStart(2, '0') + ' · ' + nombrePlanta(e.planta);
      pNombre.textContent = e.nombre;
      pResumen.textContent = e.resumen;
      pLista.textContent = '';
      e.equipamiento.forEach(function (q) { var li = document.createElement('li'); li.textContent = q; pLista.appendChild(li); });
      pVer.hidden = false;
      pVer.textContent = 'Ver sus ' + e.fotos.length + ' fotos';
      pVer.onclick = function () { abrirGaleria(e, pVer); };
    }
    function seleccionar(i) {
      seleccion = i;
      estancias.forEach(function (e, k) {
        var es = k === i;
        if (celdas[e.id]) celdas[e.id].classList.toggle('es-activa', es && modoActual !== 'anclada');
        if (fichas[e.id]) fichas[e.id].classList.toggle('es-activa', es);
        if (tabs[e.id]) { tabs[e.id].setAttribute('aria-selected', es ? 'true' : 'false'); tabs[e.id].tabIndex = es ? 0 : -1; }
      });
      mostrar(i);
    }
    function encenderHasta(n) {
      encendidas = limitar(n, 0, porOrden.length);
      porOrden.forEach(function (e, k) {
        var c = celdas[e.id];
        if (c) c.classList.toggle('es-encendida', k < encendidas);
      });
      todos('li', pMarcas).forEach(function (li, k) { li.classList.toggle('es-encendida', k < encendidas); });
      seccion.setAttribute('data-encendidas', encendidas);
    }
    function abrirGaleria(e, desde) {
      if (galeria) galeria.abrir(e.nombre, e.fotos, 0, e.equipamiento, desde);
    }

    function modo() {
      if (densidad() === 'sobria') return 'pestanas';
      if (esMovil()) return 'lista';
      if (!movimiento || window.innerHeight < 600) return 'quieta';
      return 'anclada';
    }

    function desmontar() {
      if (disparo) { disparo.kill(true); disparo = null; }
      if (observador) { observador.disconnect(); observador = null; }
      if (obsNoche) { obsNoche.disconnect(); obsNoche = null; }
      noche.style.removeProperty('opacity');
      celdasCaja.style.removeProperty('opacity');
      todos('.tabique, .suelo, .patio-linea, .placa', lineas).forEach(function (n) { n.style.removeProperty('opacity'); });
      if (muro) muro.style.removeProperty('stroke-dashoffset');
      if (muro) muro.style.removeProperty('stroke-dasharray');
      seccion.classList.remove('es-de-noche');
      seccion.removeAttribute('data-modo');
    }

    function aplicar(p) {
      /* 0–0,1: cae la noche y se dibuja el corte · 0,12–0,84: se encienden · 0,88–1: amanece */
      var op = p < 0.1 ? p / 0.1 : (p > 0.88 ? Math.max(0, (1 - p) / 0.12) : 1);
      noche.style.opacity = op.toFixed(3);
      seccion.classList.toggle('es-de-noche', op > 0.5);
      if (muro) muro.style.strokeDashoffset = (1 - limitar(p / 0.12, 0, 1)).toFixed(4);
      var aparece = limitar((p - 0.05) / 0.07, 0, 1).toFixed(3);
      celdasCaja.style.opacity = aparece;
      todos('.tabique, .suelo, .patio-linea, .placa', lineas).forEach(function (n) { n.style.opacity = aparece; });
      var k = p < 0.12 ? 0 : Math.min(porOrden.length, Math.floor((p - 0.12) / 0.72 * porOrden.length) + 1);
      if (k !== encendidas) encenderHasta(k);
      var e = k > 0 ? porOrden[k - 1] : null;
      var objetivo = p > 0.86 ? -1 : (e ? e.indice : -1);
      if (objetivo !== seleccion) seleccionar(objetivo);
    }

    function montarModo() {
      desmontar();
      modoActual = modo();
      seccion.setAttribute('data-modo', modoActual);
      if (modoActual === 'anclada') {
        encenderHasta(0); seleccionar(-1);
        if (muro) { muro.style.strokeDasharray = '1 1'; muro.style.strokeDashoffset = '1'; }
        var estado = { p: 0 };
        var tl = gsap.timeline({ paused: true }).to(estado, { p: 1, duration: 1, ease: 'none', onUpdate: function () { aplicar(estado.p); } });
        disparo = ST.create({
          trigger: seccion,
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * (porOrden.length * 0.55 + 0.9)); },
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          animation: tl
        });
        ST.sort();
      } else if (modoActual === 'lista') {
        /* móvil: la noche cae al entrar y amanece al salir; cada tarjeta que pasa por el centro enciende la suya */
        encenderHasta(movimiento ? 0 : porOrden.length);
        seleccionar(-1);
        if ('IntersectionObserver' in window) {
          obsNoche = new IntersectionObserver(function (en) {
            en.forEach(function (x) { seccion.classList.toggle('es-de-noche', x.isIntersecting); });
          }, { rootMargin: '-30% 0px -30% 0px' });
          obsNoche.observe(seccion);
          if (movimiento) {
            observador = new IntersectionObserver(function (en) {
              en.forEach(function (x) {
                if (!x.isIntersecting) return;
                var id = x.target.getAttribute('data-estancia');
                var k = porOrden.map(function (e) { return e.id; }).indexOf(id);
                encenderHasta(Math.max(encendidas, k + 1));
              });
            }, { rootMargin: '-48% 0px -48% 0px' });
            Object.keys(fichas).forEach(function (id) { observador.observe(fichas[id]); });
          }
        } else {
          encenderHasta(porOrden.length);
        }
      } else if (modoActual === 'quieta') {
        encenderHasta(porOrden.length);
        seccion.classList.add('es-de-noche');
        noche.style.opacity = '1';
        seleccionar(-1);
      } else {
        encenderHasta(porOrden.length);
        seleccionar(porOrden[0].indice);
      }
      marcarPequenas();
      setTimeout(refrescar, 60);
    }

    Promise.all([
      fetch('data/casa.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('casa'); return r.json(); }),
      cargarFotos()
    ]).then(function (res) {
      datos = res[0]; fotos = res[1];
      estancias = datos.estancias.map(function (e, i) { e.indice = i; return e; });
      porOrden = estancias.slice().sort(function (a, b) { return (a.orden || 99) - (b.orden || 99); });
      crearCeldas(); crearMarcas(); crearFichas(); crearPestanas();
      montarModo();
      window.CasaMaria.casa = {
        datos: datos,
        get modo() { return modoActual; },
        get encendidas() { return encendidas; },
        orden: porOrden.map(function (e) { return e.id; }),
        aplicar: aplicar
      };
      document.dispatchEvent(new CustomEvent('casa-cargada', { detail: datos }));
      var rehacer = esperar(function () {
        var nuevo = modo();
        if (nuevo !== modoActual) montarModo(); else marcarPequenas();
      }, 220);
      window.addEventListener('resize', rehacer);
      document.addEventListener('densidad-cambiada', function () { montarModo(); });
    }).catch(function () {
      /* sin JSON (abierta con doble clic): la sección se queda con su texto */
      var aviso = document.createElement('p');
      aviso.className = 'abierta__sinjs';
      aviso.textContent = 'Tres dormitorios, dos baños (uno con jacuzzi), salón y comedor, cocina, entrada con escalera y patio.';
      seccion.querySelector('.abierta__escena').appendChild(aviso);
    });
  })();

  /* ───────────────── marquee de detalles (dos filas, sentidos opuestos) ───────────────── */
  (function cinta() {
    var filas = todos('.cinta__fila');
    if (!filas.length) return;
    filas.forEach(function (fila) {
      var pista = fila.querySelector('.cinta__pista');
      var originales = todos(':scope > li', pista);
      var anchoGrupo = pista.scrollWidth;
      var copias = Math.max(1, Math.ceil((window.innerWidth * 2) / Math.max(1, anchoGrupo)));
      for (var c = 0; c < copias; c++) {
        originales.forEach(function (li) {
          var x = li.cloneNode(true);
          x.setAttribute('aria-hidden', 'true');
          todos('img', x).forEach(function (im) { im.alt = ''; });
          pista.appendChild(x);
        });
      }
      fila._ancho = function () { return originales.reduce(function (a, li) { return a + li.offsetWidth; }, 0) + originales.length * parseFloat(getComputedStyle(pista).columnGap || getComputedStyle(pista).gap || 0); };
    });
    if (!movimiento) return;
    var extra = 0, visible = true;
    if (lenis) lenis.on('scroll', function (e) { extra = Math.min(Math.abs(e.velocity || 0) * 0.25, 7); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe($('#cinta'));
    var pos = filas.map(function (f) { return f.getAttribute('data-sentido') === '-1' ? -f._ancho() : 0; });
    /* rAF propio: ningún tween de GSAP toca esta propiedad */
    (function paso() {
      if (visible && densidad() === 'trazo') {
        filas.forEach(function (f, i) {
          var ancho = f._ancho(), s = parseFloat(f.getAttribute('data-sentido'));
          pos[i] -= s * (0.45 + extra);
          if (pos[i] <= -ancho) pos[i] += ancho;
          if (pos[i] > 0) pos[i] -= ancho;
          f.firstElementChild.style.transform = 'translate3d(' + pos[i].toFixed(2) + 'px,0,0)';
        });
        extra *= 0.94;
      }
      requestAnimationFrame(paso);
    })();
  })();

  /* ───────────────── galería completa (solo existe en la versión sobria) ───────────────── */
  (function galeriaCompleta() {
    var seccion = $('#galeria-completa');
    if (!seccion) return;
    var rejilla = $('#rejilla-fotos'), cuenta = $('#filtros-cuenta');
    var botones = todos('#filtros button');
    var hecha = false, items = [], filtro = 'todas';
    var nombres = { todas: 'Todas las fotos', dormitorios: 'Dormitorios', banos: 'Baños', salon: 'Salón y comedor', cocina: 'Cocina', patio: 'Patio', rincones: 'Entrada y rincones' };
    function visibles() { return items.filter(function (it) { return !it.li.hidden; }); }
    function filtrar(f) {
      filtro = f;
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filtro') === f ? 'true' : 'false'); });
      items.forEach(function (it) { it.li.hidden = !(f === 'todas' || it.cat === f); });
      cuenta.textContent = visibles().length + ' de ' + items.length + ' fotos';
    }
    function hacer() {
      if (hecha || densidad() !== 'sobria') return;
      hecha = true;
      fetch('data/fotos.json').then(function (r) { return r.json(); }).then(function (d) {
        return cargarFotos().then(function (m) {
          d.fotos.forEach(function (f) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button'; b.setAttribute('aria-label', 'Ampliar: ' + f.alt);
            b.appendChild(picture(m[f.id], '(max-width: 640px) 48vw, 220px', 'lazy'));
            var it = { li: li, id: f.id, cat: f.categoria };
            b.addEventListener('click', function () {
              var vis = visibles();
              if (galeria) galeria.abrir(nombres[filtro], vis.map(function (x) { return x.id; }), vis.indexOf(it), null, b);
            });
            li.appendChild(b); rejilla.appendChild(li); items.push(it);
          });
          filtrar('todas');
          setTimeout(refrescar, 60);
        });
      }).catch(function () { hecha = false; });
    }
    botones.forEach(function (b) { b.addEventListener('click', function () { filtrar(b.getAttribute('data-filtro')); }); });
    hacer();
    document.addEventListener('densidad-cambiada', hacer);
    window.CasaMaria.galeriaCompleta = { filtrar: filtrar, get total() { return items.length; } };
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    todos('.iman').forEach(function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.3);
        aY((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio: punto cacao + aro de cobre ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var aro = document.createElement('div');
    var pt = document.createElement('div');
    aro.className = 'cursor';
    pt.className = 'cursor-punto';
    [aro, pt].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(aro, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(aro, 'y', { duration: 0.28, ease: 'power3.out' });
    var ultimo = null;
    function mostrar(si) { aro.classList.toggle('cursor--vivo', si); pt.classList.toggle('cursor--vivo', si); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!aro.classList.contains('cursor--vivo')) { gsap.set(aro, { x: e.clientX, y: e.clientY }); mostrar(true); }
      /* el del sistema se oculta solo cuando el propio ya se ve */
      if (!html.classList.contains('con-cursor')) html.classList.add('con-cursor');
      gsap.set(pt, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      /* el estado se decide aquí, por el objetivo (pointerover no siempre llega) */
      if (e.target !== ultimo) {
        ultimo = e.target;
        var t = e.target.closest ? e.target : null;
        var sobre = !!(t && t.closest('a, button, label, input, select, textarea, [role="button"], .celda'));
        var oscuro = !!(t && t.closest('.abierta.es-de-noche, .galeria, .cookies, .mando, .abierta__corte'));
        aro.classList.toggle('cursor--activo', sobre);
        aro.classList.toggle('cursor--noche', oscuro);
        pt.classList.toggle('cursor-punto--activo', sobre);
      }
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
  })();

  /* ───────────────── cabecera fija y menú móvil ───────────────── */
  var cabecera = $('#cabecera');
  var boton = $('#hamburguesa');
  (function cabeceraFija() {
    if (!cabecera) return;
    function actualizar() { cabecera.classList.toggle('cabecera--fija', window.pageYOffset > 40); }
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  })();
  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── mapa: Google solo bajo clic ───────────────── */
  (function mapa() {
    var btn = $('#mapa-boton'), caja = $('#mapa-consentimiento');
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = 'https://www.google.com/maps?q=C/+La+Higuera+13+Olivenza&output=embed';
      marco.loading = 'lazy';
      marco.title = 'Mapa: Casa María, C/ La Higuera 13, Olivenza';
      marco.allowFullscreen = true;
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
      setTimeout(refrescar, 60);
    });
  })();

  /* ───────────────── consultar fechas: mensaje para María ───────────────── */
  /* mailto según RFC 6068: saltos de línea como CRLF y todo codificado */
  function mailto(asunto, cuerpo) {
    return 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo.replace(/\r?\n/g, '\r\n'));
  }
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiarViejo(texto); });
    }
    return Promise.resolve(copiarViejo(texto));
  }
  function copiarViejo(texto) {
    var t = document.createElement('textarea');
    t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
    return ok;
  }
  window.CasaMaria.mailto = mailto;

  (function reserva() {
    var form = $('#reserva');
    if (!form) return;
    var llegada = $('#llegada'), salida = $('#salida');
    var errFechas = $('#fechas-error'), err = $('#reserva-error'), aviso = $('#plazas-aviso');
    var listo = $('#reserva-listo'), salidaTxt = $('#reserva-texto'), email = $('#reserva-email');
    var estado = $('#reserva-estado'), wa = $('#reserva-whatsapp'), waNota = $('#whatsapp-nota');
    var texto = '';
    var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    function aFecha(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function largo(d, conAnio) { return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + (conAnio ? ' de ' + d.getFullYear() : ''); }
    function corto(d) { return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    llegada.min = iso(hoy);

    function comprobarFechas(final) {
      llegada.removeAttribute('aria-invalid'); salida.removeAttribute('aria-invalid');
      if (!llegada.value || !salida.value) {
        errFechas.textContent = final ? 'Elegid la fecha de llegada y la de salida.' : '';
        if (final) (llegada.value ? salida : llegada).setAttribute('aria-invalid', 'true');
        return false;
      }
      var a = aFecha(llegada.value), b = aFecha(salida.value);
      if (b <= a) {
        errFechas.textContent = 'La salida tiene que ser posterior a la llegada.';
        salida.setAttribute('aria-invalid', 'true');
        return false;
      }
      errFechas.textContent = '';
      return true;
    }
    llegada.addEventListener('change', function () {
      if (llegada.value) { var a = aFecha(llegada.value); a.setDate(a.getDate() + 1); salida.min = iso(a); }
      if (salida.value) comprobarFechas(false);
    });
    salida.addEventListener('change', function () { comprobarFechas(false); });
    function plazas() {
      var n = (parseInt(form.elements.adultos.value, 10) || 0) + (parseInt(form.elements.ninos.value, 10) || 0);
      aviso.textContent = n > 6 ? 'La casa es para seis personas. Si venís con un bebé en cuna, contádselo a María en el mensaje.' : '';
    }
    form.elements.adultos.addEventListener('input', plazas);
    form.elements.ninos.addEventListener('input', plazas);

    function pintarWhatsapp() {
      var activo = !!CONFIG.whatsapp;
      wa.disabled = !activo;
      wa.classList.toggle('es-apagado', !activo);
      waNota.hidden = activo;
    }
    pintarWhatsapp();
    document.addEventListener('config-cargada', pintarWhatsapp);
    wa.addEventListener('click', function () {
      if (!CONFIG.whatsapp || !texto) return;
      window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okFechas = comprobarFechas(true);
      var nombre = form.elements.nombre.value.trim();
      form.elements.nombre.toggleAttribute('aria-invalid', !nombre);
      err.textContent = nombre ? '' : 'Falta vuestro nombre, para que María sepa quién escribe.';
      if (!okFechas || !nombre) { listo.hidden = true; return; }
      var a = aFecha(llegada.value), b = aFecha(salida.value);
      var noches = Math.round((b - a) / 864e5);
      var ad = Math.max(1, parseInt(form.elements.adultos.value, 10) || 1);
      var ni = Math.max(0, parseInt(form.elements.ninos.value, 10) || 0);
      var quienes = ad + (ad === 1 ? ' adulto' : ' adultos') + (ni ? ' y ' + ni + (ni === 1 ? ' niño' : ' niños') : '');
      var mismoAnio = a.getFullYear() === b.getFullYear();
      var lineas = [
        'Hola María, somos ' + quienes + ' y queremos ir del ' + largo(a, !mismoAnio) + ' al ' + largo(b, true) +
          ' (' + noches + (noches === 1 ? ' noche' : ' noches') + ').'
      ];
      if (form.elements.cuna.value === 'si') lineas.push('Necesitaríamos la cuna.');
      var msg = form.elements.mensaje.value.trim();
      if (msg) lineas.push('', msg);
      lineas.push('', '¿Tienes la casa libre esas fechas?', '', 'Un saludo,', nombre);
      var tel = form.elements.telefono.value.trim();
      if (tel) lineas.push('Tel. ' + tel);
      texto = lineas.join('\n');
      salidaTxt.textContent = texto;
      email.href = mailto('Consulta de fechas · ' + corto(a) + ' – ' + corto(b), texto);
      estado.textContent = '';
      listo.hidden = false;
      setTimeout(refrescar, 30);
      listo.scrollIntoView ? listo.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }) : 0;
    });
    $('#reserva-copiar').addEventListener('click', function () {
      copiar(texto).then(function (ok) {
        estado.textContent = ok ? 'Mensaje copiado. Pegadlo donde queráis.' : 'No se ha podido copiar: seleccionad el texto y copiadlo a mano.';
      });
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = $('#cookies'), ok = $('#cookies-aceptar'), reabrir = $('#cookies-reabrir');
    if (!caja || !ok) return;
    function ver(si) {
      caja.hidden = !si;                      /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.toggle('cookies-visibles', si);
    }
    var guardado = null;
    try { guardado = localStorage.getItem('casamaria-cookies'); } catch (e) {}
    if (guardado !== 'ok') ver(true);
    ok.addEventListener('click', function () {
      ver(false);
      try { localStorage.setItem('casamaria-cookies', 'ok'); } catch (e) {}
    });
    if (reabrir) reabrir.addEventListener('click', function () { ver(true); ok.focus(); });
  })();

  var anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

  if (gsapReady && document.fonts && document.fonts.ready) document.fonts.ready.then(refrescar);
  /* contenido que cambia de alto (mensaje, mapa, galería): el fin de página de ScrollTrigger se queda viejo */
  if (gsapReady && 'ResizeObserver' in window) {
    var altoPrevio = 0;
    var refrescarTarde = esperar(refrescar, 150);
    new ResizeObserver(function () {
      var a = document.body.offsetHeight;
      if (Math.abs(a - altoPrevio) < 40) return;
      altoPrevio = a;
      refrescarTarde();
    }).observe(document.body);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> y la sección de la galería completa del HTML, y
     la parte de densidad del script bloqueante del <head>. Receta en el README.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = $('#mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;                       /* sin JS no haría nada: lo enseña el JS */
    var botones = todos('[data-densidad]', mando);
    var aviso = $('#mando-aviso');
    function aplicar(d) {
      html.classList.remove('densidad-trazo', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-densidad') === d ? 'true' : 'false'); });
      try { localStorage.setItem('casamaria-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
      setTimeout(refrescar, 90);
    }
    var actual = densidad();
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-densidad') === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.getAttribute('data-densidad')); });
    });
    /* mientras la distribución sea provisional, el mando lo recuerda */
    function avisar(d) {
      if (d && d.provisional) { aviso.textContent = d.aviso || 'Distribución provisional: pendiente de María'; aviso.hidden = false; }
    }
    if (window.CasaMaria.casa) avisar(window.CasaMaria.casa.datos);
    document.addEventListener('casa-cargada', function (e) { avisar(e.detail); });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */
})();
