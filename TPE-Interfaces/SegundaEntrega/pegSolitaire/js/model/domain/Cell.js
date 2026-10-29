/* ============================================================================
   CELL - Entidad del modelo de Peg Solitaire
   Representa una ranura jugable del tablero. Las celdas fuera de la cruz no
   existen como objeto: en la matriz del tablero se guardan como null.
   ============================================================================ */

class Cell {
    /**
     * @param {Position} position - Ubicacion de la ranura.
     * @param {Peg|null} peg - Ficha inicial, si la hay.
     */
    constructor(position, peg = null) {
        this.position = position;
        this.peg = peg;
    }

    /** Indica si la ranura esta ocupada. */
    hasPeg() {
        return this.peg !== null;
    }

    /** Indica si la ranura esta vacia. */
    isEmpty() {
        return this.peg === null;
    }

    /**
     * Coloca una ficha en la ranura.
     * @param {Peg} peg - Ficha a colocar.
     * @returns {boolean} True si la ranura estaba vacia.
     */
    placePeg(peg) {
        if (this.hasPeg()) return false;
        this.peg = peg;
        return true;
    }

    /**
     * Quita y devuelve la ficha de la ranura.
     * @returns {Peg|null} Ficha que estaba en la celda.
     */
    removePeg() {
        const peg = this.peg;
        this.peg = null;
        return peg;
    }
}
