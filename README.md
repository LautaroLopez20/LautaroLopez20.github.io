# FastGames

Pagina del Trabajo Practico de Interfaces de Usuario (UNICEN).

## Como se navega el repositorio

Al ingresar a la URL del repositorio, GitHub Pages abre el `index.html`
ubicado en la raiz, que actua como indice de entregas (sin redirect
automatico: el evaluador elige a donde ir).

- **Primera Entrega** → `TPE-Interfaces/PrimeraEntrega/index.html`
  (prototipo y wireframes en Figma).
- **Segunda Entrega** → `TPE-Interfaces/SegundaEntrega/login.html`
  (pagina web FastGames; la navegacion arranca por el login).

## Ramas

- `git-pages` (entrega activa): contiene `TPE-Interfaces/` y la landing raiz.
- `main`: sin contenido (solo README).

## Segunda Entrega (FastGames)

Flujo: `login.html` → `register.html` → `index.html` (home) →
`pegSolitaire.html` (detalle de juego).

- Home con loading simulado de 5s y carrusel de destacados.
- Categorias construidas desde la API (7 categorias con carruseles y dots).
- Cards premium simuladas (la API no distingue gratis/pagos): 1 a 4 por
  pagina, elegidas al azar al generar cada categoria. La corona marca que
  es de pago, el precio se ve arriba a la izquierda y en el hover aparece
  el carrito; cada clic suma al contador del carrito del nav (placeholder).
- Botones like/dislike/compartir: se activan en un solo clic y no pueden
  desactivarse.
- Menu de categorias (hamburguesa), panel de usuario y footer plegable.
