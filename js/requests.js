/**
 * Requests Dashboard Module - Complete with Cache Layer
 * Handles both CRUD operations and Dashboard UI rendering
 */

// ==================== CONSTANTS ====================
const CONSTANTS = {
    STATUS: {
        ACTIVE: 'active',
        PENDING: 'pending',
        COMPLETED: 'completed'
    },
    STATUS_DISPLAY: {
        active: 'Active',
        pending: 'Pending',
        completed: 'Completed'
    },
    STATUS_ICON: {
        active: 'fa-play-circle',
        pending: 'fa-clock',
        completed: 'fa-check-circle'
    },
    STATUS_CLASS: {
        active: 'status-active',
        pending: 'status-pending',
        completed: 'status-completed'
    },
    SCREENS: {
        LIST: 'requests-list',
        DASHBOARD: 'dashboard',
        ADD: 'add-request',
        EDIT: 'edit-request',
        DETAILS: 'request-details'
    }
};

const INITIAL_LOAD_COUNT = 5;
const LOAD_STEP = 5;
const CACHE_TTL = {
    REQUESTS: 30000,
    REQUESTS_LIST: 30000,
    SINGLE_REQUEST: 30000,
    CLIENTS: 60000,
    CARS: 60000
};

// ==================== UI ABSTRACTION LAYER ====================
const UI = {
    showScreen: (screenId) => {
        if (window.App?.showScreen) {
            window.App.showScreen(screenId);
        } else {
            console.warn('App.showScreen not available');
        }
    },
    
    showToast: (message, type = 'info', duration = 3000) => {
        if (window.App?.showToast) {
            window.App.showToast(message, type, duration);
        } else if (window.showToast) {
            window.showToast(message, type, duration);
        } else {
            console.log(`[Toast] ${type}: ${message}`);
        }
    },
    
    confirm: (message) => {
        return confirm(message);
    },
    
    // Custom confirmation popup with custom buttons
    showConfirmationPopup: (message, onConfirm, onCancel) => {
        const confirmed = confirm(message);
        if (confirmed) {
            onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    }
};
// ==================== VALIDATION FUNCTIONS ====================

/**
 * Check if the selected car is already requested by the same client
 * Validates against existing requests to prevent duplicates
 * NEW: Handles completed requests differently (asks for confirmation)
 */
async function validateDuplicateRequest(clientId, carId, excludeRequestId = null) {
    try {
        const requests = await cachedGetRequests();
        
        // Find existing request with same client and car
        const existingRequest = requests.find(req => {
            const isSameClient = Number(req.clientid) === Number(clientId);
            const isSameCar = Number(req.carid) === Number(carId);
            const isDifferent = excludeRequestId ? Number(req.id) !== Number(excludeRequestId) : true;
            return isSameClient && isSameCar && isDifferent;
        });
        
        if (existingRequest) {
            // If request is ACTIVE or PENDING -> BLOCK completely
            if (existingRequest.status === CONSTANTS.STATUS.ACTIVE || 
                existingRequest.status === CONSTANTS.STATUS.PENDING) {
                const statusText = existingRequest.status === CONSTANTS.STATUS.ACTIVE ? 'Active' : 'Pending';
                return {
                    isValid: false,
                    isBlocked: true,
                    message: `❌ This client already has a ${statusText} request for this car. Please complete or cancel the existing request first.`
                };
            }
            
            // If request is COMPLETED -> Ask for confirmation
            if (existingRequest.status === CONSTANTS.STATUS.COMPLETED) {
                return {
                    isValid: false,
                    isBlocked: false,
                    isCompleted: true,
                    message: `⚠️ This client previously requested this car (Completed). Do you want to create a new request?`,
                    existingRequestId: existingRequest.id
                };
            }
        }
        
        return { isValid: true };
    } catch (error) {
        console.error('Error checking duplicate request:', error);
        return { isValid: true, error: true };
    }
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const existingError = field.parentElement?.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #e63946; font-size: 12px; margin-top: 4px;';
    errorDiv.textContent = message;
    
    field.parentElement?.appendChild(errorDiv);
    
    setTimeout(() => {
        field.classList.remove('error');
        errorDiv.remove();
    }, 3000);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('error');
    const errorDiv = field.parentElement?.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}
// ==================== CACHE SERVICE WITH DEDUPLICATION ====================
class CacheService {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    generateKey(endpoint, params = {}) {
        return `${endpoint}:${JSON.stringify(params)}`;
    }

    isValid(entry) {
        return entry && (Date.now() - entry.timestamp) < entry.ttl;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (entry && this.isValid(entry)) {
            return entry.data;
        }
        if (entry) {
            this.cache.delete(key);
        }
        return null;
    }

    set(key, data, ttl) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        });
    }

    hasPending(key) {
        return this.pendingRequests.has(key);
    }

    getPending(key) {
        return this.pendingRequests.get(key);
    }

    setPending(key, promise) {
        this.pendingRequests.set(key, promise);
    }

    deletePending(key) {
        this.pendingRequests.delete(key);
    }

    clear(key) {
        if (key) {
            this.cache.delete(key);
        }
    }

    clearAll() {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    clearByPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    getStats() {
        let valid = 0;
        for (const entry of this.cache.values()) {
            if (this.isValid(entry)) valid++;
        }
        return {
            total: this.cache.size,
            valid: valid,
            expired: this.cache.size - valid,
            pending: this.pendingRequests.size
        };
    }
}

