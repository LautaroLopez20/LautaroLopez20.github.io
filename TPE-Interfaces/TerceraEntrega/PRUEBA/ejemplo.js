document.addEventListener("DOMContentLoaded", () => { //event listener para todo el documento para que se ejecute cuando el DOM esté completamente cargado
  // 1. Banco de Imágenes de Prueba (URLs de ejemplo)
  const imageBank = [ //arreglo de imágenes de prueba para el juego
    "https://picsum.photos/id/1015/500/500",
    "https://picsum.photos/id/1018/500/500",
    "https://picsum.photos/id/1025/500/500",
    "https://picsum.photos/id/1069/500/500"
  ];

  // 2. Elementos del DOM, es decir las variables que hacen referencia a los elementos del HTML (constantes)
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const btnStart = document.getElementById("btn-start");
  const btnNext = document.getElementById("btn-next");
  const timerDisplay = document.getElementById("timer-display");
  const btnInstructions = document.getElementById("btn-instructions");
  const modalInstructions = document.getElementById("modal-instructions");
  const btnCloseModal = document.getElementById("btn-close-modal");

  // 3. Estado Global del Juego, osea, variables que se van a usar en varias funciones
  let currentImage = new Image();
  let filteredCanvasBuffer = document.createElement("canvas"); //esta es un canvas en memoria para aplicar filtros sin afectar el canvas principal
  let originalCanvasBuffer = document.createElement("canvas"); //este es otro canvas en memoria para guardar la imagen original sin filtro
  let gridRows = 2; // 2x2 por defecto = 4 subimágenes
  let gridCols = 2;
  let pieces = [];
  let gameStarted = false;
  let isLevelCompleted = false;
  let timerInterval = null;
  let secondsElapsed = 0;

  // Estructura de cada subimagen
  class Piece {
    constructor(row, col, width, height) {
      this.row = row;
      this.col = col;
      this.width = width;
      this.height = height;
      this.srcX = col * width; // columna * ancho de la subimagen para obtener la coordenada X de origen en la imagen original
      this.srcY = row * height; // igual para la coordenada Y de origen
      
      // Ángulo aleatorio de inicio: 0, 90, 180 o 270 grados
      const possibleAngles = [0, 90, 180, 270]; 
      this.currentAngle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
    }

    isCorrect() {
      // Un cuadrante cuadrado rotado 360° o 0° está bien ubicado
      return (this.currentAngle % 360) === 0;
    }

    rotateLeft() {
      this.currentAngle = (this.currentAngle - 90 + 360) % 360; // el %360 asegura que el ángulo siempre esté entre 0 y 359 grados
    }

    rotateRight() {
      this.currentAngle = (this.currentAngle + 90) % 360;
    }
  }

  // 4. Inicializar Nivel 1
  function initLevel() {
    isLevelCompleted = false;
    btnNext.disabled = true;

    // Selección aleatoria del banco de imágenes [6]
    const randomUrl = imageBank[Math.floor(Math.random() * imageBank.length)];

    // Carga asincrónica [2]
    currentImage = new Image();
    currentImage.crossOrigin = "Anonymous"; // Evitar problemas de CORS al manipular píxeles (CORS: Cross-Origin Resource Sharing)
    currentImage.onload = function () {
      setupBuffers();
      createPieces(); // Crear Matriz de Subimágenes
      renderCanvas(); // Renderizado del Canvas con Transformaciones
    };
    currentImage.src = randomUrl;
  }

  // 5. Preparar Buffers en Memoria y Aplicar Filtros
  function setupBuffers() {
    filteredCanvasBuffer.width = canvas.width;
    filteredCanvasBuffer.height = canvas.height;
    originalCanvasBuffer.width = canvas.width;
    originalCanvasBuffer.height = canvas.height;

    const fCtx = filteredCanvasBuffer.getContext("2d"); //el getContext("2d") nos permite dibujar en el canvas
    const oCtx = originalCanvasBuffer.getContext("2d");

    // Dibujar imagen limpia en el buffer original
    oCtx.drawImage(currentImage, 0, 0, canvas.width, canvas.height); //el drawImage usa la imagen cargada y la dibuja en el canvas con las dimensiones del canvas

    // Dibujar imagen en el buffer con filtro
    fCtx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // Aplicar Filtro de Nivel 1: Escala de Grises BT.601
    const imageData = fCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
    }

    fCtx.putImageData(imageData, 0, 0); // Reponer imagen filtrada
  }

  // 6. Crear Matriz de Subimágenes
  function createPieces() {
    pieces = [];
    const pieceWidth = canvas.width / gridCols;
    const pieceHeight = canvas.height / gridRows;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        pieces.push(new Piece(r, c, pieceWidth, pieceHeight));
      }
    }

    // Asegurar que al menos una pieza arranque desordenada al inicio
    if (checkVictory() && pieces.length > 0) { //la verificación de victoria asegura que todas las piezas estén en su posición correcta, 
        // si es así, rotamos la primera pieza para desordenar el juego
      pieces[0].rotateRight();
    }
  }

  // 7. Renderizado del Canvas con Transformaciones
  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Si el nivel se completó, usamos la imagen sin filtro; si no, la filtrada
    const activeBuffer = isLevelCompleted ? originalCanvasBuffer : filteredCanvasBuffer;

    pieces.forEach(p => {
      ctx.save(); // Guardar el estado del contexto

      // Calcular el centro de la subimagen en el lienzo
      const centerX = p.srcX + p.width / 2;
      const centerY = p.srcY + p.height / 2;

      // Desplazar el origen al centro de la pieza y rotar
      ctx.translate(centerX, centerY);
      ctx.rotate((p.currentAngle * Math.PI) / 180);

      // Dibujar la pieza centrada en la nueva coordenada
      ctx.drawImage(
        activeBuffer,
        p.srcX, p.srcY, p.width, p.height, // Recorte origen
        -p.width / 2, -p.height / 2, p.width, p.height // Destino relativo
      );

      ctx.restore(); // Restaurar el contexto
    });
  }

  // 8. Detección de Clics sobre las Subimágenes
  canvas.addEventListener("click", (e) => {
    if (!gameStarted || isLevelCompleted) return;
    handlePieceClick(e, "left");
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // Evitar menú contextual del navegador
    if (!gameStarted || isLevelCompleted) return;
    handlePieceClick(e, "right");
  });

  function handlePieceClick(e, clickType) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pieceWidth = canvas.width / gridCols;
    const pieceHeight = canvas.height / gridRows;

    // Identificar la pieza clickeada según las coordenadas
    const col = Math.floor(clickX / pieceWidth);
    const row = Math.floor(clickY / pieceHeight);
    const pieceIndex = row * gridCols + col;

    if (pieces[pieceIndex]) {
      if (clickType === "left") {
        pieces[pieceIndex].rotateLeft(); // Clic Izquierdo = Rotación Izquierda
      } else {
        pieces[pieceIndex].rotateRight(); // Clic Derecho = Rotación Derecha
      }
      renderCanvas();
      verifyGameState();
    }
  }

  // 9. Verificar Condición de Victoria
  function checkVictory() {
    return pieces.every(p => p.isCorrect());
  }

  function verifyGameState() {
    if (checkVictory()) {
      isLevelCompleted = true;
      stopTimer();
      renderCanvas(); // Redibuja mostrando la imagen RGB sin filtro [5, 6]
      btnNext.disabled = false;
      alert("¡Felicitaciones! Nivel completado. Tiempo registrado: " + timerDisplay.textContent);
    }
  }

  // 10. Temporizador
  function startTimer() {
    secondsElapsed = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsElapsed++;
      const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
      const secs = String(secondsElapsed % 60).padStart(2, '0');
      timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  // Controladores de Eventos de la Interfaz
  btnStart.addEventListener("click", () => {
    gameStarted = true;
    startTimer();
    initLevel();
  });

  btnInstructions.addEventListener("click", () => {
    modalInstructions.classList.remove("hidden");
  });

  btnCloseModal.addEventListener("click", () => {
    modalInstructions.classList.add("hidden");
  });

  // Carga inicial al abrir la página
  initLevel();
});