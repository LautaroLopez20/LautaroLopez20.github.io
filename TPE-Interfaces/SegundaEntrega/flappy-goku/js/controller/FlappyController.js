/* ============================================================================
   FLAPPY - Controlador
   El unico que conoce las reglas: cuando se puede saltar, cuando se muere y
   cuando se reinicia. El modelo calcula fisica y colisiones, la vista dibuja,
   y aca se decide que hacer con eso.

   Un solo game loop para todo. Nada de un setInterval por cosa: si cada sistema
   tuviera su propio reloj, el fondo, los tubos y el jugador se irian
   desincronizando a los pocos segundos.

   El evento no mueve al jugador: solo anota que hubo un impulso. El loop lo
   consume en el frame siguiente. Asi el salto ocurre siempre en el mismo punto
   del ciclo y dos toques seguidos no aplican dos saltos en el mismo frame.
   ============================================================================ */

class FlappyController {
    static LISTO = 'listo';
    static JUGANDO = 'jugando';
    static FIN = 'fin';

    /* Tope del dt. Si la pestana estuvo en segundo plano, el primer frame
       vuelve con un dt enorme y el jugador apareceria del otro lado del
       tablero. 50ms alcanza para que la caida se note y no para atravesar un
       tubo de un salto. */
    static DT_MAXIMO = 0.05;

    /* A la izquierda tiene que quedar lugar para reaccionar; a la derecha,
       espacio para ver venir el tubo. */
    static POSICION_X = 0.22;

    /* El primer tubo arranca ya metido en el tablero, a esta distancia del
       jugador. Si esperara en el borde derecho habria medio minuto de vuelo
       libre antes del primer obstaculo. */
    static DISTANCIA_PRIMER_TUBO = 400;

    /* El mismo clic que mata puede reiniciar la partida en el frame siguiente.
       Esta espera lo evita. */
    static ESPERA_REINICIO = 700;

    constructor({ tablero, modelo, vistas }) {
        this.tablero = tablero;
        this.modelo = modelo;
        this.vistas = vistas;

        this.jugador = null;
        this.estado = FlappyController.LISTO;
        this.ancho = 0;
        this.altoJugable = 0;
        this.ultimoTiempo = 0;
        this.finEn = 0;
    }

    init() {
        this.medir();
        this.jugador = new Jugador(this.vistas.jugador.tamano, this.altoJugable);
        this.registrarEventos();
        this.reiniciarPartida();

        this.ultimoTiempo = performance.now();
        requestAnimationFrame(this.frame);
    }

    /* Ojo: el jugador, el mundo y las vistas solo existen despues de init(). */

    reiniciarPartida() {
        const x = this.ancho * FlappyController.POSICION_X;
        const y = (this.altoJugable - this.jugador.tamano) / 2;

        this.modelo.reiniciar(
            this.ancho,
            this.altoJugable,
            x + FlappyController.DISTANCIA_PRIMER_TUBO
        );

        this.jugador.reiniciar();
        this.jugador.ubicar(x, y);

        this.estado = FlappyController.LISTO;
        this.vistas.menu.ocultar();
        this.dibujar();
    }

    /* Un solo punto de entrada para las tres formas de impulsar: clic, espacio
       y flecha arriba. */
    impulsar() {
        if (this.estado === FlappyController.FIN) {
            if (performance.now() - this.finEn < FlappyController.ESPERA_REINICIO) return;
            this.reiniciarPartida();
        }

        if (this.estado === FlappyController.LISTO) {
            this.estado = FlappyController.JUGANDO;
        }

        this.jugador.saltar();
    }

    actualizar(dt) {
        if (this.estado === FlappyController.FIN) {
            /* Muerto, pero sigue cayendo hasta el piso: congelarlo en el aire
               se lee como un bug. */
            this.jugador.actualizar(dt);
            return;
        }

        if (this.estado !== FlappyController.JUGANDO) return;

        this.jugador.actualizar(dt);
        this.modelo.actualizar(dt, this.jugador.x + this.jugador.tamano / 2);

        if (this.modelo.colisionaCon(this.jugador.caja()) || this.jugador.tocaElSuelo()) {
            this.terminar();
        }
    }

    terminar() {
        this.jugador.morir();
        this.estado = FlappyController.FIN;
        this.finEn = performance.now();
        this.vistas.menu.mostrar(this.modelo.puntaje);
    }

    dibujar() {
        this.vistas.jugador.dibujar(this.jugador);
        this.vistas.tubos.dibujar(this.modelo.tubos);
        this.vistas.marcador.dibujar(this.modelo.puntaje);
    }

    /* Funcion de flecha como campo de instancia: requestAnimationFrame y los
       listeners la llaman sin `this`, asi que necesita estar atada desde que
       se define y no en cada uso. */
    frame = (ahora) => {
        const dt = Math.min((ahora - this.ultimoTiempo) / 1000, FlappyController.DT_MAXIMO);
        this.ultimoTiempo = ahora;

        this.actualizar(dt);
        this.dibujar();

        requestAnimationFrame(this.frame);
    };

    registrarEventos() {
        this.tablero.addEventListener('pointerdown', this.alSenalar);
        document.addEventListener('keydown', this.alPresionarTecla);
        window.addEventListener('resize', this.alRedimensionar);
    }

    alSenalar = () => {
        this.impulsar();
    };

    alPresionarTecla = (evento) => {
        if (evento.code !== 'Space' && evento.code !== 'ArrowUp') return;

        /* Si el foco esta en el buscador o en el textarea de comentarios, el
           espacio y la flecha pertenecen al campo. Sin este corte, escribir un
           comentario se vuelve imposible. */
        const etiqueta = evento.target.tagName;
        if (etiqueta === 'INPUT' || etiqueta === 'TEXTAREA') return;

        /* Sin esto la barra espaciadora scrollea la pagina mientras se juega. */
        evento.preventDefault();

        /* Mantener la tecla apretada dispara el evento en repeticion: un
           impulso por tecla, no por repeticion. */
        if (evento.repeat) return;

        this.impulsar();
    };

    alRedimensionar = () => {
        /* Cambiar el tamano del tablero deja los tubos con una geometria que ya
           no corresponde. Se vuelve a empezar en vez de intentar reacomodarlos. */
        if (this.medir()) {
            this.reiniciarPartida();
        }
    };

    /* Devuelve si el tablero cambio de tamano, para no reiniciar la partida en
       cada evento de resize mientras se arrastra la ventana. */
    medir() {
        const ancho = this.tablero.clientWidth;
        const altoJugable = this.tablero.clientHeight - this.altoDelSuelo();
        const cambio = ancho !== this.ancho || altoJugable !== this.altoJugable;

        this.ancho = ancho;
        this.altoJugable = altoJugable;

        return cambio;
    }

    /* El alto del suelo vive en el CSS como variable: se lee de ahi en vez de
       repetir el numero aca y descubrir el desfasaje cuando alguien lo cambie. */
    altoDelSuelo() {
        const valor = getComputedStyle(this.tablero).getPropertyValue('--suelo-alto');
        return parseFloat(valor) || 0;
    }
}
