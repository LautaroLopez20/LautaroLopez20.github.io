/* ============================================================================
   PEG - Entidad del modelo de Peg Solitaire
   Representa una ficha. La posicion no vive en la ficha: la celda que la
   contiene es la que conoce su ubicacion.
   ============================================================================ */

class Peg {
    /**
     * @param {number} id - Identificador estable dentro de la partida.
     */
    constructor(id) {
        this.id = id;
    }
}
