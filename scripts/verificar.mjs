/* Verificación de Casa María · «Un solo trazo».
   Levanta un servidor estático, abre la web con Playwright (Chromium) y comprueba:
     · un test por cada punto del checklist de web desde cero (cursor, el sticky
       que hay aquí, menú móvil, cookies, cortina, hero en móviles bajos,
       con-movimiento, trazos con autoRound, clases de estado con prefijo);
     · la cortina: un fotograma a medias del trazo y otro de la apertura, el
       logo que aterriza en su sitio, y la retirada sin CDN y con movimiento reducido;
     · el hilo: muestrea stroke-dashoffset a lo largo del scroll (no la captura
       final) y comprueba que se recalcula al cambiar el ancho;
     · la casa abierta: las 9 estancias se encienden en el orden de casa.json,
       cada botón abre su <dialog> con sus fotos, Escape lo cierra, en móvil va
       sin anclar, y cambiar una estancia de planta en el JSON la mueve en el corte;
     · el formulario: validación de fechas, mailto bien codificado y WhatsApp
       apagado con "whatsapp": null;
     · el borrado del módulo de opiniones sobre una copia temporal;
     · las dos densidades, y que sin ?revision no hay mando;
     · textos prohibidos y citas sin nombre.
   Se baja con mouse.wheel: con Lenis, window.scrollTo no dispara ScrollTrigger.

   node scripts/verificar.mjs            (todo)
   node scripts/verificar.mjs --capturas (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.json': 'application/json'
};
function servir(dir, puerto) {
  const s = http.createServer((req, res) => {
    const limpia = decodeURIComponent(req.url.split('?')[0]);
    const destino = path.join(dir, limpia === '/' ? 'index.html' : limpia);
    if (!destino.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(destino));
  });
  return new Promise(r => s.listen(puerto, '127.0.0.1', () => r(s)));
}

const fallos = [], notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function rueda(page, vueltas, paso = 600, espera = 160) {
  for (let i = 0; i < vueltas; i++) { await page.mouse.wheel(0, paso); await page.waitForTimeout(espera); }
}
async function hastaAbajo(page, paso = 700) {
  let ant = -1;
  for (let i = 0; i < 200; i++) {
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(140);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    if (y === ant) break;
    ant = y;
  }
  await page.waitForTimeout(2500);
}
/* ir a un elemento con la rueda, llevando la cuenta de lo despachado (Lenis va por detrás de scrollY) */
async function irA(page, selector, margen = 0.15) {
  const destino = await page.evaluate(([s, m]) => {
    const el = document.querySelector(s); if (!el) return null;
    return Math.round(el.getBoundingClientRect().top + window.scrollY - innerHeight * m);
  }, [selector, margen]);
  if (destino == null) return false;
  let restante = destino - await page.evaluate(() => window.scrollY);
  while (Math.abs(restante) > 12) {
    const d = Math.sign(restante) * Math.min(Math.abs(restante), 420);
    await page.mouse.wheel(0, d); restante -= d;
    await page.waitForTimeout(55);
  }
  await page.waitForTimeout(1600);
  return true;
}
const BASE = 'http://127.0.0.1:4197/';
const CDN = /cdn\.jsdelivr\.net\/npm\/(gsap|lenis)/;

const servidor = await servir(raiz, 4197);
const navegador = await chromium.launch();
async function nuevaPagina(opciones = {}, { cookiesVistas = true, bloquearCDN = false } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
  if (cookiesVistas) await ctx.addInitScript(() => { try { localStorage.setItem('casamaria-cookies', 'ok'); } catch (e) {} });
  if (bloquearCDN) await ctx.route(CDN, r => r.abort());
  const page = await ctx.newPage();
  page.errores = []; page.respuestas = [];
  page.on('console', m => { if (m.type() === 'error') page.errores.push(m.text()); });
  page.on('pageerror', e => page.errores.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) page.respuestas.push(r.status() + ' ' + r.url()); });
  return { ctx, page };
}

const casaJson = JSON.parse(fs.readFileSync(path.join(raiz, 'data/casa.json'), 'utf8'));
const ordenJson = casaJson.estancias.slice().sort((a, b) => a.orden - b.orden).map(e => e.id);
const fotosJson = JSON.parse(fs.readFileSync(path.join(raiz, 'data/fotos.json'), 'utf8'));

