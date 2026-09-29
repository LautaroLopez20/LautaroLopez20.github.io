const APIUrl = 'https://vj.interfaces.jima.com.ar/api/v2';

const GAMES_PER_PAGE = 7;
const HERO_SLIDES = 4;
const HERO_INTERVAL_MS = 4000;

const LOADING_DURATION_MS = 5000;
const LOADING_INTERVAL_MS = 50;

/* Contador del carrito del nav. Placeholder: solo sube con cada click, no hay
   logica de carrito real. */
let carritoTotal = 0;
let cartCountElement = null;

/* Definicion de las categorias del home. El orden importa: es el mismo que
   siguen los <article class="category"> del HTML, y el slug se usa para armar
   los links del menu de categorias y el id de cada carrusel. */
const CATEGORIES = [
    { name: 'Acción', slug: 'accion', pick: (game) => hasGenre(game, 4), sort: 'rating' },
    { name: 'Disparos', slug: 'disparos', pick: (game) => hasGenre(game, 2), sort: 'rating' },
    { name: 'RPG', slug: 'rpg', pick: (game) => hasGenre(game, 5), sort: 'rating' },
    { name: 'Jugar con amigos', slug: 'amigos', pick: (game) => hasAnyGenre(game, [59, 15, 6, 1, 11]), sort: 'rating', topUp: true },
    { name: 'Un solo jugador', slug: 'un-jugador', pick: (game) => hasAnyGenre(game, [5, 3, 7, 83]), sort: 'rating', topUp: true },
    { name: 'Clásicos', slug: 'clasicos', pick: () => true, sort: 'released' },
    { name: 'Estrategia', slug: 'estrategia', pick: (game) => hasGenre(game, 10), sort: 'rating', topUp: true }
];

document.addEventListener('DOMContentLoaded', init);

async function init() {
    startLoading();
    initUserMenu();
    initCategoryMenu();
    initFooterAccordion();
    initGameActions();
    initCart();

    let games = null;
    try {
        const response = await fetch(APIUrl);
        games = await response.json();
    } catch (error) {
        console.error('No se pudo cargar los juegos desde la API:', error);
    }

    if (Array.isArray(games) && games.length > 0) {
        buildHero(games);
        buildCategories(games);
    } else {
        // Fallback: mantiene las cards placeholder y wirea el carrusel igual.
        wireFallbackCarousels();
    }
}

function gameImage(game) {
    return game.background_image_low_res || game.background_image || '';
}

function hasGenre(game, genreId) {
    return game.genres.some((genre) => genre.id === genreId);
}

function hasAnyGenre(game, genreIds) {
    return game.genres.some((genre) => genreIds.includes(genre.id));
}

/* Loading del home de 5s  (La barra)*/
function startLoading() {
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    const overlay = document.getElementById('loadingOverlay');
    if (!bar || !text || !overlay) return;

    // 5000ms son 5 segundos
    const totalSteps = LOADING_DURATION_MS / LOADING_INTERVAL_MS;
    let currentStep = 0;

    const loadingInterval = setInterval(() => {
        currentStep++;
        const percentage = Math.min(Math.round((currentStep / totalSteps) * 100), 100);

        bar.style.width = percentage + '%';
        text.textContent = percentage + '%';

        if (percentage >= 100) {
            clearInterval(loadingInterval);
            // minipausa para que se vea el 100%
            setTimeout(() => {
                overlay.classList.add('hidden');
                document.body.classList.remove('cargando');
            }, 250);
        }
    }, LOADING_INTERVAL_MS);
}

/* Menu de usuario */
function initUserMenu() {
    const button = document.querySelector('.userButton');
    const panel = document.querySelector('.userPanel');
    if (!button || !panel) return;

    button.addEventListener('click', () => {
        panel.classList.toggle('hidden');
    });

    /* Click fuera */
    document.addEventListener('click', (event) => {
        if (panel.classList.contains('hidden')) return;
        if (panel.contains(event.target) || button.contains(event.target)) return;
        panel.classList.add('hidden');
    });

    /* Escape */
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') panel.classList.add('hidden');
    });
}

