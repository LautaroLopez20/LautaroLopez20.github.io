/* ============================================================================
   VISTA - PegSolitaireView
   Dibuja el tablero en el canvas y actualiza el HUD y los carteles del DOM.
   No decide reglas del juego: solo pinta el estado que le pasa el controlador.
   ============================================================================ */

const PEG_CELL_SIZE = 55;          // Lado de cada celda del tablero
const PEG_BOARD_SIZE = 7 * PEG_CELL_SIZE;
const PEG_CHIP_SIZE = 58;          // Tamano con el que se dibuja la ficha
const PEG_HINT_RGB = '245, 183, 0';     // Amarillo de las pistas
const PEG_SELECTED_RGB = '184, 70, 29'; // Naranja del anillo de seleccion

class PegSolitaireView {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas donde se dibuja la partida.
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        /* El tablero queda centrado en el canvas (1340 x 507). */
        this.offsetX = (canvas.width - PEG_BOARD_SIZE) / 2;
        this.offsetY = (canvas.height - PEG_BOARD_SIZE) / 2;

        /* Imagenes del juego: fondo del tablero y ficha. */
        this.boardImage = this.loadImage('pegSolitaire/img/tablero.svg');
        this.chipImage = this.loadImage('pegSolitaire/img/ficha.svg');

        /* Callback opcional: el controlador lo usa para redibujar cuando
           terminan de cargar las imagenes. */
        this.onAssetsLoaded = null;

        /* Referencias del DOM que maneja la vista. */
        const $ = (id) => document.getElementById(id);
        this.ui = {
            timer: $('pegTimer'),
            chips: $('pegChips'),
            restart: $('pegRestart'),
            startMenu: $('startMenu'),
            startBtn: $('startBtn'),
            endMenu: $('endMenu'),
            endTitle: $('endTitle'),
            endMessage: $('endMessage'),
            endBtn: $('endBtn')
        };

