/**
 * API Module - Handles all HTTP requests to Supabase REST API
 * OPTIMIZED: All filtering, sorting, pagination done on backend
 * PERFORMANCE: Lightweight filter options, no full dataset fetches
 * ADDED: Caching layer, centralized error handling, debouncing
 */

const API = (function() {
    const BASE_URL = "https://pjgixwacmudsjcdjwqdc.supabase.co/rest/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2l4d2FjbXVkc2pjZGp3cWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI2MDQsImV4cCI6MjA4OTY2ODYwNH0.cXZLKO3QbW-G7hca4_8c8pH2n7suRHvvBJO6F459lkU";
    
    // ==================== CONSTANTS ====================
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const DEBOUNCE_DELAY = 300; // 300ms for search debouncing
    const EXPAND_HEIGHT = 180; // Smart expand height threshold
    const DEFAULT_PAGE_LIMIT = 20;
    
    // ==================== CACHE LAYER ====================
    const cache = new Map();
    
    function getCached(key) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }
    
    function setCached(key, data) {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    function clearCache(pattern = null) {
        if (!pattern) {
            cache.clear();
            return;
        }
        
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
    }
    
    // ==================== CENTRALIZED ERROR HANDLER ====================
    class APIError extends Error {
        constructor(message, status, originalError = null) {
            super(message);
            this.name = 'APIError';
            this.status = status;
            this.originalError = originalError;
            this.timestamp = new Date().toISOString();
        }
    }
    
    function handleError(error, context = '') {
        console.error(`[API Error - ${context}]:`, error);
        
        // User-friendly error messages
        let userMessage = 'An error occurred while connecting to the server';
        
        if (error.name === 'AbortError') {
            userMessage = 'Request was cancelled';
        } else if (error.status === 404) {
            userMessage = 'Data not found';
        } else if (error.status === 401 || error.status === 403) {
            userMessage = 'Access denied';
        } else if (error.status === 429) {
            userMessage = 'Too many requests, please try again later';
        } else if (error.message?.toLowerCase().includes('network')) {
            userMessage = 'Network connection failed';
        }
        
        // Dispatch error event for UI handling
        window.dispatchEvent(new CustomEvent('apiError', {
            detail: {
                message: userMessage,
                originalError: error,
                context
            }
        }));
        
        throw new APIError(userMessage, error.status || 500, error);
    }
    
    // ==================== DEBOUNCE UTILITY ====================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
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

    // ==================== VALIDATION UTILITIES ====================
    const Validator = {
        validateRequired(value, fieldName) {
            if (!value || String(value).trim() === '') {
                throw new Error(`${fieldName} is required`);
            }
            return true;
        },
        
        validateEmail(email) {
            if (!email) return true; // Email is optional
            const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
            return true;
        },
        
        validatePhone(phone) {
            if (!phone) return true; // Phone is optional
            const phoneRegex = /^[\d\s\-+()]{8,20}$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('Invalid phone number format');
            }
            return true;
        },
        
        validateYear(year) {
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear + 1) {
                throw new Error(`Year must be between 1900 and ${currentYear + 1}`);
            }
            return true;
        },
        
        validatePrice(price) {
            if (price !== null && price !== undefined && price !== '') {
                const numPrice = Number(price);
                if (isNaN(numPrice) || numPrice < 0) {
                    throw new Error('Price must be a positive number');
                }
            }
            return true;
        }
    };

    // ==================== LIGHTWEIGHT FILTER OPTIONS (WITH CACHING) ====================
    
    async function getUniqueBrands() {
        const cacheKey = 'unique_brands';
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=brand&brand=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const brands = [...new Set(cars.map(c => c.brand).filter(b => b))].sort();
            setCached(cacheKey, brands);
            return brands;
        } catch (error) {
            return handleError(error, 'getUniqueBrands');
        }
    }

    async function getUniqueYears() {
        const cacheKey = 'unique_years';
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=year&year=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const years = [...new Set(cars.map(c => c.year).filter(y => y))].sort((a, b) => b - a);
            setCached(cacheKey, years);
            return years;
        } catch (error) {
            return handleError(error, 'getUniqueYears');
        }
    }

    async function getUniqueColors() {
        const cacheKey = 'unique_colors';
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=color&color=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const colors = [...new Set(cars.map(c => c.color).filter(c => c))].sort();
            setCached(cacheKey, colors);
            return colors;
        } catch (error) {
            return handleError(error, 'getUniqueColors');
        }
    }

    async function getUniqueCategories() {
        const cacheKey = 'unique_categories';
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=category&category=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const categories = [...new Set(cars.map(c => c.category).filter(c => c))].sort();
            setCached(cacheKey, categories);
            return categories;
        } catch (error) {
            return handleError(error, 'getUniqueCategories');
        }
    }

    async function getUniqueConditions() {
        const cacheKey = 'unique_conditions';
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=condition&condition=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const conditions = [...new Set(cars.map(c => c.condition).filter(c => c))].sort();
            setCached(cacheKey, conditions);
            return conditions;
        } catch (error) {
            return handleError(error, 'getUniqueConditions');
        }
    }

    async function getModelsByBrand(brand) {
        if (!brand) return [];
        
        const cacheKey = `models_${brand}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetchWithRetry(`${BASE_URL}/cars?select=model&brand=eq.${encodeURIComponent(brand)}&model=not.is.null`, {
                headers: getHeaders('GET')
            });
            const cars = await handleResponse(response);
            const models = [...new Set(cars.map(c => c.model).filter(m => m))].sort();
            setCached(cacheKey, models);
            return models;
        } catch (error) {
            return handleError(error, 'getModelsByBrand');
        }
    }

    // ==================== SEARCH FUNCTIONS (WITH DEBOUNCE SUPPORT) ====================
    
    async function searchClients(filters = {}, page = 1, limit = DEFAULT_PAGE_LIMIT, signal = null) {
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
            return handleError(error, 'searchClients');
        }
    }

    async function searchCars(filters = {}, page = 1, limit = DEFAULT_PAGE_LIMIT, signal = null) {
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
            return handleError(error, 'searchCars');
        }
    }

    async function searchRequests(filters = {}, page = 1, limit = DEFAULT_PAGE_LIMIT, signal = null) {
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
            return handleError(error, 'searchRequests');
        }
    }

    async function getClientsMap(ids) {
        if (!ids || ids.length === 0) return new Map();
        
        const cacheKey = `clients_map_${ids.sort().join(',')}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;
        
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
            setCached(cacheKey, map);
            return map;
        } catch (error) {
            return handleError(error, 'getClientsMap');
        }
    }

    // ==================== SERVICE LAYER (Decoupled from direct API calls) ====================
    
    const ClientsService = {
        getAll: (filters = {}, page = 1, limit = DEFAULT_PAGE_LIMIT, signal = null) => {
            return searchClients(filters, page, limit, signal);
        },
        
        getById: async (id) => {
            try {
                const response = await fetchWithRetry(`${BASE_URL}/clients?id=eq.${id}&select=*`, {
                    headers: getHeaders('GET')
                });
                const data = await handleResponse(response);
                return data[0] || null;
            } catch (error) {
                return handleError(error, 'getClientById');
            }
        },
        
        create: async (client) => {
            try {
                Validator.validateRequired(client.name, 'Name');
                Validator.validateEmail(client.email);
                Validator.validatePhone(client.phone);
                
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
                clearCache('clients');
                return Array.isArray(data) ? data[0] : data;
            } catch (error) {
                return handleError(error, 'createClient');
            }
        },
        
        update: async (id, client) => {
            try {
                Validator.validateRequired(client.name, 'Name');
                Validator.validateEmail(client.email);
                Validator.validatePhone(client.phone);
                
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
                clearCache('clients');
                return Array.isArray(data) ? data[0] : data;
            } catch (error) {
                return handleError(error, 'updateClient');
            }
        },
        
        delete: async (id) => {
            try {
                const response = await fetchWithRetry(`${BASE_URL}/clients?id=eq.${id}`, {
                    method: "DELETE",
                    headers: getHeaders('DELETE')
                });
                clearCache('clients');
                return await handleResponse(response);
            } catch (error) {
                return handleError(error, 'deleteClient');
            }
        }
    };
    
    const CarsService = {
        getAll: (filters = {}, page = 1, limit = DEFAULT_PAGE_LIMIT, signal = null) => {
            return searchCars(filters, page, limit, signal);
        },
        
        getById: async (id) => {
            try {
                const response = await fetchWithRetry(`${BASE_URL}/cars?id=eq.${id}&select=*`, {
                    headers: getHeaders('GET')
                });
                const data = await handleResponse(response);
                return data[0] || null;
            } catch (error) {
                return handleError(error, 'getCarById');
            }
        },
        
        create: async (car) => {
            try {
                Validator.validateRequired(car.brand, 'Brand');
                Validator.validateRequired(car.model, 'Model');
                Validator.validateYear(car.year);
                Validator.validatePrice(car.price);
                
                const newCar = {
                    brand: car.brand,
                    model: car.model,
                    year: car.year,
                    condition: car.condition,
                    color: car.color,
                    category: car.category,
                    price: car.price || null,
                    notes: car.notes || null,
                    licenseplate: car.licenseplate || null,
                    clientid: car.clientId || null,
                    createdat: new Date().toISOString()
                };

                const response = await fetchWithRetry(`${BASE_URL}/cars`, {
                    method: "POST",
                    headers: getHeaders('POST'),
                    body: JSON.stringify(newCar)
                });

                const data = await handleResponse(response);
                clearCache('cars');
                clearCache('unique_');
                return Array.isArray(data) ? data[0] : data;
            } catch (error) {
                return handleError(error, 'createCar');
            }
        },
        
        update: async (id, car) => {
            try {
                Validator.validateRequired(car.brand, 'Brand');
                Validator.validateRequired(car.model, 'Model');
                Validator.validateYear(car.year);
                Validator.validatePrice(car.price);
                
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
                clearCache('cars');
                clearCache('unique_');
                return Array.isArray(data) ? data[0] : data;
            } catch (error) {
                return handleError(error, 'updateCar');
            }
        },
        
        delete: async (id) => {
            try {
                const response = await fetchWithRetry(`${BASE_URL}/cars?id=eq.${id}`, {
                    method: "DELETE",
                    headers: getHeaders('DELETE')
                });
                clearCache('cars');
                clearCache('unique_');
                return await handleResponse(response);
            } catch (error) {
                return handleError(error, 'deleteCar');
            }
        }
    };
    
    const RequestsService = {
        getAll: (filters = {}, page = 1, limit = DEFAULT_PAGE_LIMIT, signal = null) => {
            return searchRequests(filters, page, limit, signal);
        },
        
        getById: async (id) => {
            try {
                const response = await fetchWithRetry(`${BASE_URL}/requests?id=eq.${id}&select=*`, {
                    headers: getHeaders('GET')
                });
                const data = await handleResponse(response);
                return data[0] || null;
            } catch (error) {
                return handleError(error, 'getRequestById');
            }
        },
        
        create: async (request) => {
            try {
                Validator.validateRequired(request.clientId, 'Client ID');
                
                const newRequest = {
                    clientid: request.clientId,
                    carid: request.carId || null,
                    status: request.status || 'pending',
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
                clearCache('requests');
                return Array.isArray(data) ? data[0] : data;
            } catch (error) {
                return handleError(error, 'createRequest');
            }
        },
        
        update: async (id, request) => {
            try {
                const updatedRequest = {
                    clientid: request.clientId,
                    carid: request.carId || null,
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
                clearCache('requests');
                return Array.isArray(data) ? data[0] : data;
            } catch (error) {
                return handleError(error, 'updateRequest');
            }
        },
        
        delete: async (id) => {
            try {
                const response = await fetchWithRetry(`${BASE_URL}/requests?id=eq.${id}`, {
                    method: "DELETE",
                    headers: getHeaders('DELETE')
                });
                clearCache('requests');
                return await handleResponse(response);
            } catch (error) {
                return handleError(error, 'deleteRequest');
            }
        }
    };
    
    // ==================== SMART EXPAND UTILITY ====================
    const SmartExpand = {
        EXPAND_HEIGHT,
        
        shouldExpand(element, container) {
            const rect = element.getBoundingClientRect();
            const containerRect = container?.getBoundingClientRect() || {
                top: 0,
                bottom: window.innerHeight
            };
            
            const spaceBelow = containerRect.bottom - rect.bottom;
            const spaceAbove = rect.top - containerRect.top;
            const neededSpace = this.EXPAND_HEIGHT;
            
            // Smart decision: expand if there's enough space either direction
            // Prefer direction with more space
            if (spaceBelow >= neededSpace) return 'down';
            if (spaceAbove >= neededSpace) return 'up';
            
            // If neither has enough space, use direction with more available space
            if (spaceBelow > spaceAbove) return 'down';
            if (spaceAbove > spaceBelow) return 'up';
            
            return null; // No expansion needed
        }
    };

    // ==================== EXPORT API ====================
    const apiExports = {
        // Constants
        DEFAULT_PAGE_LIMIT,
        EXPAND_HEIGHT: SmartExpand.EXPAND_HEIGHT,
        
        // Utilities
        debounce: (func) => debounce(func, DEBOUNCE_DELAY),
        clearCache,
        Validator,
        SmartExpand,
        
        // Lightweight filter options
        getUniqueBrands,
        getUniqueYears,
        getUniqueColors,
        getUniqueCategories,
        getUniqueConditions,
        getModelsByBrand,
        
        // Service Layer (Recommended for UI)
        Clients: ClientsService,
        Cars: CarsService,
        Requests: RequestsService,
        
        // Direct search functions (for custom implementations)
        searchClients,
        searchCars,
        searchRequests,
        
        // Legacy CRUD operations (for backward compatibility)
        getClient: ClientsService.getById,
        addClient: ClientsService.create,
        updateClient: ClientsService.update,
        deleteClient: ClientsService.delete,
        
        getCar: CarsService.getById,
        addCar: CarsService.create,
        updateCar: CarsService.update,
        deleteCar: CarsService.delete,
        
        getRequest: RequestsService.getById,
        addRequest: RequestsService.create,
        updateRequest: RequestsService.update,
        deleteRequest: RequestsService.delete,
        
        // Legacy list functions (deprecated - use search functions with pagination)
        getClients: (page = 1, limit = DEFAULT_PAGE_LIMIT) => searchClients({}, page, limit).then(r => r.data),
        getCars: (page = 1, limit = DEFAULT_PAGE_LIMIT) => searchCars({}, page, limit).then(r => r.data),
        getRequests: (page = 1, limit = DEFAULT_PAGE_LIMIT) => searchRequests({}, page, limit).then(r => r.data)
    };
    
    return apiExports;
})();

window.API = API;