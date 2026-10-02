"""Logo de Casa María, vectorizado desde su PNG (ref/logo-casa-maria-alfa.png, 3x).

Tres piezas, todas en el espacio del recorte del PNG a 1x (460 x 325):
  · la CASA: son rectas, así que no se vectorizan, se redibujan con medidas
    tomadas sobre el PNG a 3x (centro de la línea por filas/columnas; ver
    medir_casa). Un solo trazo: pared izquierda, faldón hasta la chimenea,
    chimenea arriba y abajo (el retorno no se ve), vértice, faldón y pared
    derecha. La comprobación de superposición queda en
    scripts/fuentes/comprobacion-casa.png.
  · la CALIGRAFÍA: potrace en relleno, conservando el pincel seco (las vetas
    claras de la «M» son huecos del trazado, no se rellenan).
  · el ESQUELETO de la caligrafía (tubería de trazos de pluma de Cervantes:
    adelgazado Zhang-Suen, grado por ramas, giro mínimo) ordenado como lo
    escribe la mano: «Casa», la «M» y «aría», y la tilde al final. Sirve de
    máscara: cada trazo revela el relleno al avanzar.

El PNG está «desmezclado» con un solo color: la casa sale como cacao con alfa
bajo (~130) y la caligrafía con alfa alto. Por eso la casa se separa por
geometría (distancia al modelo de rectas) y no por color.

Salida:
  assets/logo/logo-casa-maria.svg   completo (casa en cobre + caligrafía en cacao)
  assets/logo/casa.svg              solo la casa (separadores, 404)
  assets/logo/caligrafia.svg        solo la caligrafía
  assets/favicon.svg                la casa, gruesa, para la pestaña
  assets/logo/trazos.json           casa + esqueleto con anchos (lo lee generar-og y el README)
  y escribe en index.html / 404.html / aviso-legal.html / privacidad.html,
  entre <!-- simbolos:inicio --> y <!-- simbolos:fin -->, el <symbol> de la
  caligrafía; y en index.html, entre <!-- firma:inicio --> y <!-- firma:fin -->,
  los trazos de la máscara de la cortina.

  python scripts/logo.py
"""
import json, math, os, re, sys
import numpy as np
import potrace
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import penlib  # copiado tal cual de asesoria-cervantes-carballo-web/scripts

FUENTE = os.path.join(AQUI, 'fuentes', 'logo-casa-maria-alfa.png')
S = 3                      # el PNG está a 3x del recorte de 460 x 325
VB_W, VB_H = 460, 325
CACAO, COBRE = '#825A50', '#C6A495'

alfa = np.array(Image.open(FUENTE))[..., 3].astype(float)
H, W = alfa.shape
assert (W, H) == (VB_W * S, VB_H * S), (W, H)


# ─────────────────────────── 1 · la casa, medida ───────────────────────────
def centro_columna(y0, y1, x0, x1):
    sub = alfa[y0:y1, x0:x1]; xs = np.arange(x0, x1)
    c = [(sub[i] * xs).sum() / sub[i].sum() for i in range(sub.shape[0]) if sub[i].sum() > 50]
    return float(np.median(c))

def centro_fila(x, y0, y1):
    col = alfa[y0:y1, x]; ys = np.arange(y0, y1); m = col > 25
    return float((col[m] * ys[m]).sum() / col[m].sum())

def extremo(x, y0, y1, desde_abajo=True):
    """y donde la línea cae a media altura (el corte recto del trazo)."""
    col = alfa[y0:y1, x - 2:x + 3].max(axis=1)
    pico = np.median(col[col > 60])
    idx = np.where(col > pico / 2)[0]
    return float(y0 + (idx.max() if desde_abajo else idx.min()))

