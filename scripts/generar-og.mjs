/* og:image hecha a propósito (1200 × 630): el logo sobre el papel y la
   ventana con forma de casa con la foto del jacuzzi dentro, con su contorno
   de cobre. Se compone en HTML y se fotografía con Playwright.

   node scripts/generar-og.mjs   → assets/og-casa-maria.jpg
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = fs.readFileSync(path.join(raiz, 'assets/logo/logo-casa-maria.svg'), 'utf8');
/* en base64: una página about:blank no puede leer file:// */
const foto = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(raiz, 'assets/fotos/357563154-810.jpg')).toString('base64');
const W = 1200, H = 630;
/* ventana: 380 de ancho, tejado a 0,37 del ancho, chimenea al 17 % */
const vx = 742, vy = 54, vw = 384, vh = 576;
const alero = 0.37 * vw, cx = 0.172 * vw, yc = alero * (1 - 2 * 0.172), tope = yc - 0.197 * vw;
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Mulish:wght@600&display=swap" rel="stylesheet">
<style>
  body{margin:0;width:${W}px;height:${H}px;background:#F6F0EA;position:relative;overflow:hidden;font-family:Mulish,sans-serif}
  .logo{position:absolute;left:70px;top:118px;width:560px}
  .logo svg{width:100%;height:auto;overflow:visible}
  .lugar{position:absolute;left:78px;top:520px;font:600 22px/1 Mulish;letter-spacing:.3em;text-transform:uppercase;color:#755248}
  .ventana{position:absolute;left:${vx}px;top:${vy}px;width:${vw}px;height:${vh}px;
    clip-path:polygon(50% 0,100% ${alero}px,100% 100%,0 100%,0 ${alero}px);background:url('${foto}') center 60%/cover}
  svg.trazo{position:absolute;left:${vx}px;top:${vy}px;overflow:visible}
</style></head><body>
<div class="logo">${logo}</div>
<p class="lugar">Olivenza · casa entera para 6</p>
<div class="ventana"></div>
<svg class="trazo" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}"><path d="M0 ${vh}V${alero}L${cx} ${yc}V${tope}V${yc}L${vw / 2} 0L${vw} ${alero}V${vh}" fill="none" stroke="#C6A495" stroke-width="3.2"/></svg>
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: W, height: H } });
await pagina.setContent(html, { waitUntil: 'networkidle' });
await pagina.screenshot({ path: path.join(raiz, 'assets/og-casa-maria.jpg'), type: 'jpeg', quality: 88 });
await navegador.close();
console.log('assets/og-casa-maria.jpg');
