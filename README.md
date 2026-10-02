# Casa María · Olivenza · «Un solo trazo»

Web para **Casa María**, una casa entera de alquiler turístico en C/ La Higuera, 13 · 06100 Olivenza (Badajoz). Tiene licencia **AT-BA-00178**, que corresponde a un apartamento turístico. **No es una casa rural** y la web no lo dice en ningún sitio: `verificar.mjs` falla si aparece «casa rural» o «turismo rural».

**Estado:** terminada en local el 2 de octubre de 2026 y **sin publicar**.
- Lleva `noindex, nofollow` en todas las páginas.
- Lleva el mando de dos versiones, que solo se enseña con `?revision` en la URL.
- Antes de entregarla, sigue la sección «Quitar el mando de maqueta».

```
node scripts/servir.mjs                 → http://127.0.0.1:4196  (hace falta servirla: la casa abierta lee data/*.json)
http://127.0.0.1:4196/?revision         → con el mando de las dos versiones
node scripts/verificar.mjs --capturas   → 102 comprobaciones + screenshots/
```

---

## El concepto: «Un solo trazo»

La casa del logo está dibujada con **una sola línea de cobre**: pared, tejado, chimenea, tejado y pared. La web entera es esa línea, y no se corta:

1. **Cortina.** La línea dibuja la casa sin levantar el pincel. Después «Casa María» se escribe siguiendo el esqueleto de su caligrafía, con la «M» larga por dentro de la casa. «Olivenza» asienta el espaciado. Entonces la silueta de la casa se abre como una **ventana** hacia el hero: es un agujero evenodd que crece. Mientras tanto, el logo vuela a su sitio, porque es un clon con los ids renombrados.
2. **Hero.** El logo grande y una **ventana con forma de casa**, con el mismo contorno de cobre y cuatro fotos en fundido lento. El **hilo** nace donde acaba la pared derecha de la ventana.
3. **El hilo.** Es un único `<svg>` sobre el `<main>` con un path generado en JS desde anclas del HTML (`data-hilo="izq|der|marco|fin"`). En cada marco dibuja la casa entera alrededor de la foto. Cruza la página siempre por el hueco entre secciones, nunca por encima del texto. En móvil va por el margen izquierdo.
4. **Casa abierta.** El corte de la casa, dibujado con el mismo trazo, se enciende estancia a estancia de noche.
5. **Contacto.** El hilo entra por la chimenea y **cierra la casa** de la tarjeta, colocada como en su logo: dirección, email y teléfono.

Todo sale de lo que ya es suyo: el logo, su caligrafía y su paleta. Las toallas de la casa también llevan bordado ese mismo logo.

## Qué es real y qué es provisional

| Dato | Estado | Fuente |
|---|---|---|
| Nombre, dirección, teléfono y email | **Real** | Logo, Turismo Badajoz, Ayuntamiento |
| Licencia AT-BA-00178 | **Real** | Booking, Turismo Badajoz, Ayuntamiento |
| 150 m², 3 dormitorios, 6 personas, 2 baños (uno con hidromasaje), patio, balcón y terraza | **Real** | Booking |
| Equipamiento del inventario | **Real**: solo lo que dice Booking o la anfitriona | Booking |
| Normas y horarios | **Real** | Booking |
| 9,8 «Excepcional» con 158 opiniones y las notas por categoría | **Real** a 2 de octubre de 2026 | Booking |
| Las 7 citas | **Reales y textuales**, sin nombre | Booking |
| Distancias | **Reales** | Booking |
| Lugares «para ver» | **Comprobados** en turismodeolivenza.com (web de turismo del Ayuntamiento) | Ver «Decisiones» |
| Fotos | **Reales**: las 66 de su ficha, graduadas | Booking |
| **Distribución por plantas** | **PROVISIONAL**. Dónde está cada estancia es una suposición | `data/casa.json`, con `"provisional": true` |
| Qué dormitorio tiene la cama grande | **Desconocido**: Booking dice «2 dobles grandes y 1 doble» sin decir cuál | Por eso las tres dicen «cama doble» |
| Equipamiento por estancia (microondas, placa, toldo…) | Sale **de lo que se ve en sus fotos** | Fotos |

