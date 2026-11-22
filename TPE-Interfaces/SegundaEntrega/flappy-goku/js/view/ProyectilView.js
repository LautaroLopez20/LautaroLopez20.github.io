/* ============================================================================
   PROYECTIL - Vista
   Un solo elemento DOM reutilizado. El sprite se anima por CSS; la vista solo
   posiciona o lo oculta.
   ============================================================================ */

class ProyectilView {
    constructor(elemento) {
        this.elemento = elemento;
    }

    dibujar(proyectil) {
        if (!proyectil.activo) {
            this.elemento.hidden = true;
            return;
        }

        this.elemento.hidden = false;
        this.elemento.style.transform = `translate(${proyectil.x}px, ${proyectil.y}px)`;
    }
}
