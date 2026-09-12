# CPP Landing Page

Landing estática para Creative Programming Partners. No requiere instalación ni compilación: son `index.html`, `styles.css` y `script.js`, más los recursos de `assets/`.

## Experiencia incluida

- Dirección visual v2: base Cloud y Obsidian con acento cobalto.
- Hero orientado a resultados, manifiesto tipográfico, proceso narrativo, casos demostrativos y CTA contextual por servicio.
- Movimiento propio sin dependencias: apariciones con IntersectionObserver, parallax, tilt, spotlight, botones magnéticos, cinta cinética y progreso de lectura.
- Símbolo 3D interactivo y paneles del hero con three.js, que se descarga solo cuando el navegador queda libre.
- Respeto automático por `prefers-reduced-motion` y controles accesibles por teclado.
- Fuente local optimizada en WOFF2, imágenes WebP y favicon SVG.

## Rendimiento

El movimiento está pensado para no bloquear el scroll:

- Un único bucle de scroll que no recalcula el layout: la barra de progreso usa `transform` y el parallax se apoya en posiciones medidas una sola vez.
- Sin `backdrop-filter` ni `will-change` permanentes.
- Las animaciones infinitas se pausan cuando su sección sale de pantalla.
- El 3D se dibuja con un tope de frames, se detiene cuando ningún canvas está a la vista y se omite en pantallas táctiles, angostas o equipos de pocos núcleos.

Medido en una laptop con GPU integrada, pantalla 2x y la CPU limitada 4 veces: 128 fps de promedio al recorrer la página, sin frames largos.

## Vista local

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estático.

```powershell
npx serve .
```

## Antes de publicar

1. Añade el endpoint del formulario en `data-endpoint` dentro de `index.html` para recibir solicitudes reales.
2. Publica WhatsApp, correo y redes sociales como canales alternativos de contacto.
3. Sustituye los conceptos demostrativos por casos reales cuando estén documentados.
4. Añade funciones, especialidades, fotos y enlaces profesionales de los integrantes.
5. Revisa la política de privacidad con asesoría adecuada.
6. Ajusta los precios referenciales y metadatos del dominio antes del lanzamiento.
7. Actualiza los SVG y PNG de marca al acento cobalto: todavía usan el verde menta de la versión anterior.

El formulario incluye validación en cliente, campo trampa y comprobación de tiempo. La protección definitiva contra spam debe completarse en el servidor.

## Identidad de marca

El prototipo inicial, las reglas de uso y los archivos SVG/PNG están documentados en [`brand/CPP-BRAND-GUIDE.md`](brand/CPP-BRAND-GUIDE.md). La navegación, el pie de página, el favicon y la imagen para compartir ya usan el nuevo sistema visual.
