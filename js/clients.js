    // ==================== ENTERPRISE CONFIGURATION ====================
    const CONFIG = Object.freeze({
        BREAKPOINTS: {
            DESKTOP: 1024,
            TABLET: 768,
            MOBILE: 480
        },
        VALIDATION: {
            NAME: { MIN: 2, MAX: 100 },
            PHONE: { MIN: 8, MAX: 15 },
            NOTES: { MAX: 500 }
        },
        UI: {
            INITIAL_DISPLAY: 10,
            LOAD_STEP: 10,
            DEBOUNCE_DELAY: 400,
            ANIMATION_DURATION: 300,
            MAX_STACK_SIZE: 20,
            SKELETON_COUNT: 5,
            MAX_ITEMS: 300,
            VIRTUAL_SCROLL_ITEM_HEIGHT: 72
        },
        WHATSAPP: {
            DEFAULT_MESSAGE: 'Hello 👋',
            DEFAULT_COUNTRY_CODE: '20'
        },
        RETRY: {
            MAX_ATTEMPTS: 3,
            BASE_DELAY: 1000,
            BACKOFF: 2
        }
    });

    // ==================== ACTION TYPES ====================
    const ACTIONS = Object.freeze({
        ADD: 'add',
        BACK: 'back',
        LOAD_MORE: 'load-more',
        VIEW_ALL: 'view-all',
        VIEW_LESS: 'view-less',
        TOGGLE: 'toggle',
        CALL: 'call',
        WHATSAPP: 'whatsapp',
        VIEW: 'view',
        EDIT: 'edit',
        DELETE: 'delete',
        RETRY: 'retry'
    });

    // ==================== TOAST SYSTEM ====================
    const Toast = {
        _element: null,
        
        _init() {
            if (!this._element) {
                this._element = document.getElementById('toast');
                if (!this._element) {
                    this._element = document.createElement('div');
                    this._element.id = 'toast';
                    this._element.setAttribute('role', 'alert');
                    this._element.setAttribute('aria-live', 'polite');
                    document.body.appendChild(this._element);
                }
            }
            return this._element;
        },
        
        show(message, type = 'info') {
            const toast = this._init();
            toast.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        },
        
        success(message) { this.show(message, 'success'); },
        error(message) { this.show(message, 'error'); },
        warning(message) { this.show(message, 'warning'); },
        info(message) { this.show(message, 'info'); }
    };

    // ==================== CORE UTILITIES ====================

    const Security = {
        escapeHtml: (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        
        sanitizeAttribute: (str) => {
            if (!str) return '';
            return Security.escapeHtml(str).replace(/\\/g, '&#92;');
        },
        
        encodeEmail: (email) => email ? encodeURIComponent(email) : ''
    };

    const DateTime = {
        format: (dateString) => {
            if (!dateString) return 'No date';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) throw new Error();
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch {
                return 'Invalid date';
            }
        }
    };

    const ColorUtils = {
        getAvatarColor: (name) => {
            const palette = ['#4361ee', '#4895ef', '#3f37c9', '#4cc9f0', '#06d6a0', '#ffb703', '#e63946', '#f72585', '#7209b7', '#560bad'];
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = ((hash << 5) - hash) + name.charCodeAt(i);
                hash |= 0;
            }
            return palette[Math.abs(hash) % palette.length];
        },
        
        getInitials: (name) => {
            if (!name) return '?';
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
    };

    const PhoneUtils = {
        clean: (phone) => phone ? phone.replace(/\s/g, '') : '',
        
        normalize: (phone) => {
            if (!phone) return '';
            let digits = phone.replace(/\D/g, '');
            if (digits.startsWith('0')) digits = digits.substring(1);
            return digits;
        },
        
        toWhatsApp: (phone) => {
            if (!phone) return '';
            let digits = PhoneUtils.normalize(phone);
            if (!digits.startsWith(CONFIG.WHATSAPP.DEFAULT_COUNTRY_CODE)) {
                digits = CONFIG.WHATSAPP.DEFAULT_COUNTRY_CODE + digits;
            }
            return digits;
        },
        
        getWhatsAppUrl: (phone) => {
            const clean = PhoneUtils.toWhatsApp(phone);
            const message = CONFIG.WHATSAPP.DEFAULT_MESSAGE;
            return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
        },
        
        extractParts: (phone) => {
            if (!phone) return { code: '+20', number: '' };
            const match = phone.match(/^\s*(\+\d+)?\s*(.*)$/);
            return {
                code: match?.[1] || '+20',
                number: (match?.[2] || '').trim()
            };
        }
    };

    // ==================== VALIDATION SERVICE WITH ID MAP (FIXED) ====================

    class ValidatorService {
        constructor() {
            this.phoneMap = new Map();
            this.emailMap = new Map();
            this._allClients = [];
        }
        
        buildMaps(clients) {
            this._allClients = [...clients];
            this.phoneMap.clear();
            this.emailMap.clear();
            
            for (const client of clients) {
                if (client.phone) {
                    const normalized = PhoneUtils.normalize(client.phone);
                    this.phoneMap.set(normalized, client.id);
                }
                if (client.email) {
                    const normalized = client.email.trim().toLowerCase();
                    this.emailMap.set(normalized, client.id);
                }
            }
        }
        
        _buildMapsExcluding(excludeId) {
            const tempPhoneMap = new Map();
            const tempEmailMap = new Map();
            
            for (const client of this._allClients) {
                if (excludeId && client.id == excludeId) continue;
                
                if (client.phone) {
                    const normalized = PhoneUtils.normalize(client.phone);
                    tempPhoneMap.set(normalized, client.id);
                }
                if (client.email) {
                    const normalized = client.email.trim().toLowerCase();
                    tempEmailMap.set(normalized, client.id);
                }
            }
            
            return { phoneMap: tempPhoneMap, emailMap: tempEmailMap };
        }
        
        name(name) {
            if (!name?.trim()) return { valid: false, message: 'Client name is required' };
            if (name.length < CONFIG.VALIDATION.NAME.MIN) {
                return { valid: false, message: `Name must be at least ${CONFIG.VALIDATION.NAME.MIN} characters` };
            }
            if (name.length > CONFIG.VALIDATION.NAME.MAX) {
                return { valid: false, message: `Name must not exceed ${CONFIG.VALIDATION.NAME.MAX} characters` };
            }
            return { valid: true };
        }
        
        email(email) {
            if (!email?.trim()) return { valid: true };
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            return regex.test(email) ? { valid: true } : { valid: false, message: 'Please enter a valid email address' };
        }
        
        phone(phone) {
            if (!phone?.trim()) return { valid: true };
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 0) return { valid: false, message: 'Phone number must contain at least one digit' };
            if (digits.length < CONFIG.VALIDATION.PHONE.MIN || digits.length > CONFIG.VALIDATION.PHONE.MAX) {
                return { valid: false, message: `Phone number must be between ${CONFIG.VALIDATION.PHONE.MIN} and ${CONFIG.VALIDATION.PHONE.MAX} digits` };
            }
            return { valid: true };
        }
        
        notes(notes) {
            if (notes?.length > CONFIG.VALIDATION.NOTES.MAX) {
                return { valid: false, message: `Notes must not exceed ${CONFIG.VALIDATION.NOTES.MAX} characters` };
            }
            return { valid: true };
        }
        
        duplicatePhone(phone, excludeId = null) {
            if (!phone?.trim()) return { valid: true };
            const normalizedPhone = PhoneUtils.normalize(phone);
            if (!normalizedPhone) return { valid: true };
            
            const { phoneMap } = this._buildMapsExcluding(excludeId);
            const existingClientId = phoneMap.get(normalizedPhone);
            
            if (existingClientId) {
                return { 
                    valid: false, 
                    message: `⚠️ Phone number "${phone}" is already used by another client. Please use a different number.` 
                };
            }
            return { valid: true };
        }
        
        duplicateEmail(email, excludeId = null) {
            if (!email?.trim()) return { valid: true };
            const normalizedEmail = email.trim().toLowerCase();
            
            const { emailMap } = this._buildMapsExcluding(excludeId);
            const existingClientId = emailMap.get(normalizedEmail);
            
            if (existingClientId) {
                return { 
                    valid: false, 
                    message: `⚠️ Email "${email}" is already used by another client. Please use a different email.` 
                };
            }
            return { valid: true };
        }
        
        validateClientUniqueness(phone, email, excludeId = null) {
            const phoneCheck = this.duplicatePhone(phone, excludeId);
            if (!phoneCheck.valid) return phoneCheck;
            
            const emailCheck = this.duplicateEmail(email, excludeId);
            if (!emailCheck.valid) return emailCheck;
            
            return { valid: true };
        }
        
        addToMaps(client) {
            this._allClients.push(client);
            if (client.phone) {
                const normalized = PhoneUtils.normalize(client.phone);
                this.phoneMap.set(normalized, client.id);
            }
            if (client.email) {
                const normalized = client.email.trim().toLowerCase();
                this.emailMap.set(normalized, client.id);
            }
        }
        
        updateInMaps(client) {
            const oldIndex = this._allClients.findIndex(c => c.id == client.id);
            if (oldIndex !== -1) {
                const oldClient = this._allClients[oldIndex];
                if (oldClient.phone) {
                    const oldPhone = PhoneUtils.normalize(oldClient.phone);
                    this.phoneMap.delete(oldPhone);
                }
                if (oldClient.email) {
                    const oldEmail = oldClient.email.trim().toLowerCase();
                    this.emailMap.delete(oldEmail);
                }
                this._allClients[oldIndex] = client;
            } else {
                this._allClients.push(client);
            }
            
            if (client.phone) {
                const normalized = PhoneUtils.normalize(client.phone);
                this.phoneMap.set(normalized, client.id);
            }
            if (client.email) {
                const normalized = client.email.trim().toLowerCase();
                this.emailMap.set(normalized, client.id);
            }
        }
        
        removeFromMaps(clientId) {
            const index = this._allClients.findIndex(c => c.id == clientId);
            if (index !== -1) {
                const client = this._allClients[index];
                if (client.phone) {
                    const phone = PhoneUtils.normalize(client.phone);
                    this.phoneMap.delete(phone);
                }
                if (client.email) {
                    const email = client.email.trim().toLowerCase();
                    this.emailMap.delete(email);
                }
                this._allClients.splice(index, 1);
            }
        }
    }

    // ==================== LOGGER ====================

    const Logger = {
        _prefix: '[Clients]',
        log: (...args) => console.log(Logger._prefix, ...args),
        info: (...args) => console.info(Logger._prefix, 'ℹ️', ...args),
        warn: (...args) => console.warn(Logger._prefix, '⚠️', ...args),
        error: (...args) => console.error(Logger._prefix, '❌', ...args)
    };

    // ==================== DEBOUNCE ====================

    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    // ==================== EVENT BUS WITH MEMORY LEAK PROTECTION ====================

    class EventBus {
        constructor() {
            this._events = new Map();
        }
        
        on(event, handler, context = null) {
            if (!this._events.has(event)) this._events.set(event, new Set());
            this._events.get(event).add({ handler, context });
            return () => this.off(event, handler);
        }
        
        off(event, handler) {
            if (!this._events.has(event)) return;
            const handlers = this._events.get(event);
            for (const item of handlers) {
                if (item.handler === handler) {
                    handlers.delete(item);
                    break;
                }
            }
            if (handlers.size === 0) this._events.delete(event);
        }
        
        emit(event, data) {
            if (!this._events.has(event)) return;
            this._events.get(event).forEach(({ handler }) => {
                try { handler(data); } catch (e) { Logger.error('Event error:', e); }
            });
        }
        
        clear() {
            this._events.clear();
        }
        
        removeContext(context) {
            for (const [event, handlers] of this._events.entries()) {
                for (const item of handlers) {
                    if (item.context === context) {
                        handlers.delete(item);
                    }
                }
                if (handlers.size === 0) this._events.delete(event);
            }
        }
    }

    // ==================== STORE WITH MIDDLEWARE ====================

    class Store {
        constructor(initialState = {}, middlewares = []) {
            this._state = { ...initialState };
            this._listeners = new Set();
            this._isDispatching = false;
            this._middlewares = middlewares;
            this._actionHistory = [];
        }
        
        get state() {
            return { ...this._state };
        }
        
        _applyMiddlewares(action, currentState, nextState) {
            let result = { action, currentState, nextState };
            for (const middleware of this._middlewares) {
                result = middleware(result);
                if (!result) break;
            }
            return result?.nextState || nextState;
        }
        
        dispatch(action, updater) {
            if (this._isDispatching) {
                Logger.warn('Cannot update state while dispatching');
                return;
            }
            
            this._isDispatching = true;
            const prevState = this.state;
            const rawNextState = typeof updater === 'function' ? updater(prevState) : { ...prevState, ...updater };
            const nextState = this._applyMiddlewares(action, prevState, rawNextState);
            
            this._state = nextState;
            this._isDispatching = false;
            
            this._actionHistory.push({ action, timestamp: Date.now(), prevState, nextState });
            if (this._actionHistory.length > 100) this._actionHistory.shift();
            
            this._listeners.forEach(listener => {
                try { listener(nextState, prevState, action); } catch (e) { Logger.error('Listener error:', e); }
            });
        }
        
        subscribe(listener) {
            this._listeners.add(listener);
            return () => this._listeners.delete(listener);
        }
        
        getActionHistory() {
            return [...this._actionHistory];
        }
        
        destroy() {
            this._listeners.clear();
            this._state = {};
            this._actionHistory = [];
        }
    }

    // ==================== REQUEST MANAGER ====================

    class RequestManager {
        constructor() {
            this._pending = new Map();
            this._current = new Map();
        }
        
        _generateId() {
            return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        async execute(context, fn) {
            const requestId = this._generateId();
            this._current.set(context, requestId);
            this._pending.set(requestId, true);
            
            try {
                const result = await fn();
                if (this._current.get(context) !== requestId) return null;
                return result;
            } catch (error) {
                if (this._current.get(context) !== requestId) return null;
                throw error;
            } finally {
                this._pending.delete(requestId);
            }
        }
        
        cancelAll() {
            this._current.clear();
            this._pending.clear();
        }
    }

    // ==================== API WRAPPER ====================

    class ApiWrapper {
        async getClients() {
            try {
                const result = await API.Clients.getAll({}, 1, CONFIG.UI.MAX_ITEMS);
                return result.data || [];
            } catch (error) {
                Logger.error('getClients failed:', error);
                throw error;
            }
        }
        
        async getClient(id) {
            try {
                return await API.Clients.getById(id);
            } catch (error) {
                Logger.error('getClient failed:', error);
                throw error;
            }
        }
        
        async addClient(data) {
            try {
                return await API.Clients.create(data);
            } catch (error) {
                Logger.error('addClient failed:', error);
                throw error;
            }
        }
        
        async updateClient(id, data) {
            try {
                return await API.Clients.update(id, data);
            } catch (error) {
                Logger.error('updateClient failed:', error);
                throw error;
            }
        }
        
        async deleteClient(id) {
            try {
                return await API.Clients.delete(id);
            } catch (error) {
                Logger.error('deleteClient failed:', error);
                throw error;
            }
        }
        
        async getRequests() {
            try {
                const result = await API.Requests.getAll({}, 1, 1000);
                return result.data || [];
            } catch (error) {
                Logger.error('getRequests failed:', error);
                throw error;
            }
        }
        
        async deleteRequest(id) {
            try {
                return await API.Requests.delete(id);
            } catch (error) {
                Logger.error('deleteRequest failed:', error);
                throw error;
            }
        }
    }

    // ==================== UI RENDERERS (SEPARATED) ====================

    const UISkeleton = {
        desktop: () => {
            const rows = [];
            rows.push('<div class="data-table-container"><table class="data-table clients-table"><thead><tr><th>Client</th><th>Phone</th><th>Email</th><th>Registered</th><th>Actions</th></tr></thead><tbody>');
            for (let i = 0; i < CONFIG.UI.SKELETON_COUNT; i++) {
                rows.push(`<tr class="skeleton-row">
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-buttons"><div class="skeleton-btn"></div><div class="skeleton-btn"></div><div class="skeleton-btn"></div></div></td>
                </tr>`);
            }
            rows.push('</tbody></table></div>');
            return rows.join('');
        },
        
        mobile: () => {
            const rows = ['<div class="clients-compact-grid">'];
            for (let i = 0; i < CONFIG.UI.SKELETON_COUNT; i++) {
                rows.push(`<div class="compact-card skeleton-card">
                    <div class="card-header"><div class="card-left"><div class="card-avatar skeleton-avatar"></div>
                    <div class="card-info"><h4 class="card-name skeleton-text"></h4><div class="card-date skeleton-text"></div></div></div></div>
                </div>`);
            }
            rows.push('</div>');
            return rows.join('');
        }
    };

    const UITable = {
        render: (clients, state) => {
            if (!clients?.length) {
                return `<div class="empty-state"><i class="fa-solid fa-users-slash"></i><h3>No clients found</h3><p>Add your first client to get started</p><button class="btn btn-primary" data-action="${ACTIONS.ADD}"><i class="fa-solid fa-plus"></i> Add Client</button></div>`;
            }
            
            const isShowingAll = state.displayCount >= state.total;
            const rows = [];
            rows.push('<div class="data-table-container"><table class="data-table clients-table"><thead><tr>');
            rows.push('<th>Client</th><th>Phone</th><th>Email</th><th>Registered</th><th style="text-align:right">');
            
            if (isShowingAll) {
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_LESS}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-up"></i> View Less</button>`);
            } else {
                const remaining = state.total - state.displayCount;
                const nextCount = Math.min(CONFIG.UI.LOAD_STEP, remaining);
                rows.push(`<button class="btn btn-sm btn-primary" data-action="${ACTIONS.LOAD_MORE}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-down"></i> Load More (${nextCount})</button>`);
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_ALL}" style="margin-left:8px;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-list"></i> View All (${state.total})</button>`);
            }
            
            rows.push('</th></tr></thead><tbody>');
            
            for (const client of clients) {
                const safeId = Security.escapeHtml(String(client.id));
                const safePhone = Security.sanitizeAttribute(client.phone || '');
                rows.push(`<tr data-client-id="${safeId}">
                    <td><strong>${Security.escapeHtml(client.name)}</strong></td>
                    <td>${Security.escapeHtml(client.phone || 'No phone')}</td>
                    <td>${Security.escapeHtml(client.email || 'No email')}</td>
                    <td><small>${DateTime.format(client.registeredat)}</small></td>
                    <td><div class="action-buttons" style="justify-content:flex-end">
                        <button class="action-btn call" data-action="${ACTIONS.CALL}" data-phone="${safePhone}" title="Call"><i class="fa-solid fa-phone"></i></button>
                        <button class="action-btn whatsapp" data-action="${ACTIONS.WHATSAPP}" data-phone="${safePhone}" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></button>
                        <button class="action-btn view" data-action="${ACTIONS.VIEW}" data-id="${safeId}" title="View"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn edit" data-action="${ACTIONS.EDIT}" data-id="${safeId}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete" data-action="${ACTIONS.DELETE}" data-id="${safeId}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div></td>
                </tr>`);
            }
            
            rows.push('</tbody><tr></div>');
            return rows.join('');
        }
    };

    const UICards = {
        render: (clients, state) => {
            if (!clients?.length) {
                return `<div class="empty-state"><i class="fa-solid fa-users-slash"></i><h3>No clients found</h3><p>Add your first client to get started</p><button class="btn btn-primary" data-action="${ACTIONS.ADD}"><i class="fa-solid fa-plus"></i> Add Client</button></div>`;
            }
            
            const isShowingAll = state.displayCount >= state.total;
            const rows = [];
            
            rows.push(`<div class="mobile-controls-header" style="display:flex;justify-content:flex-end;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border);margin-bottom:8px">`);
            if (isShowingAll) {
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_LESS}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-up"></i> View Less</button>`);
            } else {
                const remaining = state.total - state.displayCount;
                const nextCount = Math.min(CONFIG.UI.LOAD_STEP, remaining);
                rows.push(`<button class="btn btn-sm btn-primary" data-action="${ACTIONS.LOAD_MORE}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-down"></i> Load More (${nextCount})</button>`);
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_ALL}" style="margin-left:8px;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-list"></i> View All (${state.total})</button>`);
            }
            rows.push('</div><div class="clients-compact-grid">');
            
            for (const client of clients) {
                const isExpanded = state.expandedId === String(client.id);
                const expandedClass = isExpanded ? 'expanded' : '';
                const safeId = Security.escapeHtml(String(client.id));
                const safePhone = Security.sanitizeAttribute(client.phone || '');
                
                rows.push(`<div class="compact-card ${expandedClass}" data-client-id="${safeId}">
                    <div class="card-header" data-action="${ACTIONS.TOGGLE}" role="button" tabindex="0" aria-expanded="${isExpanded}">
                        <div class="card-left">
                            <div class="card-avatar" style="background:${ColorUtils.getAvatarColor(client.name)}">${ColorUtils.getInitials(client.name)}</div>
                            <div class="card-info">
                                <h4 class="card-name">${Security.escapeHtml(client.name)}</h4>
                                <div class="card-date">${Security.escapeHtml(client.phone || 'No phone')}</div>
                            </div>
                        </div>
                        <div class="chevron-icon ${isExpanded ? 'rotated' : ''}"><i class="fa-solid fa-chevron-down"></i></div>
                    </div>
                    <div class="card-actions-horizontal">
                        <button class="btn-action btn-call" data-action="${ACTIONS.CALL}" data-phone="${safePhone}"><i class="fa-solid fa-phone"></i><span>Call</span></button>
                        <button class="btn-action btn-whatsapp" data-action="${ACTIONS.WHATSAPP}" data-phone="${safePhone}"><i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span></button>
                        <button class="btn-action btn-edit" data-action="${ACTIONS.EDIT}" data-id="${safeId}"><i class="fa-solid fa-pen"></i><span>Edit</span></button>
                        <button class="btn-action btn-delete" data-action="${ACTIONS.DELETE}" data-id="${safeId}"><i class="fa-solid fa-trash"></i><span>Delete</span></button>
                        <button class="btn-action btn-view" data-action="${ACTIONS.VIEW}" data-id="${safeId}"><i class="fa-solid fa-eye"></i><span>View</span></button>
                    </div>
                    <div class="card-expandable" data-expandable="true">
                        <div class="expandable-content"><div class="info-section">
                            ${client.email ? `<div class="info-row"><div class="info-label"><i class="fa-solid fa-envelope"></i><span>Email</span></div><div class="info-value">${Security.escapeHtml(client.email)}</div></div>` : ''}
                            ${client.phone ? `<div class="info-row"><div class="info-label"><i class="fa-solid fa-phone"></i><span>Phone</span></div><div class="info-value">${Security.escapeHtml(client.phone)}</div></div>` : ''}
                            <div class="info-row"><div class="info-label"><i class="fa-solid fa-clock"></i><span>Registered</span></div><div class="info-value">${DateTime.format(client.registeredat)}</div></div>
                            ${client.notes ? `<div class="info-row"><div class="info-label"><i class="fa-solid fa-note-sticky"></i><span>Notes</span></div><div class="info-value">${Security.escapeHtml(client.notes)}</div></div>` : ''}
                        </div></div>
                    </div>
                </div>`);
            }
            
            rows.push('</div>');
            return rows.join('');
        }
    };

    const UIDetails = {
        render: (client) => {
            if (!client || !client.name) {
                return `<div class="empty-state error">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Error Loading Profile</h3>
                    <p>Client data is missing or invalid.</p>
                    <button class="btn btn-primary" data-action="${ACTIONS.BACK}" data-target="clients-list">Go Back</button>
                </div>`;
            }
            
            const isDesktop = window.innerWidth >= CONFIG.BREAKPOINTS.DESKTOP;
            const containerClass = isDesktop ? 'client-profile desktop-profile' : 'client-profile';
            const safeId = Security.escapeHtml(String(client.id));
            const safePhone = Security.sanitizeAttribute(client.phone || '');
            
            return `<div class="${containerClass}" role="region">
                <div class="profile-header">
                    <div class="profile-avatar" style="background:${ColorUtils.getAvatarColor(client.name)}">${ColorUtils.getInitials(client.name)}</div>
                    <div class="profile-title">
                        <h2>${Security.escapeHtml(client.name)}</h2>
                        <span class="member-since">Client since ${DateTime.format(client.registeredat)}</span>
                    </div>
                </div>
                <div class="info-cards">
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-phone"></i></div>
                        <div class="info-content">
                            <label>Phone</label>
                            <div class="info-value">${Security.escapeHtml(client.phone || 'No phone')}</div>
                            <div class="info-actions">
                                <button class="btn-sm btn-call" data-action="${ACTIONS.CALL}" data-phone="${safePhone}"><i class="fa-solid fa-phone"></i> Call</button>
                                <button class="btn-sm btn-whatsapp" data-action="${ACTIONS.WHATSAPP}" data-phone="${safePhone}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
                            </div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-envelope"></i></div>
                        <div class="info-content">
                            <label>Email</label>
                            <div class="info-value">${Security.escapeHtml(client.email || 'No email')}</div>
                            ${client.email ? `<a href="mailto:${Security.encodeEmail(client.email)}" class="btn-sm"><i class="fa-solid fa-envelope"></i> Send Email</a>` : ''}
                        </div>
                    </div>
                </div>
                ${client.notes ? `<div class="notes-section"><div class="notes-header"><i class="fa-solid fa-note-sticky"></i><h3>Notes</h3></div><div class="notes-content">${Security.escapeHtml(client.notes).replace(/\n/g, '<br>')}</div></div>` : ''}
                <div class="quick-actions">
                    <button class="btn btn-secondary" data-action="${ACTIONS.EDIT}" data-id="${safeId}"><i class="fa-solid fa-pen"></i> Edit Profile</button>
                </div>
            </div>`;
        }
    };

    // ==================== VIRTUAL SCROLLING ====================
    class VirtualScroller {
        constructor(container, itemHeight, renderItem) {
            this.container = container;
            this.itemHeight = itemHeight;
            this.renderItem = renderItem;
            this.items = [];
            this.startIndex = 0;
            this.endIndex = 0;
            this.visibleCount = 0;
            this.scrollHandler = null;
        }
        
        setItems(items) {
            this.items = items;
            this._calculateVisibleCount();
            this._render();
            this._attachScroll();
        }
        
        _calculateVisibleCount() {
            const containerHeight = this.container?.clientHeight || window.innerHeight;
            this.visibleCount = Math.ceil(containerHeight / this.itemHeight) + 5;
            this.endIndex = Math.min(this.startIndex + this.visibleCount, this.items.length);
        }
        
        _render() {
            if (!this.container) return;
            
            const visibleItems = this.items.slice(this.startIndex, this.endIndex);
            const topPadding = this.startIndex * this.itemHeight;
            const bottomPadding = (this.items.length - this.endIndex) * this.itemHeight;
            
            const html = `
                <div style="height: ${topPadding}px;"></div>
                ${visibleItems.map((item, idx) => this.renderItem(item, this.startIndex + idx)).join('')}
                <div style="height: ${bottomPadding}px;"></div>
            `;
            
            requestAnimationFrame(() => {
                if (this.container) this.container.innerHTML = html;
            });
        }
        
        _attachScroll() {
            if (this.scrollHandler) {
                this.container?.removeEventListener('scroll', this.scrollHandler);
            }
            
            this.scrollHandler = () => {
                const scrollTop = this.container?.scrollTop || 0;
                const newStartIndex = Math.floor(scrollTop / this.itemHeight);
                
                if (newStartIndex !== this.startIndex) {
                    this.startIndex = Math.max(0, newStartIndex);
                    this.endIndex = Math.min(this.startIndex + this.visibleCount, this.items.length);
                    this._render();
                }
            };
            
            this.container?.addEventListener('scroll', this.scrollHandler);
        }
        
        destroy() {
            if (this.scrollHandler) {
                this.container?.removeEventListener('scroll', this.scrollHandler);
                this.scrollHandler = null;
            }
        }
    }

    // ==================== MAIN MODULE ====================

    const createClientsModule = (dependencies = {}) => {
        const api = new ApiWrapper();
        const eventBus = new EventBus();
        const requestManager = new RequestManager();
        const validator = new ValidatorService();
        
        const store = new Store({
            items: [],
            isLoading: false,
            displayCount: CONFIG.UI.INITIAL_DISPLAY,
            expandedId: null,
            currentClient: null
        }, [
            (ctx) => {
                Logger.log(`Action: ${ctx.action}`, ctx.nextState);
                return ctx;
            }
        ]);
        
        let _navStack = ['list'];
        let _navSet = new Set(['list']);
        let _container = null;
        let _isInitialized = false;
        let _isProcessing = false;
        let _resizeHandler = null;
        let _retryCount = 0;
        let _lastRendered = '';
        let _skeletonTimeout = null;
        let _virtualScroller = null;
        let _unsubscribeStore = null;
        
        const _elements = {};
        const _getElement = (id) => {
            if (!_elements[id] || !document.body.contains(_elements[id])) {
                _elements[id] = document.getElementById(id);
            }
            return _elements[id];
        };
        
        const _screens = {
            list: _getElement('clients-list'),
            add: _getElement('add-client'),
            details: _getElement('client-details'),
            edit: _getElement('edit-client')
        };
        
        const _getCurrentScreen = () => {
            for (const [id, el] of Object.entries(_screens)) {
                if (el?.classList.contains('active')) return id;
            }
            return 'list';
        };
        
        const _showScreen = (screenId, addToStack = true) => {
            if (addToStack) {
                const current = _getCurrentScreen();
                if (current && current !== screenId && !_navSet.has(current)) {
                    _navSet.add(current);
                    _navStack.push(current);
                    if (_navStack.length > CONFIG.UI.MAX_STACK_SIZE) {
                        const removed = _navStack.shift();
                        _navSet.delete(removed);
                    }
                }
            }
            
            for (const el of Object.values(_screens)) {
                if (el) {
                    el.classList.remove('active');
                    el.style.display = 'none';
                }
            }
            
            const target = _screens[screenId];
            if (target) {
                target.style.display = 'block';
                target.classList.add('active');
            }
        };
        
        const _goBack = () => {
            if (_navStack.length) {
                const prev = _navStack.pop();
                _navSet.delete(prev);
                _showScreen(prev, false);
            } else {
                _showScreen('list', false);
            }
        };
        
        const _render = () => {
            if (!_container) return;
            
            const state = store.state;
            const isDesktop = window.innerWidth >= CONFIG.BREAKPOINTS.DESKTOP;
            const displayed = state.items.slice(0, state.displayCount);
            const renderState = {
                displayCount: state.displayCount,
                total: state.items.length,
                expandedId: state.expandedId
            };
            
            const html = isDesktop 
                ? UITable.render(displayed, renderState)
                : UICards.render(displayed, renderState);
            
            if (html === _lastRendered) return;
            _lastRendered = html;
            
            requestAnimationFrame(() => {
                if (_container) _container.innerHTML = html;
            });
            
            const countEl = _getElement('clients-count');
            if (countEl) {
                const text = state.displayCount < state.items.length 
                    ? `${state.displayCount} / ${state.items.length} clients`
                    : `${state.items.length} clients`;
                countEl.innerHTML = `<span class="badge">${text}</span>`;
            }
        };
        
        const _renderDetails = () => {
            const client = store.state.currentClient;
            if (!client || _getCurrentScreen() !== 'details') return;
            const container = _getElement('client-details-container');
            if (container) container.innerHTML = UIDetails.render(client);
        };
        
        const _collapseExpanded = () => {
            const expanded = document.querySelector('.compact-card.expanded');
            if (expanded) {
                expanded.classList.remove('expanded');
                const chevron = expanded.querySelector('.chevron-icon');
                if (chevron) chevron.classList.remove('rotated');
            }
            store.dispatch('COLLAPSE_CARD', { expandedId: null });
        };
        
        const _toggleCard = (card) => {
        const isExpanded = card.classList.contains('expanded');

        if (!isExpanded && store.state.expandedId) {
            _collapseExpanded();
        }

        const expandable = card.querySelector('[data-expandable]');
        if (!expandable) return;

        // احسب الأبعاد
        const rect = card.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // خليه يظهر مؤقتًا عشان نعرف ارتفاعه الحقيقي
        expandable.style.visibility = 'hidden';
        expandable.style.position = 'absolute';
        expandable.style.display = 'block';

        const expandHeight = expandable.scrollHeight;

        expandable.style.visibility = '';
        expandable.style.position = '';
        expandable.style.display = '';

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // إزالة الاتجاهات القديمة
        card.classList.remove('expand-up', 'expand-down');

        if (spaceBelow >= expandHeight) {
            // افتح لتحت
            card.classList.add('expand-down');
        } else if (spaceAbove >= expandHeight) {
            // افتح لفوق
            card.classList.add('expand-up');
        } else {
            // اختار الاتجاه الأكبر
            if (spaceBelow > spaceAbove) {
                card.classList.add('expand-down');
            } else {
                card.classList.add('expand-up');
            }
        }

        // toggle
        card.classList.toggle('expanded');

        const chevron = card.querySelector('.chevron-icon');
        if (chevron) chevron.classList.toggle('rotated');

        store.dispatch('TOGGLE_CARD', { 
            expandedId: isExpanded ? null : card.dataset.clientId 
        });
    };
        
        const _loadClients = async () => {
            if (!_container || store.state.isLoading) return;
            
            store.dispatch('LOAD_START', { isLoading: true });
            
            if (_skeletonTimeout) clearTimeout(_skeletonTimeout);
            
            _skeletonTimeout = setTimeout(() => {
                if (_container && store.state.isLoading) {
                    const skeleton = window.innerWidth >= CONFIG.BREAKPOINTS.DESKTOP 
                        ? UISkeleton.desktop() 
                        : UISkeleton.mobile();
                    _container.innerHTML = skeleton;
                }
            }, 100);
            
            try {
                const data = await requestManager.execute('loadClients', () => api.getClients());
                if (!data) return;
                
                let items = Array.isArray(data) ? data : [];
                items = items.slice(0, CONFIG.UI.MAX_ITEMS);
                items.sort((a, b) => new Date(b.registeredat || 0) - new Date(a.registeredat || 0));
                
                validator.buildMaps(items);
                
                store.dispatch('LOAD_SUCCESS', { items });
                _lastRendered = '';
                _render();
                _retryCount = 0;
                
                const loader = _getElement('crmLoader');
                if (loader) {
                    loader.classList.add('fade-out');
                    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 500);
                }
            } catch (error) {
                Logger.error('Load failed:', error);
                _retryCount++;
                if (_retryCount < CONFIG.RETRY.MAX_ATTEMPTS) {
                    Toast.warning(`Retrying... (${_retryCount}/${CONFIG.RETRY.MAX_ATTEMPTS})`);
                    setTimeout(_loadClients, CONFIG.RETRY.BASE_DELAY * _retryCount);
                } else {
                    Toast.error('Failed to load clients. Please refresh the page.');
                    if (_container) {
                        _container.innerHTML = `<div class="empty-state error"><i class="fa-solid fa-circle-exclamation"></i><h3>Error loading clients</h3><p>${error.message || 'Connection error'}</p><button class="btn btn-primary" data-action="${ACTIONS.RETRY}">Try Again</button></div>`;
                    }
                }
            } finally {
                store.dispatch('LOAD_END', { isLoading: false });
                if (_skeletonTimeout) clearTimeout(_skeletonTimeout);
            }
        };
        
        const _addClient = async (formData) => {
            const { name, email, countryCode, phoneNumber, notes } = formData;
            
            const validation = validator.name(name);
            if (!validation.valid) return { success: false, message: validation.message };
            
            const emailValid = validator.email(email);
            if (!emailValid.valid) return { success: false, message: emailValid.message };
            
            const phoneValid = validator.phone(phoneNumber);
            if (!phoneValid.valid) return { success: false, message: phoneValid.message };
            
            const notesValid = validator.notes(notes);
            if (!notesValid.valid) return { success: false, message: notesValid.message };
            
            const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
            
            const duplicateCheck = validator.validateClientUniqueness(phone, email, null);
            if (!duplicateCheck.valid) {
                return { success: false, message: duplicateCheck.message };
            }
            
            try {
                const newClient = await requestManager.execute('addClient', () => api.addClient({ 
                    name, 
                    email: email || null, 
                    phone, 
                    notes: notes || null 
                }));
                
                if (newClient && newClient.id) {
                    validator.addToMaps(newClient);
                }
                
                await _loadClients();
                _goBack();
                return { success: true, message: '✓ Client added successfully' };
            } catch (error) {
                if (error.message && (error.message.includes('duplicate') || error.message.toLowerCase().includes('already'))) {
                    return { success: false, message: '❌ A client with this phone number or email already exists.' };
                }
                return { success: false, message: error.message || 'Failed to add client' };
            }
        };
        
        const _editClient = async (clientId) => {
            try {
                const client = await requestManager.execute(`edit_${clientId}`, () => api.getClient(clientId));
                if (!client) {
                    Toast.error('Client not found');
                    return;
                }
                
                _getElement('edit-client-name').value = client.name || '';
                _getElement('edit-client-email').value = client.email || '';
                _getElement('edit-client-notes').value = client.notes || '';
                
                if (client.phone) {
                    const { code, number } = PhoneUtils.extractParts(client.phone);
                    const countrySelect = _getElement('edit-country-code');
                    if (countrySelect) countrySelect.value = code;
                    _getElement('edit-client-phone').value = number;
                } else {
                    _getElement('edit-client-phone').value = '';
                }
                
                const hidden = _getElement('edit-client-id');
                if (hidden) hidden.value = clientId;
                
                _showScreen('edit');
            } catch (error) {
                Logger.error('Edit failed:', error);
                Toast.error('Failed to load client data');
            }
        };
        
        const _updateClient = async (clientId, formData) => {
            const { name, email, countryCode, phoneNumber, notes } = formData;
            
            const validation = validator.name(name);
            if (!validation.valid) return { success: false, message: validation.message };
            
            const emailValid = validator.email(email);
            if (!emailValid.valid) return { success: false, message: emailValid.message };
            
            const phoneValid = validator.phone(phoneNumber);
            if (!phoneValid.valid) return { success: false, message: phoneValid.message };
            
            const notesValid = validator.notes(notes);
            if (!notesValid.valid) return { success: false, message: notesValid.message };
            
            const phone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
            
            const duplicateCheck = validator.validateClientUniqueness(phone, email, clientId);
            if (!duplicateCheck.valid) {
                return { success: false, message: duplicateCheck.message };
            }
            
            try {
                const updatedClient = await requestManager.execute(`update_${clientId}`, () => api.updateClient(clientId, { 
                    name, 
                    email: email || null, 
                    phone, 
                    notes: notes || null 
                }));
                
                if (updatedClient && updatedClient.id) {
                    validator.updateInMaps(updatedClient);
                }
                
                await _loadClients();
                _goBack();
                return { success: true, message: '✓ Client updated successfully' };
            } catch (error) {
                if (error.message && (error.message.includes('duplicate') || error.message.toLowerCase().includes('already'))) {
                    return { success: false, message: '❌ A client with this phone number or email already exists.' };
                }
                return { success: false, message: error.message || 'Failed to update client' };
            }
        };
        
        const _deleteClient = async (clientId) => {
            const confirmed = confirm('⚠️ Warning: Delete this client?\n\nAll associated requests will also be deleted permanently.\n\nThis action cannot be undone!');
            
            if (!confirmed) return;
            
            try {
                const requests = await requestManager.execute('getRequests', () => api.getRequests());
                if (requests && requests.length) {
                    const clientRequests = requests.filter(r => r.clientid == clientId);
                    for (const req of clientRequests) {
                        await requestManager.execute(`deleteReq_${req.id}`, () => api.deleteRequest(req.id));
                    }
                }
                
                await requestManager.execute(`delete_${clientId}`, () => api.deleteClient(clientId));
                
                validator.removeFromMaps(clientId);
                
                Toast.success('Client deleted successfully');
                await _loadClients();
                
                if (store.state.expandedId === String(clientId)) _collapseExpanded();
            } catch (error) {
                Logger.error('Delete failed:', error);
                Toast.error('Failed to delete client');
            }
        };
        
        const _viewClient = async (clientId) => {
            const viewBtn = document.querySelector(`button[data-action="${ACTIONS.VIEW}"][data-id="${clientId}"]`);
            if (viewBtn) viewBtn.disabled = true;
            
            try {
                const client = await requestManager.execute(`view_${clientId}`, () => api.getClient(clientId));
                
                if (!client) {
                    Toast.error('Client not found or failed to load');
                    Logger.error(`Client with id ${clientId} not found`);
                    return;
                }
                
                store.dispatch('VIEW_CLIENT', { currentClient: client });
                _showScreen('details');
                _renderDetails();
                
            } catch (error) {
                Logger.error('View failed:', error);
                Toast.error(`Error loading client: ${error.message || 'Unknown error'}`);
            } finally {
                if (viewBtn) viewBtn.disabled = false;
            }
        };
        
        const _handleLoadMore = () => {
            const current = store.state.displayCount;
            const total = store.state.items.length;
            store.dispatch('LOAD_MORE', { displayCount: Math.min(current + CONFIG.UI.LOAD_STEP, total) });
            _render();
        };
        
        const _handleViewAll = () => {
            store.dispatch('VIEW_ALL', { displayCount: store.state.items.length });
            _render();
        };
        
        const _handleViewLess = () => {
            store.dispatch('VIEW_LESS', { displayCount: CONFIG.UI.INITIAL_DISPLAY });
            _render();
        };
        
        const _callClient = (phone) => {
            if (phone && phone !== 'No phone') {
                window.location.href = `tel:${PhoneUtils.clean(phone)}`;
            } else {
                Toast.warning('No phone number available');
            }
        };
        
        const _whatsAppClient = (phone) => {
            if (phone && phone !== 'No phone') {
                window.open(PhoneUtils.getWhatsAppUrl(phone), '_blank');
            } else {
                Toast.warning('No phone number available');
            }
        };
        
        const _setupRealtimeValidation = () => {
            const addPhoneInput = _getElement('add-client-phone');
            const addEmailInput = _getElement('add-client-email');
            const editPhoneInput = _getElement('edit-client-phone');
            const editEmailInput = _getElement('edit-client-email');
            
            const validatePhoneField = (input, isEdit = false, clientId = null) => {
                if (!input) return true;
                
                const value = input.value.trim();
                let errorMessage = '';
                
                if (value) {
                    const digits = value.replace(/\D/g, '');
                    if (digits.length < CONFIG.VALIDATION.PHONE.MIN || digits.length > CONFIG.VALIDATION.PHONE.MAX) {
                        errorMessage = `Phone must be ${CONFIG.VALIDATION.PHONE.MIN}-${CONFIG.VALIDATION.PHONE.MAX} digits`;
                    } else {
                        const countryCode = input.id.includes('add') 
                            ? _getElement('country-code')?.value 
                            : _getElement('edit-country-code')?.value;
                        const fullPhone = `${countryCode} ${value}`;
                        const duplicateCheck = validator.duplicatePhone(fullPhone, isEdit ? clientId : null);
                        if (!duplicateCheck.valid) {
                            errorMessage = duplicateCheck.message;
                        }
                    }
                }
                
                const errorEl = input.parentElement?.querySelector('.phone-error-message');
                if (!errorEl) {
                    const newErrorEl = document.createElement('div');
                    newErrorEl.className = 'field-error phone-error-message';
                    newErrorEl.style.fontSize = '12px';
                    newErrorEl.style.marginTop = '4px';
                    input.parentElement?.appendChild(newErrorEl);
                }
                
                const finalErrorEl = input.parentElement?.querySelector('.phone-error-message');
                if (finalErrorEl) {
                    if (errorMessage) {
                        finalErrorEl.textContent = errorMessage;
                        finalErrorEl.style.display = 'block';
                        input.classList.add('error');
                    } else {
                        finalErrorEl.style.display = 'none';
                        input.classList.remove('error');
                    }
                }
                
                return !errorMessage;
            };
            
            const validateEmailField = (input, isEdit = false, clientId = null) => {
                if (!input) return true;
                
                const value = input.value.trim();
                let errorMessage = '';
                
                if (value) {
                    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                    if (!regex.test(value)) {
                        errorMessage = 'Please enter a valid email address';
                    } else {
                        const duplicateCheck = validator.duplicateEmail(value, isEdit ? clientId : null);
                        if (!duplicateCheck.valid) {
                            errorMessage = duplicateCheck.message;
                        }
                    }
                }
                
                const errorEl = input.parentElement?.querySelector('.email-error-message');
                if (!errorEl) {
                    const newErrorEl = document.createElement('div');
                    newErrorEl.className = 'field-error email-error-message';
                    newErrorEl.style.fontSize = '12px';
                    newErrorEl.style.marginTop = '4px';
                    input.parentElement?.appendChild(newErrorEl);
                }
                
                const finalErrorEl = input.parentElement?.querySelector('.email-error-message');
                if (finalErrorEl) {
                    if (errorMessage) {
                        finalErrorEl.textContent = errorMessage;
                        finalErrorEl.style.display = 'block';
                        input.classList.add('error');
                    } else {
                        finalErrorEl.style.display = 'none';
                        input.classList.remove('error');
                    }
                }
                
                return !errorMessage;
            };
            
            const debouncedValidate = (fn) => debounce(fn, 400);
            
            if (addPhoneInput) {
                addPhoneInput.addEventListener('input', debouncedValidate(() => validatePhoneField(addPhoneInput, false)));
            }
            if (addEmailInput) {
                addEmailInput.addEventListener('input', debouncedValidate(() => validateEmailField(addEmailInput, false)));
            }
            if (editPhoneInput) {
                const clientId = _getElement('edit-client-id')?.value;
                editPhoneInput.addEventListener('input', debouncedValidate(() => validatePhoneField(editPhoneInput, true, clientId)));
            }
            if (editEmailInput) {
                const clientId = _getElement('edit-client-id')?.value;
                editEmailInput.addEventListener('input', debouncedValidate(() => validateEmailField(editEmailInput, true, clientId)));
            }
        };
        
        const _actionMap = {
            [ACTIONS.ADD]: () => _showScreen('add'),
            [ACTIONS.BACK]: (el) => el.dataset.force ? _showScreen(el.dataset.force, false) : _goBack(),
            [ACTIONS.LOAD_MORE]: _handleLoadMore,
            [ACTIONS.VIEW_ALL]: _handleViewAll,
            [ACTIONS.VIEW_LESS]: _handleViewLess,
            [ACTIONS.TOGGLE]: (el) => {
                const card = el.closest('.compact-card');
                if (card) _toggleCard(card);
            },
            [ACTIONS.CALL]: (el) => _callClient(el.dataset.phone),
            [ACTIONS.WHATSAPP]: (el) => _whatsAppClient(el.dataset.phone),
            [ACTIONS.VIEW]: (el) => el.dataset.id && _viewClient(el.dataset.id),
            [ACTIONS.EDIT]: (el) => el.dataset.id && _editClient(el.dataset.id),
            [ACTIONS.DELETE]: (el) => el.dataset.id && _deleteClient(el.dataset.id),
            [ACTIONS.RETRY]: () => _loadClients(),
        };
        
        const _handleClick = (e) => {
            const trigger = e.target.closest('[data-action]');
            if (!trigger) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const action = trigger.dataset.action;
            const handler = _actionMap[action];
            if (handler) handler(trigger);
        };
        
        const _handleResize = debounce(() => {
            if (_getCurrentScreen() === 'list') _render();
            if (_getCurrentScreen() === 'details' && store.state.currentClient) _renderDetails();
            if (store.state.expandedId) _collapseExpanded();
        }, CONFIG.UI.DEBOUNCE_DELAY);
        
        const _handleFormSubmit = async (e) => {
            e.preventDefault();
            if (_isProcessing) return;
            
            _isProcessing = true;
            const form = e.target;
            const isAdd = form.id === 'add-client-form';
            
            const formData = {
                name: _getElement(isAdd ? 'add-client-name' : 'edit-client-name')?.value.trim(),
                email: _getElement(isAdd ? 'add-client-email' : 'edit-client-email')?.value.trim(),
                countryCode: _getElement(isAdd ? 'country-code' : 'edit-country-code')?.value,
                phoneNumber: _getElement(isAdd ? 'add-client-phone' : 'edit-client-phone')?.value.trim(),
                notes: _getElement(isAdd ? 'add-client-notes' : 'edit-client-notes')?.value.trim()
            };
            
            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn?.innerHTML;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            }
            
            let result;
            if (isAdd) {
                result = await _addClient(formData);
                if (result.success) form.reset();
            } else {
                const clientId = _getElement('edit-client-id')?.value;
                if (clientId) result = await _updateClient(clientId, formData);
                else result = { success: false, message: 'Invalid client ID' };
            }
            
            if (!result.success) {
                Toast.error(result.message);
            } else {
                Toast.success(result.message);
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            _isProcessing = false;
        };
        
        const _bindEvents = () => {
            document.body.addEventListener('click', _handleClick);
            window.addEventListener('resize', _handleResize);
            
            const addForm = _getElement('add-client-form');
            const editForm = _getElement('edit-client-form');
            if (addForm) addForm.addEventListener('submit', _handleFormSubmit);
            if (editForm) editForm.addEventListener('submit', _handleFormSubmit);
            
            _setupRealtimeValidation();
            
            _unsubscribeStore = store.subscribe((nextState, prevState, action) => {
                if (action === 'LOAD_SUCCESS' || action === 'LOAD_MORE' || action === 'VIEW_ALL' || action === 'VIEW_LESS') {
                    // Re-render handled in action handlers
                }
            });
        };
        
        const _unbindEvents = () => {
            document.body.removeEventListener('click', _handleClick);
            window.removeEventListener('resize', _handleResize);
            
            const addForm = _getElement('add-client-form');
            const editForm = _getElement('edit-client-form');
            if (addForm) addForm.removeEventListener('submit', _handleFormSubmit);
            if (editForm) editForm.removeEventListener('submit', _handleFormSubmit);
            
            if (_unsubscribeStore) _unsubscribeStore();
            if (_virtualScroller) _virtualScroller.destroy();
        };
        
        const init = async () => {
            if (_isInitialized) return;
            
            _container = _getElement('clients-container');
            if (!_container) return;
            
            _bindEvents();
            await _loadClients();
            _isInitialized = true;
        };
        
        const destroy = () => {
            _unbindEvents();
            requestManager.cancelAll();
            store.destroy();
            eventBus.clear();
            _navStack = [];
            _navSet.clear();
            Object.keys(_elements).forEach(key => delete _elements[key]);
            _isInitialized = false;
            if (_skeletonTimeout) clearTimeout(_skeletonTimeout);
            Logger.log('🧹 Module destroyed');
        };
        
        return {
            init,
            destroy,
            reload: _loadClients,
            getState: () => store.state,
            goBack: _goBack,
            getActionHistory: () => store.getActionHistory()
        };
    };

    // ==================== BOOTSTRAP ====================

    const initClientsModule = () => {
        if (!window.API) {
            Logger.error('API instance required - make sure api.js loads first');
            Toast.error('API not loaded. Please refresh the page.');
            return null;
        }
        
        const module = createClientsModule();
        window.ClientsModule = module;
        module.init();
        return module;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initClientsModule());
    } else {
        setTimeout(() => initClientsModule(), 100);
    }

    window.addEventListener('beforeunload', () => {
        if (window.ClientsModule?.destroy) window.ClientsModule.destroy();
    });