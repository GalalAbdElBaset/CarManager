/**
 * API Module - Handles all HTTP requests to Supabase REST API
 * OPTIMIZED: All filtering, sorting, pagination done on backend
 * PERFORMANCE: Lightweight filter options, no full dataset fetches
 */

const API = (function() {
    const BASE_URL = "https://pjgixwacmudsjcdjwqdc.supabase.co/rest/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2l4d2FjbXVkc2pjZGp3cWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI2MDQsImV4cCI6MjA4OTY2ODYwNH0.cXZLKO3QbW-G7hca4_8c8pH2n7suRHvvBJO6F459lkU";

    // ==================== HELPER FUNCTIONS ====================
    
    function getHeaders(method = 'GET') {
        const headers = {
            "Content-Type": "application/json",
            "apikey": API_KEY,
            "Authorization": `Bearer ${API_KEY}`
        };
        
        if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
            headers["Prefer"] = "return=representation";
        }
        
        return headers;
    }

    async function handleResponse(response) {
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const error = await response.json();
                errorMessage = error.message || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        if (response.status === 204) return true;
        return response.json();
    }

    async function fetchWithRetry(url, options, retries = 2) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fetch(url, options);
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // ==================== LIGHTWEIGHT FILTER OPTIONS (NO FULL DATASET) ====================
    
    /**
     * Get unique brands from cars (lightweight query)
     */
    async function getUniqueBrands() {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=brand&brand=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const brands = [...new Set(cars.map(c => c.brand).filter(b => b))].sort();
            return brands;
        } catch (error) {
            console.error('Error fetching unique brands:', error);
            return [];
        }
    }

    /**
     * Get unique years from cars (lightweight query)
     */
    async function getUniqueYears() {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=year&year=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const years = [...new Set(cars.map(c => c.year).filter(y => y))].sort((a, b) => b - a);
            return years;
        } catch (error) {
            console.error('Error fetching unique years:', error);
            return [];
        }
    }

    /**
     * Get unique colors from cars (lightweight query)
     */
    async function getUniqueColors() {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=color&color=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const colors = [...new Set(cars.map(c => c.color).filter(c => c))].sort();
            return colors;
        } catch (error) {
            console.error('Error fetching unique colors:', error);
            return [];
        }
    }

    /**
     * Get unique categories from cars (lightweight query)
     */
    async function getUniqueCategories() {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=category&category=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const categories = [...new Set(cars.map(c => c.category).filter(c => c))].sort();
            return categories;
        } catch (error) {
            console.error('Error fetching unique categories:', error);
            return [];
        }
    }

    /**
     * Get unique conditions from cars (lightweight query)
     */
    async function getUniqueConditions() {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=condition&condition=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const conditions = [...new Set(cars.map(c => c.condition).filter(c => c))].sort();
            return conditions;
        } catch (error) {
            console.error('Error fetching unique conditions:', error);
            return [];
        }
    }

    /**
     * Get models by brand (lightweight query)
     * @param {string} brand - Car brand
     * @returns {Promise<Array>} - Array of unique models
     */
    async function getModelsByBrand(brand) {
        if (!brand) return [];
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=model&brand=eq.${encodeURIComponent(brand)}&model=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const models = [...new Set(cars.map(c => c.model).filter(m => m))].sort();
            return models;
        } catch (error) {
            console.error('Error fetching models by brand:', error);
            return [];
        }
    }

    // ==================== SEARCH FUNCTIONS (ALL BACKEND FILTERING) ====================
    
    /**
     * Search clients with full backend filtering
     * @param {Object} filters - Search filters
     * @param {number} page - Page number (1-based)
     * @param {number} limit - Items per page
     * @param {AbortSignal} signal - AbortController signal
     * @returns {Promise<Object>} - { data, total, page, totalPages }
     */
    async function searchClients(filters = {}, page = 1, limit = 20, signal = null) {
        try {
            let url = `${BASE_URL}/clients?select=*`;
            
            if (filters.name) {
                url += `&name=ilike.*${encodeURIComponent(filters.name)}*`;
            }
            
            if (filters.phone && filters.phone.length >= 2) {
                url += `&phone=ilike.*${encodeURIComponent(filters.phone)}*`;
            }
            
            if (filters.email && filters.email.length >= 2) {
                url += `&email=ilike.*${encodeURIComponent(filters.email)}*`;
            }
            
            if (filters.notes) {
                url += `&notes=ilike.*${encodeURIComponent(filters.notes)}*`;
            }
            
            const offset = (page - 1) * limit;
            url += `&limit=${limit}&offset=${offset}`;
            
            const sortMap = {
                'name_asc': 'name.asc',
                'name_desc': 'name.desc',
                'date_new': 'registeredat.desc',
                'date_old': 'registeredat.asc',
                'relevance': 'registeredat.desc'
            };
            url += `&order=${sortMap[filters.sortBy] || 'registeredat.desc'}`;
            
            const response = await fetchWithRetry(url, {
                headers: { ...getHeaders('GET'), 'Prefer': 'count=exact' },
                signal
            });
            
            let total = 0;
            const contentRange = response.headers.get('content-range');
            if (contentRange) {
                const match = contentRange.match(/\/(\d+)/);
                if (match) total = parseInt(match[1], 10);
            }
            
            const data = await handleResponse(response);
            
            return {
                data: Array.isArray(data) ? data.map(c => ({ ...c, _type: 'client' })) : [],
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error('Error searching clients:', error);
            throw error;
        }
    }

    /**
     * Search cars with full backend filtering
     */
    async function searchCars(filters = {}, page = 1, limit = 20, signal = null) {
        try {
            let url = `${BASE_URL}/cars?select=*`;
            
            if (filters.carName) {
                const searchTerm = encodeURIComponent(filters.carName);
                url += `&or=(brand.ilike.*${searchTerm}*,model.ilike.*${searchTerm}*)`;
            }
            
            if (filters.notes) {
                url += `&notes=ilike.*${encodeURIComponent(filters.notes)}*`;
            }
            
            if (filters.brand) url += `&brand=eq.${encodeURIComponent(filters.brand)}`;
            if (filters.model) url += `&model=eq.${encodeURIComponent(filters.model)}`;
            if (filters.year) url += `&year=eq.${filters.year}`;
            if (filters.color) url += `&color=eq.${encodeURIComponent(filters.color)}`;
            if (filters.category) url += `&category=eq.${encodeURIComponent(filters.category)}`;
            if (filters.condition) url += `&condition=eq.${encodeURIComponent(filters.condition)}`;
            
            const offset = (page - 1) * limit;
            url += `&limit=${limit}&offset=${offset}`;
            
            const sortMap = {
                'name_asc': 'brand.asc,model.asc',
                'name_desc': 'brand.desc,model.desc',
                'price_asc': 'price.asc',
                'price_desc': 'price.desc',
                'year_desc': 'year.desc',
                'date_new': 'createdat.desc',
                'date_old': 'createdat.asc',
                'relevance': 'createdat.desc'
            };
            url += `&order=${sortMap[filters.sortBy] || 'createdat.desc'}`;
            
            const response = await fetchWithRetry(url, {
                headers: { ...getHeaders('GET'), 'Prefer': 'count=exact' },
                signal
            });
            
            let total = 0;
            const contentRange = response.headers.get('content-range');
            if (contentRange) {
                const match = contentRange.match(/\/(\d+)/);
                if (match) total = parseInt(match[1], 10);
            }
            
            const data = await handleResponse(response);
            
            return {
                data: Array.isArray(data) ? data.map(c => ({ ...c, _type: 'car' })) : [],
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error('Error searching cars:', error);
            throw error;
        }
    }

    /**
     * Search requests with full backend filtering
     */
    async function searchRequests(filters = {}, page = 1, limit = 20, signal = null) {
        try {
            let url = `${BASE_URL}/requests?select=*`;
            
            if (filters.status) {
                url += `&status=eq.${filters.status}`;
            }
            
            if (filters.request) {
                const searchTerm = encodeURIComponent(filters.request);
                url += `&or=(title.ilike.*${searchTerm}*,notes.ilike.*${searchTerm}*)`;
            }
            
            const offset = (page - 1) * limit;
            url += `&limit=${limit}&offset=${offset}`;
            
            const sortMap = {
                'date_new': 'createdat.desc',
                'date_old': 'createdat.asc',
                'relevance': 'createdat.desc'
            };
            url += `&order=${sortMap[filters.sortBy] || 'createdat.desc'}`;
            
            const response = await fetchWithRetry(url, {
                headers: { ...getHeaders('GET'), 'Prefer': 'count=exact' },
                signal
            });
            
            let total = 0;
            const contentRange = response.headers.get('content-range');
            if (contentRange) {
                const match = contentRange.match(/\/(\d+)/);
                if (match) total = parseInt(match[1], 10);
            }
            
            const data = await handleResponse(response);
            
            // Fetch client names for requests if needed
            if (Array.isArray(data) && data.length > 0) {
                const clientIds = [...new Set(data.map(r => r.clientid).filter(id => id))];
                if (clientIds.length > 0) {
                    const clientsMap = await getClientsMap(clientIds);
                    const dataWithClients = data.map(request => ({
                        ...request,
                        _type: 'request',
                        client_name: clientsMap.get(request.clientid) || 'Unknown Client'
                    }));
                    return { data: dataWithClients, total, page, totalPages: Math.ceil(total / limit) };
                }
            }
            
            return {
                data: Array.isArray(data) ? data.map(r => ({ ...r, _type: 'request', client_name: 'Unknown Client' })) : [],
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error('Error searching requests:', error);
            throw error;
        }
    }

    /**
     * Helper function to get clients map by IDs
     */
    async function getClientsMap(ids) {
        if (!ids || ids.length === 0) return new Map();
        
        try {
            const idsParam = ids.join(',');
            const url = `${BASE_URL}/clients?select=id,name&id=in.(${idsParam})`;
            const response = await fetch(url, { headers: getHeaders('GET') });
            
            if (!response.ok) return new Map();
            
            const clients = await handleResponse(response);
            const map = new Map();
            if (Array.isArray(clients)) {
                clients.forEach(client => {
                    map.set(client.id, client.name || 'Unknown Client');
                });
            }
            return map;
        } catch (error) {
            console.error('Error fetching clients map:', error);
            return new Map();
        }
    }

    // ==================== LEGACY COMPATIBILITY FUNCTIONS ====================
    
    async function getClients(page = 1, limit = 100) {
        const result = await searchClients({}, page, limit);
        return result.data;
    }

    async function getCars(page = 1, limit = 100) {
        const result = await searchCars({}, page, limit);
        return result.data;
    }

    async function getRequests(page = 1, limit = 100) {
        const result = await searchRequests({}, page, limit);
        return result.data;
    }

    // ==================== CRUD OPERATIONS ====================
    
    async function getClient(id) {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/clients?id=eq.${id}&select=*`, {
                headers: getHeaders('GET')
            });
            const data = await handleResponse(response);
            return data[0] || null;
        } catch (error) {
            console.error(`Error fetching client ${id}:`, error);
            throw error;
        }
    }

    async function addClient(client) {
        try {
            const newClient = {
                name: client.name,
                email: client.email || null,
                phone: client.phone || null,
                notes: client.notes || null,
                registeredat: new Date().toISOString(),
                updatedat: new Date().toISOString()
            };

            const response = await fetchWithRetry(`${BASE_URL}/clients`, {
                method: "POST",
                headers: getHeaders('POST'),
                body: JSON.stringify(newClient)
            });

            const data = await handleResponse(response);
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error('Error adding client:', error);
            throw error;
        }
    }

    async function updateClient(id, client) {
        try {
            const updatedClient = {
                name: client.name,
                email: client.email || null,
                phone: client.phone || null,
                notes: client.notes || null,
                updatedat: new Date().toISOString()
            };

            const response = await fetchWithRetry(`${BASE_URL}/clients?id=eq.${id}`, {
                method: "PATCH",
                headers: getHeaders('PATCH'),
                body: JSON.stringify(updatedClient)
            });

            const data = await handleResponse(response);
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error(`Error updating client ${id}:`, error);
            throw error;
        }
    }

    async function deleteClient(id) {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/clients?id=eq.${id}`, {
                method: "DELETE",
                headers: getHeaders('DELETE')
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error deleting client ${id}:`, error);
            throw error;
        }
    }

    async function getRequest(id) {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/requests?id=eq.${id}&select=*`, {
                headers: getHeaders('GET')
            });
            const data = await handleResponse(response);
            return data[0] || null;
        } catch (error) {
            console.error(`Error fetching request ${id}:`, error);
            throw error;
        }
    }

    async function addRequest(request) {
        try {
            const newRequest = {
                clientid: request.clientId,
                carid: request.carId,
                status: request.status,
                title: request.title || `Request - ${new Date().toLocaleDateString()}`,
                notes: request.notes || null,
                createdat: new Date().toISOString()
            };

            const response = await fetchWithRetry(`${BASE_URL}/requests`, {
                method: "POST",
                headers: getHeaders('POST'),
                body: JSON.stringify(newRequest)
            });

            const data = await handleResponse(response);
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error('Error adding request:', error);
            throw error;
        }
    }

    async function updateRequest(id, request) {
        try {
            const updatedRequest = {
                clientid: request.clientId,
                carid: request.carId,
                status: request.status,
                title: request.title,
                notes: request.notes || null
            };

            const response = await fetchWithRetry(`${BASE_URL}/requests?id=eq.${id}`, {
                method: "PATCH",
                headers: getHeaders('PATCH'),
                body: JSON.stringify(updatedRequest)
            });

            const data = await handleResponse(response);
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error(`Error updating request ${id}:`, error);
            throw error;
        }
    }

    async function deleteRequest(id) {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/requests?id=eq.${id}`, {
                method: "DELETE",
                headers: getHeaders('DELETE')
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error deleting request ${id}:`, error);
            throw error;
        }
    }

    async function getCar(id) {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?id=eq.${id}&select=*`, {
                headers: getHeaders('GET')
            });
            const data = await handleResponse(response);
            return data[0] || null;
        } catch (error) {
            console.error(`Error fetching car ${id}:`, error);
            throw error;
        }
    }

    async function addCar(car) {
        try {
            const newCar = {
                brand: car.brand,
                model: car.model,
                year: car.year,
                condition: car.condition,
                color: car.color,
                category: car.category,
                price: car.price || null,
                notes: car.notes || null,
                licenseplate: car.licensePlate || null,
                clientid: car.clientId || null,
                createdat: new Date().toISOString()
            };

            const response = await fetchWithRetry(`${BASE_URL}/cars`, {
                method: "POST",
                headers: getHeaders('POST'),
                body: JSON.stringify(newCar)
            });

            const data = await handleResponse(response);
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error('Error adding car:', error);
            throw error;
        }
    }

    async function updateCar(id, car) {
        try {
            const updatedCar = {
                brand: car.brand,
                model: car.model,
                year: car.year,
                condition: car.condition,
                color: car.color,
                category: car.category,
                price: car.price || null,
                notes: car.notes || null,
                licenseplate: car.licensePlate || null
            };

            const response = await fetchWithRetry(`${BASE_URL}/cars?id=eq.${id}`, {
                method: "PATCH",
                headers: getHeaders('PATCH'),
                body: JSON.stringify(updatedCar)
            });

            const data = await handleResponse(response);
            return Array.isArray(data) ? data[0] : data;
        } catch (error) {
            console.error(`Error updating car ${id}:`, error);
            throw error;
        }
    }

    async function deleteCar(id) {
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?id=eq.${id}`, {
                method: "DELETE",
                headers: getHeaders('DELETE')
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`Error deleting car ${id}:`, error);
            throw error;
        }
    }

    // ==================== EXPORT API ====================
    const apiExports = {
        BASE_URL,
        getHeaders,
        handleResponse,
        
        // Lightweight filter options
        getUniqueBrands,
        getUniqueYears,
        getUniqueColors,
        getUniqueCategories,
        getUniqueConditions,
        getModelsByBrand,
        
        // Search functions (backend filtering)
        searchClients,
        searchCars,
        searchRequests,
        
        // Legacy compatibility
        getClients,
        getCars,
        getRequests,
        
        // CRUD operations
        getClient,
        addClient,
        updateClient,
        deleteClient,
        getRequest,
        addRequest,
        updateRequest,
        deleteRequest,
        getCar,
        addCar,
        updateCar,
        deleteCar
    };
    
    return apiExports;
})();

window.API = API;