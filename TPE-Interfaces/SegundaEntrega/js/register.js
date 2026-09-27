document.addEventListener('DOMContentLoaded', initRegister);

function initRegister() {
    const card = document.querySelector('.authCard');
    const finalizar = document.querySelector('.jsFinalizar');
    if (!card || !finalizar) return;

    finalizar.addEventListener('click', showRegisterSuccess);
}

// Al tocar Finalizar la tarjeta pasa a mostrar el aviso de exito
function showRegisterSuccess() {
    const card = document.querySelector('.authCard');
    card.classList.add('exito');
}
