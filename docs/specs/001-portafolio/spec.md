# Spec 001 — Portafolio personal [A]nkordev v1

> Qué se construye y por qué. Los detalles técnicos están en `plan.md`.
> Marca: **[A]nkordev**, con corchetes (decidida 2026-11-01).
> Estado: aprobada · Fecha de lanzamiento: **2026-11-11**

---

## 1. Objetivo

Un portafolio de marca personal que transmita sensación de **laboratorio creativo**, muestre proyectos con casos de estudio, explique servicios y paquetes, y convierta visitas en contactos.

**Público:** negocios locales en Venezuela (español) y clientes internacionales (inglés), visitando mayormente desde el teléfono.

**Métrica de éxito:** primer cliente pagado antes del 30 de noviembre de 2026.

## 2. Referencias (principios, no copia)

| Referencia | Qué tomamos |
|---|---|
| exp.fiddle.digital | Sensación de laboratorio, animación de letras, selector de temas de color, vista lista/cuadrícula |
| dennissnellenberg.com | Tipografía grande, scroll suave, botones magnéticos, transiciones entre páginas |
| onform.studio | Paquetes con precio y plazo, casos de estudio con contexto, CTA claro |

## 3. Historias de usuario

1. **Como dueño de negocio local**, quiero ver rápidamente qué haces, cuánto cuesta y ejemplos, para decidir si te contacto.
2. **Como cliente internacional**, quiero leer el sitio en inglés y ver casos de estudio con decisiones técnicas, para evaluar tu nivel.
3. **Como visitante interesado**, quiero contactarte por formulario o WhatsApp en pocos pasos.
4. **Como visitante**, quiero cambiar el tema de color del sitio, para explorarlo y que la experiencia se sienta de "laboratorio".
5. **Como visitante con movimiento reducido activado**, quiero leer todo sin animaciones.

## 4. Páginas

- **Inicio** (una página con secciones)
- **Caso de estudio** por proyecto
- **Página de gracias** tras enviar el formulario
- **404**
- Todas con versión en inglés

## 5. Secciones del inicio (en orden)

1. **Navegación:** logo, enlaces (Proyectos, Servicios, Sobre mí, Contacto), selector de tema, cambio ES/EN.
2. **Hero:** titular animado letra por letra (ej. «Diseño y desarrollo webs que se sienten vivas»), subtítulo, botón «Hablemos» y etiqueta de disponibilidad.
3. **Proyectos:** alternar entre vista **Lista** (filas grandes con imagen que sigue al cursor) y **Cuadrícula** (tarjetas).
4. **Servicios y paquetes** (precios en USD; la versión en inglés muestra la tarifa internacional):
   - **Landing** — 1 página, 5–7 días, desde **$300** (ES) · **$500** (EN)
   - **Sitio para negocio** — hasta 5 páginas, 2–3 semanas, desde **$750** (ES) · **$1,300** (EN)
   - **Tienda / App web** — a medida, 3–6 semanas, desde **$1.500** (ES) · **$2,600** (EN)
5. **Proceso:** Descubrir → Especificar → Construir → Lanzar.
6. **Sobre mí:** foto o ilustración, texto corto, stack, redes.
7. **Contacto:** formulario (nombre, email, tipo de proyecto, presupuesto aproximado, mensaje), WhatsApp y email, con aviso breve de privacidad.
8. **Footer:** reloj en vivo con hora de Venezuela, redes, «Hecho en Venezuela», año.

## 6. Identidad visual

### Temas de color

| Tema | Fondo | Superficie | Texto | Acento |
|---|---|---|---|---|
| Carbón (por defecto) | `#2B2D31` | `#3A3D43` | `#F3F1EC` | `#F2711C` |
| Naranja | `#F2711C` | `#E0631A` | `#1E1F22` | `#1E1F22` |
| Petróleo | `#1F6F8B` | `#195C73` | `#F3F1EC` | `#F2711C` |
| Militar | `#5B6B3A` | `#4C5A30` | `#F3F1EC` | `#F2711C` |

El tema elegido se recuerda en visitas posteriores.

### Tipografía y elementos de laboratorio

- Display grande y fluida (Space Grotesk); etiquetas en monoespaciada (Monaspace Krypton), mayúsculas.
- Retícula fina de fondo, numeración (`001`, `002`), etiquetas tipo `EXP-001` o `[ 01 / SERVICIOS ]`, coordenadas decorativas, cursor personalizado (solo en escritorio).

## 7. Movimiento

- Titular del hero: letras que entran escalonadas desde abajo.
- Títulos de sección: se revelan al hacer scroll.
- Etiquetas mono: efecto "scramble" breve al aparecer.
- Botones principales magnéticos.
- Scroll suave y transiciones entre páginas.
- Pasos del proceso con línea de progreso ligada al scroll.

## 8. Proyectos a mostrar

| # | Proyecto | Tipo | Estado |
|---|---|---|---|
| 001 | Restaurante / café local | Negocio local | Por construir |
| 002 | Tienda online | Tienda | Por construir |
| 003 | App de reservas (barbería) | App web | Por construir |
| 004 | LEGO LBN | Iglesia | En progreso |

Cada caso de estudio: **Problema → Solución → Decisiones técnicas → Resultado**, con galería, stack y enlaces.

## 9. Requisitos no funcionales

Los de la constitución (accesibilidad, rendimiento, seguridad, testing, privacidad), más:
- El formulario rechaza spam automatizado y envíos repetidos.
- El enlace se ve bien al compartirlo en WhatsApp y redes (imagen y descripción).

## 10. Criterios de aceptación

- [ ] Todas las secciones visibles y legibles sin JavaScript.
- [ ] Los 4 temas funcionan, cumplen contraste AA y persisten.
- [ ] Vista lista/cuadrícula funciona.
- [ ] Un envío válido del formulario se guarda; uno inválido muestra errores claros.
- [ ] ES e EN completos y enlazados entre sí.
- [ ] Con movimiento reducido no hay animaciones.
- [ ] Umbrales de Lighthouse de la constitución cumplidos en móvil.
- [ ] Publicado el 11 de noviembre de 2026.

## 11. Fuera de alcance (v1.1, ODD)

Efectos WebGL, sonido de interfaz, sección `/lab` de experimentos, blog y dominio propio.
