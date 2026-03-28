/**
 * Clients Module - Compact grid with no notes on cards
 * Fixed: Event listeners duplication, async/await issues, error handling, state management
 */

const ClientsModule = (function() {
    // Private state
    let currentClients = [];
    let eventListenersBound = false;
    let isInitialized = false;
    let isLoading = false;

    // ==================== INITIALIZATION ====================
    function init() {
        if (isInitialized) return;
        
        console.log('👥 Clients Module Initialized');
        loadClients();
        bindEvents();
        isInitialized = true;
    }

    function bindEvents() {
        if (eventListenersBound) return;
        
        // Add Client Form
        const addForm = document.getElementById('add-client-form');
        if (addForm) {
            const newAddForm = addForm.cloneNode(true);
            addForm.parentNode.replaceChild(newAddForm, addForm);
            newAddForm.addEventListener('submit', addClient);
        }

        // Edit Client Form
        const editForm = document.getElementById('edit-client-form');
        if (editForm) {
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            newEditForm.addEventListener('submit', updateClient);
        }

        // Cancel buttons
        const cancelAdd = document.getElementById('cancel-add-client');
        if (cancelAdd) {
            const newCancelAdd = cancelAdd.cloneNode(true);
            cancelAdd.parentNode.replaceChild(newCancelAdd, cancelAdd);
            newCancelAdd.addEventListener('click', () => App.showScreen('clients-list'));
        }

        const cancelEdit = document.getElementById('cancel-edit-client');
        if (cancelEdit) {
            const newCancelEdit = cancelEdit.cloneNode(true);
            cancelEdit.parentNode.replaceChild(newCancelEdit, cancelEdit);
            newCancelEdit.addEventListener('click', () => App.showScreen('clients-list'));
        }

        // Back buttons
        const backFromAdd = document.getElementById('back-from-add');
        if (backFromAdd) {
            const newBackAdd = backFromAdd.cloneNode(true);
            backFromAdd.parentNode.replaceChild(newBackAdd, backFromAdd);
            newBackAdd.addEventListener('click', () => App.showScreen('clients-list'));
        }

        const backFromEdit = document.getElementById('back-from-edit');
        if (backFromEdit) {
            const newBackEdit = backFromEdit.cloneNode(true);
            backFromEdit.parentNode.replaceChild(newBackEdit, backFromEdit);
            newBackEdit.addEventListener('click', () => App.showScreen('clients-list'));
        }

        const backFromDetails = document.getElementById('back-from-details');
        if (backFromDetails) {
            const newBackDetails = backFromDetails.cloneNode(true);
            backFromDetails.parentNode.replaceChild(newBackDetails, backFromDetails);
            newBackDetails.addEventListener('click', () => App.showScreen('clients-list'));
        }

        // Edit from details button
        const editHeaderBtn = document.getElementById('edit-from-details');
        if (editHeaderBtn) {
            const newEditBtn = editHeaderBtn.cloneNode(true);
            editHeaderBtn.parentNode.replaceChild(newEditBtn, editHeaderBtn);
            newEditBtn.addEventListener('click', function() {
                const clientId = this.dataset.clientId;
                if (clientId) editClient(clientId);
            });
        }

        // FAB button
        const fabBtn = document.getElementById('fab-add');
        if (fabBtn) {
            const newFab = fabBtn.cloneNode(true);
            fabBtn.parentNode.replaceChild(newFab, fabBtn);
            newFab.addEventListener('click', () => App.showScreen('add-client'));
        }

        eventListenersBound = true;
    }

    // ==================== DELETE CLIENT REQUESTS ====================
    async function deleteClientRequests(clientId) {
        try {
            const requests = await API.getRequests();
            const clientRequests = requests.filter(req => req.clientid == clientId);
            
            if (clientRequests.length === 0) return 0;
            
            await Promise.all(clientRequests.map(req => API.deleteRequest(req.id)));
            return clientRequests.length;
        } catch (error) {
            console.error('Error deleting client requests:', error);
            return 0;
        }
    }

    // ==================== LOAD CLIENTS ====================
    async function loadClients() {
        const container = document.getElementById('clients-container');
        const countElement = document.getElementById('clients-count');
        
        if (!container) return;
        if (isLoading) return;
        
        isLoading = true;

        try {
            container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Loading clients...</p></div>';
            
            currentClients = await API.getClients();

            if (countElement) {
                countElement.innerHTML = `<span style="background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem;">${currentClients.length} clients</span>`;
            }

            displayClients(currentClients);
            
            // Notify SearchModule to refresh data
            if (window.SearchModule && window.SearchModule.refreshData) {
                window.SearchModule.refreshData();
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading clients</h3><p>Please try again</p></div>';
            App.showToast('Failed to load clients', 'error');
        } finally {
            isLoading = false;
        }
    }

    // ==================== DISPLAY CLIENTS ====================
    function displayClients(clients) {
        const container = document.getElementById('clients-container');
        if (!container) return;

        if (!clients || clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-users-slash"></i>
                    <h3>No clients found</h3>
                    <p>Add your first client to get started</p>
                    <button type="button" class="btn btn-primary" onclick="App.showScreen('add-client')">
                        <i class="fa-solid fa-plus"></i> Add Client
                    </button>
                </div>
            `;
            return;
        }

        // Sort by registration date (newest first)
        const sortedClients = [...clients].sort((a, b) => 
            new Date(b.registeredat || 0) - new Date(a.registeredat || 0)
        );

        let html = '<div class="clients-grid">';
        sortedClients.forEach(client => {
            html += createClientCard(client);
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ==================== CREATE CLIENT CARD ====================
    function createClientCard(client) {
        const initials = App.getInitials(client.name);
        const phone = client.phone || 'No phone';
        const email = client.email || '';

        return `
            <div class="client-card" onclick="ClientsModule.viewClientDetails('${client.id}')">
                <div class="client-card-header">
                    <div class="client-avatar">${App.escapeHtml(initials)}</div>
                    <div class="client-badge">Client</div>
                </div>
                <div class="client-card-body">
                    <h3 class="client-name">${App.escapeHtml(client.name)}</h3>
                    ${email ? `<div class="client-email"><i class="fa-solid fa-envelope"></i> ${App.escapeHtml(email)}</div>` : ''}
                    <div class="client-phone"><i class="fa-solid fa-phone"></i> ${App.escapeHtml(phone)}</div>
                </div>
                <div class="client-card-footer">
                    <div class="client-actions">
                        <button type="button" class="btn-icon btn-call" onclick="event.stopPropagation(); callClient('${client.phone}')" title="Call">
                            <i class="fa-solid fa-phone"></i>
                        </button>
                        <button type="button" class="btn-icon btn-whatsapp" onclick="event.stopPropagation(); whatsAppClient('${client.phone}')" title="WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>
                        <button type="button" class="btn-icon btn-edit" onclick="event.stopPropagation(); ClientsModule.editClient('${client.id}')" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" onclick="event.stopPropagation(); ClientsModule.deleteClient('${client.id}')" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== VIEW CLIENT DETAILS ====================
    async function viewClientDetails(clientId) {
        try {
            const client = await API.getClient(clientId);
            
            if (!client) {
                App.showToast('Client not found', 'error');
                return;
            }

            const container = document.getElementById('client-details-container');
            if (!container) return;

            const initials = App.getInitials(client.name);
            const phone = client.phone || 'No phone';
            const email = client.email || 'No email';
            const notes = client.notes || 'No notes';

            container.innerHTML = `
                <div class="client-profile">
                    <div class="profile-header">
                        <div class="profile-avatar">${App.escapeHtml(initials)}</div>
                        <div class="profile-title">
                            <h2>${App.escapeHtml(client.name)}</h2>
                            <span class="member-since">Client since ${formatDate(client.registeredat)}</span>
                        </div>
                    </div>
                    <div class="info-cards">
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fa-solid fa-phone"></i>
                            </div>
                            <div class="info-content">
                                <label>Phone</label>
                                <div class="info-value">${App.escapeHtml(phone)}</div>
                                <div class="info-actions">
                                    <button type="button" class="btn-sm btn-call" onclick="callClient('${client.phone}')">
                                        <i class="fa-solid fa-phone"></i> Call
                                    </button>
                                    <button type="button" class="btn-sm btn-whatsapp" onclick="whatsAppClient('${client.phone}')">
                                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fa-solid fa-envelope"></i>
                            </div>
                            <div class="info-content">
                                <label>Email</label>
                                <div class="info-value">${App.escapeHtml(email)}</div>
                                <a href="mailto:${App.escapeHtml(client.email)}" class="btn-sm">
                                    <i class="fa-solid fa-envelope"></i> Send Email
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="notes-section">
                        <div class="notes-header">
                            <i class="fa-solid fa-note-sticky"></i>
                            <h3>Notes</h3>
                        </div>
                        <div class="notes-content">
                            ${App.escapeHtml(notes)}
                        </div>
                    </div>
                    <div class="quick-actions">
                        <button type="button" class="btn btn-secondary" onclick="ClientsModule.editClient('${client.id}')">
                            <i class="fa-solid fa-pen"></i> Edit Profile
                        </button>
                    </div>
                </div>
            `;

            const editHeaderBtn = document.getElementById('edit-from-details');
            if (editHeaderBtn) {
                editHeaderBtn.dataset.clientId = client.id;
            }

            App.showScreen('client-details');
        } catch (error) {
            console.error('Error viewing client:', error);
            App.showToast('Failed to load client details', 'error');
        }
    }

    // ==================== VALIDATION FUNCTIONS ====================
    function validateName(name) {
        if (!name || name.trim() === '') {
            return { valid: false, message: 'Client name is required' };
        }
        if (name.length < 3) {
            return { valid: false, message: 'Name must be at least 3 characters' };
        }
        return { valid: true };
    }

    function validateEmail(email) {
        if (!email || email.trim() === '') {
            return { valid: true };
        }
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        return { valid: true };
    }

    function validatePhone(phoneNumber) {
        if (!phoneNumber || phoneNumber.trim() === '') {
            return { valid: true };
        }
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        if (!/^\d+$/.test(digitsOnly)) {
            return { valid: false, message: 'Phone number must contain only digits' };
        }
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            return { valid: false, message: 'Phone number must be between 10 and 15 digits' };
        }
        return { valid: true };
    }

    function validateNotes(notes) {
        if (notes && notes.length > 500) {
            return { valid: false, message: 'Notes must not exceed 500 characters' };
        }
        return { valid: true };
    }

    async function checkDuplicateClient(name, phone, excludeClientId = null) {
        try {
            const clients = await API.getClients();
            const normalizedPhone = phone ? phone.replace(/\s+/g, ' ').trim() : '';

            const duplicate = clients.find(client => {
                const isSameName = client.name?.toLowerCase() === name.toLowerCase();
                const clientPhone = client.phone ? client.phone.replace(/\s+/g, ' ').trim() : '';
                const isSamePhone = normalizedPhone && clientPhone === normalizedPhone;
                const isDifferentClient = excludeClientId ? client.id != excludeClientId : true;
                return isSameName && isSamePhone && isDifferentClient;
            });

            if (duplicate) {
                return { 
                    isDuplicate: true, 
                    message: 'A client with the same name and phone number already exists' 
                };
            }
            return { isDuplicate: false };
        } catch (error) {
            console.error('Error checking duplicate client:', error);
            return { isDuplicate: false, error: true };
        }
    }

    // ==================== ADD CLIENT ====================
    async function addClient(e) {
        e.preventDefault();

        const name = document.getElementById('add-client-name').value.trim();
        const email = document.getElementById('add-client-email').value.trim();
        const countryCode = document.getElementById('country-code').value;
        const phoneNumber = document.getElementById('add-client-phone').value.trim();
        const notes = document.getElementById('add-client-notes').value.trim();

        // Validation
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            App.showToast(nameValidation.message, 'error');
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            App.showToast(emailValidation.message, 'error');
            return;
        }

        const phoneValidation = validatePhone(phoneNumber);
        if (!phoneValidation.valid) {
            App.showToast(phoneValidation.message, 'error');
            return;
        }

        const notesValidation = validateNotes(notes);
        if (!notesValidation.valid) {
            App.showToast(notesValidation.message, 'error');
            return;
        }

        const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';

        // Check for duplicate
        const duplicateCheck = await checkDuplicateClient(name, phone);
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'error');
            return;
        }

        const newClient = {
            name,
            email: email || null,
            phone,
            notes: notes || null
        };

        try {
            await API.addClient(newClient);
            App.showToast('Client added successfully', 'success');
            
            // Reset form
            const form = document.getElementById('add-client-form');
            if (form) form.reset();
            
            // Refresh data
            await loadClients();
            App.showScreen('clients-list');
        } catch (error) {
            console.error('Error adding client:', error);
            App.showToast(error.message || 'Failed to add client', 'error');
        }
    }

    // ==================== EDIT CLIENT ====================
    async function editClient(clientId) {
        try {
            const client = await API.getClient(clientId);
            
            if (!client) {
                App.showToast('Client not found', 'error');
                return;
            }

            // Populate edit form
            const nameField = document.getElementById('edit-client-name');
            const emailField = document.getElementById('edit-client-email');
            const phoneField = document.getElementById('edit-client-phone');
            const notesField = document.getElementById('edit-client-notes');
            const updateBtn = document.getElementById('update-client');

            if (nameField) nameField.value = client.name || '';
            if (emailField) emailField.value = client.email || '';

            // Parse phone number
            if (client.phone && phoneField) {
                const phoneMatch = client.phone.match(/(\+\d+)?\s*(.+)/);
                if (phoneMatch) {
                    const countryCode = phoneMatch[1] || '+20';
                    const phoneNumber = phoneMatch[2] || '';
                    const countrySelect = document.getElementById('edit-country-code');
                    if (countrySelect) countrySelect.value = countryCode;
                    phoneField.value = phoneNumber.trim();
                } else {
                    phoneField.value = client.phone;
                }
            }

            if (notesField) notesField.value = client.notes || '';
            if (updateBtn) updateBtn.dataset.clientId = clientId;

            App.showScreen('edit-client');
        } catch (error) {
            console.error('Error editing client:', error);
            App.showToast('Failed to load client data', 'error');
        }
    }

    // ==================== UPDATE CLIENT ====================
    async function updateClient(e) {
        e.preventDefault();

        const clientId = document.getElementById('update-client')?.dataset.clientId;
        if (!clientId) {
            App.showToast('Invalid client ID', 'error');
            return;
        }

        const name = document.getElementById('edit-client-name').value.trim();
        const email = document.getElementById('edit-client-email').value.trim();
        const countryCode = document.getElementById('edit-country-code').value;
        const phoneNumber = document.getElementById('edit-client-phone').value.trim();
        const notes = document.getElementById('edit-client-notes').value.trim();

        // Validation
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            App.showToast(nameValidation.message, 'error');
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            App.showToast(emailValidation.message, 'error');
            return;
        }

        const phoneValidation = validatePhone(phoneNumber);
        if (!phoneValidation.valid) {
            App.showToast(phoneValidation.message, 'error');
            return;
        }

        const notesValidation = validateNotes(notes);
        if (!notesValidation.valid) {
            App.showToast(notesValidation.message, 'error');
            return;
        }

        const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';

        // Check for duplicate
        const duplicateCheck = await checkDuplicateClient(name, phone, clientId);
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'error');
            return;
        }

        const updateData = {
            name,
            email: email || null,
            phone,
            notes: notes || null
        };

        try {
            await API.updateClient(clientId, updateData);
            App.showToast('Client updated successfully', 'success');
            await loadClients();
            App.showScreen('clients-list');
        } catch (error) {
            console.error('Error updating client:', error);
            App.showToast(error.message || 'Failed to update client', 'error');
        }
    }

    // ==================== DELETE CLIENT ====================
    async function deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client? All associated requests will also be deleted.')) return;

        try {
            // Delete associated requests first
            const deletedRequestsCount = await deleteClientRequests(clientId);
            
            if (deletedRequestsCount > 0) {
                App.showToast(`Deleted ${deletedRequestsCount} request(s) associated with this client`, 'info');
            }
            
            // Delete the client
            await API.deleteClient(clientId);
            App.showToast('Client deleted successfully', 'success');
            
            // Refresh data
            await loadClients();
            
            // Refresh requests if RequestsModule is loaded
            if (window.RequestsModule && RequestsModule.loadRequests) {
                await RequestsModule.loadRequests();
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            App.showToast('Failed to delete client', 'error');
        }
    }

    // ==================== HELPER FUNCTIONS ====================
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    function callClient(phone) {
        if (phone && phone !== 'No phone' && phone !== 'No phone number') {
            const cleanPhone = phone.replace(/\s/g, '');
            window.location.href = `tel:${cleanPhone}`;
        } else {
            App.showToast('No phone number available', 'warning');
        }
    }

    function whatsAppClient(phone) {
        if (phone && phone !== 'No phone' && phone !== 'No phone number') {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else {
            App.showToast('No phone number available', 'warning');
        }
    }

    // ==================== PUBLIC API ====================
    return {
        init,
        loadClients,
        viewClientDetails,
        editClient,
        deleteClient,
        callClient,
        whatsAppClient,
        getCurrentClients: () => currentClients
    };
})();

window.ClientsModule = ClientsModule;
window.callClient = ClientsModule.callClient;
window.whatsAppClient = ClientsModule.whatsAppClient;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('clients-container')) {
        ClientsModule.init();
    }
});