**Lo que no se ha inventado:** precios, reserva directa, historia, año de apertura, titular, NIF, WhatsApp y foto de fachada.

## Pendientes para María

1. **Vector del logo** y nombre de la tipografía de la caligrafía. El vector actual sale del PNG: es fiel, pero conviene el original.
2. **Distribución real por plantas**: qué hay arriba y qué abajo, y dónde están el jacuzzi y el segundo baño. Se cambia en `data/casa.json` (ver más abajo).
3. **Una foto de la fachada** y otra de la calle. Hoy no hay ninguna. La ventana del hero y el corte no dependen de ella, y no se ha sustituido por fotos de banco.
4. **Reserva directa**: si la acepta y en qué condiciones (señal, cancelación). Hoy el formulario solo prepara un mensaje y enlaza a Booking.
5. **Precios y temporadas.** La web no enseña ninguno. Los 100 €/día del puente de septiembre fueron una oferta puntual.
6. **WhatsApp**: si el 685 875 949 lo tiene. Para encender el botón, en `data/config.json` hay que poner `"whatsapp": "34685875949"`.
7. **Ficha de Google.** El prompt la daba por inexistente, pero **sí existe**. El 2 de octubre de 2026 tenía **5,0 con 151 reseñas** (categoría «Apartamento turístico»). No se usa en la web: ¿quiere que salga?
8. **Permiso para citar opiniones con nombre.** Hoy van firmadas «Opinión en Booking».
9. **Si quiere salir con foto.** Ahora sale solo «María», por su nombre de pila, como la llaman en las opiniones.
10. **Versión en portugués** (ella lo habla). Sería una segunda fase en `/pt/`.
11. **El dominio casamariaolivenza.com.** No resuelve, y el buscador tiene guardadas páginas de **spam de casino** bajo ese dominio: parece caducado y reutilizado por otros. Google Maps y la ficha del Ayuntamiento aún lo enlazan. Hay que avisarla, y la web no lo enlaza en ningún sitio.
12. **Titular y NIF** para el aviso legal y la privacidad. Están como `[PENDIENTE]`.
13. Permiso para usar sus fotos de Booking en su propia web.

## Mapa de secciones

| # | Sección | Ancla del hilo | Notas |
|---|---|---|---|
| 1 | Hero | nace en la ventana | Logo, titular con char-reveal, tres datos, CTA magnético y ventana con fundido |
| 2 | La casa entera es vuestra | `marco` | Texto editorial, cifras que cuentan y salón en marco de tejado |
| 3 | Casa abierta | — (el hilo pasa por detrás) | Anclada con scrub: noche, encendido y amanecer. 9 `<button>` y `<dialog>` |
| 4 | Lo que hay dentro | `izq` | Inventario a dos columnas, cada línea subrayada por el hilo |
| 5 | Los detalles | `der` | Cita de su cartel y marquee doble en marcos de tejado |
| — | Galería completa | — | **Solo en la versión sobria**: 66 fotos con filtros |
| 6 | Opiniones (módulo) | `izq` | 9,8 que cuenta, categorías dibujadas con hilo y mazo de notas |
| 7 | Olivenza alrededor | `marco` | Distancias, «Para ver» y mapa bajo clic |
| 8 | Para que todo vaya bien | `der` | Normas dichas con tacto |
| 9 | Consultar fechas | `izq` | Formulario sin backend: email, copiar, llamar y WhatsApp apagado |
| 10 | Contacto como su tarjeta | `fin` | El hilo entra por la chimenea y cierra la casa |
| — | Pie | — | Licencia, redes, legal e idiomas |

## La casa abierta se edita en `data/casa.json`

- **`planta`**: `"alta"`, `"baja"` o `"patio"`. Para mover una estancia basta con cambiarlo; el corte se reparte solo. `verificar.mjs` lo comprueba pasando el dormitorio 3 a la planta baja.
- **`peso`**: el ancho relativo de la estancia dentro de su planta.
- **`orden`**: el turno en que se enciende (ahora, de abajo arriba).
- **`fotos`** y **`portada`**: los IDs de `data/fotos.json`.
- **`equipamiento`**: la lista que sale en el panel y en la galería.
- **`"provisional": true`**: mientras esté así, el mando de `?revision` enseña «Distribución provisional: pendiente de María». Con la distribución real, se pone a `false`.