def medir_casa():
    xi = centro_columna(320, 470, 420, 480)            # pared izquierda
    xd = centro_columna(320, 600, 1020, 1080)          # pared derecha
    xc = centro_columna(110, 190, 530, 570)            # chimenea
    # faldones: recta por mínimos cuadrados sobre centros de columna
    def recta(xs):
        ys = [centro_fila(x, 40, 320) for x in xs]
        k, b = np.polyfit(xs, ys, 1); return k, b
    ki, bi = recta(range(470, 711, 10))
    kd, bd = recta(range(790, 1031, 10))
    xv = (bd - bi) / (ki - kd); yv = ki * xv + bi        # vértice
    alero_i = ki * xi + bi; alero_d = kd * xd + bd
    base_chim = ki * xc + bi
    pie_i = extremo(int(round(xi)), 300, 540)
    pie_d = extremo(int(round(xd)), 300, 700)
    tope_chim = extremo(int(round(xc)), 80, 200, desde_abajo=False)
    # grosor: anchura a media altura del perfil de la pared izquierda
    perfil = alfa[400, 420:480]; m = perfil > perfil.max() / 2
    grosor = m.sum() / S
    c = lambda v: round(v / S, 1)
    return {
        'pared_izq': [c(xi), c(pie_i), c(alero_i)],
        'chimenea': [c(xc), c(base_chim), c(tope_chim)],
        'vertice': [c(xv), c(yv)],
        'pared_der': [c(xd), c(alero_d), c(pie_d)],
        'grosor': round(grosor, 2)
    }

casa = medir_casa()
xi, pie_i, alero_i = casa['pared_izq']
xc, base_c, tope_c = casa['chimenea']
xv, yv = casa['vertice']
xd, alero_d, pie_d = casa['pared_der']
# un solo trazo: el regreso por la chimenea pisa la ida y no se ve
CASA_D = (f'M{xi} {pie_i}V{alero_i}L{xc} {base_c}V{tope_c}V{base_c}'
          f'L{xv} {yv}L{xd} {alero_d}V{pie_d}')
CASA_PUNTOS = [(xi, pie_i), (xi, alero_i), (xc, base_c), (xc, tope_c), (xc, base_c),
               (xv, yv), (xd, alero_d), (xd, pie_d)]
print('casa', casa)
print('  d =', CASA_D)


# ──────────────── 2 · la caligrafía: quitar la casa por geometría ────────────────
yy, xx = np.mgrid[0:H, 0:W].astype(float)
dmin = np.full(alfa.shape, 1e9)
pts3 = [(x * S, y * S) for x, y in CASA_PUNTOS]
for (x0, y0), (x1, y1) in zip(pts3, pts3[1:]):
    dx, dy = x1 - x0, y1 - y0; L2 = dx * dx + dy * dy
    if L2 == 0: continue
    t = np.clip(((xx - x0) * dx + (yy - y0) * dy) / L2, 0, 1)
    dmin = np.minimum(dmin, np.hypot(xx - (x0 + t * dx), yy - (y0 + t * dy)))
cerca_casa = dmin < 11
cal = alfa.copy()
cal[cerca_casa & (alfa < 175)] = 0     # la caligrafía nunca baja de ~175 en su núcleo
resto_casa = (cerca_casa & (alfa > 25)).sum()

# comprobación de superposición: modelo de rectas sobre el PNG a 3x
vista = Image.fromarray((255 - alfa.clip(0, 255)).astype(np.uint8)).convert('RGB')
dib = ImageDraw.Draw(vista)
dib.line(pts3, fill=(220, 30, 30), width=2)
for p in pts3: dib.ellipse([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], outline=(30, 90, 220), width=2)
vista.save(os.path.join(AQUI, 'fuentes', 'comprobacion-casa.png'))


# ─────────────────────────── 3 · relleno con potrace ───────────────────────────
def a_d(curvas, k):
    f = lambda v: f'{v * k:.1f}'.rstrip('0').rstrip('.')
    d = []
    for cv in curvas:
        s = cv.start_point
        d.append(f'M{f(s.x)} {f(s.y)}')
        for sg in cv:
            if sg.is_corner:
                d.append(f'L{f(sg.c.x)} {f(sg.c.y)}L{f(sg.end_point.x)} {f(sg.end_point.y)}')
            else:
                d.append(f'C{f(sg.c1.x)} {f(sg.c1.y)} {f(sg.c2.x)} {f(sg.c2.y)} {f(sg.end_point.x)} {f(sg.end_point.y)}')
        d.append('Z')
    return ''.join(d)