// ==================== STATE MANAGEMENT ====================
const RequestsData = {
    allRequests: [],
    clientsMap: new Map(),
    carsMap: new Map(),
    cacheService: new CacheService()
};

const UIState = {
    totalLoadedCount: INITIAL_LOAD_COUNT,
    step: LOAD_STEP,
    previousScreen: CONSTANTS.SCREENS.DASHBOARD
};

const DOM = {
    tbody: null,
    mobileContainer: null,
    loadMoreContainer: null,
    loadMoreBtn: null,
    viewAllBtn: null
};

let isInitialized = false;
let resizeTimeout = null;
let pendingAddRequestData = null; // Store pending add request data for confirmation

// ==================== HELPER FUNCTIONS ====================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#39;';
        return m;
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const timestamp = Date.parse(dateString);
    if (isNaN(timestamp)) return 'Invalid date';
    try {
        return new Date(timestamp).toLocaleDateString('en-GB');
    } catch {
        return 'Invalid date';
    }
}

function formatDateLong(dateString) {
    if (!dateString) return 'No date';
    const timestamp = Date.parse(dateString);
    if (isNaN(timestamp)) return 'Invalid date';
    try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Invalid date';
    }
}

function getStatusClass(status) {
    if (status === CONSTANTS.STATUS.COMPLETED) return 'completed';
    if (status === CONSTANTS.STATUS.ACTIVE) return 'active';
    return 'pending';
}

function getStatusIcon(status) {
    if (status === CONSTANTS.STATUS.COMPLETED) return 'fa-check-circle';
    if (status === CONSTANTS.STATUS.ACTIVE) return 'fa-play-circle';
    return 'fa-clock';
}

function getSafeTimestamp(dateString) {
    if (!dateString) return 0;
    const timestamp = Date.parse(dateString);
    return isNaN(timestamp) ? 0 : timestamp;
}

function saveCurrentScreen() {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen?.id) {
        UIState.previousScreen = activeScreen.id;
    }
}

function goBackToPreviousScreen() {
    if (UIState.previousScreen === CONSTANTS.SCREENS.DASHBOARD) {
        const dashboardSection = document.getElementById(CONSTANTS.SCREENS.DASHBOARD);
        if (dashboardSection) {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
                screen.style.display = 'none';
            });
            dashboardSection.style.display = 'block';
            dashboardSection.classList.add('active');
        }
    } else {
        UI.showScreen(UIState.previousScreen);
    }
}

