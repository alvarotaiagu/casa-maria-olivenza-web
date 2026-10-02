/* ═══════════════════════════════════════════════════════════════════════════
   Módulo «Opiniones»: la nota que cuenta, las categorías que dibuja el hilo y
   el mazo de notas. Independiente de main.js: si falta este archivo, la
   sección se lee igual (las notas una debajo de otra); si falta la sección,
   este archivo no hace nada.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var seccion = document.getElementById('opiniones');
  if (!seccion) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CM = window.CasaMaria || {};

  function visible(nodo, umbral, fn) {
    if (!nodo) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var obs = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { obs.disconnect(); fn(); }
    }, { threshold: umbral });
    obs.observe(nodo);
  }

  /* 9,8 que cuenta al entrar */
  var nota = seccion.querySelector('[data-contar]');
  if (nota) {
    if (CM.contar && CM.movimiento) {
      nota.textContent = '0,0';
      visible(nota, 0.6, function () { CM.contar(nota); });
    }
  }
  /* las categorías: el hilo llega hasta cada nota */
  var barras = seccion.querySelector('.barras');
  visible(barras, 0.4, function () { barras.classList.add('es-visible'); });

  /* el mazo */
  var mazo = document.getElementById('mazo');
  if (!mazo) return;
  var notas = Array.prototype.slice.call(mazo.querySelectorAll('.nota'));
  var cuenta = document.getElementById('mazo-cuenta');
  var vivo = document.getElementById('mazo-vivo');
  var orden = notas.map(function (_, i) { return i; });       /* orden[0] = la de arriba */
  var ocupado = false;
  mazo.classList.add('es-apilado');

  function colocar() {
    orden.forEach(function (idx, pos) {
      var n = notas[idx];
      n.setAttribute('data-pos', String(pos));
      n.classList.toggle('es-oculta', pos > 3);
      n.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
    });
    if (cuenta) cuenta.textContent = (orden[0] + 1) + ' de ' + notas.length;
  }
  function pasar() {
    if (ocupado) return;
    var arriba = notas[orden[0]];
    function fin() {
      arriba.classList.remove('es-saliendo');
      orden.push(orden.shift());
      colocar();
      var siguiente = notas[orden[0]];
      if (vivo) vivo.textContent = siguiente.querySelector('blockquote').textContent + ' (Opinión en Booking, ' + (orden[0] + 1) + ' de ' + notas.length + ')';
      ocupado = false;
    }
    if (reduce) { fin(); return; }
    ocupado = true;
    arriba.classList.add('es-saliendo');
    setTimeout(fin, 520);
  }
  mazo.addEventListener('click', pasar);
  mazo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); pasar(); }
  });
  var x0 = null;
  mazo.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  mazo.addEventListener('pointerup', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { e.stopPropagation(); pasar(); mazo._deslizado = true; setTimeout(function () { mazo._deslizado = false; }, 50); }
  });
  /* un deslizamiento no cuenta además como clic */
  mazo.addEventListener('click', function (e) { if (mazo._deslizado) e.stopImmediatePropagation(); }, true);
  colocar();
  window.CasaMaria = window.CasaMaria || {};
  window.CasaMaria.opiniones = { pasar: pasar, get arriba() { return orden[0]; } };
})();
