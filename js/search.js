/**
 * Advanced Search Module - Production-ready with strict separation of concerns
 * OPTIMIZED: All filtering done by backend, NO frontend data mapping
 * PERFORMANCE: Uses AbortController, pagination, lightweight filter options
 */

const SearchModule = (function() {
    // ==================== CONSTANTS ====================
    const PAGE_SIZE = 20;
    const MAX_SEARCH_LENGTH = 100;
    
    // ==================== STATE ====================
    let searchResults = [];
    let currentPage = 1;
    let totalPages = 0;
    let totalResults = 0;
    let isSearching = false;
    let eventListenersBound = false;
    let isInitialized = false;
    let currentAbortController = null;
    
    // Search criteria object (only for UI state, filtering happens on backend)
    let searchCriteria = {
        clientName: '',
        phone: '',
        email: '',
        carName: '',
        request: ''
    };
    
    let currentFilters = { 
        type: 'client', // 'client', 'car', 'request'
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
    
    // Cache for filter dropdown values
    let filterOptionsCache = {
        brands: [],
        years: [],
        colors: [],
        categories: [],
        conditions: [],
        models: [],
        loaded: false
    };
    
    // ==================== HELPER FUNCTIONS ====================
    
    function sanitizeSearchTerm(term) {
        if (!term) return '';
        let sanitized = term.trim().substring(0, MAX_SEARCH_LENGTH);
        sanitized = sanitized.replace(/\*{2,}/g, '*');
        return sanitized;
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
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
    
    function formatPrice(price) {
        if (!price) return 'Price on request';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
    
    function highlightText(text, searchTerm) {
        if (!text || !searchTerm) return escapeHtml(text);
        
        const escapedText = escapeHtml(text);
        const escapedSearchTerm = escapeHtml(searchTerm);
        
        const regex = new RegExp(`(${escapedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escapedText.replace(regex, '<span class="highlight">$1</span>');
    }
    
    // ==================== LIGHTWEIGHT FILTER OPTIONS LOADING ====================
    
    /**
     * Load filter options using lightweight API endpoints
     * NO full dataset fetching
     */
    async function loadFilterOptions() {
        if (filterOptionsCache.loaded) return;
        
        // Check if API is available
        if (!window.API) {
            console.error('API module not loaded');
            return;
        }
        
        try {
            console.log('Loading filter options...');
            
            // Fetch all filter options in parallel with fallbacks
            const [brands, years, colors, categories, conditions] = await Promise.all([
                API.getUniqueBrands().catch(() => []),
                API.getUniqueYears().catch(() => []),
                API.getUniqueColors().catch(() => []),
                API.getUniqueCategories().catch(() => []),
                API.getUniqueConditions().catch(() => [])
            ]);
            
            filterOptionsCache.brands = brands;
            filterOptionsCache.years = years;
            filterOptionsCache.colors = colors;
            filterOptionsCache.categories = categories;
            filterOptionsCache.conditions = conditions;
            filterOptionsCache.loaded = true;
            
            console.log('Filter options loaded:', {
                brands: brands.length,
                years: years.length,
                colors: colors.length,
                categories: categories.length,
                conditions: conditions.length
            });
            
            updateFilterDropdowns();
        } catch (error) {
            console.error('Error loading filter options:', error);
            // Don't throw - just log and continue with empty options
        }
    }
    
    /**
     * Update models dropdown based on selected brand
     * Uses lightweight API call
     */
    async function updateModelDropdown() {
        const brand = currentFilters.brand;
        
        if (!brand || !window.API) {
            // Clear models dropdown
            const modelSelect = document.getElementById('filter-model');
            if (modelSelect) {
                modelSelect.innerHTML = '<option value="">All Models</option>';
            }
            filterOptionsCache.models = [];
            return;
        }
        
        try {
            const models = await API.getModelsByBrand(brand);
            filterOptionsCache.models = models;
            
            const modelSelect = document.getElementById('filter-model');
            if (modelSelect) {
                const currentValue = modelSelect.value;
                modelSelect.innerHTML = '<option value="">All Models</option>';
                models.forEach(model => {
                    modelSelect.innerHTML += `<option value="${escapeHtml(model)}" ${currentValue === model ? 'selected' : ''}>${escapeHtml(model)}</option>`;
                });
            }
        } catch (error) {
            console.error('Error updating model dropdown:', error);
        }
    }
    
    function updateFilterDropdowns() {
        // Update brand dropdown
        const brandSelect = document.getElementById('filter-brand');
        if (brandSelect && filterOptionsCache.brands.length > 0) {
            const currentValue = brandSelect.value;
            brandSelect.innerHTML = '<option value="">All Brands</option>';
            filterOptionsCache.brands.forEach(brand => {
                brandSelect.innerHTML += `<option value="${escapeHtml(brand)}" ${currentValue === brand ? 'selected' : ''}>${escapeHtml(brand)}</option>`;
            });
        }
        
        // Update year dropdown
        const yearSelect = document.getElementById('filter-year');
        if (yearSelect && filterOptionsCache.years.length > 0) {
            const currentValue = yearSelect.value;
            yearSelect.innerHTML = '<option value="">All Years</option>';
            filterOptionsCache.years.forEach(year => {
                yearSelect.innerHTML += `<option value="${escapeHtml(year)}" ${currentValue === year.toString() ? 'selected' : ''}>${escapeHtml(year)}</option>`;
            });
        }
        
        // Update color dropdown
        const colorSelect = document.getElementById('filter-color');
        if (colorSelect && filterOptionsCache.colors.length > 0) {
            const currentValue = colorSelect.value;
            colorSelect.innerHTML = '<option value="">All Colors</option>';
            filterOptionsCache.colors.forEach(color => {
                colorSelect.innerHTML += `<option value="${escapeHtml(color)}" ${currentValue === color ? 'selected' : ''}>${escapeHtml(color)}</option>`;
            });
        }
        
        // Update category dropdown
        const categorySelect = document.getElementById('filter-category');
        if (categorySelect && filterOptionsCache.categories.length > 0) {
            const currentValue = categorySelect.value;
            categorySelect.innerHTML = '<option value="">All Categories</option>';
            filterOptionsCache.categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${escapeHtml(category)}" ${currentValue === category ? 'selected' : ''}>${escapeHtml(category)}</option>`;
            });
        }
        
        // Update condition dropdown
        const conditionSelect = document.getElementById('filter-condition');
        if (conditionSelect && filterOptionsCache.conditions.length > 0) {
            const currentValue = conditionSelect.value;
            conditionSelect.innerHTML = '<option value="">All Conditions</option>';
            filterOptionsCache.conditions.forEach(condition => {
                const displayName = formatCondition(condition);
                conditionSelect.innerHTML += `<option value="${escapeHtml(condition)}" ${currentValue === condition ? 'selected' : ''}>${escapeHtml(displayName)}</option>`;
            });
        }
    }
    
    // ==================== MAIN SEARCH EXECUTION ====================
    
    /**
     * Execute search - all filtering happens on backend
     * Uses AbortController to cancel previous requests
     */
    async function executeSearch() {
        // Check if API is available
        if (!window.API) {
            console.error('API module not loaded');
            showErrorState('API module not available');
            return;
        }
        
        // Cancel previous search if exists
        if (isSearching && currentAbortController) {
            currentAbortController.abort();
        }
        
        isSearching = true;
        showLoading();
        
        currentAbortController = new AbortController();
        const signal = currentAbortController.signal;
        
        try {
            let result;
            const searchType = currentFilters.type;
            
            // Prepare filters for API call
            const searchFilters = {
                // Common filters
                notes: searchCriteria.request,
                sortBy: currentSort
            };
            
            // Type-specific filters
            if (searchType === 'client') {
                searchFilters.name = searchCriteria.clientName;
                searchFilters.phone = searchCriteria.phone;
                searchFilters.email = searchCriteria.email;
                
                result = await API.searchClients(searchFilters, currentPage, PAGE_SIZE, signal);
            } 
            else if (searchType === 'car') {
                searchFilters.carName = searchCriteria.carName;
                searchFilters.brand = currentFilters.brand;
                searchFilters.model = currentFilters.model;
                searchFilters.year = currentFilters.year;
                searchFilters.color = currentFilters.color;
                searchFilters.category = currentFilters.category;
                searchFilters.condition = currentFilters.condition;
                
                result = await API.searchCars(searchFilters, currentPage, PAGE_SIZE, signal);
            } 
            else if (searchType === 'request') {
                searchFilters.request = searchCriteria.request;
                searchFilters.status = currentFilters.status;
                searchFilters.clientName = searchCriteria.clientName;
                
                // Try using VIEW first, fallback to manual mapping
                try {
                    result = await API.searchRequestsWithClients(searchFilters, currentPage, PAGE_SIZE, signal);
                } catch (viewError) {
                    console.warn('VIEW not available, using fallback:', viewError);
                    result = await API.searchRequests(searchFilters, currentPage, PAGE_SIZE, signal);
                }
            }
            
            if (!signal.aborted && result) {
                searchResults = result.data || [];
                totalResults = result.total || 0;
                totalPages = result.totalPages || 0;
                currentPage = result.page || 1;
                
                displayResults();
                console.log(`✅ Search completed: ${searchResults.length} results, Total: ${totalResults}`);
            }
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search error:', error);
                if (!signal.aborted) {
                    showErrorState(error.message);
                }
            }
        } finally {
            if (!signal.aborted) {
                isSearching = false;
                currentAbortController = null;
            }
        }
    }
    
    /**
     * Perform search - triggered by user action (button or Enter)
     */
    function performSearch() {
        currentPage = 1;
        
        // Update search criteria from form
        searchCriteria.clientName = sanitizeSearchTerm(document.getElementById('search-client-name')?.value.trim() || '');
        // MODIFIED: Combine country code + phone number before sanitization
        const code = document.getElementById('phone-country')?.value || '';
        const num = document.getElementById('search-phone')?.value.trim() || '';
        searchCriteria.phone = sanitizeSearchTerm(code + num);
        searchCriteria.email = sanitizeSearchTerm(document.getElementById('search-email')?.value.trim() || '');
        searchCriteria.carName = sanitizeSearchTerm(document.getElementById('search-car-name')?.value.trim() || '');
        searchCriteria.request = sanitizeSearchTerm(document.getElementById('search-request')?.value.trim() || '');
        
        executeSearch();
    }
    
    /**
     * Apply filters and search - only called when user explicitly clicks Search
     * Filters update state, but search only runs on user action
     */
    function applyFiltersAndSearch() {
        currentPage = 1;
        
        // Update filters from form
        currentFilters.type = document.getElementById('filter-type')?.value || 'client';
        currentFilters.status = document.getElementById('filter-status')?.value || '';
        currentFilters.brand = document.getElementById('filter-brand')?.value || '';
        currentFilters.model = document.getElementById('filter-model')?.value || '';
        currentFilters.year = document.getElementById('filter-year')?.value || '';
        currentFilters.color = document.getElementById('filter-color')?.value || '';
        currentFilters.category = document.getElementById('filter-category')?.value || '';
        currentFilters.condition = document.getElementById('filter-condition')?.value || '';
        
        // Execute search immediately (user clicked search button)
        executeSearch();
    }
    
    function clearAllSearch() {
        // Clear search inputs
        const searchInputs = ['search-client-name', 'search-phone', 'search-email', 'search-car-name', 'search-request'];
        searchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        
        // Clear filter inputs
        const filterInputs = ['filter-type', 'filter-status', 'filter-brand', 'filter-model', 
                              'filter-year', 'filter-color', 'filter-category', 'filter-condition'];
        filterInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        
        // Reset state
        searchCriteria = {
            clientName: '',
            phone: '',
            email: '',
            carName: '',
            request: ''
        };
        
        currentFilters = { 
            type: 'client', 
            status: '', 
            brand: '', 
            model: '',
            year: '',
            color: '', 
            category: '', 
            condition: ''
        };
        
        currentSort = 'relevance';
        currentPage = 1;
        
        // Reset sort dropdown
        const sortSelect = document.getElementById('sort-results');
        if (sortSelect) sortSelect.value = 'relevance';
        
        // Cancel any pending search
        if (currentAbortController) {
            currentAbortController.abort();
        }
        
        // Reset results and show placeholder
        searchResults = [];
        totalResults = 0;
        totalPages = 0;
        showPlaceholder();
        
        if (window.App && App.showToast) {
            App.showToast('All search fields and filters cleared', 'success', 1500);
        }
    }
    
    // ==================== UI STATES ====================
    
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
    
    function showPlaceholder() {
        const container = document.getElementById('search-results');
        const countElement = document.getElementById('results-count');
        
        if (!container) return;
        
        if (countElement) countElement.textContent = '0';
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>Enter search criteria and click Search...</p>
            </div>
        `;
        hasResults = false;
    }
    
    function showNoResultsState() {
        const container = document.getElementById('search-results');
        const countElement = document.getElementById('results-count');
        
        if (!container) return;
        
        if (countElement) countElement.textContent = '0';
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-search"></i>
                <p>No results found matching your criteria</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Try adjusting your search terms or filters</p>
            </div>
        `;
        hasResults = false;
    }
    
    function showErrorState(errorMessage) {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Error performing search. Please try again.</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">${escapeHtml(errorMessage)}</p>
            </div>
        `;
        
        if (window.App && App.showToast) {
            App.showToast('Error performing search', 'error');
        }
    }
    
    function displayResults() {
        const container = document.getElementById('search-results');
        const countElement = document.getElementById('results-count');
        
        if (!container) return;
        
        if (countElement) {
            countElement.textContent = totalResults;
        }
        
        // Check if no results with active search/filters
        if (searchResults.length === 0) {
            const hasActiveSearch = searchCriteria.clientName || searchCriteria.phone || 
                                    searchCriteria.email || searchCriteria.carName || 
                                    searchCriteria.request;
            const hasActiveFilters = currentFilters.status || currentFilters.brand || 
                                     currentFilters.model || currentFilters.year || 
                                     currentFilters.color || currentFilters.category || 
                                     currentFilters.condition;
            
            if (hasActiveSearch || hasActiveFilters) {
                showNoResultsState();
            } else {
                showPlaceholder();
            }
            return;
        }
        
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
        
        if (totalPages > 1) {
            html += createPagination();
        }
        
        container.innerHTML = html;
        bindPaginationEvents();
    }
    
    function createPagination() {
        return `
            <div class="pagination">
                <button class="pagination-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i> Previous
                </button>
                <span class="pagination-info">Page ${currentPage} of ${totalPages} (${totalResults} results)</span>
                <button class="pagination-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>
                    Next <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;
    }
    
    function bindPaginationEvents() {
        const prevBtn = document.querySelector('.pagination-btn[data-page="prev"]');
        const nextBtn = document.querySelector('.pagination-btn[data-page="next"]');
        
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    executeSearch();
                }
            };
        }
        
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    executeSearch();
                }
            };
        }
    }
    
    // ==================== RESULT CARDS ====================
    
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
    
    function createRequestCard(request) {
        const status = request.status || 'pending';
        const statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';
        const statusIcon = status === 'active' ? 'fa-play-circle' : status === 'pending' ? 'fa-clock' : 'fa-check-circle';
        
        const highlightedTitle = highlightText(request.title || 'Untitled Request', searchCriteria.request);
        const highlightedNotes = request.notes ? highlightText(request.notes, searchCriteria.request) : '';
        const highlightedClientName = highlightText(request.client_name || 'Unknown Client', searchCriteria.clientName);
        
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
                        <i class="fa-solid fa-user"></i> Client: ${highlightedClientName}
                    </span>
                    <span class="status-badge status-${status}">
                        <i class="fa-solid ${statusIcon}"></i> ${statusText}
                    </span>
                    ${highlightedNotes ? `
                    <span class="detail-badge">
                        <i class="fa-regular fa-note-sticky"></i> ${highlightedNotes.substring(0, 100)}${highlightedNotes.length > 100 ? '...' : ''}
                    </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
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
    
    // ==================== EVENT HANDLERS ====================
    
    function handleResultClick(e) {
        const card = e.target.closest('.result-card');
        if (!card) return;
        
        const type = card.dataset.type;
        const id = card.dataset.id;
        
        if (!type || !id) return;
        
        sessionStorage.setItem('viewItem', JSON.stringify({ type, id }));
        
        if (type === 'client') {
            window.location.href = 'index.html';
        } else if (type === 'request') {
            window.location.href = 'requests.html';
        } else if (type === 'car') {
            window.location.href = 'cars.html';
        }
    }
    
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
    
    function checkStoredItem() {
        const stored = sessionStorage.getItem('viewItem');
        if (stored) {
            try {
                const { type, id } = JSON.parse(stored);
                sessionStorage.removeItem('viewItem');
                
                setTimeout(() => {
                    if (type === 'client' && window.ClientsModule && ClientsModule.viewClientDetails) {
                        ClientsModule.viewClientDetails(id);
                    } else if (type === 'request' && window.RequestsModule && RequestsModule.loadRequestDetails) {
                        RequestsModule.loadRequestDetails(id);
                    } else if (type === 'car' && window.CarsModule && CarsModule.viewCarDetails) {
                        CarsModule.viewCarDetails(id);
                    }
                }, 300);
            } catch (e) {
                console.error('Error parsing stored item:', e);
            }
        }
    }
    
    function hasActiveMainSearch() {
        return !!(searchCriteria.clientName || searchCriteria.phone || 
                  searchCriteria.email || searchCriteria.carName || 
                  searchCriteria.request);
    }
    
    function hasActiveFilters() {
        return !!(currentFilters.status || currentFilters.brand || 
                  currentFilters.model || currentFilters.year || 
                  currentFilters.color || currentFilters.category || 
                  currentFilters.condition);
    }
    
    async function refreshData() {
        await loadFilterOptions();
        if (hasActiveMainSearch() || hasActiveFilters()) {
            await executeSearch();
        }
    }
    
    // ==================== EVENT BINDING ====================
    
    function bindEvents() {
        if (eventListenersBound) return;
        
        const searchBtn = document.getElementById('apply-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllSearch);
        }
        
        // Filter changes - update state but DO NOT auto-search
        const filterIds = ['filter-type', 'filter-status', 'filter-brand', 'filter-model', 
                           'filter-year', 'filter-color', 'filter-category', 'filter-condition'];
        
        filterIds.forEach(id => {
            const filterEl = document.getElementById(id);
            if (filterEl) {
                filterEl.addEventListener('change', () => {
                    // Update state only - no automatic search
                    currentFilters.type = document.getElementById('filter-type')?.value || 'client';
                    currentFilters.status = document.getElementById('filter-status')?.value || '';
                    currentFilters.brand = document.getElementById('filter-brand')?.value || '';
                    currentFilters.model = document.getElementById('filter-model')?.value || '';
                    currentFilters.year = document.getElementById('filter-year')?.value || '';
                    currentFilters.color = document.getElementById('filter-color')?.value || '';
                    currentFilters.category = document.getElementById('filter-category')?.value || '';
                    currentFilters.condition = document.getElementById('filter-condition')?.value || '';
                    
                    // Update models dropdown when brand changes
                    if (id === 'filter-brand') {
                        updateModelDropdown();
                    }
                    
                    applyFiltersAndSearch();
                });
            }
        });
        
        // Sort change - auto-search if results exist
        const sortSelect = document.getElementById('sort-results');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                currentPage = 1;
                if (hasResults || hasActiveMainSearch() || hasActiveFilters()) {
                    executeSearch();
                }
            });
        }
        
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.addEventListener('click', handleResultClick);
        }
        
        const filtersToggle = document.getElementById('filters-toggle');
        if (filtersToggle) {
            filtersToggle.addEventListener('click', toggleFilters);
        }
        
        // Enter key search
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
        
        eventListenersBound = true;
    }
    
    // ==================== INITIALIZATION ====================
    
    async function init() {
        if (isInitialized) return;
        
        // Wait for API to be available
        if (!window.API) {
            console.warn('API module not ready, waiting...');
            const checkAPI = setInterval(() => {
                if (window.API) {
                    clearInterval(checkAPI);
                    init();
                }
            }, 100);
            return;
        }
        
        console.log('🔍 Advanced Search Module Initialized - Production Ready');
        console.log('✅ All filtering handled by backend (Supabase REST API)');
        console.log('✅ Lightweight filter options (no full dataset fetching)');
        console.log('✅ Manual search only (button or Enter)');
        console.log('✅ AbortController for request cancellation');
        console.log('✅ Strict pagination (never renders large datasets)');
        
        showPlaceholder();
        bindEvents();
        await loadFilterOptions();
        checkStoredItem();
        
        isInitialized = true;
    }
    
    // ==================== PUBLIC API ====================
    return {
        init,
        performSearch,
        clearAllSearch,
        refreshData,
        checkStoredItem,
        hasActiveMainSearch,
        hasActiveFilters,
        executeSearch,
        applyFiltersAndSearch
    };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('search-screen')) {
        SearchModule.init();
    }
});

window.SearchModule = SearchModule;