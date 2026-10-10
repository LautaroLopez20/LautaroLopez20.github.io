/* =========================================================================
 * practica.js
 *
 * Agregado a la bitacora de estudio, sobre estudio.js:
 *   1. Tags html/css/js en los puntos de detalle de las paginas y de los
 *      requisitos. Cada tag salta al visor de esa misma pagina y resalta
 *      la linea real.
 *   2. "Donde tocar": tabla sintoma -> archivo:linea -> que cambiar.
 *   3. Retos ejecutables sobre el codigo real (4 de JS y 2 de CSS puro).
 *   4. Test de 24 preguntas (16 multiple choice + 8 de escribir codigo).
 *
 * El test NO revela la respuesta correcta. Al corregir dice solo bien o
 * mal; la explicacion y el enlace al archivo quedan detras de un boton
 * "Ver por que", que hay que apretar a proposito.
 * ========================================================================= */
(function () {
    'use strict';

    var ES = window.ES;
    var A = window.AYUDA_LAB || {};
    var el = ES.el, esc = ES.esc, $$ = ES.$$;

    var FUENTES = ES.fuentes;
    var CLAVE = 'estudio.practica.v1';

    function fuente(a) { return String(FUENTES[a] || '').replace(/\r\n?/g, '\n'); }
    function lineasDe(a) { return fuente(a).split('\n'); }
    function lineaDe(a, n) { return lineasDe(a)[n - 1] || ''; }
    function recorteDe(a, d, h) { return ES.recorte(fuente(a), d, h); }

    /* ------------------------------------------------------------------
     * Guardado en localStorage
     * ------------------------------------------------------------------ */
    function leer() {
        try {
            var v = JSON.parse(localStorage.getItem(CLAVE));
            return v && typeof v === 'object' ? v : {};
        } catch (e) { return {}; }
    }
    function guardar(o) {
        try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) { /* modo privado */ }
    }

    /* ------------------------------------------------------------------
     * 1. Tags html / css / js
     *
     * Se escriben en el HTML como atributo:
     *   data-tags="js/main.js:5,v-home-hero|css/home.css:285|Index.html:72"
     * Cada capa es "archivo:linea" y, separada por coma, el id del visor al
     * que hay que saltar. El lenguaje del tag sale de la extension, asi que
     * no hace falta escribirlo (las rutas llevan "/" y el separador ":"
     * queda libre para la linea).
     * ------------------------------------------------------------------ */
    function lenguajeDe(archivo) {
        return archivo.indexOf('.css') > -1 ? 'css'
            : archivo.indexOf('.js') > -1 ? 'js'
                : 'html';
    }

    function pintarTags() {
        $$('[data-tags]').forEach(function (host) {
            if (host.getAttribute('data-tags-hecho')) return;
            host.setAttribute('data-tags-hecho', '1');

            var capas = host.getAttribute('data-tags').split('|');
            var cont = el('span', 'tags');

            capas.forEach(function (capa) {
                var p = capa.trim();
                if (!p) return;

                var coma = p.indexOf(',');
                var archivo = (coma === -1 ? p : p.slice(0, coma)).trim();
                var visor = coma === -1 ? '' : p.slice(coma + 1).trim();
                var linea = Number((archivo.split(':')[1] || 1));
                archivo = archivo.split(':')[0];

                if (!archivo || FUENTES[archivo] == null) return;

                cont.insertAdjacentHTML('beforeend', tag(lenguajeDe(archivo), archivo, linea, visor));
            });

            if (cont.childNodes.length) host.appendChild(cont);
        });
    }

    /* Tags sueltos para los lugares donde se arman con JS (tabla, retos). */
    function tag(lang, archivo, linea, visor) {
        var l = lang || lenguajeDe(archivo);
        return '<button type="button" class="tagc tagc--' + l + '" data-ir="' + esc(archivo) +
            '" data-linea="' + (linea || 1) + '"' + (visor ? ' data-visor-id="' + esc(visor) + '"' : '') +
            ' title="' + esc(l.toUpperCase() + ' \u00b7 ' + archivo + ':' + (linea || 1) +
            ' \u2014 ver en el codigo') + '">' +
            esc(l) + '</button>';
    }

    /* ------------------------------------------------------------------
     * 2. "Donde tocar"
     * ------------------------------------------------------------------ */
    var DONDE = [
        ['El hero rota muy rapido', 'js/main.js', 5, null,
            'El numero es el intervalo del <code>setInterval</code> de <code>restartTimer()</code>, en ms.'],
        ['Quiero ver mas juegos destacados', 'js/main.js', 4, null,
            'El hero arma <code>HERO_SLIDES + 4</code> nodos, asi que el numero tiene que ser par para que las copias queden parejas.'],
        ['El loading dura poco o mucho', 'js/main.js', 7, null,
            '<code>LOADING_DURATION_MS</code> es el tiempo total y <code>LOADING_INTERVAL_MS</code> cada cuanto sube la barra. El primero define el ancho en px: <code>(i * 100) / (dur / int)</code>.'],
        ['La barra de carga no llega a 100', 'js/main.js', 8, null,
            'El <code>step</code> del bucle. Si no divides bien la duracion por el intervalo, el ultimo salto se pasa de 100 y queda en 110.'],
        ['El boton de comentario tarda en volver', 'js/main.js', 13, null,
            '<code>COMMENT_RESET_MS</code>. Tiene que ser mayor que la duracion de <code>sacudida</code> (500ms) o el boton se corta a mitad de la animacion.'],
        ['Las cards se ven mas anchas', 'css/home.css', 213, 'v-pag-home-css',
            'El <code>width</code> de <code>.game</code> y el <code>gap</code> del <code>display:flex</code> de <code>.categoryGames</code>.'],
        ['La ultima card de la pagina queda cortada', 'js/main.js', 631, 'v-home-car',
            '<code>cardStep = offsetWidth + 4</code>. Ese +4 son los margenes de <code>.game</code>: si los cambias en el CSS, el <code>+4</code> queda desfasado y el <code>scroll-snap</code> pelea con el <code>scrollTo</code>.'],
        ['El footer se ve gigante en pantallas chicas', 'css/footer.css', 130, null,
            'No es un <code>@media</code>: son los <code>clamp(piso, calc(base - (ref - 100vw) * k), techo)</code>. Bajando <b>k</b> la curva baja mas rapido; bajando <b>ref</b> la curva arranca antes.'],
        ['El titulo del footer se encoge antes de tiempo', 'css/footer.css', 158, null,
            'El <code>ref</code> de ese <code>clamp</code> es 1380, no 1920 como el resto. El angulo (<b>k</b>) y el piso (17px) estan elegidos porque 1380 es el ancho mas justo que deja el footer en una fila.'],
        ['El corte mobile/desktop esta mal puesto', 'css/home.css', 357, null,
            'El proyecto usa siempre <code>max-width: 780px</code> para mobile. El footer ademas usa <code>min-width: 781px</code> para escritorio, asi que si movés uno tenes que mover el otro: en 780px exacto gana la rama mobile.'],
        ['El menu hamburguesa se rompe en escritorio', 'css/navbar.css', 384, null,
            'Misma regla: <code>max-width: 780px</code>. Ademas esta el <code>display:none</code> de <code>.navLinks</code> en el mismo bloque.'],
        ['Quiero cambiar el color de los botones', 'css/atoms.css', 27, null,
            '<code>.btnPrimary</code>: <code>background-color</code> y <code>border-color</code>. El color de marca es el <code>#B8461D</code>.'],
        ['Sacarle la animacion a un elemento', 'css/pegSolitaire.css', 380, null,
            '<code>@keyframes barridoEnviar</code> + el <code>animation</code> que la llama. Si borras los keyframes y no el <code>animation</code>, el <code>animationend</code> nunca dispara y el boton se queda en el estado final.'],
        ['Cambiar el hover con zoom de las cards', 'css/home.css', 287, null,
            'Es el <code>::before</code> y el <code>::after</code> de <code>.heroGame:hover</code>: el <code>::before</code> hace el <code>scale</code> y el <code>::after</code> el <code>box-shadow</code> como marco.'],
        ['Los servicios de la API', 'js/main.js', 1, null,
            '<code>API_URL</code>. Si queda mal, el home no se rompe: entra el <code>.catch</code>, se queda el HTML estatico del <code>Index.html</code> y <code>wireFallbackCarousels()</code> les engancha las flechas a mano.']
    ];

    function montarDonde(host) {
        if (!host || host.getAttribute('data-listo')) return;
        host.setAttribute('data-listo', '1');

        var cuerpo = DONDE.map(function (f) {
            return '<tr>' +
                '<td>' + esc(f[0]) + '</td>' +
                '<td class="donde__ref">' + tag(f[1].indexOf('.css') > -1 ? 'css' : 'js', f[1], f[2], f[3]) +
                '<code>' + esc(f[1].split('/').pop() + ':' + f[2]) + '</code></td>' +
                '<td>' + f[4] + '</td>' +
                '</tr>';
        }).join('');

        host.innerHTML =
            '<p class="practica__intro">Si te piden "cambiale algo al sitio", casi siempre es una de estas ' +
            'filas. El tag te lleva al visor, la linea queda resaltada y abajo esta que hay que tocar ' +
            '(acordate de <b>no</b> poner la respuesta: la consigna es tuyo).</p>' +
            '<div class="tablaWrap"><table class="tabla tabla--donde"><thead><tr>' +
            '<th>Si te piden esto...</th><th>Donde</th><th>Que tocar</th>' +
            '</tr></thead><tbody>' + cuerpo + '</tbody></table></div>' +
            '<p class="muted" style="margin-top:14px">Los numeros de linea son los reales del archivo. ' +
            'Un tag te abre la <b>pestana de codigo de la pagina</b> que mas se le acerca, no el archivo ' +
            'completo, asi que no tenes que buscar a mano dentro del bloque.</p>';

        pintarTags();
    }

    /* ------------------------------------------------------------------
     * 3. Retos
     *
     * Cada reto precarga el fragmento real del archivo en un textarea. Al
     * apretar "Comprobar" se inyecta lo que escribiste en un iframe con el
     * CSS real y se mide el resultado. El veredicto no dice cual era el
     * valor correcto: dice si lo que hiciste funciona.
     * ------------------------------------------------------------------ */
    function pie() {
        var col = ['Sobre Nosotros', 'Informacion', 'Agradecimientos', 'Cuenta'].map(function (t) {
            return '<div class="footerColumn"><h4 class="footerHeading">' + t + '</h4>' +
                '<ul class="footerList"><li><a href="#">Contacto</a></li>' +
                '<li><a href="#">Terminos de Uso</a></li></ul></div>';
        }).join('');
        return '<footer><div class="footerTop"><div class="footerColumns">' + col + '</div>' +
            '<div class="footerLanguages">' +
            ['mx', 'jp', 'us', 'uk'].map(function (p) {
                return '<img class="footerFlag" src="../img/flag-' + p + '.svg" alt="">';
            }).join('') + '</div></div>' +
            '<div class="footerBottom"><span class="footerCopyright">(c) Copyright 2026 FastGames.com</span>' +
            '</div></footer>';
    }

    /* Reemplaza en el CSS real las lineas que el usuario toco. */
    function inyectar(css, marcas, mio) {
        var lineas = css.split('\n');
        var k = 0, encontradas = 0;
        for (var i = 0; i < lineas.length; i++) {
            for (var j = 0; j < marcas.length; j++) {
                if (lineas[i].indexOf(marcas[j]) > -1) {
                    encontradas++;
                    if (k < mio.length) lineas[i] = mio[k++];
                    break;
                }
            }
        }
        return { css: lineas.join('\n'), encontradas: encontradas, usadas: k, pedidas: marcas.length };
    }

    function numDe(texto, nombre) {
        var m = texto.match(new RegExp(nombre + '\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)'));
        return m ? Number(m[1]) : null;
    }

    function lineasUtiles(texto) {
        return String(texto).split('\n').map(function (l) { return l.trim(); })
            .filter(function (l) { return l.length; });
    }

    /* El editor de un reto de CSS lleva solo las lineas que hay que tocar,
       no el bloque entero. Si no, lo primero que escribe el usuario
       terminaria inyectado en la linea equivocada. */
    function editorDe(r) {
        var bloque = recorteDe(r.archivo, r.desde, r.hasta);
        if (!r.marcas || !r.marcas.length) return bloque;

        var lineas = bloque.split('\n');
        var out = [];
        r.marcas.forEach(function (marca) {
            for (var i = 0; i < lineas.length; i++) {
                if (lineas[i].indexOf(marca) > -1) {
                    out.push(lineas[i].trim());
                    return;
                }
            }
        });
        return out.join('\n');
    }

    var RETOS = [
        {
            id: 'hero',
            titulo: 'Ralentizar el carrusel del hero',
            archivo: 'js/main.js', desde: 5, hasta: 5,
            consigna: 'El hero rota cada 4 segundos y en el parcial se nota corto. Hacé que tarde <b>8 ' +
                'segundos</b> entre slide y slide. El editor tiene solo la constante.',
            preview: false,
            pista: 'Es una <code>const</code> de la cabecera del archivo, entre las de los precios.',
            explica: 'El hero usa <code>setInterval(restartTimer, HERO_INTERVAL_MS)</code>. Subirla a 8000 ' +
                'hace que cada slide dure el doble. Si el parcial te pide "ralentizar el carrusel", esta es ' +
                'exactamente la l&iacute;nea: no hace falta tocar ning&uacute;n <code>@keyframes</code>.',
            medir: function (txt) {
                var v = numDe(txt, 'HERO_INTERVAL_MS');
                if (v == null) return { ok: false, msg: 'No encuentro HERO_INTERVAL_MS en lo que escribiste.' };
                return { ok: v === 8000, msg: 'Con tu cambio el hero pasa de slide cada <b>' + v +
                    ' ms</b>. Antes eran 4000 ms.', valor: v };
            }
        },
        {
            id: 'loading',
            titulo: 'Acortar el loading',
            archivo: 'js/main.js', desde: 7, hasta: 8,
            consigna: 'El loading dura 5 segundos por requisito, pero para probar el resto del sitio se ' +
                'hace eterno. Bajalo a <b>2 segundos</b>. Opcional: si querés que la barra suba en pasos ' +
                'ms_chicos, ajustá también <code>LOADING_INTERVAL_MS</code>.',
            preview: false,
            pista: 'Son dos constantes juntas: la del tiempo total y la del paso. La primera manda.',
            explica: '<code>LOADING_DURATION_MS</code> es el <code>setTimeout</code> que saca el overlay, y ' +
                '<code>LOADING_INTERVAL_MS</code> cada cuanto sube la barra. Con 2000 y 25 quedarian 80 pasos ' +
                'de 1,25 px en vez de 100 pasos de 1 px: la barra se ve mas fina pero el total es el que ' +
                'manda. Ojo con el c&aacute;lculo <code>(i * 100) / (dur / int)</code>: si no divids bien, ' +
                'el &uacute;ltimo salto se pasa de 100.',
            medir: function (txt) {
                var v = numDe(txt, 'LOADING_DURATION_MS');
                if (v == null) return { ok: false, msg: 'No encuentro LOADING_DURATION_MS.' };
                var paso = numDe(txt, 'LOADING_INTERVAL_MS');
                var extra = paso != null && paso !== 50 ? ' y la barra avanza cada <b>' + paso +
                    ' ms</b> (con eso serian ' + Math.round(v / paso) + ' pasos)' : '';
                return { ok: v === 2000, msg: 'El overlay dura <b>' + v + ' ms</b> con tu cambio' + extra + '.' };
            }
        },
        {
            id: 'cards',
            titulo: 'Cards por pagina',
            archivo: 'js/main.js', desde: 3, hasta: 3,
            consigna: 'Hoy se muestran 7 juegos por pagina. Poné <b>4</b>. Ojo: el carrusel no lee ' +
                'una lista, lee esta constante.',
            preview: true,
            pista: 'El carrusel nunca mira el HTML: lee esa constante y dibuja el doble de cards.',
            explica: '<code>buildCategories()</code> mete <code>GAMES_PER_PAGE * 2</code> cards en el DOM ' +
                'porque <code>selectGames()</code> deja el doble para que el scroll pueda correr hacia los ' +
                'costados. Cambiar la constante cambia las dos cosas a la vez. Con 4 quedarian 8 nodos y 4 ' +
                'visibles por pagina.',
            medir: function (txt, f) {
                if (!f) return { ok: false, msg: 'No se pudo medir.' };
                var doc = f.contentDocument;
                var total = doc.querySelectorAll('.categoryGames .game').length;
                var vp = doc.querySelector('.categoryGames');
                var card = vp && vp.querySelector('.game');
                var step = card ? card.offsetWidth + 4 : 0;
                var visibles = step ? Math.max(1, Math.round(vp.clientWidth / step)) : 0;
                return {
                    ok: total === 8,
                    msg: 'Tu version pone <b>' + (total / 2) + ' juegos</b> por pagina (y ' + total +
                        ' nodos en el DOM, que es el doble para que el carrusel pueda dar la vuelta). ' +
                        'A este ancho entran ' + visibles + ' a la vista.'
                };
            }
        },
        {
            id: 'comentario',
            titulo: 'Confirmacion del comentario mas larga',
            archivo: 'js/main.js', desde: 13, hasta: 13,
            consigna: 'Cuando mandas un comentario, el sobre verde dura <b>2,5 segundos</b> antes de ' +
                'volver al estado normal. Subilo a <b>2500 ms</b>.',
            preview: false,
            pista: 'Es la &uacute;ltima de las constantes de tiempos del archivo.',
            explica: 'Es el <code>setTimeout</code> del <code>initCommentSubmit()</code>: lo que dura el ' +
                'estado de confirmaci&oacute;n antes de volver al bot&oacute;n normal. Si lo subís a 2500, ' +
                'el sobre verde queda un segundo y medio m&aacute;s a la vista. Si lo bajás mucho, el boton ' +
                'se corta a mitad de la sacudida.',
            medir: function (txt) {
                var v = numDe(txt, 'COMMENT_RESET_MS');
                if (v == null) return { ok: false, msg: 'No encuentro COMMENT_RESET_MS.' };
                var vanim = v >= 500;
                return {
                    ok: v === 2500,
                    msg: 'La confirmacion dura <b>' + v + ' ms</b>' +
                        (vanim ? ', o sea alcanza a terminar la sacudida de 500 ms' :
                            ', o sea <b>corta</b>: la sacudida dura 500 ms y se va a ver el sobre a medio camino')
                };
            }
        },
        {
            id: 'footerBreak',
            titulo: 'Corte del footer en 900px (CSS puro)',
            archivo: 'css/footer.css', desde: 127, hasta: 176,
            consigna: 'El footer apila las columnas cuando la pantalla baja de 780px. Pasá ese corte a ' +
                '<b>900px</b>. Ojo: hay dos <code>@media</code> y van al tope y al pie del bloque, uno ' +
                'para escritorio y otro para mobile.',
            preview: true,
            previewAncho: 850,
            previewAlto: '420px',
            marcas: ['@media (min-width: 781px)', '@media (max-width: 780px)'],
            pista: 'Hay dos <code>@media</code> y son las dos lineas del editor. Fijate que la de mobile usa <code>max-width</code>.',
            explica: 'El proyecto usa un solo corte: <code>max-width: 780px</code> para mobile y ' +
                '<code>min-width: 781px</code> para escritorio. Los dos n&uacute;meros van juntos por el +1: ' +
                'si los dejaras iguales, el px entre medio no tendr&iacute;a reglas y el footer se veria ' +
                'salteando. El escenario est&aacute; a 850px, que hoy cae del lado escritorio.',
            medir: function (txt, f) {
                if (!f) return { ok: false, msg: 'No se pudo medir.' };
                var mio = lineasUtiles(txt);
                if (mio.length < 2) return { ok: false, msg: 'Necesito las dos lineas de <code>@media</code>.' };
                var win = f.contentWindow, doc = f.contentDocument;
                var top = doc.querySelector('.footerTop');
                var dir = top ? win.getComputedStyle(top).flexDirection : '?';
                var ancho = f.getBoundingClientRect().width || win.innerWidth;
                return {
                    ok: dir === 'column',
                    msg: 'Con tu CSS, a <b>' + Math.round(ancho) + 'px</b> el <code>.footerTop</code> queda en ' +
                        '<code>flex-direction: ' + dir + '</code>. Para que las columnas se apilen tiene que ' +
                        'ser <code>column</code>.',
                    detalle: true
                };
            }
        },
        {
            id: 'footerTitulo',
            titulo: 'El titulo del footer, mas tarde (CSS puro)',
            archivo: 'css/footer.css', desde: 158, hasta: 158,
            consigna: 'El <code>font-size</code> del <code>.footerHeading</code> arranca a encogerse cuando ' +
                'la pantalla baja de <b>1380px</b> y toca el piso de 17px en 1130px. Hacé que siga en 22px ' +
                'hasta los <b>1250px</b>. Hay dos perillas en el <code>clamp</code> y las dos andan.',
            preview: true,
            previewAncho: 1250,
            previewAlto: '420px',
            marcas: ['font-size: clamp(17px'],
            pista: 'El <code>clamp</code> tiene tres numeros: el piso, la f&oacute;rmula y el techo. Adem&aacute;s del <code>k</code> est&aacute; el n&uacute;mero de referencia entre par&eacute;ntesis.',
            explica: 'La curva es <code>22px - (ref - ancho) * k</code>, con piso en 17 y techo en 22. Hoy ' +
                '<code>ref</code> es 1380, as&iacute; que el t&iacute;tulo arranca a encogerse apenas la ' +
                'pantalla baja de 1380 y toca 17px en 1130. Hay dos perillas: bajar <code>k</code> achica la ' +
                'pendiente y llegar&iacute;a al piso antes, pero la curva seguir&iacute;a arrancando en 1380; ' +
                'bajar <code>ref</code> corre el arranque. Si hac&eacute;s las dos cosas, el t&iacute;tulo se ' +
                'queda en 22 por m&aacute;s rato del que quer&iacute;as.',
            medir: function (txt, f) {
                if (!f) return { ok: false, msg: 'No se pudo medir.' };
                var mio = lineasUtiles(txt);
                if (!mio.length) return { ok: false, msg: 'El editor quedo vacio.' };
                var win = f.contentWindow, doc = f.contentDocument;
                var h = doc.querySelector('.footerHeading');
                if (!h) return { ok: false, msg: 'No encontre el titulo en el escenario.' };
                var px = parseFloat(win.getComputedStyle(h).fontSize);
                return {
                    ok: px > 21.99,
                    msg: 'A <b>1250px</b> tu titulo mide <b>' + px.toFixed(2) + 'px</b>. Si todavia baja de ' +
                        '22px, la curva sigue empezando a encogerse antes de 1250.',
                    detalle: true
                };
            }
        }
    ];

    function montarRetos(host) {
        if (!host || host.getAttribute('data-listo')) return;
        host.setAttribute('data-listo', '1');

        var estado = leer().retos || {};

        host.innerHTML = '<div class="retos">' + RETOS.map(function (r, n) {
            var echo = estado[r.id] || {};
            return '<article class="reto" id="reto-' + r.id + '">' +
                '<header class="reto__cab">' +
                '<span class="reto__n">' + (n + 1) + '</span>' +
                '<h3>' + esc(r.titulo) + '</h3>' +
                '<span class="reto__ref">' + tag(r.archivo.indexOf('.css') > -1 ? 'css' : 'js',
                    r.archivo, r.desde, null) + '<code>' + esc(r.archivo.split('/').pop()) + ':' + r.desde +
                (r.hasta !== r.desde ? '-' + r.hasta : '') + '</code></span>' +
                '</header>' +
                '<p class="reto__consigna">' + r.consigna + '</p>' +
                '<div class="reto__editor">' +
                '<textarea class="codFuente reto__area" spellcheck="false" aria-label="Editor del reto ' +
                (n + 1) + '">' + esc(editorDe(r)) + '</textarea>' +
                '<div class="reto__pie">' +
                '<button type="button" class="btn btn--primario btn--chico" data-reto-aplicar="' + r.id + '">Comprobar</button>' +
                '<button type="button" class="btn btn--chico" data-reto-reset="' + r.id + '">Devolver el original</button>' +
                '<span class="reto__estado" data-reto-estado="' + r.id + '"></span>' +
                '</div>' +
                '<div class="reto__escenario" data-reto-marco="' + r.id + '"></div>' +
                '<div class="reto__veredicto" data-reto-veredicto="' + r.id + '" hidden></div>' +
                '</div></article>';
        }).join('') + '</div>';

        $$('[data-reto-aplicar]', host).forEach(function (b) {
            b.addEventListener('click', function () { aplicarReto(b.getAttribute('data-reto-aplicar'), host); });
        });
        $$('[data-reto-reset]', host).forEach(function (b) {
            b.addEventListener('click', function () {
                var id = b.getAttribute('data-reto-reset');
                var r = retoPorId(id);
                ES.$('textarea', ES.$('#reto-' + id, host)).value = editorDe(r);
                var v = ES.$('[data-reto-veredicto="' + id + '"]', host);
                v.hidden = true; v.innerHTML = '';
                var est = ES.$('[data-reto-estado="' + id + '"]', host);
                est.textContent = '';
                est.className = 'reto__estado';
                ES.$('[data-reto-marco="' + id + '"]', host).innerHTML = '';
                borrarEstado('retos', id);
            });
        });

        pintarTags();
    }

    function retoPorId(id) {
        for (var i = 0; i < RETOS.length; i++) if (RETOS[i].id === id) return RETOS[i];
        return null;
    }

    function aplicarReto(id, host) {
        var r = retoPorId(id);
        if (!r) return;

        var txt = ES.$('textarea', $('#reto-' + id, host)).value;
        var marcoHost = ES.$('[data-reto-marco="' + id + '"]', host);
        var veredicto = ES.$('[data-reto-veredicto="' + id + '"]', host);
        var estadoEl = ES.$('[data-reto-estado="' + id + '"]', host);

        function mostrar(res) {
            veredicto.hidden = false;
            veredicto.className = 'reto__veredicto reto__veredicto--' + (res.ok ? 'ok' : 'mal');
            veredicto.innerHTML =
                '<p class="reto__marca">' + (res.ok ? '&#10003; bien' : '&#10007; mal') + '</p>' +
                '<p class="reto__msg">' + res.msg + '</p>' +
                '<button type="button" class="btn btn--chico reto__exp" data-explicar="' + r.id + '">Ver por qu&eacute;</button>' +
                '<div class="reto__expBody" hidden>' +
                '<p>' + r.explica + '</p>' +
                '<p class="muted">Pista: ' + r.pista + '</p>' +
                '</div>';
            estadoEl.textContent = res.ok ? 'bien' : 'mal';
            estadoEl.className = 'reto__estado reto__estado--' + (res.ok ? 'ok' : 'mal');

            var b = ES.$('[data-explicar="' + r.id + '"]', veredicto);
            var cuerpo = ES.$('.reto__expBody', veredicto);
            b.addEventListener('click', function () {
                cuerpo.hidden = !cuerpo.hidden;
                b.textContent = cuerpo.hidden ? 'Ver por qu\u00e9' : 'Ocultar';
            });

            guardarEstado('retos', id, { ok: res.ok, texto: txt });
        }

        /* Los retos de CSS van dentro de un iframe con el pie real. */
        if (r.preview && r.archivo.indexOf('.css') > -1) {
            var marcas = r.marcas || [];
            var mio = lineasUtiles(txt);
            if (mio.length < marcas.length) {
                mostrar({ ok: false, msg: 'Necesito ' + marcas.length + ' linea(s) en el editor.' });
                return;
            }
            var r2 = inyectar(fuente(r.archivo), marcas, mio);
            if (r2.encontradas !== marcas.length) {
                mostrar({ ok: false, msg: 'No pude ubicar la linea en el CSS real. Copiala tal cual estaba.' });
                return;
            }
            marcoHost.innerHTML = '';
            ES.crearIframe(marcoHost, {
                titulo: r.titulo,
                srcdoc: ES.docDeIframe(pie(), r2.css, 'body{margin:0;padding:0}'),
                ancho: r.previewAncho + 'px',
                alto: r.previewAlto
            }).then(function (f) { mostrar(r.medir(txt, f)); });
            estadoEl.textContent = 'midiendo...';
            return;
        }

        /* El reto de las cards corre el carrusel real sobre el fixture. */
        if (r.preview) {
            var v = numDe(txt, 'GAMES_PER_PAGE');
            if (v == null) { mostrar({ ok: false, msg: 'No encuentro GAMES_PER_PAGE.' }); return; }
            var fn = (A.bloque ? A.bloque('initCategoryCarousel') : '');
            var cards = '';
            var fuenteJuegos = (A.fixture || function () { return []; })();
            for (var i = 0; i < v * 2; i++) {
                var j = fuenteJuegos[i % Math.max(1, fuenteJuegos.length)];
                cards += '<a class="game"><p>' + esc(j ? j.name : 'Juego') + '</p></a>';
            }
            var extra = 'body{padding:10px 0}@media (min-width:780px){.categoryGames{width:calc(100% - 70px);' +
                'margin:0 35px;height:112px}.game{width:168px;height:108px}}';
            marcoHost.innerHTML = '';
            ES.crearIframe(marcoHost, {
                titulo: r.titulo,
                srcdoc: ES.docDeIframe(
                    '<div class="categories"><article class="category" id="cat-accion">' +
                    '<p class="categoryName">Accion</p><div class="categoryCarousel">' +
                    '<button class="carouselArrow carouselArrowLeft" type="button">&#8249;</button>' +
                    '<div class="categoryGames">' + cards + '</div>' +
                    '<button class="carouselArrow carouselArrowRight" type="button">&#8250;</button>' +
                    '</div><div class="categoryNavigation"></div></article></div>',
                    ES.cssDe(['css/home.css']), extra),
                ancho: '900px', alto: '260px'
            }).then(function (f) {
                if (fn) ES.correrEnFrame(f, fn);
                if (A.pintarTarjetas) A.pintarTarjetas(f.contentDocument, '.game');
                mostrar(r.medir(txt, f));
            });
            estadoEl.textContent = 'midiendo...';
            return;
        }

        mostrar(r.medir(txt, null));
    }

    /* ------------------------------------------------------------------
     * 4. Test
     * ------------------------------------------------------------------ */
    var PREGUNTAS = [
        /* ---- 16 multiple choice ---- */
        { t: 'm', p: 'El <code>loadingOverlay</code> arranca en 0% y termina en 100%. &iquest;De d&oacute;nde sale ese porcentaje?',
          o: ['Del porcentaje de archivos que se descargaron', 'De un temporizador propio, independiente de la red',
              'De la API, que devuelve el progreso', 'De <code>DOMContentLoaded</code>'],
          r: 1, f: 'js/main.js', l: 7,
          e: 'El requisito dice 5 segundos fijos, asi que el avance es una division de tiempo y no del fetch: <code>i * 100 / (dur / int)</code>.' },

        { t: 'm', p: 'La API tarda 8 segundos y el loading dura 5. &iquest;Qu&eacute; ve el usuario a los 5 segundos?',
          o: ['El overlay sigue arriba hasta que responda la API', 'El home del HTML estatico, con las flechas ya enganchadas',
              'Una pantalla de error', 'El hero rotando sobre el overlay'],
          r: 1, f: 'js/main.js', l: 74,
          e: 'El <code>setTimeout</code> del overlay es independiente del <code>fetch</code>. A los 5s se va el overlay y, si la API todavia no respondio, sigue el HTML estatico del <code>Index.html</code>.' },

        { t: 'm', p: 'El footer tiene <code>@media (min-width: 781px)</code> y <code>@media (max-width: 780px)</code>. A 780px exactos, &iquest;cu&aacute;l gana?',
          o: ['La de escritorio', 'La mobile', 'Las dos', 'Ninguna: 780px es un hueco'],
          r: 1, f: 'css/footer.css', l: 176,
          e: '<code>max-width: 780px</code> incluye al 780. Por eso el escritorio arranca en 781 y no en 780: si los dos cortes coincidieran habria un px sin reglas.' },

        { t: 'm', p: '<code>buildHero()</code> mete <code>HERO_SLIDES + 4</code> nodos en el track. &iquest;Para qu&eacute; los 4 extra?',
          o: ['Para mostrar 4 juegos m&aacute;s', 'Para que se vean las copias al rotar hacia los costados',
              'Para que el slider tenga m&aacute;s controles', 'Paracompensar los que no carga la API'],
          r: 1, f: 'js/main.js', l: 379,
          e: 'Dos copias antes y dos despues. Cuando llega al extremo, el <code>goToSlide()</code> salta al slide real equivalente y el <code>restartTimer()</code> hides el salto. Las copias llevan <code>aria-hidden</code> y pierden el href.' },

        { t: 'm', p: 'Las copias del hero se marcan <code>aria-hidden="true"</code> y pierden el href. &iquest;Para qu&eacute;?',
          o: ['Para que el lector de pantalla no las anuncie dos veces y el teclado no las tome',
              'Para que el CSS las pueda ocultar', 'Para que no consuman ancho en el track',
              'Para que el enunciado las cuente como un juego menos'],
          r: 0, f: 'js/main.js', l: 387,
          e: 'Son decorativas: si quedaran como enlaces, el teclado las recorreria y quedaria un enlace sin destino.' },

        { t: 'm', p: 'En <code>computeLayout()</code>, <code>cardStep = firstCard.offsetWidth + 4</code>. Si cambi&aacute;s el margen de <code>.game</code> a 8px y no toc&aacute;s el JS:',
          o: ['No pasa nada, el <code>+4</code> es decorativo',
              'El salto queda desfasado contra el <code>scroll-snap</code> y la &uacute;ltima card de la p&aacute;gina se corta',
              'Se duplican las cards', 'El <code>scrollTo</code> deja de funcionar'],
          r: 1, f: 'js/main.js', l: 631,
          e: 'Ese <code>+4</code> son los 2px de margen de cada lado de <code>.game</code>. Si el margen cambia, el <code>pageStep</code> ya no cae en el borde de una card y el <code>scroll-snap</code> pelea con el <code>scrollTo</code>.' },

        { t: 'm', p: '&iquest;Qu&eacute; evento hace que el bot&oacute;n de comentario vuelva a su estado normal?',
          o: ['<code>transitionend</code>', '<code>click</code>', '<code>animationend</code>, filtrado por <code>animationName</code>',
              'Un <code>setInterval</code> de 1200ms'],
          r: 2, f: 'js/main.js', l: 236,
          e: 'El handler escucha <code>animationend</code> sobre <code>e.target</code> y reci&eacute;n despues de la animaci&oacute;n, pero igual mira <code>animationName !== "barridoEnviar"</code> para no cortar antes.' },

        { t: 'm', p: '<code>COMMENT_RESET_MS</code> es 1200. &iquest;Por qu&eacute; no 300?',
          o: ['Porque el enunciado lo pide', 'Porque si no, el boton se corta a mitad de la animaci&oacute;n',
              'Porque el fetch tarda', 'Para que se vea el sobre antes de volver'],
          r: 1, f: 'js/main.js', l: 13,
          e: 'La sacudida (<code>sacudida</code>) dura 500ms. Con 300 el reset se dispara con la animaci&oacute;n todavia corriendo y el boton se corta a la mitad.' },

        { t: 'm', p: '<code>agregarComentario()</code> arma el cuerpo con <code>textContent</code>. &iquest;Qu&eacute; pasar&iacute;a si usara <code>innerHTML</code>?',
          o: ['Que el comentario se veria sin formato', 'Que el usuario podr&iacute;a escribir HTML en el sitio',
              'Que no se contaran los likes', 'Que el orden de la fecha se rompa'],
          r: 1, f: 'js/main.js', l: 276,
          e: '<code>textContent</code> siempre escribe texto. Con <code>innerHTML</code>, lo que escribe el visitante se ejecuta como HTML.' },

        { t: 'm', p: 'Si la API no responde, el home igual muestra cards. &iquest;De d&oacute;nde salen?',
          o: ['De un array hardcodeado dentro de <code>main.js</code>',
              'De los <code>&lt;a class="game"&gt;</code> que ya estaban en el <code>Index.html</code>, y despues <code>wireFallbackCarousels()</code> les engancha las flechas',
              'De <code>localStorage</code>', 'De la API de respaldo del enunciado'],
          r: 1, f: 'js/main.js', l: 692,
          e: 'Por eso el HTML estatico trae cards: son el fallback. <code>wireFallbackCarousels()</code> existe justamente para que las flechas funcionen aunque nunca haya respuesta.' },

        { t: 'm', p: '<code>marcarPremium()</code> le pone la corona a 1 o 4 cards de cada bloque. &iquest;Por qu&eacute;?',
          o: ['Porque la API marca el juego gratis en un campo que el enunciado no menciona',
              'Porque la corona se ve linda', 'Para que los juegos pagos queden juntos',
              'Porque el enunciado pide 4 juegos pagos'],
          r: 0, f: 'js/main.js', l: 561,
          e: 'Es una simulaci&oacute;n: la API no trae el dato de pago, as&iacute; que se sortea con <code>Math.random()</code> para que se vea el caso de uso.' },

        { t: 'm', p: 'El requisito de los "tres hovers". &iquest;Cu&aacute;l de estos NO cuenta?',
          o: ['El de la card del juego (<code>.game:hover::before</code>)',
              'El de la card de categor&iacute;a', 'El del bot&oacute;n de comentario',
              'El del men&uacute; hamburguesa (<code>.hamburgerMenu:hover</code>)'],
          r: 3, f: 'css/home.css', l: 287,
          e: 'Los tres del requisito son el juego, la categor&iacute;a y comentar. El del men&uacute; es funcional, va con el burger y no es "un detalle que hover" del enunciado.' },

        { t: 'm', p: '<code>clamp(12px, calc(13px - (1920px - 100vw) * 0.00192), 13px)</code>. &iquest;Qu&eacute; vale a 1000px de ancho?',
          o: ['12px, el piso del clamp', '13px', '11.23px', '12.9px'],
          r: 0, f: 'css/footer.css', l: 147,
          e: 'La f&oacute;rmula da 13 - 920 * 0.00192 = 11.23px, que queda por debajo del piso, as&iacute; que el <code>clamp</code> devuelve 12px. El piso es justamente para que nunca quede ilegible.' },

        { t: 'm', p: 'El captcha no est&aacute; en el array <code>CAMPOS</code> de <code>register.js</code>. &iquest;Por qu&eacute;?',
          o: ['Porque es una imagen y no un input', 'Porque es un checkbox y no un input de texto, y su error cuelga del <code>.field</code>',
              'Porque se valida en el backend', 'Porque el enunciado lo pide as&iacute;'],
          r: 1, f: 'js/register.js', l: 22,
          e: '<code>CAMPOS</code> solo guarda los inputs con <code>id</code>, <code>placeholder</code> y <code>type</code> de texto. El checkbox va aparte.' },

        { t: 'm', p: 'Los listeners de <code>input</code> se registran en <code>initRegister()</code> y no dentro del click de "Finalizar". &iquest;Por qu&eacute;?',
          o: ['Porque <code>input</code> no existe todavia en ese momento',
              'Si se sumaran en el click, el segundo click duplicaria listeners y los avisos aparecerian dos veces',
              'Para que el captcha se reinicie', 'Por rendimiento, que es muy lento'],
          r: 1, f: 'js/register.js', l: 13,
          e: 'Van en el <code>init</code> porque se registran una sola vez, cuando se arma la p&aacute;gina: el <code>CAMPOS.forEach</code> de la L13 y el <code>addEventListener("input")</code> de la L16. Si estuvieran dentro del click, cada click sumar&iacute;a un listener nuevo.' },

        { t: 'm', p: '&iquest;Qu&eacute; conviene para mostrar las p&aacute;ginas completas del carrusel?',
          o: ['<code>grid-template-columns: repeat(4, 1fr)</code>',
              '<code>scroll-snap-type</code> en el contenedor + <code>pageStep</code> como m&uacute;ltiplo de <code>cardStep</code>',
              'Un <code>@media</code> por cada cantidad de cards', 'Paginaci&oacute;n con botones <code>1 2 3</code>'],
          r: 1, f: 'css/home.css', l: 173,
          e: 'El viewport es fluido con <code>scroll-snap</code>, y el <code>scrollTo</code> del JS cae en el mismo borde que el snap del CSS porque <code>pageStep</code> es un m&uacute;ltiplo exacto de <code>cardStep</code>. Con <code>1fr</code> habr&iacute;a que recalcular el ancho.' },

        /* ---- 8 de escribir codigo ---- */
        { t: 'c', p: 'Escrib&iacute; el nombre de la constante que define cada cu&aacute;nto (en ms) rota el carrusel del hero.',
          v: ['HERO_INTERVAL_MS', /HERO[_ ]?INTERVAL[_ ]?MS/i], f: 'js/main.js', l: 5,
          e: 'El <code>setInterval</code> de <code>restartTimer()</code> la usa como delay.' },

        { t: 'c', p: 'Escrib&iacute; el ancho en px a partir del cual el footer usa la versi&oacute;n de escritorio (la del <code>min-width</code>). Solo el n&uacute;mero.',
          v: ['781', /^781(px)?$/i], f: 'css/footer.css', l: 127,
          e: 'Es 781 y no 780 porque la rama mobile usa <code>max-width: 780px</code>: en 780 exacto todavia manda mobile y no queda ning&uacute;n px sin reglas.' },

        { t: 'c', p: 'Escrib&iacute; el nombre de la animaci&oacute;n CSS que el <code>animationend</code> tiene que ignorar para no cortar el bot&oacute;n de comentario antes de tiempo.',
          v: ['barridoEnviar', /^barrido_?enviar$/i], f: 'css/pegSolitaire.css', l: 380,
          e: 'El filtro es <code>e.animationName !== "barridoEnviar"</code>: todas las dem&aacute;s animaciones del bot&oacute;n pueden cortar el reset, esa no.' },

        { t: 'c', p: 'Escrib&iacute; el selector CSS del input de b&uacute;squeda que se ve en escritorio (el que se oculta en mobile).',
          v: ['.searchPlaceholderDesktop', /^\.?searchplaceholderdesktop$/i], f: 'Index.html', l: 42,
          e: 'El <code>navbar.css</code> lo pone en <code>display:none</code> dentro del <code>max-width: 780px</code> y muestra el bot&oacute;n de la lupa.' },

        { t: 'c', p: 'Cuando un campo del registro no pasa la validaci&oacute;n, &iquest;qu&eacute; clase se le agrega al <code>&lt;input&gt;</code>?',
          v: ['error', /^error$/i], f: 'css/register.css', l: 56,
          e: 'Es lo que activa <code>.inputPill.error</code>, que le dibuja el borde naranja. El aviso de abajo va aparte, en <code>.inputError</code>.' },

        { t: 'c', p: 'Escrib&iacute; el nombre de la funci&oacute;n que arma todo el carrusel del hero (slides, copias, puntos y listeners).',
          v: ['buildHero', /^build_?hero$/i], f: 'js/main.js', l: 350,
          e: '<code>buildHero()</code> es la que mete los <code>HERO_SLIDES + 4</code> nodos y despues llama a <code>restartTimer()</code>.' },

        { t: 'c', p: 'Escrib&iacute; el prefijo del <code>id</code> que se le agrega en runtime a cada <code>&lt;article class="category"&gt;</code> generado por JS (no esta en el HTML).',
          v: ['cat-', /^cat[-_]/i], f: 'js/main.js', l: 504,
          e: 'Se arma con el slug de la categor&iacute;a: <code>"cat-" + slug</code>. Sirve para que el <code>scrollIntoView</code> y los dots puedan apuntar a una categor&iacute;a puntual.' },

        { t: 'c', p: 'Escrib&iacute; el n&uacute;mero de milisegundos que dura el loading del home seg&uacute;n el requisito (5 segundos). Solo el n&uacute;mero.',
          v: ['5000', /^5000(ms)?$/i], f: 'js/main.js', l: 7,
          e: 'Es <code>LOADING_DURATION_MS = 5000</code>. El requisito lo pide fijo, no seg&uacute;n la velocidad de la red.' }
    ];

    function mezclar(arr, semilla) {
        var a = arr.slice();
        var s = semilla || Date.now();
        function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(rnd() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function bien(esperado, escrito) {
        if (escrito == null) return false;
        var t = String(escrito).replace(/\r/g, '').trim();
        if (!t) return false;
        for (var i = 0; i < esperado.length; i++) {
            if (esperado[i] instanceof RegExp) {
                if (esperado[i].test(t.replace(/\s+/g, ''))) return true;
            } else if (t.toLowerCase() === String(esperado[i]).toLowerCase()) return true;
        }
        return false;
    }

    function montarTest(host) {
        if (!host || host.getAttribute('data-listo')) return;
        host.setAttribute('data-listo', '1');

        var guardado = leer();
        var orden = guardado.orden || mezclar(PREGUNTAS.map(function (_, i) { return i; }));
        var resp = guardado.resp || {};
        var hecho = guardado.hecho || false;

        host.innerHTML =
            '<p class="practica__intro">24 preguntas: 16 para marcar y 8 para escribir. Al corregir sabr&eacute;s ' +
            'si est&aacute; bien o mal, nada m&aacute;s: la explicaci&oacute;n y el enlace al c&oacute;digo ' +
            'est&aacute;n detr&aacute;s de <b>Ver por qu&eacute;</b>, para que no te las comas sin pensar.</p>' +
            '<div class="test__barra">' +
            '<span class="test__puntaje" data-test-puntaje>' + (hecho ? puntaje() : 'sin corregir') + '</span>' +
            '<span class="test__spacer"></span>' +
            '<button type="button" class="btn btn--primario btn--chico" data-test-corregir>Corregir</button>' +
            '<button type="button" class="btn btn--chico" data-test-mezclar>Mezclar de nuevo</button>' +
            '<button type="button" class="btn btn--chico" data-test-reintentar>Reintentar</button>' +
            '<button type="button" class="btn btn--chico" data-test-borrar>Borrar progreso</button>' +
            '</div>' +
            '<div class="test__lista" data-test-lista></div>';

        var lista = ES.$('[data-test-lista]', host);
        var etPuntaje = ES.$('[data-test-puntaje]', host);

        function pintar() {
            lista.innerHTML = orden.map(function (idx, pos) {
                var q = PREGUNTAS[idx];
                var val = resp[idx];
                var marca = '';
                if (hecho) {
                    var ok = q.t === 'm' ? val === q.r : bien(q.v, val);
                    marca = '<span class="test__marca test__marca--' + (ok ? 'ok' : 'mal') + '">' +
                        (ok ? '&#10003; bien' : '&#10007; mal') + '</span>';
                }
                var cuerpo;
                if (q.t === 'm') {
                    cuerpo = '<div class="test__opc">' + q.o.map(function (o, i) {
                        return '<label class="test__opt"><input type="radio" name="p' + pos + '" value="' + i + '"' +
                            (String(val) === String(i) ? ' checked' : '') + (hecho ? ' disabled' : '') + '>' +
                            '<span>' + o + '</span></label>';
                    }).join('') + '</div>';
                } else {
                    cuerpo = '<textarea class="codFuente test__area" spellcheck="false" data-test-codigo="' + pos +
                        '" placeholder="escribí acá..."' + (hecho ? ' disabled' : '') + '>' + esc(val || '') + '</textarea>';
                }
                return '<article class="test__item' + (hecho ? ' test__item--hecho' : '') + '" data-preg="' + pos + '">' +
                    '<header class="test__cab"><span class="test__n">' + (pos + 1) + '</span>' +
                    '<span class="test__tipo">' + (q.t === 'm' ? 'opción' : 'código') + '</span>' + marca + '</header>' +
                    '<p class="test__p">' + q.p + '</p>' + cuerpo +
                    '<button type="button" class="btn btn--chico test__exp" data-test-exp="' + pos + '"' +
                    (hecho ? '' : ' hidden') + '>Ver por qu&eacute;</button>' +
                    '<div class="test__expBody" hidden><p>' + q.e + '</p>' +
                    '<p class="muted">' + esc(q.f + ':' + q.l) + ' ' +
                    '<button type="button" class="tagc tagc--' + (q.f.indexOf('.css') > -1 ? 'css' :
                        q.f.indexOf('.js') > -1 ? 'js' : 'html') + '" data-ir="' + esc(q.f) + '" data-linea="' + q.l + '">' +
                    (q.f.indexOf('.css') > -1 ? 'css' : q.f.indexOf('.js') > -1 ? 'js' : 'html') + '</button></p></div>' +
                    '</article>';
            }).join('');
        }

        function recolectar(marcar) {
            $$('[data-test-codigo]', lista).forEach(function (t) {
                var pos = Number(t.getAttribute('data-test-codigo'));
                resp[orden[pos]] = t.value;
            });
            $$('.test__item', lista).forEach(function (it) {
                var pos = Number(it.getAttribute('data-preg'));
                var sel = it.querySelector('input[type="radio"]:checked');
                if (sel) resp[orden[pos]] = Number(sel.value);
            });
            /* Escribir no corrige: solo guarda. El "hecho" lo pone el boton. */
            if (marcar) hecho = true;
            guardar({ orden: orden, resp: resp, hecho: hecho });
        }

        function puntaje() {
            var n = 0;
            orden.forEach(function (idx) {
                var q = PREGUNTAS[idx];
                if (q.t === 'm') { if (resp[idx] === q.r) n++; }
                else if (bien(q.v, resp[idx])) n++;
            });
            return n + ' / ' + PREGUNTAS.length;
        }

        function corregir() {
            recolectar(true);
            pintar();
            etPuntaje.textContent = puntaje();
        }

        pintar();

        lista.addEventListener('change', function () { recolectar(); });
        lista.addEventListener('input', function () { recolectar(); });

        $$('[data-test-exp]', host).forEach(function (b) {
            b.addEventListener('click', function () {
                var cuerpo = ES.$('.test__expBody', b.parentNode);
                cuerpo.hidden = !cuerpo.hidden;
                b.textContent = cuerpo.hidden ? 'Ver por qu\u00e9' : 'Ocultar';
            });
        });

        ES.$('[data-test-corregir]', host).addEventListener('click', corregir);

        ES.$('[data-test-mezclar]', host).addEventListener('click', function () {
            recolectar();
            orden = mezclar(orden);
            hecho = false;
            guardar({ orden: orden, resp: resp, hecho: false });
            pintar();
            etPuntaje.textContent = 'sin corregir';
        });

        ES.$('[data-test-reintentar]', host).addEventListener('click', function () {
            hecho = false;
            guardar({ orden: orden, resp: resp, hecho: false });
            pintar();
            etPuntaje.textContent = 'sin corregir';
        });

        ES.$('[data-test-borrar]', host).addEventListener('click', function () {
            resp = {}; orden = mezclar(PREGUNTAS.map(function (_, i) { return i; })); hecho = false;
            guardar({ orden: orden, resp: resp, hecho: false });
            pintar();
            etPuntaje.textContent = 'sin corregir';
            ES.aviso('Progreso borrado.', 'ok');
        });
    }

    /* ------------------------------------------------------------------
     * Estado de los retos
     * ------------------------------------------------------------------ */
    function guardarEstado(grupo, id, valor) {
        var t = leer();
        t[grupo] = t[grupo] || {};
        t[grupo][id] = valor;
        guardar(t);
    }
    function borrarEstado(grupo, id) {
        var t = leer();
        if (t[grupo]) { delete t[grupo][id]; guardar(t); }
    }

    /* ------------------------------------------------------------------
     * Montaje
     * ------------------------------------------------------------------ */
    function iniciarPractica(nodo) {
        if (!nodo || nodo.getAttribute('data-listo')) return;
        pintarTags();
        montarDonde(ES.$('#dondeTocar', nodo));
        montarRetos(ES.$('#retos', nodo));
        montarTest(ES.$('#testPractica', nodo));
    }

    window.iniciarPractica = iniciarPractica;

    /* Se dejan a mano los datos puros y los comparadores. Sirve para
       verificarlos desde la consola (o con un script) sin abrir la pagina. */
    window.PRACTICA = {
        RETOS: RETOS,
        PREGUNTAS: PREGUNTAS,
        DONDE: DONDE,
        bien: bien,
        mezclar: mezclar,
        inyectar: inyectar,
        editorDe: editorDe,
        numDe: numDe,
        lineasUtiles: lineasUtiles,
        pie: pie
    };

    /* Los tags de las paginas y de los requisitos estan en el HTML de antes
       de este script, as&iacute; que se pueden pintar sin esperar al DOMContentLoaded. */
    pintarTags();
})();