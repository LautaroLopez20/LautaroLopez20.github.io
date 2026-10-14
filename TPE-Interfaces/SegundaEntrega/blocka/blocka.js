document.addEventListener("DOMContentLoaded", () => { //se espera a que el DOM este listo antes de tocar la galeria y el tablero

  const galeria = document.getElementById("image-gallery");
  if (!galeria) return; //la logica de Blocka solo corre en su propia pagina

  /* TIEMPO LIMITE DEL NIVEL 3 (en milisegundos) */
  const TIEMPO_LIMITE_MS = 20000;

  /* LADO (en px) DE CADA PIEZA DEL ROMPECABEZAS */
  const LADO_PIEZA = 250;

  /* Banco de imagenes de prueba: se guardan solo los IDs de picsum, porque el
     tamano final de cada foto depende de la dificultad (ver urlImagen). */
  const imageBank = [1015, 1018, 1025, 1069, 1073, 1084, 1074, 1080, 1043, 1035, 237, 433];

  /* Devuelve la URL de picsum para una foto con la proporcion de la grilla.
     Ej: grilla 3x2 -> 750x500, asi cada celda mide 250x250 (cuadrada) y la
     imagen entra entera, sin recortes ni estiramientos. */
  function urlImagen(id, cols, rows){
    return "https://picsum.photos/id/" + id + "/" + (cols * LADO_PIEZA) + "/" + (rows * LADO_PIEZA);
  }

  /* Cantidad de imagenes visibles en la galeria */
  const IMAGENES_VISIBLES = 6;

  /* FASES DEL JUEGO */
  const fases = {
    menu: document.getElementById("faseMenu"),
    seleccion: document.getElementById("faseSeleccion"),
    juego: document.getElementById("faseJuego")
  };

  /* SELECTORES DEL MENU */
  const botonesNivel = document.querySelectorAll(".opcionNivel");
  const botonesDificultad = document.querySelectorAll(".opcionDificultad");
  const btnMenuComenzar = document.getElementById("btn-menu-comenzar");

  /* ELEMENTOS DE LA SELECCION DE IMAGEN */
  const btnStart = document.getElementById("btn-start");
  let imagenes = []; //se rellena al construir la galeria

  /* ELEMENTOS DEL JUEGO */
  const canvas = document.getElementById("imagen-juego");
  canvas.style.cursor = "pointer"; //el cursor cambia para indicar que el tablero es clickeable
  const contexto = canvas.getContext("2d");
  const reloj = document.getElementById("tiempo");
  const hud = document.getElementById("hud");

  /* ELEMENTOS DEL RESULTADO (se muestran sobre el tablero) */
  const resultadoTop = document.getElementById("resultadoTop");
  const resultadoBottom = document.getElementById("resultadoBottom");
  const resultadoTituloEl = document.getElementById("resultadoTitulo");
  const resultadoTiempoEl = document.getElementById("resultadoTiempo");
  const btnReintentar = document.getElementById("btn-reintentar");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnMenu = document.getElementById("btn-menu");

  /* ESTADO DE LA SELECCION (menu) */
  let nivelSeleccionado = 1;
  let dificultadSeleccionada = 4;

  /* ESTADO DEL NIVEL EN CURSO */
  let nivelActual = 1;
  let fragmentosActuales = 4;
  let tieneLimite = false; //solo el nivel 3 corre contra reloj
  let cols = 2;
  let rows = 2;
  let celdaW = 0;
  let celdaH = 0;
  let fuente = null; //canvas offscreen con la imagen ya filtrada (fuente de los fragmentos)
  let angulos = []; //angulo actual de cada fragmento (indice = fila * cols + col)
  let tiempoInicio = 0; //timestamp de inicio del nivel (Date.now())
  let intervalo = null; //manejador del setInterval que actualiza el reloj
  let enCurso = false;
  let terminado = true; //arranca en true: no se juega hasta que empiece un nivel

  const imagen = new Image();
  imagen.crossOrigin = "anonymous"; //esto evita el error de CORS al usar la imagen en el canvas
  imagen.onload = prepararNivel; //primero carga la imagen y recien ahi se arma el nivel

  /* FASES: muestra una sola fase y oculta el resto */
  function mostrarFase(nombre){
    Object.keys(fases).forEach((clave) => {
      fases[clave].hidden = clave !== nombre;
    });
  }

  /* MENU: refleja la seleccion actual en los botones */
  function sincronizarMenu(){
    botonesNivel.forEach((boton) => {
      const activo = Number(boton.dataset.nivel) === nivelSeleccionado;
      boton.classList.toggle("activo", activo);
      boton.setAttribute("aria-pressed", String(activo));
    });

    botonesDificultad.forEach((boton) => {
      const activo = Number(boton.dataset.fragmentos) === dificultadSeleccionada;
      boton.classList.toggle("activo", activo);
      boton.setAttribute("aria-pressed", String(activo));
    });
  }

  /* Vuelve al menu principal y limpia la partida anterior */
  function irAlMenu(){
    detenerReloj();
    terminado = true;
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    if (hud) hud.hidden = false;
    resultadoTop.hidden = true;
    resultadoBottom.hidden = true;
    reloj.classList.remove("peligro");
    sincronizarMenu();
    mostrarFase("menu");
  }

  /* Pasa a la seleccion de imagen, rearmando la galeria */
  function irASeleccionDeImagen(){
    detenerReloj();
    terminado = true; //el tablero queda bloqueado hasta que empiece el nivel
    btnStart.disabled = false;
    if (hud) hud.hidden = false;
    resultadoTop.hidden = true;
    resultadoBottom.hidden = true;
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    construirGaleria();
    mostrarFase("seleccion");
  }

  /* GALERIA: elige imagenes al azar sin repetir y las muestra */
  function construirGaleria(){
    galeria.innerHTML = "";

    //La proporcion de la foto depende de la dificultad elegida, asi las
    //miniaturas (y el tablero) ya vienen con el aspect que necesita el juego.
    const grilla = calcularGrilla(dificultadSeleccionada);

    const elegidas = []; //IDs de las imagenes que ya se mostraron
    let i = 0;
    while (i < IMAGENES_VISIBLES) {
      const id = imageBank[Math.floor(Math.random() * imageBank.length)]; //ID de la imagen elegida

      if (!elegidas.includes(id)) { //si la imagen todavia no fue elegida
        elegidas.push(id); //se anota para no repetirla

        const img = document.createElement("img"); //se crea un elemento de imagen para cada imagen de la galeria
        img.src = urlImagen(id, grilla.cols, grilla.rows); //URL con la proporcion de la grilla
        img.className = "game-image";
        galeria.appendChild(img); //agrega la imagen al contenedor de la galeria
        i++;
      }
      //Sino se puede mezclar el arreglo y hacer un slice de las primeras 6, ya que el banco no repite.
    }

    imagenes = galeria.querySelectorAll("img");
  }

  /* RULETA: elige la imagen y arranca la partida */
  btnStart.addEventListener("click", () => {
    btnStart.disabled = true; //asi no se toca dos veces

    let imagenActiva = null;

    const intervaloRuleta = setInterval(() => {
      if (imagenActiva) { //verifica asi despues no estan todas iluminadas
        imagenActiva.classList.remove("seleccionado");
      }

      const azar = Math.floor(Math.random() * imagenes.length);
      imagenActiva = imagenes[azar];
      imagenActiva.classList.add("seleccionado"); //define la imagen activa
    }, 400);

    setTimeout(() => {
      clearInterval(intervaloRuleta); //corta la ruleta

      if (imagenActiva) {
        imagenActiva.classList.remove("seleccionado");
      }

      const azarFinal = Math.floor(Math.random() * imagenes.length);
      const imagenElegida = imagenes[azarFinal];
      imagenElegida.classList.add("elegida");

      //Se espera un momento para que se vea la imagen elegida y recien ahi se juega.
      setTimeout(() => arrancarJuego(imagenElegida.src), 1200);
    }, 2600); //duracion de la ruleta
  });

  /* MENU: botones de nivel y dificultad */
  botonesNivel.forEach((boton) => {
    boton.addEventListener("click", () => {
      nivelSeleccionado = Number(boton.dataset.nivel);
      sincronizarMenu();
    });
  });

  botonesDificultad.forEach((boton) => {
    boton.addEventListener("click", () => {
      dificultadSeleccionada = Number(boton.dataset.fragmentos);
      sincronizarMenu();
    });
  });

  btnMenuComenzar.addEventListener("click", irASeleccionDeImagen);

  /* Pasa de la seleccion al juego con el nivel y la dificultad elegidos */
  function arrancarJuego(url) {
    nivelActual = nivelSeleccionado;
    fragmentosActuales = dificultadSeleccionada;
    tieneLimite = nivelActual === 3;

    if (hud) hud.hidden = false;
    resultadoTop.hidden = true;
    resultadoBottom.hidden = true;
    reloj.classList.remove("peligro");

    mostrarFase("juego");

    //Si ya es la misma imagen cargada no se dispara onload, asi que se prepara a mano.
    if (imagen.src === url && imagen.complete && imagen.naturalWidth > 0) {
      prepararNivel();
    } else {
      imagen.src = url; //dispara imagen.onload -> prepararNivel
    }
  }

  /* CONFIGURACION DE LA GRILLA */
  //Devuelve cuantas columnas y filas tiene la grilla segun la cantidad de fragmentos.
  function calcularGrilla(n){
    if (n === 6) return { cols: 3, rows: 2 };
    if (n === 8) return { cols: 4, rows: 2 };
    return { cols: 2, rows: 2 }; //4 por defecto
  }

  /* ARMA EL NIVEL UNA VEZ CARGADA LA IMAGEN */
  function prepararNivel(){
    canvas.width = imagen.naturalWidth;
    canvas.height = imagen.naturalHeight;

    const grilla = calcularGrilla(fragmentosActuales);
    cols = grilla.cols;
    rows = grilla.rows;

    //La imagen se pidio a picsum con la proporcion cols:rows (ver urlImagen),
    //asi que width/cols === height/rows: todas las celdas quedan cuadradas,
    //del mismo tamano, y rotan 90 grados sin deformarse.
    celdaW = canvas.width / cols;
    celdaH = canvas.height / rows;

    fuente = aplicarFiltro(imagen, nivelActual); //genera la imagen filtrada una sola vez

    iniciarNivel(); //reparte los angulos al azar y dibuja el tablero
    iniciarTemporizador(); //se arranca el reloj apenas carga el nivel
  }

  /* FILTROS: la imagen se procesa una sola vez y queda lista para recortar */
  function aplicarFiltro(img, nivel){
    const off = document.createElement("canvas"); //canvas auxiliar que no se muestra en pantalla
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;

    const offContexto = off.getContext("2d");
    offContexto.drawImage(img, 0, 0);

    const width = off.width;
    const height = off.height;
    const imageData = offContexto.getImageData(0, 0, width, height);
    const data = imageData.data;

    //Recorre la imagen con el doble ciclo
    for (let y = 0; y < height; y++){
      for (let x = 0; x < width; x++){
        const i = (x + y * width) * 4; //indice del pixel en el arreglo de datos

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (nivel === 1){
          //Nivel 1: blanco y negro (luminancia BT.601)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        } else if (nivel === 2){
          //Nivel 2: brillo +30%
          data[i] = Math.min(255, r * 1.3);
          data[i + 1] = Math.min(255, g * 1.3);
          data[i + 2] = Math.min(255, b * 1.3);
        } else {
          //Nivel 3: negativo
          data[i] = 255 - r;
          data[i + 1] = 255 - g;
          data[i + 2] = 255 - b;
        }
        //El alfa no se modifica.
      }
    }
    offContexto.putImageData(imageData, 0, 0);

    return off; //devuelve el canvas ya filtrado
  }

  /* INTERACCION: GIRO DE FRAGMENTOS CON EL MOUSE */
  canvas.addEventListener("click", (evento) => girarPorClick(evento, -90)); //el boton izquierdo gira a la izquierda
  canvas.addEventListener("contextmenu", (evento) => { //el boton derecho gira a la derecha
    evento.preventDefault(); //evita que aparezca el menu contextual
    girarPorClick(evento, 90);
  });

  //SETUP DEL NIVEL: reparte los angulos aleatorios y dibuja
  function iniciarNivel(){
    angulos = [];
    for (let i = 0; i < cols * rows; i++){
      const opciones = [90, 180, 270]; //solo estos valores para que ninguna pieza arranque ya resuelta
      angulos.push(opciones[Math.floor(Math.random() * opciones.length)]);
    }
    dibujarTablero();
  }

  //DIBUJO DEL TABLERO COMPLETO
  function dibujarTablero(){
    contexto.clearRect(0, 0, canvas.width, canvas.height); //limpia lo anterior antes de redibujar

    for (let fila = 0; fila < rows; fila++){
      for (let col = 0; col < cols; col++){
        let i = fila * cols + col;
        dibujarFragmento(col, fila, angulos[i]);
      }
    }
  }

  //DIBUJA LA IMAGEN COMPLETA CON SUS COLORES NORMALES (SIN FRAGMENTOS NI FILTRO)
  function dibujarImagenCompleta(){
    //La imagen ya tiene la proporcion del tablero, asi que se muestra entera
    //(y a color) simplemente dibujandola completa.
    canvas.width = imagen.naturalWidth;
    canvas.height = imagen.naturalHeight;
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  }

  //DIBUJO DE UN FRAGMENTO ROTADO
  function dibujarFragmento(col, fila, angulo){
    const dx = col * celdaW; //posicion de la celda dentro del tablero
    const dy = fila * celdaH;

    contexto.save();
    contexto.beginPath();
    contexto.rect(dx, dy, celdaW, celdaH); //la celda hace de ventana para que el fragmento no invada a los vecinos
    contexto.clip();

    //se mueve al centro del fragmento y rota tomando como eje ese centro
    contexto.translate(dx + celdaW / 2, dy + celdaH / 2);
    contexto.rotate(angulo * Math.PI / 180);

    contexto.drawImage(
      fuente,
      dx, dy, celdaW, celdaH,                 //recorte de la fuente filtrada
      -celdaW / 2, -celdaH / 2, celdaW, celdaH //lo dibuja centrado en el origen
    );
    contexto.restore();
  }

  //UBICA EL FRAGMENTO CLICKEADO A PARTIR DE UNA POSICION EN PIXELES
  function obtenerIndiceFragmento(x, y){
    let col = Math.floor(x / celdaW); //se convierte la posicion horizontal en columna
    let fila = Math.floor(y / celdaH); //se convierte la posicion vertical en fila

    if (col < 0 || col >= cols || fila < 0 || fila >= rows) return -1; //se devuelve -1 si el click fue fuera del tablero

    return fila * cols + col; //indice del fragmento dentro del arreglo angulos
  }

  //GIRA UN FRAGMENTO SEGUN EL BOTON CLICKEADO
  function girarPorClick(evento, giro){
    if (terminado) return; //si el nivel ya se resolvio no se sigue girando

    let rect = canvas.getBoundingClientRect(); //rectangulo real del canvas en pantalla
    let x = (evento.clientX - rect.left) * (canvas.width / rect.width); //se pasa a coordenadas internas del canvas
    let y = (evento.clientY - rect.top) * (canvas.height / rect.height);

    let i = obtenerIndiceFragmento(x, y);
    if (i === -1) return; //si el click fue fuera del tablero no se hace nada

    angulos[i] = (angulos[i] + giro + 360) % 360; //se normaliza el angulo entre 0 y 359
    dibujarTablero(); //se redibuja el tablero con el nuevo angulo

    if (existeVictoria()) ganarNivel(); //se gana al armar la imagen completa
  }

  /* TEMPORIZADOR */

  //Corta la actualizacion del reloj sin decidir el resultado
  function detenerReloj(){
    clearInterval(intervalo);
    intervalo = null;
    enCurso = false;
  }

  //INICIA EL CRONOMETRO DEL NIVEL
  function iniciarTemporizador(){
    detenerReloj(); //por si quedo un intervalo de una partida anterior
    enCurso = true;
    terminado = false;
    tiempoInicio = Date.now();

    //En el nivel con limite arranca mostrando el tiempo completo; en el resto, en cero.
    reloj.textContent = formatearTiempo(tieneLimite ? TIEMPO_LIMITE_MS : 0);
    intervalo = setInterval(actualizarTemporizador, 100); //se actualiza cada 100ms
  }

  //ACTUALIZA EL TEXTO DEL RELOJ (ascendente o descendente segun el nivel)
  function actualizarTemporizador(){
    const transcurrido = Date.now() - tiempoInicio;

    if (tieneLimite){
      const restante = TIEMPO_LIMITE_MS - transcurrido;
      if (restante <= 0){ //se agoto el tiempo: se pierde el nivel
        reloj.textContent = formatearTiempo(0);
        perderNivel();
        return;
      }
      reloj.textContent = formatearTiempo(restante);
      reloj.classList.toggle("peligro", restante <= 5000); //aviso visual en los ultimos 5s
    } else {
      reloj.textContent = formatearTiempo(transcurrido);
    }
  }

  //FORMATEA MILISEGUNDOS COMO mm:ss.d (ej: 01:23.4)
  function formatearTiempo(ms){
    let decimas = Math.floor(ms / 100) % 10;
    let segundos = Math.floor(ms / 1000) % 60;
    let minutos = Math.floor(ms / 60000);
    return (minutos < 10 ? "0" + minutos : minutos) + ":" +
           (segundos < 10 ? "0" + segundos : segundos) + "." + decimas;
  }

  /* RESULTADO DEL NIVEL */

  //GANA EL NIVEL: se dibuja la imagen completa y se muestran resultado + botones
  function ganarNivel(){
    detenerReloj();
    terminado = true;

    const tiempoFinal = formatearTiempo(Date.now() - tiempoInicio);
    dibujarImagenCompleta();

    if (hud) hud.hidden = true;
    resultadoTituloEl.textContent = "¡Nivel completado!";
    resultadoTiempoEl.textContent = "Tiempo: " + tiempoFinal;
    resultadoTop.hidden = false;
    if (btnSiguiente) btnSiguiente.hidden = nivelActual >= 3;
    resultadoBottom.hidden = false;

    mostrarFase("juego");
  }

  //Se agoto el tiempo del nivel 3 antes de completar la imagen
  function perderNivel(){
    detenerReloj();
    terminado = true;
    reloj.classList.remove("peligro");

    dibujarImagenCompleta();

    if (hud) hud.hidden = true;
    resultadoTituloEl.textContent = "¡Se acabo el tiempo!";
    resultadoTiempoEl.textContent = "";
    resultadoTop.hidden = false;
    if (btnSiguiente) btnSiguiente.hidden = true;
    resultadoBottom.hidden = false;

    mostrarFase("juego");
  }

  //VERIFICA SI TODAS LAS PIEZAS ESTAN EN 0 GRADOS
  function existeVictoria(){
    for (let i = 0; i < angulos.length; i++){
      if (angulos[i] !== 0) return false; //si alguna pieza no esta en 0 se sigue jugando
    }
    return true;
  }

  /* BOTONES DEL RESULTADO */

  //Reintentar: mismo nivel y dificultad, pero vuelve a elegir imagen
  btnReintentar.addEventListener("click", () => {
    nivelSeleccionado = nivelActual;
    sincronizarMenu();
    irASeleccionDeImagen();
  });

  //Siguiente nivel: avanza manteniendo la dificultad
  btnSiguiente.addEventListener("click", () => {
    nivelSeleccionado = Math.min(3, nivelActual + 1);
    sincronizarMenu();
    irASeleccionDeImagen();
  });

  //Volver al menu principal
  btnMenu.addEventListener("click", irAlMenu);

  /* ARRANQUE: se muestra el menu con la seleccion por defecto */
  sincronizarMenu();
  mostrarFase("menu");

});
