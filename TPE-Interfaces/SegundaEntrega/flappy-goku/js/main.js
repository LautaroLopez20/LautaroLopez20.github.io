/* ============================================================================
   FLAPPY GOKU - Punto de entrada
   Arma las tres capas del MVC y le pasa el control al controlador.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const tablero = document.querySelector('.gameBoardFlappy');

    /* Este archivo se carga solo desde flappy-goku.html. Si no esta el tablero,
       no hay nada que iniciar. */
    if (!tablero) return;

    const proyectil = new Proyectil();

    /* El mundo arranca sin geometria: las medidas se las pasa el controlador en
       reiniciar(), que es quien mira el tablero. */
    const modelo = new Mundo(0, 0, proyectil);

    const vistas = {
        jugador: new JugadorView(document.querySelector('.flappyPelota')),
        tubos: new TuboView(document.querySelector('.flappyTubos')),
        proyectil: new ProyectilView(document.querySelector('.flappyProyectil')),
        marcador: new MarcadorView(document.querySelector('.flappyPuntaje')),
        vidas: new VidasView(document.querySelector('.flappyVidas')),
        parallax: new ParallaxView(document.querySelectorAll('.parallaxCapa')),
        menu: new MenuView(
            document.querySelector('.flappyMenu'),
            document.querySelector('.flappyMenuPuntaje'),
            {
                reiniciar: document.querySelector('#btnReiniciarFin'),
                irAlMenu: document.querySelector('#btnIrAlMenu'),
                onReiniciar: () => controller.comenzar(),
                onIrAlMenu: () => controller.irAlMenu()
            }
        ),
        menuInicio: new MenuInicioView(
            {
                inicio: document.querySelector('.flappyMenu--inicio'),
                ayuda: document.querySelector('.flappyMenu--ayuda')
            },
            {
                iniciar: document.querySelector('#btnIniciar'),
                comoJugar: document.querySelector('#btnComoJugar'),
                volver: document.querySelector('#btnVolverAyuda'),
                onIniciar: () => controller.comenzar()
            }
        )
    };

    const controller = new FlappyController({ tablero, modelo, vistas, proyectil });

    controller.init();
});
