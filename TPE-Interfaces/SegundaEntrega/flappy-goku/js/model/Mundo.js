/* ============================================================================
   MUNDO - Modelo
   Todo lo que se mueve solo: los tubos, el puntaje y las reglas del escenario.
   El jugador no vive aca adentro; el mundo lo recibe por parametro cuando hace
   falta (para puntuar y para probar colisiones).

   VELOCIDAD es la base (120 px/s) y `factorVelocidad` la escala. La capa de
   parallax mas cercana recorre 1200px en 10s a factor 1, o sea 120 px/s: si los
   tubos y el parallax no usaran el mismo factor, patinarian entre si, y eso es
   justo lo que la consigna pide evitar. La vista del parallax escala sus
   animaciones con playbackRate al mismo factor, asi que las dos cosas siguen
   pegadas.
   ============================================================================ */

class Mundo {
    static VELOCIDAD = 220;

    /* Cada tubo pasado acelera el desplazamiento un 25% sobre la base; cada
       golpe reduce a la mitad el aumento acumulado (1.5 -> 1.25). */
    static ACELERACION_POR_TUBO = 0.25;

    /* El hueco arranca en el 50% del alto jugable y se achica 0.8 puntos
       porcentuales por tubo pasado, hasta un piso del 25%. */
    static HUECO_INICIAL = 0.5;
    static HUECO_MINIMO = 0.25;
    static REDUCCION_POR_PUNTO = 0.025;

    /* Aire que queda arriba y abajo para que el hueco nunca toque los bordes. */
    static MARGEN_VERTICAL = 24;

    /* Distancia horizontal entre tubos, sorteada por tubo: la consigna pide que
       no este siempre a la misma distancia. */
    static ESPACIADO_MIN = 300;
    static ESPACIADO_MAX = 460;

    /* Uno de cada tres tubos trae una senzu en el hueco. */
    static PROBABILIDAD_SENZU = 0.33;

    /* Las dimensiones llegan en reiniciar(), cuando el controlador ya midio el
       tablero. Hasta entonces el mundo no tiene geometria. */
    constructor(ancho = 0, altoJugable = 0, proyectil = null) {
        this.ancho = ancho;
        this.altoJugable = altoJugable;
        this.tubos = [];
        this.puntaje = 0;
        this.proximoTuboX = ancho;
        this.factorVelocidad = 1;
        this.proyectil = proyectil;
    }

    reiniciar(ancho = this.ancho, altoJugable = this.altoJugable, primerTuboX = ancho) {
        this.ancho = ancho;
        this.altoJugable = altoJugable;
        this.tubos = [];
        this.puntaje = 0;
        this.factorVelocidad = 1;
        this.generar(primerTuboX);
    }

    actualizar(dt, jugadorX) {
        const avance = Mundo.VELOCIDAD * this.factorVelocidad * dt;

        for (const tubo of this.tubos) {
            const xAnterior = tubo.x;
            tubo.x -= avance;

            /* Puntua cuando el borde derecho del tubo cruza al jugador, no al
               reves: asi el punto entra recien cuando el hueco quedo atras.
               El mismo punto acelera el desplazamiento del proximo frame. */
            if (xAnterior + Tubo.ANCHO >= jugadorX && tubo.x + Tubo.ANCHO < jugadorX) {
                this.puntaje++;
                this.factorVelocidad += Mundo.ACELERACION_POR_TUBO;
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
        return this.tubos.some((tubo) => tubo.colisionaCon(caja))
            || (!!this.proyectil && this.proyectil.colisionaCon(caja));
    }

    /* 5 tubos son 1.5x, un golpe deja 1.25x (+25%), no 0.75x. Se
       reduce a la mitad el aumento sobre la base, nunca por debajo de 1. */
    frenar() {
        this.factorVelocidad = 1 + (this.factorVelocidad - 1) / 2;
    }

    /* Marca y devuelve si el jugador toco una senzu en este frame. Es comando y
       consulta a la vez a proposito: el toque y el consumo tienen que ocurrir
       juntos, si no la senzu curaria en cada frame que el jugador la roza. */
    recogerSenzu(caja) {
        for (const tubo of this.tubos) {
            const senzu = tubo.cajaSenzu();
            if (senzu && Tubo.seSolapan(senzu, caja)) {
                tubo.senzuTomada = true;
                return true;
            }
        }

        return false;
    }

    generar(x = this.ancho) {
        const hueco = this.huecoActual();
        const entrada = this.azar(
            Mundo.MARGEN_VERTICAL,
            this.altoJugable - Mundo.MARGEN_VERTICAL - hueco
        );

        this.tubos.push(new Tubo({
            x,
            entrada,
            hueco,
            altoJugable: this.altoJugable,
            conSenzu: Math.random() < Mundo.PROBABILIDAD_SENZU
        }));

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
