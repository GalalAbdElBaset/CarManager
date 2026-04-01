/**
 * Requests Module - Enhanced Version
 * Features: Event delegation, cached DOM references, strict equality, constants, AbortController
 */

const RequestsModule = (() => {
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
            ADD: 'add-request',
            EDIT: 'edit-request',
            DETAILS: 'request-details'
        },
        EVENTS: {
            REQUEST_ADDED: 'request:added',
            REQUEST_UPDATED: 'request:updated',
            REQUEST_DELETED: 'request:deleted'
        }
    };

    // ==================== PRIVATE STATE ====================
    let currentRequests = [];
    let clientsCache = [];
    let carsCache = [];
    let isInitialized = false;
    let isLoading = false;
    let abortControllers = new Map(); // Track active requests
    
    // DOM Element Cache
    const elements = {
        container: null,
        addForm: null,
        editForm: null,
        clientSelect: null,
        carSelect: null,
        editClientSelect: null,
        editCarSelect: null
    };

    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * Safely escapes HTML to prevent XSS
     */
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * Format date with error handling
     */
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error('Invalid date');
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', '');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    /**
     * Get client with strict equality
     */
    const getClient = (clientId) => {
        return clientsCache.find(c => Number(c.id) === Number(clientId));
    };

    /**
     * Get car with strict equality
     */
    const getCar = (carId) => {
        return carsCache.find(c => Number(c.id) === Number(carId));
    };

    /**
     * Get client name with fallback
     */
    const getClientName = (clientId) => {
        const client = getClient(clientId);
        return client?.name || 'Unknown Client';
    };

    /**
     * Get car display name
     */
    const getCarName = (carId) => {
        const car = getCar(carId);
        return car ? `${car.brand} ${car.model} (${car.year})` : 'Unknown Car';
    };

    /**
     * Cancel all pending requests
     */
    const cancelPendingRequests = () => {
        abortControllers.forEach((controller, key) => {
            controller.abort();
            abortControllers.delete(key);
        });
    };

    /**
     * Create AbortController for request tracking
     */
    const createAbortController = (requestId) => {
        if (abortControllers.has(requestId)) {
            abortControllers.get(requestId).abort();
        }
        const controller = new AbortController();
        abortControllers.set(requestId, controller);
        return controller;
    };

    // ==================== CACHE MANAGEMENT ====================
    
    const refreshCaches = async () => {
        const controller = createAbortController('refreshCaches');
        
        try {
            const [clients, cars] = await Promise.all([
                API.getClients({ signal: controller.signal }),
                API.getCars({ signal: controller.signal })
            ]);
            clientsCache = clients || [];
            carsCache = cars || [];
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Cache refresh aborted');
                return false;
            }
            console.error('Error refreshing caches:', error);
            throw error;
        } finally {
            abortControllers.delete('refreshCaches');
        }
    };

    // ==================== DUPLICATE DETECTION ====================
    
    const checkDuplicateRequest = async (clientId, carId, excludeRequestId = null) => {
        try {
            const requests = await API.getRequests();
            
            const activeOrPendingRequests = requests.filter(req => 
                req.status === CONSTANTS.STATUS.ACTIVE || 
                req.status === CONSTANTS.STATUS.PENDING
            );
            
            const duplicate = activeOrPendingRequests.find(req => {
                const isSameClient = Number(req.clientid) === Number(clientId);
                const isSameCar = Number(req.carid) === Number(carId);
                const isDifferentRequest = excludeRequestId ? 
                    Number(req.id) !== Number(excludeRequestId) : true;
                return isSameClient && isSameCar && isDifferentRequest;
            });
            
            if (duplicate) {
                const statusText = duplicate.status === CONSTANTS.STATUS.ACTIVE ? 'Active' : 'Pending';
                return {
                    isDuplicate: true,
                    message: `This client already has a ${statusText} request for the same car.`,
                    existingRequest: duplicate
                };
            }
            
            return { isDuplicate: false };
        } catch (error) {
            console.error('Error checking duplicate request:', error);
            return { isDuplicate: false, error: true };
        }
    };

    // ==================== DOM MANIPULATION ====================
    
    /**
     * Cache DOM elements for performance
     */
    const cacheElements = () => {
        elements.container = document.getElementById('requests-container');
        elements.addForm = document.getElementById('add-request-form');
        elements.editForm = document.getElementById('edit-request-form');
        elements.clientSelect = document.getElementById('request-client');
        elements.carSelect = document.getElementById('request-car');
        elements.editClientSelect = document.getElementById('edit-request-client');
        elements.editCarSelect = document.getElementById('edit-request-car');
    };

    /**
     * Populate dropdowns with cached data
     */
    const populateDropdowns = async () => {
        try {
            await refreshCaches();

            const dropdowns = [
                { element: elements.clientSelect, placeholder: 'Select Client' },
                { element: elements.carSelect, placeholder: 'Select Car' },
                { element: elements.editClientSelect, placeholder: 'Select Client' },
                { element: elements.editCarSelect, placeholder: 'Select Car' }
            ];

            dropdowns.forEach(({ element, placeholder }) => {
                if (!element) return;
                
                const isClientDropdown = element.id.includes('client');
                const data = isClientDropdown ? clientsCache : carsCache;
                
                element.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
                
                data.forEach(item => {
                    if (isClientDropdown) {
                        element.innerHTML += `<option value="${item.id}">${escapeHtml(item.name)}</option>`;
                    } else {
                        element.innerHTML += `<option value="${item.id}">${escapeHtml(item.brand)} ${escapeHtml(item.model)} (${escapeHtml(item.year)})</option>`;
                    }
                });
            });
        } catch (error) {
            console.error('Error populating dropdowns:', error);
            App.showToast('Failed to load data', 'error');
        }
    };

    /**
     * Display loading state
     */
    const showLoading = () => {
        if (elements.container) {
            elements.container.innerHTML = `
                <div class="loading-overlay">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading requests...</p>
                    </div>
                </div>
            `;
        }
    };

    /**
     * Display empty state
     */
    const showEmptyState = () => {
        if (elements.container) {
            elements.container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-file-lines"></i>
                    <h3>No requests found</h3>
                    <p>Add your first request to get started</p>
                    <button type="button" class="btn btn-primary" data-action="add-request">
                        <i class="fa-solid fa-plus" style="font-size:16px;margin:5px"></i> Add Request
                    </button>
                </div>
            `;
        }
    };

    /**
     * Create request card HTML
     */
    const createRequestCard = (request) => {
        const clientName = getClientName(request.clientid);
        const carName = getCarName(request.carid);
        const status = request.status || CONSTANTS.STATUS.PENDING;
        const statusText = CONSTANTS.STATUS_DISPLAY[status] || 'Pending';
        const statusIcon = CONSTANTS.STATUS_ICON[status] || 'fa-circle';
        const statusClass = CONSTANTS.STATUS_CLASS[status] || 'status-pending';
        const formattedDate = formatDate(request.createdat);
        
        return `
            <div class="request-card" data-request-id="${request.id}">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="request-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div class="request-info" style="flex: 1;">
                        <div class="request-title">${escapeHtml(request.title || 'No Title')}</div>
                        <div class="request-details">
                            <p><i class="fa-solid fa-user"></i> ${escapeHtml(clientName)}</p>
                            <p><i class="fa-solid fa-car"></i> ${escapeHtml(carName)}</p>
                        </div>
                        <div class="search-result-status">
                            <span class="status ${statusClass}">
                                <i class="fa-solid ${statusIcon}"></i>
                                ${statusText}
                            </span>
                        </div>
                        ${request.notes ? `
                        <div class="request-notes-preview">
                            <i class="fa-regular fa-note-sticky"></i> ${escapeHtml(App.truncateText(request.notes, 50))}
                        </div>
                        ` : ''}
                        <div class="request-date">
                            <i class="fa-regular fa-calendar"></i> ${formattedDate}
                        </div>
                    </div>
                    <div class="request-actions">
                        <button type="button" class="btn-icon btn-edit" data-action="edit-request" data-request-id="${request.id}" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" data-action="delete-request" data-request-id="${request.id}" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Display requests with cleanup
     */
    const displayRequests = (requests) => {
        if (!elements.container) return;

        if (!requests || requests.length === 0) {
            showEmptyState();
            return;
        }

        elements.container.innerHTML = requests.map(createRequestCard).join('');
    };

    // ==================== CORE FUNCTIONALITY ====================
    
    /**
     * Load requests with orphaned data cleanup
     */
    const loadRequests = async () => {
        if (!elements.container || isLoading) return;
        
        isLoading = true;
        showLoading();

        try {
            await refreshCaches();
            currentRequests = await API.getRequests() || [];

            // Filter and clean orphaned requests
            const existingClientIds = new Set(clientsCache.map(c => String(c.id)));
            const existingCarIds = new Set(carsCache.map(c => String(c.id)));
            
            const validRequests = [];
            const orphanedRequests = [];
            
            for (const req of currentRequests) {
                const clientExists = existingClientIds.has(String(req.clientid));
                const carExists = existingCarIds.has(String(req.carid));
                
                if (clientExists && carExists) {
                    validRequests.push(req);
                } else {
                    orphanedRequests.push(req);
                }
            }
            
            // Clean up orphaned requests
            if (orphanedRequests.length > 0) {
                console.log(`🗑️ Cleaning up ${orphanedRequests.length} orphaned requests`);
                const deletePromises = orphanedRequests.map(req => API.deleteRequest(req.id));
                await Promise.all(deletePromises);
                App.showToast(`Cleaned up ${orphanedRequests.length} orphaned request(s)`, 'info', 3000);
                currentRequests = validRequests;
            }
            
            displayRequests(validRequests);
            
            // Notify other modules
            if (window.SearchModule?.refreshData) {
                window.SearchModule.refreshData();
            }
        } catch (error) {
            console.error('Error loading requests:', error);
            elements.container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Error loading requests</h3>
                    <p>Please try again</p>
                    <button type="button" class="btn btn-primary" data-action="retry-load">Retry</button>
                </div>
            `;
            App.showToast('Failed to load requests', 'error');
        } finally {
            isLoading = false;
        }
    };

    /**
     * Load request details view
     */
    const loadRequestDetails = async (requestId) => {
        try {
            await refreshCaches();
            const request = await API.getRequest(requestId);
            
            if (!request) {
                App.showToast('Request not found', 'error');
                return;
            }

            // Validate relationships
            const client = getClient(request.clientid);
            const car = getCar(request.carid);
            
            if (!client || !car) {
                App.showToast('This request is linked to data that no longer exists. It will be deleted.', 'warning');
                await API.deleteRequest(requestId);
                await loadRequests();
                App.showScreen(CONSTANTS.SCREENS.LIST);
                return;
            }

            const clientName = getClientName(request.clientid);
            const carName = getCarName(request.carid);
            const status = request.status || CONSTANTS.STATUS.PENDING;
            const statusText = CONSTANTS.STATUS_DISPLAY[status];
            const statusClass = CONSTANTS.STATUS_CLASS[status];
            const formattedDate = formatDate(request.createdat);

            const detailsContainer = document.getElementById('request-details-container');
            if (!detailsContainer) return;

            detailsContainer.innerHTML = `
                <div class="request-details-view">
                    <div class="detail-header">
                        <i class="fa-solid fa-file-lines"></i>
                        <h3>Request Details</h3>
                    </div>

                    <div class="content-infoCard">
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-tag"></i></div>
                            <div class="info-content">
                                <label>Title</label>
                                <div class="info-value">${escapeHtml(request.title || 'No Title')}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-user"></i></div>
                            <div class="info-content">
                                <label>Client</label>
                                <div class="info-value">${escapeHtml(clientName)}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-car"></i></div>
                            <div class="info-content">
                                <label>Car</label>
                                <div class="info-value">${escapeHtml(carName)}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-flag-checkered"></i></div>
                            <div class="info-content">
                                <label>Status</label>
                                <div class="info-value">
                                    <span class="status ${statusClass}">
                                        <i class="fa-solid ${CONSTANTS.STATUS_ICON[status]}"></i>
                                        ${statusText}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="info-icon"><i class="fa-regular fa-calendar"></i></div>
                            <div class="info-content">
                                <label>Created Date</label>
                                <div class="info-value">${formattedDate}</div>
                            </div>
                        </div>
                    </div>  
                    
                    ${request.notes ? `
                    <div class="notes-section">
                        <div class="notes-header">
                            <i class="fa-regular fa-note-sticky"></i>
                            <h3>Notes</h3>
                        </div>
                        <div class="notes-content">
                            ${escapeHtml(request.notes).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="form-actions" style="margin-top: 1.5rem;">
                        <button type="button" class="btn btn-warning" data-action="edit-request" data-request-id="${request.id}" style="flex: 1;">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button type="button" class="btn btn-danger" data-action="delete-request" data-request-id="${request.id}" style="flex: 1;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;

            App.showScreen(CONSTANTS.SCREENS.DETAILS);
        } catch (error) {
            console.error('Error loading request details:', error);
            App.showToast('Failed to load request details', 'error');
        }
    };

    /**
     * Add new request
     */
    const addRequest = async (e) => {
        e.preventDefault();
        
        const clientId = elements.clientSelect?.value;
        const carId = elements.carSelect?.value;
        const status = document.getElementById('request-status')?.value;
        const notes = document.getElementById('request-notes')?.value.trim();

        if (!clientId || !carId || !status) {
            App.showToast('All fields are required', 'error');
            return;
        }

        const client = getClient(clientId);
        const car = getCar(carId);
        
        if (!client || !car) {
            App.showToast('Selected client or car not found', 'error');
            await populateDropdowns();
            return;
        }

        // Check for duplicates
        const duplicateCheck = await checkDuplicateRequest(clientId, carId);
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        try {
            const requestData = {
                clientId: parseInt(clientId, 10),
                carId: parseInt(carId, 10),
                status,
                title: `Request for ${car.brand} ${car.model} - ${client.name}`,
                notes: notes || null
            };

            await API.addRequest(requestData);
            App.showToast('Request added successfully', 'success');
            
            const form = document.getElementById('add-request-form');
            if (form) form.reset();
            
            await loadRequests();
            App.showScreen(CONSTANTS.SCREENS.LIST);
            
            // Dispatch custom event for other modules
            window.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.REQUEST_ADDED, { 
                detail: requestData 
            }));
        } catch (error) {
            console.error('Error adding request:', error);
            App.showToast(error.message || 'Failed to add request', 'error');
        }
    };

    /**
     * Edit request
     */
    const editRequest = async (requestId) => {
        try {
            const request = await API.getRequest(requestId);
            
            if (!request) {
                App.showToast('Request not found', 'error');
                return;
            }
            
            await populateDropdowns();
            
            const clientSelect = elements.editClientSelect;
            const carSelect = elements.editCarSelect;
            const statusSelect = document.getElementById('edit-request-status');
            const notesField = document.getElementById('edit-request-notes');
            const updateBtn = document.getElementById('update-request');

            if (clientSelect) clientSelect.value = request.clientid || '';
            if (carSelect) carSelect.value = request.carid || '';
            if (statusSelect) statusSelect.value = request.status || CONSTANTS.STATUS.ACTIVE;
            if (notesField) notesField.value = request.notes || '';
            if (updateBtn) updateBtn.dataset.requestId = requestId;
            
            App.showScreen(CONSTANTS.SCREENS.EDIT);
        } catch (error) {
            console.error('Error editing request:', error);
            App.showToast('Failed to load request for edit', 'error');
        }
    };

    /**
     * Update request
     */
    const updateRequest = async (e) => {
        e.preventDefault();
        
        const requestId = document.getElementById('update-request')?.dataset.requestId;
        if (!requestId) {
            App.showToast('Invalid request ID', 'error');
            return;
        }

        const clientId = elements.editClientSelect?.value;
        const carId = elements.editCarSelect?.value;
        const status = document.getElementById('edit-request-status')?.value;
        const notes = document.getElementById('edit-request-notes')?.value.trim();

        if (!clientId || !carId || !status) {
            App.showToast('All fields are required', 'error');
            return;
        }

        const client = getClient(clientId);
        const car = getCar(carId);
        
        if (!client || !car) {
            App.showToast('Selected client or car not found', 'error');
            await populateDropdowns();
            return;
        }

        // Check for duplicate (excluding current)
        const duplicateCheck = await checkDuplicateRequest(clientId, carId, requestId);
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        try {
            const requestData = {
                clientId: parseInt(clientId, 10),
                carId: parseInt(carId, 10),
                status,
                title: `Request for ${car.brand} ${car.model} - ${client.name}`,
                notes: notes || null
            };

            await API.updateRequest(requestId, requestData);
            App.showToast('Request updated successfully', 'success');
            
            await loadRequests();
            App.showScreen(CONSTANTS.SCREENS.LIST);
            
            window.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.REQUEST_UPDATED, { 
                detail: { id: requestId, ...requestData }
            }));
        } catch (error) {
            console.error('Error updating request:', error);
            App.showToast(error.message || 'Failed to update request', 'error');
        }
    };

    /**
     * Delete request
     */
    const deleteRequest = async (requestId) => {
        if (!confirm('Are you sure you want to delete this request?')) return;

        try {
            await API.deleteRequest(requestId);
            App.showToast('Request deleted successfully', 'success');
            await loadRequests();
            App.showScreen(CONSTANTS.SCREENS.LIST);
            
            window.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.REQUEST_DELETED, { 
                detail: { id: requestId }
            }));
        } catch (error) {
            console.error('Error deleting request:', error);
            App.showToast('Failed to delete request', 'error');
        }
    };

    // ==================== EVENT HANDLING ====================
    
    /**
     * Event delegation handler
     */
    const handleGlobalClicks = (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const requestId = target.dataset.requestId;

        switch (action) {
            case 'add-request':
                e.preventDefault();
                populateDropdowns();
                App.showScreen(CONSTANTS.SCREENS.ADD);
                break;
            case 'edit-request':
                e.preventDefault();
                e.stopPropagation();
                if (requestId) editRequest(requestId);
                break;
            case 'delete-request':
                e.preventDefault();
                e.stopPropagation();
                if (requestId) deleteRequest(requestId);
                break;
            case 'retry-load':
                e.preventDefault();
                loadRequests();
                break;
        }
    };

    /**
     * Handle request card clicks
     */
    const handleRequestCardClick = (e) => {
        const card = e.target.closest('.request-card');
        if (!card) return;
        
        // Don't trigger if clicking on action buttons
        if (e.target.closest('[data-action]')) return;
        
        const requestId = card.dataset.requestId;
        if (requestId) loadRequestDetails(requestId);
    };

    /**
     * Initialize event listeners using delegation
     */
    const bindEvents = () => {
        // Global click delegation
        document.body.addEventListener('click', handleGlobalClicks);
        document.body.addEventListener('click', handleRequestCardClick);
        
        // Form submissions
        if (elements.addForm) {
            elements.addForm.addEventListener('submit', addRequest);
        }
        if (elements.editForm) {
            elements.editForm.addEventListener('submit', updateRequest);
        }
        
        // FAB button
        const fabBtn = document.getElementById('fab-add');
        if (fabBtn) {
            fabBtn.addEventListener('click', () => {
                populateDropdowns();
                App.showScreen(CONSTANTS.SCREENS.ADD);
            });
        }
        
        // Cancel/Back buttons - use delegation or single handlers
        const cancelButtons = ['cancel-add-request', 'cancel-edit-request', 
                               'back-from-add-request', 'back-from-request-details', 
                               'back-from-edit-request'];
        
        cancelButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => App.showScreen(CONSTANTS.SCREENS.LIST));
            }
        });
    };

    // ==================== INITIALIZATION ====================
    
    const init = async () => {
        if (isInitialized) return;
        
        cacheElements();
        
        if (!elements.container) {
            console.warn('Requests container not found, module not initialized');
            return;
        }
        
        console.log('📋 Requests Module Initialized');
        
        await refreshCaches();
        await loadRequests();
        bindEvents();
        
        isInitialized = true;
    };

    // ==================== PUBLIC API ====================
    return {
        init,
        loadRequests,
        loadRequestDetails,
        editRequest,
        deleteRequest,
        populateDropdowns,
        checkDuplicateRequest,
        refreshCaches,
        getCurrentRequests: () => currentRequests,
        // Cleanup method for testing/teardown
        destroy: () => {
            cancelPendingRequests();
            document.body.removeEventListener('click', handleGlobalClicks);
            document.body.removeEventListener('click', handleRequestCardClick);
            isInitialized = false;
        }
    };
})();

// Export for global use
window.RequestsModule = RequestsModule;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requests-container')) {
        RequestsModule.init();
    }
});