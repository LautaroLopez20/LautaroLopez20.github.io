/* ============================================================================
   MOVE - Value object del modelo de Peg Solitaire
   Describe un salto: origen, ficha saltada (over) y destino. Solo valida la
   geometria del salto; que el tablero permita ejecutarlo lo decide Board.
   ============================================================================ */

class Move {
    /**
     * @param {Position} from - Celda de origen.
     * @param {Position} over - Celda de la ficha saltada.
     * @param {Position} to - Celda de destino.
     */
    constructor(from, over, to) {
        this.from = Position.from(from);
        this.over = Position.from(over);
        this.to = Position.from(to);
    }

    /**
     * Construye un salto valido a partir de origen y destino.
     * @param {Position|{row: number, col: number}} from - Celda de origen.
     * @param {Position|{row: number, col: number}} to - Celda de destino.
     * @returns {Move|null} Movimiento o null si no es un salto en linea recta.
     */
    static between(from, to) {
        const origin = Position.from(from);
        const destination = Position.from(to);
        if (!origin || !destination) return null;

        const rowDiff = destination.row - origin.row;
        const colDiff = destination.col - origin.col;
        const isStraightJump =
            (Math.abs(rowDiff) === 2 && colDiff === 0) ||
            (Math.abs(colDiff) === 2 && rowDiff === 0);

        if (!isStraightJump) return null;

        const over = new Position(
            origin.row + rowDiff / 2,
            origin.col + colDiff / 2
        );

        return new Move(origin, over, destination);
    }
}
