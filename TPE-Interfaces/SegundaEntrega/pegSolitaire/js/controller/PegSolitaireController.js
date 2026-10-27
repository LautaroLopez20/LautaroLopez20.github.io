/* ============================================================================
   CONTROLADOR - PegSolitaireController
   Une el modelo con la vista: escucha el mouse y los botones, aplica las
   reglas a traves del modelo y pide a la vista que se redibuje.
   ============================================================================ */

const PEG_DRAG_THRESHOLD = 5; // Pixeles que hay que mover para considerar arrastre

class PegSolitaireController {
    /**
     * @param {PegSolitaireModel} model - Modelo con las reglas del juego.
     * @param {PegSolitaireView} view - Vista encargada del canvas y el DOM.
     */
    constructor(model, view) {
        this.model = model;
        this.view = view;

        /* 'idle' | 'playing' | 'won' | 'lost' | 'timeup' */
        this.status = 'idle';
        this.drag = null;          // { from: {row, col}, position: {x, y} }
        this.pressPoint = null;    // Punto donde empezo el click
        this.isDragging = false;   // Diferencia click simple de arrastre
        this.frameId = null;       // requestAnimationFrame en curso

        /* Los metodos se pasan como referencia: hay que fijar el contexto. */
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.tick = this.tick.bind(this);
    }

    /* ----------------------------- ARRANQUE ----------------------------- */

    /** Conecta los eventos y pinta el tablero inicial detras del menu. */
    init() {
        this.view.ui.startBtn.addEventListener('click', () => this.start());
        this.view.ui.endBtn.addEventListener('click', () => this.start());
        this.view.ui.restart.addEventListener('click', () => this.start());

        this.view.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.view.canvas.addEventListener('mousemove', this.handleMouseMove);
        /* El mouseup se escucha en la ventana para no perder el fin del
           arrastre si el usuario suelta fuera del canvas. */
        window.addEventListener('mouseup', this.handleMouseUp);

        /* Si las imagenes terminan de cargar, se vuelve a pintar. */
        this.view.onAssetsLoaded = () => this.render(performance.now());

        this.render(performance.now());
        this.view.updateHud(this.model.getRemainingMs(), this.model.countChips());
    }

    /** Reinicia la partida y arranca el reloj. */
    start() {
        this.model.reset();
        this.model.startTimer();

        this.status = 'playing';
        this.drag = null;
        this.pressPoint = null;
        this.isDragging = false;

        this.view.hideStartMenu();
        this.view.hideEndMenu();
        this.view.canvas.style.cursor = 'pointer';

        this.render(performance.now());
        this.startLoop();
    }

    /* ------------------------------- LOOP ------------------------------- */

    /** Arranca el ciclo de dibujo que tambien anima los hints y el reloj. */
    startLoop() {
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
        }
        this.frameId = requestAnimationFrame(this.tick);
    }

    /**
     * Un cuadro del juego: dibuja, actualiza el HUD y controla el tiempo.
     * @param {number} time - Marca de tiempo que entrega el navegador.
     */
    tick(time) {
        if (this.status !== 'playing') {
            this.frameId = null;
            return;
        }

        this.render(time);

        if (this.model.isTimeUp()) {
            this.finish('timeup');
            return;
        }

        this.frameId = requestAnimationFrame(this.tick);
    }

    /**
     * Pinta el estado actual del modelo.
     * @param {number} time - Marca de tiempo para las animaciones.
     */
    render(time) {
        const state = this.model.getState();
        this.view.render(state, time, this.drag);
        this.view.updateHud(this.model.getRemainingMs(), state.remaining);
    }

    /* ----------------------------- MOUSE -------------------------------- */

    /**
     * mousedown: selecciona una ficha o intenta soltar la seleccion actual
     * en una ranura vacia (modo click, click).
     * @param {MouseEvent} event - Evento del mouse.
     */
    handleMouseDown(event) {
        if (this.status !== 'playing') return;

        const point = this.view.canvasPoint(event);
        const cell = this.view.pointToCell(point);
        if (!cell) return;

        /* Hay una ficha en la celda: empieza la seleccion / el arrastre. */
        if (this.model.hasChip(cell.row, cell.col)) {
            this.model.select(cell.row, cell.col);
            this.drag = { from: cell, position: point };
            this.pressPoint = point;
            this.isDragging = false;
            this.view.canvas.style.cursor = 'grabbing';
            this.render(performance.now());
            return;
        }

        /* Ranura vacia: si hay una ficha seleccionada, se intenta el salto. */
        if (!this.model.selected) return;

        if (this.model.move(this.model.selected, cell)) {
            this.afterMove();
        } else {
            this.model.clearSelection();
            this.render(performance.now());
        }
    }

    /**
     * mousemove: actualiza la posicion de la ficha que se esta arrastrando.
     * @param {MouseEvent} event - Evento del mouse.
     */
    handleMouseMove(event) {
        if (!this.drag) return;

        const point = this.view.canvasPoint(event);
        const distance = Math.abs(point.x - this.pressPoint.x) +
            Math.abs(point.y - this.pressPoint.y);

        if (distance > PEG_DRAG_THRESHOLD) this.isDragging = true;
        this.drag.position = point;
    }

    /**
     * mouseup: suelta la ficha. Si cae en un destino valido se mueve; si fue
     * un click simple, queda seleccionada para el modo click, click.
     * @param {MouseEvent} event - Evento del mouse.
     */
    handleMouseUp(event) {
        if (!this.drag) return;

        const drag = this.drag;
        const point = this.view.canvasPoint(event);
        const target = this.view.pointToCell(point);

        this.drag = null;
        this.view.canvas.style.cursor = 'pointer';

        if (this.isDragging) {
            if (target && this.model.move(drag.from, target)) {
                this.afterMove();
                return;
            }

            /* Si solto fuera de un destino (o fuera del canvas), se cancela;
               si volvio a la celda de origen, la ficha queda seleccionada. */
            const sameCell = target &&
                target.row === drag.from.row &&
                target.col === drag.from.col;
            if (!sameCell) this.model.clearSelection();
        }

        this.render(performance.now());
    }

    /* ----------------------------- PARTIDA ------------------------------ */

    /** Revisa victoria o derrota despues de un movimiento valido. */
    afterMove() {
        if (this.model.isWon()) {
            this.finish('won');
            return;
        }
        if (!this.model.hasValidMoves()) {
            this.finish('lost');
            return;
        }
        this.render(performance.now());
    }

    /**
     * Termina la partida, detiene el reloj y muestra el cartel correspondiente.
     * @param {'won'|'lost'|'timeup'} result - Motivo del final.
     */
    finish(result) {
        this.status = result;
        this.drag = null;
        this.isDragging = false;
        this.model.stopTimer();

        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.view.canvas.style.cursor = 'default';
        this.render(performance.now());

        const remaining = this.model.countChips();

        if (result === 'won') {
            this.view.showEndMenu(
                '¡Ganaste!',
                'Quedo una sola Bola de Dragon en el tablero.',
                'Jugar de nuevo'
            );
            return;
        }

        if (result === 'timeup') {
            this.view.showEndMenu(
                '¡Se termino el tiempo!',
                `Quedaron ${remaining} fichas en el tablero.`,
                'Reintentar'
            );
            return;
        }

        this.view.showEndMenu(
            'Sin movimientos',
            `No quedan jugadas posibles. Quedaron ${remaining} fichas.`,
            'Reintentar'
        );
    }
}
