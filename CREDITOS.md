# Créditos

## Fotografías

Las 66 fotos son las de la ficha pública de Casa María en Booking, hechas por la propia casa. Se descargaron el 2 de octubre de 2026. No hay ninguna foto de banco de imágenes.

- Originales: `../casa-maria-olivenza-bocetos/ref/booking/`. La hoja numerada es `_hoja-contactos.jpg`.
- Están graduadas con `scripts/gradar.py`: balance de blancos hacia el papel, sombras al cacao y saturación contenida. No se ha cambiado ningún fondo ni hay recortes que engañen sobre la casa.
- Hay que pedirle a María permiso para usarlas en su web. Son suyas, pero ahora mismo están publicadas en Booking.

## Logo

El logo es el de Casa María.

- Está vectorizado desde `scripts/fuentes/logo-casa-maria-alfa.png` con `scripts/logo.py`, que traza la caligrafía con potrace.
- La casa se ha redibujado con medidas tomadas del PNG.
- Si existe el vector original, hay que sustituir este.

## Tipografías

- Gilda Display, de Eduardo Tunni. Licencia SIL Open Font License, vía Google Fonts.
- Mulish, de Vernon Adams, Cyreal y Jacques Le Bailly. Licencia SIL Open Font License, vía Google Fonts.

## Librerías

- GSAP 3.12.5 y ScrollTrigger, de GreenSock. Licencia estándar «no charge», servidas desde jsDelivr.
- Lenis 1.1.13, de darkroom.engineering. Licencia MIT, servida desde jsDelivr.

## Herramientas

- `scripts/penlib.py` está copiado de `asesoria-cervantes-carballo-web`. Es la tubería de trazos de pluma: adelgazado, grafo por ramas y giro mínimo.
- potracer (Python) para el trazado de la caligrafía.
- sharp para las versiones AVIF, WebP y JPG.
- Playwright para la verificación, las capturas y la og:image.
