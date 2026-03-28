/**
 * Requests Module - Handles all request-related functionality
 * Fixed: ID-based relationships (clientId/carId instead of names), async/await, event listeners, error handling
 */

const RequestsModule = (function() {
    // Private state
    let currentRequests = [];
    let clientsCache = [];
    let carsCache = [];
    let eventListenersBound = false;
    let isInitialized = false;
    let isLoading = false;
    
    // ==================== HELPER FUNCTIONS ====================
    
    function formatDate(dateString) {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
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
    }

    function getClientName(clientId) {
        const client = clientsCache.find(c => c.id == clientId);
        return client ? client.name : 'Unknown Client';
    }
    
    function getCarName(carId) {
        const car = carsCache.find(c => c.id == carId);
        return car ? `${car.brand} ${car.model} (${car.year})` : 'Unknown Car';
    }
    
    function getCar(carId) {
        return carsCache.find(c => c.id == carId);
    }
    
    function getClient(clientId) {
        return clientsCache.find(c => c.id == clientId);
    }
    
    // ==================== REFRESH CACHES ====================
    async function refreshCaches() {
        try {
            const [clients, cars] = await Promise.all([
                API.getClients(),
                API.getCars()
            ]);
            clientsCache = clients || [];
            carsCache = cars || [];
        } catch (error) {
            console.error('Error refreshing caches:', error);
            throw error;
        }
    }

    // ==================== INITIALIZATION ====================
    async function init() {
        if (isInitialized) return;
        
        console.log('📋 Requests Module Initialized');
        await refreshCaches();
        await loadRequests();
        bindEvents();
        isInitialized = true;
    }

    function bindEvents() {
        if (eventListenersBound) return;
        
        // Add Request Form
        const addForm = document.getElementById('add-request-form');
        if (addForm) {
            const newAddForm = addForm.cloneNode(true);
            addForm.parentNode.replaceChild(newAddForm, addForm);
            newAddForm.addEventListener('submit', addRequest);
        }

        // Edit Request Form
        const editForm = document.getElementById('edit-request-form');
        if (editForm) {
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            newEditForm.addEventListener('submit', updateRequest);
        }

        // Cancel buttons
        const cancelAdd = document.getElementById('cancel-add-request');
        if (cancelAdd) {
            const newCancelAdd = cancelAdd.cloneNode(true);
            cancelAdd.parentNode.replaceChild(newCancelAdd, cancelAdd);
            newCancelAdd.addEventListener('click', () => App.showScreen('requests-list'));
        }

        const cancelEdit = document.getElementById('cancel-edit-request');
        if (cancelEdit) {
            const newCancelEdit = cancelEdit.cloneNode(true);
            cancelEdit.parentNode.replaceChild(newCancelEdit, cancelEdit);
            newCancelEdit.addEventListener('click', () => App.showScreen('requests-list'));
        }

        // Back buttons
        const backFromAdd = document.getElementById('back-from-add-request');
        if (backFromAdd) {
            const newBackAdd = backFromAdd.cloneNode(true);
            backFromAdd.parentNode.replaceChild(newBackAdd, backFromAdd);
            newBackAdd.addEventListener('click', () => App.showScreen('requests-list'));
        }

        const backFromDetails = document.getElementById('back-from-request-details');
        if (backFromDetails) {
            const newBackDetails = backFromDetails.cloneNode(true);
            backFromDetails.parentNode.replaceChild(newBackDetails, backFromDetails);
            newBackDetails.addEventListener('click', () => App.showScreen('requests-list'));
        }

        const backFromEdit = document.getElementById('back-from-edit-request');
        if (backFromEdit) {
            const newBackEdit = backFromEdit.cloneNode(true);
            backFromEdit.parentNode.replaceChild(newBackEdit, backFromEdit);
            newBackEdit.addEventListener('click', () => App.showScreen('requests-list'));
        }

        // FAB button
        const fabBtn = document.getElementById('fab-add');
        if (fabBtn) {
            const newFab = fabBtn.cloneNode(true);
            fabBtn.parentNode.replaceChild(newFab, fabBtn);
            newFab.addEventListener('click', async () => {
                await loadClientsAndCars();
                App.showScreen('add-request');
            });
        }

        eventListenersBound = true;
    }

    // ==================== CHECK DUPLICATE REQUEST ====================
    async function checkDuplicateRequest(clientId, carId, excludeRequestId = null) {
        try {
            const requests = await API.getRequests();
            
            const activeOrPendingRequests = requests.filter(req => 
                req.status === 'active' || req.status === 'pending'
            );
            
            const duplicate = activeOrPendingRequests.find(req => {
                const isSameClient = req.clientid == clientId;
                const isSameCar = req.carid == carId;
                const isDifferentRequest = excludeRequestId ? req.id != excludeRequestId : true;
                return isSameClient && isSameCar && isDifferentRequest;
            });
            
            if (duplicate) {
                const statusText = duplicate.status === 'active' ? 'Active' : 'Pending';
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
    }

    // ==================== LOAD REQUESTS ====================
    async function loadRequests() {
        const container = document.getElementById('requests-container');
        if (!container) return;
        if (isLoading) return;
        
        isLoading = true;

        try {
            container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"><div class="spinner"></div><p>Loading requests...</p></div></div>';
            
            await refreshCaches();
            currentRequests = await API.getRequests() || [];

            // Filter out requests whose client no longer exists
            const existingClientIds = new Set(clientsCache.map(c => c.id.toString()));
            const existingCarIds = new Set(carsCache.map(c => c.id.toString()));
            
            const validRequests = [];
            const orphanedRequests = [];
            
            for (const req of currentRequests) {
                const clientExists = existingClientIds.has(req.clientid?.toString());
                const carExists = existingCarIds.has(req.carid?.toString());
                
                if (clientExists && carExists) {
                    validRequests.push(req);
                } else {
                    orphanedRequests.push(req);
                }
            }
            
            // Clean up orphaned requests
            if (orphanedRequests.length > 0) {
                console.log(`🗑️ Found ${orphanedRequests.length} orphaned requests. Cleaning up...`);
                const deletePromises = orphanedRequests.map(req => API.deleteRequest(req.id));
                await Promise.all(deletePromises);
                App.showToast(`Cleaned up ${orphanedRequests.length} orphaned request(s)`, 'info', 3000);
                currentRequests = validRequests;
            }
            
            displayRequests(validRequests);
            
            // Notify SearchModule to refresh data
            if (window.SearchModule && window.SearchModule.refreshData) {
                window.SearchModule.refreshData();
            }
        } catch (error) {
            console.error('Error loading requests:', error);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading requests</h3><p>Please try again</p></div>';
            App.showToast('Failed to load requests', 'error');
        } finally {
            isLoading = false;
        }
    }

    // ==================== DISPLAY REQUESTS ====================
    function displayRequests(requests) {
        const container = document.getElementById('requests-container');
        if (!container) return;

        if (!requests || requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-file-lines"></i>
                    <h3>No requests found</h3>
                    <p>Add your first request to get started</p>
                    <button type="button" class="btn btn-primary" onclick="RequestsModule.loadClientsAndCars(); App.showScreen('add-request')">
                        <i class="fa-solid fa-plus" style="font-size:16px;margin:5px"></i> Add Request
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        for (const request of requests) {
            const clientName = getClientName(request.clientid);
            const carName = getCarName(request.carid);
            html += createRequestCard(request, clientName, carName);
        }

        container.innerHTML = html;
    }

    function createRequestCard(request, clientName, carName) {
        const status = request.status || 'pending';
        const statusClass = `status-${status}`;
        const statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';
        const formattedDate = formatDate(request.createdat);
        
        return `
            <div class="request-card" onclick="RequestsModule.loadRequestDetails('${request.id}')">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="request-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div class="request-info" style="flex: 1;">
                        <div class="request-title">${App.escapeHtml(request.title || 'No Title')}</div>
                        <div class="request-details">
                            <p><i class="fa-solid fa-user"></i> ${App.escapeHtml(clientName)}</p>
                            <p><i class="fa-solid fa-car"></i> ${App.escapeHtml(carName)}</p>
                        </div>
                        <div class="search-result-status">
                            <span class="status ${statusClass}">
                                <i class="fa-solid ${getStatusIcon(status)}"></i>
                                ${statusText}
                            </span>
                        </div>
                        ${request.notes ? `
                        <div class="request-notes-preview">
                            <i class="fa-regular fa-note-sticky"></i> ${App.truncateText(request.notes, 50)}
                        </div>
                        ` : ''}
                        <div class="request-date">
                            <i class="fa-regular fa-calendar"></i> ${formattedDate}
                        </div>
                    </div>
                    <div class="request-actions" onclick="event.stopPropagation()">
                        <button type="button" class="btn-icon btn-edit" onclick="RequestsModule.editRequest('${request.id}')" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" onclick="RequestsModule.deleteRequest('${request.id}')" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'completed': return 'fa-check-circle';
            case 'active': return 'fa-play-circle';
            case 'pending': return 'fa-clock';
            default: return 'fa-circle';
        }
    }

    // ==================== LOAD REQUEST DETAILS ====================
    async function loadRequestDetails(requestId) {
        try {
            await refreshCaches();
            const request = await API.getRequest(requestId);
            
            if (!request) {
                App.showToast('Request not found', 'error');
                return;
            }

            // Validate client and car exist
            const clientExists = clientsCache.some(c => c.id == request.clientid);
            const carExists = carsCache.some(c => c.id == request.carid);
            
            if (!clientExists || !carExists) {
                App.showToast('This request is linked to data that no longer exists. It will be deleted.', 'warning');
                await API.deleteRequest(requestId);
                await loadRequests();
                App.showScreen('requests-list');
                return;
            }

            const clientName = getClientName(request.clientid);
            const carName = getCarName(request.carid);
            
            const container = document.getElementById('request-details-container');
            if (!container) return;

            const status = request.status || 'pending';
            const statusClass = `status-${status}`;
            const statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';
            const formattedDate = formatDate(request.createdat);

            container.innerHTML = `
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
                                <div class="info-value">${App.escapeHtml(request.title || 'No Title')}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-user"></i></div>
                            <div class="info-content">
                                <label>Client</label>
                                <div class="info-value">${App.escapeHtml(clientName)}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-car"></i></div>
                            <div class="info-content">
                                <label>Car</label>
                                <div class="info-value">${App.escapeHtml(carName)}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-flag-checkered"></i></div>
                            <div class="info-content">
                                <label>Status</label>
                                <div class="info-value">
                                    <span class="status ${statusClass}">
                                        <i class="fa-solid ${getStatusIcon(status)}"></i>
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
                            ${App.escapeHtml(request.notes).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="form-actions" style="margin-top: 1.5rem;">
                        <button type="button" class="btn btn-warning" onclick="RequestsModule.editRequest('${request.id}')" style="flex: 1;">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button type="button" class="btn btn-danger" onclick="RequestsModule.deleteRequest('${request.id}')" style="flex: 1;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;

            App.showScreen('request-details');
        } catch (error) {
            console.error('Error loading request details:', error);
            App.showToast('Failed to load request details', 'error');
        }
    }

    // ==================== LOAD CLIENTS AND CARS FOR DROPDOWNS ====================
    async function loadClientsAndCars() {
        try {
            await refreshCaches();

            const clientSelect = document.getElementById('request-client');
            const carSelect = document.getElementById('request-car');
            const editClientSelect = document.getElementById('edit-request-client');
            const editCarSelect = document.getElementById('edit-request-car');

            if (clientSelect) {
                clientSelect.innerHTML = '<option value="" disabled selected>Select Client</option>';
                clientsCache.forEach(client => {
                    clientSelect.innerHTML += `<option value="${client.id}">${App.escapeHtml(client.name)}</option>`;
                });
            }

            if (carSelect) {
                carSelect.innerHTML = '<option value="" disabled selected>Select Car</option>';
                carsCache.forEach(car => {
                    carSelect.innerHTML += `<option value="${car.id}">${App.escapeHtml(car.brand)} ${App.escapeHtml(car.model)} (${App.escapeHtml(car.year)})</option>`;
                });
            }

            if (editClientSelect) {
                editClientSelect.innerHTML = '<option value="" disabled>Select Client</option>';
                clientsCache.forEach(client => {
                    editClientSelect.innerHTML += `<option value="${client.id}">${App.escapeHtml(client.name)}</option>`;
                });
            }

            if (editCarSelect) {
                editCarSelect.innerHTML = '<option value="" disabled>Select Car</option>';
                carsCache.forEach(car => {
                    editCarSelect.innerHTML += `<option value="${car.id}">${App.escapeHtml(car.brand)} ${App.escapeHtml(car.model)} (${App.escapeHtml(car.year)})</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading dropdowns:', error);
            App.showToast('Failed to load data', 'error');
        }
    }

    // ==================== ADD REQUEST ====================
    async function addRequest(e) {
        e.preventDefault();
        
        const clientId = document.getElementById('request-client').value;
        const carId = document.getElementById('request-car').value;
        const status = document.getElementById('request-status').value;
        const notes = document.getElementById('request-notes').value.trim();

        if (!clientId || !carId || !status) {
            App.showToast('All fields are required', 'error');
            return;
        }

        // Validate client and car exist
        const client = getClient(clientId);
        const car = getCar(carId);
        
        if (!client) {
            App.showToast('Selected client not found', 'error');
            await loadClientsAndCars();
            return;
        }
        
        if (!car) {
            App.showToast('Selected car not found', 'error');
            await loadClientsAndCars();
            return;
        }

        // Check for duplicate request
        const duplicateCheck = await checkDuplicateRequest(clientId, carId);
        
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        try {
            const requestData = {
                clientId: parseInt(clientId),
                carId: parseInt(carId),
                status,
                title: `Request for ${car.brand} ${car.model} - ${client.name}`,
                notes: notes || null
            };

            await API.addRequest(requestData);
            App.showToast('Request added successfully', 'success');
            
            // Reset form
            const form = document.getElementById('add-request-form');
            if (form) form.reset();
            
            await loadRequests();
            App.showScreen('requests-list');
        } catch (error) {
            console.error('Error adding request:', error);
            App.showToast(error.message || 'Failed to add request', 'error');
        }
    }

    // ==================== EDIT REQUEST ====================
    async function editRequest(requestId) {
        try {
            const request = await API.getRequest(requestId);
            
            if (!request) {
                App.showToast('Request not found', 'error');
                return;
            }
            
            await loadClientsAndCars();
            
            // Populate edit form
            const clientSelect = document.getElementById('edit-request-client');
            const carSelect = document.getElementById('edit-request-car');
            const statusSelect = document.getElementById('edit-request-status');
            const notesField = document.getElementById('edit-request-notes');
            const updateBtn = document.getElementById('update-request');

            if (clientSelect) clientSelect.value = request.clientid || '';
            if (carSelect) carSelect.value = request.carid || '';
            if (statusSelect) statusSelect.value = request.status || 'active';
            if (notesField) notesField.value = request.notes || '';
            if (updateBtn) updateBtn.dataset.requestId = requestId;
            
            App.showScreen('edit-request');
        } catch (error) {
            console.error('Error editing request:', error);
            App.showToast('Failed to load request for edit', 'error');
        }
    }

    // ==================== UPDATE REQUEST ====================
    async function updateRequest(e) {
        e.preventDefault();
        
        const requestId = document.getElementById('update-request')?.dataset.requestId;
        if (!requestId) {
            App.showToast('Invalid request ID', 'error');
            return;
        }

        const clientId = document.getElementById('edit-request-client').value;
        const carId = document.getElementById('edit-request-car').value;
        const status = document.getElementById('edit-request-status').value;
        const notes = document.getElementById('edit-request-notes').value.trim();

        if (!clientId || !carId || !status) {
            App.showToast('All fields are required', 'error');
            return;
        }

        // Validate client and car exist
        const client = getClient(clientId);
        const car = getCar(carId);
        
        if (!client) {
            App.showToast('Selected client not found', 'error');
            await loadClientsAndCars();
            return;
        }
        
        if (!car) {
            App.showToast('Selected car not found', 'error');
            await loadClientsAndCars();
            return;
        }

        // Check for duplicate request (excluding current one)
        const duplicateCheck = await checkDuplicateRequest(clientId, carId, requestId);
        
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        try {
            const requestData = {
                clientId: parseInt(clientId),
                carId: parseInt(carId),
                status,
                title: `Request for ${car.brand} ${car.model} - ${client.name}`,
                notes: notes || null
            };

            await API.updateRequest(requestId, requestData);
            App.showToast('Request updated successfully', 'success');
            
            await loadRequests();
            App.showScreen('requests-list');
        } catch (error) {
            console.error('Error updating request:', error);
            App.showToast(error.message || 'Failed to update request', 'error');
        }
    }

    // ==================== DELETE REQUEST ====================
    async function deleteRequest(requestId) {
        if (!confirm('Are you sure you want to delete this request?')) return;

        try {
            await API.deleteRequest(requestId);
            App.showToast('Request deleted successfully', 'success');
            await loadRequests();
            App.showScreen('requests-list');
        } catch (error) {
            console.error('Error deleting request:', error);
            App.showToast('Failed to delete request', 'error');
        }
    }

    // ==================== PUBLIC API ====================
    return {
        init,
        loadRequests,
        loadRequestDetails,
        editRequest,
        deleteRequest,
        loadClientsAndCars,
        checkDuplicateRequest,
        formatDate,
        refreshCaches,
        getCurrentRequests: () => currentRequests
    };
})();

window.RequestsModule = RequestsModule;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requests-container')) {
        RequestsModule.init();
    }
});