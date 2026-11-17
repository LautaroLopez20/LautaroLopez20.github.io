/* ============================================================================
   MUNDO - Modelo
   Todo lo que se mueve solo: los tubos, el puntaje y las reglas del escenario.
   El jugador no vive aca adentro; el mundo lo recibe por parametro cuando hace
   falta (para puntuar y para probar colisiones).

   VELOCIDAD esta atada al parallax de CSS. La capa del suelo recorre 1200px en
   10s, o sea 120 px/s. Si los tubos fueran a otra velocidad, el suelo y las
   tuberias patinarian entre si, y eso es justo lo que la consigna pide evitar.
   Es la unica constante que no se toca sola.
   ============================================================================ */

class Mundo {
    static VELOCIDAD = 120;

    /* El hueco arranca en el 42% del alto jugable y se achica 0.8 puntos
       porcentuales por tubo pasado, hasta un piso del 26%. */
    static HUECO_INICIAL = 0.42;
    static HUECO_MINIMO = 0.26;
    static REDUCCION_POR_PUNTO = 0.008;

    /* Aire que queda arriba y abajo para que el hueco nunca toque los bordes. */
    static MARGEN_VERTICAL = 24;

    /* Distancia horizontal entre tubos, sorteada por tubo: la consigna pide que
       no este siempre a la misma distancia. */
    static ESPACIADO_MIN = 300;
    static ESPACIADO_MAX = 460;

    /* Las dimensiones llegan en reiniciar(), cuando el controlador ya midio el
       tablero. Hasta entonces el mundo no tiene geometria. */
    constructor(ancho = 0, altoJugable = 0) {
        this.ancho = ancho;
        this.altoJugable = altoJugable;
        this.tubos = [];
        this.puntaje = 0;
        this.proximoTuboX = ancho;
    }

    reiniciar(ancho = this.ancho, altoJugable = this.altoJugable, primerTuboX = ancho) {
        this.ancho = ancho;
        this.altoJugable = altoJugable;
        this.tubos = [];
        this.puntaje = 0;
        this.generar(primerTuboX);
    }

    actualizar(dt, jugadorX) {
        const avance = Mundo.VELOCIDAD * dt;

        for (const tubo of this.tubos) {
            const xAnterior = tubo.x;
            tubo.x -= avance;

            /* Puntua cuando el borde derecho del tubo cruza al jugador, no al
               reves: asi el punto entra recien cuando el hueco quedo atras. */
            if (xAnterior + Tubo.ANCHO >= jugadorX && tubo.x + Tubo.ANCHO < jugadorX) {
                this.puntaje++;
            }
        }

        this.proximoTuboX -= avance;
        if (this.proximoTuboX <= this.ancho) {
            this.generar();
        }

        /* Los tubos que salieron se van del array Y del DOM: la vista borra los
           elementos que ya no estan en esta lista. Si solo se dejaran de
           dibujar, el array creceria sin techo. */
        while (this.tubos.length > 0 && this.tubos[0].x + Tubo.ANCHO < 0) {
            this.tubos.shift();
        }
    }

    colisionaCon(caja) {
        return this.tubos.some((tubo) => tubo.colisionaCon(caja));
    }

    generar(x = this.ancho) {
        const hueco = this.huecoActual();
        const entrada = this.azar(
            Mundo.MARGEN_VERTICAL,
            this.altoJugable - Mundo.MARGEN_VERTICAL - hueco
        );

        this.tubos.push(new Tubo({ x, entrada, hueco, altoJugable: this.altoJugable }));

        /* Se cuenta desde la posicion del tubo recien creado, no desde un
           contador paralelo: asi el espaciado no acumula error con los frames. */
        this.proximoTuboX = x + this.azar(Mundo.ESPACIADO_MIN, Mundo.ESPACIADO_MAX);
    }

    huecoActual() {
        const fraccion = Math.max(
            Mundo.HUECO_MINIMO,
            Mundo.HUECO_INICIAL - this.puntaje * Mundo.REDUCCION_POR_PUNTO
        );
        return fraccion * this.altoJugable;
    }

    azar(minimo, maximo) {
        return minimo + Math.random() * (maximo - minimo);
    }
}
