/* ============================================================================
   MODELO - PegSolitaireModel
   Fachada del modelo de Peg Solitaire. Coordina el tablero, el reloj y la
   seleccion actual. No conoce el canvas, el DOM ni los eventos. Depende de
   Board, CountdownTimer, Position y Move para aplicar las reglas.
   ============================================================================ */

class PegSolitaireModel {
    /**
     * @param {number} minutes - Duracion maxima de la partida en minutos.
     * @param {() => number} now - Funcion de tiempo, inyectable para tests.
     */
    constructor(minutes = 10, now = () => Date.now()) {
        this.board = new Board();
        this.timer = new CountdownTimer(minutes * 60 * 1000, now);
        this.selected = null;
        this.reset();
    }

    /** Reinicia el tablero y deja el reloj listo para arrancar. */
    reset() {
        this.board.reset();
        this.selected = null;
        this.timer.reset();
    }

    /* ---------------------------- CONSULTAS ----------------------------- */

    /**
     * Indica si una celda tiene una ficha.
     * @param {number} row - Fila de la celda.
     * @param {number} col - Columna de la celda.
     * @returns {boolean} True si la celda esta ocupada.
     */
    hasChip(row, col) {
        return this.board.hasPeg(new Position(row, col));
    }

    /**
     * Indica si una celda es una ranura jugable vacia.
     * @param {number} row - Fila de la celda.
     * @param {number} col - Columna de la celda.
     * @returns {boolean} True si la celda esta vacia.
     */
    isEmpty(row, col) {
        return this.board.isEmpty(new Position(row, col));
    }

    /* ---------------------------- SELECCION ----------------------------- */

    /**
     * Selecciona una ficha. Solo puede haber una ficha seleccionada a la vez.
     * @param {number} row - Fila de la celda.
     * @param {number} col - Columna de la celda.
     * @returns {boolean} True si la celda tenia ficha y quedo seleccionada.
     */
    select(row, col) {
        const position = new Position(row, col);
        if (!this.board.hasPeg(position)) return false;

        this.selected = position;
        return true;
    }

    /** Quita la seleccion actual. */
    clearSelection() {
        this.selected = null;
    }

    /* --------------------------- MOVIMIENTOS ---------------------------- */

    /**
     * Calcula los destinos legales desde la ficha seleccionada.
     * @returns {Position[]} Lista de destinos validos.
     */
    getValidTargets() {
        if (!this.selected) return [];

        return this.board
            .getValidMovesFrom(this.selected)
            .map((move) => move.to);
    }

    /**
     * Verifica las reglas de un salto sobre el estado actual.
     * @param {Position|{row: number, col: number}} from - Celda de origen.
     * @param {Position|{row: number, col: number}} to - Celda de destino.
     * @returns {boolean} True si el movimiento respeta las reglas.
     */
    isValidMove(from, to) {
        const move = Move.between(Position.from(from), Position.from(to));
        return move !== null && this.board.canApply(move);
    }

    /**
     * Ejecuta un movimiento: mueve la ficha y elimina la que fue saltada.
     * @param {Position|{row: number, col: number}} from - Celda de origen.
     * @param {Position|{row: number, col: number}} to - Celda de destino.
     * @returns {boolean} True si el movimiento era valido y se aplico.
     */
    move(from, to) {
        const move = Move.between(Position.from(from), Position.from(to));
        if (!move || !this.board.applyMove(move)) return false;

        this.clearSelection();
        return true;
    }

    /* ------------------------------ ESTADO ------------------------------ */

    /** Cuenta las fichas que siguen en el tablero. */
    countChips() {
        return this.board.countPegs();
    }

    /** Recorre el tablero y avisa si queda al menos un salto posible. */
    hasValidMoves() {
        return this.board.hasAnyMove();
    }

    /** Se gana cuando queda una sola ficha en el tablero. */
    isWon() {
        return this.countChips() === 1;
    }

    /* ------------------------------ RELOJ ------------------------------- */

    /** Arranca (o reinicia) la cuenta regresiva del limite de tiempo. */
    startTimer() {
        this.timer.start();
    }

    /** Detiene el reloj conservando el tiempo restante actual. */
    stopTimer() {
        this.timer.stop();
    }

    /** Tiempo que falta para que termine la partida, en milisegundos. */
    getRemainingMs() {
        return this.timer.getRemainingMs();
    }

    /** Indica si el tiempo se agoto. */
    isTimeUp() {
        return this.timer.isTimeUp();
    }

    /**
     * Empaqueta todo lo que la vista necesita para dibujar un cuadro.
     * @returns {{pegs: {row: number, col: number}[], validTargets: {row: number, col: number}[], remaining: number}}
     */
    getState() {
        const snapshot = this.board.snapshot();

        return {
            pegs: snapshot.pegs,
            validTargets: this.getValidTargets()
                .map((position) => position.toPlain()),
            remaining: snapshot.remaining
        };
    }
}
