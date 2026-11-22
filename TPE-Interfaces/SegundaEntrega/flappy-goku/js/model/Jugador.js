/* ============================================================================
   JUGADOR - Modelo
   Fisica del avatar: gravedad, impulso y tope de caida.

   Las magnitudes van en px/s y px/s^2, no en px por frame. Asi el salto mide
   lo mismo en un monitor de 60Hz que en uno de 144Hz, y el juego se comporta
   igual si la pestana estuvo en segundo plano.

   Los numeros salen de codigo-base/js/flappy-anivia/model/Anivia.js, que los
   tiene por frame (0.3 de gravedad, -6 de impulso, 15 de caida maxima).
   Multiplicados por 60 (o por 60^2 la gravedad) dan los mismos px/s.
   ============================================================================ */

class Jugador {
    static GRAVEDAD = 1080;      // 0.3 px/frame^2 * 60^2
    static IMPULSO = -360;       // -6 px/frame * 60
    static CAIDA_MAXIMA = 900;   // 15 px/frame * 60
    static VIDAS_INICIALES = 3;
    static TIEMPO_INVULNERABLE = 1.5;

    /* El hitbox es mas chico que el dibujo: si fuera del tamano del sprite, el
       jugador muere cuando la imagen todavia no toco nada. Con Goku a 64x64, el
       margen se ajusta para seguir siendo permisivo con el arte pixelado. */
    static MARGEN_HITBOX = 12;

    constructor(tamano, altoJugable) {
        this.tamano = tamano;
        this.hitbox = tamano - Jugador.MARGEN_HITBOX * 2;
        this.altoJugable = altoJugable;
        this.x = 0;
        this.y = 0;
        this.velocidad = 0;
        this.vivo = true;
        this.choque = false;
        this.vidas = Jugador.VIDAS_INICIALES;
        this.invulnerable = 0;
    }

    reiniciar() {
        this.velocidad = 0;
        this.vivo = true;
        this.choque = false;
        this.vidas = Jugador.VIDAS_INICIALES;
        this.invulnerable = 0;
    }

    /* Solo se llama al empezar y al reiniciar, no en cada frame. */
    ubicar(x, y) {
        this.x = x;
        this.y = y;
    }

    saltar() {
        if (!this.vivo) return;
        this.velocidad = Jugador.IMPULSO;
    }

    /* La gravedad sigue actuando despues de morir: el jugador muerto cae al
       piso en vez de quedar congelado en el aire. Lo que se corta al morir es
       el salto, no la fisica. */
    actualizar(dt) {
        if (this.invulnerable > 0) {
            this.invulnerable = Math.max(0, this.invulnerable - dt);
        }

        this.velocidad += Jugador.GRAVEDAD * dt;

        if (this.velocidad > Jugador.CAIDA_MAXIMA) {
            this.velocidad = Jugador.CAIDA_MAXIMA;
        }

        this.y += this.velocidad * dt;

        /* Techo: se frena contra el borde en vez de morir, igual que el codigo
           base. Matar contra el techo hace el juego injusto. */
        if (this.y < 0) {
            this.y = 0;
            this.velocidad = 0;
        }

        /* El piso no se atraviesa. La muerte la decide el controlador mirando
           tocaElSuelo(), para que el modelo no dependa del estado del juego. */
        if (this.y + this.tamano > this.altoJugable) {
            this.y = this.altoJugable - this.tamano;
        }
    }

    /* La caja real con la que se prueba la colision, centrada en el sprite. */
    caja() {
        return {
            x: this.x + Jugador.MARGEN_HITBOX + 4,
            y: this.y + Jugador.MARGEN_HITBOX,
            ancho: this.hitbox - 8,
            alto: this.hitbox
        };
    }

    tocaElSuelo() {
        return this.y + this.tamano >= this.altoJugable;
    }

    esInvulnerable() {
        return this.invulnerable > 0;
    }

    recibirGolpeObstaculo() {
        if (!this.vivo || this.esInvulnerable()) return false;

        this.vidas--;
        if (this.vidas <= 0) {
            this.morir();
            return true;
        }

        this.invulnerable = Jugador.TIEMPO_INVULNERABLE;
        return false;
    }

    /* La senzu cura un corazon y no pasa del maximo. Muerto no se cura: el
       controlador solo la junta en estado JUGANDO, pero el guardia deja la regla
       escrita donde vive el estado. */
    curar() {
        if (!this.vivo) return;

        this.vidas = Math.min(this.vidas + 1, Jugador.VIDAS_INICIALES);
    }

    morir() {
        this.vivo = false;
        this.choque = true;
        this.invulnerable = 0;
    }
}
