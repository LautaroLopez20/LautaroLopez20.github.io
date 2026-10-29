/* ============================================================================
   PEG SOLITAIRE - Punto de entrada
   Arma las tres capas del MVC y le pasa el control al controlador.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas-game-peg');

    /* Este archivo se carga solo desde pegSolitaire.html. Si no esta el
       canvas, no hay nada que iniciar. */
    if (!canvas) return;

    const model = new PegSolitaireModel(10); // Limite: 10 minutos
    const view = new PegSolitaireView(canvas);
    const controller = new PegSolitaireController(model, view);

    controller.init();
});
