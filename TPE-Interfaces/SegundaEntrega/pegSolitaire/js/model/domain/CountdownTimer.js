/* ============================================================================
   COUNTDOWNTIMER - Reloj de la partida
   Aisla la cuenta regresiva del resto del modelo. Recibe la funcion de tiempo
   por parametro para poder testearlo sin depender del reloj real.
   ============================================================================ */

class CountdownTimer {
    /**
     * @param {number} limitMs - Duracion maxima en milisegundos.
     * @param {() => number} now - Funcion que devuelve el tiempo actual.
     */
    constructor(limitMs, now = () => Date.now()) {
        this.limitMs = limitMs;
        this.now = now;
        this.remainingMs = limitMs;
        this.deadline = null;
    }

    /** Vuelve al tiempo completo y deja el reloj detenido. */
    reset() {
        this.remainingMs = this.limitMs;
        this.deadline = null;
    }

    /** Arranca (o reinicia) la cuenta regresiva. */
    start() {
        this.remainingMs = this.limitMs;
        this.deadline = this.now() + this.limitMs;
    }

    /** Detiene el reloj conservando el tiempo restante actual. */
    stop() {
        if (this.deadline === null) return;
        this.remainingMs = this.getRemainingMs();
        this.deadline = null;
    }

    /** Tiempo restante en milisegundos. */
    getRemainingMs() {
        if (this.deadline === null) return this.remainingMs;
        return Math.max(0, this.deadline - this.now());
    }

    /** Indica si la cuenta regresiva esta activa. */
    isRunning() {
        return this.deadline !== null;
    }

    /** Indica si el tiempo se agoto. */
    isTimeUp() {
        return this.getRemainingMs() === 0;
    }
}