/* Menu de categorias (hamburguesa): arma la lista desde CATEGORIES y lleva al
   carrusel correspondiente. Fuera del home los links van al home con el ancla */
function initCategoryMenu() {
    const button = document.querySelector('.hamburguesa');
    const panel = document.getElementById('categoryPanel');
    const list = document.getElementById('categoryPanelList');
    if (!button || !panel || !list) return;

    const enHome = Boolean(document.querySelector('.heroCarousel'));

    list.innerHTML = '';
    CATEGORIES.forEach((category) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = category.name;
        link.href = enHome ? '#cat-' + category.slug : 'Index.html#cat-' + category.slug;
        item.appendChild(link);
        list.appendChild(item);
    });

    const abrir = () => {
        button.classList.add('abierta');
        button.setAttribute('aria-expanded', 'true');
        panel.classList.remove('hidden');
    };

    const cerrar = () => {
        button.classList.remove('abierta');
        button.setAttribute('aria-expanded', 'false');
        panel.classList.add('hidden');
    };

    const estaCerrado = () => panel.classList.contains('hidden');

    button.addEventListener('click', () => {
        if (estaCerrado()) abrir();
        else cerrar();
    });

    /* Click fuera */
    document.addEventListener('click', (event) => {
        if (estaCerrado()) return;
        if (panel.contains(event.target) || button.contains(event.target)) return;
        cerrar();
    });

    /* Escape */
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') cerrar();
    });

    /* En el home el link es un ancla: se deja actuar el scroll suave en vez de
       saltar de golpe, y se actualiza la url para que quede compartida. */
    if (enHome) {
        list.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;

            const destino = document.querySelector(link.getAttribute('href'));
            if (destino) {
                event.preventDefault();
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
                try {
                    history.replaceState(null, '', link.getAttribute('href'));
                } catch (error) {
                    // En file:// el replaceState no esta permitido: el scroll ya
                    // se hizo igual, solo queda sin actualizar la url.
                }
            }
            cerrar();
        });
    }
}

/* Acciones del juego: me gusta, no me gusta y compartir.
   Cada boton se activa en el primer clic y no puede desactivarse; like y
   dislike ademas suman +1 al contador. */

function initGameActions() {
    const like = document.querySelector('.btnLike');
    const dislike = document.querySelector('.btnDislike');
    const share = document.querySelector('.btnShare');

    if (like) initCountButton(like, 'isLiked');
    if (dislike) initCountButton(dislike, 'isDisliked');
    if (share) initCountButton(share, 'isShared');
}

function initCountButton(button, activeClass) {
    const count = button.querySelector('.actionCount');

    button.addEventListener('click', () => {
        if (button.classList.contains(activeClass)) return;
        button.classList.add(activeClass);
        button.setAttribute('aria-pressed', 'true');
        if (!count) return;

        count.textContent = String(Number(count.textContent) + 1);

        // Sacar la clase y releer el layout reinicia la animacion del contador,
        // asi el pop se repite en cada clic (mientras el boton no este activo).
        count.classList.remove('pop');
        void count.offsetWidth;
        count.classList.add('pop');
    });
}

/* Footer plegable */
function initFooterAccordion() {
    const headings = [...document.querySelectorAll('.footerHeading')];

    headings.forEach((heading) => {
        heading.setAttribute('role', 'button');
        heading.setAttribute('tabindex', '0');
        heading.setAttribute('aria-expanded', 'false');
        heading.classList.add('cerrado');

        const toggle = () => {
            const estabaCerrado = heading.classList.contains('cerrado');

            headings.forEach((otro) => {
                otro.classList.add('cerrado');
                otro.setAttribute('aria-expanded', 'false');
            });

            if (estabaCerrado) {
                heading.classList.remove('cerrado');
                heading.setAttribute('aria-expanded', 'true');
            }
        };

        heading.addEventListener('click', toggle);
        heading.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') toggle();
        });
    });
}

