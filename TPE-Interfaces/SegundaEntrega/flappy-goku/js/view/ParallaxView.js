/* ============================================================================
   PARALLAX - Vista
   Las capas de fondo se animan con CSS a una duracion fija por capa. El juego
   acelera con el puntaje, asi que esta vista escala la reproduccion de esas
   animaciones con playbackRate: mismas capas, misma duracion base, otra
   velocidad. Cambiar animation-duration en caliente haria saltar el ciclo.
   ============================================================================ */

class ParallaxView {
    constructor(capas) {
        this.capas = [...capas];
        this.ultimoFactor = null;
    }

    /* Solo toca el DOM cuando el factor cambia, no en cada frame. */
    dibujar(factor) {
        if (factor === this.ultimoFactor) return;

        for (const capa of this.capas) {
            const animaciones = capa.getAnimations();
            const animacion = animaciones.find((a) => a.animationName === 'parallaxScroll') || animaciones[0];
            if (animacion) animacion.playbackRate = factor;
        }

        this.ultimoFactor = factor;
    }
}
