/*
 * Estudio de FastGames: laboratorios.
 *
 * Cada laboratorio corre el codigo REAL del sitio (extraido de las fuentes
 * embebidas) dentro de un iframe, para que puedas editarlo y ver el efecto sin
 * romper nada. El iframe tambien aisla los ids y las clases, asi que nada de lo
 * que toques aca toca el sitio.
 */
(function () {
    'use strict';

    var ES = window.ES;
    if (!ES) { console.error('estudio.js tiene que cargarse antes que labs.js'); return; }

    var el = ES.el, esc = ES.esc;

    /* ---------------------------------------------------------------
     * Datos de mentira con la forma de la API
     * ------------------------------------------------------------- */

    var NOMBRES_GENERO = {
        1: 'Action', 2: 'Shooter', 3: 'Family', 4: 'Adventure', 5: 'RPG', 6: 'MOBA',
        7: 'Puzzle', 10: 'Strategy', 11: 'Sports', 15: 'Shooter', 59: 'Battle Royale', 83: 'Indie'
    };

    var CRUCIS = [
        ['Dragon Ball Z: Peg Solitaire', 4.6, '2006-05-11', [10, 5]],
        ['Roblox', 4.4, '2006-08-01', [11, 1]],
        ['Super Mario 64', 4.5, '1996-06-23', [1, 11]],
        ['Plants vs. Zombies', 4.3, '2009-05-05', [10, 3, 83]],
        ['Bomb Pong', 4.1, '2018-03-01', [3, 59]],
        ['Beastro', 4.0, '2022-02-10', [3, 83]],
        ['Rumble Club', 3.9, '2019-06-12', [1, 11, 59]],
        ['Machinarium', 4.2, '2009-10-10', [83, 7]],
        ['Navy Moves', 3.8, '2007-02-20', [3, 10]],
        ['Minecraft', 4.5, '2011-11-18', [83, 7, 10]],
        ['Mario Party', 4.4, '1998-12-18', [11, 1]],
        ['Pictonico', 4.0, '2013-02-14', [83, 7]],
        ['LEGO Marvel Super Heroes', 4.1, '2013-11-15', [1, 11]],
        ['Stick Fight', 4.0, '2015-12-01', [1, 2, 11]],
        ['Zombie Rumble', 3.7, '2012-09-20', [2, 59]],
        ['Agar.io', 4.0, '2015-04-21', [3, 59]],
        ['Minesweeper', 4.3, '1989-01-01', [7, 83]],
        ['Grand Theft Auto: San Andreas', 4.5, '2004-10-26', [4, 1, 15]],
        ['Brawlhalla', 4.1, '2014-07-07', [1, 15, 6, 11]],
        ['Fortnite', 4.0, '2017-09-26', [4, 15, 11]],
        ['Cuphead', 4.5, '2017-09-29', [7, 83]],
        ['Counter-Strike', 4.3, '2000-09-25', [2, 15]],
        ['DOOM', 4.4, '1993-10-10', [2, 83]],
        ['The Elder Scrolls V: Skyrim', 4.6, '2011-11-11', [5, 83]],
        ["Baldur's Gate 3", 4.7, '2023-08-03', [5, 7]],
        ['Age of Empires II', 4.4, '1999-09-30', [10]],
        ['Civilization VI', 4.4, '2016-10-21', [10, 3]],
        ['League of Legends', 4.4, '2009-10-27', [6, 10]],
        ['Dota 2', 4.3, '2013-07-09', [6, 10]],
        ['Grand Theft Auto V', 4.6, '2013-09-17', [4, 1, 15]]
    ];

    function fixture() {
        return CRUCIS.map(function (f, i) {
            return {
                id: i + 1,
                name: f[0],
                rating: f[1],
                released: f[2],
                genres: f[3].map(function (g) { return { id: g, name: NOMBRES_GENERO[g] || ('Genero ' + g) }; })
            };
        });
    }

    var GRADIENTES = [
        'linear-gradient(135deg,#8E44AD,#2980B9)', 'linear-gradient(135deg,#E67E22,#F1C40F)',
        'linear-gradient(135deg,#16A085,#2ECC71)', 'linear-gradient(135deg,#C0392B,#E74C3C)',
        'linear-gradient(135deg,#2980B9,#1ABC9C)', 'linear-gradient(135deg,#7F8C8D,#B2BEC3)',
        'linear-gradient(135deg,#D35400,#E67E22)', 'linear-gradient(135deg,#27AE60,#F39C12)',
        'linear-gradient(135deg,#8E44AD,#E91E63)', 'linear-gradient(135deg,#34495E,#2C3E50)',
        'linear-gradient(135deg,#F39C12,#E74C3C)', 'linear-gradient(135deg,#1ABC9C,#2980B9)',
        'linear-gradient(135deg,#9B59B6,#3498DB)', 'linear-gradient(135deg,#2C3E50,#4A69BD)'
    ];

    function pintarTarjetas(raiz, selector) {
        Array.prototype.slice.call(raiz.querySelectorAll(selector)).forEach(function (n, i) {
            n.style.background = GRADIENTES[i % GRADIENTES.length];
        });
    }

    /* ---------------------------------------------------------------
     * Chassis de los laboratorios
     * ------------------------------------------------------------- */

    function Controles(host) {
        this.host = el('div', 'lab__controles');
        this.datos = {};
        this.oyente = [];
        host.appendChild(this.host);
    }

    Controles.prototype._campo = function (etiqueta, nodo) {
        var campo = el('div', 'lab__campo');
        var etq = el('label', 'lab__etq');
        etq.setAttribute('for', nodo.id);
        etq.textContent = etiqueta;
        var caja = el('div', 'lab__caja');
        caja.appendChild(nodo);
        campo.appendChild(etq);
        campo.appendChild(caja);
        this.host.appendChild(campo);
        return caja;
    };

    Controles.prototype._enlazar = function (nodo, id, leer, sufijo, caja) {
        var self = this;
        nodo.addEventListener('input', function () {
            self.datos[id] = leer(nodo);
            var salida = caja.querySelector('.lab__valor');
            if (salida) salida.textContent = self.datos[id] + (sufijo || '');
            self.disparar();
        });
    };

    Controles.prototype.rango = function (cfg) {
        var n = el('input', 'lab__rango');
        n.type = 'range';
        n.id = cfg.id;
        n.min = cfg.min; n.max = cfg.max; n.step = cfg.step || 1; n.value = cfg.defecto;
        this.datos[cfg.id] = cfg.defecto;
        var caja = this._campo(cfg.etiqueta, n);
        var v = el('output', 'lab__valor', cfg.defecto + (cfg.sufijo || ''));
        caja.appendChild(v);
        this._enlazar(n, cfg.id, function (x) { return Number(x.value); }, cfg.sufijo, caja);
        return n;
    };

    Controles.prototype.color = function (cfg) {
        var n = el('input', 'lab__color');
        n.type = 'color';
        n.id = cfg.id;
        n.value = cfg.defecto;
        this.datos[cfg.id] = cfg.defecto;
        var caja = this._campo(cfg.etiqueta, n);
        this._enlazar(n, cfg.id, function (x) { return x.value; }, '', caja);
        return n;
    };

    Controles.prototype.numero = function (cfg) {
        var n = el('input', 'lab__numero');
        n.type = 'number';
        n.id = cfg.id;
        n.min = cfg.min; n.max = cfg.max; n.step = cfg.step || 1; n.value = cfg.defecto;
        this.datos[cfg.id] = cfg.defecto;
        var caja = this._campo(cfg.etiqueta, n);
        this._enlazar(n, cfg.id, function (x) { return Number(x.value); }, cfg.sufijo, caja);
        return n;
    };

    Controles.prototype.area = function (cfg) {
        var n = el('textarea', 'lab__area lab__area--chica');
        n.id = cfg.id;
        n.spellcheck = false;
        n.value = cfg.defecto || '';
        this.datos[cfg.id] = n.value;
        var campo = el('div', 'lab__campo lab__campo--ancho');
        var etq = el('label', 'lab__etq');
        etq.setAttribute('for', n.id);
        etq.textContent = cfg.etiqueta || '';
        campo.appendChild(etq);
        campo.appendChild(n);
        this.host.appendChild(campo);
        var self = this;
        n.addEventListener('input', function () { self.datos[n.id] = n.value; self.disparar(); });
        return n;
    };

    Controles.prototype.boton = function (etiqueta, fn, clase) {
        var b = el('button', 'btnLab' + (clase ? ' ' + clase : ''), etiqueta);
        b.type = 'button';
        b.addEventListener('click', fn);
        this.host.appendChild(b);
        return b;
    };

    Controles.prototype.get = function (id) { return this.datos[id]; };

    Controles.prototype.alCambiar = function (fn) { this.oyente.push(fn); };
    Controles.prototype.disparar = function () { this.oyente.forEach(function (f) { f(); }); };

    function armarLab(host, cfg) {
        cfg = cfg || {};
        var wrap = el('div', 'lab');
        host.appendChild(wrap);

        var controles = new Controles(wrap);
        var escenario = el('div', 'lab__escenario');
        wrap.appendChild(escenario);
        var marcoHost = el('div', 'lab__marcoHost');
        escenario.appendChild(marcoHost);

        var det = el('details', 'lab__detalles');
        var sum = el('summary', 'lab__sumario', cfg.tituloEditor || 'Ver / editar el codigo real que corre aca');
        det.appendChild(sum);
        var pista = el('p', 'lab__pista');
        pista.innerHTML = cfg.pistaEditor || '';
        det.appendChild(pista);
        var area = el('textarea', 'lab__area');
        area.spellcheck = false;
        det.appendChild(area);
        var edPie = el('div', 'lab__editorPie');
        var btnAplicar = el('button', 'btnLab', 'Aplicar');
        btnAplicar.type = 'button';
        var btnReset = el('button', 'btnLab btnLab--fantasma', 'Restablecer');
        btnReset.type = 'button';
        edPie.appendChild(btnAplicar);
        edPie.appendChild(btnReset);
        det.appendChild(edPie);
        wrap.appendChild(det);

        var error = el('div', 'lab__error');
        error.hidden = true;
        wrap.appendChild(error);

        var salida = el('div', 'lab__salida');
        wrap.appendChild(salida);

        var marco = null;
        var listeners = [];

        btnAplicar.addEventListener('click', function () {
            listeners.forEach(function (f) { f(area.value); });
        });
        btnReset.addEventListener('click', function () {
            if (cfg.reset) {
                host.innerHTML = '';
                cfg.reset(host);
            }
        });

        return {
            root: wrap,
            controles: controles,
            escenario: escenario,
            marcoHost: marcoHost,
            area: area,
            salida: salida,
            alAplicar: function (fn) { listeners.push(fn); },
            mostrarError: function (txt) { error.hidden = !txt; error.textContent = txt || ''; },
            ponerSalida: function (h) { salida.innerHTML = h || ''; },
            areaDefecto: function (t) { area.value = t; },
            getMarcos: function () { return marco; },
            setMarcos: function (f) { marco = f; },
            montar: function (o) {
                return ES.crearIframe(marcoHost, {
                    titulo: cfg.titulo || 'Laboratorio',
                    srcdoc: ES.docDeIframe(o.html, o.css, o.extra),
                    ancho: o.ancho || '100%',
                    alto: o.alto || '340px'
                }).then(function (f) { marco = f; return f; });
            }
        };
    }

    function tabla(filas, cabecera) {
        return '<div class="tablaWrap"><table class="tabla"><thead><tr>' +
            cabecera.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') +
            '</tr></thead><tbody>' +
            filas.map(function (f) {
                return '<tr>' + f.map(function (c, i) {
                    return '<td' + (i === 0 ? ' class="tabla__pri"' : '') + '>' + c + '</td>';
                }).join('') + '</tr>';
            }).join('') + '</tbody></table></div>';
    }

    function setConst(texto, nombre, valor) {
        var re = new RegExp('(const\\s+' + nombre + '\\s*=\\s*)([^;\\n]+)');
        return re.test(texto) ? texto.replace(re, '$1' + valor) : texto;
    }

    function bloque(nombre) {
        var b = ES.extraerFuncion(ES.fuentes['js/main.js'], nombre);
        return b ? b.texto : '/* no se encontro ' + nombre + ' */';
    }

    function bloqueDe(archivo, nombre) {
        var b = ES.extraerFuncion(ES.fuentes[archivo], nombre);
        return b ? b.texto : '/* no se encontro ' + nombre + ' */';
    }

    /* ===============================================================
     * 1. Loading
     * =============================================================== */

    function labLoading(host) {
        var l = armarLab(host, {
            titulo: 'Loading del home',
            tituloEditor: 'css/loading.css + el startLoading() real de js/main.js',
            pistaEditor: 'Lo que ves aca es el <code>startLoading()</code> de <code>main.js</code> y el ' +
                '<code>loading.css</code> del sitio, copiados al iframe. Editalos y dale a <b>Aplicar</b>.',
            reset: function (h) { labLoading(h); }
        });

        var relleno = new Array(6).join('Linea de relleno para que haya algo que scrollear. ');
        var html =
            '<div class="fondoDemo"><h3>Fondo de la pagina</h3>' +
            '<p>Este bloque es scrolleable a proposito. Al empezar la carga el <code>&lt;body&gt;</code> ' +
            'recibe <code>cargando</code> y <code>overflow:hidden</code> le corta el scroll.</p>' +
            '<p>' + relleno + '</p><p>' + relleno + '</p><p>' + relleno + '</p></div>' +
            '<div class="loadingOverlay" id="loadingOverlay"><div class="loadingCard">' +
            '<div class="squaresStage"><div class="square squareOrange"></div>' +
            '<div class="square squareBlue"></div><div class="square squareLight"></div></div>' +
            '<span class="progressText" id="progressText">0%</span>' +
            '<div class="progressContainer"><div class="progressBar" id="progressBar"></div></div>' +
            '</div></div>';

        var extra =
            '.fondoDemo{padding:18px 22px;font-size:14px;color:#AEB6C4;line-height:1.8}' +
            '.fondoDemo h3{margin:0 0 8px;color:#DCDEE5;font-size:16px}' +
            'body{position:relative;height:300px;overflow-y:auto}' +
            '.loadingOverlay{position:absolute;top:0;left:0;width:100%;height:300px}' +
            '.loadingCard{transform:scale(.92)}';

        var fn = bloque('startLoading');

        function script(dur, intv) {
            return [
                'const LOADING_DURATION_MS = ' + dur + ';',
                'const LOADING_INTERVAL_MS = ' + intv + ';',
                '',
                fn,
                '',
                'document.body.classList.add("cargando");',
                'startLoading();'
            ].join('\n\n');
        }

        function cssConGradiente(a, b) {
            return ES.cssDe(['css/loading.css']).replace(
                /background:\s*linear-gradient\([^;]*\);/,
                'background: linear-gradient(90deg, ' + a + ', ' + b + ');'
            );
        }

        l.controles.rango({ id: 'dur', etiqueta: 'LOADING_DURATION_MS', min: 200, max: 8000, step: 100, defecto: 5000, sufijo: ' ms' });
        l.controles.rango({ id: 'int', etiqueta: 'LOADING_INTERVAL_MS', min: 10, max: 500, step: 10, defecto: 50, sufijo: ' ms' });
        l.controles.color({ id: 'ca', etiqueta: 'Gradiente desde', defecto: '#2563eb' });
        l.controles.color({ id: 'cb', etiqueta: 'Gradiente hasta', defecto: '#3b82f6' });

        l.areaDefecto(script(5000, 50));

        var n = 0;

        function montar(texto) {
            n++;
            var dur = l.controles.get('dur'), int = l.controles.get('int');
            l.montar({
                html: html,
                css: cssConGradiente(l.controles.get('ca'), l.controles.get('cb')),
                extra: extra,
                alto: '300px'
            }).then(function (f) {
                l.setMarcos(f);
                var err = ES.correrEnFrame(f, texto);
                l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                if (err) return;
                var pasos = dur / int;
                l.ponerSalida(
                    '<div class="salsa">' +
                    '<p class="salsa__titulo">Como sale el porcentaje</p>' +
                    '<p><b>' + dur + ' ms</b> de carga avanzando cada <b>' + int + ' ms</b>: ' +
                    dur + ' / ' + int + ' = <b>' + pasos + '</b> pasos teoricos, o sea <b>' +
                    Math.ceil(pasos) + '</b> ticks del <code>setInterval</code>.</p>' +
                    '<p>El <code>%</code> sale de <code>Math.round(paso / ' + pasos + ' * 100)</code>, ' +
                    'recortado con <code>Math.min(..., 100)</code>.</p>' +
                    (int > dur
                        ? '<p class="salsa__alerta"><b>El intervalo es mas grande que la carga.</b> El primer ' +
                        'tick ya pasa de 100 y lo recorta el <code>Math.min</code>. El loading real dura ' +
                        '<b>' + int + ' ms</b>, no ' + dur + '.</p>'
                        : '') +
                    (pasos % 1 !== 0
                        ? '<p class="salsa__nota">El cociente no da entero: el ultimo tick se pasa del 100. ' +
                        'Por eso el <code>Math.min</code> hace falta y por eso a veces no se ve un 99% justo.</p>'
                        : '') +
                    '<p class="salsa__titulo">El tiempo total real</p>' +
                    '<p>Despues del 100% hay un <code>setTimeout</code> de <b>250 ms</b> para que se vea el ' +
                    '100% antes de desvanecerse, y la transinion del overlay dura <b>500ms</b>. ' +
                    'Total: <b>' + (dur + 250 + 500) + ' ms</b>.</p>' +
                    '<p class="salsa__muted">Los tres cuadrados entran con <code>animation-delay</code> ' +
                    'negativo (<code>0s</code>, <code>-1s</code>, <code>-2s</code>) sobre un keyframe de ' +
                    '<code>3s infinite</code>. El delay negativo los desfasca entre si sin necesidad de ' +
                    'cuatro animaciones distintas.</p>' +
                    '<p class="salsa__muted">Recarga numero ' + n + '.</p>' +
                    '</div>'
                );
            });
        }

        function correr() {
            var txt = setConst(setConst(l.area.value, 'LOADING_DURATION_MS', l.controles.get('dur')),
                'LOADING_INTERVAL_MS', l.controles.get('int'));
            l.area.value = txt;
            montar(txt);
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.dur !== undefined) correr();
        });
        l.controles.boton('Reiniciar la carga', function () { correr(); });
        l.alAplicar(function (txt) { montar(txt); });

        correr();
    }

    /* ===============================================================
     * 2. Hero
     * =============================================================== */

    function labHero(host) {
        var l = armarLab(host, {
            titulo: 'Hero carrusel',
            tituloEditor: 'buildHero() real de js/main.js con el CSS real de css/home.css',
            pistaEditor: 'Los sliders reescriben las constantes de arriba del script y lo vuelven a correr. ' +
                'Si editas el texto a mano, gana lo que escribas vos.',
            reset: function (h) { labHero(h); }
        });

        var html = '<div class="heroCarousel"><div class="heroCategory"><div class="heroTrack"></div></div>' +
            '<div class="heroNavigation"></div></div>';

        function script(slides, intervalo) {
            return [
                'const HERO_SLIDES = ' + slides + ';',
                'const HERO_INTERVAL_MS = ' + intervalo + ';',
                '',
                bloque('gameImage'),
                '',
                bloque('buildHero'),
                '',
                '/* Los juegos salen del fixture local del lab */',
                'buildHero(GAMES);'
            ].join('\n');
        }

        l.controles.rango({ id: 'slides', etiqueta: 'HERO_SLIDES', min: 1, max: 8, step: 1, defecto: 4 });
        l.controles.rango({ id: 'intervalo', etiqueta: 'HERO_INTERVAL_MS', min: 600, max: 8000, step: 200, defecto: 4000, sufijo: ' ms' });
        l.controles.rango({ id: 'ancho', etiqueta: 'Ancho del escenario', min: 320, max: 1240, step: 10, defecto: 760, sufijo: ' px' });

        l.areaDefecto(script(4, 4000));

        function correr() {
            var slides = l.controles.get('slides');
            var int = l.controles.get('intervalo');
            var ancho = l.controles.get('ancho');
            var txt = setConst(setConst(l.area.value, 'HERO_SLIDES', slides), 'HERO_INTERVAL_MS', int);
            l.area.value = txt;

            l.montar({
                html: html,
                css: ES.cssDe(['css/home.css']),
                extra: 'body{padding:12px 0}',
                ancho: ancho + 'px',
                alto: (ancho >= 780 ? 580 : 300) + 'px'
            }).then(function (f) {
                l.setMarcos(f);
                var err = ES.correrEnFrame(f,
                    'const GAMES = ' + JSON.stringify(fixture()) + ';\n\n' + txt);
                l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                if (err) return;
                pintarTarjetas(f.contentDocument, '.heroGame');
                var doc = f.contentDocument;
                var deck = doc.querySelectorAll('.heroGame').length;
                var copias = doc.querySelectorAll('.heroGameCopy').length;
                var dots = doc.querySelectorAll('.heroNavigation .carouselDot').length;
                var card = doc.querySelector('.heroGame');
                var anchoCard = card ? card.offsetWidth : 0;
                var margen = card ? (parseFloat(f.contentWindow.getComputedStyle(card).marginLeft) || 0) : 0;
                var paso = anchoCard + margen;

                l.ponerSalida(
                    '<div class="salsa">' +
                    '<p class="salsa__titulo">El mazo del track</p>' +
                    '<p>Con <b>' + slides + '</b> destacados el track lleva <b>' + deck + ' nodos</b>: ' +
                    slides + ' reales + <b>' + copias + ' copias</b> (2 adelante y 2 atras).</p>' +
                    '<p>Las copias son lo que hace posible el bucle infinito sin ningun <code>if</code> de ' +
                    'wraparound: cuando el indice se va del rango, <code>saltarAReal()</code> lo corrige en ' +
                    'silencio. Como son decorativas les saca el <code>href</code> y les pone ' +
                    '<code>aria-hidden="true"</code>, para que un lector de pantalla no las lea dos veces.</p>' +
                    '<p class="salsa__titulo">La medida del avance</p>' +
                    '<p>Card de <b>' + anchoCard + 'px</b> con <code>margin-left:' + margen.toFixed(0) +
                    'px</code>. El avance real entre cards es <code>width + margin-left</code> = <b>' +
                    paso.toFixed(1) + 'px</b>, no el ancho de la card: el margen negativo es justamente el ' +
                    'solapamiento. Cambia el ancho del escenario y mira como se recalcula con ' +
                    '<code>offsetWidth</code> + <code>getComputedStyle</code>.</p>' +
                    '<p class="salsa__titulo">El rebote</p>' +
                    '<p>Sale de <code>track.animate()</code> (Web Animations API) con 3 keyframes y un ' +
                    '<b>30% de sobrepasada</b> en el 55% del recorrido, en 600ms. No es una ' +
                    '<code>@keyframes</code> de CSS. Por que: hace falta <code>cancel()</code> para que un ' +
                    'click rapido no pile dos movimientos, y <code>onfinish</code> para recién ahi correr el ' +
                    'salto invisible. CSS no te da las dos cosas.</p>' +
                    '<p class="salsa__nota">' +
                    (int >= 4000 ? 'A 4s de autoplay la animacion de 600ms se lee comoda.'
                        : int >= 1500 ? 'A ' + int + 'ms el slide cambia antes de que termines de mirar el anterior.'
                            : 'A ' + int + 'ms ya no se ve el rebote: los cambios se pisan.') +
                    '</p>' +
                    '<p class="salsa__muted">Detalle fino: antes de animar, <code>buildHero</code> pone ' +
                    '<code>track.style.transition = \'none\'</code> y escribe el <code>transform</code> del ' +
                    'destino en inline. Sin eso, el transform final y la animacion se pelean y al cancelar ' +
                    'la animacion el track vuelve de golpe al slide 0.</p>' +
                    '</div>'
                );
            });
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.slides !== undefined) correr();
        });
        l.controles.boton('Reiniciar la rotacion', function () { correr(); });
        l.alAplicar(function (txt) {
            l.montar({
                html: html, css: ES.cssDe(['css/home.css']), extra: 'body{padding:12px 0}',
                ancho: l.controles.get('ancho') + 'px', alto: (l.controles.get('ancho') >= 780 ? 580 : 300) + 'px'
            }).then(function (f) {
                l.setMarcos(f);
                var err = ES.correrEnFrame(f, 'const GAMES = ' + JSON.stringify(fixture()) + ';\n\n' + txt);
                l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                if (!err) pintarTarjetas(f.contentDocument, '.heroGame');
            });
        });

        correr();
    }

    /* ===============================================================
     * 3. Carrusel de categorias: paginado
     * =============================================================== */

    function labCategorias(host) {
        var l = armarLab(host, {
            titulo: 'Carrusel de categorias: el paginado',
            tituloEditor: 'initCategoryCarousel() real de js/main.js',
            pistaEditor: 'El viewport es 100% fluido con <code>scroll-snap</code>; una "pagina" es lo que ' +
                'entra en pantalla. Este es el codigo que calcula cuantas hay.',
            reset: function (h) { labCategorias(h); }
        });

        var fn = bloque('initCategoryCarousel');

        function htmlCategorias(cantidad) {
            var cards = '';
            for (var i = 0; i < cantidad; i++) {
                cards += '<a class="game"><p>' + esc(CRUCIS[i % CRUCIS.length][0]) + '</p></a>';
            }
            var flecha = function (clase, d) {
                return '<button class="carouselArrow ' + clase + '" type="button">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none">' +
                    '<path d="M' + d + '" stroke="currentColor" stroke-width="2"/></svg></button>';
            };
            return '<div class="categories"><article class="category" id="cat-accion">' +
                '<p class="categoryName">Accion</p><div class="categoryCarousel">' +
                flecha('carouselArrowLeft', '15 6l-6 6 6 6') + '<div class="categoryGames">' + cards + '</div>' +
                flecha('carouselArrowRight', '9 6l6 6-6 6') +
                '</div><div class="categoryNavigation"></div></article></div>';
        }

        l.controles.numero({ id: 'cards', etiqueta: 'Cards en el DOM (GAMES_PER_PAGE * 2)', min: 3, max: 14, step: 1, defecto: 14 });
        l.controles.rango({ id: 'cardW', etiqueta: 'Ancho de la card', min: 60, max: 260, step: 2, defecto: 168, sufijo: ' px' });
        l.controles.rango({ id: 'ancho', etiqueta: 'Ancho del escenario', min: 320, max: 1240, step: 10, defecto: 900, sufijo: ' px' });

        l.areaDefecto(fn);

        function correr() {
            var cards = l.controles.get('cards');
            var cardW = l.controles.get('cardW');
            var ancho = l.controles.get('ancho');
            var extra = 'body{padding:10px 0}' +
                '@media (min-width:780px){.categoryGames{width:calc(100% - 70px);margin:0 35px;height:112px}' +
                '.game{width:' + cardW + 'px;height:' + Math.round(cardW * 0.643) + 'px}}';
            l.montar({
                html: htmlCategorias(cards), css: ES.cssDe(['css/home.css']),
                extra: extra, ancho: ancho + 'px', alto: '260px'
            }).then(function (f) {
                l.setMarcos(f);
                var err = ES.correrEnFrame(f, fn);
                l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                if (err) return;
                pintarTarjetas(f.contentDocument, '.game');
                var doc = f.contentDocument;
                var vp = doc.querySelector('.categoryGames');
                var first = vp.querySelector('.game');
                var total = vp.querySelectorAll('.game').length;
                var cardStep = first.offsetWidth + 4;
                var visibles = Math.max(1, Math.round(vp.clientWidth / cardStep));
                var pageCount = Math.max(1, Math.ceil(total / visibles));
                var pageStep = visibles * cardStep;
                var dots = doc.querySelectorAll('.categoryNavigation .carouselDot').length;

                l.ponerSalida(
                    tabla([
                        ['Cards en el DOM', total],
                        ['<code>cardStep = offsetWidth + 4</code>', cardStep + ' px'],
                        ['<code>clientWidth</code> del viewport', vp.clientWidth + ' px'],
                        ['<code>visibles = round(clientWidth / cardStep)</code>', visibles],
                        ['<code>pageStep = visibles * cardStep</code>', pageStep + ' px'],
                        ['<code>pageCount = ceil(total / visibles)</code>', pageCount],
                        ['Dots generados', dots],
                        ['Cards en la ultima pagina', total - (pageCount - 1) * visibles]
                    ], ['medida', 'valor']) +
                    '<div class="salsa">' +
                    '<p class="salsa__titulo">El +4 que esta cocido</p>' +
                    '<p><code>cardStep</code> suma 4 a proposito: son los 2px de margen izquierdo y los 2px ' +
                    'de derecho de <code>.game</code>. Si cambias esos margenes en el CSS sin tocar el ' +
                    '<code>+4</code> del JS, el salto del carrusel deja de caer en el borde de una card y el ' +
                    '<code>scroll-snap</code> pelea con el <code>scrollTo</code>.</p>' +
                    '<p class="salsa__titulo">Dos caminos de scroll, uno solo de estado</p>' +
                    '<p>Scrollea con el mouse: el listener de <code>scroll</code> (con ' +
                    '<code>{passive:true}</code>, que no bloquea el hilo) recalcula la pagina con ' +
                    '<code>Math.round(scrollLeft / pageStep)</code> y mueve los dots. Y las flechas hacen ' +
                    '<code>scrollTo({behavior:\'smooth\'})</code>. Los dos caminos terminan en ' +
                    '<code>updateState()</code>, asi que nunca se desincronizan.</p>' +
                    '<p>Redimensiona la ventana del navegador: el listener de <code>resize</code> vuelve a ' +
                    'correr <code>computeLayout()</code>, que ademas reconstruye los dots.</p>' +
                    '<p class="salsa__nota">' + (pageCount <= 1
                        ? 'Con este ancho entra todo en una sola pagina: <code>pageCount</code> queda en 1 y las dos flechas se deshabilitan solas.'
                        : 'Con ' + pageCount + ' paginas las flechas hacen algo.') + '</p>' +
                    '</div>'
                );
            });
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.cards !== undefined) correr();
        });
        l.alAplicar(function (txt) {
            l.montar({
                html: htmlCategorias(l.controles.get('cards')), css: ES.cssDe(['css/home.css']),
                extra: 'body{padding:10px 0}', ancho: l.controles.get('ancho') + 'px', alto: '260px'
            }).then(function (f) {
                l.setMarcos(f);
                var err = ES.correrEnFrame(f, txt);
                l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                if (!err) pintarTarjetas(f.contentDocument, '.game');
            });
        });

        correr();
    }

    /* ===============================================================
     * 4. Explorador responsive
     * =============================================================== */

    function labResponsive(host) {
        var l = armarLab(host, {
            titulo: 'Explorador responsive',
            tituloEditor: 'Que media queries estan activas',
            pistaEditor: 'El iframe usa el CSS real del sitio. Las media queries se evaluan contra el ' +
                '<b>ancho del iframe</b>, por eso el slider las dispara de verdad.',
            reset: function (h) { labResponsive(h); }
        });

        function banderaDe(p) {
            return '<img class="footerFlag" src="../img/flag-' + p + '" alt="">';
        }
        var TITULOS = ['Peg Solitaire DBZ', 'Roblox', 'Super Mario 64', 'Plants vs. Zombies', 'Bomb Pong', 'Beastro'];

        function htmlDemo() {
            var cats = '';
            ['Accion', 'Disparos', 'RPG'].forEach(function (nombre, c) {
                var cards = '';
                for (var i = 0; i < 7; i++) {
                    cards += '<a class="game"><p>' + esc(CRUCIS[(i + c * 4) % CRUCIS.length][0]) + '</p></a>';
                }
                cats += '<article class="category"><p class="categoryName">' + nombre + '</p>' +
                    '<div class="categoryCarousel">' +
                    '<button class="carouselArrow carouselArrowLeft" type="button">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none">' +
                    '<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2"/></svg></button>' +
                    '<div class="categoryGames">' + cards + '</div>' +
                    '<button class="carouselArrow carouselArrowRight" type="button">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none">' +
                    '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2"/></svg></button>' +
                    '</div><div class="categoryNavigation"></div></article>';
            });

            var subcols = [0, 1, 2].map(function () {
                return '<ul class="footerList footerSubColumn">' +
                    TITULOS.map(function (t) { return '<li><a href="#">' + t + '</a></li>'; }).join('') + '</ul>';
            }).join('');

            var cols = ['Sobre Nosotros', 'Informacion', 'Agradecimientos', 'Cuenta'].map(function (t) {
                return '<div class="footerColumn"><h4 class="footerHeading">' + t + '</h4><ul class="footerList">' +
                    '<li><a href="#">Contacto</a></li><li><a href="#">Terminos de Uso</a></li>' +
                    '<li><a href="#">FAQs</a></li><li><a href="#">Mi Cuenta</a></li></ul></div>';
            }).join('');

            return '<header><nav>' +
                '<button class="hamburguesa" type="button"><span></span><span></span><span></span></button>' +
                '<a href="#" class="logo"><img src="../img/LOGO.svg" alt="FastGames"></a>' +
                '<div class="headerSearch">' +
                '<input class="searchPlaceholderMobile" placeholder="Introduce tu busqueda...">' +
                '<input class="searchPlaceholderDesktop" placeholder="Introduce tu busqueda...">' +
                '<button type="button"><img src="../img/lupa.svg" alt=""></button></div>' +
                '<div class="navIcons"><button type="button"><img class="carrito" src="../img/Cart-Button.svg" alt=""></button>' +
                '<div class="userMenu"><button class="userButton" type="button">' +
                '<img src="../img/User-Button.svg" alt=""><span class="userStatus"></span></button>' +
                '<div class="userPanel hidden"><ul class="userPanelList">' +
                '<li><a href="#">Mis juegos</a></li><li><a href="#">Configuracion</a></li>' +
                '<li class="userPanelLogout"><a href="#">Cerrar sesion</a></li></ul></div>' +
                '</div></div></nav>' +
                '<div class="categoryPanel hidden"><ul class="categoryPanelList">' +
                '<li><a href="#">Accion</a></li><li><a href="#">Disparos</a></li><li><a href="#">RPG</a></li>' +
                '<li><a href="#">Jugar con amigos</a></li><li><a href="#">Un solo jugador</a></li>' +
                '<li><a href="#">Clasicos</a></li><li><a href="#">Estrategia</a></li>' +
                '</ul></div></header>' +
                '<div class="heroCarousel"><div class="heroCategory"><div class="heroTrack">' +
                '<div class="heroGame active"><p>Dragon Ball Z: Peg Solitaire</p></div>' +
                '<div class="heroGame"><p>Baldur\'s Gate 3</p></div>' +
                '<div class="heroGame"><p>The Elder Scrolls V: Skyrim</p></div>' +
                '</div></div><div class="heroNavigation">' +
                '<button class="carouselDot active"></button><button class="carouselDot"></button>' +
                '<button class="carouselDot"></button><button class="carouselDot"></button></div></div>' +
                '<div class="categories">' + cats + '</div>' +
                '<footer><div class="footerTop"><div class="footerColumns">' + cols +
                '<div class="footerColumn footerColumnWide">' +
                '<h4 class="footerHeading">Nuestros Titulos Destacados</h4>' +
                '<div class="footerSubColumns">' + subcols + '</div></div></div>' +
                '<div class="footerLanguages">' +
                ['mx', 'jp', 'us', 'uk', 'fr', 'it', 'br', 'es'].map(banderaDe).join('') +
                '</div></div><div class="footerBottom">' +
                '<span class="footerCopyright">(c) Copyright 2026 FastGames.com</span>' +
                '<img class="footerLogo" src="../img/LOGO_White.svg" alt="">' +
                '<div class="footerSocials"><img src="../img/icon-instagram.svg" alt="">' +
                '<img src="../img/facebook.svg" alt=""><img src="../img/icon-twitter.svg" alt="">' +
                '<img src="../img/icon-youtube.svg" alt=""></div></div></footer>';
        }

        var extra =
            'body{padding:0 0 20px;position:relative}' +
            '.marca{position:absolute;top:0;bottom:0;width:0;border-left:1px dashed rgba(201,162,39,.85);z-index:99;pointer-events:none}' +
            '.marca b{position:absolute;top:2px;left:3px;font:10px/1.4 Roboto,sans-serif;color:#0C122A;background:#C9A227;padding:1px 4px;border-radius:3px;white-space:nowrap}' +
            '.cajaEscala{position:relative;overflow:hidden;background:#0C122A;border:1px solid #2A3560}';

        var marcas = '<div class="marca" style="left:780px"><b>780px</b></div>' +
            '<div class="marca" style="left:781px"><b>781px</b></div>';

        l.controles.rango({ id: 'ancho', etiqueta: 'Ancho del viewport', min: 320, max: 1600, step: 1, defecto: 375, sufijo: ' px' });
        l.controles.rango({ id: 'alto', etiqueta: 'Alto del viewport', min: 400, max: 1400, step: 10, defecto: 1000, sufijo: ' px' });
        l.controles.boton('375 (movil)', function () { fijar(375); });
        l.controles.boton('780 (borde)', function () { fijar(780); });
        l.controles.boton('781 (borde)', function () { fijar(781); });
        l.controles.boton('1366 (notebook)', function () { fijar(1366); });

        function fijar(ancho) {
            l.controles.datos.ancho = ancho;
            l.controles.host.querySelector('input[type=range]').value = ancho;
            correr();
        }

        function correr() {
            var ancho = l.controles.get('ancho'), alto = l.controles.get('alto');
            var anchoHost = Math.max(240, l.escenario.clientWidth - 4);
            var escala = Math.min(1, anchoHost / ancho);
            var altoEscalado = Math.max(60, Math.round(alto * escala));

            var caja = el('div', 'cajaEscala');
            caja.style.width = Math.round(ancho * escala) + 'px';
            caja.style.height = altoEscalado + 'px';

            l.escenario.innerHTML = '';
            l.escenario.appendChild(caja);

            var f = document.createElement('iframe');
            f.className = 'lab__marco lab__marco--escalado';
            f.title = 'Vista responsive';
            f.style.width = ancho + 'px';
            f.style.height = alto + 'px';
            f.style.transform = 'scale(' + escala + ')';
            f.style.transformOrigin = 'top left';
            f.srcdoc = ES.docDeIframe(htmlDemo() + marcas,
                ES.cssDe(['css/home.css', 'css/navbar.css', 'css/footer.css']), extra);
            caja.appendChild(f);
            l.setMarcos(f);

            f.addEventListener('load', function () {
                pintarTarjetas(f.contentDocument, '.heroGame, .game');
                var win = f.contentWindow, doc = f.contentDocument;

                var queries = [];
                for (var i = 0; i < doc.styleSheets.length; i++) {
                    var reglas;
                    try { reglas = doc.styleSheets[i].cssRules; } catch (e) { continue; }
                    for (var j = 0; j < reglas.length; j++) {
                        if (reglas[j].type !== 4) continue;
                        var activa = false;
                        try { activa = win.matchMedia(reglas[j].conditionText).matches; } catch (e2) { }
                        queries.push({ texto: '@media ' + reglas[j].conditionText, activa: activa, n: reglas[j].cssRules.length });
                    }
                }

                var header = doc.querySelector('header');
                var card = doc.querySelector('.game');
                var hero = doc.querySelector('.heroGame');
                var search = doc.querySelector('.headerSearch');
                var mov = doc.querySelector('.searchPlaceholderMobile');
                var inputEsc = doc.querySelector('.searchPlaceholderDesktop');
                var flag = doc.querySelector('.footerFlag');
                var heading = doc.querySelector('.footerHeading');

                var muestra = [];
                if (mov && mov.offsetParent) muestra.push('mobile');
                if (inputEsc && inputEsc.offsetParent) muestra.push('escritorio');

                l.ponerSalida(
                    tabla(queries.map(function (q) {
                        return [
                            '<code>' + esc(q.texto) + '</code>',
                            '<span class="pastilla pastilla--' + (q.activa ? 'si' : 'no') + '">' +
                            (q.activa ? 'ACTIVA' : 'inactiva') + '</span>',
                            q.n + ' reglas'
                        ];
                    }), ['media query', 'estado', 'tamano']) +
                    '<div class="salsa">' +
                    '<p>Alto del <code>&lt;header&gt;</code>: <b>' + (header ? header.offsetHeight : 0) +
                    'px</b> (48 en mobile, 60 en escritorio).</p>' +
                    '<p>Card de categoria: <b>' + (card ? card.offsetWidth + ' x ' + card.offsetHeight : 0) +
                    '</b>. Card del hero: <b>' + (hero ? hero.offsetWidth + ' x ' + hero.offsetHeight : 0) + '</b>.</p>' +
                    '<p>Placeholder de la busqueda visible: <b>' + (muestra.join(' + ') || 'ninguno') + '</b>. ' +
                    'Son dos <code>&lt;input&gt;</code> distintos en el HTML, no un texto que se cambia: ' +
                    'el CSS muestra uno y oculta el otro.</p>' +
                    (search ? '<p>La barra de busqueda esta en <code>' +
                        (win.getComputedStyle(search).position === 'absolute' ? 'position:absolute' : 'flujo normal') +
                        '</code>. En escritorio se ancla al centro de la pagina con <code>left:50%</code> + ' +
                        '<code>translate(-50%,-50%)</code>, y asi no se mueve con el ancho de la barra.</p>' : '') +
                    (flag ? '<p>Bandera: <b>' + flag.offsetWidth + ' x ' + flag.offsetHeight + '</b>. ' +
                        'Con eso se ve el <code>clamp()</code> del footer en accion.</p>' : '') +
                    (heading ? '<p>Font del titulo del footer: <b>' +
                        win.getComputedStyle(heading).fontSize + '</b>.</p>' : '') +
                    '<p class="salsa__nota">Ojo con los dos breakpoints: <code>home.css</code> y ' +
                    '<code>navbar.css</code> usan <code>min-width: 780px</code>, mientras que ' +
                    '<code>footer.css</code> usa <code>min-width: 781px</code> y <code>max-width: 780px</code>. ' +
                    '760px y 781px se complementan sin dejar huecos, pero a <b>781px exactos</b> el footer ya ' +
                    'esta en escritorio y el navbar todavia en mobile.</p>' +
                    '<p class="salsa__muted">Escala ' + Math.round(escala * 100) + '% para que entre en el panel. ' +
                    'El ancho real del iframe no cambia: es ' + ancho + 'px.</p>' +
                    '</div>'
                );

                l.areaDefecto(queries.map(function (q) {
                    return '/* ' + (q.activa ? 'ACTIVA   ' : 'inactiva') + ' */ ' + q.texto;
                }).join('\n') || '/* ninguna */');
            });
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.ancho !== undefined) correr();
        });
        l.alAplicar(function () { correr(); });

        setTimeout(function () { correr(); }, 0);
        window.addEventListener('resize', function () { if (l.area.offsetParent) correr(); });
    }

    /* ===============================================================
     * 5. clamp() del footer
     * =============================================================== */

    var REGLAS_CLAMP = [
        { sel: '.footerTop gap', base: 72, ref: 1920, k: 0.068, min: 24, max: 72 },
        { sel: '.footerTop padding lateral', base: 70, ref: 1920, k: 0.0786, min: 20, max: 70 },
        { sel: '.footerColumns gap', base: 100, ref: 1920, k: 0.132, min: 14, max: 100 },
        { sel: '.footerSubColumns gap', base: 32, ref: 1920, k: 0.0214, min: 12, max: 32 },
        { sel: '.footerList a font-size', base: 13, ref: 1920, k: 0.00192, min: 12, max: 13 },
        { sel: '.footerHeading font-size', base: 22, ref: 1380, k: 0.02, min: 17, max: 22 },
        { sel: '.footerHeading margin-bottom', base: 14, ref: 1920, k: 0.0043, min: 10, max: 14 },
        { sel: '.footerFlag width', base: 48, ref: 1920, k: 0.025, min: 28, max: 48 }
    ];

    function prediccion(r, W) {
        return Math.max(r.min, Math.min(r.max, r.base - (r.ref - W) * r.k));
    }

    function labClamp(host) {
        var l = armarLab(host, {
            titulo: 'La formula clamp() del footer',
            tituloEditor: 'Media queries activas del footer',
            pistaEditor: 'El pie tiene un <code>@media (min-width: 781px)</code> que no cambia valores fijos: ' +
                'los interpola con <code>clamp(piso, calc(base - (ref - 100vw) * k), techo)</code>.',
            reset: function (h) { labClamp(h); }
        });

        var TITULOS = ['Peg Solitaire DBZ', 'Roblox', 'Super Mario 64', 'Plants vs. Zombies', 'Bomb Pong', 'Beastro'];

        function htmlPie() {
            var sub = [0, 1, 2].map(function () {
                return '<ul class="footerList footerSubColumn">' +
                    TITULOS.map(function (t) { return '<li><a href="#">' + t + '</a></li>'; }).join('') + '</ul>';
            }).join('');
            return '<footer><div class="footerTop"><div class="footerColumns">' +
                ['Sobre Nosotros', 'Informacion', 'Agradecimientos', 'Cuenta'].map(function (t) {
                    return '<div class="footerColumn"><h4 class="footerHeading">' + t + '</h4><ul class="footerList">' +
                        '<li><a href="#">Contacto</a></li><li><a href="#">Terminos de Uso</a></li>' +
                        '<li><a href="#">FAQs</a></li></ul></div>';
                }).join('') +
                '<div class="footerColumn footerColumnWide">' +
                '<h4 class="footerHeading">Nuestros Titulos Destacados</h4>' +
                '<div class="footerSubColumns">' + sub + '</div></div></div>' +
                '<div class="footerLanguages">' +
                ['mx', 'jp', 'us', 'uk', 'fr', 'it', 'br', 'es'].map(function (p) {
                    return '<img class="footerFlag" src="../img/flag-' + p + '.svg" alt="">';
                }).join('') + '</div></div>' +
                '<div class="footerBottom"><span class="footerCopyright">(c) Copyright 2026 FastGames.com</span>' +
                '<img class="footerLogo" src="../img/LOGO_White.svg" alt="">' +
                '<div class="footerSocials"><img src="../img/icon-instagram.svg" alt="">' +
                '<img src="../img/facebook.svg" alt=""><img src="../img/icon-twitter.svg" alt="">' +
                '<img src="../img/icon-youtube.svg" alt=""></div></div></footer>';
        }

        l.controles.rango({ id: 'W', etiqueta: 'Ancho del viewport', min: 700, max: 1920, step: 1, defecto: 1366, sufijo: ' px' });

        function grafico() {
            var W = l.controles.get('W');
            var r = REGLAS_CLAMP[5];
            var ancho = 520, alto = 160, pad = 28;
            var puntos = [];
            for (var x = 780; x <= 1920; x += 8) {
                puntos.push(
                    (pad + (x - 780) / (1920 - 780) * (ancho - pad * 2)).toFixed(1) + ',' +
                    (alto - pad - (prediccion(r, x) - 17) / (22 - 17) * (alto - pad * 2)).toFixed(1)
                );
            }
            function py(v) { return alto - pad - (v - 17) / 5 * (alto - pad * 2); }
            var g = '';
            [22, 19.5, 17].forEach(function (v) {
                g += '<line x1="' + pad + '" y1="' + py(v).toFixed(1) + '" x2="' + (ancho - pad) + '" y2="' + py(v).toFixed(1) + '" stroke="rgba(220,222,229,.14)"/>' +
                    '<text x="4" y="' + (py(v) + 3).toFixed(1) + '" fill="#8A93A8" font-size="9">' + v + '</text>';
            });
            var px = (pad + (W - 780) / (1920 - 780) * (ancho - pad * 2)).toFixed(1);
            return '<svg class="grafico" viewBox="0 0 ' + ancho + ' ' + alto + '" role="img" ' +
                'aria-label="Font size del titulo del footer segun el ancho del viewport">' + g +
                '<polyline points="' + puntos.join(' ') + '" fill="none" stroke="#5AC47D" stroke-width="2"/>' +
                '<line x1="' + px + '" y1="' + pad + '" x2="' + px + '" y2="' + (alto - pad) + '" stroke="#C9A227" stroke-width="1.5"/>' +
                '<circle cx="' + px + '" cy="' + py(prediccion(r, W)).toFixed(1) + '" r="3.5" fill="#C9A227"/>' +
                '<text x="' + pad + '" y="' + (alto - 8) + '" fill="#8A93A8" font-size="9">780px</text>' +
                '<text x="' + (ancho - pad) + '" y="' + (alto - 8) + '" fill="#8A93A8" font-size="9" text-anchor="end">1920px</text>' +
                '</svg>';
        }

        function correr() {
            var W = l.controles.get('W');
            l.montar({
                html: htmlPie(), css: ES.cssDe(['css/footer.css']),
                extra: 'body{margin:0}', ancho: W + 'px', alto: '360px'
            }).then(function (f) {
                l.setMarcos(f);
                var doc = f.contentDocument, win = f.contentWindow;
                var medir = function (sel, prop) {
                    var n = doc.querySelector(sel);
                    return n ? parseFloat(win.getComputedStyle(n)[prop]) : null;
                };
                var tops = Array.prototype.slice.call(doc.querySelectorAll('.footerColumn'))
                    .map(function (c) { return Math.round(c.getBoundingClientRect().top); });
                var filas = tops.length ? tops.filter(function (t) { return t === tops[0]; }).length : 0;

                l.ponerSalida(
                    grafico() +
                    '<p class="salsa__titulo">Predicho por la formula vs. medido por el navegador</p>' +
                    tabla([
                        ['.footerHeading font-size', prediccion(REGLAS_CLAMP[5], W).toFixed(2),
                            (function (v) { return v ? v.toFixed(2) : '?'; })(medir('.footerHeading', 'fontSize'))],
                        ['.footerList a font-size', prediccion(REGLAS_CLAMP[4], W).toFixed(2),
                            (function (v) { return v ? v.toFixed(2) : '?'; })(medir('.footerList a', 'fontSize'))],
                        ['.footerFlag width', prediccion(REGLAS_CLAMP[7], W).toFixed(2),
                            (function (v) { return v ? v.toFixed(2) : '?'; })(medir('.footerFlag', 'width'))],
                        ['.footerColumns gap', prediccion(REGLAS_CLAMP[2], W).toFixed(2),
                            (function (v) { return v ? v.toFixed(2) : '?'; })(medir('.footerColumns', 'gap'))]
                    ], ['propiedad', 'formula', 'navegador']) +
                    '<div class="salsa">' +
                    '<p>Todas las medidas salen de leer el CSSOM del iframe de arriba, no de un numero ' +
                    'escrito a mano.</p>' +
                    '<p>A <b>' + W + 'px</b> el footer queda en <b>' + filas + '</b> fila(s) de columnas. ' +
                    'Todo en una sola fila es lo que se busca: con valores fijos el pie necesita 1885px y ' +
                    'desborda en 1366x768, 1440x900 y 1600x900.</p>' +
                    '<p class="salsa__titulo">La curva tiene forma de Z</p>' +
                    '<p>El <code>clamp</code> devuelve el techo (22px) para anchos <b>mayores a ' +
                    REGLAS_CLAMP[5].ref + 'px</b>, baja en linea recta hasta el piso (17px) en <b>' +
                    Math.round(REGLAS_CLAMP[5].ref - (REGLAS_CLAMP[5].base - REGLAS_CLAMP[5].min) / REGLAS_CLAMP[5].k) +
                    'px</b>, y de ahi en mas se queda en 17px. Nada de eso esta en un <code>@media</code>: ' +
                    'esta entero en la aritmetica del <code>clamp</code>.</p>' +
                    '<p class="salsa__nota">El <b>1380</b> de la referencia del <code>font-size</code> no es ' +
                    'el mismo 1920 del resto de las reglas. Ese numero esta elegido a mano: es el ancho mas ' +
                    'chico que todavia deja el footer en una sola fila. Bajarlo a 1350 obliga a la pagina del ' +
                    'juego a partirse en dos filas entre 1350 y 1370.</p>' +
                    '<p class="salsa__muted">Por que <code>clamp()</code> y no tres <code>@media</code>: con ' +
                    'tres cortes hay que decidir los puntos a ojo y en el medio del recorrido el salto se ve. ' +
                    'Con <code>clamp</code> la curva es continua y el piso garantiza que nunca quede ilegible.</p>' +
                    '</div>'
                );
            });
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.W !== undefined) correr();
        });
        l.alAplicar(function () { correr(); });

        correr();
    }

    /* ===============================================================
     * 6. Boton de comentario: maquina de estados
     * =============================================================== */

    function labComentario(host) {
        var l = armarLab(host, {
            titulo: 'Boton de comentario: la maquina de estados',
            tituloEditor: 'initCommentSubmit() real de js/main.js',
            pistaEditor: 'El JS no anima nada: solo cambia clases y escucha el evento ' +
                '<code>animationend</code>. Toda la animacion vive en <code>pegSolitaire.css</code>.',
            reset: function (h) { labComentario(h); }
        });

        var html =
            '<div class="commentsSection"><h2 class="aboutTitle">Comentarios</h2>' +
            '<div class="commentsContainer"><article class="comment"><div class="commentHeader">' +
            '<img src="../img/userLight.svg" alt="" class="commentAvatar">' +
            '<span class="commentUser">GokuFan99</span><span class="commentDate">19/08/26</span></div>' +
            '<p class="commentText">El centro es una trampa. Siempre.</p></article></div>' +
            '<div class="commentForm"><h2 class="aboutTitle commentFormTitle">Deja tu Comentario</h2>' +
            '<div class="commentFormRow">' +
            '<textarea class="commentInput" placeholder="Escribe aqui tu comentario..."></textarea>' +
            '<button type="button" class="btn btnSubmitComment">' +
            '<span class="btnSubmitLabel">Enviar</span>' +
            '<img class="btnSubmitIcon" src="../img/mail.svg" alt=""></button>' +
            '</div></div></div>' +
            '<div class="bitacora"><h4>Bitacora de eventos</h4><ol id="bitacora"></ol></div>';

        var extra =
            'body{padding:14px;background:#0C122A}' +
            '.commentsSection{padding:0 0 10px;margin:0 0 14px;width:auto}' +
            '.commentsSection .aboutTitle{font-size:20px;margin-bottom:10px}' +
            '.commentFormRow{width:100%}' +
            '.commentInput{min-height:80px}' +
            '.bitacora{font-size:12px;color:#AEB6C4;background:#060915;border:1px solid #2A3560;border-radius:8px;padding:8px 12px}' +
            '.bitacora h4{margin:0 0 6px;font-size:12px;color:#DCDEE5}' +
            '.bitacora ol{margin:0;padding-left:20px;max-height:170px;overflow:auto}' +
            '.bitacora li{margin:1px 0;font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap}' +
            '.bitacora .ev-a{color:#5AC47D}.bitacora .ev-e{color:#C9A227}.bitacora .clase{color:#B8461D}';

        var partes = ['fechaDeHoy', 'agregarComentario', 'initCommentSubmit']
            .map(function (n) { return bloque(n); }).join('\n\n');

        var espia = [
            'const t0 = Date.now();',
            'const box = document.getElementById("bitacora");',
            'const btn = document.querySelector(".btnSubmitComment");',
            'function log(txt, cls) {',
            '  const li = document.createElement("li");',
            '  li.className = cls || "";',
            '  li.textContent = "+" + String(Date.now() - t0).padStart(4, " ") + "ms  " + txt;',
            '  box.appendChild(li); box.scrollTop = box.scrollHeight;',
            '}',
            'log("estado inicial -> [" + btn.className + "] disabled=" + btn.disabled);',
            '["animationstart", "animationend", "animationcancel"].forEach(function (tipo) {',
            '  btn.addEventListener(tipo, function (e) {',
            '    log(tipo + "  animationName=" + e.animationName +',
            '        "  target=[" + e.target.className + "]",',
            '      tipo === "animationend" ? "ev-e" : "ev-a");',
            '  });',
            '});',
            'new MutationObserver(function (muts) {',
            '  muts.forEach(function () {',
            '    log("clase -> [" + btn.className + "]  disabled=" + btn.disabled, "clase");',
            '  });',
            '}).observe(btn, { attributes: true, attributeFilter: ["class", "disabled"] });'
        ].join('\n');

        function script(reset) {
            return 'const COMMENT_RESET_MS = ' + reset + ';\n\n' + partes + '\n\ninitCommentSubmit();\n\n' +
                '/* Espia agregada por el lab: mira los mismos eventos que mira main.js */\n' + espia + '\n';
        }

        l.controles.rango({ id: 'reset', etiqueta: 'COMMENT_RESET_MS', min: 200, max: 4000, step: 100, defecto: 1200, sufijo: ' ms' });
        l.areaDefecto(script(1200));

        function montar(txt) {
            l.montar({ html: html, css: ES.cssDe(['css/atoms.css', 'css/pegSolitaire.css']), extra: extra, alto: '500px' })
                .then(function (f) {
                    l.setMarcos(f);
                    var err = ES.correrEnFrame(f, txt);
                    l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                    if (err) return;
                    f.contentDocument.querySelector('.commentInput').value =
                        'Prueba: asi se ve el ciclo completo del boton.';
                    l.ponerSalida(
                        '<div class="salsa">' +
                        '<p class="salsa__titulo">Dale a Enviar y mira la bitacora</p>' +
                        '<ol>' +
                        '<li><code>classList.add("enviando")</code> y <code>disabled = true</code>. ' +
                        'El <code>disabled</code> evita que un segundo click se solape.</li>' +
                        '<li><code>animationstart</code> de <code>barridoEnviar</code>: 1.2s, ' +
                        '<code>forwards</code>. El fondo va de <code>100% 0</code> a <code>0% 0</code>.</li>' +
                        '<li><code>animationend</code> de <code>barridoEnviar</code>. <b>Ahi</b>, y no antes, ' +
                        'entra <code>.enviado</code>: el texto se oculta y aparece el sobre.</li>' +
                        '<li><code>sacudida</code> (0.5s), el mismo keyframe de <code>atoms.css</code> que usa ' +
                        '<code>.btnSecondary</code>. Reutilizar un keyframe entre paginas es la razon por la ' +
                        'que <code>atoms.css</code> existe.</li>' +
                        '<li>A los <code>COMMENT_RESET_MS</code> el boton vuelve al estado inicial y acepta ' +
                        'otro comentario.</li>' +
                        '</ol>' +
                        '<p class="salsa__titulo">El filtro por nombre de animacion</p>' +
                        '<p class="salsa__alerta"><code>if (evento.animationName !== \'barridoEnviar\') return;</code> ' +
                        'no es un detalle menor: <code>animationend</code> se dispara <b>una vez por cada ' +
                        'animacion</b> que termina en el elemento. El boton puede tener varias corriendo. Sin ' +
                        'el filtro, una terminacion de <code>sacudida</code> podria disparar el swap antes de ' +
                        'tiempo.</p>' +
                        '<p>El <code>forwards</code> de <code>barridoEnviar</code> deja el fondo en el tono ' +
                        'claro. Por eso <code>.enviado</code> vuelve a poner <code>background-position: 0% 0</code> ' +
                        'a mano: al sacar la animacion se pierde su <code>forwards</code>.</p>' +
                        '<p><code>textContent</code> en <code>agregarComentario()</code> es lo que hace que lo ' +
                        'que escribe el usuario nunca se interprete como HTML. Con <code>innerHTML</code> seria ' +
                        'un XSS trivial.</p>' +
                        '<p class="salsa__nota">' + (l.controles.get('reset') < 500
                            ? 'Con COMMENT_RESET_MS en ' + l.controles.get('reset') + ' el boton se reinicia ' +
                            'antes de que termine el sacudido y la animacion se corta a mitad de camino.'
                            : 'COMMENT_RESET_MS = ' + l.controles.get('reset') + ' > los 500ms de la sacudida, ' +
                            'asi que el boton queda quieto antes de reiniciarse. Ese es todo el punto de la constante.') +
                        '</p>' +
                        '</div>'
                    );
                });
        }

        function correr() {
            var txt = setConst(l.area.value, 'COMMENT_RESET_MS', l.controles.get('reset'));
            l.area.value = txt;
            montar(txt);
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.reset !== undefined) correr();
        });
        l.controles.boton('Limpiar la bitacora', function () { correr(); });
        l.alAplicar(function (txt) { montar(txt); });

        correr();
    }

    /* ===============================================================
     * 7. Validacion del registro
     * =============================================================== */

    var REGISTRO = 'js/register.js';

    function labRegistro(host) {
        var l = armarLab(host, {
            titulo: 'Validacion del registro',
            tituloEditor: 'js/register.js completo',
            pistaEditor: 'La validacion sale de un array de datos (<code>CAMPOS</code>), no de codigo por ' +
                'campo. Agregale un campo al array, agregalo al HTML y ya valida.',
            reset: function (h) { labRegistro(h); }
        });

        var extraCampo = null;
        var contador = 0;

        function campo(id, etq, tipo, ph) {
            return '<div class="field"><label class="inputLabel" for="' + id + '">' + etq + '</label>' +
                '<input type="' + (tipo || 'text') + '" id="' + id + '" class="inputPill" placeholder="' + ph + '"></div>';
        }

        function htmlForm() {
            return '<div class="authCard"><h1 class="authTitle">Registrarse</h1><div class="formContainer">' +
                '<form action="" class="register" onsubmit="return false">' +
                '<div class="inputRow">' + campo('nombre', 'Nombre *', 'text', 'Inserte nombre...') +
                campo('apellido', 'Apellido *', 'text', 'Inserte apellido...') + '</div>' +
                campo('nickname', 'Nickname *', 'text', 'Inserte nickname...') +
                campo('edad', 'Edad *', 'number', 'Inserte edad...') +
                '<div class="inputRow">' + campo('contrasena', 'Contrasena *', 'password', 'Inserte contrasena...') +
                campo('repetirContrasena', 'Repetir contrasena *', 'password', 'Repetir la contrasena...') + '</div>' +
                '<div class="captcha"><label class="captchaLabel">' +
                '<input type="checkbox" class="captchaCheckbox"><span>I\'m not a robot</span></label>' +
                '<img class="captchaImage" src="../img/RecaptchaLogo.svg" alt=""></div>' +
                campo('email', 'Correo electronico *', 'email', 'Inserte email...') +
                (extraCampo ? campo(extraCampo.id, extraCampo.etq + ' *', 'text', 'Agregado desde el lab') : '') +
                '<div class="registerActions">' +
                '<button type="button" class="btn btnSecondary">Cancelar</button>' +
                '<button type="button" class="btn btnPrimary jsFinalizar">Finalizar</button></div>' +
                '</form></div><div class="registerSuccess">' +
                '<span class="registerSuccessIcon">&#10003;</span>' +
                '<h2 class="registerSuccessTitle">Registro exitoso</h2>' +
                '<p class="registerSuccessText">Tu cuenta fue creada correctamente.</p>' +
                '<a href="#" class="btn btnPrimary">Ir al inicio</a></div></div>';
        }

        var REG = [
            bloqueDe(REGISTRO, 'initRegister'),
            ES.extraerArray(ES.fuentes[REGISTRO], 'const CAMPOS = [').texto,
            bloqueDe(REGISTRO, 'mostrarError'),
            bloqueDe(REGISTRO, 'limpiarError'),
            bloqueDe(REGISTRO, 'validarCampos'),
            bloqueDe(REGISTRO, 'validarYEnviar'),
            bloqueDe(REGISTRO, 'showRegisterSuccess'),
            'initRegister();'
        ].join('\n\n');

        l.areaDefecto(REG);

        function enFrame(fn) {
            var f = l.getMarcos();
            return f ? fn(f.contentDocument, f.contentWindow) : null;
        }

        l.controles.boton('Finalizar', function () {
            enFrame(function (d) { d.querySelector('.jsFinalizar').click(); });
            setTimeout(estado, 30);
        });
        l.controles.boton('Limpiar', function () {
            enFrame(function (d, w) {
                d.querySelectorAll('.inputPill').forEach(function (i) {
                    i.value = ''; i.dispatchEvent(new w.Event('input'));
                });
                d.querySelector('.authCard').classList.remove('exito');
            });
            estado();
        });
        l.controles.boton('Llenar todo', function () {
            enFrame(function (d, w) {
                d.querySelectorAll('.inputPill').forEach(function (i) {
                    i.value = 'dato'; i.dispatchEvent(new w.Event('input'));
                });
            });
            estado();
        });
        l.controles.boton('Contrasenas distintas', function () {
            enFrame(function (d, w) {
                var set = function (id, v) {
                    var n = d.getElementById(id);
                    n.value = v; n.dispatchEvent(new w.Event('input'));
                };
                set('nombre', 'Ana'); set('apellido', 'Gomez'); set('nickname', 'anag');
                set('edad', '24'); set('contrasena', 'clave123'); set('repetirContrasena', 'otra999');
                set('email', 'ana@mail.com');
                if (extraCampo) set(extraCampo.id, 'valor');
                d.querySelector('.jsFinalizar').click();
            });
            setTimeout(estado, 30);
        });
        l.controles.boton('Agregar campo', function () {
            contador++;
            extraCampo = { id: 'extra' + contador, etq: 'Campo ' + contador };
            l.area.value = l.area.value.replace(/\];/,
                "    ,{ id: '" + extraCampo.id + "', mensaje: 'Falta el campo extra " + contador + "' }\n];");
            montar();
        });

        function estado() {
            enFrame(function (d) {
                var marcados = d.querySelectorAll('.inputPill.error').length;
                var avisos = d.querySelectorAll('.inputError').length;
                var exito = d.querySelector('.authCard').classList.contains('exito');
                l.ponerSalida(
                    '<div class="salsa">' +
                    '<p>Campos con borde de error: <b>' + marcados + '</b>. Avisos <code>.inputError</code>: <b>' +
                    avisos + '</b>. Estado de la tarjeta: <b>' + (exito ? '.exito, formulario oculto' : 'normal') + '</b>.</p>' +
                    '<p class="salsa__titulo">Probalo en este orden</p>' +
                    '<ul>' +
                    '<li><b>Finalizar</b> con todo vacio: aparecen los 7 avisos a la vez.</li>' +
                    '<li>Escribi en un campo: el aviso de ese campo desaparece solo, sin volver a validar. ' +
                    'Eso es el listener de <code>input</code> que <code>initRegister</code> registra ' +
                    '<b>una sola vez</b> por campo, no en cada click.</li>' +
                    '<li><b>Llenar todo</b> y despues <b>Finalizar</b>: la tarjeta pasa a <code>.exito</code> ' +
                    'y el CSS hace el resto (icono con <code>anilloEntra</code>, textos con <code>checkEntra</code> ' +
                    'escalonados con <code>animation-delay</code>).</li>' +
                    '<li><b>Contrasenas distintas</b>: el aviso es <code>Las contrasenas no coinciden</code>, y ' +
                    'solo aparece si antes no falta ningun campo.</li>' +
                    '<li><b>Agregar campo</b>: agrega una entrada a <code>CAMPOS</code> <b>y</b> un campo al ' +
                    'HTML. La validacion del campo nuevo aparece sola.</li>' +
                    '</ul>' +
                    '<p class="salsa__alerta">El captcha <b>no</b> esta en <code>CAMPOS</code>, a proposito: ' +
                    'es un <code>checkbox</code> y el aviso se cuelga del <code>.field</code> de arriba, asi ' +
                    'que no tendria donde vivir igual que los otros.</p>' +
                    '<p class="salsa__muted">El <code>.inputPill</code> del sitio viene con ' +
                    '<code>border: none</code>, asi que <code>.inputPill.error</code> es el primer borde que ' +
                    've el campo. Como tiene <code>box-sizing: border-box</code> y alto fijo, el recuadro no ' +
                    'cambia de tamano al aparecer el error.</p>' +
                    '</div>'
                );
            });
        }

        function montar() {
            l.montar({
                html: htmlForm(), css: ES.cssDe(['css/atoms.css', 'css/register.css']),
                extra: 'body{padding:16px;background:#060915}', alto: '640px'
            }).then(function (f) {
                l.setMarcos(f);
                var err = ES.correrEnFrame(f, l.area.value);
                l.mostrarError(err ? 'Error de JavaScript: ' + err : '');
                estado();
            });
        }

        l.alAplicar(function () { montar(); });
        montar();
    }

    /* ===============================================================
     * 8. CATEGORIES y la API
     * =============================================================== */

    function labDatos(host) {
        var l = armarLab(host, {
            titulo: 'De la API a las 7 categorias',
            tituloEditor: 'El array CATEGORIES y el selectGames() reales',
            pistaEditor: 'Los ids de genero de aca son los que usa el sitio. Cambialos y mira como se ' +
                'reparten los juegos entre las categorias.',
            reset: function (h) { labDatos(h); }
        });

        var panel = el('div', 'datos');
        panel.innerHTML = '<p class="vacio">Consultando la API de la catedra...</p>';
        host.appendChild(panel);

        var estadoDatos = { juegos: fixture(), api: false };

        var arrCat = ES.extraerArray(ES.fuentes['js/main.js'], 'const CATEGORIES = [');
        l.areaDefecto(arrCat ? arrCat.texto : 'const CATEGORIES = [];');

        l.controles.rango({ id: 'gpp', etiqueta: 'GAMES_PER_PAGE', min: 2, max: 12, step: 1, defecto: 7 });
        l.controles.boton('Reintentar con la API', function () { cargar(true); });
        l.alAplicar(function () { dibujar(); });

        function cuerpo() {
            return [
                'const GAMES_PER_PAGE = ' + l.controles.get('gpp') + ';',
                '',
                bloque('hasGenre'),
                '',
                bloque('hasAnyGenre'),
                '',
                bloque('selectGames'),
                '',
                'return (' + l.area.value + ').map(d => ({ def: d, juegos: selectGames(GAMES, d) }));'
            ].join('\n');
        }

        function dibujar() {
            var salida;
            try {
                salida = new Function('GAMES', cuerpo())(estadoDatos.juegos);
            } catch (e) {
                panel.innerHTML = '<p class="lab__error">No se pudo correr <code>selectGames</code>: ' +
                    esc(e.message) + '</p>';
                return;
            }

            var usados = {};
            var html = '<div class="datos__cab"><p><span class="pastilla pastilla--' +
                (estadoDatos.api ? 'si' : 'no') + '">' +
                (estadoDatos.api ? 'Datos reales de la API' : 'Fixture local de 30 juegos') + '</span></p>' +
                '<p>' + estadoDatos.juegos.length + ' juegos, ' + salida.length + ' categorias, hasta <b>' +
                (l.controles.get('gpp') * 2) + '</b> juegos por categoria (2 paginas de ' +
                l.controles.get('gpp') + ').</p></div><div class="datos__cols">';

            salida.forEach(function (fila, i) {
                var juegos = fila.juegos || [];
                var textoPick = String(fila.def && fila.def.pick);
                var ids = textoPick.match(/\d+/g) || [];
                html += '<div class="datos__col"><h4>' + esc(fila.def.name) + ' <code>#' + esc(fila.def.slug) + '</code></h4>' +
                    '<p class="datos__pick"><code>pick:</code> generos ' + ids.join(', ') +
                    (fila.def.pick.toString().indexOf('hasAnyGenre') === -1 && ids.length === 1 ? ' (uno solo)' : '') + '</p>' +
                    '<p class="datos__meta">sort <code>' + esc(fila.def.sort) + '</code>' +
                    (fila.def.topUp ? ' <span class="pastilla pastilla--si">topUp</span>' : '') +
                    ' &rarr; <b>' + juegos.length + '</b> juegos</p><ul class="datos__lista">';
                juegos.forEach(function (j) {
                    usados[j.id] = true;
                    html += '<li><i style="background:' + GRADIENTES[i % GRADIENTES.length] + '"></i>' +
                        '<span class="datos__nombre">' + esc(j.name) + '</span>' +
                        '<span class="datos__rating">' + j.rating + '&#9733;</span>' +
                        '<span class="datos__generos">' + (j.genres || []).map(function (g) { return g.id; }).join(' ') + '</span></li>';
                });
                if (!juegos.length) html += '<li class="datos__vacio">sin resultados</li>';
                html += '</ul></div>';
            });
            html += '</div>';

            html += '<div class="salsa">' +
                '<p><b>' + Object.keys(usados).length + '</b> juegos distintos entran en alguna categoria ' +
                'sobre ' + estadoDatos.juegos.length + ' disponibles. Un mismo juego puede caer en varias: ' +
                'por eso los ids de las categorias compuestas se superponen.</p>' +
                '<p class="salsa__titulo">Para que existe el topUp</p>' +
                '<p>La API no garantiza que haya ' + l.controles.get('gpp') + ' juegos de cada genero. Sin ' +
                'relleno, "Disparos" puede quedar con 3 cards y el carrusel se ve vacio. Con relleno completa ' +
                'hasta 2 paginas, pero los ultimos ya no son del genero: por eso <code>selectGames</code> ' +
                'ordena <code>core</code> primero y <code>fillers</code> despues, y los concatena al final. ' +
                'Nunca se mezcla.</p>' +
                '<p>Probalo: sacale <code>topUp: true</code> a una categoria y mira como se vacia. O cambiá ' +
                "<code>sort: 'rating'</code> por <code>'released'</code> y cambia el orden.</p>" +
                '<p class="salsa__muted">La API es la misma que usa <code>Index.html</code>. Si no hay ' +
                'internet o el navegador bloquea el pedido, uso el fixture local con la misma forma de datos ' +
                '(<code>id</code>, <code>name</code>, <code>rating</code>, <code>released</code>, ' +
                '<code>genres[].id</code>).</p>' +
                '</div>';

            panel.innerHTML = html;
        }

        function cargar(forzar) {
            if (!forzar) return Promise.resolve();
            panel.innerHTML = '<p class="vacio">Consultando la API de la catedra...</p>';
            return fetch('https://vj.interfaces.jima.com.ar/api/v2')
                .then(function (r) { return r.json(); })
                .then(function (j) {
                    if (!Array.isArray(j) || !j.length) throw new Error('respuesta vacia');
                    estadoDatos.juegos = j;
                    estadoDatos.api = true;
                    dibujar();
                    ES.aviso('API cargada: ' + j.length + ' juegos.', 'ok');
                })
                .catch(function (e) {
                    estadoDatos.juegos = fixture();
                    estadoDatos.api = false;
                    dibujar();
                    ES.aviso('No se pudo leer la API (' + (e.message || 'CORS') + '). Se usa el fixture local.');
                });
        }

        l.controles.alCambiar(function () {
            if (l.controles.datos.gpp !== undefined) dibujar();
        });

        cargar(true);
    }

    /* ===============================================================
     * 9. Paleta
     * =============================================================== */

    function hexAHsl(hex) {
        var r = parseInt(hex.slice(1, 3), 16) / 255,
            g = parseInt(hex.slice(3, 5), 16) / 255,
            b = parseInt(hex.slice(5, 7), 16) / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0;
        if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
            else if (max === g) h = ((b - r) / d + 2) * 60;
            else h = ((r - g) / d + 4) * 60;
        }
        return { h: h, s: s, l: l };
    }

    function luminancia(hex) {
        function c(v) {
            v = v / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * c(parseInt(hex.slice(1, 3), 16)) +
            0.7152 * c(parseInt(hex.slice(3, 5), 16)) +
            0.0722 * c(parseInt(hex.slice(5, 7), 16));
    }

    function contraste(a, b) {
        var la = luminancia(a), lb = luminancia(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }

    function labPaleta(host) {
        var cuenta = {};
        Object.keys(ES.fuentes).forEach(function (archivo) {
            if ((ES.meta[archivo] || {}).lang !== 'css') return;
            ES.fuentes[archivo].split('\n').forEach(function (linea, i) {
                var m, re = /#[0-9a-fA-F]{3,8}\b/g;
                while ((m = re.exec(linea))) {
                    var hex = m[0].toUpperCase();
                    if (hex.length === 4) {
                        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                    }
                    if (!cuenta[hex]) cuenta[hex] = { n: 0, donde: [] };
                    cuenta[hex].n++;
                    if (cuenta[hex].donde.length < 5) cuenta[hex].donde.push(archivo + ':' + (i + 1));
                }
            });
        });

        var rampa = [
            ['#060915', 'fondo de login y register, y del footer'],
            ['#0C122A', 'fondo del home y de la ficha de juego'],
            ['#121B3F', 'paneles: authCard, categoryPanel, loadingCard'],
            ['#182455', 'superficie elevada: comentarios, passwordHint'],
            ['#1A2140', 'cards de juego, captcha, boton de enviar']
        ];

        var cont = el('div', 'paleta');
        cont.innerHTML =
            '<h4>Rampa de superficies</h4>' +
            '<p class="paleta__intro">Cinco azules casi negros, todos en el mismo matiz y separados por ' +
            'puntos parejos de luminosidad. Asi las superficies se leen como <b>capas apiladas</b> ' +
            '(fondo &rarr; panel &rarr; card) en vez de como colores sueltos. El <code>L</code> de cada uno ' +
            'esta calculado en vivo con la formula de HSL.</p>' +
            '<div class="rampa">' + rampa.map(function (f) {
                var hsl = hexAHsl(f[0]);
                return '<div class="rampa__faja" style="background:' + f[0] + '"><b>' + f[0] + '</b>' +
                    '<span>L ' + Math.round(hsl.l * 100) + '% &middot; S ' + Math.round(hsl.s * 100) + '%</span>' +
                    '<span>' + esc(f[1]) + '</span></div>';
            }).join('') + '</div>' +
            '<h4>Contraste (WCAG)</h4>' +
            '<div class="contraste">' +
            '<label>Texto <input type="color" id="cFg" value="#DCDEE5"></label>' +
            '<label>Fondo <input type="color" id="cBg" value="#0C122A"></label></div>' +
            '<div id="cRes" class="contraste__res"></div>' +
            '<h4>Todos los colores que aparecen en el CSS</h4>' +
            '<p class="paleta__intro">Sacados con una regex sobre los archivos reales: ' +
            Object.keys(cuenta).length + ' colores distintos. Toca uno para copiarlo y ver donde se usa.</p>' +
            '<div class="chips">' + Object.keys(cuenta).sort(function (a, b) {
                return cuenta[b].n - cuenta[a].n;
            }).map(function (hex) {
                return '<button class="chip" data-hex="' + hex + '" style="--c:' + hex + '">' +
                    '<span class="chip__sw"></span><code>' + hex + '</code><span class="chip__n">' +
                    cuenta[hex].n + '</span></button>';
            }).join('') + '</div>' +
            '<div class="chips__detalle" id="chipDetalle"></div>';
        host.appendChild(cont);

        function refContraste() {
            var fg = cont.querySelector('#cFg').value;
            var bg = cont.querySelector('#cBg').value;
            var r = contraste(fg, bg);
            var nivel = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA solo para texto grande' : 'no alcanza';
            cont.querySelector('#cRes').innerHTML =
                '<div class="contraste__muestra" style="background:' + bg + ';color:' + fg + '">' +
                'The Elder Scrolls V: Skyrim &mdash; 4.6&#9733;</div>' +
                '<p><b>' + r.toFixed(2) + ':1</b> &rarr; ' + nivel + '</p>' +
                '<p class="salsa__muted">Contraste relativo segun WCAG 2. El sitio esta entero en modo oscuro ' +
                'con texto claro, asi que casi todo pasa AA sin esfuerzo. Lo que no pasa es el ' +
                '<code>.carouselArrow</code> en mobile: <code>#66666E</code> sobre <code>#0C122A</code>.</p>';
        }
        cont.querySelector('#cFg').addEventListener('input', refContraste);
        cont.querySelector('#cBg').addEventListener('input', refContraste);
        refContraste();

        cont.addEventListener('click', function (e) {
            var det = cont.querySelector('#chipDetalle');
            var chip = e.target.closest('.chip');
            if (!chip) { det.innerHTML = ''; return; }
            var hex = chip.dataset.hex, info = cuenta[hex], hsl = hexAHsl(hex);
            cont.querySelectorAll('.chip--copiado').forEach(function (c) { c.classList.remove('chip--copiado'); });
            chip.classList.add('chip--copiado');
            det.innerHTML = '<p><code>' + hex + '</code> &middot; ' + info.n + ' apariciones &middot; HSL(' +
                Math.round(hsl.h) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%)</p>' +
                '<ul>' + info.donde.map(function (d) {
                    return '<li><button class="mapaHit__ir" data-archivo="' +
                        esc(d.split(':')[0]) + '" data-linea="' + d.split(':')[1] + '"><code>' + esc(d) + '</code></button></li>';
                }).join('') +
                (info.n > 5 ? '<li class="salsa__muted">y ' + (info.n - 5) + ' mas</li>' : '') + '</ul>';
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(hex);
        });

        cont.addEventListener('click', function (e) {
            var b = e.target.closest('.mapaHit__ir');
            if (b) ES.irArchivo(b.dataset.archivo, Number(b.dataset.linea));
        });
    }

    /* ===============================================================
     * 10. Mapa de selectores
     * =============================================================== */

    function initMapa(host) {
        var entrada = ES.$('#mapaBuscador', host);
        var resultados = ES.$('#mapaResultados', host);
        var chips = ES.$('#mapaSugeridos', host);
        if (!entrada) return;

        chips.innerHTML = ['heroGame', 'categoryGames', 'footerHeading', 'btnSubmitComment', 'premium',
            'cargando', 'cartCount', 'hidden', 'cerrado', 'actionCount', 'userPanel', 'gameCart',
            'heroGameCopy', 'isLiked', 'enviado', 'enviando', 'commentInput', 'CATEGORIES'
        ].map(function (s) {
            return '<button class="chip chip--sug" data-q="' + s + '">' + s + '</button>';
        }).join('');
        chips.addEventListener('click', function (e) {
            var b = e.target.closest('[data-q]');
            if (!b) return;
            entrada.value = b.dataset.q;
            correr();
        });

        var GRUPOS = [
            ['clase', 'Clases y ids en el HTML', 'Donde esta escrito el atributo'],
            ['tag', 'Etiquetas', 'Elementos usados'],
            ['css', 'CSS', 'Donde se define o se usa'],
            ['js', 'JS', 'Donde el JavaScript lo consulta'],
            ['funcion', 'Funciones', 'Definiciones'],
            ['variable', 'Variables y constantes', 'Declaraciones'],
            ['media', 'Media queries', 'Breakpoints'],
            ['keyframe', 'Keyframes', 'Animaciones'],
            ['link', 'Enlaces entre archivos', 'Quien incluye a quien']
        ];

        function correr() {
            var q = entrada.value.trim();
            if (q.length < 2) {
                resultados.innerHTML = '<p class="vacio">Escribi una clase, un id, una funcion, una ' +
                    'constante o una media query. La idea es la misma que en el buscador de arriba, pero ' +
                    'aca se ve la regla CSS completa de cada coincidencia.</p>';
                return;
            }
            var res = ES.buscar(q);
            if (!res.length) {
                resultados.innerHTML = '<p class="vacio">Sin coincidencias para "' + esc(q) + '".</p>';
                return;
            }

            var html = '<p class="mapa__conteo">' + res.length + ' resultado(s).</p>';
            res.slice(0, 20).forEach(function (r) {
                var por = {};
                r.hits.forEach(function (h) { (por[h.tipo] = por[h.tipo] || []).push(h); });
                html += '<div class="mapaItem' + (r.exacta ? ' mapaItem--exacto' : '') + '">' +
                    '<h4><code>' + esc(r.nombre) + '</code>' + (r.exacta ? '' : ' <span class="salsa__muted">parcial</span>') + '</h4>';
                GRUPOS.forEach(function (g) {
                    var lista = por[g[0]];
                    if (!lista || !lista.length) return;
                    html += '<div class="mapaItem__grupo"><h5>' + g[1] +
                        ' <span class="pastilla">' + lista.length + '</span>' +
                        '<em>' + g[2] + '</em></h5>';
                    lista.slice(0, 14).forEach(function (h) {
                        var reglas = (h.tipo === 'css') ? (ES.reglasDe(h.archivo, r.nombre) || []) : [];
                        html += '<div class="mapaHit"><button class="mapaHit__ir" data-archivo="' +
                            esc(h.archivo) + '" data-linea="' + h.linea + '">' +
                            '<span class="hit__tipo hit__tipo--' + h.tipo + '">' + h.tipo + '</span>' +
                            '<code>' + esc(h.archivo) + '</code><span class="hit__linea">L' + h.linea + '</span></button>' +
                            (h.detalle ? '<span class="mapaHit__det">' + esc(h.detalle) + '</span>' : '');
                        reglas.slice(0, 5).forEach(function (rg) {
                            var cuerpo = rg.cuerpo.replace(/\s+/g, ' ').trim();
                            html += '<pre class="mapaHit__regla"><span class="c-sel">' + esc(rg.sel) + '</span> {' +
                                esc(cuerpo.slice(0, 180)) + (cuerpo.length > 180 ? ' …' : '') + '}</pre>';
                        });
                        html += '</div>';
                    });
                    if (lista.length > 14) {
                        html += '<p class="salsa__muted">y ' + (lista.length - 14) + ' mas de este tipo</p>';
                    }
                    html += '</div>';
                });
                html += '</div>';
            });

            resultados.innerHTML = html;
            resultados.querySelectorAll('.mapaHit__ir').forEach(function (b) {
                b.addEventListener('click', function () {
                    ES.irArchivo(b.dataset.archivo, Number(b.dataset.linea));
                });
            });
        }

        entrada.addEventListener('input', correr);
        correr();
    }

    /* ===============================================================
     * Registro
     * =============================================================== */

    window.LABS = {
        loading: labLoading,
        hero: labHero,
        categorias: labCategorias,
        responsive: labResponsive,
        clamp: labClamp,
        comentario: labComentario,
        registro: labRegistro,
        datos: labDatos,
        paleta: labPaleta
    };

    window.iniciarMapa = initMapa;

    /* Los retos de practica.js corren el mismo codigo real que los labs, asi
       que se comparten estos ayudantes en vez de duplicarlos. */
    window.AYUDA_LAB = {
        bloque: bloque,
        bloqueDe: bloqueDe,
        setConst: setConst,
        pintarTarjetas: pintarTarjetas,
        fixture: fixture
    };
})();
