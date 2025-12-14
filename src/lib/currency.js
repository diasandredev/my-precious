
const API_BASE_URL = import.meta.env.VITE_CURRENCY_API_URL || 'https://economia.awesomeapi.com.br';
const API_TO = import.meta.env.VITE_CURRENCY_API_TO;


export async function fetchExchangeRates(dateStr, currencies = []) {
    // currencies is an array of strings, e.g., ['USD', 'EUR']
    // Filter out BRL as it is the base currency & unique check
    const targetCurrencies = [...new Set(currencies.filter(c => c !== 'BRL' && c))];

    if (targetCurrencies.length === 0) {
        return {};
    }

    // AwesomeAPI expects YYYYMMDD for historical
    const dateObj = new Date(dateStr);
    const today = new Date();
    // Simple check if same day
    const isToday = dateObj.toDateString() === today.toDateString();

    const formattedDate = dateStr.replace(/-/g, '');

    // Construct the currency pairs string, e.g., "USD-BRL,EUR-BRL"
    const pairs = targetCurrencies.map(c => `${c}-BRL`).join(',');

    const fetchOptions = {
        method: 'GET',
        headers: {}
    };

    if (API_TO) {
        fetchOptions.headers['x-api-key'] = API_TO;
    }

    try {
        if (isToday) {
            const response = await fetch(`${API_BASE_URL}/last/${pairs}`, fetchOptions);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            // Map response back to simplified object: { USD: 5.2, EUR: 6.1 }
            const result = {};
            targetCurrencies.forEach(curr => {
                const key = `${curr}BRL`;
                if (data[key]) {
                    result[curr] = parseFloat(data[key].bid);
                }
            });
            return result;
        } else {
            // Historical
            // AwesomeAPI /json/daily/:moeda/:dias supports historical
            // We fetch each currency in parallel for historical data logic robustness

            const fetchWithFallback = async (curr, targetDate, attempts = 0) => {
                if (attempts > 7) return { curr, data: [] }; // Give up after a week back

                const dateString = targetDate.toISOString().slice(0, 10).replace(/-/g, '');

                try {
                    const res = await fetch(`${API_BASE_URL}/json/daily/${curr}-BRL/?start_date=${dateString}&end_date=${dateString}`, fetchOptions);
                    if (!res.ok) throw new Error('Network response was not ok');

                    const data = await res.json();

                    // If empty, try previous day
                    if (!data || data.length === 0) {
                        const prevDate = new Date(targetDate);
                        prevDate.setDate(prevDate.getDate() - 1);
                        return fetchWithFallback(curr, prevDate, attempts + 1);
                    }

                    return { curr, data };
                } catch (err) {
                    console.warn(`Failed to fetch ${curr} for ${dateString}, retrying prev day...`, err);
                    // On error, also try previous day? Or just fail? 
                    // Let's assume on error we might want to fail or retry. 
                    // For now, let's treat it like empty data to be robust if it's just missing data error
                    const prevDate = new Date(targetDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    return fetchWithFallback(curr, prevDate, attempts + 1);
                }
            };

            const requests = targetCurrencies.map(curr => fetchWithFallback(curr, dateObj));

            const results = await Promise.all(requests);

            const rates = {};
            results.forEach(({ curr, data }) => {
                const rate = data[0]?.bid ? parseFloat(data[0].bid) : 0;
                if (rate > 0) rates[curr] = rate;
            });

            return rates;
        }
    } catch (error) {
        console.error("Failed to fetch exchange rates", error);
        return {};
    }
}