function showError(container, message = 'Error loading requests') {
    if (!container) return;
    const errorHtml = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${escapeHtml(message)}</p><p style="font-size: 0.85rem; margin-top: 0.5rem;">Please try again later</p></div>`;
    container.innerHTML = errorHtml;
}

function setButtonLoading(btn, isLoading, originalText = null) {
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        if (!btn.getAttribute('data-original-text')) {
            btn.setAttribute('data-original-text', btn.innerHTML);
        }
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="btn-text">Loading...</span>';
    } else {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        const original = btn.getAttribute('data-original-text');
        if (original) {
            btn.innerHTML = original;
            btn.removeAttribute('data-original-text');
        }
    }
}

// ==================== CACHED API METHODS WITH DEDUPLICATION ====================
async function cachedGetRequests(forceRefresh = false) {
    const cacheKey = 'all_requests';
    
    if (!forceRefresh) {
        const cached = RequestsData.cacheService.get(cacheKey);
        if (cached) return cached;
        
        if (RequestsData.cacheService.hasPending(cacheKey)) {
            return RequestsData.cacheService.getPending(cacheKey);
        }
    }
    
    const promise = API.getRequests().then(data => {
        RequestsData.cacheService.set(cacheKey, data, CACHE_TTL.REQUESTS_LIST);
        RequestsData.cacheService.deletePending(cacheKey);
        return data;
    }).catch(error => {
        RequestsData.cacheService.deletePending(cacheKey);
        throw error;
    });
    
    RequestsData.cacheService.setPending(cacheKey, promise);
    return promise;
}

async function cachedGetRequest(id, forceRefresh = false) {
    const cacheKey = `request_${id}`;
    
    if (!forceRefresh) {
        const cached = RequestsData.cacheService.get(cacheKey);
        if (cached) return cached;
    }
    
    const request = await API.getRequest(id);
    if (request) {
        RequestsData.cacheService.set(cacheKey, request, CACHE_TTL.SINGLE_REQUEST);
    }
    return request;
}

async function cachedGetClients(forceRefresh = false) {
    const cacheKey = 'all_clients';
    
    if (!forceRefresh) {
        const cached = RequestsData.cacheService.get(cacheKey);
        if (cached) return cached;
        
        if (RequestsData.cacheService.hasPending(cacheKey)) {
            return RequestsData.cacheService.getPending(cacheKey);
        }
    }
    
    const promise = API.getClients().then(data => {
        RequestsData.cacheService.set(cacheKey, data, CACHE_TTL.CLIENTS);
        RequestsData.cacheService.deletePending(cacheKey);
        return data;
    }).catch(error => {
        RequestsData.cacheService.deletePending(cacheKey);
        throw error;
    });
    
    RequestsData.cacheService.setPending(cacheKey, promise);
    return promise;
}

async function cachedGetCars(forceRefresh = false) {
    const cacheKey = 'all_cars';
    
    if (!forceRefresh) {
        const cached = RequestsData.cacheService.get(cacheKey);
        if (cached) return cached;
        
        if (RequestsData.cacheService.hasPending(cacheKey)) {
            return RequestsData.cacheService.getPending(cacheKey);
        }
    }
    
    const promise = API.getCars().then(data => {
        RequestsData.cacheService.set(cacheKey, data, CACHE_TTL.CARS);
        RequestsData.cacheService.deletePending(cacheKey);
        return data;
    }).catch(error => {
        RequestsData.cacheService.deletePending(cacheKey);
        throw error;
    });
    
    RequestsData.cacheService.setPending(cacheKey, promise);
    return promise;
}

function invalidateRequestsCache() {
    RequestsData.cacheService.clearByPattern('all_requests');
    RequestsData.cacheService.clearByPattern('request_');
}

function invalidateClientsCache() {
    RequestsData.cacheService.clear('all_clients');
}

function invalidateCarsCache() {
    RequestsData.cacheService.clear('all_cars');
}

// ==================== RENDER FUNCTIONS ====================
function renderDesktopTable(requests) {
    if (!DOM.tbody) return;
    
    if (!requests || requests.length === 0) {
        DOM.tbody.innerHTML = '<tr><td colspan="5" class="empty-state-td">No requests yet</td></tr>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    for (const req of requests) {
        const clientName = RequestsData.clientsMap.get(req.clientid) || 'Unknown';
        const carName = RequestsData.carsMap.get(req.carid) || 'Unknown Car';
        const statusClass = getStatusClass(req.status);
        const statusIcon = getStatusIcon(req.status);
        const formattedDate = formatDate(req.createdat);
        const safeStatus = escapeHtml(req.status || CONSTANTS.STATUS.PENDING);
        
        const tr = document.createElement('tr');
        tr.setAttribute('data-request-id', escapeHtml(String(req.id)));
        tr.innerHTML = `
            <td><strong>${escapeHtml(clientName)}</strong></td>
            <td>${escapeHtml(carName)}</td>
            <td><small>${escapeHtml(formattedDate)}</small></td>
            <td><span class="status-badge ${escapeHtml(statusClass)}"><i class="fa-solid ${escapeHtml(statusIcon)}"></i> ${safeStatus}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" data-action="view" data-id="${escapeHtml(String(req.id))}" title="View" aria-label="View Request"><i class="fa-solid fa-eye"></i></button>
                    <button class="action-btn edit" data-action="edit" data-id="${escapeHtml(String(req.id))}" title="Edit" aria-label="Edit Request"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete" data-action="delete" data-id="${escapeHtml(String(req.id))}" title="Delete" aria-label="Delete Request"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        fragment.appendChild(tr);
    }
    
    DOM.tbody.innerHTML = '';
    DOM.tbody.appendChild(fragment);
}

