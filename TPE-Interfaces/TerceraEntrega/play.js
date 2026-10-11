const urlImagen = sessionStorage.getItem("imagenElegida"); //recupero la imagen elegida de la sesión

const canvas = document.getElementById("imagen-juego");
const contexto = canvas.getContext("2d"); //esto me da los metodos para dibujar en el canvas (.drawImage, .fillRect, etc)

const imagen = new Image();
imagen.crossOrigin = "anonymous"; //esto es para que no de error de CORS al usar la imagen en el canvas

imagen.onload = () => { //primero la imagen carga y luego se dibuja en el canvas, sino no se dibuja nada
  canvas.width = imagen.naturalWidth;
  canvas.height = imagen.naturalHeight;

  contexto.drawImage(
    imagen,
    0,
    0,
    canvas.width,
    canvas.height
  );

  filtroByN(); 
};

imagen.src = urlImagen;

//FILTRO BLANCO Y NEGRO
function filtroByN(){
    let width = canvas.width;
    let height = canvas.height;

    let imageData = contexto.getImageData(0, 0, width, height);
    let data = imageData.data;

    //Recorro la imagen con el doble ciclo
    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            let i = (x + y * width) * 4; // Calcular el índice del píxel en el array de datos (su posición)

            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Aplico el filtro en base a el BT.601
            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
            //El alfa no lo modifico ya que no hace falta si solo cambio los colores a gris
        }
    }
    contexto.putImageData(imageData, 0, 0);
};