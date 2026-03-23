/**
 * Advanced Search Module - Professional search system
 * Features: Manual search for main fields, auto-filter for advanced filters
 */

const SearchModule = (function() {
    // ==================== STATE ====================
    let searchResults = [];
    let cachedData = { clients: [], requests: [], cars: [] };
    let allItems = [];
    let isDataLoaded = false;
    let isSearching = false;
    let lastSearchCriteria = null;
    
    // Search criteria object
    let searchCriteria = {
        clientName: '',
        phone: '',
        email: '',
        carName: '',
        request: '',
        countryCode: ''
    };
    
    let currentFilters = { 
        type: '', 
        status: '', 
        brand: '', 
        model: '',
        year: '',
        color: '', 
        category: '', 
        condition: ''
    };
    
    let currentSort = 'relevance';
    let isFiltersExpanded = true;
    let hasResults = false;
    
    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * Normalize text for search (lowercase, trim, remove extra spaces)
     */
    function normalizeText(text) {
        if (!text) return '';
        return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
    }
    
    /**
     * Normalize phone number for partial matching
     */
    function normalizePhone(phone) {
        if (!phone) return '';
        let normalized = String(phone).replace(/\D/g, '');
        if (normalized.length > 12) {
            normalized = normalized.slice(-12);
        }
        return normalized;
    }
    
    /**
     * Check if phone matches search term
     */
    function phoneMatches(phone, searchTerm, countryCode = '') {
        if (!phone || !searchTerm) return false;
        
        const normalizedPhone = normalizePhone(phone);
        const normalizedSearch = normalizePhone(searchTerm);
        
        if (normalizedSearch.length === 0) return false;
        
        if (normalizedPhone.includes(normalizedSearch)) return true;
        
        if (countryCode) {
            const phoneWithCode = countryCode + normalizedPhone;
            if (phoneWithCode.includes(normalizedSearch)) return true;
        }
        
        return false;
    }
    
    /**
     * Get car data for a request
     */
    function getCarForRequest(request) {
        return cachedData.cars.find(c => c.id == request.carid);
    }
    
    /**
     * Check if client matches search criteria
     */
    function clientMatches(client) {
        const clientName = client.name || '';
        const clientPhone = client.phone || '';
        const clientEmail = client.email || '';
        const clientNotes = client.notes || '';
        
        if (searchCriteria.clientName) {
            const searchName = normalizeText(searchCriteria.clientName);
            const normalizedName = normalizeText(clientName);
            if (!normalizedName.includes(searchName)) return false;
        }
        
        if (searchCriteria.phone) {
            if (!phoneMatches(clientPhone, searchCriteria.phone, searchCriteria.countryCode)) return false;
        }
        
        if (searchCriteria.email) {
            const searchEmail = normalizeText(searchCriteria.email);
            const normalizedEmail = normalizeText(clientEmail);
            if (!normalizedEmail.includes(searchEmail)) return false;
        }
        
        if (searchCriteria.request) {
            const searchRequest = normalizeText(searchCriteria.request);
            const normalizedNotes = normalizeText(clientNotes);
            if (!normalizedNotes.includes(searchRequest)) return false;
        }
        
        if (searchCriteria.carName) return false;
        
        return true;
    }
    
    /**
     * Check if request matches search criteria
     */
    function requestMatches(request) {
        const title = request.title || '';
        const notes = request.notes || '';
        const clientName = request.clientName || '';
        const car = getCarForRequest(request);
        const carName = car ? `${car.brand || ''} ${car.model || ''}`.trim() : '';
        
        if (searchCriteria.clientName) {
            const searchName = normalizeText(searchCriteria.clientName);
            const normalizedClientName = normalizeText(clientName);
            if (!normalizedClientName.includes(searchName)) return false;
        }
        
        if (searchCriteria.phone) {
            const client = cachedData.clients.find(c => c.id == request.clientid);
            const clientPhone = client ? client.phone : '';
            if (!phoneMatches(clientPhone, searchCriteria.phone, searchCriteria.countryCode)) return false;
        }
        
        if (searchCriteria.email) {
            const client = cachedData.clients.find(c => c.id == request.clientid);
            const clientEmail = client ? client.email : '';
            const searchEmail = normalizeText(searchCriteria.email);
            const normalizedEmail = normalizeText(clientEmail);
            if (!normalizedEmail.includes(searchEmail)) return false;
        }
        
        if (searchCriteria.request) {
            const searchRequest = normalizeText(searchCriteria.request);
            const requestText = normalizeText(`${title} ${notes}`);
            if (!requestText.includes(searchRequest)) return false;
        }
        
        if (searchCriteria.carName) {
            const searchCar = normalizeText(searchCriteria.carName);
            const normalizedCarName = normalizeText(carName);
            if (!normalizedCarName.includes(searchCar)) return false;
        }
        
        return true;
    }
    
    /**
     * Check if car matches search criteria
     */
    function carMatches(car) {
        const carName = `${car.brand || ''} ${car.model || ''}`.trim();
        const carNotes = car.notes || '';
        
        if (searchCriteria.clientName) return false;
        if (searchCriteria.phone) return false;
        if (searchCriteria.email) return false;
        
        if (searchCriteria.request) {
            const searchRequest = normalizeText(searchCriteria.request);
            const normalizedNotes = normalizeText(carNotes);
            if (!normalizedNotes.includes(searchRequest)) return false;
        }
        
        if (searchCriteria.carName) {
            const searchCar = normalizeText(searchCriteria.carName);
            const normalizedCarName = normalizeText(carName);
            if (!normalizedCarName.includes(searchCar)) return false;
        }
        
        return true;
    }
    
    /**
     * Apply all filters to an item
     */
    function passesAllFilters(item) {
        // TYPE FILTER
        if (currentFilters.type && currentFilters.type !== '') {
            if (item._type !== currentFilters.type) return false;
        }
        
        // STATUS FILTER - ONLY for requests
        if (currentFilters.status && currentFilters.status !== '') {
            if (item._type === 'request') {
                const itemStatus = item.status || '';
                if (itemStatus !== currentFilters.status) return false;
            }
        }
        
        // CAR FILTERS
        let carData = null;
        
        if (item._type === 'car') {
            carData = item;
        } else if (item._type === 'request') {
            carData = getCarForRequest(item);
        }
        
        const hasCarFilters = currentFilters.brand || currentFilters.model || 
                              currentFilters.year || currentFilters.color || 
                              currentFilters.category || currentFilters.condition;
        
        if (hasCarFilters && !carData) {
            return false;
        }
        
        if (!carData) {
            return true;
        }
        
        // Brand filter
        if (currentFilters.brand && currentFilters.brand !== '') {
            const carBrand = normalizeText(carData.brand || '');
            const filterBrand = normalizeText(currentFilters.brand);
            if (carBrand !== filterBrand) return false;
        }
        
        // Model filter
        if (currentFilters.model && currentFilters.model !== '') {
            const carModel = normalizeText(carData.model || '');
            const filterModel = normalizeText(currentFilters.model);
            if (carModel !== filterModel) return false;
        }
        
        // Year filter
        if (currentFilters.year && currentFilters.year !== '') {
            const carYear = carData.year ? carData.year.toString() : '';
            const filterYear = currentFilters.year.toString();
            if (carYear !== filterYear) return false;
        }
        
        // Color filter
        if (currentFilters.color && currentFilters.color !== '') {
            const carColor = normalizeText(carData.color || '');
            const filterColor = normalizeText(currentFilters.color);
            if (carColor !== filterColor) return false;
        }
        
        // Category filter
        if (currentFilters.category && currentFilters.category !== '') {
            const carCategory = normalizeText(carData.category || '');
            const filterCategory = normalizeText(currentFilters.category);
            if (carCategory !== filterCategory) return false;
        }
        
        // Condition filter
        if (currentFilters.condition && currentFilters.condition !== '') {
            const carCondition = normalizeText(carData.condition || '');
            const filterCondition = normalizeText(currentFilters.condition);
            if (carCondition !== filterCondition) return false;
        }
        
        return true;
    }
    
    /**
     * Sort results based on selected sort option
     */
    function sortResults(items, sortBy) {
        const getName = (item) => {
            switch (item._type) {
                case 'client': return item.name || '';
                case 'request': return item.title || '';
                case 'car': return `${item.brand || ''} ${item.model || ''}`.trim();
                default: return '';
            }
        };
        
        const getDate = (item) => {
            switch (item._type) {
                case 'client': return item.registeredat || item.registeredAt || item.createdAt || '';
                case 'request': return item.createdAt || item.createdat || '';
                case 'car': return item.createdAt || item.createdat || '';
                default: return '';
            }
        };
        
        const getRelevanceScore = (item) => {
            let score = 0;
            const itemText = JSON.stringify(item).toLowerCase();
            
            if (searchCriteria.clientName && itemText.includes(searchCriteria.clientName.toLowerCase())) score += 10;
            if (searchCriteria.phone && itemText.includes(searchCriteria.phone.toLowerCase())) score += 8;
            if (searchCriteria.email && itemText.includes(searchCriteria.email.toLowerCase())) score += 8;
            if (searchCriteria.carName && itemText.includes(searchCriteria.carName.toLowerCase())) score += 10;
            if (searchCriteria.request && itemText.includes(searchCriteria.request.toLowerCase())) score += 5;
            
            return score;
        };
        
        const sorted = [...items];
        
        switch (sortBy) {
            case 'name_asc':
                sorted.sort((a, b) => getName(a).localeCompare(getName(b)));
                break;
            case 'name_desc':
                sorted.sort((a, b) => getName(b).localeCompare(getName(a)));
                break;
            case 'date_new':
                sorted.sort((a, b) => {
                    const dateA = new Date(getDate(a) || 0);
                    const dateB = new Date(getDate(b) || 0);
                    return dateB - dateA;
                });
                break;
            case 'date_old':
                sorted.sort((a, b) => {
                    const dateA = new Date(getDate(a) || 0);
                    const dateB = new Date(getDate(b) || 0);
                    return dateA - dateB;
                });
                break;
            default:
                sorted.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));
                break;
        }
        
        return sorted;
    }
    
    /**
     * Escape HTML for safe display
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Highlight search keywords in text
     */
    function highlightText(text, searchTerm) {
        if (!text || !searchTerm) return escapeHtml(text);
        
        const escapedText = escapeHtml(text);
        const normalizedSearch = normalizeText(searchTerm);
        
        if (normalizedSearch.length === 0) return escapedText;
        
        const regex = new RegExp(`(${normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escapedText.replace(regex, '<span class="highlight">$1</span>');
    }
    
    /**
     * Format condition for display
     */
    function formatCondition(condition) {
        if (!condition) return 'Not specified';
        const conditions = {
            'excellent': 'Excellent',
            'very_good': 'Very Good',
            'good': 'Good',
            'fair': 'Fair',
            'needs_maintenance': 'Needs Maintenance'
        };
        return conditions[condition] || condition;
    }
    
    /**
     * Format price for display
     */
    function formatPrice(price) {
        if (!price) return 'Price on request';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
    
    // ==================== UI RENDERING ====================
    
    /**
     * Create client result card
     */
    function createClientCard(client) {
        const highlightedName = highlightText(client.name || 'Unnamed Client', searchCriteria.clientName);
        const highlightedPhone = highlightText(client.phone || 'No phone', searchCriteria.phone);
        const highlightedEmail = client.email ? highlightText(client.email, searchCriteria.email) : '';
        const highlightedNotes = client.notes ? highlightText(client.notes, searchCriteria.request) : '';
        
        return `
            <div class="result-card" data-type="client" data-id="${escapeHtml(client.id)}">
                <div class="result-header">
                    <div class="result-icon client">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="result-title">
                        <h4>${highlightedName}</h4>
                        <div class="result-type">Client</div>
                    </div>
                </div>
                <div class="result-details">
                    <span class="detail-badge">
                        <i class="fa-solid fa-phone"></i> ${highlightedPhone}
                    </span>
                    ${highlightedEmail ? `
                    <span class="detail-badge">
                        <i class="fa-solid fa-envelope"></i> ${highlightedEmail}
                    </span>
                    ` : ''}
                    ${highlightedNotes ? `
                    <span class="detail-badge">
                        <i class="fa-regular fa-note-sticky"></i> ${highlightedNotes.substring(0, 50)}${highlightedNotes.length > 50 ? '...' : ''}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Create request result card
     */
    function createRequestCard(request) {
        const status = request.status || 'pending';
        const statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';
        const statusIcon = status === 'active' ? 'fa-play-circle' : status === 'pending' ? 'fa-clock' : 'fa-check-circle';
        
        const highlightedTitle = highlightText(request.title || 'Untitled Request', searchCriteria.request);
        const highlightedClientName = highlightText(request.clientName || 'Unknown', searchCriteria.clientName);
        const highlightedNotes = request.notes ? highlightText(request.notes, searchCriteria.request) : '';
        
        const car = getCarForRequest(request);
        const carName = car ? `${car.brand || ''} ${car.model || ''}`.trim() : 'No car';
        const highlightedCarName = highlightText(carName, searchCriteria.carName);
        
        return `
            <div class="result-card" data-type="request" data-id="${escapeHtml(request.id)}">
                <div class="result-header">
                    <div class="result-icon request">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div class="result-title">
                        <h4>${highlightedTitle}</h4>
                        <div class="result-type">Request</div>
                    </div>
                </div>
                <div class="result-details">
                    <span class="detail-badge">
                        <i class="fa-solid fa-user"></i> ${highlightedClientName}
                    </span>
                    <span class="detail-badge">
                        <i class="fa-solid fa-car"></i> ${highlightedCarName}
                    </span>
                    <span class="status-badge status-${status}">
                        <i class="fa-solid ${statusIcon}"></i> ${statusText}
                    </span>
                    ${highlightedNotes ? `
                    <span class="detail-badge">
                        <i class="fa-regular fa-note-sticky"></i> ${highlightedNotes.substring(0, 50)}${highlightedNotes.length > 50 ? '...' : ''}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Create car result card
     */
    function createCarCard(car) {
        const carName = `${car.brand || ''} ${car.model || ''}`.trim();
        const highlightedCarName = highlightText(carName, searchCriteria.carName);
        const highlightedNotes = car.notes ? highlightText(car.notes, searchCriteria.request) : '';
        
        return `
            <div class="result-card" data-type="car" data-id="${escapeHtml(car.id)}">
                <div class="result-header">
                    <div class="result-icon car">
                        <i class="fa-solid fa-car"></i>
                    </div>
                    <div class="result-title">
                        <h4>${highlightedCarName} (${escapeHtml(car.year || '')})</h4>
                        <div class="result-type">Car</div>
                    </div>
                </div>
                <div class="result-details">
                    <span class="detail-badge">
                        <i class="fa-solid fa-calendar"></i> ${escapeHtml(car.year || 'N/A')}
                    </span>
                    <span class="detail-badge">
                        <i class="fa-solid fa-tag"></i> ${escapeHtml(car.category || 'Not specified')}
                    </span>
                    <span class="detail-badge">
                        <i class="fa-solid fa-palette"></i> ${escapeHtml(car.color || 'Not specified')}
                    </span>
                    <span class="detail-badge">
                        <i class="fa-solid fa-clipboard-check"></i> ${escapeHtml(formatCondition(car.condition))}
                    </span>
                    <span class="detail-badge">
                        <i class="fa-solid fa-dollar-sign"></i> ${formatPrice(car.price)}
                    </span>
                    ${highlightedNotes ? `
                    <span class="detail-badge">
                        <i class="fa-regular fa-note-sticky"></i> ${highlightedNotes.substring(0, 50)}${highlightedNotes.length > 50 ? '...' : ''}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Display initial placeholder message
     */
    function showPlaceholder() {
        const container = document.getElementById('search-results');
        const countElement = document.getElementById('results-count');
        
        if (!container) return;
        
        if (countElement) countElement.textContent = '0';
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>Enter search criteria in the fields above and click Search, or use advanced filters to refine results</p>
            </div>
        `;
        hasResults = false;
    }
    
    /**
     * Show loading spinner
     */
    function showLoading() {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="loading-spinner">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Searching...</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Display search results
     */
    function displayResults() {
        const container = document.getElementById('search-results');
        const countElement = document.getElementById('results-count');
        
        if (!container) return;
        
        if (searchResults.length === 0) {
            const hasMainSearch = searchCriteria.clientName || searchCriteria.phone || 
                                   searchCriteria.email || searchCriteria.carName || 
                                   searchCriteria.request;
            const hasFilters = currentFilters.type || currentFilters.status || 
                              currentFilters.brand || currentFilters.model || 
                              currentFilters.year || currentFilters.color || 
                              currentFilters.category || currentFilters.condition;
            
            if (hasMainSearch || hasFilters) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-search"></i>
                        <p>No results found matching your criteria</p>
                        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Try adjusting your search terms or filters</p>
                    </div>
                `;
            } else {
                showPlaceholder();
            }
            if (countElement) countElement.textContent = '0';
            hasResults = false;
            return;
        }
        
        if (countElement) countElement.textContent = searchResults.length;
        hasResults = true;
        
        let html = '';
        searchResults.forEach(item => {
            if (item._type === 'client') {
                html += createClientCard(item);
            } else if (item._type === 'request') {
                html += createRequestCard(item);
            } else if (item._type === 'car') {
                html += createCarCard(item);
            }
        });
        
        container.innerHTML = html;
    }
    
    /**
     * Update filter dropdowns with unique values from data
     */
    function updateFilterDropdowns() {
        const cars = cachedData.cars || [];
        
        // Update brands dropdown
        const brands = [...new Set(cars.map(car => car.brand).filter(b => b && b.trim()))].sort();
        const brandSelect = document.getElementById('filter-brand');
        if (brandSelect) {
            const currentValue = brandSelect.value;
            brandSelect.innerHTML = '<option value="">All Brands</option>';
            brands.forEach(brand => {
                brandSelect.innerHTML += `<option value="${escapeHtml(brand)}" ${currentValue === brand ? 'selected' : ''}>${escapeHtml(brand)}</option>`;
            });
        }
        
        // Update years dropdown
        const years = [...new Set(cars.map(car => car.year).filter(y => y && y.toString().trim()))].sort((a, b) => b - a);
        const yearSelect = document.getElementById('filter-year');
        if (yearSelect) {
            const currentValue = yearSelect.value;
            yearSelect.innerHTML = '<option value="">All Years</option>';
            years.forEach(year => {
                yearSelect.innerHTML += `<option value="${escapeHtml(year)}" ${currentValue === year.toString() ? 'selected' : ''}>${escapeHtml(year)}</option>`;
            });
        }
        
        // Update colors dropdown
        const colors = [...new Set(cars.map(car => car.color).filter(c => c && c.trim()))].sort();
        const colorSelect = document.getElementById('filter-color');
        if (colorSelect) {
            const currentValue = colorSelect.value;
            colorSelect.innerHTML = '<option value="">All Colors</option>';
            colors.forEach(color => {
                colorSelect.innerHTML += `<option value="${escapeHtml(color)}" ${currentValue === color ? 'selected' : ''}>${escapeHtml(color)}</option>`;
            });
        }
        
        // Update models based on selected brand
        updateModelDropdown();
    }
    
    /**
     * Update model dropdown based on selected brand
     */
    function updateModelDropdown() {
        const cars = cachedData.cars || [];
        const selectedBrand = currentFilters.brand;
        
        let models = [];
        if (selectedBrand && selectedBrand !== '') {
            models = [...new Set(cars
                .filter(car => car.brand && normalizeText(car.brand) === normalizeText(selectedBrand))
                .map(car => car.model)
                .filter(m => m && m.trim()))]
                .sort();
        } else {
            models = [...new Set(cars.map(car => car.model).filter(m => m && m.trim()))].sort();
        }
        
        const modelSelect = document.getElementById('filter-model');
        if (modelSelect) {
            const currentValue = modelSelect.value;
            modelSelect.innerHTML = '<option value="">All Models</option>';
            models.forEach(model => {
                modelSelect.innerHTML += `<option value="${escapeHtml(model)}" ${currentValue === model ? 'selected' : ''}>${escapeHtml(model)}</option>`;
            });
        }
    }
    
    /**
     * Check if there are any active search criteria from main fields
     */
    function hasActiveMainSearch() {
        return !!(searchCriteria.clientName || searchCriteria.phone || 
                  searchCriteria.email || searchCriteria.carName || 
                  searchCriteria.request);
    }
    
    /**
     * Check if there are any active filters
     */
    function hasActiveFilters() {
        return !!(currentFilters.type || currentFilters.status || 
                  currentFilters.brand || currentFilters.model || 
                  currentFilters.year || currentFilters.color || 
                  currentFilters.category || currentFilters.condition);
    }
    
    // ==================== SEARCH EXECUTION ====================
    
    /**
     * Load all data from API (only when needed for search)
     */
    async function loadDataIfNeeded() {
        if (isDataLoaded) return true;
        
        try {
            const [clients, requests, cars] = await Promise.all([
                API.getClients().catch(() => []),
                API.getRequests().catch(() => []),
                API.getCars().catch(() => [])
            ]);
            
            cachedData = { clients, requests, cars };
            updateFilterDropdowns();
            isDataLoaded = true;
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            App.showToast('Failed to load data', 'error');
            return false;
        }
    }
    
    /**
     * Perform the actual search with current criteria and filters
     */
    async function executeSearch() {
        if (isSearching) return;
        
        isSearching = true;
        showLoading();
        
        try {
            const dataLoaded = await loadDataIfNeeded();
            if (!dataLoaded) {
                showPlaceholder();
                isSearching = false;
                return;
            }
            
            // Prepare all items for search
            allItems = [
                ...cachedData.clients.map(item => ({ ...item, _type: 'client' })),
                ...cachedData.requests.map(item => {
                    const client = cachedData.clients.find(c => c.id == item.clientid);
                    const car = cachedData.cars.find(c => c.id == item.carid);
                    return {
                        ...item,
                        clientName: client ? client.name : 'Unknown',
                        carData: car || null,
                        _type: 'request'
                    };
                }),
                ...cachedData.cars.map(item => ({ ...item, _type: 'car' }))
            ];
            
            // STEP 1: Apply search criteria (main search fields)
            let filteredItems = allItems.filter(item => {
                if (item._type === 'client') {
                    return clientMatches(item);
                } else if (item._type === 'request') {
                    return requestMatches(item);
                } else if (item._type === 'car') {
                    return carMatches(item);
                }
                return false;
            });
            
            // STEP 2: Apply filters (advanced filters)
            filteredItems = filteredItems.filter(item => passesAllFilters(item));
            
            // STEP 3: Sort results
            searchResults = sortResults(filteredItems, currentSort);
            
            // STEP 4: Display results
            displayResults();
            
            console.log(`✅ Search completed: ${searchResults.length} results found`);
            
        } catch (error) {
            console.error('Search error:', error);
            const container = document.getElementById('search-results');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>Error performing search. Please try again.</p>
                    </div>
                `;
            }
            App.showToast('Error performing search', 'error');
        } finally {
            isSearching = false;
        }
    }
    
    /**
     * Perform search - called by Search button
     * Updates search criteria from main fields and executes search
     */
    async function performSearch() {
        // Get search values from DOM (main fields only)
        searchCriteria.clientName = document.getElementById('search-client-name')?.value.trim() || '';
        searchCriteria.phone = document.getElementById('search-phone')?.value.trim() || '';
        searchCriteria.countryCode = document.getElementById('search-country-code')?.value || '';
        searchCriteria.email = document.getElementById('search-email')?.value.trim() || '';
        searchCriteria.carName = document.getElementById('search-car-name')?.value.trim() || '';
        searchCriteria.request = document.getElementById('search-request')?.value.trim() || '';
        
        // Execute search
        await executeSearch();
    }
    
    /**
     * Apply filters and re-search - called when filters change
     * Only re-executes search if there are existing results or main search criteria
     */
    async function applyFiltersAndSearch() {
        // Only execute search if there are existing results OR main search criteria exists
        await executeSearch();
    }
    
    /**
     * Clear all search fields and filters
     */
    async function clearAllSearch() {
        // Clear main search inputs
        const searchClientName = document.getElementById('search-client-name');
        const searchPhone = document.getElementById('search-phone');
        const searchCountryCode = document.getElementById('search-country-code');
        const searchEmail = document.getElementById('search-email');
        const searchCarName = document.getElementById('search-car-name');
        const searchRequest = document.getElementById('search-request');
        
        if (searchClientName) searchClientName.value = '';
        if (searchPhone) searchPhone.value = '';
        if (searchCountryCode) searchCountryCode.value = '+20';
        if (searchEmail) searchEmail.value = '';
        if (searchCarName) searchCarName.value = '';
        if (searchRequest) searchRequest.value = '';
        
        // Clear filters
        const filterType = document.getElementById('filter-type');
        const filterStatus = document.getElementById('filter-status');
        const filterBrand = document.getElementById('filter-brand');
        const filterModel = document.getElementById('filter-model');
        const filterYear = document.getElementById('filter-year');
        const filterColor = document.getElementById('filter-color');
        const filterCategory = document.getElementById('filter-category');
        const filterCondition = document.getElementById('filter-condition');
        
        if (filterType) filterType.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterBrand) filterBrand.value = '';
        if (filterModel) filterModel.value = '';
        if (filterYear) filterYear.value = '';
        if (filterColor) filterColor.value = '';
        if (filterCategory) filterCategory.value = '';
        if (filterCondition) filterCondition.value = '';
        
        // Reset current filters and search criteria
        currentFilters = { 
            type: '', 
            status: '', 
            brand: '', 
            model: '',
            year: '',
            color: '', 
            category: '', 
            condition: ''
        };
        
        searchCriteria = {
            clientName: '',
            phone: '',
            email: '',
            carName: '',
            request: '',
            countryCode: ''
        };
        
        // Clear results and show placeholder
        searchResults = [];
        showPlaceholder();
        
        App.showToast('All search fields and filters cleared', 'success', 1500);
    }
    
    /**
     * Handle result click to navigate to details
     */
    function handleResultClick(e) {
        const card = e.target.closest('.result-card');
        if (!card) return;
        
        const type = card.dataset.type;
        const id = card.dataset.id;
        
        if (!type || !id) return;
        
        sessionStorage.setItem('viewItem', JSON.stringify({ type, id }));
        
        const page = type === 'client' ? 'index.html' : type === 'request' ? 'requests.html' : 'cars.html';
        window.location.href = page;
    }
    
    /**
     * Toggle filters section
     */
    function toggleFilters() {
        isFiltersExpanded = !isFiltersExpanded;
        const content = document.getElementById('filters-content');
        const header = document.getElementById('filters-toggle');
        
        if (content) {
            if (isFiltersExpanded) {
                content.classList.remove('collapsed');
                header?.classList.remove('collapsed');
            } else {
                content.classList.add('collapsed');
                header?.classList.add('collapsed');
            }
        }
    }
    
    /**
     * Check for stored item to view
     */
    function checkStoredItem() {
        const stored = sessionStorage.getItem('viewItem');
        if (stored) {
            try {
                const { type, id } = JSON.parse(stored);
                sessionStorage.removeItem('viewItem');
                
                setTimeout(() => {
                    if (type === 'client' && window.ClientsModule) {
                        ClientsModule.viewClientDetails(id);
                    } else if (type === 'request' && window.RequestsModule) {
                        RequestsModule.loadRequestDetails(id);
                    } else if (type === 'car' && window.CarsModule) {
                        CarsModule.viewCarDetails(id);
                    }
                }, 300);
            } catch (e) {
                console.error('Error parsing stored item:', e);
            }
        }
    }
    
    // ==================== EVENT BINDING ====================
    
    /**
     * Bind all event listeners
     */
    function bindEvents() {
        // Search button (for main fields)
        const searchBtn = document.getElementById('apply-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        // Clear button
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllSearch);
        }
        
        // FILTERS - Auto-search when changed (without needing Search button)
        const filterType = document.getElementById('filter-type');
        const filterStatus = document.getElementById('filter-status');
        const filterBrand = document.getElementById('filter-brand');
        const filterModel = document.getElementById('filter-model');
        const filterYear = document.getElementById('filter-year');
        const filterColor = document.getElementById('filter-color');
        const filterCategory = document.getElementById('filter-category');
        const filterCondition = document.getElementById('filter-condition');
        
        // Filter change handler for auto-search
        const filterChangeHandler = () => {
            // Update current filters from DOM
            currentFilters.type = document.getElementById('filter-type')?.value || '';
            currentFilters.status = document.getElementById('filter-status')?.value || '';
            currentFilters.brand = document.getElementById('filter-brand')?.value || '';
            currentFilters.model = document.getElementById('filter-model')?.value || '';
            currentFilters.year = document.getElementById('filter-year')?.value || '';
            currentFilters.color = document.getElementById('filter-color')?.value || '';
            currentFilters.category = document.getElementById('filter-category')?.value || '';
            currentFilters.condition = document.getElementById('filter-condition')?.value || '';
            
            // Apply filters and re-search automatically
            applyFiltersAndSearch();
        };
        
        // Special handler for brand filter (updates model dropdown)
        const brandChangeHandler = () => {
            currentFilters.brand = document.getElementById('filter-brand')?.value || '';
            updateModelDropdown();
            // Apply filters and re-search
            applyFiltersAndSearch();
        };
        
        if (filterType) filterType.addEventListener('change', filterChangeHandler);
        if (filterStatus) filterStatus.addEventListener('change', filterChangeHandler);
        if (filterBrand) filterBrand.addEventListener('change', brandChangeHandler);
        if (filterModel) filterModel.addEventListener('change', filterChangeHandler);
        if (filterYear) filterYear.addEventListener('change', filterChangeHandler);
        if (filterColor) filterColor.addEventListener('change', filterChangeHandler);
        if (filterCategory) filterCategory.addEventListener('change', filterChangeHandler);
        if (filterCondition) filterCondition.addEventListener('change', filterChangeHandler);
        
        // Sort change - auto-sort results
        const sortSelect = document.getElementById('sort-results');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                if (searchResults.length > 0) {
                    searchResults = sortResults(searchResults, currentSort);
                    displayResults();
                }
            });
        }
        
        // Results container click
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.addEventListener('click', handleResultClick);
        }
        
        // Filters toggle
        const filtersToggle = document.getElementById('filters-toggle');
        if (filtersToggle) {
            filtersToggle.addEventListener('click', toggleFilters);
        }
        
        // Enter key support for main search fields (triggers search button)
        const searchInputs = ['search-client-name', 'search-phone', 'search-email', 'search-car-name', 'search-request'];
        searchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        performSearch();
                    }
                });
            }
        });
    }
    
    // ==================== INITIALIZATION ====================
    
    /**
     * Initialize the search module
     */
    async function init() {
        console.log('🔍 Advanced Search Module Initialized - Auto-filter enabled for advanced filters');
        
        // Show placeholder message on page load
        showPlaceholder();
        
        // Bind events
        bindEvents();
        
        // Check if there's a stored item to view
        checkStoredItem();
    }
    
    // Public API
    return {
        init,
        performSearch,
        clearAllSearch,
        refreshData: () => {
            isDataLoaded = false;
            performSearch();
        },
        checkStoredItem,
        hasActiveMainSearch,
        hasActiveFilters
    };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('search-screen')) {
        SearchModule.init();
    }
});

window.SearchModule = SearchModule;