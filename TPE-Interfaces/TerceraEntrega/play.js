const urlImagen = sessionStorage.getItem("imagenElegida"); //recupera la imagen elegida de la sesión

const canvas = document.getElementById("imagen-juego");
canvas.style.cursor = "pointer"; //el cursor cambia para indicar que el tablero es clickeable
const contexto = canvas.getContext("2d");

//CONFIGURACION DE LA GRILLA
const CANTIDAD_FRAGMENTOS = 4; //cantidad de piezas de la blocka (por ahora fija en 4)

function calcularGrilla(n){ //devuelve cuantas columnas y filas tiene la grilla segun la cantidad de fragmentos
  if (n === 6) return { cols: 3, rows: 2 };
  if (n === 8) return { cols: 4, rows: 2 };
  return { cols: 2, rows: 2 }; //4 por defecto
}

//ESTADO DEL NIVEL
let cols = 2;
let rows = 2;
let celdaW = 0;
let celdaH = 0;
let fuente = null; //canvas offscreen con la imagen ya filtrada (se usa como fuente de los fragmentos)
let angulos = []; //angulo actual de cada fragmento (indice = fila * cols + col)
let tiempoInicio = 0; //timestamp de inicio del nivel (Date.now())
let intervalo = null; //manejador del setInterval que actualiza el reloj
let enCurso = false; 
let terminado = false; 

const imagen = new Image();
imagen.crossOrigin = "anonymous"; //esto es para que no de error de CORS al usar la imagen en el canvas

imagen.onload = () => { //primero la imagen carga y luego se prepara el nivel, sino no se dibuja nada
  canvas.width = imagen.naturalWidth;
  canvas.height = imagen.naturalHeight;

  const grilla = calcularGrilla(CANTIDAD_FRAGMENTOS);
  cols = grilla.cols;
  rows = grilla.rows;
  celdaW = canvas.width / cols;
  celdaH = canvas.height / rows;

  fuente = filtroByN(imagen); //genera la imagen filtrada una sola vez

  iniciarNivel(); //reparte los angulos al azar y dibuja el tablero
  iniciarTemporizador(); //se arranca el reloj apenas carga el nivel
};

imagen.src = urlImagen;

//INTERACCION: GIRO DE FRAGMENTOS CON EL MOUSE
canvas.addEventListener("click", (evento) => girarPorClick(evento, -90)); //el boton izquierdo gira a la izquierda
canvas.addEventListener("contextmenu", (evento) => { //el boton derecho gira a la derecha
    evento.preventDefault(); //evita que aparezca el menu contextual
    girarPorClick(evento, 90);
});

//FILTRO BLANCO Y NEGRO (aplicado sobre un canvas offscreen)
function filtroByN(img){
    const off = document.createElement("canvas"); //canvas auxiliar que no se muestra en pantalla
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;

    const offContexto = off.getContext("2d");
    offContexto.drawImage(img, 0, 0);

    let width = off.width;
    let height = off.height;

    let imageData = offContexto.getImageData(0, 0, width, height);
    let data = imageData.data;

    //Recorre la imagen con el doble ciclo
    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            let i = (x + y * width) * 4; // Calcular el índice del píxel en el array de datos (su posición)

            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Aplica el filtro en base a el BT.601
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
            //El alfa no se modifica ya que no hace falta si solo se cambian los colores a gris
        }
    }
    offContexto.putImageData(imageData, 0, 0);

    return off; //devuelve el canvas ya filtrado
};

//SETUP DEL NIVEL: reparte los angulos aleatorios y dibuja
function iniciarNivel(){
    angulos = [];
    for (let i = 0; i < cols * rows; i++){
        const opciones = [90, 180, 270]; //solo estos valores para que ninguna pieza arranque ya resuelta
        angulos.push(opciones[Math.floor(Math.random() * opciones.length)]);
    }
    dibujarTablero();
};

//DIBUJO DEL TABLERO COMPLETO
function dibujarTablero(){
    contexto.clearRect(0, 0, canvas.width, canvas.height); //limpia lo anterior antes de redibujar

    for (let fila = 0; fila < rows; fila++){
        for (let col = 0; col < cols; col++){
            let i = fila * cols + col;
            dibujarFragmento(col, fila, angulos[i]);
        }
    }
};

