/* ============================================================================
   MODELO - PegSolitaireModel
   Contiene solo las reglas y el estado del juego. No conoce el canvas, el DOM
   ni los eventos: si se pudiera jugar por consola, este archivo alcanzaria.
   ============================================================================ */

/* Valores posibles de cada celda del tablero. */
const PEG_INVALID = -1; // Fuera de la cruz: no se puede jugar
const PEG_EMPTY = 0;    // Ranura valida sin ficha
const PEG_CHIP = 1;     // Ranura valida con ficha

/* Forma del tablero clasico (7x7):
   '.' = celda invalida, '#' = ficha, 'o' = espacio vacio inicial. */
const PEG_BOARD_MASK = [
    '..###..',
    '..###..',
    '#######',
    '###o###',
    '#######',
    '..###..',
    '..###..'
];

/* Un movimiento siempre salta dos celdas en linea recta (arriba, abajo,
   izquierda o derecha), dejando la celda del medio para eliminar. */
const PEG_DIRECTIONS = [
    { row: -2, col: 0 },
    { row: 2, col: 0 },
    { row: 0, col: -2 },
    { row: 0, col: 2 }
];

class PegSolitaireModel {
    /**
     * Crea el modelo con el limite de tiempo indicado.
     * @param {number} minutes - Duracion maxima de la partida en minutos.
     */
    constructor(minutes = 10) {
        this.rows = PEG_BOARD_MASK.length;
        this.cols = PEG_BOARD_MASK[0].length;
        this.timeLimitMs = minutes * 60 * 1000;
        this.reset();
    }

    /* ------------------------------ TABLERO ------------------------------ */

    /**
     * Reinicia el tablero al estado inicial y deja el reloj listo para
     * arrancar (sin contar todavia).
     */
    reset() {
        this.cells = PEG_BOARD_MASK.map((line) => this.createRow(line));
        this.selected = null;
        this.deadline = null;
        this.remainingMs = this.timeLimitMs;
    }

    /**
     * Convierte una fila del mapa de texto en valores numericos.
     * @param {string} line - Fila del mapa ('#', 'o' o '.').
     * @returns {number[]} Fila con valores PEG_INVALID, PEG_EMPTY o PEG_CHIP.
     */
    createRow(line) {
        return line.split('').map((char) => {
            if (char === '#') return PEG_CHIP;
            if (char === 'o') return PEG_EMPTY;
            return PEG_INVALID;
        });
    }

    /**
     * Devuelve el valor de una celda.
     * @returns {number} Valor de la celda, o PEG_INVALID si esta fuera del tablero.
     */
    getCell(row, col) {
        if (!this.isInside(row, col)) return PEG_INVALID;
        return this.cells[row][col];
    }

    /** Indica si la coordenada cae dentro de la matriz 7x7. */
    isInside(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    /** Indica si la celda pertenece a la cruz jugable. */
    isPlayable(row, col) {
        return this.getCell(row, col) !== PEG_INVALID;
    }

    /** Indica si la celda tiene una ficha. */
    hasChip(row, col) {
        return this.getCell(row, col) === PEG_CHIP;
    }

    /** Indica si la celda es una ranura valida y esta vacia. */
    isEmpty(row, col) {
        return this.getCell(row, col) === PEG_EMPTY;
    }

    /* ---------------------------- SELECCION ----------------------------- */

    /**
     * Selecciona una ficha. Solo puede haber una ficha seleccionada a la vez.
     * @returns {boolean} True si la celda tenia ficha y quedo seleccionada.
     */
    select(row, col) {
        if (!this.hasChip(row, col)) return false;
        this.selected = { row, col };
        return true;
    }

    /** Quita la seleccion actual. */
    clearSelection() {
        this.selected = null;
    }

    /* --------------------------- MOVIMIENTOS ---------------------------- */

    /**
     * Calcula los destinos legales desde la ficha seleccionada.
     * @returns {{row: number, col: number}[]} Lista de destinos validos.
     */
    getValidTargets() {
        if (!this.selected) return [];

        return PEG_DIRECTIONS
            .map((dir) => ({
                row: this.selected.row + dir.row,
                col: this.selected.col + dir.col
            }))
            .filter((target) => this.isValidMove(this.selected, target));
    }

    /**
     * Verifica las reglas de un salto: origen con ficha, destino vacio y una
     * ficha en la celda del medio.
     * @param {{row: number, col: number}} from - Celda de origen.
     * @param {{row: number, col: number}} to - Celda de destino.
     * @returns {boolean} True si el movimiento respeta las reglas.
     */
    isValidMove(from, to) {
        if (!from || !to) return false;
        if (!this.hasChip(from.row, from.col)) return false;
        if (!this.isEmpty(to.row, to.col)) return false;

        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;
        const movesInLine =
            (Math.abs(rowDiff) === 2 && colDiff === 0) ||
            (Math.abs(colDiff) === 2 && rowDiff === 0);

        if (!movesInLine) return false;

        const middleRow = from.row + rowDiff / 2;
        const middleCol = from.col + colDiff / 2;
        return this.hasChip(middleRow, middleCol);
    }

    /**
     * Ejecuta un movimiento: mueve la ficha y elimina la que fue saltada.
     * @returns {boolean} True si el movimiento era valido y se aplico.
     */
    move(from, to) {
        if (!this.isValidMove(from, to)) return false;

        const middleRow = from.row + (to.row - from.row) / 2;
        const middleCol = from.col + (to.col - from.col) / 2;

        this.cells[to.row][to.col] = PEG_CHIP;
        this.cells[from.row][from.col] = PEG_EMPTY;
        this.cells[middleRow][middleCol] = PEG_EMPTY;
        this.clearSelection();
        return true;
    }

    /* ------------------------------ ESTADO ------------------------------ */

    /** Cuenta las fichas que siguen en el tablero. */
    countChips() {
        let total = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.hasChip(row, col)) total++;
            }
        }
        return total;
    }

    /** Recorre el tablero y avisa si queda al menos un salto posible. */
    hasValidMoves() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.hasChip(row, col)) continue;
                const from = { row, col };
                const canMove = PEG_DIRECTIONS.some((dir) =>
                    this.isValidMove(from, { row: row + dir.row, col: col + dir.col })
                );
                if (canMove) return true;
            }
        }
        return false;
    }

    /** Se gana cuando queda una sola ficha en el tablero. */
    isWon() {
        return this.countChips() === 1;
    }

    /* ------------------------------ RELOJ ------------------------------- */

    /** Arranca (o reinicia) la cuenta regresiva del limite de tiempo. */
    startTimer() {
        this.remainingMs = this.timeLimitMs;
        this.deadline = Date.now() + this.timeLimitMs;
    }

    /** Detiene el reloj conservando el tiempo restante actual. */
    stopTimer() {
        if (this.deadline === null) return;
        this.remainingMs = this.getRemainingMs();
        this.deadline = null;
    }

    /** Tiempo que falta para que termine la partida, en milisegundos. */
    getRemainingMs() {
        if (this.deadline === null) return this.remainingMs;
        return Math.max(0, this.deadline - Date.now());
    }

    /** Indica si el tiempo se agoto. */
    isTimeUp() {
        return this.getRemainingMs() === 0;
    }

    /**
     * Empaqueta todo lo que la vista necesita para dibujar un cuadro.
     * @returns {{cells: number[][], selected: object|null, validTargets: object[], remaining: number}}
     */
    getState() {
        return {
            cells: this.cells,
            selected: this.selected,
            validTargets: this.getValidTargets(),
            remaining: this.countChips()
        };
    }
}