try {
  /* ═══════════════ 0 · carga limpia, cortina muestreada dentro de la página ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    /* muestreo con rAF dentro de la página (las capturas abren huecos de ~150 ms) */
    await ctx.addInitScript(() => {
      window.__m = { trazo: [], firma: [], fondo: [], subcaminos: [], aterrizaje: null, cubreAlCargar: null };
      document.addEventListener('DOMContentLoaded', () => {
        const c = document.getElementById('cortina');
        window.__m.cubreAlCargar = c ? getComputedStyle(c).display : 'sin cortina';
        (function paso() {
          const casa = document.querySelector('#cortina-logo .logo-svg__casa');
          if (casa) window.__m.trazo.push(parseFloat(getComputedStyle(casa).strokeDashoffset));
          const tr = document.querySelectorAll('#cortina-logo .firma__trazo');
          if (tr.length) window.__m.firma.push(parseFloat(getComputedStyle(tr[tr.length - 6] || tr[0]).strokeDashoffset));
          const d = document.getElementById('cortina-muro-d');
          if (d && c && getComputedStyle(c).display !== 'none') {
            const n = (d.getAttribute('d') || '').split('M').length - 1;
            window.__m.subcaminos.push(n);
            if (n >= 2) window.__m.fondo.push(getComputedStyle(c).backgroundColor);
          }
          if (!c || getComputedStyle(c).display !== 'none' || performance.now() < 4500) requestAnimationFrame(paso);
        })();
      });
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4200);
    const m = await page.evaluate(() => Object.assign(window.__m, { aterrizaje: window.CasaMaria && window.CasaMaria.aterrizaje }));
    comprobar(m.cubreAlCargar === 'block', 'cortina: tapa la página al cargar (display ' + m.cubreAlCargar + ')');
    const medios = v => v.filter(x => x > 0.03 && x < 0.97);
    comprobar(new Set(medios(m.trazo).map(x => x.toFixed(3))).size >= 6, 'checklist 8 · el trazo de la casa se dibuja de verdad (autoRound:false): ' + medios(m.trazo).length + ' valores intermedios');
    comprobar(new Set(medios(m.firma).map(x => x.toFixed(3))).size >= 3, 'cortina: la firma avanza por su esqueleto (' + medios(m.firma).length + ' valores intermedios)');
    comprobar(m.subcaminos.some(n => n >= 2), 'cortina: la apertura es un agujero con forma de casa en el muro (evenodd)');
    comprobar(m.fondo.length > 0 && m.fondo.every(f => f === 'rgba(0, 0, 0, 0)'), 'cortina: mientras el agujero crece, la capa no tiene fondo opaco (' + (m.fondo[0] || 'sin muestras') + ')');
    comprobar(m.aterrizaje && m.aterrizaje.dx < 2 && m.aterrizaje.dy < 2 && m.aterrizaje.dw < 2, 'cortina: el logo aterriza en el sitio del logo del hero ' + JSON.stringify(m.aterrizaje));
    const estado = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      heroLogo: getComputedStyle(document.getElementById('hero-logo')).visibility,
      movimiento: document.documentElement.classList.contains('con-movimiento'),
      lenis: document.documentElement.classList.contains('lenis')
    }));
    comprobar(estado.cortina === 'none', 'cortina: acaba en display:none');
    comprobar(estado.heroLogo === 'visible', 'cortina: el logo real del hero se ve tras el aterrizaje');
    comprobar(estado.movimiento, 'checklist 7 · con GSAP y sin movimiento reducido hay html.con-movimiento');
    comprobar(estado.lenis, 'Lenis carga (desde jsDelivr) y gobierna el scroll');
    /* el resto de la página, bajando con la rueda */
    await page.mouse.move(700, 450);
    const muestrasHilo = [];
    let ant = -1;
    for (let i = 0; i < 220; i++) {
      await page.mouse.wheel(0, 260);
      await page.waitForTimeout(90);
      const s = await page.evaluate(() => ({ y: Math.round(scrollY), off: parseFloat(getComputedStyle(document.getElementById('hilo-d')).strokeDashoffset) }));
      muestrasHilo.push(s.off);
      if (s.y === ant && i > 5) break;
      ant = s.y;
    }
    await page.waitForTimeout(2500);
    const finHilo = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('hilo-d')).strokeDashoffset));
    const intermedios = muestrasHilo.filter(v => v > 0.02 && v < 0.98);
    let subidas = 0; for (let i = 1; i < muestrasHilo.length; i++) if (muestrasHilo[i] > muestrasHilo[i - 1] + 0.02) subidas++;
    comprobar(new Set(intermedios.map(v => v.toFixed(3))).size >= 15, 'hilo: stroke-dashoffset pasa por ' + new Set(intermedios.map(v => v.toFixed(3))).size + ' valores intermedios al bajar (se dibuja con el scroll)');
    comprobar(subidas === 0, 'hilo: al bajar nunca se «desdibuja» (' + subidas + ' retrocesos)');
    comprobar(finHilo < 0.01, 'hilo: abajo del todo está entero (dashoffset ' + finHilo.toFixed(3) + ')');
    const imgs = await page.evaluate(() => [...document.images].filter(i => i.getBoundingClientRect().height > 0 && i.complete).map(i => ({ src: i.currentSrc, w: i.naturalWidth })));
    comprobar(imgs.length > 20 && imgs.every(i => i.w > 0), 'fotos: ' + imgs.length + ' imágenes cargadas, ninguna rota');
    const formatos = await page.evaluate(() => [...document.images].filter(i => i.currentSrc).map(i => i.currentSrc.split('.').pop()));
    comprobar(formatos.some(f => f === 'avif'), 'fotos: el navegador recibe AVIF (' + [...new Set(formatos)].join(', ') + ')');
    const tarjeta = await page.evaluate(() => ['tarjeta-chimenea', 'tarjeta-izq', 'tarjeta-der'].map(id => parseFloat(getComputedStyle(document.getElementById(id)).strokeDashoffset)));
    comprobar(tarjeta.every(v => v < 0.02), 'contacto: el trazo cierra la casa de la tarjeta (' + tarjeta.map(v => v.toFixed(2)).join(' / ') + ')');
    const llegada = await page.evaluate(() => {
      const p = document.getElementById('hilo-d'); const L = p.getTotalLength(); const fin = p.getPointAtLength(L);
      const s = document.getElementById('tarjeta-svg').getBoundingClientRect(); const m = document.getElementById('contenido').getBoundingClientRect();
      const k = s.width / 460; return { dx: Math.abs((s.left - m.left + 183.1 * k) - fin.x), dy: Math.abs((s.top - m.top + 32 * k) - fin.y) };
    });
    comprobar(llegada.dx < 2 && llegada.dy < 5, 'hilo: termina en la chimenea de la casa de la tarjeta ' + JSON.stringify(llegada));
    comprobar(page.errores.length === 0, 'consola limpia en escritorio' + (page.errores.length ? ': ' + page.errores.slice(0, 3).join(' | ') : ''));
    comprobar(page.respuestas.length === 0, 'sin respuestas 4xx/5xx' + (page.respuestas.length ? ': ' + page.respuestas.slice(0, 3).join(' | ') : ''));
    /* hilo recalculado al cambiar el ancho */
    const antes = await page.evaluate(() => document.getElementById('hilo-d').getAttribute('d'));
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(1200);
    const despues = await page.evaluate(() => document.getElementById('hilo-d').getAttribute('d'));
    const anchoSvg = await page.evaluate(() => +document.getElementById('hilo').getAttribute('width'));
    comprobar(antes !== despues && Math.abs(anchoSvg - 1100) < 20, 'hilo: se recalcula al cambiar el ancho (svg a ' + anchoSvg + ' px)');
    await ctx.close();
  }

  /* ═══════════════ cortina: fotogramas a medias (línea de tiempo pausada) ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.CasaMaria && window.CasaMaria.cortina && window.CasaMaria.cortina.tl);
    /* se pausa DESPUÉS de que arranque (fonts.ready o 450 ms): page.screenshot espera a las fuentes,
       y si la cortina aún no ha arrancado, su play() reanudaría la línea de tiempo pausada */
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    await page.waitForTimeout(520);
    await page.evaluate(() => { const tl = window.CasaMaria.cortina.tl; tl.pause(); tl.seek(0.5); 0; });
    await page.waitForTimeout(120);
    const medio = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#cortina-logo .logo-svg__casa')).strokeDashoffset));
    comprobar(medio > 0.2 && medio < 0.8, 'cortina: fotograma a medias del trazo (dashoffset ' + medio.toFixed(2) + ')');
    if (conCapturas) await page.screenshot({ path: foto('cortina-1-trazo.png') });
    await page.evaluate(() => { window.CasaMaria.cortina.tl.seek(1.45, false); 0; });
    await page.waitForTimeout(120);
    if (conCapturas) await page.screenshot({ path: foto('cortina-2-firma.png') });
    await ctx.close();
  }
  {
    /* la apertura, en una página nueva (lejos de la red de seguridad de 6 s): se deja correr de
       verdad, porque el hero arranca en tiempo real al empezar a abrirse, y se dispara a mitad del vuelo */
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.CasaMaria && window.CasaMaria.cortina && document.fonts.status === 'loaded');
    await page.waitForTimeout(500);
    await page.evaluate(() => { const tl = window.CasaMaria.cortina.tl; tl.seek(tl.duration() - 1.55, false); tl.play(); 0; });
    await page.waitForFunction(() => {
      const t = document.getElementById('cortina-logo').style.transform.match(/scale\(([\d.]+)\)/);
      return t && +t[1] < 0.93;
    }, null, { polling: 'raf', timeout: 5000 });
    await page.evaluate(() => { window.CasaMaria.cortina.tl.pause(); 0; });
    const apertura = await page.evaluate(() => ({
      sub: document.getElementById('cortina-muro-d').getAttribute('d').split('M').length - 1,
      fondo: getComputedStyle(document.getElementById('cortina')).backgroundColor
    }));
    comprobar(apertura.sub >= 2 && apertura.fondo === 'rgba(0, 0, 0, 0)', 'cortina: fotograma a medias de la apertura (agujero y capa transparente)');
    await page.waitForTimeout(500);
    if (conCapturas) await page.screenshot({ path: foto('cortina-3-apertura.png') });
    await page.evaluate(() => { window.CasaMaria.cortina.tl.play(); 0; });
    await page.waitForTimeout(1500);
    await ctx.close();
  }

  /* ═══════════════ cortina: retirada sin CDN y con movimiento reducido ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({}, { bloquearCDN: true });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      mov: document.documentElement.classList.contains('con-movimiento'),
      titulo: getComputedStyle(document.querySelector('.hero__titulo .letra')).transform,
      logo: getComputedStyle(document.getElementById('hero-logo')).visibility
    }));
    comprobar(r.cortina === 'none', 'sin CDN: la cortina se retira (display ' + r.cortina + ')');
    comprobar(!r.mov, 'checklist 7 · sin GSAP no hay html.con-movimiento');
    comprobar(r.titulo === 'none' && r.logo === 'visible', 'sin CDN: titular y logo se ven');
    await page.waitForTimeout(800);
    const casa = await page.evaluate(() => document.querySelectorAll('.celda.es-encendida').length);
    comprobar(casa === 9, 'sin CDN: la casa abierta se pinta y sale encendida (' + casa + ' de 9)');
    if (conCapturas) await page.screenshot({ path: foto('sin-cdn-1440.png') });
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' });
    await ctx.addInitScript(() => {
      window.__vista = [];
      document.addEventListener('DOMContentLoaded', () => {
        const c = document.getElementById('cortina');
        window.__vista.push(c ? getComputedStyle(c).display : 'none');
        requestAnimationFrame(() => window.__vista.push(c ? getComputedStyle(c).display : 'none'));
      });
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const v = await page.evaluate(() => window.__vista);
    comprobar(v.length && v.every(d => d === 'none'), 'movimiento reducido: la cortina no pinta ni un fotograma (' + v.join(',') + ')');
    const r = await page.evaluate(() => ({
      mov: document.documentElement.classList.contains('con-movimiento'),
      titulo: getComputedStyle(document.querySelector('.hero__titulo .letra')).transform,
      cifra: document.querySelector('.cifras b').textContent,
      encendidas: document.querySelectorAll('.celda.es-encendida').length,
      pin: !!document.querySelector('#casa-abierta').closest('.pin-spacer'),
      hilo: getComputedStyle(document.getElementById('hilo-d')).strokeDashoffset
    }));
    comprobar(!r.mov && r.titulo === 'none', 'checklist 7 · con movimiento reducido no hay con-movimiento y el titular se ve');
    comprobar(r.encendidas === 9 && !r.pin, 'movimiento reducido: la casa abierta ya encendida y sin anclar');
    comprobar(r.cifra === '150', 'movimiento reducido: las cifras se ven con su valor (' + r.cifra + ')');
    comprobar(parseFloat(r.hilo) === 0, 'movimiento reducido: el hilo está entero, sin dibujarse');
    /* cada estancia abre su galería con sus fotos; Escape la cierra */
    await irA(page, '#casa-abierta', 0);
    const ids = await page.evaluate(() => [...document.querySelectorAll('.celda')].map(c => c.dataset.estancia));
    let bien = 0; const malas = [];
    for (const id of ids) {
      const e = casaJson.estancias.find(x => x.id === id);
      await page.locator('.celda[data-estancia="' + id + '"]').click();
      await page.waitForFunction(() => document.getElementById('galeria').open && document.querySelector('#galeria-figura img'));
      const g = await page.evaluate(() => ({
        nombre: document.getElementById('galeria-nombre').textContent,
        n: document.querySelectorAll('#galeria-miniaturas button').length,
        src: document.querySelector('#galeria-figura img').getAttribute('src'),
        equipo: document.querySelectorAll('#galeria-equipo li').length
      }));
      await page.keyboard.press('ArrowRight');
      const segunda = await page.evaluate(() => document.querySelector('#galeria-figura img').getAttribute('src'));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      const cerrada = await page.evaluate(() => !document.getElementById('galeria').open);
      const ok = g.nombre === e.nombre && g.n === e.fotos.length && g.src.includes(e.fotos[0]) && g.equipo === e.equipamiento.length &&
        (e.fotos.length < 2 || segunda.includes(e.fotos[1])) && cerrada;
      if (ok) bien++; else malas.push(id + ' ' + JSON.stringify(g));
    }
    comprobar(bien === 9, 'casa abierta: cada botón abre su <dialog> con sus fotos y su equipamiento, la flecha pasa y Escape cierra (' + bien + '/9)' + (malas.length ? ' ' + malas.join(' | ') : ''));
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('celda'));
    comprobar(foco, 'casa abierta: al cerrar la galería el foco vuelve a la estancia');
    if (conCapturas) await page.screenshot({ path: foto('reducido-casa-abierta-1440.png') });
    comprobar(page.errores.length === 0, 'consola limpia con movimiento reducido' + (page.errores.length ? ': ' + page.errores[0] : ''));
    await ctx.close();
  }

  /* ═══════════════ checklist 1 · cursor propio ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(3800);
    await page.mouse.move(300, 300); await page.mouse.move(320, 310);
    await page.waitForTimeout(200);
    const r1 = await page.evaluate(() => ({ cur: getComputedStyle(document.body).cursor, html: document.documentElement.classList.contains('con-cursor'), aro: getComputedStyle(document.querySelector('.cursor')).opacity }));
    comprobar(r1.cur === 'none' && r1.html && parseFloat(r1.aro) > 0.9, 'checklist 1 · cursor propio: el del sistema se oculta y el aro se ve');
    const b = await page.locator('.hero__acciones .boton--cacao').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
    await page.waitForTimeout(500);
    const r2 = await page.evaluate(() => { const a = document.querySelector('.cursor'); const c = getComputedStyle(a).backgroundColor.match(/[\d.]+/g); return { activo: a.classList.contains('cursor--activo'), alfa: c && c[3] ? parseFloat(c[3]) : 1 }; });
    comprobar(r2.activo && r2.alfa >= 0.35, 'checklist 1 · sobre un botón el aro crece con relleno visible (alfa ' + r2.alfa + ')');
    await ctx.close();
  }

  /* ═══════════════ checklist 4 · cookies ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({}, { cookiesVistas: false });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(3800);
    const d1 = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    await page.click('#cookies-aceptar');
    const d2 = await page.evaluate(() => ({ d: getComputedStyle(document.getElementById('cookies')).display, k: localStorage.getItem('casamaria-cookies') }));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(600);
    const d3 = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    comprobar(d1 === 'flex' && d2.d === 'none' && d2.k === 'ok' && d3 === 'none', 'checklist 4 · cookies: sale, el botón lo cierra de verdad y no vuelve al recargar (' + [d1, d2.d, d3].join(' → ') + ')');
    await ctx.close();
  }

  /* ═══════════════ checklist 3 · menú móvil (con la cabecera ya fija) y sticky del corte ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(3800);
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(500);
    const cerrado = await page.evaluate(() => { const r = document.getElementById('navegacion').getBoundingClientRect(); return { bottom: r.bottom, vis: getComputedStyle(document.getElementById('navegacion')).visibility }; });
    await page.click('#hamburguesa');
    await page.waitForTimeout(700);
    const abierto = await page.evaluate(() => { const r = document.getElementById('navegacion').getBoundingClientRect(); return { top: r.top, h: r.height, exp: document.getElementById('hamburguesa').getAttribute('aria-expanded') }; });
    await page.click('#hamburguesa', { timeout: 3000 });
    await page.waitForTimeout(700);
    const otra = await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded'));
    comprobar((cerrado.bottom <= 0 || cerrado.vis === 'hidden') && abierto.top === 0 && abierto.h >= 840 && abierto.exp === 'true' && otra === 'false',
      'checklist 3 · menú móvil: cerrado no asoma, abierto mide la pantalla (' + Math.round(abierto.h) + ' px) y el botón lo vuelve a cerrar');
    /* checklist 2 · el sticky que tiene esta web: el corte de la casa abierta en móvil */
    await page.evaluate(() => window.scrollTo(0, 0));
    const modo = await page.evaluate(() => ({ modo: document.getElementById('casa-abierta').dataset.modo, pin: !!document.querySelector('#casa-abierta').closest('.pin-spacer'), pos: getComputedStyle(document.getElementById('corte')).position }));
    comprobar(modo.modo === 'lista' && !modo.pin && modo.pos === 'sticky', 'casa abierta en móvil: sin anclar, con el corte sticky y la lista de tarjetas (' + JSON.stringify(modo) + ')');
    const tops = [];
    const fichas = await page.evaluate(() => [...document.querySelectorAll('.ficha-estancia')].map(f => f.getBoundingClientRect().top + scrollY));
    for (const y of [fichas[1] - 500, fichas[4] - 500, fichas[7] - 500]) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.waitForTimeout(400);
      tops.push(await page.evaluate(() => { const c = document.getElementById('corte').getBoundingClientRect(); const cab = document.getElementById('cabecera').getBoundingClientRect(); return { top: Math.round(c.top), cab: Math.round(cab.bottom), sobre: document.elementFromPoint(innerWidth / 2, c.top + c.height / 2).closest('#corte') !== null }; }));
    }
    comprobar(tops.every(t => Math.abs(t.top - tops[0].top) <= 2 && t.top >= t.cab && t.sobre), 'checklist 2 · el corte sticky se queda bajo la cabecera mientras pasan las tarjetas y nada lo tapa ' + JSON.stringify(tops));
    const enc = await page.evaluate(() => +document.getElementById('casa-abierta').dataset.encendidas);
    comprobar(enc >= 6, 'casa abierta en móvil: las estancias se encienden al pasar sus tarjetas (' + enc + ')');
    if (conCapturas) await page.screenshot({ path: foto('casa-abierta-movil-390.png') });
    await ctx.close();
  }

  /* ═══════════════ checklist 6 · hero en móviles bajos (sin solapes) + capturas ═══════════════ */
  for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024], [1440, 900]]) {
    const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h }, hasTouch: w < 800, isMobile: w < 800 });
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(4200);
    const r = await page.evaluate(() => {
      const caja = s => { const e = document.querySelector(s).getBoundingClientRect(); return { l: e.left, t: e.top, r: e.right, b: e.bottom, w: e.width }; };
      const piezas = { cab: caja('#cabecera'), logo: caja('#logo-hero'), titulo: caja('#hero-titulo'), datos: caja('.hero__datos'), acciones: caja('.hero__acciones'), ventana: caja('#ventana') };
      const choca = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
      const nombres = Object.keys(piezas), choques = [];
      for (let i = 0; i < nombres.length; i++) for (let j = i + 1; j < nombres.length; j++) if (choca(piezas[nombres[i]], piezas[nombres[j]])) choques.push(nombres[i] + '×' + nombres[j]);
      return { choques, piezas, ancho: document.documentElement.scrollWidth, vw: innerWidth };
    });
    comprobar(r.choques.length === 0, 'checklist 6 · hero ' + w + '×' + h + ': logo, titular, datos, botones y ventana no se pisan' + (r.choques.length ? ' (' + r.choques.join(', ') + ')' : ''));
    comprobar(r.ancho <= r.vw, 'sin desbordamiento horizontal a ' + w + ' px (' + r.ancho + ')');
    if (w < 600) comprobar(r.piezas.ventana.t >= r.piezas.titulo.b && Math.abs(r.piezas.ventana.w - (w - 32)) <= 2, 'hero ' + w + ': la ventana va debajo del titular y mide 100 % − 32 px (' + Math.round(r.piezas.ventana.w) + ')');
    else if (w <= 860) comprobar(r.piezas.ventana.t >= r.piezas.titulo.b, 'hero ' + w + ' (tableta): la ventana va debajo del titular');
    if (conCapturas) {
      await page.screenshot({ path: foto(`${w}x${h}-1-hero.png`) });
      for (const [sel, n] of [['#la-casa', '2-la-casa'], ['#dentro', '4-dentro'], ['#detalles', '5-detalles'], ['#opiniones', '6-opiniones'], ['#olivenza', '7-olivenza'], ['#normas', '8-normas'], ['#fechas', '9-fechas'], ['#contacto', '10-contacto']]) {
        await irA(page, sel, 0.05);
        await page.screenshot({ path: foto(`${w}x${h}-${n}.png`) });
      }
      /* la casa abierta a medio encender */
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
      await irA(page, '#casa-abierta', 0);
      if (w > 860) {
        const total = await page.evaluate(() => { const s = document.querySelector('#casa-abierta').closest('.pin-spacer'); return s ? s.offsetHeight - innerHeight : 0; });
        await rueda(page, Math.round(total * 0.5 / 300), 300, 120);
        await page.waitForTimeout(1500);
      } else {
        await rueda(page, 3, 300, 220); await page.waitForTimeout(900);
      }
      await page.screenshot({ path: foto(`${w}x${h}-3-casa-abierta-a-medias.png`) });
    }
    if (page.errores.length) comprobar(false, 'consola a ' + w + ' px: ' + page.errores[0]);
    await ctx.close();
  }

  /* ═══════════════ casa abierta anclada: las 9 se encienden en orden ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    await page.mouse.move(700, 450);
    await irA(page, '#casa-abierta', 0);
    const anclada = await page.evaluate(() => ({ modo: document.getElementById('casa-abierta').dataset.modo, pin: !!document.querySelector('#casa-abierta').closest('.pin-spacer') }));
    comprobar(anclada.modo === 'anclada' && anclada.pin, 'casa abierta en escritorio: anclada con scrub');
    const orden = [], noches = [];
    for (let i = 0; i < 90; i++) {
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(110);
      const s = await page.evaluate(() => ({ ids: [...document.querySelectorAll('.celda.es-encendida')].map(c => c.dataset.estancia), noche: parseFloat(getComputedStyle(document.getElementById('abierta-noche')).opacity), visibles: [...document.querySelectorAll('.celda.es-encendida')].filter(c => c.getBoundingClientRect().height > 0 && getComputedStyle(c).display !== 'none').length }));
      s.ids.forEach(id => { if (!orden.includes(id)) orden.push(id); });
      noches.push(s.noche);
      if (orden.length === 9 && s.noche < 0.05 && i > 40) break;
    }
    comprobar(orden.join(',') === ordenJson.join(','), 'casa abierta: las 9 estancias se encienden en el orden de casa.json (' + orden.join(' → ') + ')');
    comprobar(Math.max(...noches) > 0.95 && noches[noches.length - 1] < 0.05, 'casa abierta: cae la noche y amanece al terminar');
    const vis = await page.evaluate(() => [...document.querySelectorAll('.celda.es-encendida')].filter(c => c.getBoundingClientRect().height > 0 && getComputedStyle(c).display !== 'none' && getComputedStyle(c).visibility !== 'hidden').length);
    comprobar(vis === 9, 'checklist 9 · las 9 celdas encendidas se VEN (cuenta de visibles, no de clases): ' + vis);
    await ctx.close();
  }

  /* ═══════════════ casa.json manda: cambiar de planta mueve la estancia ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' });
    const normal = await (async () => {
      await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(800);
      return page.evaluate(() => { const c = document.querySelector('.celda[data-estancia="dormitorio-3"]'); return { top: parseFloat(c.style.top), planta: c.dataset.planta }; });
    })();
    const otro = JSON.parse(JSON.stringify(casaJson));
    otro.estancias.find(e => e.id === 'dormitorio-3').planta = 'baja';
    await page.route('**/data/casa.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(otro) }));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800);
    const movida = await page.evaluate(() => { const c = document.querySelector('.celda[data-estancia="dormitorio-3"]'); return { top: parseFloat(c.style.top), planta: c.dataset.planta }; });
    comprobar(normal.planta === 'alta' && movida.planta === 'baja' && movida.top > 60 && normal.top < 40, 'casa.json: pasar el dormitorio 3 a la planta baja lo mueve en el corte (top ' + normal.top.toFixed(1) + '% → ' + movida.top.toFixed(1) + '%)');
    await ctx.close();
  }

  /* ═══════════════ formulario: fechas, mailto y WhatsApp ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(600);
    const hoy = new Date(); const f = d => { const x = new Date(hoy); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
    await page.fill('#llegada', f(30)); await page.fill('#salida', f(28));
    await page.fill('#nombre', 'Prueba');
    await page.click('#reserva button[type="submit"]');
    const e1 = await page.evaluate(() => ({ txt: document.getElementById('fechas-error').textContent, inv: document.getElementById('salida').getAttribute('aria-invalid'), listo: document.getElementById('reserva-listo').hidden }));
    comprobar(/posterior/.test(e1.txt) && e1.inv === 'true' && e1.listo, 'formulario: una salida anterior a la llegada da un aviso en línea y no compone nada');
    await page.fill('#salida', f(32)); await page.fill('#adultos', '4'); await page.fill('#ninos', '2');
    await page.check('input[name="cuna"][value="si"]');
    await page.click('#reserva button[type="submit"]');
    const r = await page.evaluate(() => ({ href: document.getElementById('reserva-email').getAttribute('href'), texto: document.getElementById('reserva-texto').textContent, wa: document.getElementById('reserva-whatsapp').disabled }));
    const cuerpo = decodeURIComponent((r.href.split('body=')[1] || ''));
    comprobar(r.href.startsWith('mailto:casamaria.olivenza@gmail.com?subject=Consulta%20de%20fechas') && r.href.includes('%0D%0A') && !/ /.test(r.href) && cuerpo.includes('Hola María, somos 4 adultos y 2 niños y queremos ir del'),
      'formulario: el mailto lleva asunto y cuerpo bien codificados (CRLF, tildes)');
    comprobar(/2 noches/.test(r.texto) && /cuna/.test(r.texto), 'formulario: el mensaje cuenta noches y pide la cuna');
    comprobar(r.wa === true, 'formulario: WhatsApp apagado con "whatsapp": null');
    const cfg = JSON.parse(fs.readFileSync(path.join(raiz, 'data/config.json'), 'utf8')); cfg.whatsapp = '34685875949';
    await page.route('**/data/config.json', rr => rr.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cfg) }));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(700);
    const wa2 = await page.evaluate(() => document.getElementById('reserva-whatsapp').disabled);
    comprobar(wa2 === false, 'formulario: con un número en config.json el botón de WhatsApp se enciende');
    /* mapa solo bajo clic */
    const antes = await page.evaluate(() => document.querySelectorAll('iframe').length);
    await page.click('.map-consent');
    const src = await page.evaluate(() => (document.querySelector('.olivenza__mapa iframe') || {}).src || '');
    comprobar(antes === 0 && src.includes('maps?q=C/+La+Higuera+13+Olivenza&output=embed'), 'mapa: no hay iframe hasta pulsar .map-consent');
    await ctx.close();
  }

  /* ═══════════════ opiniones: el mazo y su borrado sobre una copia ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' });
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(600);
    const citas = await page.evaluate(() => [...document.querySelectorAll('.nota')].map(n => ({ q: n.querySelector('blockquote').textContent, c: n.querySelector('figcaption').textContent })));
    comprobar(citas.length === 7 && citas.every(c => c.c === 'Opinión en Booking'), 'opiniones: 7 citas, todas firmadas «Opinión en Booking», sin nombre');
    const arriba1 = await page.evaluate(() => window.CasaMaria.opiniones.arriba);
    await page.focus('#mazo'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    const r = await page.evaluate(() => ({ arriba: window.CasaMaria.opiniones.arriba, vivo: document.getElementById('mazo-vivo').textContent, cuenta: document.getElementById('mazo-cuenta').textContent }));
    comprobar(r.arriba === (arriba1 + 1) % 7 && r.vivo.length > 10 && r.cuenta === '2 de 7', 'opiniones: Intro pasa a la siguiente nota y se anuncia con aria-live');
    await ctx.close();

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'casamaria-'));
    const fuera = new Set(['scripts', 'screenshots', '.git']);
    const copiar = (de, a) => { fs.mkdirSync(a, { recursive: true }); for (const e of fs.readdirSync(de, { withFileTypes: true })) { if (fuera.has(e.name)) continue; const o = path.join(de, e.name), d = path.join(a, e.name); if (e.isDirectory()) copiar(o, d); else fs.copyFileSync(o, d); } };
    copiar(raiz, tmp);
    execFileSync(process.execPath, [path.join(raiz, 'scripts/quitar-opiniones.mjs'), tmp], { stdio: 'ignore' });
    const s2 = await servir(tmp, 4198);
    const c2 = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    await c2.addInitScript(() => { try { localStorage.setItem('casamaria-cookies', 'ok'); } catch (e) {} });
    const p2 = await c2.newPage(); const err2 = [], resp2 = [];
    p2.on('console', m => { if (m.type() === 'error') err2.push(m.text()); });
    p2.on('pageerror', e => err2.push(e.message));
    p2.on('response', rr => { if (rr.status() >= 400) resp2.push(rr.status() + ' ' + rr.url()); });
    await p2.goto('http://127.0.0.1:4198/', { waitUntil: 'load' });
    await p2.waitForTimeout(4200);
    await p2.mouse.move(700, 450);
    await hastaAbajo(p2);
    const q = await p2.evaluate(() => ({
      seccion: !!document.getElementById('opiniones'), menu: !!document.querySelector('a[href="#opiniones"]'),
      orden: [...document.querySelectorAll('main section[id]')].filter(s => !s.parentElement.closest('section')).map(s => s.id).join(','),
      ld: JSON.parse(document.getElementById('datos-estructurados').textContent),
      hilo: parseFloat(getComputedStyle(document.getElementById('hilo-d')).strokeDashoffset)
    }));
    comprobar(!q.seccion && !q.menu && !('aggregateRating' in q.ld) && q.ld.numberOfRooms === 3, 'borrado de opiniones: sin sección, sin enlace en el menú y sin aggregateRating en el JSON-LD');
    comprobar(q.orden === 'inicio,la-casa,casa-abierta,dentro,detalles,galeria-completa,olivenza,normas,fechas,contacto', 'borrado de opiniones: el resto de secciones sigue en orden (' + q.orden + ')');
    comprobar(err2.length === 0 && resp2.length === 0 && q.hilo < 0.01, 'borrado de opiniones: sin errores, sin 404 y el hilo llega igual al final' + (err2[0] ? ': ' + err2[0] : '') + (resp2[0] ? ' ' + resp2[0] : ''));
    await c2.close(); s2.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ═══════════════ densidades: sin ?revision no hay mando; las dos versiones ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await page.goto(BASE, { waitUntil: 'load' }); await page.waitForTimeout(800);
    const sin = await page.evaluate(() => ({ hidden: document.getElementById('mando').hidden, d: getComputedStyle(document.getElementById('mando')).display }));
    comprobar(sin.hidden && sin.d === 'none', 'sin ?revision no hay mando');
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({}, { cookiesVistas: false });
    await page.goto(BASE + '?revision', { waitUntil: 'load' }); await page.waitForTimeout(4200);
    const conCookies = await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility);
    await page.click('#cookies-aceptar'); await page.waitForTimeout(500);
    const r0 = await page.evaluate(() => ({ vis: getComputedStyle(document.getElementById('mando')).visibility, aviso: document.getElementById('mando-aviso').textContent, hiddenAviso: document.getElementById('mando-aviso').hidden }));
    comprobar(conCookies === 'hidden' && r0.vis === 'visible', 'mando: se aparta mientras está el aviso de cookies y aparece al cerrarlo');
    comprobar(!r0.hiddenAviso && /Distribución provisional: pendiente de María/.test(r0.aviso), 'mando: con casa.json provisional enseña «Distribución provisional: pendiente de María»');
    if (conCapturas) await page.screenshot({ path: foto('densidad-trazo-1440.png') });
    await page.click('[data-densidad="sobria"]'); await page.waitForTimeout(1200);
    const s = await page.evaluate(() => ({
      clase: document.documentElement.classList.contains('densidad-sobria'),
      hilo: getComputedStyle(document.getElementById('hilo')).display,
      clip: getComputedStyle(document.querySelector('.entera__foto .marco__foto')).clipPath,
      ventana: getComputedStyle(document.querySelector('.ventana__marco')).clipPath,
      modo: document.getElementById('casa-abierta').dataset.modo,
      pin: !!document.querySelector('#casa-abierta').closest('.pin-spacer'),
      pestanas: document.querySelectorAll('#abierta-pestanas [role="tab"]').length,
      encendidas: document.querySelectorAll('.celda.es-encendida').length,
      cinta: getComputedStyle(document.querySelector('.cinta__pista')).display,
      galeria: getComputedStyle(document.getElementById('galeria-completa')).display,
      ancho: document.documentElement.scrollWidth, vw: innerWidth
    }));
    comprobar(s.clase && s.hilo === 'none' && s.clip === 'none' && s.ventana !== 'none', 'sobria: fuera el hilo y los marcos de tejado, salvo la ventana del hero');
    comprobar(s.modo === 'pestanas' && !s.pin && s.pestanas === 9 && s.encendidas === 9, 'sobria: la casa abierta sin anclar, encendida y con 9 pestañas');
    comprobar(s.cinta === 'grid', 'sobria: la cinta pasa a rejilla quieta');
    await page.waitForFunction(() => window.CasaMaria.galeriaCompleta && window.CasaMaria.galeriaCompleta.total === 66, null, { timeout: 8000 }).catch(() => {});
    await page.click('[data-filtro="banos"]'); await page.waitForTimeout(200);
    const g = await page.evaluate(() => ({ total: document.querySelectorAll('#rejilla-fotos li').length, vis: document.querySelectorAll('#rejilla-fotos li:not([hidden])').length, cuenta: document.getElementById('filtros-cuenta').textContent }));
    comprobar(s.galeria === 'block' && g.total === 66 && g.vis === fotosJson.fotos.filter(f => f.categoria === 'banos').length, 'sobria: añade la galería completa filtrable con las 66 fotos (Baños: ' + g.vis + ')');
    comprobar(s.ancho <= s.vw, 'sobria: sin desbordamiento horizontal');
    await page.click('#abierta-pestanas [role="tab"]:nth-child(3)'); await page.waitForTimeout(200);
    const tab = await page.evaluate(() => ({ sel: document.querySelector('#abierta-pestanas [aria-selected="true"]').textContent, panel: document.getElementById('panel-nombre').textContent }));
    comprobar(tab.sel === tab.panel, 'sobria: cada pestaña enseña su estancia en el panel (' + tab.panel + ')');
    if (conCapturas) {
      await page.screenshot({ path: foto('densidad-sobria-1440.png') });
      await irA(page, '#casa-abierta', 0); await page.screenshot({ path: foto('densidad-sobria-casa-abierta-1440.png') });
      await irA(page, '#galeria-completa', 0.02); await page.screenshot({ path: foto('densidad-sobria-galeria-1440.png') });
    }
    await page.click('[data-densidad="trazo"]'); await page.waitForTimeout(1200);
    const v = await page.evaluate(() => ({ clase: document.documentElement.classList.contains('densidad-trazo'), hilo: getComputedStyle(document.getElementById('hilo')).display, galeria: getComputedStyle(document.getElementById('galeria-completa')).display }));
    comprobar(v.clase && v.hilo !== 'none' && v.galeria === 'none', 'densidades: se puede volver a «Un solo trazo»');
    comprobar(page.errores.length === 0, 'consola limpia en modo revisión' + (page.errores.length ? ': ' + page.errores[0] : ''));
    await ctx.close();
  }

  /* ═══════════════ textos, legales y estáticos ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    const prohibido = [/casa rural/i, /turismo rural/i, /desde\s*\d+[.,]?\d*\s*€/i, /para[ií]so/i, /inolvidable/i, /rinc[oó]n con encanto/i, /desconexi[oó]n total/i];
    const permitidas = ['La casa es casi mejor que en las fotos, todo muy limpio y organizado.', 'Una preciosidad. Muy limpio y cuidado, súper grande y bien decorado.',
      'Una casa preciosa, cuidada al detalle y en la que no falta absolutamente nada para disfrutar de una estancia estupenda.', 'Zona muy tranquila pero cerca del centro.',
      'La atención de María ha sido excepcional, siempre atenta a cada detalle.', 'La casa tiene de todo, muy limpia y anfitriona agradable y se preocupa por todo que esté bien! Volveremos!',
      'María es encantadora cuida todos los detalles para que te sientas como en tu propia casa.'];
    for (const pag of ['', 'aviso-legal.html', 'privacidad.html', 'no-existe']) {
      const res = await page.goto(BASE + pag, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({ texto: document.body.textContent + ' ' + document.title, robots: (document.querySelector('meta[name="robots"]') || {}).content, primera: document.head.firstElementChild.getAttribute('charset') }));
      const malos = prohibido.filter(re => re.test(r.texto)).map(String);
      comprobar(malos.length === 0, 'textos prohibidos en /' + pag + ': ' + (malos.join(', ') || 'ninguno'));
      comprobar(r.robots === 'noindex, nofollow' && r.primera === 'utf-8', 'noindex en /' + pag);
      if (pag === '') {
        const citas = await page.evaluate(() => [...document.querySelectorAll('.nota blockquote')].map(b => b.textContent.trim()));
        comprobar(citas.every(c => permitidas.includes(c)), 'opiniones: solo citas textuales comprobadas, sin parafrasear');
        comprobar(/AT-BA-00178/.test(await page.evaluate(() => document.querySelector('.pie').textContent)), 'pie: licencia AT-BA-00178');
        comprobar(!/\[PENDIENTE\]|\bTODO\b/.test(r.texto) && !/lorem ipsum/i.test(r.texto), 'portada sin [PENDIENTE], TODO ni relleno');
        comprobar(!(await page.evaluate(() => [...document.querySelectorAll('a')].some(a => /casamariaolivenza\.com/.test(a.href)))), 'ningún enlace al dominio casamariaolivenza.com');
        const ld = await page.evaluate(() => JSON.parse(document.getElementById('datos-estructurados').textContent));
        comprobar(ld['@type'] === 'LodgingBusiness' && ld.numberOfRooms === 3 && ld.address.streetAddress && ld.telephone && ld.aggregateRating, 'JSON-LD LodgingBusiness con dirección, teléfono, numberOfRooms 3 y aggregateRating (con el módulo puesto)');
        const og = await page.evaluate(() => document.querySelector('meta[property="og:image"]').content);
        comprobar(fs.existsSync(path.join(raiz, og)), 'og:image existe (' + og + ')');
        const v = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"], script[src]')].map(n => n.getAttribute('href') || n.getAttribute('src')).filter(u => !/^https?:/.test(u)));
        comprobar(v.every(u => /\?v=[0-9a-f]{8}$/.test(u)), 'CSS y JS propios versionados con ?v=<huella>');
        comprobar(!(await page.evaluate(() => document.documentElement.outerHTML)).includes('cdnjs.cloudflare.com/ajax/libs/lenis'), 'Lenis no sale de cdnjs (404 silencioso)');
      }
      if (pag === 'no-existe') comprobar(res.status() === 404, '404.html responde en una ruta que no existe');
    }
    /* checklist 9 · clases de estado con prefijo (estático) */
    const js = ['js/main.js', 'js/opiniones.js'].map(f => fs.readFileSync(path.join(raiz, f), 'utf8')).join('\n');
    const clases = [...js.matchAll(/classList\.(?:add|toggle|remove)\('([^']+)'/g)].map(m => m[1]);
    const sinPrefijo = [...new Set(clases)].filter(c => !/^(es-|con-|sin-|cursor|menu-abierto|cabecera--|cortina|fuera|densidad-|cookies-visibles)/.test(c));
    comprobar(sinPrefijo.length === 0, 'checklist 9 · clases de estado con prefijo (es-…): ' + (sinPrefijo.join(', ') || 'todas'));
    const css = fs.readFileSync(path.join(raiz, 'css/estilos.css'), 'utf8') + fs.readFileSync(path.join(raiz, 'css/opiniones.css'), 'utf8');
    /* un estado nunca va solo en CSS (siempre calificado por su bloque: .celda.es-activa) y ningún bloque se llama como un estado */
    const sueltas = css.match(/(^|[},])\s*\.es-[a-z-]+\s*[{,]/gm) || [];
    const bloques = new Set([...fs.readFileSync(path.join(raiz, 'index.html'), 'utf8').matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)).filter(c => !c.startsWith('es-')));
    const estados = [...new Set(clases.filter(c => c.startsWith('es-')).map(c => c.slice(3)))];
    const chocan = estados.filter(e => bloques.has(e));
    comprobar(sueltas.length === 0 && chocan.length === 0, 'checklist 9 · ninguna clase de estado coincide con un bloque' + (sueltas.length || chocan.length ? ': ' + sueltas.concat(chocan).join(' ') : ''));
    /* checklist 8 · todos los tweens de strokeDashoffset con autoRound:false */
    const tweens = [...js.matchAll(/strokeDashoffset:\s*0[^}]*\}/g)].map(m => m[0]);
    comprobar(tweens.length >= 4 && tweens.every(t => /autoRound:\s*false/.test(t)), 'checklist 8 · los ' + tweens.length + ' tweens de strokeDashoffset llevan autoRound:false');
    await ctx.close();
  }
} catch (e) {
  comprobar(false, 'el script se ha caído: ' + (e && e.stack || e));
} finally {
  await navegador.close();
  servidor.close();
}

console.log(notas.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
console.log('\n' + notas.length + ' bien · ' + fallos.length + ' mal');
process.exitCode = fallos.length ? 1 : 0;