El reparto de fotos se ha comprobado en la hoja de contactos. Siete fotos que no tenían sitio se han colocado por su mobiliario:
- 357563570 → dormitorio 1;
- 357563611 y 378903370 → dormitorio 2;
- 548079030 y 899034639 → dormitorio 3.

La foto de los pétalos (410991129) no sale ni en el hero ni en la casa abierta, y la del corazón de pétalos (410990980) va la última del dormitorio 1. La de los pétalos solo aparece en la galería completa de la sobria, al final de los dormitorios.

## Quitar el módulo de opiniones

```
node scripts/quitar-opiniones.mjs <carpeta>      (sobre una copia)
node scripts/quitar-opiniones.mjs --aqui         (aquí mismo, sin vuelta atrás)
```

El script hace esto:
1. Borra la `<section id="opiniones" data-modulo="opiniones">`, que está entre sus marcas `[MÓDULO OPINIONES]`.
2. Borra las tres líneas con `data-modulo="opiniones"`: el enlace del menú, la hoja y el script.
3. Quita `aggregateRating` del JSON-LD.
4. Borra `css/opiniones.css` y `js/opiniones.js`.
5. Vuelve a versionar.

`main.js` no depende del módulo, y el hilo se recalcula sin esa ancla. `verificar.mjs` lo prueba en una copia temporal: sin errores, sin 404, con las secciones en orden y con el hilo llegando al final. Los tres datos del hero («9,8 en Booking») se quedan, porque no son el módulo.

## Quitar el mando de maqueta

**El mando nunca viaja al cliente.**

**Caso A: entregar «Un solo trazo»** (la cargada):
```
node scripts/quitar-mando.mjs ../casa-maria-entrega
node scripts/comprobar-borrado.mjs ../casa-maria-entrega     → «Sin rastros del mando»
```

`quitar-mando.mjs` escribe una copia limpia fuera de esta carpeta. Quita todo lo que va entre marcas `[MANDO DE MAQUETA] … fin del bloque [MANDO DE MAQUETA]`:
- el aviso de cabecera;
- la lectura de la densidad del `<head>`;
- la galería completa (solo existe para la sobria);
- el `<div class="mando">`;
- el bloque CSS del mando y de la sobria, en `estilos.css` y `opiniones.css`;
- `mandoMaqueta()` de `main.js`;
- la fila `casamaria-densidad` de `privacidad.html`.

Después vuelve a versionar. Se ha probado en esta sesión.

**Caso B: entregar la sobria.**
1. En `index.html`, cambiar `class="sin-js densidad-trazo"` por `densidad-sobria`.
2. En `css/estilos.css`, conservar el bloque de reglas `.densidad-sobria …` (sacarlo de entre las marcas y borrar solo `.mando…`).
3. En `index.html`, sacar de entre sus marcas la sección `#galeria-completa`, para que la conserve.
4. Ejecutar el caso A.
5. `comprobar-borrado.mjs` avisará de `densidad-sobria`, y es lo esperado.

## Cómo se trabaja

| Script | Para qué |
|---|---|
| `python scripts/logo.py` | Mide la casa en el PNG, vectoriza la caligrafía, saca su esqueleto ordenado y escribe `assets/logo/*`, `assets/favicon.svg` y los `<symbol>`/máscara en las páginas. Comprobaciones en `scripts/fuentes/comprobacion-casa.png` y `orden-trazos.png` |
| `python scripts/gradar.py` | Gradación común de las 66 fotos → `scripts/fuentes/graduadas/` |
| `node scripts/fotos.mjs` | AVIF, WebP y JPG a 480, 960 y 1440 → `assets/fotos/`, y rellena `data/fotos.json` |
| `node scripts/construir.mjs` | Rellena cada `<picture data-foto="ID">` del HTML desde `fotos.json` |
| `node scripts/generar-og.mjs` | `assets/og-casa-maria.jpg` (logo sobre papel y ventana con el jacuzzi) |
| `node scripts/versionar.mjs` | `?v=<huella>` en CSS y JS. **Antes de cada publicación** (Pages cachea 10 minutos: avisar de Ctrl+F5) |
| `node scripts/verificar.mjs [--capturas]` | La verificación completa |

