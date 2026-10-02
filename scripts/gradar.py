"""Gradación común de las 66 fotos de Booking (memoria «food photo consistency»).

Son fotos de móvil, casi todas verticales y con el balance de blancos desigual
(unas azuladas con luz de ventana, otras amarillas con bombilla). La receta
iguala el TONO sin tocar lo que hay en la foto: ni cambios de fondo ni
recortes, ni desenfoque simulado (aquí no hay platos que aislar: son estancias,
y desenfocarlas mentiría sobre cómo son).

  1. Balance de blancos por «parche blanco»: los píxeles claros y poco
     saturados (paredes, sábanas, azulejo) se llevan hacia el blanco cálido del
     papel #F6F0EA. La fuerza depende de cuántos neutros haya: las fotos
     nocturnas del jacuzzi (velas, casi sin neutros) apenas se tocan, porque su
     calidez es lo que son.
  2. Tono común: sombras hacia el cacao (#825A50 muy diluido) y luces hacia el
     papel, con una curva en S suave.
  3. Saturación contenida: los colores muy vivos (la pared fucsia, el césped
     artificial, los cojines rojos) bajan un poco más que el resto.
  4. Brillo medio igualado hacia un objetivo común, sin pasarse.

Entrada: casa-maria-olivenza-bocetos/ref/booking/<id>.jpg (originales, no se tocan)
Salida:  scripts/fuentes/graduadas/<id>.jpg (máster a tamaño original, q 94)
Después: node scripts/fotos.mjs saca las versiones AVIF/WebP/JPG.

  python scripts/gradar.py            (todas)
  python scripts/gradar.py 357563154  (una, para probar)
"""
import os, sys, glob
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.normpath(os.path.join(AQUI, '..', '..', 'casa-maria-olivenza-bocetos', 'ref', 'booking'))
DESTINO = os.path.join(AQUI, 'fuentes', 'graduadas')
os.makedirs(DESTINO, exist_ok=True)

PAPEL = np.array([246, 240, 234]) / 255.0
CACAO = np.array([130, 90, 80]) / 255.0
NOCHE = np.array([33, 24, 22]) / 255.0

def a_lineal(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def a_srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)

def gradar(ruta):
    im = Image.open(ruta).convert('RGB')
    x = np.asarray(im).astype(np.float64) / 255.0
    lin = a_lineal(x)
    lum = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    mx, mn = x.max(-1), x.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-6)

    # 1 · parche blanco: claros (percentil 80-99,5 de luminancia) y poco saturados
    p80, p995 = np.percentile(lum, 80), np.percentile(lum, 99.5)
    neutros = (lum > p80) & (lum < p995) & (sat < 0.22)
    cuota = neutros.mean()
    if cuota > 0.004:
        medio = lin[neutros].mean(0)
        objetivo = a_lineal(PAPEL) * (medio.mean() / a_lineal(PAPEL).mean())
        ganancia = objetivo / np.maximum(medio, 1e-4)
        fuerza = float(np.clip(cuota / 0.05, 0.25, 0.85))       # pocas paredes claras → corrección suave
        ganancia = 1 + (ganancia - 1) * fuerza
        ganancia = np.clip(ganancia, 0.82, 1.22)
        lin = lin * ganancia
    x = np.clip(a_srgb(np.clip(lin, 0, 1)), 0, 1)

    # 4 · brillo medio hacia un objetivo común (gamma, sin quemar luces)
    L = 0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2]
    nocturna = np.median(L) < 0.36
    objetivo_L = 0.40 if nocturna else 0.56
    g = np.clip(np.log(objetivo_L) / np.log(max(np.median(L), 1e-3)), 0.82, 1.18)
    x = np.power(x, g)                     # mediana^g = objetivo

    # 2 · tono común: S suave + sombras al cacao + luces al papel
    L = 0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2]
    s_curva = L + 0.10 * np.sin(np.pi * (L - 0.5)) * (1 - np.abs(2 * L - 1)) * 1.6
    x = x * (np.clip(s_curva, 0, 1) / np.maximum(L, 1e-4))[..., None]
    L = np.clip(0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2], 0, 1)
    sombra = np.clip(1 - L / 0.45, 0, 1) ** 1.6
    luz = np.clip((L - 0.62) / 0.38, 0, 1) ** 1.4
    tinte_sombra = (CACAO / CACAO.mean() - 1) * 0.09
    tinte_luz = (PAPEL / PAPEL.mean() - 1) * 0.55
    x = x * (1 + sombra[..., None] * tinte_sombra + luz[..., None] * tinte_luz)
    # negro elevado hacia la noche de la marca (nunca negro puro)
    x = NOCHE * 0.55 + x * (1 - NOCHE * 0.55)

    # 3 · saturación contenida, más en lo muy vivo
    L = (0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2])[..., None]
    mx, mn = x.max(-1, keepdims=True), x.min(-1, keepdims=True)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    factor = 0.88 - 0.16 * np.clip((sat - 0.45) / 0.4, 0, 1)
    x = L + (x - L) * factor

    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))

if __name__ == '__main__':
    ids = sys.argv[1:] or [os.path.splitext(os.path.basename(p))[0] for p in sorted(glob.glob(os.path.join(ORIGEN, '[0-9]*.jpg')))]
    for i in ids:
        out = gradar(os.path.join(ORIGEN, i + '.jpg'))
        out.save(os.path.join(DESTINO, i + '.jpg'), quality=94, subsampling=0)
    print(len(ids), 'fotos graduadas en', DESTINO)
