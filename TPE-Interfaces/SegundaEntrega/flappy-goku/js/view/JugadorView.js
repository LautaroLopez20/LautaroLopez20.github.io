/* ============================================================================
   JUGADOR - Vista
   Unica responsable de pasar el estado del jugador al DOM. No calcula nada: si
   el modelo dice que esta en (x, y), aca se dibuja en (x, y).

   La posicion va por transform y no por top/left. Mover top/left en cada frame
   obliga al navegador a recalcular el layout del tablero entero; transform lo
   resuelve el compositor y el frame no se cae.

   Las animaciones del sprite se manejan por clases CSS: flying en loop, jump
   una vez y vuelve a flying, death una vez y se congela en el ultimo frame.
   ============================================================================ */

class JugadorView {
    static ANIM_FLYING = 'flappyPelota--flying';
    static ANIM_JUMP = 'flappyPelota--jump';
    static ANIM_DEATH = 'flappyPelota--death';

    constructor(elemento) {
        this.elemento = elemento;
        this.animacion = 'flying';
        this.muerto = false;

        this.elemento.addEventListener('animationend', this.alTerminarAnimacion);
        this.aplicarAnimacion('flying');
    }

    /* Tamano logico para la fisica. No depende del sprite visible porque jump y
       death desbordan el contenedor base; la caja fisica sigue siendo la de flying. */
    get tamano() {
        return 64;
    }

    reiniciar() {
        this.muerto = false;
        this.aplicarAnimacion('flying');
    }

    saltar() {
        if (this.muerto) return;
        this.aplicarAnimacion('jump');
    }

    dibujar(jugador) {
        this.elemento.style.transform = `translate(${jugador.x}px, ${jugador.y}px)`;

        if (jugador.choque || !jugador.vivo) {
            this.muerto = true;
            if (this.animacion !== 'death') this.aplicarAnimacion('death');
        }
    }

    alTerminarAnimacion = (evento) => {
        if (evento.target !== this.elemento) return;

        if (this.animacion === 'jump' && !this.muerto) {
            this.aplicarAnimacion('flying');
        }
    };

    aplicarAnimacion(nombre) {
        this.animacion = nombre;
        this.elemento.classList.toggle(JugadorView.ANIM_FLYING, nombre === 'flying');
        this.elemento.classList.toggle(JugadorView.ANIM_JUMP, nombre === 'jump');
        this.elemento.classList.toggle(JugadorView.ANIM_DEATH, nombre === 'death');
    }
}
