/* ============================================================================
   TUBO - Vista
   Mantiene un elemento del DOM por tubo y lo reutiliza mientras ese tubo viva.
   Crear y destruir dos divs por tubo en cada frame seria trabajo tirado: los
   tubos duran varios segundos y solo se mueven.

   El Map se indexa por `tubo.id`, no por posicion en el array, asi que cuando
   el primero se va y los demas corren un lugar, cada elemento sigue pegado a
   su tubo.
   ============================================================================ */

class TuboView {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.elementos = new Map();
    }

    dibujar(tubos) {
        const vivos = new Set();

        for (const tubo of tubos) {
            vivos.add(tubo.id);

            const elemento = this.elementos.get(tubo.id) || this.crearElemento(tubo);

            /* Los dos tubos de un mismo elemento se mueven juntos: se traslada
               el contenedor y listo. */
            elemento.style.transform = `translateX(${tubo.x}px)`;

            /* El de arriba se mide por alto y el de abajo por top porque el de
               abajo esta anclado al piso con bottom: 0. */
            elemento.querySelector('.flappyTuboArriba').style.height = `${tubo.entrada}px`;
            elemento.querySelector('.flappyTuboAbajo').style.top = `${tubo.entrada + tubo.hueco}px`;
        }

        for (const [id, elemento] of this.elementos) {
            if (vivos.has(id)) continue;
            elemento.remove();
            this.elementos.delete(id);
        }
    }

    crearElemento(tubo) {
        const elemento = document.createElement('div');
        elemento.className = 'flappyTubo';
        elemento.innerHTML =
            '<div class="flappyTuboArriba"></div>' +
            '<div class="flappyTuboAbajo"></div>';

        this.contenedor.appendChild(elemento);
        this.elementos.set(tubo.id, elemento);

        return elemento;
    }
}