Playwright y sharp se usan desde `../alvarotaiagu.github.io/node_modules`: en este repo no hay npm.

## Qué la separa del resto de la carpeta

- **Las Dehesillas** (el otro alojamiento real):
  - **Allí:** el zócalo de almagre como hilo, Anton + Spectral, la cortina al rojo que se enfría y el plano con puntos sobre la foto aérea.
  - **Aquí:** la línea de cobre de su logo, Gilda Display + Mulish, una cortina que firma y se abre como ventana, y un corte de la casa dibujado y pintado desde JSON.
- **Plantilla hotel rural, «Casa Bricaña» / «Orballo»:**
  - **Allí:** habitaciones como ventanas con cruceta en horizontal, vaho, lluvia y brújula.
  - **Aquí:** las estancias son celdas de un corte que se encienden en vertical, de abajo arriba. Tampoco hay clima.
- **Caracola y el balneario:** usan Cormorant + Jost; aquí no.
- **Cortina del Pazo do Souto:** aquí no se abren puertas, es la silueta de la casa la que se vuelve agujero.
- **Asesoría Cervantes y MJ Ramos:** de ellas se reutiliza la técnica de la pluma (`penlib.py`). El gesto es otro: casa y firma son un solo trazo seguido, y el trazo sigue por toda la página.
- **Marabú y Melao v2:** no hay cambio de tema día/noche en la web. La noche solo existe dentro de la casa abierta.

## Decisiones

- **Paleta medida en su logo:** papel #F6F0EA, cobre #C6A495, cacao #825A50. La noche (#211816) y la luz (#E8A869) solo se usan en la casa abierta.
  - El cobre es solo decorativo: sobre el papel da 2:1.
  - `--acento-texto` = cacao al 85 % con tinta: 6,1:1 sobre el papel y 5,5:1 sobre la superficie.
  - Tinta 13,6:1, apagado 5,9:1, blanco sobre cacao 5,95:1.
- **Medidas de la casa corregidas.** El prompt daba la pared izquierda de (147,186) a (147,100). Medida sobre el PNG a 3x, termina en **y = 161,7**, no en 186.
  - Lo demás cuadra: vértice (248,5, 24), pared derecha hasta 209, chimenea de 71,5 a 32 en x = 183,1, grosor 4,33.
  - La superposición está comprobada contra el PNG.
- **La «M» del esqueleto.** Las vetas del pincel seco partían su esqueleto en trozos. Se rehízo como un solo trazo de la mano (abajo → pico → valle → pico → abajo), con cinco puntos clave recentrados en la tinta. La tilde de la «í» va la última.
- **Elvas.** El prompt la daba como «para ver», pero la web de turismo del Ayuntamiento no la recomienda: solo la menciona en la historia del Puente de Ajuda. Por eso sale únicamente dentro de esa frase («el puente que unía Olivenza con Elvas»), que sí está en su web.
- **Nombres oficiales** (turismodeolivenza.com): «Alcázar y Torre del Homenaje», «Iglesia de Santa María Magdalena», «Museo Etnográfico Extremeño "González Santana"», «Iglesia de Santa María del Castillo», «Puerta del Calvario» y «Puente de Ajuda». El «Rincón más bonito de España 2012» de la Magdalena no se ha comprobado y no se usa.
- **Tratamiento de vosotros en toda la web.** Por eso el enlace secundario dice «También podéis reservar en Booking», y no «puedes» como venía en el prompt.
- **Segundo baño.** Booking dice «2 baños», uno con hidromasaje. Por eso las celdas son «Baño con jacuzzi» y «Baño», no «Baños».
- **Cortina:**
  - dura unos 3,3 s;
  - se acelera ×3 si se empieza a bajar;
  - no bloquea el scroll;
  - tiene red de seguridad a los 6 s (JS) y a los 7 s (inline);
  - no sale sin JS (`<noscript>`) ni con movimiento reducido (ni un fotograma);
  - sin GSAP se retira a los 60 ms.
