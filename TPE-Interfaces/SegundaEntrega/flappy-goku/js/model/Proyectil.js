/* ============================================================================
   PROYECTIL - Modelo
   Un solo proyectil reutilizable que viaja de derecha a izquierda. Su velocidad
   base se escala con el mismo factor que tubos y parallax.
   ============================================================================ */

class Proyectil {
    static ANCHO = 96;
    static ALTO = 64;
    static VELOCIDAD = 350;
    static SPAWN_CADA = 5;
    static MARGEN_Y = 24;

    constructor() {
        this.activo = false;
        this.x = 0;
        this.y = 0;
        this.tiempoSpawn = Proyectil.SPAWN_CADA;
        this.anchoTablero = 0;
        this.altoJugable = 0;
    }

    reiniciar(anchoTablero, altoJugable) {
        this.anchoTablero = anchoTablero;
        this.altoJugable = altoJugable;
        this.activo = false;
        this.tiempoSpawn = Proyectil.SPAWN_CADA;
    }

    actualizar(dt, factorVelocidad = 1) {
        if (!this.activo) {
            this.tiempoSpawn -= dt;
            if (this.tiempoSpawn <= 0) {
                this.spawnear();
            }
            return;
        }

        this.x -= Proyectil.VELOCIDAD * factorVelocidad * dt;
        if (this.x + Proyectil.ANCHO < 0) {
            this.activo = false;
            this.tiempoSpawn = Proyectil.SPAWN_CADA;
        }
    }

    spawnear() {
        const maxY = Math.max(Proyectil.MARGEN_Y, this.altoJugable - Proyectil.MARGEN_Y - Proyectil.ALTO);
        this.y = Proyectil.MARGEN_Y + Math.random() * (maxY - Proyectil.MARGEN_Y);
        this.x = this.anchoTablero;
        this.activo = true;
        this.tiempoSpawn = Proyectil.SPAWN_CADA;
    }

    caja() {
        if (!this.activo) return null;
        return { x: this.x, y: this.y, ancho: Proyectil.ANCHO, alto: Proyectil.ALTO };
    }

    colisionaCon(caja) {
        const propia = this.caja();
        if (!propia) return false;

        return (
            propia.x < caja.x + caja.ancho &&
            propia.x + propia.ancho > caja.x &&
            propia.y < caja.y + caja.alto &&
            propia.y + propia.alto > caja.y
        );
    }

    desactivar() {
        this.activo = false;
        this.tiempoSpawn = Proyectil.SPAWN_CADA;
    }
}