//DIBUJO DE UN FRAGMENTO ROTADO
function dibujarFragmento(col, fila, angulo){
    let sx = col * celdaW; //posición del fragmento dentro de la imagen original
    let sy = fila * celdaH;

    contexto.save();
    contexto.beginPath();
    contexto.rect(sx, sy, celdaW, celdaH); //la celda hace de ventana para que el fragmento no invada a los vecinos
    contexto.clip();

    //se mueve al centro del fragmento y rota tomando como eje ese centro
    contexto.translate(sx + celdaW / 2, sy + celdaH / 2); 
    contexto.rotate(angulo * Math.PI / 180); 

    contexto.drawImage(
        fuente,
        sx, sy, celdaW, celdaH,               //recorte de la fuente filtrada
        -celdaW / 2, -celdaH / 2, celdaW, celdaH //lo dibuja centrado en el origen
    );
    contexto.restore();
};

//UBICA EL FRAGMENTO CLICKEADO A PARTIR DE UNA POSICION EN PIXELES
function obtenerIndiceFragmento(x, y){
    let col = Math.floor(x / celdaW); //se convierte la posición horizontal en columna
    let fila = Math.floor(y / celdaH); //se convierte la posición vertical en fila

    if (col < 0 || col >= cols || fila < 0 || fila >= rows) return -1; //se devuelve -1 si el click fue fuera del tablero

    return fila * cols + col; //es el indice del fragmento dentro del arreglo angulos
};

//GIRA UN FRAGMENTO SEGUN EL BOTON CLICKEADO
function girarPorClick(evento, giro){
    if (terminado) return; //si el nivel ya se resolvió no se sigue girando

    let rect = canvas.getBoundingClientRect(); //rectangulo real del canvas en pantalla
    let x = (evento.clientX - rect.left) * (canvas.width / rect.width); //se pasa a coordenadas internas del canvas
    let y = (evento.clientY - rect.top) * (canvas.height / rect.height);

    let i = obtenerIndiceFragmento(x, y);
    if (i === -1) return; //si el click fue fuera del tablero no se hace nada

    angulos[i] = (angulos[i] + giro + 360) % 360; //se normaliza el ángulo entre 0 y 359
    dibujarTablero(); //se redibuja el tablero con el nuevo ángulo

    if (existeVictoria()) detenerTemporizador(); //se detiene el reloj al armarse la imagen
};

//INICIA EL CRONOMETRO DEL NIVEL
function iniciarTemporizador(){
    if (enCurso) return; //evita iniciarlo dos veces
    enCurso = true;
    tiempoInicio = Date.now();
    intervalo = setInterval(actualizarTemporizador, 100); //se actualiza cada 100ms
};

//ACTUALIZA EL TEXTO DEL RELOJ
function actualizarTemporizador(){
    let ms = Date.now() - tiempoInicio;
    document.getElementById("tiempo").textContent = formatearTiempo(ms);
};

//FORMATEA MILISEGUNDOS COMO mm:ss.d (ej: 01:23.4)
function formatearTiempo(ms){
    let decimas = Math.floor(ms / 100) % 10;
    let segundos = Math.floor(ms / 1000) % 60;
    let minutos = Math.floor(ms / 60000);
    return (minutos < 10 ? "0" + minutos : minutos) + ":" +
           (segundos < 10 ? "0" + segundos : segundos) + "." + decimas;
};

//DETIENE EL RELOJ Y DEJA EL TIEMPO FINAL COMO RECORD DEL NIVEL
function detenerTemporizador(){
    clearInterval(intervalo); //se corta la actualización del reloj
    enCurso = false;
    terminado = true; //no se permite seguir girando
    let final = Date.now() - tiempoInicio;

    document.getElementById("tiempo").textContent = formatearTiempo(final); //se fija el valor final en el reloj
    document.getElementById("tiempo-final").textContent = formatearTiempo(final);
    document.getElementById("mensaje").hidden = false; //se muestra el aviso de victoria
};

//VERIFICA SI TODAS LAS PIEZAS ESTAN EN 0 GRADOS
function existeVictoria(){
    for (let i = 0; i < angulos.length; i++){
        if (angulos[i] !== 0) return false; //si alguna pieza no está en 0° se sigue jugando
    }
    return true;
};
