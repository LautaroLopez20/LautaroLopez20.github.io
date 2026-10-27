/* ============================================================================
   PEG SOLITAIRE - Punto de entrada
   Arma las tres capas del MVC y le pasa el control al controlador.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas-game-peg');

    /* El script tambien se carga en otras paginas del sitio: si no esta el
       canvas, esta pantalla no es la del juego y no hay nada que iniciar. */
    if (!canvas) return;

    const model = new PegSolitaireModel(10); // Limite: 10 minutos
    const view = new PegSolitaireView(canvas);
    const controller = new PegSolitaireController(model, view);

    controller.init();
});