function renderMobileCards(requests) {
    if (!DOM.mobileContainer) return;
    
    if (!requests || requests.length === 0) {
        DOM.mobileContainer.innerHTML = '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No requests yet</p></div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    container.className = 'requests-grid';
    container.setAttribute('role', 'list');
    
    for (const req of requests) {
        const clientName = RequestsData.clientsMap.get(req.clientid) || 'Unknown';
        const carName = RequestsData.carsMap.get(req.carid) || 'Unknown Car';
        const statusClass = getStatusClass(req.status);
        const statusIcon = getStatusIcon(req.status);
        const formattedDate = formatDate(req.createdat);
        const safeStatus = escapeHtml(req.status || CONSTANTS.STATUS.PENDING);
        
        const card = document.createElement('div');
        card.className = 'request-card';
        card.setAttribute('data-request-id', escapeHtml(String(req.id)));
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
            <div class="request-icon">
                <i class="fa-solid fa-file-lines"></i>
            </div>
            <div class="request-info">
                <div class="request-title">${escapeHtml(req.title || 'Request')}</div>
                <div class="request-details">
                    <p><i class="fa-solid fa-user"></i> ${escapeHtml(clientName)}</p>
                    <p><i class="fa-solid fa-car"></i> ${escapeHtml(carName)}</p>
                </div>
                <div class="search-result-status">
                    <span class="status-badge ${escapeHtml(statusClass)}">
                        <i class="fa-solid ${escapeHtml(statusIcon)}"></i> ${safeStatus}
                    </span>
                </div>
                <div class="request-date">
                    <i class="fa-regular fa-calendar"></i> ${escapeHtml(formattedDate)}
                </div>
            </div>
            <div class="request-actions">
                <button type="button" class="btn-icon btn-view" data-action="view" data-id="${escapeHtml(String(req.id))}" title="View" aria-label="View Request"><i class="fa-solid fa-eye"></i></button>
                <button type="button" class="btn-icon btn-edit" data-action="edit" data-id="${escapeHtml(String(req.id))}" title="Edit" aria-label="Edit Request"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn-icon btn-delete" data-action="delete" data-id="${escapeHtml(String(req.id))}" title="Delete" aria-label="Delete Request"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    }
    
    fragment.appendChild(container);
    DOM.mobileContainer.innerHTML = '';
    DOM.mobileContainer.appendChild(fragment);
}

function updateLoadMoreButton() {
    if (!DOM.loadMoreContainer) return;
    
    const hasMore = RequestsData.allRequests.length > UIState.totalLoadedCount;
    DOM.loadMoreContainer.style.display = hasMore ? 'block' : 'none';
    
    if (hasMore && DOM.loadMoreBtn) {
        const remaining = RequestsData.allRequests.length - UIState.totalLoadedCount;
        DOM.loadMoreBtn.innerHTML = `<i class="fa-solid fa-arrow-down"></i> Load More (${Math.min(UIState.step, remaining)} more)`;
    }
}

function updateViewAllButton() {
    if (!DOM.viewAllBtn) return;
    
    const isFullyLoaded = UIState.totalLoadedCount >= RequestsData.allRequests.length;
    if (isFullyLoaded && RequestsData.allRequests.length > INITIAL_LOAD_COUNT) {
        DOM.viewAllBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i> Show Less';
    } else {
        DOM.viewAllBtn.innerHTML = '<i class="fa-solid fa-arrow-down"></i> View All';
    }
}

function displayRequests() {
    const isDesktop = window.innerWidth >= 1024;
    const requestsToShow = RequestsData.allRequests.slice(0, UIState.totalLoadedCount);
    
    const desktopContainer = document.querySelector('.desktop-only');
    if (desktopContainer) desktopContainer.style.display = isDesktop ? 'block' : 'none';
    if (DOM.mobileContainer) DOM.mobileContainer.style.display = isDesktop ? 'none' : 'block';
    
    if (isDesktop) {
        renderDesktopTable(requestsToShow);
    } else {
        renderMobileCards(requestsToShow);
    }
    
    updateLoadMoreButton();
    updateViewAllButton();
}

// ==================== DATA LOADING ====================
async function loadDashboardStats() {
    try {
        if (!window.API) return;
        const requests = await cachedGetRequests();
        const requestsArray = Array.isArray(requests) ? requests : [];
        const active = requestsArray.filter(r => r && r.status === CONSTANTS.STATUS.ACTIVE).length;
        const completed = requestsArray.filter(r => r && r.status === CONSTANTS.STATUS.COMPLETED).length;
        const pending = requestsArray.filter(r => r && r.status === CONSTANTS.STATUS.PENDING).length;
        
        const totalEl = document.getElementById('total-requests');
        const activeEl = document.getElementById('active-requests');
        const completedEl = document.getElementById('completed-requests');
        const pendingEl = document.getElementById('pending-requests');
        
        if (totalEl) totalEl.textContent = requestsArray.length || 0;
        if (activeEl) activeEl.textContent = active;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;
    } catch (e) {
        console.error('Error loading dashboard stats:', e);
    }
}

async function loadAllData(forceRefresh = false) {
    try {
        if (!window.API) throw new Error('API module not loaded');
        
        const [requests, clients, cars] = await Promise.all([
            cachedGetRequests(forceRefresh),
            cachedGetClients(forceRefresh),
            cachedGetCars(forceRefresh)
        ]);
        
        const requestsArray = Array.isArray(requests) ? requests : [];
        const clientsArray = Array.isArray(clients) ? clients : [];
        const carsArray = Array.isArray(cars) ? cars : [];
        
        RequestsData.allRequests = requestsArray.sort((a, b) => getSafeTimestamp(b?.createdat) - getSafeTimestamp(a?.createdat));
        
        RequestsData.clientsMap = new Map();
        for (const client of clientsArray) {
            if (client && client.id) RequestsData.clientsMap.set(client.id, client.name || 'Unknown');
        }
        
        RequestsData.carsMap = new Map();
        for (const car of carsArray) {
            if (car && car.id) RequestsData.carsMap.set(car.id, `${car.brand || ''} ${car.model || ''}`.trim() || 'Unknown Car');
        }
        
        UIState.totalLoadedCount = Math.min(INITIAL_LOAD_COUNT, RequestsData.allRequests.length);
        displayRequests();
        
        const loader = document.getElementById('crmLoader');
        if (loader && !forceRefresh) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
            }, 500);
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        const errorMessage = error.message || 'Failed to load requests. Please check your connection.';
        
        if (DOM.tbody) {
            DOM.tbody.innerHTML = `<tr><td colspan="5" class="empty-state-td">${escapeHtml(errorMessage)}</td></tr>`;
        }
        if (DOM.mobileContainer) {
            showError(DOM.mobileContainer, errorMessage);
        }
        UI.showToast(errorMessage, 'error');
    }
}

