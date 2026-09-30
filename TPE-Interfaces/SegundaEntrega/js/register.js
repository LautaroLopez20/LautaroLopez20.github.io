document.addEventListener('DOMContentLoaded', initRegister);

function initRegister() {
    const card = document.querySelector('.authCard');
    const finalizar = document.querySelector('.jsFinalizar');
    if (!card || !finalizar) return;

    finalizar.addEventListener('click', validarYEnviar);

    // Los listeners de escritura van una sola vez, aca. Si se agregaran en cada
    // click de Finalizar, el segundo click dejaria dos listeners por campo y el
    // aviso se borraria dos veces.
    CAMPOS.forEach(({ id }) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('input', () => limpiarError(input));
    });
}

/* Los campos a revisar y el texto de su aviso. El mensaje va con el campo asi
   los "Falta ..." estan todos juntos y son faciles de cambiar. */
const CAMPOS = [
    { id: 'nombre', mensaje: 'Falta el nombre' },
    { id: 'apellido', mensaje: 'Falta el apellido' },
    { id: 'nickname', mensaje: 'Falta el nickname' },
    { id: 'edad', mensaje: 'Falta la edad' },
    { id: 'contrasena', mensaje: 'Falta la contraseña' },
    { id: 'repetirContrasena', mensaje: 'Falta repetir la contraseña' },
    { id: 'email', mensaje: 'Falta el email' }
];

// El captcha queda fuera de la validacion a proposito: es un checkbox y no un
// input de texto, asi que el aviso no tendria donde colgarse igual que los
// demas.

/* Marca un input con el borde naranja y le cuelga el aviso debajo. El aviso se
   agrega al final del .field, asi que queda justo bajo el input gracias al
   "gap" de .field. */
function mostrarError(input, mensaje) {
    limpiarError(input);

    input.classList.add('error');

    const aviso = document.createElement('span');
    aviso.className = 'inputError';
    aviso.textContent = mensaje;
    input.parentElement.appendChild(aviso);
}

function limpiarError(input) {
    input.classList.remove('error');

    const aviso = input.parentElement.querySelector('.inputError');
    if (aviso) aviso.remove();
}

/* Revisa que esten todos los campos llenos y que las dos contrasenas sean
   iguales. Devuelve true si no quedo ningun error. */
function validarCampos() {
    let completo = true;

    CAMPOS.forEach(({ id, mensaje }) => {
        const input = document.getElementById(id);
        if (!input) return;

        if (input.value.trim() === '') {
            mostrarError(input, mensaje);
            completo = false;
        }
    });

    // Solo tiene sentido comparar las contrasenas si no falta ninguna.
    if (completo) {
        const contrasena = document.getElementById('contrasena');
        const repetir = document.getElementById('repetirContrasena');
        if (contrasena.value !== repetir.value) {
            mostrarError(repetir, 'Las contraseñas no coinciden');
            completo = false;
        }
    }

    return completo;
}

// Al tocar Finalizar se valida: si esta todo bien aparece el aviso de exito,
// si no quedan los bordes y los avisos de los campos con problema.
function validarYEnviar() {
    if (validarCampos()) showRegisterSuccess();
}

// Al tocar el boton la tarjeta pasa a mostrar el aviso de exito
function showRegisterSuccess() {
    const card = document.querySelector('.authCard');
    card.classList.add('exito');
}