/* Carrusel hero: 4 destacados, rotacion automatica con rebote */
function buildHero(games) {
    const heroCategory = document.querySelector('.heroCategory');
    const track = document.querySelector('.heroTrack');
    const navigation = document.querySelector('.heroNavigation');
    if (!heroCategory || !track || !navigation) return;

    const featured = [...games]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, HERO_SLIDES);

    track.innerHTML = '';
    const slides = [];
    featured.forEach((game) => {
        const slide = document.createElement('a');
        slide.className = 'heroGame';
        slide.href = 'pegSolitaire.html';
        slide.style.backgroundImage = "url('" + gameImage(game) + "')";
        const name = document.createElement('p');
        name.textContent = game.name;
        slide.appendChild(name);
        slides.push(slide);
    });

    /* Grupo real */
    const FIRST_REAL = 2;
    /* Copias de apoyo */
    const deck = [];
    /* Indice real */
    const reales = [];
    for (let i = 0; i < HERO_SLIDES + 4; i++) {
        const real = (i + HERO_SLIDES - 2) % HERO_SLIDES;
        const copia = i < 2 || i > HERO_SLIDES + 1;
        const node = copia ? slides[real].cloneNode(true) : slides[real];
        if (copia) {
            /* Copia decorativa */
            node.classList.add('heroGameCopy');
            node.removeAttribute('href');
            node.setAttribute('aria-hidden', 'true');
        }
        track.appendChild(node);
        deck.push(node);
        reales.push(real);
    }

    const slideWidth = track.firstElementChild.offsetWidth;
    // Las cards se solapan con margen negativo, asi que el avance real
    // entre slides es el ancho mas ese margen.
    const slideMargin = parseFloat(getComputedStyle(track.firstElementChild).marginLeft) || 0;
    const slideStep = slideWidth + slideMargin;
    // Compensacion para que el slide activo quede centrado en el viewport.
    const offset = heroCategory.clientWidth / 2 - slideMargin - slideWidth / 2;
    /* Slide central */
    let currentIndex = FIRST_REAL + 1;
    let timer = null;
    let animation = null;

    navigation.innerHTML = '';
    const dots = [];
    for (let i = 0; i < HERO_SLIDES; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carouselDot';
        dot.setAttribute('aria-label', 'Ir al destacado ' + (i + 1));
        dot.addEventListener('click', () => {
            goToSlide(i + FIRST_REAL);
            restartTimer();
        });
        navigation.appendChild(dot);
        dots.push(dot);
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === reales[currentIndex]);
        });
    }

    // El slide del dot activo queda grande y arriba, los laterales chicos y bajos.
    function updateSlides() {
        deck.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentIndex);
        });
    }

    function restartTimer() {
        if (timer) clearInterval(timer);
        timer = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, HERO_INTERVAL_MS);
    }

    /* Rebote */
    function goToSlide(index) {
        let destino = index;
        /* Camino corto */
        while (destino - currentIndex > HERO_SLIDES / 2) destino -= HERO_SLIDES;
        while (currentIndex - destino > HERO_SLIDES / 2) destino += HERO_SLIDES;
        if (destino === currentIndex) return;

        const from = offset - currentIndex * slideStep;
        const to = offset - destino * slideStep;
        const direction = Math.sign(to - from);
        const overshoot = to + direction * slideStep * 0.30;

        currentIndex = destino;
        updateDots();
        updateSlides();

        if (animation) animation.cancel();

        if (typeof track.animate === 'function') {
            // La posicion base corresponde al destino, asi al cancelar
            // la animacion, el track no vuelve en falso al slide 0.
            track.style.transition = 'none';
            track.style.transform = 'translateX(' + to + 'px)';
            animation = track.animate(
                [
                    { transform: 'translateX(' + from + 'px)', offset: 0, easing: 'ease-out' },
                    { transform: 'translateX(' + overshoot + 'px)', offset: 0.55, easing: 'ease-in-out' },
                    { transform: 'translateX(' + to + 'px)', offset: 1 }
                ],
                { duration: 600 }
            );
            animation.onfinish = () => {
                animation = null;
                saltarAReal();
            };
        } else {
            track.style.transition = 'transform 500ms ease';
            track.style.transform = 'translateX(' + to + 'px)';
            saltarAReal();
        }
    }

    /* Salto invisible */
    function saltarAReal() {
        if (currentIndex >= FIRST_REAL && currentIndex < FIRST_REAL + HERO_SLIDES) return;
        const real = FIRST_REAL + reales[currentIndex];
        currentIndex = real;
        track.style.transition = 'none';
        track.style.transform = 'translateX(' + (offset - real * slideStep) + 'px)';
        updateDots();
        updateSlides();
    }

    // Posicion inicial explicita: sin esto el track arranca desalineado
    // y los slides laterales aparecen desparramados en la primera carga.
    track.style.transform = 'translateX(' + (offset - currentIndex * slideStep) + 'px)';
    updateDots();
    updateSlides();
    restartTimer();
}

