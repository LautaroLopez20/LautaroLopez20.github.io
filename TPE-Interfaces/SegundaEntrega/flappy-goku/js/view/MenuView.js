/* ============================================================================
   MENU - Vista
   El cartel de fin de partida. Muestra u oculta una clase; el CSS decide como
   se ve. La puntuacion se copia de nuevo en cada partida porque el numero del
   cartel es el de la partida que acaba de terminar, no el de la anterior.
   ============================================================================ */

class MenuView {
    constructor(elemento, puntajeElemento) {
        this.elemento = elemento;
        this.puntajeElemento = puntajeElemento;
    }

    mostrar(puntaje) {
        this.puntajeElemento.textContent = puntaje;
        this.elemento.classList.add('flappyMenu--visible');
    }

    ocultar() {
        this.elemento.classList.remove('flappyMenu--visible');
    }
}
