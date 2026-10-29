/* ============================================================================
   BOARD - Entidad principal del modelo de Peg Solitaire
   Administra la matriz de celdas, las fichas y los saltos validos. No conoce
   el DOM, el canvas ni el reloj de la partida.
   ============================================================================ */

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

/* Un salto siempre avanza dos celdas en linea recta. */
const PEG_DIRECTIONS = [
    new Position(-2, 0),
    new Position(2, 0),
    new Position(0, -2),
    new Position(0, 2)
];

class Board {
    /**
     * @param {string[]} mask - Filas que describen la forma del tablero.
     */
    constructor(mask = PEG_BOARD_MASK) {
        this.mask = mask;
        this.rows = mask.length;
        this.cols = mask[0].length;
        this.nextPegId = 1;
        this.reset();
    }

    /**
     * Vuelve al estado inicial definido por la mascara. Con la mascara clasica
     * deja 32 fichas y el centro vacio.
     */
    reset() {
        this.nextPegId = 1;
        this.cells = this.mask.map((line, row) =>
            line.split('').map((char, col) => this.createCell(char, row, col))
        );
    }

    /**
     * Crea la celda que corresponde a un caracter de la mascara.
     * @param {string} char - Caracter de la mascara.
     * @param {number} row - Fila de la celda.
     * @param {number} col - Columna de la celda.
     * @returns {Cell|null} Celda jugable o null si esta fuera de la cruz.
     */
    createCell(char, row, col) {
        if (char === '.') return null;

        const cell = new Cell(new Position(row, col));
        if (char === '#') {
            cell.placePeg(new Peg(this.nextPegId));
            this.nextPegId++;
        }
        return cell;
    }

    /**
     * Devuelve la celda de una posicion.
     * @param {Position|{row: number, col: number}} position - Coordenada.
     * @returns {Cell|null} Celda jugable o null si no existe.
     */
    getCell(position) {
        const point = Position.from(position);
        if (!point || !this.isInside(point)) return null;
        return this.cells[point.row][point.col];
    }

    /**
     * Indica si una posicion cae dentro de la matriz del tablero.
     * @param {Position|{row: number, col: number}} position - Coordenada.
     * @returns {boolean} True si esta dentro de los limites.
     */
    isInside(position) {
        const point = Position.from(position);
        return Boolean(point) && point.isWithin(this.rows, this.cols);
    }

    /**
     * Indica si una posicion corresponde a una ranura jugable.
     * @param {Position|{row: number, col: number}} position - Coordenada.
     * @returns {boolean} True si hay una celda en esa posicion.
     */
    isPlayable(position) {
        return this.getCell(position) !== null;
    }

    /**
     * Indica si una posicion tiene una ficha.
     * @param {Position|{row: number, col: number}} position - Coordenada.
     * @returns {boolean} True si la celda existe y esta ocupada.
     */
    hasPeg(position) {
        const cell = this.getCell(position);
        return cell !== null && cell.hasPeg();
    }

    /**
     * Indica si una posicion es una ranura jugable vacia.
     * @param {Position|{row: number, col: number}} position - Coordenada.
     * @returns {boolean} True si la celda existe y esta vacia.
     */
    isEmpty(position) {
        const cell = this.getCell(position);
        return cell !== null && cell.isEmpty();
    }

    /**
     * Devuelve las posiciones de todas las fichas del tablero.
     * @returns {Position[]} Posiciones ocupadas.
     */
    getPegPositions() {
        const positions = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.cells[row][col];
                if (cell && cell.hasPeg()) positions.push(cell.position);
            }
        }

        return positions;
    }

    /**
     * Calcula los saltos legales desde una celda.
     * @param {Position|{row: number, col: number}} position - Celda de origen.
     * @returns {Move[]} Movimientos validos.
     */
    getValidMovesFrom(position) {
        const origin = Position.from(position);
        if (!origin || !this.hasPeg(origin)) return [];

        return PEG_DIRECTIONS
            .map((direction) => Move.between(origin, origin.offsetBy(direction)))
            .filter((move) => move !== null && this.canApply(move));
    }

    /**
     * Verifica las reglas de un salto sobre el estado actual del tablero.
     * @param {Move} move - Movimiento a comprobar.
     * @returns {boolean} True si el salto se puede ejecutar.
     */
    canApply(move) {
        if (!move) return false;

        return (
            this.hasPeg(move.from) &&
            this.hasPeg(move.over) &&
            this.isEmpty(move.to)
        );
    }

    /**
     * Ejecuta un salto: mueve la ficha y elimina la saltada.
     * @param {Move} move - Movimiento a aplicar.
     * @returns {boolean} True si el movimiento era valido.
     */
    applyMove(move) {
        if (!this.canApply(move)) return false;

        const origin = this.getCell(move.from);
        const middle = this.getCell(move.over);
        const destination = this.getCell(move.to);

        const peg = origin.removePeg();
        middle.removePeg();
        destination.placePeg(peg);
        return true;
    }

    /** Indica si queda al menos un salto posible. */
    hasAnyMove() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.cells[row][col];
                if (!cell || !cell.hasPeg()) continue;
                if (this.getValidMovesFrom(cell.position).length > 0) return true;
            }
        }

        return false;
    }

    /** Cuenta las fichas que siguen en el tablero. */
    countPegs() {
        let total = 0;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.cells[row][col];
                if (cell && cell.hasPeg()) total++;
            }
        }

        return total;
    }

    /**
     * Empaqueta el tablero en un objeto plano para la vista.
     * @returns {{pegs: {row: number, col: number}[], remaining: number}}
     */
    snapshot() {
        return {
            pegs: this.getPegPositions().map((position) => position.toPlain()),
            remaining: this.countPegs()
        };
    }
}
