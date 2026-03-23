/**
 * Requests Module - Handles all request-related functionality
 */

const RequestsModule = (function() {
    // ==================== INITIALIZATION ====================
    function init() {
        console.log('📋 Requests Module Initialized');
        loadRequests();
        bindEvents();
    }

    function bindEvents() {
        const addForm = document.getElementById('add-request-form');
        if (addForm) {
            addForm.addEventListener('submit', addRequest);
        }

        const editForm = document.getElementById('edit-request-form');
        if (editForm) {
            editForm.addEventListener('submit', updateRequest);
        }

        // Cancel buttons
        document.getElementById('cancel-add-request')?.addEventListener('click', () => {
            App.showScreen('requests-list');
        });

        document.getElementById('cancel-edit-request')?.addEventListener('click', () => {
            App.showScreen('requests-list');
        });

        // Back buttons
        document.getElementById('back-from-add-request')?.addEventListener('click', () => {
            App.showScreen('requests-list');
        });

        document.getElementById('back-from-request-details')?.addEventListener('click', () => {
            App.showScreen('requests-list');
        });

        document.getElementById('back-from-edit-request')?.addEventListener('click', () => {
            App.showScreen('requests-list');
        });

        // FAB button
        document.getElementById('fab-add')?.addEventListener('click', () => {
            App.showScreen('add-request');
            loadClientsAndCars();
        });
    }

    // ==================== CHECK DUPLICATE REQUEST ====================
    async function checkDuplicateRequest(clientId, carId, excludeRequestId = null) {
        try {
            const requests = await API.getRequests();
            
            // Filter active or pending requests
            const activeOrPendingRequests = requests.filter(req => 
                req.status === 'active' || req.status === 'pending'
            );
            
            // Check if there's an existing request with same client and car
            const duplicate = activeOrPendingRequests.find(req => {
                const isSameClient = req.clientid == clientId;
                const isSameCar = req.carid == carId;
                const isDifferentRequest = excludeRequestId ? req.id != excludeRequestId : true;
                
                return isSameClient && isSameCar && isDifferentRequest;
            });
            
            if (duplicate) {
                const statusText = duplicate.status === 'active' ? 'Active' : 'Pending';
                const clientName = duplicate.clientName || 'this client';
                const carName = duplicate.carName || 'this car';
                
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

        try {
            container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"><div class="spinner"></div><p>Loading requests...</p></div></div>';
            
            const [requests, clients, cars] = await Promise.all([
                API.getRequests(),
                API.getClients(),
                API.getCars()
            ]);

            // Create a Set of existing client IDs for quick lookup
            const existingClientIds = new Set(clients.map(c => c.id.toString()));
            
            // Filter out requests whose client no longer exists, and enrich the rest
            const validRequests = [];
            const orphanedRequests = [];
            
            for (const req of requests) {
                const clientExists = existingClientIds.has(req.clientid?.toString());
                
                if (clientExists) {
                    const client = clients.find(c => c.id == req.clientid);
                    const car = cars.find(c => c.id == req.carid);
                    
                    validRequests.push({
                        ...req,
                        clientName: client ? client.name : 'Unknown',
                        carName: car ? `${car.brand} ${car.model}` : 'Unknown'
                    });
                } else {
                    // Track orphaned requests (client was deleted)
                    orphanedRequests.push(req);
                }
            }
            
            // If there are orphaned requests, log and optionally delete them
            if (orphanedRequests.length > 0) {
                console.log(`🗑️ Found ${orphanedRequests.length} orphaned requests (client deleted). These will be removed.`);
                // Optionally: Delete orphaned requests from storage
                const deletePromises = orphanedRequests.map(req => API.deleteRequest(req.id));
                await Promise.all(deletePromises);
                App.showToast(`Cleaned up ${orphanedRequests.length} orphaned request(s)`, 'info', 3000);
            }
            
            displayRequests(validRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading requests</h3><p>Please try again</p></div>';
            App.showToast('Failed to load requests', 'error');
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
                    <button type="button" class="btn btn-primary" onclick="App.showScreen('add-request'); RequestsModule.loadClientsAndCars()">
                        <i class="fa-solid fa-plus" style="font-size:16px;margin:5px"></i> Add Request
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        requests.forEach(request => {
            html += createRequestCard(request);
        });

        container.innerHTML = html;
    }

    function createRequestCard(request) {
        const status = request.status || 'pending';
        const statusClass = `status-${status}`;
        const statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';
        
        return `
            <div class="request-card" onclick="RequestsModule.loadRequestDetails('${request.id}')">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="request-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div class="request-info" style="flex: 1;">
                        <div class="request-title">${App.escapeHtml(request.title || 'No Title')}</div>
                        <div class="request-details">
                            <p><i class="fa-solid fa-user"></i> ${App.escapeHtml(request.clientName || 'Unknown')}</p>
                            <p><i class="fa-solid fa-car"></i> ${App.escapeHtml(request.carName || 'Unknown')}</p>
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
            const [request, clients, cars] = await Promise.all([
                API.getRequest(requestId),
                API.getClients(),
                API.getCars()
            ]);

            // Check if client exists
            const clientExists = clients.some(c => c.id == request.clientid);
            
            if (!clientExists) {
                App.showToast('This request is linked to a client that no longer exists', 'warning');
                // Optionally delete this request
                await API.deleteRequest(requestId);
                await loadRequests();
                App.showScreen('requests-list');
                return;
            }

            const client = clients.find(c => c.id == request.clientid);
            const car = cars.find(c => c.id == request.carid);

            request.clientName = client ? client.name : 'Unknown';
            request.carName = car ? `${car.brand} ${car.model}` : 'Unknown';
            
            const container = document.getElementById('request-details-container');
            if (!container) return;

            const status = request.status || 'pending';
            const statusClass = `status-${status}`;
            const statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';

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
                            <div class="info-value">${App.escapeHtml(request.clientName || 'Unknown')}</div>
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-car"></i></div>
                        <div class="info-content">
                            <label>Car</label>
                            <div class="info-value">${App.escapeHtml(request.carName || 'Unknown')}</div>
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
            const [clients, cars] = await Promise.all([
                API.getClients(),
                API.getCars()
            ]);

            const clientSelect = document.getElementById('request-client');
            const carSelect = document.getElementById('request-car');
            const editClientSelect = document.getElementById('edit-request-client');
            const editCarSelect = document.getElementById('edit-request-car');

            if (clientSelect) {
                clientSelect.innerHTML = '<option value="" disabled selected>Select Client</option>';
                clients.forEach(client => {
                    clientSelect.innerHTML += `<option value="${App.escapeHtml(client.id)}">${App.escapeHtml(client.name)}</option>`;
                });
            }

            if (carSelect) {
                carSelect.innerHTML = '<option value="" disabled selected>Select Car</option>';
                cars.forEach(car => {
                    carSelect.innerHTML += `<option value="${App.escapeHtml(car.id)}">${App.escapeHtml(car.brand)} ${App.escapeHtml(car.model)} (${App.escapeHtml(car.year)})</option>`;
                });
            }

            if (editClientSelect) {
                editClientSelect.innerHTML = '<option value="" disabled selected>Select Client</option>';
                clients.forEach(client => {
                    editClientSelect.innerHTML += `<option value="${App.escapeHtml(client.id)}">${App.escapeHtml(client.name)}</option>`;
                });
            }

            if (editCarSelect) {
                editCarSelect.innerHTML = '<option value="" disabled selected>Select Car</option>';
                cars.forEach(car => {
                    editCarSelect.innerHTML += `<option value="${App.escapeHtml(car.id)}">${App.escapeHtml(car.brand)} ${App.escapeHtml(car.model)} (${App.escapeHtml(car.year)})</option>`;
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

        // Check for duplicate request
        const duplicateCheck = await checkDuplicateRequest(clientId, carId);
        
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        try {
            const clients = await API.getClients();
            const cars = await API.getCars();
            const client = clients.find(c => c.id === clientId);
            const car = cars.find(c => c.id === carId);
            
            const requestData = {
                clientId,
                carId,
                status,
                title: `Request for ${car?.brand || 'Car'} - ${client?.name || 'Client'}`,
                clientName: client?.name || 'Unknown',
                carName: car ? `${car.brand} ${car.model}` : 'Unknown',
                notes,
                createdAt: new Date().toISOString()
            };

            await API.addRequest(requestData);
            App.showToast('Request added successfully', 'success');
            
            document.getElementById('add-request-form').reset();
            await loadRequests();
            App.showScreen('requests-list');
        } catch (error) {
            console.error('Error adding request:', error);
            App.showToast('Failed to add request', 'error');
        }
    }

    // ==================== EDIT REQUEST ====================
    async function editRequest(requestId) {
        try {
            const request = await API.getRequest(requestId);
            
            await loadClientsAndCars();
            
            setTimeout(() => {
                document.getElementById('edit-request-client').value = request.clientid || '';
                document.getElementById('edit-request-car').value = request.carid || '';
                document.getElementById('edit-request-status').value = request.status || 'active';
                document.getElementById('edit-request-notes').value = request.notes || '';
                document.getElementById('update-request').dataset.requestId = requestId;
            }, 100);
            
            App.showScreen('edit-request');
        } catch (error) {
            console.error('Error editing request:', error);
            App.showToast('Failed to load request for edit', 'error');
        }
    }

    // ==================== UPDATE REQUEST ====================
    async function updateRequest(e) {
        e.preventDefault();
        
        const requestId = document.getElementById('update-request').dataset.requestId;
        if (!requestId) return;

        const clientId = document.getElementById('edit-request-client').value;
        const carId = document.getElementById('edit-request-car').value;
        const status = document.getElementById('edit-request-status').value;
        const notes = document.getElementById('edit-request-notes').value.trim();

        if (!clientId || !carId || !status) {
            App.showToast('All fields are required', 'error');
            return;
        }

        // Check for duplicate request (excluding current request)
        const duplicateCheck = await checkDuplicateRequest(clientId, carId, requestId);
        
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        try {
            const clients = await API.getClients();
            const cars = await API.getCars();
            const client = clients.find(c => c.id === clientId);
            const car = cars.find(c => c.id === carId);
            
            const requestData = {
                clientId,
                carId,
                status,
                title: `Request for ${car?.brand || 'Car'} - ${client?.name || 'Client'}`,
                clientName: client?.name || 'Unknown',
                carName: car ? `${car.brand} ${car.model}` : 'Unknown',
                notes
            };

            await API.updateRequest(requestId, requestData);
            App.showToast('Request updated successfully', 'success');
            
            await loadRequests();
            App.showScreen('requests-list');
        } catch (error) {
            console.error('Error updating request:', error);
            App.showToast('Failed to update request', 'error');
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

    // Public API
    return {
        init,
        loadRequests,
        loadRequestDetails,
        editRequest,
        deleteRequest,
        loadClientsAndCars,
        checkDuplicateRequest
    };
})();

window.RequestsModule = RequestsModule;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('requests-container')) {
        RequestsModule.init();
    }
});