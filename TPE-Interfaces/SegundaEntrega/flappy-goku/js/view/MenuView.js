/* ============================================================================
   MENU - Vista
   El cartel de fin de partida. Muestra u oculta una clase; el CSS decide como
   se ve. La puntuacion se copia de nuevo en cada partida porque el numero del
   cartel es el de la partida que acaba de terminar, no el de la anterior.
   Los botones se conectan aca para que el controlador no toque el DOM.
   ============================================================================ */

class MenuView {
    constructor(elemento, puntajeElemento, botones) {
        this.elemento = elemento;
        this.puntajeElemento = puntajeElemento;

        botones.reiniciar.addEventListener('click', botones.onReiniciar);
        botones.irAlMenu.addEventListener('click', botones.onIrAlMenu);
    }

    mostrar(puntaje) {
        this.puntajeElemento.textContent = puntaje;
        this.elemento.classList.add('flappyMenu--visible');
    }

    ocultar() {
        this.elemento.classList.remove('flappyMenu--visible');
    }
}

/* ============================================================================
   MENU DE INICIO / AYUDA - Vista
   Usa el mismo cartel y la misma clase de visibilidad que el menu de fin.
   El controlador no toca el DOM: los botones se conectan aca.
   ============================================================================ */

class MenuInicioView {
    constructor(paneles, botones) {
        this.inicio = paneles.inicio;
        this.ayuda = paneles.ayuda;

        botones.iniciar.addEventListener('click', botones.onIniciar);
        botones.comoJugar.addEventListener('click', () => this.mostrarAyuda());
        botones.volver.addEventListener('click', () => this.mostrarInicio());
    }

    mostrarInicio() {
        this.ayuda.classList.remove('flappyMenu--visible');
        this.inicio.classList.add('flappyMenu--visible');
    }

    mostrarAyuda() {
        this.inicio.classList.remove('flappyMenu--visible');
        this.ayuda.classList.add('flappyMenu--visible');
    }

    ocultar() {
        this.inicio.classList.remove('flappyMenu--visible');
        this.ayuda.classList.remove('flappyMenu--visible');
    }
}
