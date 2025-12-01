import { getAllCountries, getCountryByName, getCountriesByRegion } from './api.js';

const countriesContainer = document.getElementById('countries-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const regionFilter = document.getElementById('region-filter');
const loadingDiv = document.getElementById('loading');
const favCountSpan = document.getElementById('fav-count');
const btnFavoritos = document.getElementById('btn-favoritos');

let allCountriesData = [];
let currentView = 'home';

/* Utilities */
const showLoading = () => loadingDiv.classList.remove('hidden');
const hideLoading = () => loadingDiv.classList.add('hidden');

const shuffleArray = (arr) => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const createCountryCard = (country) => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFav = favorites.includes(country.name.common);
    const heart = isFav ? '❤️' : '🤍';

    const div = document.createElement('div');
    div.classList.add('country-card');

    div.innerHTML = `
        <img src="${country.flags?.svg || country.flags?.png || ''}" alt="Bandeira de ${country.name.common}">
        <div class="card-info">
            <h3>${country.name.common}</h3>
            <p><strong>População:</strong> ${country.population ? country.population.toLocaleString('pt-BR') : 'N/A'}</p>
            <p><strong>Região:</strong> ${country.region || 'N/A'}</p>
            <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
            <button class="fav-btn" data-name="${country.name.common}" title="Adicionar/Remover favorito">${heart}</button>
        </div>
    `;

    // Favoritar
    const favBtn = div.querySelector('.fav-btn');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(country.name.common);
        if (currentView === 'favorites') {
            renderFavorites();
        } else if (currentView === 'home') {
            renderRandomCountries();
        } else if (currentView === 'region') {

            regionFilter.dispatchEvent(new Event('change'));
        } else {
            renderCountries(allCountriesData);
        }
    });


    div.addEventListener('click', () => {
        openModalWithCountry(country);
    });

    return div;
};

const renderCountries = (countries) => {
    countriesContainer.innerHTML = '';
    if (!countries || countries.length === 0) {
        countriesContainer.innerHTML = `<p>Nenhum país encontrado.</p>`;
        return;
    }
    countries.forEach(country => {
        countriesContainer.appendChild(createCountryCard(country));
    });
};

const renderRandomCountries = () => {
    if (!allCountriesData || allCountriesData.length === 0) {
        countriesContainer.innerHTML = `<p>Dados não carregados.</p>`;
        return;
    }
    const randomTen = shuffleArray(allCountriesData).slice(0, 10);
    renderCountries(randomTen);
    currentView = 'home';
};

/* Favoritos */
const updateFavCount = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favCountSpan.innerText = favorites.length;
};

const toggleFavorite = (name) => {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.includes(name)) {
        favorites = favorites.filter(fav => fav !== name);
    } else {
        favorites.push(name);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavCount();
};

const renderFavorites = async () => {
    showLoading();
    const names = JSON.parse(localStorage.getItem('favorites')) || [];
    if (names.length === 0) {
        countriesContainer.innerHTML = `<p>Você não tem favoritos ainda.</p>`;
        hideLoading();
        currentView = 'favorites';
        return;
    }

    let favCountries = names.map(n => allCountriesData.find(c => c.name.common === n)).filter(Boolean);

    const missing = names.filter(n => !favCountries.some(c => c.name.common === n));
    if (missing.length > 0) {
        const promises = missing.map(name => getCountryByName(name).catch(() => null));
        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res && Array.isArray(res) && res[0]) favCountries.push(res[0]);
        });
    }

    renderCountries(favCountries);
    hideLoading();
    currentView = 'favorites';
};

/* Busca */
const doSearch = () => {
    const term = searchInput.value.trim();
    if (!term) {
        if (!regionFilter.value) {
            renderRandomCountries();
        } else {
            regionFilter.dispatchEvent(new Event('change'));
        }
        return;
    }

    const lower = term.toLowerCase();
    const filtered = allCountriesData.filter(c => c.name.common.toLowerCase().includes(lower));
    renderCountries(filtered);
    currentView = 'search';
};

/* Modal  */
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

const openModalWithCountry = (country) => {
    modalBody.innerHTML = `
        <h2>${country.name.common}</h2>
        <img src="${country.flags?.svg || country.flags?.png || ''}" alt="Bandeira" style="width:100%;max-width:300px"/>
        <p><strong>Nome oficial:</strong> ${country.name?.official || 'N/A'}</p>
        <p><strong>População:</strong> ${country.population ? country.population.toLocaleString('pt-BR') : 'N/A'}</p>
        <p><strong>Região:</strong> ${country.region || 'N/A'}</p>
        <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
    `;
    modal.classList.remove('hidden');
};
closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

/* Eventos */
searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    doSearch();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
    }
});

regionFilter.addEventListener('change', async (e) => {
    const region = e.target.value;
    showLoading();
    countriesContainer.innerHTML = '';
    if (!region) {
        renderRandomCountries();
        hideLoading();
        currentView = 'home';
        return;
    }

    const data = await getCountriesByRegion(region);
    if (data && Array.isArray(data)) {
        renderCountries(data);
        currentView = 'region';
    } else {
        countriesContainer.innerHTML = `<p>Erro ao buscar região ${region}.</p>`;
    }
    hideLoading();
});

btnFavoritos.addEventListener('click', (e) => {
    e.preventDefault();
    renderFavorites();
});


const init = async () => {
    showLoading();
    allCountriesData = await getAllCountries() || [];
    renderRandomCountries();
    updateFavCount();
    hideLoading();
};

init();