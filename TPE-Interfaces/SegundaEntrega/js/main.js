const APIUrl = 'https://vj.interfaces.jima.com.ar/api/v2';

const GAMES_PER_PAGE = 7;
const HERO_SLIDES = 4;
const HERO_INTERVAL_MS = 4000;

document.addEventListener('DOMContentLoaded', init);

async function init() {
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

/* ---- Carrusel hero: 4 destacados, rotacion automatica con rebote ---- */
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
        const slide = document.createElement('div');
        slide.className = 'heroGame';
        slide.style.backgroundImage = "url('" + gameImage(game) + "')";
        const name = document.createElement('p');
        name.textContent = game.name;
        slide.appendChild(name);
        track.appendChild(slide);
        slides.push(slide);
    });

    const slideWidth = track.firstElementChild.offsetWidth;
    // Las cards se solapan con margen negativo, asi que el avance real
    // entre slides es el ancho mas ese margen.
    const slideMargin = parseFloat(getComputedStyle(track.firstElementChild).marginLeft) || 0;
    const slideStep = slideWidth + slideMargin;
    // Compensacion para que el slide activo quede centrado en el viewport.
    const offset = heroCategory.clientWidth / 2 - slideMargin - slideWidth / 2;
    // Arranca en el slide del medio para que el primer render sea simetrico.
    let currentIndex = 1;
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
            goToSlide(i);
            restartTimer();
        });
        navigation.appendChild(dot);
        dots.push(dot);
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // El slide del dot activo queda grande y arriba, los laterales chicos y bajos.
    function updateSlides() {
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentIndex);
        });
    }

    function restartTimer() {
        if (timer) clearInterval(timer);
        timer = setInterval(() => {
            goToSlide((currentIndex + 1) % HERO_SLIDES);
        }, HERO_INTERVAL_MS);
    }

    // Animacion tipo rebote: sobrepasa el destino y vuelve a asentarse.
    function goToSlide(index) {
        const target = ((index % HERO_SLIDES) + HERO_SLIDES) % HERO_SLIDES;
        if (target === currentIndex) return;

        const from = offset - currentIndex * slideStep;
        const to = offset - target * slideStep;
        const direction = Math.sign(to - from);
        const overshoot = to + direction * slideStep * 0.30;

        currentIndex = target;
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
            };
        } else {
            track.style.transition = 'transform 500ms ease';
            track.style.transform = 'translateX(' + to + 'px)';
        }
    }

    // Posicion inicial explicita: sin esto el track arranca desalineado
    // y los slides laterales aparecen desparramados en la primera carga.
    track.style.transform = 'translateX(' + (offset - currentIndex * slideStep) + 'px)';
    updateDots();
    updateSlides();
    restartTimer();
}

/* ---- Carruseles de categorias: construye las cards desde la API ---- */
function buildCategories(games) {
    const definitions = [
        { name: 'Acción', pick: (game) => hasGenre(game, 4), sort: 'rating' },
        { name: 'Disparos', pick: (game) => hasGenre(game, 2), sort: 'rating' },
        { name: 'RPG', pick: (game) => hasGenre(game, 5), sort: 'rating' },
        { name: 'Jugar con amigos', pick: (game) => hasAnyGenre(game, [59, 15, 6, 1, 11]), sort: 'rating', topUp: true },
        { name: 'Un solo jugador', pick: (game) => hasAnyGenre(game, [5, 3, 7, 83]), sort: 'rating', topUp: true },
        { name: 'Clásicos', pick: () => true, sort: 'released' },
        { name: 'Estrategia', pick: (game) => hasGenre(game, 10), sort: 'rating', topUp: true }
    ];

    const categoryElements = document.querySelectorAll('.category');
    categoryElements.forEach((categoryElement, index) => {
        const definition = definitions[index];
        if (!definition) return;

        categoryElement.querySelector('.categoryName').textContent = definition.name;

        const viewport = categoryElement.querySelector('.categoryGames');
        const selected = selectGames(games, definition);

        viewport.innerHTML = '';
        selected.forEach((game) => {
            const card = document.createElement('div');
            card.className = 'game';
            card.style.backgroundImage = "url('" + gameImage(game) + "')";
            const label = document.createElement('p');
            label.textContent = game.name;
            card.appendChild(label);
            viewport.appendChild(card);
        });

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

/* ---- Logica de un carrusel de categoria: flechas y dots ---- */
function initCategoryCarousel(categoryElement, viewport) {
    const leftArrow = categoryElement.querySelector('.carouselArrowLeft');
    const rightArrow = categoryElement.querySelector('.carouselArrowRight');
    const navigation = categoryElement.querySelector('.categoryNavigation');

    const firstCard = viewport.querySelector('.game');
    const cardStep = firstCard ? firstCard.offsetWidth + 4 : 94;
    const pageStep = cardStep * GAMES_PER_PAGE;
    // El viewport mide exactamente una pagina para que no queden juegos
    // del dot anterior al desplazarse.
    viewport.style.width = pageStep + 'px';
    viewport.style.flexBasis = pageStep + 'px';
    const totalCards = viewport.querySelectorAll('.game').length;
    const pageCount = Math.max(1, Math.ceil(totalCards / GAMES_PER_PAGE));

    let page = 0;
    const dots = [];

    navigation.innerHTML = '';
    for (let i = 0; i < pageCount; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carouselDot';
        dot.setAttribute('aria-label', 'Ir a la pagina ' + (i + 1));
        dot.addEventListener('click', () => goToPage(i));
        navigation.appendChild(dot);
        dots.push(dot);
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

    updateState();
}

/* ---- Fallback sin API: wirea el carrusel con las cards placeholder ---- */
function wireFallbackCarousels() {
    document.querySelectorAll('.category').forEach((categoryElement) => {
        const viewport = categoryElement.querySelector('.categoryGames');
        if (viewport) initCategoryCarousel(categoryElement, viewport);
    });
}