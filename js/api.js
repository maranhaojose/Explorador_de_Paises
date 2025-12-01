const BASE_URL = 'https://restcountries.com/v3.1';

const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
    }
    return await response.json();
};

export const getAllCountries = async () => {
    try {
        const response = await fetch(`${BASE_URL}/all`);
        return await handleResponse(response);
    } catch (error) {
        console.error("Falha ao buscar todos os países:", error);
        return null;
    }
};

export const getCountryByName = async (name) => {
    try {
        const response = await fetch(`${BASE_URL}/name/${encodeURIComponent(name)}`);
        return await handleResponse(response);
    } catch (error) {
        console.error(`Falha ao buscar o país "${name}":`, error);
        return null;
    }
};

export const getCountriesByRegion = async (region) => {
    try {
        const response = await fetch(`${BASE_URL}/region/${encodeURIComponent(region)}`);
        return await handleResponse(response);
    } catch (error) {
        console.error(`Falha ao buscar a região "${region}":`, error);
        return null;
    }
};