UP = 2
img = Image.fromarray(cal.clip(0, 255).astype(np.uint8))
img = img.resize((W * UP, H * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.9))
g = np.array(img)
tinta = g > 62                          # 62: conserva las colas finas (C, «a», remate final)
# potracer toma como figura lo que vale False: se le pasa el FONDO, en bool
curvas = potrace.Bitmap(~tinta).trace(turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.25)
curvas = list(curvas)
if len(curvas) <= 2:            # salió el marco: el signo estaba al revés
    curvas = list(potrace.Bitmap(tinta).trace(turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.25))
CAL_D = a_d(curvas, 1 / (S * UP))
print('caligrafía:', len(curvas), 'curvas,', len(CAL_D), 'caracteres')


# ─────────────────────────── 4 · esqueleto ordenado ───────────────────────────
K = 0.85                                 # 3x → ~1170 px: el esqueleto sale estable
img = Image.fromarray(cal.clip(0, 255).astype(np.uint8))
img = img.resize((int(W * K), int(H * K)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.0))
g = np.array(img).astype(float)
m = g > 55
# huecos: solo se rellenan los finos (vetas del pincel), no los ojos de las letras
fondo = ~m
lab, n = ndimage.label(fondo)
dfondo = ndimage.distance_transform_edt(fondo)
borde = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
for i in range(1, n + 1):
    if i in borde: continue
    zona = lab == i
    if dfondo[zona].max() <= 2.6: m[zona] = True
# la «M» tiene vetas abiertas (muescas, no huecos): cierre fuerte solo en su franja
M_X0, M_X1 = int(600 * K / 0.85), int(792 * K / 0.85)
franja = m[:, M_X0:M_X1]
franja = ndimage.binary_closing(franja, structure=np.ones((3, 3)), iterations=4)
franja = ndimage.binary_fill_holes(franja)
m[:, M_X0:M_X1] = franja
lab, n = ndimage.label(m)
tam = ndimage.sum(m, lab, range(1, n + 1))
for i, s_ in enumerate(tam):
    if s_ < 40: m[lab == i + 1] = False
esq = penlib.adelgazar(m).astype(bool)
crudos = penlib.trazos_de(esq, podar_umbral=7, corte_giro=1.9, min_pts=8)
dist = ndimage.distance_transform_edt(m)