// ==================== EVENT HANDLERS ====================
function handleViewAllClick() {
    const isFullyLoaded = UIState.totalLoadedCount >= RequestsData.allRequests.length;
    
    if (isFullyLoaded && RequestsData.allRequests.length > INITIAL_LOAD_COUNT) {
        UIState.totalLoadedCount = Math.min(INITIAL_LOAD_COUNT, RequestsData.allRequests.length);
        displayRequests();
    } else {
        UIState.totalLoadedCount = RequestsData.allRequests.length;
        displayRequests();
    }
}

function handleLoadMoreClick() {
    const newCount = Math.min(UIState.totalLoadedCount + UIState.step, RequestsData.allRequests.length);
    UIState.totalLoadedCount = newCount;
    displayRequests();
}

function showDeleteConfirm() {
    return UI.confirm('Are you sure you want to delete this request? This action cannot be undone.');
}

// ==================== SINGLE GLOBAL EVENT HANDLER ====================
async function handleGlobalClick(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;
    
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;
    
    if (!id && action !== 'add-request' && action !== 'add') return;
    
    e.preventDefault();
    e.stopPropagation();
    saveCurrentScreen();
    
    if (action === 'add-request' || action === 'add') {
        await populateDropdowns();
        UI.showScreen(CONSTANTS.SCREENS.ADD);
        return;
    }
    
    if (!id) return;
    
    if (action === 'delete' || action === 'delete-request') {
        if (!showDeleteConfirm()) {
            return;
        }
    }
    
    setButtonLoading(actionBtn, true);
    
    try {
        if (action === 'view') {
            await loadRequestDetails(id);
        } else if (action === 'edit' || action === 'edit-request') {
            await editRequest(id);
        } else if (action === 'delete' || action === 'delete-request') {
            await deleteRequest(id);
        }
    } catch (error) {
        console.error('Error in action:', error);
        UI.showToast('An error occurred', 'error');
    } finally {
        setButtonLoading(actionBtn, false);
    }
}

function handleMobileCardClick(e) {
    const card = e.target.closest('.request-card');
    if (card && !e.target.closest('.btn-icon')) {
        const reqId = card.dataset.requestId;
        if (reqId) {
            saveCurrentScreen();
            loadRequestDetails(reqId);
        }
    }
}

function handleResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const dashboardSection = document.getElementById(CONSTANTS.SCREENS.DASHBOARD);
        if (dashboardSection && dashboardSection.classList.contains('active')) {
            displayRequests();
        }
    }, 150);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id !== CONSTANTS.SCREENS.DASHBOARD) {
            goBackToPreviousScreen();
        }
    }
}

// ==================== REQUESTS CRUD OPERATIONS ====================
let clientsCache = [];
let carsCache = [];