/* Carruseles de categorias: construye las cards desde la API */
function buildCategories(games) {
    const categoryElements = document.querySelectorAll('.category');
    categoryElements.forEach((categoryElement, index) => {
        const definition = CATEGORIES[index];
        if (!definition) return;

        // El id sale del slug de CATEGORIES para que el menu de categorias y el
        // ancla #cat-<slug> apunten siempre al mismo carrusel.
        categoryElement.id = 'cat-' + definition.slug;
        categoryElement.querySelector('.categoryName').textContent = definition.name;

        const viewport = categoryElement.querySelector('.categoryGames');
        const selected = selectGames(games, definition);

        viewport.innerHTML = '';
        selected.forEach((game) => {
            const card = document.createElement('a');
            card.className = 'game';
            card.href = 'pegSolitaire.html';
            card.style.backgroundImage = "url('" + gameImage(game) + "')";
            const label = document.createElement('p');
            label.textContent = game.name;
            card.appendChild(label);
            viewport.appendChild(card);
        });

        marcarPremium(viewport.querySelectorAll('.game'));
        initCategoryCarousel(categoryElement, viewport);
    });
}

// Selecciona hasta 14 juegos (2 paginas de 7) por categoria.
// En las categorias compuestas el core tematico va primero y el relleno despues.
function selectGames(allGames, definition) {
    const core = allGames.filter(definition.pick);
    let fillers = [];
    if (definition.topUp && core.length < GAMES_PER_PAGE * 2) {
        const used = new Set(core.map((game) => game.id));
        fillers = allGames.filter((game) => !used.has(game.id));
    }

    const sortGames = (a, b) => {
        if (definition.sort === 'released') {
            return String(a.released || '').localeCompare(String(b.released || ''));
        }
        return b.rating - a.rating;
    };

    core.sort(sortGames);
    fillers.sort(sortGames);
    return core.concat(fillers).slice(0, GAMES_PER_PAGE * 2);
}

/* Cards premium: la API no distingue gratis/pagos, asi que la marca es
   simulada al generar cada categoria. Entre 1 y 4 cards por pagina (bloque de
   GAMES_PER_PAGE), con corona en la esquina, precio y boton de carrito en el
   hover que reemplaza al play. */
function marcarPremium(cards) {
    for (let inicio = 0; inicio < cards.length; inicio += GAMES_PER_PAGE) {
        const grupo = Array.from(cards).slice(inicio, inicio + GAMES_PER_PAGE);
        const cantidad = Math.min(1 + Math.floor(Math.random() * 4), grupo.length);
        const elegidos = new Set();
        while (elegidos.size < cantidad) elegidos.add(Math.floor(Math.random() * grupo.length));

        elegidos.forEach((posicion) => {
            const card = grupo[posicion];
            card.classList.add('premium');

            // Precio simulado: el campo no viene en la API.
            const precio = Math.floor(Math.random() * 40) + 20 + '.99';

            const crown = document.createElement('span');
            crown.className = 'premiumCrown';
            crown.setAttribute('aria-hidden', 'true');
            crown.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l4.2 4L12 5.5 16.8 13 21 9l-1.5 11h-15L3 9z"/></svg>';
            card.prepend(crown);

            const price = document.createElement('span');
            price.className = 'premiumPrice';
            price.textContent = '$' + precio;
            card.appendChild(price);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'gameCart';
            button.setAttribute('aria-label', 'Agregar al carrito');
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                agregarAlCarrito();
            });
            card.appendChild(button);
        });
    }
}

