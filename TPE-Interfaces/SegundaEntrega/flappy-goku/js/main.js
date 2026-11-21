/* ============================================================================
   FLAPPY GOKU - Punto de entrada
   Arma las tres capas del MVC y le pasa el control al controlador.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const tablero = document.querySelector('.gameBoardFlappy');

    /* Este archivo se carga solo desde flappy-goku.html. Si no esta el tablero,
       no hay nada que iniciar. */
    if (!tablero) return;

    /* El mundo arranca sin geometria: las medidas se las pasa el controlador en
       reiniciar(), que es quien mira el tablero. */
    const modelo = new Mundo();

    const vistas = {
        jugador: new JugadorView(document.querySelector('.flappyPelota')),
        tubos: new TuboView(document.querySelector('.flappyTubos')),
        marcador: new MarcadorView(document.querySelector('.flappyPuntaje')),
        vidas: new VidasView(document.querySelector('.flappyVidas')),
        menu: new MenuView(
            document.querySelector('.flappyMenu'),
            document.querySelector('.flappyMenuPuntaje')
        )
    };

    const controller = new FlappyController({ tablero, modelo, vistas });

    controller.init();
});
