/* ============================================================================
   VIDAS - Vista
   HUD de vidas arriba a la izquierda. Muestra 3 corazones: al perder vida se
   vacian de derecha a izquierda.
   ============================================================================ */

class VidasView {
    static ICONO_LLENO = 'flappy-goku/assets/UI/heart.png';
    static ICONO_VACIO = 'flappy-goku/assets/UI/empty-heart.png';

    constructor(elemento, total = 3) {
        this.elemento = elemento;
        this.total = total;
        this.ultimo = null;
        this.iconos = [];

        for (let i = 0; i < total; i++) {
            const icono = document.createElement('img');
            icono.className = 'flappyVidaIcon';
            icono.src = VidasView.ICONO_LLENO;
            icono.alt = '';
            icono.width = 32;
            icono.height = 32;
            icono.draggable = false;
            this.elemento.appendChild(icono);
            this.iconos.push(icono);
        }
    }

    dibujar(vidas) {
        if (vidas === this.ultimo) return;

        for (let i = 0; i < this.iconos.length; i++) {
            const src = i < vidas ? VidasView.ICONO_LLENO : VidasView.ICONO_VACIO;
            if (this.iconos[i].getAttribute('src') !== src) {
                this.iconos[i].src = src;
            }
        }

        this.elemento.setAttribute('aria-label', `Vidas: ${vidas}`);
        this.ultimo = vidas;
    }
}
