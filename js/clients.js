/**
 * Clients Module - Compact Grid with Smart Expandable Cards
 * Smart Expand: Opens downward if space available, otherwise opens upward
 * FIXED: Uses container-relative calculations with proper scroll container detection
 * IMPROVED: Added animation states with transitionend events, direction tracking, and smooth transitions
 * ENHANCED: Fixed edge cases for rapid clicks and proper scroll container detection
 * FIXED: Immediate card closing when opening new card
 * ADDED: Dynamic padding for grid container to prevent content cutoff
 */

const ClientsModule = (function() {
    let currentClients = [];
    let isInitialized = false;
    let isLoading = false;
    let expandedClientId = null;
    let expandedCardElement = null;
    let expandedDirection = null; // Track expansion direction for re-renders
    let isAnimating = false; // Prevent rapid clicks
    let outsideClickBound = false;

    function getAvatarColor(name) {
        const colors = ['#4361ee', '#4895ef', '#3f37c9', '#4cc9f0', '#06d6a0', '#ffb703', '#e63946', '#f72585', '#7209b7', '#560bad'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash |= 0;
        }
        return colors[Math.abs(hash) % colors.length];
    }

    function formatDateTime(dateString) {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleDateString('en-US', options);
        } catch {
            return 'Invalid date';
        }
    }

    /**
     * Force close card immediately without animation
     * Used when switching between cards
     */
    function forceCloseCard(card) {
        if (!card) return;

        const expandable = card.querySelector('[data-expandable="true"]');
        const chevron = card.querySelector('.chevron-icon');

        // Remove all expansion classes instantly
        card.classList.remove('expanded', 'expand-up', 'expand-down');
        
        if (expandable) {
            expandable.classList.remove('expanded');
        }
        
        if (chevron) {
            chevron.classList.remove('rotated');
        }
    }

    /**
     * Reset grid padding to default
     */
    function resetGridPadding() {
        const grid = document.querySelector('.clients-compact-grid');
        if (grid) {
            grid.style.paddingBottom = "";
        }
    }

    function init() {
        if (isInitialized) return;
        console.log('👥 Clients Module Initialized');
        bindEvents();
        loadClients();
        isInitialized = true;
    }

    function bindEvents() {
        const addForm = document.getElementById('add-client-form');
        if (addForm) {
            const newAddForm = addForm.cloneNode(true);
            addForm.parentNode.replaceChild(newAddForm, addForm);
            newAddForm.addEventListener('submit', addClient);
        }

        const editForm = document.getElementById('edit-client-form');
        if (editForm) {
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            newEditForm.addEventListener('submit', updateClient);
        }

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

        const editHeaderBtn = document.getElementById('edit-from-details');
        if (editHeaderBtn) {
            const newEditBtn = editHeaderBtn.cloneNode(true);
            editHeaderBtn.parentNode.replaceChild(newEditBtn, editHeaderBtn);
            newEditBtn.addEventListener('click', function() {
                const clientId = this.dataset.clientId;
                if (clientId) editClient(clientId);
            });
        }

        const fabBtn = document.getElementById('fab-add');
        if (fabBtn) {
            const newFab = fabBtn.cloneNode(true);
            fabBtn.parentNode.replaceChild(newFab, fabBtn);
            newFab.addEventListener('click', () => App.showScreen('add-client'));
        }

        const container = document.getElementById('clients-container');
        if (container) {
            container.addEventListener('click', handleContainerClick);
        }

        if (!outsideClickBound) {
            document.addEventListener('click', handleOutsideClick);
            outsideClickBound = true;
        }
        
        // Handle window resize to close expanded cards
        window.addEventListener('resize', () => {
            if (expandedCardElement) {
                collapseExpandedCard();
            }
        });
    }

    function handleContainerClick(e) {
        const target = e.target;
        
        const toggleBtn = target.closest('[data-action="toggle"]');
        if (toggleBtn) {
            e.stopPropagation();
            const card = toggleBtn.closest('.compact-card');
            if (card) {
                const clientId = card.dataset.clientId;
                if (clientId) toggleCard(clientId);
            }
            return;
        }
        
        const actionBtn = target.closest('[data-action]');
        if (actionBtn && actionBtn !== toggleBtn) {
            e.stopPropagation();
            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;
            const phone = actionBtn.dataset.phone;
            
            switch(action) {
                case 'call':
                    if (phone && phone.trim()) callClient(phone);
                    else App.showToast('No phone number available', 'warning');
                    break;
                case 'whatsapp':
                    if (phone && phone.trim()) whatsAppClient(phone);
                    else App.showToast('No phone number available', 'warning');
                    break;
                case 'edit':
                    if (id) editClient(id);
                    break;
                case 'delete':
                    if (id) deleteClient(id);
                    break;
                case 'view':
                    if (id) viewClientDetails(id);
                    break;
            }
        }
    }

    function handleOutsideClick(e) {
        if (!expandedCardElement) return;
        
        // Check if click is outside the expanded card
        if (!expandedCardElement.contains(e.target)) {
            collapseExpandedCard();
        }
    }

    function collapseExpandedCard() {
        if (!expandedCardElement) return;
        if (isAnimating) return;
        
        const currentCard = expandedCardElement;
        const expandable = currentCard.querySelector('[data-expandable="true"]');
        const chevron = currentCard.querySelector('.chevron-icon');
        
        if (expandable) expandable.classList.remove('expanded');
        if (chevron) chevron.classList.remove('rotated');
        
        // Reset grid padding when closing
        resetGridPadding();
        
        // Use transitionend for better sync with CSS
        const handleTransitionEnd = () => {
            if (expandedCardElement === currentCard) {
                currentCard.classList.remove('expanded', 'expand-up', 'expand-down');
                expandedCardElement = null;
                expandedClientId = null;
                expandedDirection = null;
                isAnimating = false;
            }
            currentCard.removeEventListener('transitionend', handleTransitionEnd);
        };
        
        currentCard.addEventListener('transitionend', handleTransitionEnd, { once: true });
        
        // Fallback timeout in case transition doesn't fire
        setTimeout(() => {
            if (expandedCardElement === currentCard) {
                currentCard.classList.remove('expanded', 'expand-up', 'expand-down');
                expandedCardElement = null;
                expandedClientId = null;
                expandedDirection = null;
                isAnimating = false;
                resetGridPadding();
            }
        }, 250);
    }

    /**
     * Smart Expand Function - Opens downward if space available, otherwise upward
     * FIXED: Uses proper scroll container detection
     * IMPROVED: Cleaner direction logic with transitionend events
     * FIXED: Immediate closing of previous card when opening new one
     * ADDED: Dynamic grid padding for better visibility
     */
    function toggleExpand(card) {
        // Prevent rapid clicking during animation
        if (isAnimating) return;
        
        const isExpanded = card.classList.contains("expanded");
        
        // CLOSE PREVIOUS CARD IMMEDIATELY - THIS IS THE FIX
        if (expandedCardElement && expandedCardElement !== card) {
            // Force close without animation to prevent both cards being open
            forceCloseCard(expandedCardElement);
            expandedCardElement = null;
            expandedClientId = null;
            expandedDirection = null;
            resetGridPadding();
        }
        
        if (isExpanded) {
            collapseExpandedCard();
            return;
        }
        
        // Lock animation
        isAnimating = true;
        
        // IMPROVED: Get the actual scroll container
        const gridContainer = card.closest('.clients-compact-grid');
        let scrollContainer = null;
        
        if (gridContainer) {
            const computedStyle = getComputedStyle(gridContainer);
            // Check if container is actually scrollable
            if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
                scrollContainer = gridContainer;
            }
        }
        
        // Fallback to document element if no scrollable container found
        if (!scrollContainer) {
            scrollContainer = document.documentElement;
        }
        
        const containerRect = scrollContainer.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        
        // Calculate available space WITHIN the scroll container
        const spaceBelow = containerRect.bottom - cardRect.bottom;
        const spaceAbove = cardRect.top - containerRect.top;
        
        // Get expandable content height using scrollHeight (works even when hidden)
        const expandableContent = card.querySelector('[data-expandable="true"]');
        let neededSpace = 200; // Fallback value
        
        if (expandableContent) {
            // Temporarily make it visible to get accurate scrollHeight
            const originalVisibility = expandableContent.style.visibility;
            const originalDisplay = expandableContent.style.display;
            
            expandableContent.style.visibility = 'hidden';
            expandableContent.style.display = 'block';
            
            neededSpace = expandableContent.scrollHeight;
            
            // Restore original styles
            expandableContent.style.visibility = originalVisibility;
            expandableContent.style.display = originalDisplay;
        }
        
        // Add small padding for better UX
        neededSpace += 20;
        
        // IMPROVED: Cleaner direction logic
        const openUpward = spaceBelow < neededSpace && spaceAbove > spaceBelow;
        
        // ✅ ADDED: Dynamic grid padding based on expansion direction
        const grid = document.querySelector('.clients-compact-grid');
        if (grid) {
            if (!openUpward) {
                // Expanding downward - add extra padding at bottom
                grid.style.paddingBottom = "100px";
            } else {
                // Expanding upward - add less padding
                grid.style.paddingBottom = "50px";
            }
        }
        
        if (openUpward) {
            card.classList.add("expanded", "expand-up");
            card.classList.remove("expand-down");
            expandedDirection = 'up';
        } else {
            card.classList.add("expanded", "expand-down");
            card.classList.remove("expand-up");
            expandedDirection = 'down';
        }

        // ✅ FIX: Smart scroll بعد ما الكارد يفتح فعليًا
        setTimeout(() => {
            const rect = card.getBoundingClientRect();
            const expandEl = card.querySelector('.card-expandable');
            if (expandEl) {
                const expandRect = expandEl.getBoundingClientRect();

                // 👇 لو نازل لتحت وخرج من الشاشة
                if (expandRect.bottom > window.innerHeight) {
                    window.scrollBy({
                        top: expandRect.bottom - window.innerHeight + 20,
                        behavior: 'smooth'
                    });
                }

                // 👆 لو طالع لفوق وخرج من فوق
                if (expandRect.top < 0) {
                    window.scrollBy({
                        top: expandRect.top - 20,
                        behavior: 'smooth'
                    });
                }
            }
        }, 50);
        
        // Store expanded card reference
        expandedCardElement = card;
        expandedClientId = card.dataset.clientId;
        
        // Update chevron rotation
        const chevron = card.querySelector('.chevron-icon');
        if (chevron) chevron.classList.add('rotated');
        
        // Ensure expandable content is visible
        if (expandableContent) expandableContent.classList.add('expanded');
        
        // Use transitionend for better sync with CSS
        const handleTransitionEnd = () => {
            isAnimating = false;
            card.removeEventListener('transitionend', handleTransitionEnd);
        };
        
        card.addEventListener('transitionend', handleTransitionEnd, { once: true });
        
        // Fallback timeout in case transition doesn't fire
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    }

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
                countElement.innerHTML = `<span style="background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 20px;">${currentClients.length} clients</span>`;
            }
            displayClients(currentClients);
            if (window.SearchModule && window.SearchModule.refreshData) window.SearchModule.refreshData();
        } catch (error) {
            console.error('Error loading clients:', error);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading clients</h3><p>Please try again</p></div>';
            App.showToast('Failed to load clients', 'error');
        } finally {
            isLoading = false;
        }
    }

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

        const sortedClients = [...clients].sort((a, b) => new Date(b.registeredat || 0) - new Date(a.registeredat || 0));
        let html = '<div class="clients-compact-grid">';
        sortedClients.forEach(client => {
            const isExpanded = client.id === expandedClientId;
            html += createCompactCard(client, isExpanded);
        });
        html += '</div>';
        container.innerHTML = html;
        
        // Re-attach expand state and direction if needed
        if (expandedClientId) {
            expandedCardElement = document.querySelector(`.compact-card[data-client-id="${expandedClientId}"]`);
            if (expandedCardElement && expandedDirection) {
                // Restore the expansion direction
                if (expandedDirection === 'up') {
                    expandedCardElement.classList.add('expanded', 'expand-up');
                    expandedCardElement.classList.remove('expand-down');
                } else {
                    expandedCardElement.classList.add('expanded', 'expand-down');
                    expandedCardElement.classList.remove('expand-up');
                }
                
                // Restore grid padding
                const grid = document.querySelector('.clients-compact-grid');
                if (grid) {
                    if (expandedDirection === 'down') {
                        grid.style.paddingBottom = "350px";
                    } else {
                        grid.style.paddingBottom = "50px";
                    }
                }
                
                // Restore chevron rotation
                const chevron = expandedCardElement.querySelector('.chevron-icon');
                if (chevron) chevron.classList.add('rotated');
                
                // Restore expandable content
                const expandable = expandedCardElement.querySelector('[data-expandable="true"]');
                if (expandable) expandable.classList.add('expanded');
            }
        } else {
            expandedCardElement = null;
            expandedDirection = null;
            resetGridPadding();
        }
    }

    /**
     * UPDATED: Creates compact card with phone number in header
     * Registration date moved to expandable section
     */
    function createCompactCard(client, isExpanded) {
        const initials = App.getInitials(client.name);
        const avatarColor = getAvatarColor(client.name);
        const phone = client.phone || '';
        const email = client.email || '';
        const dateTime = formatDateTime(client.registeredat);
        
        return `
            <div class="compact-card ${isExpanded ? 'expanded' : ''}" data-client-id="${client.id}">
                <div class="card-header" data-action="toggle">
                    <div class="card-left">
                        <div class="card-avatar" style="background: ${avatarColor};">
                            ${App.escapeHtml(initials)}
                        </div>
                        <div class="card-info">
                            <h4 class="card-name">${App.escapeHtml(client.name)}</h4>
                            <div class="card-date">${phone ? App.escapeHtml(phone) : 'No phone'}</div>
                        </div>
                    </div>
                    <div class="chevron-icon ${isExpanded ? 'rotated' : ''}">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                </div>
                <div class="card-actions-horizontal">
                    <button type="button" class="btn-action btn-call" data-action="call" data-phone="${App.escapeHtml(phone)}" title="Call">
                        <i class="fa-solid fa-phone"></i>
                        <span>Call</span>
                    </button>
                    <button type="button" class="btn-action btn-whatsapp" data-action="whatsapp" data-phone="${App.escapeHtml(phone)}" title="WhatsApp">
                        <i class="fa-brands fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </button>
                    <button type="button" class="btn-action btn-edit" data-action="edit" data-id="${client.id}" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                        <span>Edit</span>
                    </button>
                    <button type="button" class="btn-action btn-delete" data-action="delete" data-id="${client.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                        <span>Delete</span>
                    </button>
                    <button type="button" class="btn-action btn-view" data-action="view" data-id="${client.id}" title="View">
                        <i class="fa-solid fa-eye"></i>
                        <span>View</span>
                    </button>
                </div>
                <div class="card-expandable ${isExpanded ? 'expanded' : ''}" data-expandable="true">
                    <div class="expandable-content">
                        <div class="info-section">
                            ${email ? `
                                <div class="info-row">
                                    <div class="info-label">
                                        <i class="fa-solid fa-envelope"></i>
                                        <span>Email</span>
                                    </div>
                                    <div class="info-value">${App.escapeHtml(email)}</div>
                                </div>
                            ` : ''}
                            ${phone ? `
                                <div class="info-row">
                                    <div class="info-label">
                                        <i class="fa-solid fa-phone"></i>
                                        <span>Phone</span>
                                    </div>
                                    <div class="info-value">${App.escapeHtml(phone)}</div>
                                </div>
                            ` : ''}
                            <div class="info-row">
                                <div class="info-label">
                                    <i class="fa-solid fa-clock"></i>
                                    <span>Registered</span>
                                </div>
                                <div class="info-value">${App.escapeHtml(dateTime)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function toggleCard(clientId) {
        const currentCard = document.querySelector(`.compact-card[data-client-id="${clientId}"]`);
        if (!currentCard) return;
        toggleExpand(currentCard);
    }

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
            const avatarColor = getAvatarColor(client.name);
            const phone = client.phone || 'No phone';
            const email = client.email || 'No email';
            const notes = client.notes || 'No notes';

            container.innerHTML = `
                <div class="client-profile">
                    <div class="profile-header">
                        <div class="profile-avatar" style="background: ${avatarColor};">${App.escapeHtml(initials)}</div>
                        <div class="profile-title">
                            <h2>${App.escapeHtml(client.name)}</h2>
                            <span class="member-since">Client since ${formatDateTime(client.registeredat)}</span>
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
                                    <button type="button" class="btn-sm btn-call" onclick="ClientsModule.callClient('${client.phone?.replace(/'/g, "\\'") || ''}')">
                                        <i class="fa-solid fa-phone"></i> Call
                                    </button>
                                    <button type="button" class="btn-sm btn-whatsapp" onclick="ClientsModule.whatsAppClient('${client.phone?.replace(/'/g, "\\'") || ''}')">
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
            if (editHeaderBtn) editHeaderBtn.dataset.clientId = client.id;
            App.showScreen('client-details');
        } catch (error) {
            console.error('Error viewing client:', error);
            App.showToast('Failed to load client details', 'error');
        }
    }

    function validateName(name) {
        if (!name || name.trim() === '') return { valid: false, message: 'Client name is required' };
        if (name.length < 3) return { valid: false, message: 'Name must be at least 3 characters' };
        return { valid: true };
    }

    function validateEmail(email) {
        if (!email || email.trim() === '') return { valid: true };
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) return { valid: false, message: 'Please enter a valid email address' };
        return { valid: true };
    }

    function validatePhone(phoneNumber) {
        if (!phoneNumber || phoneNumber.trim() === '') return { valid: true };
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        if (!/^\d+$/.test(digitsOnly)) return { valid: false, message: 'Phone number must contain only digits' };
        if (digitsOnly.length < 10 || digitsOnly.length > 15) return { valid: false, message: 'Phone number must be between 10 and 15 digits' };
        return { valid: true };
    }

    function validateNotes(notes) {
        if (notes && notes.length > 500) return { valid: false, message: 'Notes must not exceed 500 characters' };
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
            if (duplicate) return { isDuplicate: true, message: 'A client with the same name and phone number already exists' };
            return { isDuplicate: false };
        } catch (error) {
            console.error('Error checking duplicate client:', error);
            return { isDuplicate: false, error: true };
        }
    }

    async function addClient(e) {
        e.preventDefault();
        const name = document.getElementById('add-client-name').value.trim();
        const email = document.getElementById('add-client-email').value.trim();
        const countryCode = document.getElementById('country-code').value;
        const phoneNumber = document.getElementById('add-client-phone').value.trim();
        const notes = document.getElementById('add-client-notes').value.trim();

        const nameValidation = validateName(name);
        if (!nameValidation.valid) { App.showToast(nameValidation.message, 'error'); return; }
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) { App.showToast(emailValidation.message, 'error'); return; }
        const phoneValidation = validatePhone(phoneNumber);
        if (!phoneValidation.valid) { App.showToast(phoneValidation.message, 'error'); return; }
        const notesValidation = validateNotes(notes);
        if (!notesValidation.valid) { App.showToast(notesValidation.message, 'error'); return; }

        const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
        const duplicateCheck = await checkDuplicateClient(name, phone);
        if (duplicateCheck.isDuplicate) { App.showToast(duplicateCheck.message, 'error'); return; }

        const newClient = { name, email: email || null, phone, notes: notes || null };
        try {
            await API.addClient(newClient);
            App.showToast('Client added successfully', 'success');
            const form = document.getElementById('add-client-form');
            if (form) form.reset();
            await loadClients();
            App.showScreen('clients-list');
        } catch (error) {
            console.error('Error adding client:', error);
            App.showToast(error.message || 'Failed to add client', 'error');
        }
    }

    async function editClient(clientId) {
        try {
            const client = await API.getClient(clientId);
            if (!client) { App.showToast('Client not found', 'error'); return; }

            const nameField = document.getElementById('edit-client-name');
            const emailField = document.getElementById('edit-client-email');
            const phoneField = document.getElementById('edit-client-phone');
            const notesField = document.getElementById('edit-client-notes');
            const updateBtn = document.getElementById('update-client');

            if (nameField) nameField.value = client.name || '';
            if (emailField) emailField.value = client.email || '';

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

    async function updateClient(e) {
        e.preventDefault();
        const clientId = document.getElementById('update-client')?.dataset.clientId;
        if (!clientId) { App.showToast('Invalid client ID', 'error'); return; }

        const name = document.getElementById('edit-client-name').value.trim();
        const email = document.getElementById('edit-client-email').value.trim();
        const countryCode = document.getElementById('edit-country-code').value;
        const phoneNumber = document.getElementById('edit-client-phone').value.trim();
        const notes = document.getElementById('edit-client-notes').value.trim();

        const nameValidation = validateName(name);
        if (!nameValidation.valid) { App.showToast(nameValidation.message, 'error'); return; }
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) { App.showToast(emailValidation.message, 'error'); return; }
        const phoneValidation = validatePhone(phoneNumber);
        if (!phoneValidation.valid) { App.showToast(phoneValidation.message, 'error'); return; }
        const notesValidation = validateNotes(notes);
        if (!notesValidation.valid) { App.showToast(notesValidation.message, 'error'); return; }

        const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
        const duplicateCheck = await checkDuplicateClient(name, phone, clientId);
        if (duplicateCheck.isDuplicate) { App.showToast(duplicateCheck.message, 'error'); return; }

        const updateData = { name, email: email || null, phone, notes: notes || null };
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
    
    async function deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client? All associated requests will also be deleted.')) return;
        try {
            const deletedRequestsCount = await deleteClientRequests(clientId);
            if (deletedRequestsCount > 0) App.showToast(`Deleted ${deletedRequestsCount} request(s) associated with this client`, 'info');
            await API.deleteClient(clientId);
            App.showToast('Client deleted successfully', 'success');
            if (expandedClientId === clientId) { 
                expandedCardElement = null; 
                expandedClientId = null; 
                expandedDirection = null; 
                resetGridPadding();
            }
            await loadClients();
            if (window.RequestsModule && RequestsModule.loadRequests) await RequestsModule.loadRequests();
        } catch (error) {
            console.error('Error deleting client:', error);
            App.showToast('Failed to delete client', 'error');
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('clients-container')) ClientsModule.init();
});