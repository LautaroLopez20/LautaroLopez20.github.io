/* ============================================================================
   MARCADOR - Vista
   El puntaje en pantalla. Solo escribe en el DOM cuando el numero cambio: el
   loop corre 60 veces por segundo y el puntaje cambia una vez cada varios
   segundos.
   ============================================================================ */

class MarcadorView {
    constructor(elemento) {
        this.elemento = elemento;
        this.ultimo = null;
    }

    dibujar(puntaje) {
        if (puntaje === this.ultimo) return;

        this.elemento.textContent = puntaje;
        this.ultimo = puntaje;
    }
}