// Populate dropdowns with proper formatting - Client: name left, phone right using spaces
async function populateDropdowns() {
    try {
        const [clients, cars] = await Promise.all([
            cachedGetClients(),
            cachedGetCars()
        ]);
        
        clientsCache = clients || [];
        carsCache = cars || [];
        
        const uniqueClients = [...new Map(clientsCache.map(c => [c.id, c])).values()];
        const uniqueCars = [...new Map(carsCache.map(c => [c.id, c])).values()];
        
        const clientSelect = document.getElementById('request-client');
        const carSelect = document.getElementById('request-car');
        const editClientSelect = document.getElementById('edit-request-client');
        const editCarSelect = document.getElementById('edit-request-car');
        
        // Populate CLIENT dropdowns - Name on left, Phone on right with space
        if (clientSelect) {
            clientSelect.innerHTML = '<option value="" disabled selected>━━━ Select Client ━━━</option>';
            uniqueClients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                const name = client.name || 'Unknown';
                const phone = client.phone || '';
                if (phone) {
                    const spaces = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
                    option.textContent = `${name}${spaces} ${phone}`;
                } else {
                    option.textContent = name;
                }
                clientSelect.appendChild(option);
            });
        }
        
        // Populate CAR dropdowns - Just model and year only
        if (carSelect) {
            carSelect.innerHTML = '<option value="" disabled selected>━━━ Select Car ━━━</option>';
            uniqueCars.forEach(car => {
                const option = document.createElement('option');
                option.value = car.id;
                option.textContent = `${car.brand || ''} ${car.model || ''} (${car.year || ''})`.trim();
                carSelect.appendChild(option);
            });
        }
        
        // Edit form client dropdown
        if (editClientSelect) {
            editClientSelect.innerHTML = '<option value="" disabled selected>━━━ Select Client ━━━</option>';
            uniqueClients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                const name = client.name || 'Unknown';
                const phone = client.phone || '';
                if (phone) {
                    const spaces = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
                    option.textContent = `${name}${spaces}📞 ${phone}`;
                } else {
                    option.textContent = name;
                }
                editClientSelect.appendChild(option);
            });
        }
        
        // Edit form car dropdown
        if (editCarSelect) {
            editCarSelect.innerHTML = '<option value="" disabled selected>━━━ Select Car ━━━</option>';
            uniqueCars.forEach(car => {
                const option = document.createElement('option');
                option.value = car.id;
                option.textContent = `${car.brand || ''} ${car.model || ''} (${car.year || ''})`.trim();
                editCarSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error populating dropdowns:', error);
        UI.showToast('Failed to load data', 'error');
    }
}

function getClientName(clientId) {
    const client = clientsCache.find(c => Number(c.id) === Number(clientId));
    return client?.name || 'Unknown Client';
}

function getCarName(carId) {
    const car = carsCache.find(c => Number(c.id) === Number(carId));
    return car ? `${car.brand} ${car.model} (${car.year})` : 'Unknown Car';
}

async function loadRequestDetails(requestId) {
    try {
        const [clients, cars] = await Promise.all([
            cachedGetClients(),
            cachedGetCars()
        ]);

        clientsCache = clients || [];
        carsCache = cars || [];
        const request = await cachedGetRequest(requestId);
        
        if (!request) {
            UI.showToast('Request not found', 'error');
            return;
        }
        
        const client = clientsCache.find(c => Number(c.id) === Number(request.clientid));
        const car = carsCache.find(c => Number(c.id) === Number(request.carid));
        
        if (!client || !car) {
            invalidateRequestsCache();
            await loadAllData(true);
            goBackToPreviousScreen();
            console.warn('Missing client or car for request:', requestId);
            UI.showToast('Missing related data', 'warning');
            return;
        }
        
        const detailsContainer = document.getElementById('request-details-container');
        if (!detailsContainer) return;
        
        detailsContainer.innerHTML = `
            <div class="request-details-view">
                <div class="detail-header"><i class="fa-solid fa-file-lines"></i><h3>Request Details</h3></div>
                <div class="info-cards">
                    <div class="info-card"><div class="info-icon"><i class="fa-solid fa-tag"></i></div><div class="info-content"><label>Title</label><div class="info-value">${escapeHtml(request.title || 'No Title')}</div></div></div>
                    <div class="info-card"><div class="info-icon"><i class="fa-solid fa-user"></i></div><div class="info-content"><label>Client</label><div class="info-value">${escapeHtml(getClientName(request.clientid))}</div></div></div>
                    <div class="info-card"><div class="info-icon"><i class="fa-solid fa-car"></i></div><div class="info-content"><label>Car</label><div class="info-value">${escapeHtml(getCarName(request.carid))}</div></div></div>
                    <div class="info-card"><div class="info-icon"><i class="fa-solid fa-flag-checkered"></i></div><div class="info-content"><label>Status</label><div class="info-value"><span class="status ${CONSTANTS.STATUS_CLASS[request.status]}"><i class="fa-solid ${CONSTANTS.STATUS_ICON[request.status]}"></i> ${CONSTANTS.STATUS_DISPLAY[request.status] || 'Pending'}</span></div></div></div>
                    <div class="info-card"><div class="info-icon"><i class="fa-regular fa-calendar"></i></div><div class="info-content"><label>Created Date</label><div class="info-value">${formatDateLong(request.createdat)}</div></div></div>
                </div>
                ${request.notes ? `<div class="notes-section"><div class="notes-header"><i class="fa-regular fa-note-sticky"></i><h3>Notes</h3></div><div class="notes-content">${escapeHtml(request.notes).replace(/\n/g, '<br>')}</div></div>` : ''}
                <div class="form-actions">
                    <button type="button" class="btn btn-warning" data-action="edit" data-id="${request.id}"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button type="button" class="btn btn-danger" data-action="delete" data-id="${request.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
        UI.showScreen(CONSTANTS.SCREENS.DETAILS);
    } catch (error) {
        console.error('Error loading request details:', error);
        UI.showToast('Failed to load request details', 'error');
    }
}

// NEW: Function to actually perform the add request
async function performAddRequest(clientId, carId, status, notes, client, car, saveBtn) {
    try {
        await API.addRequest({
            clientId: parseInt(clientId, 10),
            carId: parseInt(carId, 10),
            status,
            title: `Request for ${car.brand} ${car.model} - ${client.name}`,
            notes: notes || null
        });
        
        invalidateRequestsCache();
        await loadAllData(true);
        await loadDashboardStats();
        
        UI.showToast('✓ Request added successfully', 'success');
        document.getElementById('add-request-form')?.reset();
        goBackToPreviousScreen();
    } catch (error) {
        console.error('Error adding request:', error);
        UI.showToast(error.message || 'Failed to add request', 'error');
        throw error;
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

// MODIFIED: Add request submit with confirmation for completed requests
async function addRequestSubmit(e) {
    e.preventDefault();
    
    const clientSelect = document.getElementById('request-client');
    const carSelect = document.getElementById('request-car');
    const statusSelect = document.getElementById('request-status');
    const notesField = document.getElementById('request-notes');
    const saveBtn = document.getElementById('save-request');
    
    const clientId = clientSelect?.value;
    const carId = carSelect?.value;
    const status = statusSelect?.value;
    const notes = notesField?.value.trim();
    
    clearFieldError('request-client');
    clearFieldError('request-car');
    
    if (!clientId || !carId || !status) {
        if (!clientId) showFieldError('request-client', 'Please select a client');
        if (!carId) showFieldError('request-car', 'Please select a car');
        UI.showToast('All fields are required', 'error');
        return;
    }
    
    const client = clientsCache.find(c => Number(c.id) === Number(clientId));
    const car = carsCache.find(c => Number(c.id) === Number(carId));
    
    if (!client || !car) {
        if (!client) showFieldError('request-client', 'Selected client not found');
        if (!car) showFieldError('request-car', 'Selected car not found');
        UI.showToast('Selected client or car not found', 'error');
        await populateDropdowns();
        return;
    }
    
    setButtonLoading(saveBtn, true);
    
    try {
        const duplicateCheck = await validateDuplicateRequest(clientId, carId);
        
        // If no duplicate, add directly
        if (duplicateCheck.isValid) {
            await performAddRequest(clientId, carId, status, notes, client, car, saveBtn);
            return;
        }
        
        // If blocked (active/pending request exists) - show error and stop
        if (duplicateCheck.isBlocked) {
            setButtonLoading(saveBtn, false);
            UI.showToast(duplicateCheck.message, 'error', 5000);
            showFieldError('request-client', 'Client already has an active/pending request for this car');
            showFieldError('request-car', 'This car is already requested by this client');
            return;
        }
        
        // If completed request exists - ask for confirmation
        if (duplicateCheck.isCompleted) {
            setButtonLoading(saveBtn, false);
            
            // Show confirmation popup
            const userConfirmed = confirm(`${duplicateCheck.message}\n\nClick OK to create new request, Cancel to go back.`);
            
            if (userConfirmed) {
                // User confirmed - add the request
                setButtonLoading(saveBtn, true);
                await performAddRequest(clientId, carId, status, notes, client, car, saveBtn);
            } else {
                // User cancelled - just go back to previous screen without adding
                UI.showToast('Request cancelled', 'info');
                goBackToPreviousScreen();
            }
            return;
        }
        
    } catch (error) {
        console.error('Error in add request validation:', error);
        UI.showToast('An error occurred', 'error');
        setButtonLoading(saveBtn, false);
    }
}

async function editRequest(requestId) {
    try {
        await populateDropdowns();
        const request = await cachedGetRequest(requestId, true);
        
        if (!request) {
            UI.showToast('Request not found', 'error');
            return;
        }
        
        const editClientSelect = document.getElementById('edit-request-client');
        const editCarSelect = document.getElementById('edit-request-car');
        const statusSelect = document.getElementById('edit-request-status');
        const notesField = document.getElementById('edit-request-notes');
        const updateBtn = document.getElementById('update-request');
        
        if (editClientSelect) editClientSelect.value = request.clientid || '';
        if (editCarSelect) editCarSelect.value = request.carid || '';
        if (statusSelect) statusSelect.value = request.status || CONSTANTS.STATUS.ACTIVE;
        if (notesField) notesField.value = request.notes || '';
        if (updateBtn) updateBtn.dataset.requestId = requestId;
        
        UI.showScreen(CONSTANTS.SCREENS.EDIT);
    } catch (error) {
        console.error('Error editing request:', error);
        UI.showToast('Failed to load request for edit', 'error');
    }
}

async function updateRequestSubmit(e) {
    e.preventDefault();
    
    const updateBtn = document.getElementById('update-request');
    const requestId = updateBtn?.dataset.requestId;
    
    if (!requestId) {
        UI.showToast('Invalid request ID', 'error');
        return;
    }
    
    const clientId = document.getElementById('edit-request-client')?.value;
    const carId = document.getElementById('edit-request-car')?.value;
    const status = document.getElementById('edit-request-status')?.value;
    const notes = document.getElementById('edit-request-notes')?.value.trim();
    
    clearFieldError('edit-request-client');
    clearFieldError('edit-request-car');
    
    if (!clientId || !carId || !status) {
        if (!clientId) showFieldError('edit-request-client', 'Please select a client');
        if (!carId) showFieldError('edit-request-car', 'Please select a car');
        UI.showToast('All fields are required', 'error');
        return;
    }
    
    const client = clientsCache.find(c => Number(c.id) === Number(clientId));
    const car = carsCache.find(c => Number(c.id) === Number(carId));
    
    if (!client || !car) {
        if (!client) showFieldError('edit-request-client', 'Selected client not found');
        if (!car) showFieldError('edit-request-car', 'Selected car not found');
        UI.showToast('Selected client or car not found', 'error');
        await populateDropdowns();
        return;
    }
    
    const duplicateCheck = await validateDuplicateRequest(clientId, carId, requestId);
    if (!duplicateCheck.isValid && duplicateCheck.isBlocked) {
        UI.showToast(duplicateCheck.message, 'warning', 4000);
        showFieldError('edit-request-client', 'This client already has a request for this car');
        showFieldError('edit-request-car', 'This car is already requested by this client');
        return;
    }
    
    setButtonLoading(updateBtn, true);
    
    try {
        await API.updateRequest(requestId, {
            clientId: parseInt(clientId, 10),
            carId: parseInt(carId, 10),
            status,
            title: `Request for ${car.brand} ${car.model} - ${client.name}`,
            notes: notes || null
        });
        
        invalidateRequestsCache();
        await loadAllData(true);
        await loadDashboardStats();
        
        UI.showToast('✓ Request updated successfully', 'success');
        goBackToPreviousScreen();
    } catch (error) {
        console.error('Error updating request:', error);
        UI.showToast(error.message || 'Failed to update request', 'error');
    } finally {
        setButtonLoading(updateBtn, false);
    }
}

async function deleteRequest(requestId) {
    try {
        await API.deleteRequest(requestId);
        
        invalidateRequestsCache();
        await loadAllData(true);
        await loadDashboardStats();
        
        UI.showToast('Request deleted successfully', 'success');
        
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen?.id === CONSTANTS.SCREENS.DETAILS) {
            goBackToPreviousScreen();
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        UI.showToast('Failed to delete request', 'error');
        throw error;
    }
}

// ==================== FORM EVENT HANDLERS ====================
function bindFormEvents() {
    const addForm = document.getElementById('add-request-form');
    const editForm = document.getElementById('edit-request-form');
    
    if (addForm) {
        addForm.removeEventListener('submit', addRequestSubmit);
        addForm.addEventListener('submit', addRequestSubmit);
    }
    
    if (editForm) {
        editForm.removeEventListener('submit', updateRequestSubmit);
        editForm.addEventListener('submit', updateRequestSubmit);
    }
}

// ==================== INITIALIZATION ====================
function initDOMReferences() {
    DOM.tbody = document.getElementById('requests-overview-body');
    DOM.mobileContainer = document.getElementById('mobile-requests-container');
    DOM.loadMoreContainer = document.getElementById('load-more-container');
    DOM.loadMoreBtn = document.getElementById('load-more-btn');
    DOM.viewAllBtn = document.getElementById('view-all-requests-btn');
}

function initEventListeners() {
    const addDashboardBtn = document.getElementById('add-request-dashboard-btn');
    if (addDashboardBtn) {
        addDashboardBtn.removeEventListener('click', handleAddRequestClick);
        addDashboardBtn.addEventListener('click', handleAddRequestClick);
    }
    
    const fabMobile = document.getElementById('fab-add-mobile');
    if (fabMobile) {
        fabMobile.removeEventListener('click', handleAddRequestClick);
        fabMobile.addEventListener('click', handleAddRequestClick);
    }
    
    const backButtons = ['back-from-add-request', 'back-from-request-details', 'back-from-edit-request', 'cancel-add-request', 'cancel-edit-request'];
    backButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.removeEventListener('click', goBackToPreviousScreen);
            btn.addEventListener('click', goBackToPreviousScreen);
        }
    });
    
    if (DOM.viewAllBtn) {
        DOM.viewAllBtn.removeEventListener('click', handleViewAllClick);
        DOM.viewAllBtn.addEventListener('click', handleViewAllClick);
    }
    
    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.removeEventListener('click', handleLoadMoreClick);
        DOM.loadMoreBtn.addEventListener('click', handleLoadMoreClick);
    }
    
    document.body.removeEventListener('click', handleGlobalClick);
    document.body.addEventListener('click', handleGlobalClick);
    
    if (DOM.mobileContainer) {
        DOM.mobileContainer.removeEventListener('click', handleMobileCardClick);
        DOM.mobileContainer.addEventListener('click', handleMobileCardClick);
    }
    
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
    document.removeEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleEscapeKey);
}

async function handleAddRequestClick() {
    saveCurrentScreen();
    await populateDropdowns();
    UI.showScreen(CONSTANTS.SCREENS.ADD);
}

// ==================== MAIN INIT ====================
async function init() {
    if (isInitialized) return;
    isInitialized = true;
    
    initDOMReferences();
    bindFormEvents();
    initEventListeners();
    await loadDashboardStats();
    await loadAllData();
}

// ==================== EXPORTS ====================
window.RequestsModule = {
    init,
    loadAllData,
    loadRequestDetails,
    editRequest,
    deleteRequest,
    populateDropdowns,
    getCacheStats: () => RequestsData.cacheService.getStats(),
    invalidateCache: () => invalidateRequestsCache(),
    clearAllCache: () => RequestsData.cacheService.clearAll()
};

window.saveCurrentScreen = saveCurrentScreen;
window.goBackToPreviousScreen = goBackToPreviousScreen;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}