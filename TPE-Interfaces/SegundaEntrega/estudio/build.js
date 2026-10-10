/*
 * Genera estudio/fuentes.js con el codigo real del sitio.
 *
 * No hace falta ejecutarlo para usar la pagina de estudio: fuentes.js ya esta
 * generado y(versionado. Sirve para refrescar el codigo embebido despues de
 * editar el sitio.
 *
 *   node estudio/build.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SALIDA = path.join(__dirname, 'fuentes.js');

const ARCHIVOS = [
    { ruta: 'Index.html', lang: 'html' },
    { ruta: 'pegSolitaire.html', lang: 'html' },
    { ruta: 'register.html', lang: 'html' },
    { ruta: 'login.html', lang: 'html' },
    { ruta: 'css/home.css', lang: 'css' },
    { ruta: 'css/navbar.css', lang: 'css' },
    { ruta: 'css/footer.css', lang: 'css' },
    { ruta: 'css/loading.css', lang: 'css' },
    { ruta: 'css/atoms.css', lang: 'css' },
    { ruta: 'css/pegSolitaire.css', lang: 'css' },
    { ruta: 'css/login.css', lang: 'css' },
    { ruta: 'css/register.css', lang: 'css' },
    { ruta: 'js/main.js', lang: 'js' },
    { ruta: 'js/register.js', lang: 'js' }
];

const fuentes = {};
const meta = {};

for (const { ruta, lang } of ARCHIVOS) {
    const absoluta = path.join(RAIZ, ruta);
    if (!fs.existsSync(absoluta)) {
        console.error('  ! no existe: ' + ruta);
        continue;
    }
    const texto = fs.readFileSync(absoluta, 'utf8');
    fuentes[ruta] = texto;
    meta[ruta] = { lang, lineas: texto.split('\n').length, bytes: Buffer.byteLength(texto) };
}

/* De que archivos depende cada pagina, leido del propio HTML. */
const dependencias = {};

for (const { ruta, lang } of ARCHIVOS) {
    if (lang !== 'html') continue;
    const html = fuentes[ruta];
    const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]);
    const js = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);
    const img = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    dependencias[ruta] = { css, js, img: [...new Set(img)] };
}

/* Rutas url() que aparecen dentro de los CSS, con la linea de cada una. */
const recursosCss = {};

for (const { ruta, lang } of ARCHIVOS) {
    if (lang !== 'css') continue;
    recursosCss[ruta] = fuentes[ruta]
        .split('\n')
        .map((linea, i) => {
            const encontrados = [...linea.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((m) => m[1]);
            return encontrados.length ? { linea: i + 1, recursos: encontrados } : null;
        })
        .filter(Boolean);
}

const total = Object.values(meta).reduce((n, m) => n + m.bytes, 0);

const salida = [
    '/* Generado por estudio/build.js. No editar a mano: se regenera con',
    '   node estudio/build.js',
    '',
    '   Contains el codigo real del sitio para que la pagina de estudio ande',
    '   sin servidor. Se sobreescribe en memoria con el boton "Recargar codigo".',
    '*/',
    '',
    'window.FUENTES = ' + JSON.stringify(fuentes, null, 0) + ';',
    '',
    'window.FUENTES_META = ' + JSON.stringify(meta, null, 0) + ';',
    '',
    'window.DEPENDENCIAS = ' + JSON.stringify(dependencias, null, 0) + ';',
    '',
    'window.RECURSOS_CSS = ' + JSON.stringify(recursosCss, null, 0) + ';',
    ''
].join('\n');

fs.writeFileSync(SALIDA, salida, 'utf8');

console.log('estudio/fuentes.js generado');
console.log('  ' + Object.keys(fuentes).length + ' archivos, ' + (total / 1024).toFixed(1) + ' KB de codigo');
for (const [ruta, m] of Object.entries(meta)) {
    console.log('  ' + ruta.padEnd(24) + String(m.lineas).padStart(5) + ' lineas');
}
