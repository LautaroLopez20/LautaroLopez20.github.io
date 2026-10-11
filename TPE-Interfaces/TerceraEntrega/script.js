document.addEventListener("DOMContentLoaded", () => { //event listener para todo el documento para que se ejecute cuando el DOM esté completamente cargado
  // 1. Banco de Imágenes de Prueba (URLs de ejemplo)
  const imageBank = [ //arreglo de imágenes de prueba para el juego
    "https://picsum.photos/id/1015/500/500",
    "https://picsum.photos/id/1018/500/500",
    "https://picsum.photos/id/1025/500/500",
    "https://picsum.photos/id/1069/500/500",
    "https://picsum.photos/id/1073/500/500",
    "https://picsum.photos/id/1084/500/500",
    "https://picsum.photos/id/1074/500/500",
    "https://picsum.photos/id/1080/500/500",
    "https://picsum.photos/id/1043/500/500",
    "https://picsum.photos/id/1035/500/500",
    "https://picsum.photos/id/237/500/500",
    "https://picsum.photos/id/433/500/500"
  ];

  // |IMAGENES ALEATORIAS| //

  // Cantidad de imágenes a mostrar en la galería principal
  const IMAGENES_VISIBLES = 6;

  // Mostrar imágenes aleatorias en la galería
  const gallery = document.getElementById("image-gallery"); //definimos "gallery" como el contenedor de la galería de imágenes en el HTML
  
  let i = 0;
  const elegidas = []; // URLs de las imágenes que ya se mostraron

  while ( i < IMAGENES_VISIBLES) {
    const indice = Math.floor(Math.random() * imageBank.length);
    const url = imageBank[indice]; //URL de la imagen seleccionada en base al indice del banco

    if (!elegidas.includes(url)) { //si la imagen todavía no fue elegida
      elegidas.push(url); //la anotamos para no repetirla

      const img = document.createElement("img"); //acá se crea un elemento de imagen para cada imagen que se va a mostrar en la galería
      img.src = url; //asignar la URL de la imagen seleccionada
      img.className = "game-image";
      gallery.appendChild(img); //agregamos la imagen al contenedor de la galería
      i++;
    }
    //Sinó se puede hacer mezclar el arreglo de imágenes y hacer un slice de las primeras 6 imágenes ya que de por si el banco no las repite.
  }


  // |ELECCION DE IMAGEN DE JUEGO| //

  const imagenes = document.querySelectorAll("#image-gallery img");
  const btnStart = document.getElementById("btn-start");

  let imagenElegida = null;

  btnStart.addEventListener("click", () => {
  btnStart.disabled = true; // asi no se toca dos veces

    let imagenActiva = null;

    //RULETA
    const intervalo = setInterval(() => { 
      if (imagenActiva) { //verifico asi despues no estan todas iluminadas
        imagenActiva.classList.remove("seleccionado");
      } 

    const azar = Math.floor(Math.random() * imagenes.length);
    imagenActiva = imagenes[azar];
    imagenActiva.classList.add("seleccionado"); //Defino como activa
    }, 400);

    setTimeout(() => {
      clearInterval(intervalo); //corto ruleta

      if (imagenActiva){
        imagenActiva.classList.remove("seleccionado");
      }

      const azarFinal = Math.floor(Math.random() * imagenes.length);
      imagenElegida = imagenes[azarFinal];
      imagenElegida.classList.add("elegida");

      sessionStorage.setItem("imagenElegida", imagenElegida.src); //Lo guardo para el juego

      setTimeout(() => {
        window.location.href = "play.html"; //asi se redirige a la página de juego
      }, 2000); //tiempo para mostrar la imagen elegida
    },2600); //duración de la ruleta

  });

});
