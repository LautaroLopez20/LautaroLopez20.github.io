/* ============================================================================
   JUGADOR - Vista
   Unica responsable de pasar el estado del jugador al DOM. No calcula nada: si
   el modelo dice que esta en (x, y), aca se dibuja en (x, y).

   La posicion va por transform y no por top/left. Mover top/left en cada frame
   obliga al navegador a recalcular el layout del tablero entero; transform lo
   resuelve el compositor y el frame no se cae.
   ============================================================================ */

class JugadorView {
    constructor(elemento) {
        this.elemento = elemento;
    }

    /* El tamano sale del CSS en vez de ser otra constante duplicada en el JS:
       si algun dia cambia `.flappyPelota`, el hitbox se entera solo. */
    get tamano() {
        return this.elemento.offsetWidth;
    }

    dibujar(jugador) {
        this.elemento.style.transform = `translate(${jugador.x}px, ${jugador.y}px)`;

        /* Cada estado es una clase, como pide el apunte de clase: el color no
           se escribe desde aca, se elige una clase y el CSS decide. */
        this.elemento.classList.toggle('flappyPelota--choque', jugador.choque);
        this.elemento.classList.toggle('flappyPelota--normal', !jugador.choque);
    }
}