        /* Cache para no reescribir el DOM en cada cuadro. */
        this.lastTimerText = '';
        this.lastChipCount = -1;
    }

    /**
     * Crea una imagen y avisa cuando esta lista para dibujarse.
     * @param {string} src - Ruta del archivo.
     * @returns {HTMLImageElement} Imagen cargada en segundo plano.
     */
    loadImage(src) {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            if (this.onAssetsLoaded) this.onAssetsLoaded();
        };
        return image;
    }

    /* --------------------------- DIBUJADO ------------------------------- */

    /**
     * Dibuja un cuadro completo del juego.
     * @param {object} state - Estado devuelto por el modelo (getState).
     * @param {number} time - Marca de tiempo para animar los hints.
     * @param {object|null} drag - Ficha que se esta arrastrando.
     */
    render(state, time, drag) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBoardBackground();
        this.drawHints(state.validTargets, time);

        for (let row = 0; row < state.cells.length; row++) {
            for (let col = 0; col < state.cells[row].length; col++) {
                if (state.cells[row][col] !== PEG_CHIP) continue;
                if (drag && drag.from.row === row && drag.from.col === col) continue;
                this.drawChip(this.cellCenter(row, col));
            }
        }

        if (drag) {
            this.drawChip(drag.position, 0.9);
        } else if (state.selected) {
            this.drawSelection(this.cellCenter(state.selected.row, state.selected.col), time);
        }
    }

    /** Pinta la imagen de fondo (tablero vacio) o un fondo liso si aun carga. */
    drawBoardBackground() {
        if (this.boardImage.complete && this.boardImage.naturalWidth > 0) {
            this.ctx.drawImage(this.boardImage, 0, 0);
        } else {
            this.ctx.fillStyle = '#121B3F';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Convierte una celda del tablero al centro en pixeles del canvas.
     * @returns {{x: number, y: number}} Centro de la celda.
     */
    cellCenter(row, col) {
        return {
            x: this.offsetX + col * PEG_CELL_SIZE + PEG_CELL_SIZE / 2,
            y: this.offsetY + row * PEG_CELL_SIZE + PEG_CELL_SIZE / 2
        };
    }

    /**
     * Dibuja una ficha en una posicion del canvas.
     * @param {{x: number, y: number}} position - Centro de la ficha.
     * @param {number} alpha - Opacidad (se baja mientras se arrastra).
     */
    drawChip(position, alpha = 1) {
        const ctx = this.ctx;
        const half = PEG_CHIP_SIZE / 2;

        ctx.save();
        ctx.globalAlpha = alpha;

        /* Sombra barata: una elipse debajo de la ficha. */
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(position.x, position.y + half * 0.4, half * 0.8, half * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.chipImage.complete && this.chipImage.naturalWidth > 0) {
            ctx.drawImage(
                this.chipImage,
                position.x - half,
                position.y - half,
                PEG_CHIP_SIZE,
                PEG_CHIP_SIZE
            );
        } else {
            /* Respaldo por si la imagen todavia no cargo. */
            ctx.fillStyle = '#F5B700';
            ctx.beginPath();
            ctx.arc(position.x, position.y, half * 0.75, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Dibuja las pistas animadas sobre cada destino valido.
     * @param {{row: number, col: number}[]} targets - Destinos posibles.
     * @param {number} time - Marca de tiempo actual (ms).
     */
    drawHints(targets, time) {
        const ctx = this.ctx;

        targets.forEach((target, index) => {
            const center = this.cellCenter(target.row, target.col);
            const phase = ((time + index * 180) % 900) / 900;

            ctx.save();

            /* Onda que crece y se desvanece. */
            ctx.strokeStyle = `rgba(${PEG_HINT_RGB}, ${0.85 * (1 - phase)})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(center.x, center.y, 10 + phase * 13, 0, Math.PI * 2);
            ctx.stroke();

            /* Anillo fijo que marca la ranura de destino. */
            ctx.strokeStyle = `rgba(${PEG_HINT_RGB}, 0.9)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center.x, center.y, 19, 0, Math.PI * 2);
            ctx.stroke();

            /* Punto central. */
            ctx.fillStyle = `rgba(${PEG_HINT_RGB}, 0.85)`;
            ctx.beginPath();
            ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    /**
     * Dibuja el anillo que marca la ficha seleccionada.
     * @param {{x: number, y: number}} center - Centro de la ficha.
     * @param {number} time - Marca de tiempo actual (ms).
     */
    drawSelection(center, time) {
        const pulse = 0.55 + 0.35 * Math.sin(time / 180);
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = `rgba(${PEG_SELECTED_RGB}, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(center.x, center.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    /* --------------------------- COORDENADAS ---------------------------- */

    /**
     * Convierte la posicion del mouse a coordenadas internas del canvas,
     * contemplando el escalado de CSS.
     * @param {MouseEvent} event - Evento del mouse.
     * @returns {{x: number, y: number}} Punto en pixeles del canvas.
     */
    canvasPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    /**
     * Convierte un punto del canvas en una celda del tablero.
     * @param {{x: number, y: number}} point - Punto en pixeles.
     * @returns {{row: number, col: number}|null} Celda dentro de la matriz 7x7.
     */
    pointToCell(point) {
        const col = Math.floor((point.x - this.offsetX) / PEG_CELL_SIZE);
        const row = Math.floor((point.y - this.offsetY) / PEG_CELL_SIZE);

        if (row < 0 || row >= 7 || col < 0 || col >= 7) return null;
        return { row, col };
    }

    /* ------------------------------- HUD -------------------------------- */

    /**
     * Actualiza el reloj y el contador de fichas del HUD.
     * @param {number} remainingMs - Tiempo restante en milisegundos.
     * @param {number} remainingChips - Fichas que siguen en el tablero.
     */
    updateHud(remainingMs, remainingChips) {
        const timerText = this.formatTime(remainingMs);
        if (timerText !== this.lastTimerText) {
            this.ui.timer.textContent = timerText;
            this.ui.timer.classList.toggle('isLow', remainingMs <= 30000);
            this.lastTimerText = timerText;
        }

        if (remainingChips !== this.lastChipCount) {
            this.ui.chips.textContent = remainingChips;
            this.lastChipCount = remainingChips;
        }
    }

    /**
     * Formatea milisegundos como MM:SS (redondeando hacia arriba para no
     * mostrar 00:00 antes de que el tiempo llegue realmente a cero).
     * @param {number} ms - Tiempo en milisegundos.
     * @returns {string} Tiempo en formato MM:SS.
     */
    formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /* ---------------------------- CARTELES ------------------------------ */

    /** Oculta el menu de inicio para dejar ver el tablero. */
    hideStartMenu() {
        this.ui.startMenu.classList.add('hidden');
    }

    /**
     * Muestra el cartel de fin de partida.
     * @param {string} title - Titulo principal.
     * @param {string} message - Texto explicativo.
     * @param {string} buttonLabel - Texto del boton de reinicio.
     */
    showEndMenu(title, message, buttonLabel) {
        this.ui.endTitle.textContent = title;
        this.ui.endMessage.textContent = message;
        this.ui.endBtn.textContent = buttonLabel;
        this.ui.endMenu.classList.remove('hidden');
    }

    /** Oculta el cartel de fin de partida. */
    hideEndMenu() {
        this.ui.endMenu.classList.add('hidden');
    }
}
