/* ============================================================================
   POSITION - Value object del modelo de Peg Solitaire
   Representa una coordenada (fila, columna) del tablero. Es un value object:
   sus propiedades son publicas, pero el modelo no las muta. offsetBy()
   devuelve una instancia nueva y from() puede reutilizar una existente.
   ============================================================================ */

class Position {
    /**
     * @param {number} row - Fila dentro del tablero.
     * @param {number} col - Columna dentro del tablero.
     */
    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    /**
     * Compara dos posiciones por valor.
     * @param {Position|null} other - Posicion a comparar.
     * @returns {boolean} True si representan la misma celda.
     */
    equals(other) {
        return Boolean(other) && this.row === other.row && this.col === other.col;
    }

    /**
     * Devuelve una posicion desplazada por un delta.
     * @param {{row: number, col: number}} delta - Desplazamiento a aplicar.
     * @returns {Position} Nueva posicion.
     */
    offsetBy(delta) {
        return new Position(this.row + delta.row, this.col + delta.col);
    }

    /**
     * Indica si la posicion cae dentro de una matriz de filas y columnas.
     * @param {number} rows - Cantidad de filas.
     * @param {number} cols - Cantidad de columnas.
     * @returns {boolean} True si esta dentro de los limites.
     */
    isWithin(rows, cols) {
        return this.row >= 0 && this.row < rows && this.col >= 0 && this.col < cols;
    }

    /**
     * Convierte la posicion en un objeto plano para la vista.
     * @returns {{row: number, col: number}} Coordenada simple.
     */
    toPlain() {
        return { row: this.row, col: this.col };
    }

    /**
     * Normaliza una coordenada plana o una Position existente.
     * @param {Position|{row: number, col: number}|null} value - Valor a convertir.
     * @returns {Position|null} Position o null si no hay valor.
     */
    static from(value) {
        if (value instanceof Position) return value;
        if (!value) return null;
        return new Position(value.row, value.col);
    }
}