def palabra(t):
    xs = sorted(p[1] for p in t); ys = sorted(p[0] for p in t)
    mx, my = xs[len(xs) // 2], ys[len(ys) // 2]
    if mx >= M_X1: return 2
    if mx > 610 * K / 0.85 or (mx > 580 * K / 0.85 and my > 560 * K / 0.85): return 1
    return 0

# La «M» son cuatro rectas de pincel y sus vetas desdoblan el esqueleto en
# trozos sueltos. Se rehace como UN trazo, en el orden de la mano: de abajo a
# la izquierda sube al primer pico, baja al valle, sube al segundo pico y baja.
# Los cinco puntos clave se tomaron sobre orden-trazos.png (escala K = 0.85 del
# PNG a 3x); cada punto intermedio se recentra en la tinta por su normal.
M_CLAVE = [(588, 800), (667, 401), (683, 737), (757, 492), (773, 742)]

def recentrar(p, normal, radio=16):
    y, x = p; best = []
    for s_ in range(-radio, radio + 1):
        yy_, xx_ = int(round(y + normal[0] * s_)), int(round(x + normal[1] * s_))
        if 0 <= yy_ < m.shape[0] and 0 <= xx_ < m.shape[1] and m[yy_, xx_]: best.append(s_)
    if not best: return p
    # el tramo de tinta más cercano al punto (no el de la veta vecina)
    tramos, ini = [], best[0]
    for a_, b_ in zip(best, best[1:] + [None]):
        if b_ is None or b_ != a_ + 1: tramos.append((ini, a_)); ini = b_
    t0, t1 = min(tramos, key=lambda t: 0 if t[0] <= 0 <= t[1] else min(abs(t[0]), abs(t[1])))
    s_ = (t0 + t1) / 2
    return (y + normal[0] * s_, x + normal[1] * s_)

def trazo_m():
    clave = [(y * K / 0.85, x * K / 0.85) for x, y in M_CLAVE]
    out, esquinas = [], set()
    for (y0, x0), (y1, x1) in zip(clave, clave[1:]):
        L = math.hypot(y1 - y0, x1 - x0); n_ = max(2, int(L / 6))
        nrm = ((x1 - x0) / L, -(y1 - y0) / L)          # normal (en y, x) a la dirección del tramo
        for i in range(n_):
            p = (y0 + (y1 - y0) * i / n_, x0 + (x1 - x0) * i / n_)
            if i == 0: esquinas.add(len(out))
            out.append(p if i == 0 else recentrar(p, nrm))
    esquinas.add(len(out)); out.append(clave[-1])
    # media móvil corta: el bézier no copia los escalones del recentrado (los picos, intactos)
    suav = [out[i] if (i in esquinas or i == 0 or i == len(out) - 1) else
            ((out[i - 1][0] + 2 * out[i][0] + out[i + 1][0]) / 4, (out[i - 1][1] + 2 * out[i][1] + out[i + 1][1]) / 4)
            for i in range(len(out))]
    return [(int(round(y)), int(round(x))) for y, x in suav]

# tilde de la «í»: trazo corto arriba del todo en «aría»
def es_tilde(t):
    if palabra(t) != 2 or penlib.largo(t) > 95: return False
    ys = [p[0] for p in t]
    techo = min(p[0] for tt in crudos if palabra(tt) == 2 for p in tt)
    return min(ys) - techo < 14 and (max(ys) - min(ys)) < 60 and max(ys) < techo + 70

crudos = [t for t in crudos if palabra(t) != 1] + [trazo_m()]
orden = sorted(crudos, key=lambda t: (palabra(t), es_tilde(t), min(p[1] for p in t)))
trazos = []
fin_prev = None
for t in orden:
    a_, b_ = t[0], t[-1]
    if palabra(t) == 1:
        pass                                            # la «M» ya va en el orden de la mano
    elif fin_prev is None:
        t = t if a_[1] <= b_[1] else t[::-1]           # el primero, desde su punta izquierda
    else:
        da = math.hypot(a_[0] - fin_prev[0], a_[1] - fin_prev[1])
        db = math.hypot(b_[0] - fin_prev[0], b_[1] - fin_prev[1])
        t = t if da <= db else t[::-1]                  # el resto, desde donde quedó la pluma
    fin_prev = t[-1]
    trazos.append(t)

esc = 1 / (S * K)
ESQ = []
for t in trazos:
    anchos = [dist[p] for p in t]
    ancho = (np.percentile(anchos, 92) * 2 * 1.18 + 3) * esc
    simp = penlib.rdp([(p[1] * esc, p[0] * esc) for p in t], 0.35)
    d = penlib.a_bezier(simp, dec=1)
    ESQ.append({'d': d, 'ancho': round(float(ancho), 2), 'largo': round(penlib.largo(simp), 1),
                'palabra': ['casa', 'm', 'aria'][palabra(t)], 'tilde': bool(es_tilde(t))})
print('esqueleto:', len(ESQ), 'trazos ·', ' '.join(f"{e['palabra']}{'´' if e['tilde'] else ''}:{e['largo']:.0f}" for e in ESQ))

# vista del orden (para revisar a ojo)
vista = Image.fromarray(np.where(m, 215, 255).astype(np.uint8)).convert('RGB')
dib = ImageDraw.Draw(vista)
colores = [(220, 40, 40), (40, 120, 220), (40, 170, 60), (200, 120, 0), (150, 40, 200), (0, 160, 160), (220, 0, 140), (100, 100, 0)]
for k, t in enumerate(trazos):
    c = colores[k % len(colores)]
    pp = [(p[1], p[0]) for p in t]
    dib.line(pp, fill=c, width=2)
    dib.ellipse([pp[0][0] - 5, pp[0][1] - 5, pp[0][0] + 5, pp[0][1] + 5], fill=c)
    dib.text((pp[0][0] + 7, pp[0][1] - 14), str(k + 1), fill=c)
vista.save(os.path.join(AQUI, 'fuentes', 'orden-trazos.png'))


# ─────────────────────────── 5 · archivos ───────────────────────────
G = casa['grosor']
os.makedirs(os.path.join(RAIZ, 'assets', 'logo'), exist_ok=True)

def guardar(nombre, cuerpo, vb=f'0 0 {VB_W} {VB_H}', titulo='Casa María'):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{titulo}">'
           f'<title>{titulo}</title>{cuerpo}</svg>\n')
    ruta = os.path.join(RAIZ, nombre)
    with open(ruta, 'w', encoding='utf8', newline='\n') as f: f.write(svg)
    import xml.etree.ElementTree as ET; ET.parse(ruta)      # XML bien formado o falla aquí

