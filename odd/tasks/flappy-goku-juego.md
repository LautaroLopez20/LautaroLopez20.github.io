# Flappy Goku — movimiento del jugador y tubos

Objetivo: implementar salto, caída, tubos, colisión y puntaje, cruzando
`codigo-base/js/flappy-anivia/` (estructura) con el game loop con `dt` de los
apuntes de clase. Sin animaciones por evento todavía.
Branch: `git-pages`. Test runner: no hay (verificado, el repo no tiene framework
de tests JS). Verificación: `node --check` por archivo + chequeos de geometría.

## Specs

- **S1.** Petición del usuario, textual: *"la idea seria hacer ahora aunque sea el
  movimiento del personaje, tipo su salto y caida y los tubos, usando tanto el
  codigo de "codigo-base" como el del .txt para cruzar la información y armar el
  codigo lo mas modular y entendible posible"*.

- **S2.** Consigna, textual: *"El pájaro se mueve a velocidad constante, avanzando
  en el escenario. El usuario puede aplicar impulso hacia arriba para mantener el
  vuelo y pasar a través de las tuberías."*
  Consecuencia: la velocidad de scroll es una constante, no un parámetro.

- **S3.** Consigna, textual: *"Es importante que la velocidad sea correcta en base
  al movimiento"*.
  Consecuencia: la capa del suelo (factor 1) ya consume 1200px en 10s en
  `juego.css`, es decir **120 px/s**. Los tubos DEBEN avanzar a 120 px/s o el
  suelo patina. `Mundo.VELOCIDAD` es ese número y no se cambia sin recalcular
  las cuatro `animation-duration`.

- **S4.** Consigna, textual: *"Las tuberías no tienen que estar siempre la misma
  distancia horizontal entre ellas."*
  Consecuencia: el espaciado se sortea por tubo.

- **S5.** Consigna, textual: *"La distancia entre las tuberías verticalmente (por
  donde tiene que pasar el pájaro) a medida que avanzan se va haciendo mas
  chicas."*
  Consecuencia: el hueco se achica con el puntaje.

- **S6.** Consigna, textual: *"Estás misma distancia entre las tuberías
  verticalmente (por donde tiene que pasar el pájaro) no están alineadas, es
  decir tienen que ir variando en altura."*
  Consecuencia: la posición vertical del hueco se sortea por tubo.

- **S7.** Consigna, textual: *"El avatar debe interactuar con las tuberías de la
  escena (obstáculos) mostrando una animación acorde."*
  Alcance de esta tarea: colisión detectada y cambio de estado visual. La
  animación `keyframe` queda para la siguiente tarea.

- **S8.** Apuntes de clase, textual: *"Velocidad en px/s, con tope para cuando la
  pestaña vuelve"* y *"Mover con transform, nunca con top/left"*.
  Consecuencia: la física usa `dt` en segundos, `dt` se limita a 0.05, y el
  jugador se posiciona con `transform: translate()`.

- **S9.** `codigo-base` usa px por frame (`gravity 0.3`, `jumpForce -6`,
  `speed 3`). Se convierten a px/s a 60fps para conservar la sensación:
  gravedad 1080 px/s², impulso -360 px/s, caída máxima 900 px/s. La velocidad de
  tubos NO se copia (180 px/s): la manda S3 con 120 px/s.

- **S10.** Modularidad: mismo split que `pegSolitaire/js/` (model / view /
  controller + bootstrap `main.js`), sin módulos ES, con `<script src>` clásicos.

- **No requerido en esta tarea:** los 2 elementos animados con spritesheet, las 3
  animaciones `keyframe` por evento, ítems/bonus, spritesheets reales.

## Tasks

| ID | Qué | Specs | Ruta | Estado |
|---|---|---|---|---|
| T1 | `model/Jugador.js`: física con dt, hitbox más chica que el sprite | S2, S8, S9 | inline | hecho |
| T2 | `model/Tubo.js`: modelo del tubo, hueco, colisión AABB | S4, S5, S6 | inline | hecho |
| T3 | `model/Mundo.js`: dimensiones, generación, avance, limpieza, puntaje | S3, S4, S5, S6 | inline | hecho |
| T4 | `view/JugadorView.js`, `TuboView.js`, `MarcadorView.js`, `MenuView.js` | S8, S10 | inline | hecho |
| T5 | `controller/FlappyController.js` + `js/main.js`: loop, input, estados | S2, S7, S8 | inline | hecho |
| T6 | CSS de tubos y posicionamiento por transform del jugador | S8 | inline | hecho |
| T7 | Enlazar en `flappy-goku.html` | S10 | inline | hecho |

