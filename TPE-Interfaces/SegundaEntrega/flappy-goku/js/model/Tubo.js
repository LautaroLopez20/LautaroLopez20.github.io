/* ============================================================================
   TUBO - Modelo
   Una tuberia son dos rectangulos separados por un hueco: el de arriba baja
   desde el techo hasta `entrada`, el de abajo sube desde el suelo hasta
   `entrada + hueco`. El jugador tiene que pasar justo por ese hueco.

   El tubo no sabe donde esta el jugador ni cuando termina la partida: solo
   guarda su geometria y responde si una caja lo toca. Esa separacion es la que
   deja todas las reglas del juego en el controlador.
   ============================================================================ */

class Tubo {
    /* El ancho esta duplicado en `.flappyTubo` (css/juego.css) porque el CSS no
       puede leer constantes de JS. Si cambia uno, hay que cambiar el otro. */
    static ANCHO = 64;

    /* El id es lo que usa la vista para saber que elemento del DOM le toca a
       cada tubo. Nunca se repite, ni siquiera entre partidas, asi que un tubo
       nuevo jamas hereda el elemento de uno viejo. */
    static proximoId = 1;

    constructor({ x, entrada, hueco, altoJugable }) {
        this.id = Tubo.proximoId++;
        this.x = x;
        this.entrada = entrada;
        this.hueco = hueco;
        this.altoJugable = altoJugable;
    }

    cajaArriba() {
        return { x: this.x, y: 0, ancho: Tubo.ANCHO, alto: this.entrada };
    }

    cajaAbajo() {
        const borde = this.entrada + this.hueco;
        return { x: this.x, y: borde, ancho: Tubo.ANCHO, alto: this.altoJugable - borde };
    }

    colisionaCon(caja) {
        return Tubo.seSolapan(this.cajaArriba(), caja) || Tubo.seSolapan(this.cajaAbajo(), caja);
    }

    /* AABB clasico: dos rectangulos se tocan solo si se superponen en x y en y
       al mismo tiempo. El jugador manda una caja mas chica que su dibujo, si no
       muere cuando la imagen todavia no rozo nada. */
    static seSolapan(a, b) {
        return (
            a.x < b.x + b.ancho &&
            a.x + a.ancho > b.x &&
            a.y < b.y + b.alto &&
            a.y + a.alto > b.y
        );
    }
}