casa_svg = (f'<path d="{CASA_D}" fill="none" stroke="{COBRE}" stroke-width="{G}" '
            f'stroke-linejoin="miter" stroke-miterlimit="10"/>')
cal_svg = f'<path d="{CAL_D}" fill="{CACAO}"/>'
guardar('assets/logo/logo-casa-maria.svg', casa_svg + cal_svg)
guardar('assets/logo/caligrafia.svg', cal_svg, titulo='Casa María, caligrafía')
caja = f'{xi - 12:.0f} {tope_c - 12:.0f} {xd - xi + 24:.0f} {pie_d - tope_c + 24:.0f}'
guardar('assets/logo/casa.svg', casa_svg, vb=caja, titulo='La casa del logo de Casa María')
# favicon: la misma casa con trazo grueso; cacao en claro, cobre en oscuro
fav = (f'<style>path{{stroke:{CACAO}}}@media (prefers-color-scheme:dark){{path{{stroke:{COBRE}}}}}</style>'
       f'<path d="{CASA_D}" fill="none" stroke-width="15" stroke-linejoin="miter" stroke-linecap="square"/>')
cx0, cy0 = xi - 18, tope_c - 14
lado = max(xd - xi + 36, pie_d - tope_c + 28)
guardar('assets/favicon.svg', fav, vb=f'{cx0:.0f} {cy0:.0f} {lado:.0f} {lado:.0f}', titulo='Casa María')

with open(os.path.join(RAIZ, 'assets', 'logo', 'trazos.json'), 'w', encoding='utf8', newline='\n') as f:
    json.dump({'viewBox': [0, 0, VB_W, VB_H], 'casa': {'d': CASA_D, 'grosor': G, 'medidas': casa},
               'firma': ESQ}, f, ensure_ascii=False, indent=1)


# ─────────────────── 6 · inyectar en las páginas ───────────────────
SIMBOLOS = ('<svg class="simbolos" width="0" height="0" aria-hidden="true" focusable="false"><defs>'
            f'<symbol id="cm-caligrafia" viewBox="0 0 {VB_W} {VB_H}">'
            f'<path style="fill:var(--tinta-logo,{CACAO})" d="{CAL_D}"/></symbol></defs></svg>')

def mascara_firma():
    """Trazos de la máscara de la cortina: blancos, pathLength=1, ocultos hasta su turno."""
    filas = []
    for i, e in enumerate(ESQ):
        filas.append(f'<path class="firma__trazo" pathLength="1" data-largo="{e["largo"]}" '
                     f'stroke-width="{e["ancho"]}" d="{e["d"]}"/>')
    return '\n'.join(filas)

def sustituir(pagina, marca, bloque):
    ruta = os.path.join(RAIZ, pagina)
    if not os.path.exists(ruta): return
    with open(ruta, encoding='utf8', newline='') as f: t = f.read()
    ini, fin = f'<!-- {marca}:inicio', f'<!-- {marca}:fin -->'
    a, b = t.find(ini), t.find(fin)
    if a < 0 or b < 0: print('  sin marcas', marca, 'en', pagina); return
    a_fin = t.index('-->', a) + 3
    nuevo = t[:a_fin] + '\n' + bloque + '\n' + t[b:]
    assert len(nuevo) > len(t) * 0.5, 'me niego: ' + pagina + ' perdería demasiado'
    with open(ruta, 'w', encoding='utf8', newline='') as f: f.write(nuevo)
    print('  ' + marca + ' →', pagina)

for p in ['index.html', '404.html', 'aviso-legal.html', 'privacidad.html']:
    sustituir(p, 'simbolos', SIMBOLOS)
sustituir('index.html', 'firma', mascara_firma())
print('restos de la casa en la caligrafía (px a 3x):', resto_casa)