Commit: `00fcfae feat(flappy-goku): add player physics, pipes and score`
(rama `git-pages`, sin push: publicar es decisión del usuario).

## Log

- **L1.** *"Mirá, el ejemplo de clase lo copie a mano en base a una foto entonces
  puede ser que haya cosas medio raras, la idea seria hacer ahora aunque sea el
  movimiento del personaje, tipo su salto y caida y los tubos, usando tanto el
  codigo de "codigo-base" como el del .txt para cruzar la información y armar el
  codigo lo mas modular y entendible posible"*

- **L2.** Decisión: velocidad de tubos 120 px/s, no los 180 que sugiere
  `codigo-base`. Razón: el parallax en CSS ya fija la capa del suelo en 120 px/s
  (1200px / 10s) y S3 exige que coincidan. Si se quisiera 180, hay que rehacer
  las cuatro duraciones: 1200/180/factor.

- **L3.** Implementación (T1–T7). Decisiones que no estaban en el plan:
  - El jugador muerto sigue cayendo: congelarlo en el aire se lee como un bug.
    Lo que se corta al morir es `saltar()`, no la gravedad.
  - El primer tubo aparece a 400px del jugador, no en el borde derecho. Con el
    tablero a 1344px de ancho y los tubos a 120 px/s, esperar en el borde daba
    ~11s de vuelo libre antes del primer obstáculo.
  - `Tubo` recibe un objeto (`{ x, entrada, hueco, altoJugable }`) en vez de
    cuatro posicionales: la regla del proyecto pide máximo 3 parámetros.
  - El ancho del tubo está en `Tubo.ANCHO` y en `.flappyTubo`. Duplicado a
    propósito: el CSS no lee constantes de JS. Anotado en los dos lados.
  - El alto del jugador sale de `offsetWidth` del elemento, no de una constante
    nueva: si cambia `.flappyPelota`, el hitbox se entera solo.
  - La espera de 700ms antes de reiniciar evita que el clic que mata reinicie.
  - Redimensionar reinicia la partida: los tubos ya creados tienen geometría
    del tamaño anterior y reacomodarlos cuesta más que empezar de nuevo.
  - El `keydown` ignora los eventos cuyo target es `INPUT`/`TEXTAREA`. Sin eso,
    el `preventDefault` de la barra espaciadora impedía escribir un comentario.

- **L4.** Verificación (no hay runner de tests en el repo):
  - `node --check` sobre los 9 archivos JS: ok.
  - Simulación del modelo sin DOM, 24 comprobaciones: salto 57px, caída al piso,
    techo que frena sin matar, hitbox 35px centrada, cajas del tubo, AABB dentro
    y fuera del hueco, velocidad medida 120.00 px/s en 1s, tubos que entran por
    el borde derecho, puntaje, tope del array, hueco que se achica y respeta el
    mínimo de 26%, colisiones del mundo.
  - Simulación del controlador con DOM falso, 18 comprobaciones: arranque,
    estado listo, clic que inicia, creación y limpieza de elementos de tubo,
    dt recortado (un frame de 5s mueve 22px), muerte contra el suelo, espera de
    reinicio, reinicio limpio, espacio en textarea que no se bloquea y
    autorepetición de tecla ignorada.
  - CSS: 31 llaves abiertas y 31 cerradas; las 10 clases que toca el JS existen.
  - HTML: 44 `<div>` y 44 `</div>`.

- **L5.** Cambio de texto en la página: la sección "Reglas" decía que no había
  aumentos de dificultad, pero S5 exige que el hueco se achique. Ahora dice que
  la velocidad es constante y el hueco se estrecha. Anotado además en
  `REVISAR-textos.txt` que el récord de la sesión está prometido y no
  implementado.

- **L6.** Pedido del usuario: *"Podés hacer que los tubos sean como de "bambu" ?
  la estetica y medio amarillo verdoso, asi desentonan del fondo y se entiende"*.
  Los tubos eran barras verdes planas y se leían como parte del fondo. Ahora el
  cuerpo es `assets/tubo-bambu.svg`, un tile de 8x10 unidades que se repite en
  vertical: luz a la izquierda, sombra a la derecha y un nudo cada 80px. Al
  repetirse, la tubería puede tener cualquier alto sin que el dibujo se deforme.
  Es de 8px por bloque en los dos ejes (64/8 y 80/10), así que el pixel queda
  cuadrado. La boca pasó a ser un nudo más grueso con filo claro arriba.
  El amarillo verdoso es funcional: el fondo es azul y verde azulado.