/* Circulo rojo con la cantidad sobre el icono del carrito del nav */
function initCart() {
    const icon = document.querySelector('.carrito');
    if (!icon) return;

    const holder = icon.closest('button') || icon.parentElement;
    if (!holder) return;
    holder.style.position = 'relative';

    cartCountElement = document.createElement('span');
    cartCountElement.className = 'cartCount hidden';
    cartCountElement.setAttribute('aria-hidden', 'true');
    cartCountElement.textContent = String(carritoTotal);
    holder.appendChild(cartCountElement);
}

/* Cada click en un carrito de una card premium suma uno al contador */
function agregarAlCarrito() {
    carritoTotal++;
    if (!cartCountElement) return;
    cartCountElement.textContent = String(carritoTotal);
    cartCountElement.classList.remove('hidden');
}

/* Logica de un carrusel de categoria: flechas y dots */
function initCategoryCarousel(categoryElement, viewport) {
    const leftArrow = categoryElement.querySelector('.carouselArrowLeft');
    const rightArrow = categoryElement.querySelector('.carouselArrowRight');
    const navigation = categoryElement.querySelector('.categoryNavigation');

    const firstCard = viewport.querySelector('.game');
    const cardStep = firstCard ? firstCard.offsetWidth + 4 : 88;
    const totalCards = viewport.querySelectorAll('.game').length;

    let page = 0;
    let pageCount = 1;
    let pageStep = 0;
    let dots = [];

    // El viewport es 100% fluido (scroll-snap en CSS). Una "pagina" es lo
    // que entra en pantalla: N tarjetas, y el salto queda alineado a un
    // borde de tarjeta para que el snap coincida con la pagina.
    function computeLayout() {
        const visible = Math.max(1, Math.round(viewport.clientWidth / cardStep));
        pageStep = visible * cardStep;
        pageCount = Math.max(1, Math.ceil(totalCards / visible));

        navigation.innerHTML = '';
        dots = [];
        for (let i = 0; i < pageCount; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carouselDot';
            dot.setAttribute('aria-label', 'Ir a la pagina ' + (i + 1));
            dot.addEventListener('click', () => goToPage(i));
            navigation.appendChild(dot);
            dots.push(dot);
        }

        page = Math.max(0, Math.min(pageCount - 1, page));
        updateState();
    }

    function updateState() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === page);
        });
        leftArrow.disabled = page === 0;
        rightArrow.disabled = page === pageCount - 1;
    }

    function goToPage(target) {
        page = Math.max(0, Math.min(pageCount - 1, target));
        viewport.scrollTo({ left: page * pageStep, behavior: 'smooth' });
        updateState();
    }

    leftArrow.addEventListener('click', () => goToPage(page - 1));
    rightArrow.addEventListener('click', () => goToPage(page + 1));

    // Sincroniza dots y flechas si el usuario hace scroll horizontal manual.
    viewport.addEventListener('scroll', () => {
        page = Math.max(0, Math.min(pageCount - 1, Math.round(viewport.scrollLeft / pageStep)));
        updateState();
    }, { passive: true });

    window.addEventListener('resize', computeLayout);

    computeLayout();
}

/* Fallback sin API: wirea el carrusel con las cards placeholder */
function wireFallbackCarousels() {
    document.querySelectorAll('.category').forEach((categoryElement) => {
        const viewport = categoryElement.querySelector('.categoryGames');
        if (viewport) initCategoryCarousel(categoryElement, viewport);
    });

    // Los placeholders vienen como <div> en el HTML, asi que no tienen href.
    // Se les pone la navegacion a mano para que el fallback sea igual de clicable.
    document.querySelectorAll('.game, .heroGame').forEach((card) => {
        card.addEventListener('click', () => {
            window.location.href = 'pegSolitaire.html';
        });
    });
}