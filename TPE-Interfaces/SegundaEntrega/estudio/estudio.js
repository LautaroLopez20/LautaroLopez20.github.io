/*
 * Estudio de FastGames: nucleo.
 *
 * - Resaltador de sintaxis propio (HTML / CSS / JS), sin CDN.
 * - Indice de selectores que cruza HTML <-> CSS <-> JS con numero de linea.
 * - Visores de codigo con notas ancladas al archivo real.
 * - Navegacion por secciones, tabs y buscador.
 *
 * Expone todo en window.ES para que labs.js lo use.
 */
(function () {
    'use strict';

    /* ---------------------------------------------------------------
     * 0. Datos
     * ------------------------------------------------------------- */

    var fuentes = window.FUENTES || {};
    var meta = window.FUENTES_META || {};
    var deps = window.DEPENDENCIAS || {};
    var recursosCss = window.RECURSOS_CSS || {};

    var LANG = { html: 'html', css: 'css', js: 'js' };

    /* ---------------------------------------------------------------
     * 1. Utilidades
     * ------------------------------------------------------------- */

    function esc(txt) {
        return String(txt)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function $(sel, raiz) { return (raiz || document).querySelector(sel); }
    function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

    function el(tag, clase, texto) {
        var n = document.createElement(tag);
        if (clase) n.className = clase;
        if (texto != null) n.textContent = texto;
        return n;
    }

    function normalizar(s) {
        return String(s || '').toLowerCase().replace(/^[.#]/, '');
    }

    /* Saca una funcion o bloque suelto del fuente por conteo de llaves,
       salteando comentarios y strings. Devuelve null si no la encuentra. */
    function extraerBloque(codigo, firma) {
        var i = codigo.indexOf(firma);
        if (i === -1) return null;
        var linea = codigo.slice(0, i).split('\n').length;
        var j = i, n = codigo.length, prof = 0, started = false;
        var estado = 'codigo';
        while (j < n) {
            var c = codigo[j], d = codigo[j + 1];
            if (estado === 'codigo') {
                if (c === '/' && d === '/') { estado = 'linea'; j++; }
                else if (c === '/' && d === '*') { estado = 'bloque'; j++; }
                else if (c === '"' || c === "'" || c === '`') { estado = c; }
                else if (c === '{') { prof++; started = true; }
                else if (c === '}') {
                    prof--;
                    if (started && prof === 0) return { texto: codigo.slice(i, j + 1), linea: linea };
                }
            } else if (estado === 'linea') { if (c === '\n') estado = 'codigo'; }
            else if (estado === 'bloque') { if (c === '*' && d === '/') { estado = 'codigo'; j++; } }
            else { if (c === '\\') j++; else if (c === estado) estado = 'codigo'; }
            j++;
        }
        return null;
    }

    function extraerFuncion(codigo, nombre) {
        return extraerBloque(codigo, 'function ' + nombre + '(');
    }

    /* Saca una declaracion de array completa (con sus [ ]) por conteo de
       corchetes. Para CATEGORIES y CAMPOS, que tienen arrays adentro. */
    function extraerArray(codigo, firma) {
        var i = codigo.indexOf(firma);
        if (i === -1) return null;
        var a = codigo.indexOf('[', i);
        if (a === -1) return null;
        var linea = codigo.slice(0, i).split('\n').length;
        var prof = 0;
        for (var j = a; j < codigo.length; j++) {
            if (codigo[j] === '[') prof++;
            else if (codigo[j] === ']') {
                prof--;
                if (prof === 0) return { texto: codigo.slice(i, j + 1), linea: linea };
            }
        }
        return null;
    }

    /* Recorta un archivo a un rango 1-based, inclusivo. */
    function recorte(codigo, desde, hasta) {
        var lineas = codigo.split('\n');
        return lineas.slice(desde - 1, hasta).join('\n');
    }

    /* ---------------------------------------------------------------
     * 2. Resaltador
     * ------------------------------------------------------------- */

    var PALABRAS_JS = ('const|let|var|function|return|if|else|for|while|of|in|new|class|this|' +
        'async|await|try|catch|finally|throw|switch|case|break|continue|typeof|instanceof|' +
        'delete|void|null|undefined|true|false|do|yield|static|get|set|extends|import|export|' +
        'default|from|interface|type').split('|').join('|');

    function tokenizarJS(codigo) {
        var toks = [];
        var re = new RegExp(
            '(\\/\\/[^\\n]*)' +                                        // 1 comentario de linea
            '|(\\/\\*[\\s\\S]*?\\*\\/)' +                               // 2 comentario de bloque
            "|('(?:\\\\.|[^'\\\\\\n])*')" +                             // 3 string simple
            '|("(?:\\\\.|[^"\\\\\\n])*")' +                             // 4 string doble
            '|(`(?:\\\\.|[^`\\\\])*`)' +                                // 5 template
            '|\\b(' + PALABRAS_JS + ')\\b' +                           // 6 palabra clave
            '|\\b(0[xX][\\da-fA-F]+|\\d+(?:\\.\\d+)?)\\b' +             // 7 numero
            '|([A-Za-z_$][\\w$]*)(?=\\s*\\()' +                         // 8 llamada
            '|([A-Za-z_$][\\w$]*)' +                                   // 9 identificador
            '|(=>|::|[{}()\\[\\].,;:?=+\\-*/%<>!&|~^]+)',               // 10 operador
            'g'
        );
        var m;
        while ((m = re.exec(codigo))) {
            var cls = m[1] || m[2] ? 'j-com'
                : m[3] || m[4] || m[5] ? 'j-str'
                    : m[6] ? 'j-kw'
                        : m[7] ? 'j-num'
                            : m[8] ? 'j-fn'
                                : m[9] ? 'j-id'
                                    : 'j-pun';
            toks.push({ ini: m.index, fin: m.index + m[0].length, cls: cls });
        }
        return toks;
    }

    /* --- CSS: primero saca comentarios y strings a un lado, y sobre el
       texto enmascarado busca llaves para partir en zonas selector/declaracion. */
    function enmascararCSS(codigo) {
        var toks = [], limpio = '', i = 0, n = codigo.length;
        while (i < n) {
            var c = codigo[i], d = codigo[i + 1];
            if (c === '/' && d === '*') {
                var f = codigo.indexOf('*/', i + 2);
                var fin = f === -1 ? n : f + 2;
                toks.push({ ini: i, fin: fin, cls: 'c-com' });
                limpio += new Array(fin - i + 1).join(' ');
                i = fin; continue;
            }
            if (c === '"' || c === "'") {
                var j = i + 1;
                while (j < n && codigo[j] !== c) { if (codigo[j] === '\\') j++; j++; }
                j = Math.min(j + 1, n);
                toks.push({ ini: i, fin: j, cls: 'c-str' });
                limpio += new Array(j - i + 1).join(' ');
                i = j; continue;
            }
            limpio += c; i++;
        }
        return { toks: toks, limpio: limpio };
    }

    var RE_SEL = /(\.[A-Za-z_][\w-]*)|(#[A-Za-z_][\w-]*)|(::?[A-Za-z-]+(?:\([^)]*\))?)|(&)|(\[[^\]]*\])|(>)|(~)|(\+)|(\*)|([a-zA-Z][\w-]*)/g;
    var RE_DECL = /^(\s*)([-a-zA-Z]+)(\s*)(:)(\s*)/;
    var RE_VALOR = /(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|vw|vh|fr|deg|ch|pt)?\b)|(!important)|([A-Za-z_-][\w-]*)(?=\()|('(?:\\.|[^'\\])*')|(#[A-Za-z][\w-]*)|([A-Za-z-]+)/g;
    var RE_ATRULE = /^(@[a-zA-Z-]+)|([a-zA-Z-]+)(?=\s*:)|(:)|(\([^)]*\))/g;

    function empujar(toks, ini, fin, cls) { toks.push({ ini: ini, fin: fin, cls: cls }); }

    function tokenizarRegionSel(codigo, ini, fin) {
        var toks = [], m, re = new RegExp(RE_SEL.source, 'g');
        re.lastIndex = ini;
        while ((m = re.exec(codigo)) && m.index < fin) {
            if (m.index + m[0].length > fin) break;
            var cls = m[1] ? 'c-cls' : m[2] ? 'c-id' : m[3] ? 'c-pseudo'
                : m[4] ? 'c-pun' : m[5] ? 'c-attr' : m[8] ? 'c-tag' : 'c-pun';
            empujar(toks, m.index, m.index + m[0].length, cls);
        }
        return toks;
    }

    function tokenizarRegionDecl(codigo, ini, fin) {
        var toks = [];
        var texto = codigo.slice(ini, fin);
        var m = RE_DECL.exec(texto);
        if (!m) return tokenizarRegionSel(codigo, ini, fin);
        empujar(toks, ini, ini + m[1].length, 'c-pun');
        empujar(toks, ini + m[1].length, ini + m[1].length + m[2].length, 'c-prop');
        empujar(toks, ini + m[1].length + m[2].length + m[3].length,
            ini + m[1].length + m[2].length + m[3].length + m[4].length, 'c-pun');
        var vIni = ini + m[0].length;
        var re = new RegExp(RE_VALOR.source, 'g');
        var v;
        re.lastIndex = vIni;
        while ((v = re.exec(codigo)) && v.index < fin) {
            if (v.index + v[0].length > fin) break;
            var vc = v[1] ? 'c-hex' : v[2] ? 'c-num' : v[3] ? 'c-imp' : v[4] ? 'c-fn'
                : v[5] ? 'c-str' : v[6] ? 'c-var' : 'c-val';
            empujar(toks, v.index, v.index + v[0].length, vc);
        }
        return toks;
    }

    function tokenizarRegionAtRule(codigo, ini, fin) {
        var toks = [], m, re = new RegExp(RE_ATRULE.source, 'g');
        re.lastIndex = ini;
        while ((m = re.exec(codigo)) && m.index < fin) {
            if (m.index + m[0].length > fin) break;
            var cls = m[1] ? 'c-at' : m[2] ? 'c-prop' : m[3] ? 'c-pun' : 'c-val';
            empujar(toks, m.index, m.index + m[0].length, cls);
        }
        return toks;
    }

    function tokenizarCSS(codigo) {
        var e = enmascararCSS(codigo);
        var toks = e.toks.slice(), limpio = e.limpio, n = limpio.length;
        var pila = [], iniRegion = 0, i = 0;

        while (i < n) {
            var c = limpio[i];
            if (c === '{') {
                pila.push({ ini: iniRegion, depth: pila.length });
                iniRegion = i + 1;
            } else if (c === '}') {
                var prev = pila.pop();
                if (prev) {
                    var txt = codigo.slice(prev.ini, i);
                    var tipo = prev.depth === 0 ? 'sel' : (/^\s*[\d.]+%\s*$/.test(txt) ? 'sel' : 'decl');
                    toks = toks.concat(tipo === 'sel' ? tokenizarRegionSel(codigo, prev.ini, i) : tokenizarRegionDecl(codigo, prev.ini, i));
                }
                iniRegion = i + 1;
            } else if (c === ';' && pila.length) {
                var t2 = codigo.slice(iniRegion, i);
                if (!/^\s*$/.test(t2)) {
                    var prevDepth = pila.length;
                    var tipo2 = prevDepth >= 1 ? 'decl' : 'sel';
                    toks = toks.concat(tipo2 === 'sel' ? tokenizarRegionSel(codigo, iniRegion, i) : tokenizarRegionDecl(codigo, iniRegion, i));
                }
                iniRegion = i + 1;
            }
            i++;
        }

        /* El selectores sueltos (por si la regla quedo sin cerrar) y los at-rules. */
        if (iniRegion < n) {
            var cola = codigo.slice(iniRegion);
            if (!/^\s*$/.test(cola)) {
                var re2 = new RegExp(RE_ATRULE.source, 'g');
                var mm, hay = false;
                re2.lastIndex = iniRegion;
                while ((mm = re2.exec(codigo)) && mm.index < n) { hay = true; empujar(toks, mm.index, mm.index + mm[0].length, 'c-at'); }
                if (!hay) toks = toks.concat(tokenizarRegionSel(codigo, iniRegion, n));
            }
        }

        toks.sort(function (a, b) { return a.ini - b.ini; });
        var limpioFinal = [];
        var anterior = -1;
        for (var t = 0; t < toks.length; t++) {
            var tk = toks[t];
            if (tk.ini < anterior) continue;
            limpioFinal.push(tk);
            anterior = tk.fin;
        }
        return limpioFinal;
    }

    var RE_HTML_TAG = /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?>)/g;
    var RE_ATTR = /([\w:.-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?|(\s+)/g;

    function tokenizarHTML(codigo) {
        var toks = [], m, re = new RegExp(RE_HTML_TAG.source, 'g');
        while ((m = re.exec(codigo))) {
            if (m[1]) { empujar(toks, m.index, m.index + m[1].length, 'h-com'); continue; }
            if (m[2]) { empujar(toks, m.index, m.index + m[2].length, 'h-doctype'); continue; }
            empujar(toks, m.index, m.index + m[3].length, 'h-pun');
            empujar(toks, m.index + m[3].length, m.index + m[3].length + m[4].length, 'h-tag');
            var iniAtr = m.index + m[0].length - m[6].length - m[4].length - m[3].length;
            tokenizarAtributos(codigo, iniAtr, m.index + m[0].length - m[6].length, toks);
            empujar(toks, m.index + m[0].length - m[6].length, m.index + m[0].length, 'h-pun');
        }
        return toks;
    }

    function tokenizarAtributos(codigo, ini, fin, toks) {
        var m, re = new RegExp(RE_ATTR.source, 'g');
        re.lastIndex = ini;
        while ((m = re.exec(codigo)) && m.index < fin) {
            if (!m[0]) { re.lastIndex++; continue; }
            if (m[1]) {
                empujar(toks, m.index, m.index + m[1].length, 'h-atr');
                if (m[2]) empujar(toks, m.index + m[1].length, m.index + m[1].length + m[2].length, 'h-pun');
                if (m[3]) empujar(toks, m.index + m[1].length + m[2].length, m.index + m[0].length, 'h-str');
            }
        }
    }

    function tokenizar(codigo, lang) {
        if (lang === 'html') return tokenizarHTML(codigo);
        if (lang === 'css') return tokenizarCSS(codigo);
        return tokenizarJS(codigo);
    }

    /* Reparte los tokens por linea, partiendo los que cruzan saltos de linea. */
    function repartir(codigo, tokens) {
        var lineas = [[]];
        var cursor = 0;

        function newline(txt) {
            var trozos = String(txt).split('\n');
            for (var i = 0; i < trozos.length; i++) {
                if (i > 0) lineas.push([]);
                if (trozos[i]) lineas[lineas.length - 1].push({ cls: '', texto: trozos[i] });
            }
        }

        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i];
            if (t.ini > cursor) newline(codigo.slice(cursor, t.ini));
            newline(codigo.slice(t.ini, t.fin));
            cursor = t.fin;
        }
        if (cursor < codigo.length) newline(codigo.slice(cursor));
        return lineas;
    }

    function pintarLineas(lineas, notas, base) {
        var html = '';
        for (var i = 0; i < lineas.length; i++) {
            var num = i + 1 + (base || 0);
            var toks = lineas[i];
            var texto = '';
            var plano = '';
            for (var j = 0; j < toks.length; j++) {
                texto += toks[j].cls
                    ? '<span class="t-' + toks[j].cls + '">' + esc(toks[j].texto) + '</span>'
                    : esc(toks[j].texto);
                plano += toks[j].texto;
            }
            if (!texto) texto = ' ';
            html += '<div class="cod__linea" data-n="' + num + '"><span class="cod__num">' + num + '</span>' +
                '<span class="cod__txt">' + texto + '</span></div>';

            if (notas) {
                for (var k = 0; k < notas.length; k++) {
                    var nota = notas[k];
                    if (!nota.ancla || plano.indexOf(nota.ancla) === -1) continue;
                    html += '<div class="cod__nota cod__nota--' + (nota.tipo || 'info') + '" data-nota="' + (k + 1) + '">' +
                        '<span class="cod__notaTag">' + (nota.tipo === 'bug' ? 'bug' : nota.tipo === 'trampa' ? 'trampa' : 'nota') + '</span>' +
                        '<span class="cod__notaTxt"><b>' + esc(nota.titulo) + '</b>' + esc(nota.texto) + '</span>' +
                        '</div>';
                }
            }
        }
        return html;
    }

    function resaltar(codigo, lang, notas, base) {
        var lineas = repartir(codigo, tokenizar(codigo, lang || 'js'));
        return pintarLineas(lineas, notas, base);
    }

    /* Resalta highlighting contra un array de strings (buscar dentro del codigo). */
    function resaltarBusqueda(contenedor, termino) {
        $$('.cod__linea', contenedor).forEach(function (l) { l.classList.remove('cod__linea--hallado'); });
        $$('.cod__nota', contenedor).forEach(function (l) { l.classList.remove('cod__nota--hallada'); });
        if (!termino) return 0;
        var t = termino.toLowerCase();
        var n = 0;
        $$('.cod__linea', contenedor).forEach(function (l) {
            var txt = $('.cod__txt', l).textContent.toLowerCase();
            if (txt.indexOf(t) !== -1) { l.classList.add('cod__linea--hallado'); n++; }
        });
        $$('.cod__nota', contenedor).forEach(function (nd) {
            if (nd.textContent.toLowerCase().indexOf(t) !== -1) nd.classList.add('cod__nota--hallada');
        });
        return n;
    }

    /* ---------------------------------------------------------------
     * 3. Visor de codigo
     * ------------------------------------------------------------- */

    var RENDERED = {};

    function montarCodigo(host, archivo, opciones) {
        opciones = opciones || {};
        var codigo = fuentes[archivo];
        if (codigo == null) {
            host.innerHTML = '<p class="vacio">No se encontro <code>' + esc(archivo) + '</code> en las fuentes cargadas.</p>';
            return;
        }
        if (opciones.desde || opciones.hasta) {
            codigo = recorte(codigo, opciones.desde || 1, opciones.hasta || 99999);
        }
        /* Seis de los archivos vienen con CRLF. El parser de HTML convierte el
           CR en salto de linea, y con white-space:pre eso partia cada linea en
           dos. Normalizar aca no cambia la cantidad de lineas, asi que los
           numeros siguen siendo los del archivo real. */
        codigo = codigo.replace(/\r\n?/g, '\n');
        host.innerHTML = '<div class="cod">' + resaltar(codigo, (meta[archivo] || {}).lang, opciones.notas, (opciones.desde || 1) - 1) + '</div>';
        if (opciones.scrollA) {
            setTimeout(function () {
                var l = host.querySelector('.cod__linea[data-n="' + opciones.scrollA + '"]');
                if (l) l.scrollIntoView({ block: 'center' });
            }, 0);
        }
    }

    /* Registra un visor perezoso: solo se dibuja la primera vez que se abre. */
    function registrarVisor(host, archivo, opciones) {
        RENDERED[host.id || archivo] = { host: host, archivo: archivo, opciones: opciones, hecho: false };
        return RENDERED[host.id || archivo];
    }

    function montarVisores() {
        Object.keys(RENDERED).forEach(function (k) {
            var v = RENDERED[k];
            if (v.hecho) return;
            if (!esVisible(v.host)) return;
            montarCodigo(v.host, v.archivo, v.opciones);
            v.hecho = true;
        });
    }

    function esVisible(node) {
        var n = node;
        while (n && n !== document.body) {
            if (n.hidden) return false;
            var p = n.parentElement;
            while (p) {
                if (p.hidden) return false;
                var cs = window.getComputedStyle(p);
                if (cs.display === 'none') return false;
                if (p.tagName === 'DETAILS' && !p.open) return false;
                p = p.parentElement;
            }
            var cs2 = window.getComputedStyle(n);
            if (cs2.display === 'none') return false;
            n = n.parentElement;
        }
        return true;
    }

    /* ---------------------------------------------------------------
     * 4. Indice de selectores HTML <-> CSS <-> JS
     * ------------------------------------------------------------- */

    var indice = { porNombre: new Map(), reglasCss: new Map() };

    function registrar(nombre, archivo, tipo, linea, detalle) {
        var clave = normalizar(nombre);
        if (!clave) return;
        if (!indice.porNombre.has(clave)) indice.porNombre.set(clave, { nombre: nombre, hits: [] });
        indice.porNombre.get(clave).hits.push({ archivo: archivo, tipo: tipo, linea: linea, detalle: detalle || '' });
    }

    function indexarHTML(archivo) {
        var lineas = fuentes[archivo].split('\n');
        lineas.forEach(function (linea, i) {
            var m;
            var reClase = /class="([^"]*)"/g;
            while ((m = reClase.exec(linea))) {
                m[1].split(/\s+/).forEach(function (c) { if (c) registrar(c, archivo, 'clase', i + 1, 'class="' + c + '"'); });
            }
            var reId = /id="([^"]*)"/g;
            while ((m = reId.exec(linea))) registrar(m[1], archivo, 'id', i + 1, 'id="' + m[1] + '"');
            var reTag = /<([a-zA-Z][\w-]*)/g;
            while ((m = reTag.exec(linea))) registrar(m[1], archivo, 'tag', i + 1, '<' + m[1]);
        });
    }

    function indexarCSS(archivo) {
        var codigo = fuentes[archivo];
        var lineas = codigo.split('\n');
        var enComentario = false;
        lineas.forEach(function (linea, i) {
            var limpia = linea;
            if (enComentario) {
                var fin = limpia.indexOf('*/');
                if (fin === -1) return;
                limpia = limpia.slice(fin + 2);
                enComentario = false;
            }
            var ini = limpia.indexOf('/*');
            if (ini !== -1 && limpia.indexOf('*/', ini) === -1) { limpia = limpia.slice(0, ini); enComentario = true; }
            var m;
            var reClase = /\.([A-Za-z_][\w-]*)/g;
            while ((m = reClase.exec(limpia))) registrar(m[1], archivo, 'css', i + 1, limpia.trim().slice(0, 90));
            var reId = /#([A-Za-z_][\w-]*)/g;
            while ((m = reId.exec(limpia))) {
                /* #DCDEE5 es un color, no un id: se descarta si el nombre es un
                   hex de 3, 4, 6 u 8 digitos. */
                if (/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(m[1])) continue;
                registrar(m[1], archivo, 'css', i + 1, limpia.trim().slice(0, 90));
            }
            var reMedia = /@media[^{]*/g;
            while ((m = reMedia.exec(limpia))) registrar('media:' + m[0].replace(/\s+/g, ' ').trim(), archivo, 'media', i + 1, 'breakpoint');
            var reKey = /@keyframes\s+([\w-]+)/g;
            while ((m = reKey.exec(limpia))) registrar(m[1], archivo, 'keyframe', i + 1, 'animacion');
        });
        indice.reglasCss.set(archivo, extraerReglas(codigo));
    }

    var RE_CONSULTA = /(querySelectorAll|querySelector|getElementById|closest|matches)\s*\(\s*['"]([^'"]+)['"]/g;
    var RE_CLASSLIST = /classList\.(add|remove|toggle|contains|replace)\s*\(\s*['"]([^'"]+)['"]/g;
    var RE_CLASSNAME = /(className\s*=|\[?'class'\]\s*,)\s*['"]([^'"]+)['"]/g;
    var RE_SRC = /(src|href)\s*=\s*['"]([^'"]+)['"]/g;

    function indexarJS(archivo) {
        var lineas = fuentes[archivo].split('\n');
        lineas.forEach(function (linea, i) {
            var m;
            var re = new RegExp(RE_CONSULTA.source, 'g');
            while ((m = re.exec(linea))) {
                m[2].split(',').forEach(function (sel) {
                    sel.trim().split(/\s+/).forEach(function (parte) {
                        if (!parte) return;
                        var limpio = parte.replace(/^[.#]/, '');
                        if (/^[a-zA-Z][\w-]*$/.test(limpio)) registrar(limpio, archivo, 'js', i + 1, m[1] + "('" + sel.trim() + "')");
                    });
                });
            }
            var re2 = new RegExp(RE_CLASSLIST.source, 'g');
            while ((m = re2.exec(linea))) m[2].split(/\s+/).forEach(function (c) { if (c) registrar(c, archivo, 'js', i + 1, 'classList.' + m[1]); });
            var re3 = new RegExp(RE_CLASSNAME.source, 'g');
            while ((m = re3.exec(linea))) m[2].split(/\s+/).forEach(function (c) { if (c) registrar(c, archivo, 'js', i + 1, 'className'); });
            var re4 = /function\s+([A-Za-z_$][\w$]*)/g;
            while ((m = re4.exec(linea))) registrar(m[1], archivo, 'funcion', i + 1, 'function ' + m[1] + '()');
            var re5 = /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g;
            while ((m = re5.exec(linea))) registrar(m[1], archivo, 'variable', i + 1, 'declaracion');
        });
    }

    function indexarHTMLRefs(archivo) {
        var lineas = fuentes[archivo].split('\n');
        lineas.forEach(function (linea, i) {
            var m, re = new RegExp(RE_SRC.source, 'g');
            while ((m = re.exec(linea))) {
                if (/\.(css|js)$/.test(m[2])) registrar(m[2], archivo, 'link', i + 1, m[1] + '=' + m[2]);
            }
        });
    }

    function extraerReglas(codigo) {
        var e = enmascararCSS(codigo);
        var reglas = [], ini = 0, i = 0, limpio = e.limpio;
        var lineaDe = function (pos) { return codigo.slice(0, pos).split('\n').length; };
        for (i = 0; i < limpio.length; i++) {
            if (limpio[i] === '{') {
                var prof = 1, j = i + 1;
                while (j < limpio.length && prof > 0) {
                    if (limpio[j] === '{') prof++;
                    else if (limpio[j] === '}') prof--;
                    j++;
                }
                var sel = codigo.slice(ini, i);
                if (!/^\s*$/.test(sel)) {
                    reglas.push({
                        sel: sel.trim(),
                        linea: lineaDe(ini),
                        cuerpo: codigo.slice(i + 1, j - 1),
                        cuerpoLinea: lineaDe(i + 1)
                    });
                }
                ini = j;
                i = j;
            }
        }
        return reglas;
    }

    function construirIndice() {
        indice.porNombre = new Map();
        indice.reglasCss = new Map();
        Object.keys(fuentes).forEach(function (archivo) {
            var lang = (meta[archivo] || {}).lang;
            if (lang === 'html') { indexarHTML(archivo); indexarHTMLRefs(archivo); }
            else if (lang === 'css') indexarCSS(archivo);
            else if (lang === 'js') indexarJS(archivo);
        });
    }

    var ORDEN_TIPO = { bug: 0, html: 1, clase: 1, id: 1, tag: 1, css: 2, media: 2, keyframe: 2, js: 3, funcion: 3, variable: 3, link: 4 };

    function buscar(termino) {
        var t = normalizar(termino);
        if (!t) return [];
        var resultados = [];
        indice.porNombre.forEach(function (entrada, clave) {
            var puntuacion = clave === t ? 0 : (clave.indexOf(t) === 0 ? 1 : clave.indexOf(t) !== -1 ? 2 : 99);
            if (puntuacion === 99) return;
            var hits = entrada.hits.slice().sort(function (a, b) {
                var d = (ORDEN_TIPO[a.tipo] || 9) - (ORDEN_TIPO[b.tipo] || 9);
                if (d) return d;
                return a.archivo < b.archivo ? -1 : a.archivo > b.archivo ? 1 : a.linea - b.linea;
            });
            resultados.push({ nombre: entrada.nombre, clave: clave, exacta: puntuacion === 0, hits: hits });
        });
        resultados.sort(function (a, b) { return a.exacta - b.exacta; });
        return resultados;
    }

    function reglasDe(archivo, nombre) {
        var lista = indice.reglasCss.get(archivo) || [];
        var t = normalizar(nombre);
        return lista.filter(function (r) {
            return r.sel.split(',').some(function (parte) {
                return new RegExp('(^|[^\\w-])[.#]' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\w-])').test(parte.trim());
            });
        });
    }

    /* ---------------------------------------------------------------
     * 5. Iframes para los laboratorios
     * ------------------------------------------------------------- */

    function cssDe(archivos) {
        return (archivos || []).map(function (a) { return fuentes[a] || ''; }).join('\n\n');
    }

    function docDeIframe(html, css, extra) {
        return [
            '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<link rel="preconnect" href="https://fonts.googleapis.com">',
            '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">',
            '<style>html{background:#0C122A}body{margin:0}</style>',
            '<style>\n' + (css || '') + '\n</style>',
            '<style>\n' + (extra || '') + '\n</style>',
            '</head><body>' + (html || '') + '</body></html>'
        ].join('\n');
    }

    function crearIframe(host, opciones) {
        return new Promise(function (res) {
            var f = document.createElement('iframe');
            f.className = 'lab__marco' + (opciones.clase ? ' ' + opciones.clase : '');
            f.setAttribute('title', opciones.titulo || 'Laboratorio');
            f.style.width = opciones.ancho || '100%';
            f.style.height = opciones.alto || '320px';
            if (opciones.srcdoc) f.srcdoc = opciones.srcdoc;
            f.addEventListener('load', function () { res(f); }, { once: true });
            host.innerHTML = '';
            host.appendChild(f);
        });
    }

    function refrescarIframe(f, opciones) {
        return new Promise(function (res) {
            f.addEventListener('load', function () { res(f); }, { once: true });
            f.srcdoc = docDeIframe(opciones.html, opciones.css, opciones.extra);
        });
    }

    /* Corre codigo dentro del iframe (mismo origen que la pagina). */
    function correrEnFrame(f, codigo) {
        try {
            f.contentWindow.eval(codigo);
            return null;
        } catch (err) {
            return err && err.message ? err.message : String(err);
        }
    }

    /* ---------------------------------------------------------------
     * 6. Navegacion, tabs y desplegables
     * ------------------------------------------------------------- */

    function irA(id) {
        var secciones = $$('[data-seccion]');
        var destino = null;
        secciones.forEach(function (s) {
            var prendido = s.id === id;
            s.hidden = !prendido;
            if (prendido) destino = s;
        });
        $$('[data-nav]').forEach(function (a) {
            var prendido = a.getAttribute('href') === '#' + id;
            var sub = a.closest('.nav__grupo');
            if (sub) sub.classList.toggle('nav__grupo--abierto', prendido);
            a.classList.toggle('nav__link--activo', prendido);
            if (prendido) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        if (destino) {
            var crumb = $('#miga');
            if (crumb) {
                crumb.textContent = '';
                crumb.appendChild(el('span', 'miga__txt', (destino.dataset.titulo || destino.id)));
            }
            montarVisores();
            ocultarLabInactivos();
        }
        if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    }

    function ocultarLabInactivos() {
        $$('[data-lab-mount]').forEach(function (host) {
            if (!host.dataset.montado && esVisible(host)) {
                var nombre = host.dataset.labMount;
                if (window.LABS && window.LABS[nombre]) {
                    host.dataset.montado = '1';
                    try { window.LABS[nombre](host); }
                    catch (e) { host.innerHTML = '<p class="vacio">No se pudo montar el laboratorio: ' + esc(e.message) + '</p>'; }
                }
            }
        });
    }

    function activarTabs(grupo) {
        var cont = $('[data-tabs="' + grupo + '"]');
        if (!cont) return;
        $$('[data-tab]', cont).forEach(function (btn) {
            btn.addEventListener('click', function () {
                var destino = btn.dataset.tab;
                $$('[data-tab]', cont).forEach(function (b) {
                    b.classList.toggle('tab--activo', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                $$('[data-panel]', cont).forEach(function (p) { p.hidden = p.dataset.panel !== destino; });
                montarVisores();
                ocultarLabInactivos();
            });
        });
    }

    /* ---------------------------------------------------------------
     * 7. Recarga de codigo desde disco
     * ------------------------------------------------------------- */

    function resolverClave(file) {
        var ruta = file.webkitRelativePath || file.name;
        var normalizada = ruta.replace(/\\/g, '/');
        var objetivo = normalizada.split('/').pop().toLowerCase();
        var claves = Object.keys(fuentes);
        for (var i = 0; i < claves.length; i++) {
            if (claves[i].toLowerCase().split('/').pop() === objetivo) return claves[i];
        }
        return null;
    }

    function detectarLenguaje(nombre) {
        if (/\.css$/i.test(nombre)) return 'css';
        if (/\.js$/i.test(nombre)) return 'js';
        return 'html';
    }

    function recargarCodigo(archivos, avisar) {
        var leidos = 0, sinClave = [];
        Array.prototype.slice.call(archivos).forEach(function (file) {
            var clave = resolverClave(file);
            if (!clave) { sinClave.push(file.name); return; }
            var lector = new FileReader();
            lector.onload = function () {
                var texto = String(lector.result);
                fuentes[clave] = texto;
                meta[clave] = meta[clave] || {};
                meta[clave].lang = meta[clave].lang || detectarLenguaje(clave);
                meta[clave].lineas = texto.split('\n').length;
                meta[clave].bytes = texto.length;
                leidos++;
                if (leidos + sinClave.length === archivos.length) {
                    construirIndice();
                    /* No se pisan los registros: solo se marca todo como
                       "para repintar" para que los visores ya dibujados vuelvan
                       a leerse desde las fuentes nuevas. */
                    Object.keys(RENDERED).forEach(function (k) { RENDERED[k].hecho = false; });
                    montarVisores();
                    $$('[data-repintar]').forEach(function (n) { n.dispatchEvent(new CustomEvent('repintar')); });
                    avisar(leidos, sinClave);
                }
            };
            lector.readAsText(file);
        });
    }

    /* ---------------------------------------------------------------
     * 8. Buscador
     * ------------------------------------------------------------- */

    function montarBuscador() {
        var input = $('#buscador');
        var panel = $('#resultados');
        if (!input || !panel) return;

        function cerrar() { panel.hidden = true; }

        input.addEventListener('input', function () {
            var q = input.value.trim();
            if (q.length < 2) { cerrar(); return; }
            var res = buscar(q);
            panel.hidden = false;
            panel.innerHTML = '';
            if (!res.length) {
                panel.appendChild(el('p', 'vacio', 'Sin coincidencias para "' + q + '".'));
                return;
            }
            panel.appendChild(el('p', 'resultados__conteo', res.length + ' coincidencia' + (res.length === 1 ? '' : 's') + ' para "' + q + '"'));
            res.slice(0, 40).forEach(function (r) {
                var item = el('div', 'resultados__item');
                var cab = el('div', 'resultados__cab');
                cab.appendChild(el('code', 'resultados__nombre', (r.nombre.indexOf('media:') === 0 ? '' : '.')));
                cab.querySelector('code').textContent = r.nombre;
                item.appendChild(cab);
                var chips = el('div', 'resultados__hits');
                r.hits.forEach(function (h) {
                    var b = el('button', 'hit');
                    b.innerHTML = '<span class="hit__tipo hit__tipo--' + h.tipo + '">' + h.tipo + '</span>' +
                        '<span class="hit__arch">' + esc(h.archivo) + '</span>' +
                        '<span class="hit__linea">L' + h.linea + '</span>' +
                        (h.detalle ? '<span class="hit__detalle">' + esc(h.detalle) + '</span>' : '');
                    b.addEventListener('click', function () { saltarA(h.archivo, h.linea); cerrar(); });
                    chips.appendChild(b);
                });
                item.appendChild(chips);
                panel.appendChild(item);
            });
        });

        input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; cerrar(); input.blur(); } });
        document.addEventListener('click', function (e) {
            if (!panel.contains(e.target) && e.target !== input) cerrar();
        });
    }

    function saltarA(archivo, linea, idHost) {
        /* Candidatos, en orden de preferencia: el visor pedido (el tag puede
           apuntar a un tramo de una pagina) y despues todos los que tienen
           ese archivo. hace falta la lista porque un tramo no siempre
           contiene la linea pedida: si el tag no trae visor, el que debe
           responder es el visor canonico del archivo. */
        var lista = [];
        if (idHost) {
            var pedido = document.getElementById(idHost);
            if (pedido) lista.push(pedido);
        }
        $$('[data-visor="' + archivo + '"]').forEach(function (n) {
            if (lista.indexOf(n) === -1) lista.push(n);
        });
        if (!lista.length) return;

        function seccionDe(visor) {
            var propio = visor.closest('[data-seccion]');
            if (propio) return propio.id;
            return archivo.indexOf('.css') > -1 ? 'vision-css'
                : archivo.indexOf('.js') > -1 ? 'vision-js'
                    : 'vision-html';
        }

        /* El visor puede estar en un panel de tabs cerrado o dentro de un
           <details> plegado. Hay que abrirlo antes de medir nada. */
        function abrir(visor) {
            var panel = visor.closest('[data-panel]');
            if (panel) {
                var grupo = panel.closest('[data-tabs]');
                var boton = grupo && grupo.querySelector('[data-tab="' + panel.dataset.panel + '"]');
                if (boton && !boton.classList.contains('tab--activo')) boton.click();
            }
            var det = visor.closest('details');
            if (det) det.open = true;
        }

        function pintarEn(visor) {
            var seccion = seccionDe(visor);
            if (document.getElementById(seccion)) irA(seccion);
            abrir(visor);
            var l = visor.querySelector('.cod__linea[data-n="' + linea + '"]');
            if (!l) return false;
            l.classList.add('cod__linea--destacada');
            l.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setTimeout(function () { l.classList.remove('cod__linea--destacada'); }, 2600);
            return true;
        }

        /* Se abre el primero para que se vea algo mientras se arma. */
        var inicial = lista[0];
        if (document.getElementById(seccionDe(inicial))) irA(seccionDe(inicial));
        abrir(inicial);

        setTimeout(function () {
            for (var i = 0; i < lista.length; i++) {
                var v = lista[i];
                abrir(v);
                var reg = RENDERED[v.id || archivo];
                if (!v.querySelector('.cod')) montarCodigo(v, archivo, reg ? reg.opciones : null);
                if (pintarEn(v)) return;
            }
        }, 80);
    }

    /* ---------------------------------------------------------------
     * 9. Arranque
     * ------------------------------------------------------------- */

    function aviso(texto, tipo) {
        var a = $('#aviso');
        if (!a) return;
        a.textContent = texto;
        a.className = 'aviso' + (tipo ? ' aviso--' + tipo : '');
        a.hidden = false;
        clearTimeout(a._t);
        a._t = setTimeout(function () { a.hidden = true; }, 6000);
    }

    function boot() {
        construirIndice();
        montarBuscador();

        $$('[data-nav]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                irA(a.getAttribute('href').slice(1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        window.addEventListener('hashchange', function () { irA(location.hash.slice(1) || 'inicio'); });

        $$('[data-tabs]').forEach(function (g) { activarTabs(g.dataset.tabs); });

        /* Boton de recarga de codigo */
        var picker = $('#cargarArchivos');
        if (picker) {
            picker.addEventListener('change', function () {
                if (!picker.files || !picker.files.length) return;
                recargarCodigo(picker.files, function (n, sinClave) {
                    aviso('Codigo actualizado: ' + n + ' archivo(s) recargado(s) en memoria.' +
                        (sinClave.length ? ' Ignorados (no coinciden): ' + sinClave.join(', ') : '') +
                        ' Recarga la seccion para verlos.', 'ok');
                    picker.value = '';
                });
            });
        }

        var btnRecarga = $('#btnRecarga');
        if (btnRecarga && picker) btnRecarga.addEventListener('click', function () { picker.click(); });

        var btnCopiar = $('#btnCopiarEnlace');
        if (btnCopiar) {
            btnCoparioSafe(btnCopiar);
        }

        /* Volver a pintar */
        var btnRecalcular = $('#btnRecalcular');
        if (btnRecalcular) {
            btnRecalcular.addEventListener('click', function () {
                Object.keys(RENDERED).forEach(function (k) { RENDERED[k].hecho = false; });
                montarVisores();
                $$('[data-repintar]').forEach(function (n) { n.dispatchEvent(new CustomEvent('repintar')); });
                aviso('Vistas de codigo regeneradas.', 'ok');
            });
        }

        var inicial = location.hash.slice(1) || 'inicio';
        if (!document.getElementById(inicial)) inicial = 'inicio';
        irA(inicial);

        $$('[data-inicializar]').forEach(function (n) {
            var fn = window[n.dataset.inicializar];
            if (typeof fn === 'function') {
                try { fn(n); } catch (e) { n.innerHTML = '<p class="vacio">' + esc(e.message) + '</p>'; }
            }
        });
    }

    function btnCoparioSafe(btn) {
        btn.addEventListener('click', function () {
            var url = location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () { aviso('Enlace copiado.', 'ok'); }, function () { aviso(url); });
            } else aviso(url);
        });
    }

    window.ES = {
        fuentes: fuentes,
        meta: meta,
        deps: deps,
        recursosCss: recursosCss,
        esc: esc,
        $: $,
        $$: $$,
        el: el,
        normalizar: normalizar,
        resaltar: resaltar,
        montarCodigo: montarCodigo,
        registrarVisor: registrarVisor,
        montarVisores: montarVisores,
        indice: indice,
        construirIndice: construirIndice,
        buscar: buscar,
        reglasDe: reglasDe,
        extraerReglas: extraerReglas,
        extraerBloque: extraerBloque,
        extraerFuncion: extraerFuncion,
        extraerArray: extraerArray,
        irArchivo: saltarA,
        recorte: recorte,
        cssDe: cssDe,
        docDeIframe: docDeIframe,
        crearIframe: crearIframe,
        refrescarIframe: refrescarIframe,
        correrEnFrame: correrEnFrame,
        irA: irA,
        aviso: aviso,
        tokenizar: tokenizar
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
