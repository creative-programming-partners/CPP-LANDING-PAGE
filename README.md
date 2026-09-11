# CPP Landing Page

Landing estática para Creative Programming Partners. No requiere instalación; las mejoras de movimiento cargan GSAP y Lenis desde CDN y mantienen una experiencia funcional si no están disponibles.

## Experiencia incluida

- Dirección visual editorial y tecnológica propia de CPP.
- Hero orientado a resultados, casos demostrativos y CTA contextual por servicio.
- Hero cinematográfico, manifiesto tipográfico, proceso narrativo fijado y proyectos apilados durante el scroll.
- Smooth scroll con Lenis y movimiento con GSAP ScrollTrigger: parallax, scrub de texto, secuencias escalonadas y navegación reactiva.
- Efectos ligeros complementarios: spotlight, aura del cursor, cinta cinética, progreso de lectura y microinteracciones físicas.
- Respeto automático por `prefers-reduced-motion` y controles accesibles por teclado.
- Fuente local optimizada en WOFF2, imágenes WebP y favicon SVG.

## Vista local

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estático.

```powershell
npx serve .
```

## Antes de publicar

1. Añade el endpoint del formulario en `data-endpoint` dentro de `index.html` para recibir solicitudes reales.
2. Publica WhatsApp, correo y redes sociales como canales alternativos de contacto.
3. Sustituye los conceptos del Laboratorio CPP por casos reales cuando estén documentados.
4. Añade funciones, especialidades, fotos y enlaces profesionales de los integrantes.
5. Revisa la política de privacidad con asesoría adecuada.
6. Ajusta los precios referenciales y metadatos del dominio antes del lanzamiento.

El formulario incluye validación en cliente, campo trampa y comprobación de tiempo. La protección definitiva contra spam debe completarse en el servidor.

## Identidad de marca

El prototipo inicial, las reglas de uso y los archivos SVG/PNG están documentados en [`brand/CPP-BRAND-GUIDE.md`](brand/CPP-BRAND-GUIDE.md). La navegación, el pie de página, el favicon y la imagen para compartir ya usan el nuevo sistema visual.
