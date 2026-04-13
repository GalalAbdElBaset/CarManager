    // ==================== ENTERPRISE CONFIGURATION ====================
    const CONFIG = Object.freeze({
        BREAKPOINTS: {
            DESKTOP: 1024,
            TABLET: 768,
            MOBILE: 480
        },
        VALIDATION: {
            BRAND: { MIN: 2, MAX: 50 },
            MODEL: { MIN: 1, MAX: 50 },
            YEAR: { MIN: 1900, MAX: new Date().getFullYear() + 1 },
            NOTES: { MAX: 500 },
            PRICE: { MIN: 0, MAX: 100000000 }
        },
        UI: {
            INITIAL_DISPLAY: 5,
            LOAD_STEP: 5,
            DEBOUNCE_DELAY: 400,
            ANIMATION_DURATION: 300,
            MAX_STACK_SIZE: 20,
            SKELETON_COUNT: 5,
            MAX_ITEMS: 300
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
        VIEW: 'view',
        EDIT: 'edit',
        DELETE: 'delete',
        RETRY: 'retry'
    });

    // ==================== TOAST SYSTEM ====================
    const Toast = {
        _element: null,
        _timeout: null,
        
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
        
        show(message, type = 'info', duration = 3000) {
            const toast = this._init();
            toast.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.add('show');
            
            if (this._timeout) clearTimeout(this._timeout);
            this._timeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
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
        
        sanitizeNotes: (notes) => {
            if (!notes) return '';
            return Security.escapeHtml(notes).replace(/\n/g, '<br>');
        }
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

    const FormatUtils = {
        formatPrice: (price) => {
            if (!price && price !== 0) return 'Price on request';
            return '$' + Number(price).toLocaleString();
        },
        
        formatCondition: (condition) => {
            const conditions = {
                'excellent': 'Excellent',
                'very_good': 'Very Good',
                'good': 'Good',
                'fair': 'Fair',
                'needs_maintenance': 'Needs Maintenance'
            };
            return conditions[condition] || condition || 'Not specified';
        },
        
        truncateText: (text, maxLength) => {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },
        
        safe: (value, defaultValue = 'Not specified') => {
            return value || defaultValue;
        }
    };

    const ColorUtils = {
        getConditionColor: (condition) => {
            const colors = {
                'excellent': '#06d6a0',
                'very_good': '#4cc9f0',
                'good': '#ffb703',
                'fair': '#f59e0b',
                'needs_maintenance': '#e63946'
            };
            return colors[condition] || '#64748b';
        },
        
        getConditionIcon: (condition) => {
            const icons = {
                'excellent': 'fa-star',
                'very_good': 'fa-thumbs-up',
                'good': 'fa-check-circle',
                'fair': 'fa-exclamation-circle',
                'needs_maintenance': 'fa-wrench'
            };
            return icons[condition] || 'fa-car';
        }
    };

    let _debounceTimeout = null;
    const globalDebounce = (fn, delay = CONFIG.UI.DEBOUNCE_DELAY) => {
        clearTimeout(_debounceTimeout);
        _debounceTimeout = setTimeout(fn, delay);
    };

    // ==================== VALIDATION SERVICE ====================

    class ValidatorService {
        constructor() {
            this.carMap = new Map();
            this._allCars = [];
        }
        
        buildMaps(cars) {
            this._allCars = [...cars];
            this.carMap.clear();
            
            for (const car of cars) {
                const key = this._getCarKey(car.brand, car.model, car.year);
                this.carMap.set(key, car.id);
            }
        }
        
        _getCarKey(brand, model, year) {
            const normalize = (str) =>
                (str || '')
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, ' ');

            return `${normalize(brand)}|${normalize(model)}|${year}`;
        }
        
        brand(brand) {
            if (!brand?.trim()) return { valid: false, message: 'Brand is required' };
            if (brand.length < CONFIG.VALIDATION.BRAND.MIN) {
                return { valid: false, message: `Brand must be at least ${CONFIG.VALIDATION.BRAND.MIN} characters` };
            }
            if (brand.length > CONFIG.VALIDATION.BRAND.MAX) {
                return { valid: false, message: `Brand must not exceed ${CONFIG.VALIDATION.BRAND.MAX} characters` };
            }
            return { valid: true };
        }
        
        model(model) {
            if (!model?.trim()) return { valid: false, message: 'Model is required' };
            if (model.length < CONFIG.VALIDATION.MODEL.MIN) {
                return { valid: false, message: `Model must be at least ${CONFIG.VALIDATION.MODEL.MIN} characters` };
            }
            if (model.length > CONFIG.VALIDATION.MODEL.MAX) {
                return { valid: false, message: `Model must not exceed ${CONFIG.VALIDATION.MODEL.MAX} characters` };
            }
            return { valid: true };
        }
        
        year(year) {
            if (!year) return { valid: false, message: 'Year is required' };
            const numYear = Number(year);
            if (isNaN(numYear)) return { valid: false, message: 'Year must be a number' };
            if (numYear < CONFIG.VALIDATION.YEAR.MIN || numYear > CONFIG.VALIDATION.YEAR.MAX) {
                return { valid: false, message: `Year must be between ${CONFIG.VALIDATION.YEAR.MIN} and ${CONFIG.VALIDATION.YEAR.MAX}` };
            }
            return { valid: true };
        }
        
        condition(condition) {
            if (!condition) return { valid: false, message: 'Condition is required' };
            const validConditions = ['excellent', 'very_good', 'good', 'fair', 'needs_maintenance'];
            if (!validConditions.includes(condition)) {
                return { valid: false, message: 'Please select a valid condition' };
            }
            return { valid: true };
        }
        
        color(color) {
            if (!color?.trim()) return { valid: false, message: 'Color is required' };
            return { valid: true };
        }
        
        category(category) {
            if (!category) return { valid: false, message: 'Category is required' };
            return { valid: true };
        }
        
        price(price) {
            if (price === null || price === undefined || price === '') return { valid: true };
            const numPrice = Number(price);
            if (isNaN(numPrice)) return { valid: false, message: 'Price must be a number' };
            if (numPrice < CONFIG.VALIDATION.PRICE.MIN) {
                return { valid: false, message: `Price cannot be negative` };
            }
            if (numPrice > CONFIG.VALIDATION.PRICE.MAX) {
                return { valid: false, message: `Price is too high` };
            }
            return { valid: true };
        }
        
        notes(notes) {
            if (notes?.length > CONFIG.VALIDATION.NOTES.MAX) {
                return { valid: false, message: `Notes must not exceed ${CONFIG.VALIDATION.NOTES.MAX} characters` };
            }
            return { valid: true };
        }
        
        duplicateCar(brand, model, year, excludeId = null) {
            if (!brand || !model || !year) return { valid: true };
            
            const key = this._getCarKey(brand, model, year);
            const existingCarId = this.carMap.get(key);

            if (existingCarId && String(existingCarId) !== String(excludeId)) {
                return { 
                    valid: false, 
                    message: `A car with this Brand, Model and Year already exists: ${brand} ${model} (${year})` 
                };
            }

            return { valid: true };
        }
        
        validateCarUniqueness(brand, model, year, excludeId = null) {
            return this.duplicateCar(brand, model, year, excludeId);
        }
        
        addToMaps(car) {
            this._allCars.push(car);
            const key = this._getCarKey(car.brand, car.model, car.year);
            this.carMap.set(key, car.id);
        }
        
        updateInMaps(car) {
            const oldIndex = this._allCars.findIndex(c => c.id == car.id);
            if (oldIndex !== -1) {
                const oldCar = this._allCars[oldIndex];
                const oldKey = this._getCarKey(oldCar.brand, oldCar.model, oldCar.year);
                this.carMap.delete(oldKey);
                this._allCars[oldIndex] = car;
            } else {
                this._allCars.push(car);
            }
            
            const newKey = this._getCarKey(car.brand, car.model, car.year);
            this.carMap.set(newKey, car.id);
        }
        
        removeFromMaps(carId) {
            const index = this._allCars.findIndex(c => c.id == carId);
            if (index !== -1) {
                const car = this._allCars[index];
                const key = this._getCarKey(car.brand, car.model, car.year);
                this.carMap.delete(key);
                this._allCars.splice(index, 1);
            }
        }
    }

    // ==================== LOGGER ====================

    const Logger = {
        _prefix: '[Cars]',
        log: (...args) => console.log(Logger._prefix, ...args),
        info: (...args) => console.info(Logger._prefix, 'ℹ️', ...args),
        warn: (...args) => console.warn(Logger._prefix, '⚠️', ...args),
        error: (...args) => console.error(Logger._prefix, '❌', ...args)
    };

    // ==================== SIMPLE STORE ====================

    class SimpleStore {
        constructor(initialState = {}) {
            this._state = { ...initialState };
            this._listeners = new Set();
            this._isDispatching = false;
        }
        
        get state() {
            return { ...this._state };
        }
        
        dispatch(action, updater) {
            if (this._isDispatching) {
                Logger.warn('Cannot update state while dispatching');
                return;
            }
            
            this._isDispatching = true;
            const prevState = this.state;
            const nextState = typeof updater === 'function' ? updater(prevState) : { ...prevState, ...updater };
            
            this._state = nextState;
            this._isDispatching = false;
            
            this._listeners.forEach(listener => {
                try { listener(nextState, prevState, action); } catch (e) { Logger.error('Listener error:', e); }
            });
        }
        
        subscribe(listener) {
            this._listeners.add(listener);
            return () => this._listeners.delete(listener);
        }
        
        destroy() {
            this._listeners.clear();
            this._state = {};
        }
    }

    // ==================== API WRAPPER ====================

    class ApiWrapper {
        async getCars() {
            try {
                const result = await API.Cars.getAll({}, 1, CONFIG.UI.MAX_ITEMS);
                return result.data || [];
            } catch (error) {
                Logger.error('getCars failed:', error);
                throw error;
            }
        }
        
        async getCar(id) {
            try {
                return await API.Cars.getById(id);
            } catch (error) {
                Logger.error('getCar failed:', error);
                throw error;
            }
        }
        
        async addCar(data) {
            try {
                return await API.Cars.create(data);
            } catch (error) {
                Logger.error('addCar failed:', error);
                throw error;
            }
        }
        
        async updateCar(id, data) {
            try {
                return await API.Cars.update(id, data);
            } catch (error) {
                Logger.error('updateCar failed:', error);
                throw error;
            }
        }
        
        async deleteCar(id) {
            try {
                return await API.Cars.delete(id);
            } catch (error) {
                Logger.error('deleteCar failed:', error);
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

    // ==================== UI RENDERERS ====================

    const UISkeleton = {
        desktop: () => {
            const rows = [];
            rows.push('<div class="data-table-container"><table class="data-table cars-table"><thead><tr><th>Car</th><th>Year</th><th>Condition</th><th>Price</th><th>Actions</th></tr></thead><tbody>');
            for (let i = 0; i < CONFIG.UI.SKELETON_COUNT; i++) {
                rows.push(`<tr class="skeleton-row">
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-text"></div></td>
                    <td><div class="skeleton-buttons"><div class="skeleton-btn"></div><div class="skeleton-btn"></div></div></td>
                </tr>`);
            }
            rows.push('</tbody></table></div>');
            return rows.join('');
        },
        
        mobile: () => {
            const rows = ['<div class="cars-grid">'];
            for (let i = 0; i < CONFIG.UI.SKELETON_COUNT; i++) {
                rows.push(`<div class="car-card skeleton-card">
                    <div class="car-card-header"><div class="car-icon skeleton-avatar"></div>
                    <div class="car-info"><h4 class="car-name skeleton-text"></h4><div class="car-year skeleton-text"></div></div></div>
                </div>`);
            }
            rows.push('</div>');
            return rows.join('');
        }
    };

    const UITable = {
        render: (cars, state, viewAllState) => {
            if (!cars?.length) {
                return `<div class="empty-state"><i class="fa-solid fa-car-side"></i><h3>No cars found</h3><p>Add your first car to get started</p><button class="btn btn-primary" data-action="${ACTIONS.ADD}"><i class="fa-solid fa-plus"></i> Add Car</button></div>`;
            }
            
            const isShowingAll = viewAllState === 'all';
            const rows = [];
            rows.push('<div class="data-table-container"><table class="data-table cars-table"><thead><tr>');
            rows.push('<th>Car</th><th>Year</th><th>Condition</th><th>Price</th><th style="text-align:right">');
            
            if (isShowingAll) {
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_LESS}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-up"></i> Show Less</button>`);
            } else {
                const remaining = state.total - state.displayCount;
                const nextCount = Math.min(CONFIG.UI.LOAD_STEP, remaining);
                rows.push(`<button class="btn btn-sm btn-primary" data-action="${ACTIONS.LOAD_MORE}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-down"></i> Load More (${nextCount})</button>`);
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_ALL}" style="margin-left:8px;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-list"></i> View All (${state.total})</button>`);
            }
            
            rows.push('</th></tr></thead><tbody>');
            
            for (const car of cars) {
                const safeId = Security.escapeHtml(String(car.id));
                rows.push(`<tr data-car-id="${safeId}">
                    <td><strong>${Security.escapeHtml(car.brand)} ${Security.escapeHtml(car.model)}</strong><br><small>${Security.escapeHtml(car.color || '')} • ${Security.escapeHtml(car.category || '')}</small></td>
                    <td>${car.year || '-'}</td>
                    <td><span class="condition-badge ${car.condition || ''}"><i class="fa-solid ${ColorUtils.getConditionIcon(car.condition)}"></i> ${FormatUtils.formatCondition(car.condition)}</span></td>
                    <td>${FormatUtils.formatPrice(car.price)}</td>
                    <td><div class="action-buttons" style="justify-content:flex-end">
                        <button class="action-btn view" data-action="${ACTIONS.VIEW}" data-id="${safeId}" title="View"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn edit" data-action="${ACTIONS.EDIT}" data-id="${safeId}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete" data-action="${ACTIONS.DELETE}" data-id="${safeId}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div></td>
                </tr>`);
            }
            
            rows.push('</tbody></table></div>');
            return rows.join('');
        }
    };

    const UICards = {
        render: (cars, state, viewAllState) => {
            if (!cars?.length) {
                return `<div class="empty-state"><i class="fa-solid fa-car-side"></i><h3>No cars found</h3><p>Add your first car to get started</p><button class="btn btn-primary" data-action="${ACTIONS.ADD}"><i class="fa-solid fa-plus"></i> Add Car</button></div>`;
            }
            
            const isShowingAll = viewAllState === 'all';
            const rows = [];
            
            rows.push(`<div class="mobile-controls-header" style="display:flex;justify-content:flex-end;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border);margin-bottom:8px">`);
            if (isShowingAll) {
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_LESS}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-up"></i> Show Less</button>`);
            } else {
                const remaining = state.total - state.displayCount;
                const nextCount = Math.min(CONFIG.UI.LOAD_STEP, remaining);
                rows.push(`<button class="btn btn-sm btn-primary" data-action="${ACTIONS.LOAD_MORE}" style="display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-down"></i> Load More (${nextCount})</button>`);
                rows.push(`<button class="btn btn-sm btn-secondary" data-action="${ACTIONS.VIEW_ALL}" style="margin-left:8px;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-list"></i> View All (${state.total})</button>`);
            }
            rows.push('</div><div class="cars-grid">');
            
            for (const car of cars) {
                const safeId = Security.escapeHtml(String(car.id));
                rows.push(`
                    <div class="car-card" data-car-id="${safeId}">
                        <div class="car-card-header">
                            <div class="car-icon" style="background: linear-gradient(135deg, ${ColorUtils.getConditionColor(car.condition)}80, ${ColorUtils.getConditionColor(car.condition)})">
                                <i class="fa-solid ${ColorUtils.getConditionIcon(car.condition)}"></i>
                            </div>
                            <div class="car-info">
                                <h4 class="car-name">${Security.escapeHtml(car.brand)} ${Security.escapeHtml(car.model)}</h4>
                                <div class="car-year"><i class="fa-regular fa-calendar"></i> ${car.year || '-'}</div>
                            </div>
                        </div>
                        <div class="car-actions" data-id="${safeId}">
                            <button class="btn-action btn-view" data-action="${ACTIONS.VIEW}" data-id="${safeId}"><i class="fa-solid fa-eye"></i><span>View</span></button>
                            <button class="btn-action btn-edit" data-action="${ACTIONS.EDIT}" data-id="${safeId}"><i class="fa-solid fa-pen"></i><span>Edit</span></button>
                            <button class="btn-action btn-delete" data-action="${ACTIONS.DELETE}" data-id="${safeId}"><i class="fa-solid fa-trash"></i><span>Delete</span></button>
                        </div>
                        <div class="car-details">
                            <span class="detail-badge"><i class="fa-solid fa-palette"></i> ${Security.escapeHtml(FormatUtils.safe(car.color))}</span>
                            <span class="detail-badge"><i class="fa-solid fa-tag"></i> ${Security.escapeHtml(FormatUtils.safe(car.category))}</span>
                            <span class="detail-badge condition-badge ${car.condition || ''}"><i class="fa-solid ${ColorUtils.getConditionIcon(car.condition)}"></i> ${FormatUtils.formatCondition(car.condition)}</span>
                            <div class="car-price">
                                <i class="fa-solid fa-dollar-sign"></i> ${FormatUtils.formatPrice(car.price)}
                            </div>
                        </div>
                        ${car.notes ? `<div class="car-notes-preview"><i class="fa-regular fa-note-sticky"></i> ${Security.escapeHtml(FormatUtils.truncateText(car.notes, 50))}</div>` : ''}
                    </div>
                `);
            }
            
            rows.push('</div>');
            return rows.join('');
        }
    };

    const UIDetails = {
        render: (car) => {
            if (!car || !car.brand) {
                return `<div class="empty-state error">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Error Loading Car Details</h3>
                    <p>Car data is missing or invalid.</p>
                    <button class="btn btn-primary" data-action="back" data-target="cars-list">Go Back</button>
                </div>`;
            }
            
            const safeId = Security.escapeHtml(String(car.id));
            
            return `<div class="car-details-view" role="region">
                <div class="profile-header" style="background: linear-gradient(135deg, ${ColorUtils.getConditionColor(car.condition)}, ${ColorUtils.getConditionColor(car.condition)}CC)">
                    <div class="profile-avatar">
                        <i class="fa-solid fa-car" style="font-size: 20px;"></i>
                    </div>
                    <div class="profile-title">
                        <h2>${Security.escapeHtml(car.brand)} ${Security.escapeHtml(car.model)}</h2>
                        <span class="member-since">${car.year || 'Year not specified'}</span>
                    </div>
                </div>
                <div class="info-cards">
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-trademark"></i></div>
                        <div class="info-content">
                            <label>Brand</label>
                            <div class="info-value">${Security.escapeHtml(FormatUtils.safe(car.brand))}</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-car-side"></i></div>
                        <div class="info-content">
                            <label>Model</label>
                            <div class="info-value">${Security.escapeHtml(FormatUtils.safe(car.model))}</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-calendar-alt"></i></div>
                        <div class="info-content">
                            <label>Year</label>
                            <div class="info-value">${car.year || 'Not specified'}</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-clipboard-check"></i></div>
                        <div class="info-content">
                            <label>Condition</label>
                            <div class="info-value"><span class="condition-badge ${car.condition || ''}"><i class="fa-solid ${ColorUtils.getConditionIcon(car.condition)}"></i> ${FormatUtils.formatCondition(car.condition)}</span></div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-palette"></i></div>
                        <div class="info-content">
                            <label>Color</label>
                            <div class="info-value">${Security.escapeHtml(FormatUtils.safe(car.color))}</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-tag"></i></div>
                        <div class="info-content">
                            <label>Category</label>
                            <div class="info-value">${car.category ? Security.escapeHtml(car.category.charAt(0).toUpperCase() + car.category.slice(1)) : 'Not specified'}</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-dollar-sign"></i></div>
                        <div class="info-content">
                            <label>Price</label>
                            <div class="info-value">${FormatUtils.formatPrice(car.price)}</div>
                        </div>
                    </div>
                    <div class="info-card">
                        <div class="info-icon"><i class="fa-solid fa-plate"></i></div>
                        <div class="info-content">
                            <label>License Plate</label>
                            <div class="info-value">${Security.escapeHtml(FormatUtils.safe(car.licenseplate))}</div>
                        </div>
                    </div>
                </div>
                ${car.notes ? `<div class="notes-section"><div class="notes-header"><i class="fa-regular fa-note-sticky"></i><h3>Notes</h3></div><div class="notes-content">${Security.sanitizeNotes(car.notes)}</div></div>` : ''}
                <div class="quick-actions">
                    <button class="btn btn-warning" data-action="edit" data-id="${safeId}" id="details-edit-btn"><i class="fa-solid fa-pen"></i> Edit Car</button>
                    <button class="btn btn-danger" data-action="delete" data-id="${safeId}" id="details-delete-btn"><i class="fa-solid fa-trash"></i> Delete Car</button>
                </div>
            </div>`;
        }
    };

    // ==================== MAIN MODULE ====================

    const createCarsModule = () => {
        const api = new ApiWrapper();
        const validator = new ValidatorService();
        
        const store = new SimpleStore({
            items: [],
            isLoading: false,
            displayCount: CONFIG.UI.INITIAL_DISPLAY,
            currentCar: null,
            viewAllState: 'partial',
            stats: { totalCars: 0, activeCars: 0, totalValue: 0, pendingRequests: 0 }
        });
        
        let _navStack = ['list'];
        let _navSet = new Set(['list']);
        let _container = null;
        let _isInitialized = false;
        let _isProcessing = false;
        let _retryCount = 0;
        let _lastRendered = '';
        let _skeletonTimeout = null;
        let _unsubscribeStore = null;
        let _editingCarId = null;
        let _pendingAction = null;
        
        const _elements = {};
        const _getElement = (id) => {
            if (!_elements[id] || !document.body.contains(_elements[id])) {
                _elements[id] = document.getElementById(id);
            }
            return _elements[id];
        };
        
        const _screens = {
            list: _getElement('cars-list'),
            add: _getElement('add-car'),
            details: _getElement('car-details'),
            edit: _getElement('edit-car')
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
        
        const _updateStats = (cars, requests) => {
            const totalCars = cars.length;
            
            let activeCars = 0;
            let totalValue = 0;
            let pendingRequests = 0;
            
            const carStatusMap = new Map();
            
            if (requests && requests.length) {
                requests.forEach(req => {
                    if (req.carid) {
                        const existingStatus = carStatusMap.get(req.carid);
                        const priority = { 'active': 3, 'pending': 2, 'completed': 1 };
                        const currentPriority = priority[req.status] || 0;
                        const existingPriority = priority[existingStatus] || 0;
                        
                        if (!existingStatus || currentPriority > existingPriority) {
                            carStatusMap.set(req.carid, req.status);
                        }
                    }
                    if (req.status === 'pending') {
                        pendingRequests++;
                    }
                });
            }
            
            cars.forEach(car => {
                const status = carStatusMap.get(car.id);
                if (status === 'active') activeCars++;
                
                if (car.price && typeof car.price === 'number') {
                    totalValue += car.price;
                }
            });
            
            store.dispatch('UPDATE_STATS', { stats: { totalCars, activeCars, totalValue, pendingRequests } });
            
            const totalEl = document.getElementById('stat-total-cars');
            const activeEl = document.getElementById('stat-active-cars');
            const valueEl = document.getElementById('stat-total-value');
            const pendingEl = document.getElementById('stat-pending-requests');
            
            if (totalEl) totalEl.textContent = totalCars;
            if (activeEl) activeEl.textContent = activeCars;
            if (valueEl) valueEl.textContent = FormatUtils.formatPrice(totalValue);
            if (pendingEl) pendingEl.textContent = pendingRequests;
        };
        
        const _render = () => {
            if (!_container) return;
            
            const state = store.state;
            const isDesktop = window.innerWidth >= CONFIG.BREAKPOINTS.DESKTOP;
            
            let displayedCars;
            if (state.viewAllState === 'all') {
                displayedCars = state.items;
            } else {
                displayedCars = state.items.slice(0, state.displayCount);
            }
            
            const renderState = {
                displayCount: state.displayCount,
                total: state.items.length
            };
            
            const html = isDesktop 
                ? UITable.render(displayedCars, renderState, state.viewAllState)
                : UICards.render(displayedCars, renderState, state.viewAllState);
            
            if (html === _lastRendered) return;
            _lastRendered = html;
            
            requestAnimationFrame(() => {
                if (_container) _container.innerHTML = html;
            });
            
            const countEl = _getElement('cars-count');
            if (countEl) {
                const showing = displayedCars.length;
                const total = state.items.length;
                const text = showing < total ? `${showing} / ${total} cars` : `${total} cars`;
                countEl.innerHTML = `<span class="badge">${text}</span>`;
            }
        };
        
        const _renderDetails = () => {
            const car = store.state.currentCar;
            if (!car || _getCurrentScreen() !== 'details') return;
            const container = _getElement('car-details-container');
            if (container) container.innerHTML = UIDetails.render(car);
        };
        
        const _setupReactiveUI = () => {
            _unsubscribeStore = store.subscribe((nextState, prevState, action) => {
                if (action === 'LOAD_SUCCESS' || action === 'UPDATE_CAR' || action === 'DELETE_CAR' || action === 'ADD_CAR') {
                    if (_getCurrentScreen() === 'list') {
                        _render();
                    }
                    
                    if (nextState.stats) {
                        const totalEl = document.getElementById('stat-total-cars');
                        const activeEl = document.getElementById('stat-active-cars');
                        const valueEl = document.getElementById('stat-total-value');
                        const pendingEl = document.getElementById('stat-pending-requests');
                        
                        if (totalEl) totalEl.textContent = nextState.stats.totalCars;
                        if (activeEl) activeEl.textContent = nextState.stats.activeCars;
                        if (valueEl) valueEl.textContent = FormatUtils.formatPrice(nextState.stats.totalValue);
                        if (pendingEl) pendingEl.textContent = nextState.stats.pendingRequests;
                    }
                }
                
                if (_getCurrentScreen() === 'details' && nextState.currentCar) {
                    _renderDetails();
                }
            });
        };
        
        const _loadCars = async () => {
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
                const data = await api.getCars();
                if (!data) return;
                
                let items = Array.isArray(data) ? data : [];
                items = items.slice(0, CONFIG.UI.MAX_ITEMS);
                items.sort((a, b) => {
                    const nameA = `${a.brand || ''} ${a.model || ''}`;
                    const nameB = `${b.brand || ''} ${b.model || ''}`;
                    return nameA.localeCompare(nameB);
                });
                
                validator.buildMaps(items);
                
                const requests = await api.getRequests();
                _updateStats(items, requests || []);
                
                store.dispatch('LOAD_SUCCESS', { items, viewAllState: 'partial', displayCount: CONFIG.UI.INITIAL_DISPLAY, isLoading: false });
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
                    setTimeout(_loadCars, CONFIG.RETRY.BASE_DELAY * _retryCount);
                } else {
                    Toast.error('Failed to load cars. Please refresh the page.');
                    if (_container) {
                        _container.innerHTML = `<div class="empty-state error"><i class="fa-solid fa-circle-exclamation"></i><h3>Error loading cars</h3><p>${error.message || 'Connection error'}</p><button class="btn btn-primary" data-action="${ACTIONS.RETRY}">Try Again</button></div>`;
                    }
                    store.dispatch('LOAD_END', { isLoading: false });
                }
            } finally {
                if (_skeletonTimeout) clearTimeout(_skeletonTimeout);
            }
        };
        
        let _lastDuplicateMessage = '';
        
        const _optimisticUpdateCar = (carId, updatedCar, previousCar) => {
            _pendingAction = { carId, previousCar };
            store.dispatch('UPDATE_CAR', (state) => ({
                ...state,
                items: state.items.map(c => c.id == carId ? updatedCar : c),
                currentCar: state.currentCar?.id == carId ? updatedCar : state.currentCar
            }));
        };
        
        const _rollbackUpdate = () => {
            if (_pendingAction) {
                store.dispatch('ROLLBACK', (state) => ({
                    ...state,
                    items: state.items.map(c => c.id == _pendingAction.carId ? _pendingAction.previousCar : c),
                    currentCar: state.currentCar?.id == _pendingAction.carId ? _pendingAction.previousCar : state.currentCar
                }));
                _pendingAction = null;
            }
        };
        
        const _addCar = async (formData) => {
            const { brand, model, year, condition, color, category, price, licenseplate, notes } = formData;
            
            const brandValid = validator.brand(brand);
            if (!brandValid.valid) { Toast.error(brandValid.message); return { success: false, message: brandValid.message }; }
            
            const modelValid = validator.model(model);
            if (!modelValid.valid) { Toast.error(modelValid.message); return { success: false, message: modelValid.message }; }
            
            const yearValid = validator.year(year);
            if (!yearValid.valid) { Toast.error(yearValid.message); return { success: false, message: yearValid.message }; }
            
            const conditionValid = validator.condition(condition);
            if (!conditionValid.valid) { Toast.error(conditionValid.message); return { success: false, message: conditionValid.message }; }
            
            const colorValid = validator.color(color);
            if (!colorValid.valid) { Toast.error(colorValid.message); return { success: false, message: colorValid.message }; }
            
            const categoryValid = validator.category(category);
            if (!categoryValid.valid) { Toast.error(categoryValid.message); return { success: false, message: categoryValid.message }; }
            
            const priceValid = validator.price(price);
            if (!priceValid.valid) { Toast.error(priceValid.message); return { success: false, message: priceValid.message }; }
            
            const notesValid = validator.notes(notes);
            if (!notesValid.valid) { Toast.error(notesValid.message); return { success: false, message: notesValid.message }; }
            
            const duplicateCheck = validator.validateCarUniqueness(brand, model, year, null);
            
            if (!duplicateCheck.valid) {
                if (_lastDuplicateMessage !== duplicateCheck.message) {
                    Toast.warning(duplicateCheck.message);
                    _lastDuplicateMessage = duplicateCheck.message;
                }
                return { success: false, message: duplicateCheck.message };
            } else {
                _lastDuplicateMessage = '';
            }
            
            try {
                const newCar = await api.addCar({ 
                    brand, model, year, condition, color, category,
                    price: price ? Number(price) : null,
                    licenseplate: licenseplate || null,
                    notes: notes || null
                });
                
                if (newCar && newCar.id) {
                    validator.addToMaps(newCar);
                    store.dispatch('ADD_CAR', (state) => ({
                        ...state,
                        items: [...state.items, newCar].sort((a, b) => {
                            const nameA = `${a.brand || ''} ${a.model || ''}`;
                            const nameB = `${b.brand || ''} ${b.model || ''}`;
                            return nameA.localeCompare(nameB);
                        })
                    }));
                    
                    const requests = await api.getRequests();
                    _updateStats(store.state.items, requests || []);
                }
                
                _goBack();
                Toast.success('Car added successfully');
                return { success: true, message: 'Car added successfully' };
            } catch (error) {
                Logger.error('Add failed:', error);
                if (error.message && (error.message.includes('duplicate') || error.message.toLowerCase().includes('already'))) {
                    Toast.error('A car with these details already exists.');
                    return { success: false, message: 'A car with these details already exists.' };
                }
                Toast.error(error.message || 'Failed to add car');
                return { success: false, message: error.message || 'Failed to add car' };
            }
        };
        
        const _editCar = async (carId) => {
            try {
                const car = await api.getCar(carId);
                if (!car) {
                    Toast.error('Car not found');
                    return;
                }
                
                _editingCarId = carId;
                
                _getElement('edit-car-brand').value = car.brand || '';
                _getElement('edit-car-model').value = car.model || '';
                _getElement('edit-car-year').value = car.year || '';
                _getElement('edit-car-condition').value = car.condition || '';
                _getElement('edit-car-color').value = car.color || '';
                _getElement('edit-car-category').value = car.category || '';
                _getElement('edit-car-price').value = car.price || '';
                _getElement('edit-car-notes').value = car.notes || '';
                _getElement('edit-car-licenseplate').value = car.licenseplate || '';
                
                const hidden = _getElement('edit-car-id');
                if (hidden) hidden.value = carId;
                
                _showScreen('edit');
            } catch (error) {
                Logger.error('Edit failed:', error);
                Toast.error('Failed to load car data');
            }
        };
        
        const _updateCar = async (carId, formData) => {
    const { brand, model, year, condition, color, category, price, licenseplate, notes } = formData;
    
    const brandValid = validator.brand(brand);
    if (!brandValid.valid) { Toast.error(brandValid.message); return { success: false, message: brandValid.message }; }
    
    const modelValid = validator.model(model);
    if (!modelValid.valid) { Toast.error(modelValid.message); return { success: false, message: modelValid.message }; }
    
    const yearValid = validator.year(year);
    if (!yearValid.valid) { Toast.error(yearValid.message); return { success: false, message: yearValid.message }; }
    
    const conditionValid = validator.condition(condition);
    if (!conditionValid.valid) { Toast.error(conditionValid.message); return { success: false, message: conditionValid.message }; }
    
    const colorValid = validator.color(color);
    if (!colorValid.valid) { Toast.error(colorValid.message); return { success: false, message: colorValid.message }; }
    
    const categoryValid = validator.category(category);
    if (!categoryValid.valid) { Toast.error(categoryValid.message); return { success: false, message: categoryValid.message }; }
    
    const priceValid = validator.price(price);
    if (!priceValid.valid) { Toast.error(priceValid.message); return { success: false, message: priceValid.message }; }
    
    const notesValid = validator.notes(notes);
    if (!notesValid.valid) { Toast.error(notesValid.message); return { success: false, message: notesValid.message }; }
    
    const duplicateCheck = validator.validateCarUniqueness(brand, model, year, carId);
    if (!duplicateCheck.valid) {
        Toast.warning(duplicateCheck.message);
        return { success: false, message: duplicateCheck.message };
    }
    
    const currentCar = store.state.items.find(c => c.id == carId);
    const updatedCarData = { 
        id: carId,
        brand, model, year, condition, color, category,
        price: price ? Number(price) : null,
        licenseplate: licenseplate || null,
        notes: notes || null
    };
    
    _optimisticUpdateCar(carId, updatedCarData, currentCar);
    
    try {
        const updatedCar = await api.updateCar(carId, { 
            brand, model, year, condition, color, category,
            price: price ? Number(price) : null,
            licenseplate: licenseplate || null,
            notes: notes || null
        });
        
        if (updatedCar && updatedCar.id) {
            validator.updateInMaps(updatedCar);
            store.dispatch('UPDATE_CAR_CONFIRM', (state) => ({
                ...state,
                items: state.items.map(c => c.id == carId ? updatedCar : c),
                currentCar: state.currentCar?.id == carId ? updatedCar : state.currentCar
            }));
            _lastRendered = '';
            _render();
            
            const requests = await api.getRequests();
            _updateStats(store.state.items, requests || []);
        }
        
        _pendingAction = null;
                
        if (_getCurrentScreen() === 'edit') {
            _goBack();
        }

        store.dispatch('VIEW_CAR', { currentCar: updatedCarData });
        setTimeout(() => {
            _renderDetails();
        }, 0);
        
        Toast.success('Car updated successfully');
        return { success: true, message: 'Car updated successfully' };
    } catch (error) {
        _rollbackUpdate();
        Logger.error('Update failed:', error);
        if (error.message && (error.message.includes('duplicate') || error.message.toLowerCase().includes('already'))) {
            Toast.error('A car with these details already exists.');
            return { success: false, message: 'A car with these details already exists.' };
        }
        Toast.error(error.message || 'Failed to update car');
        return { success: false, message: error.message || 'Failed to update car' };
    }
};
        
        let _isDeleting = false;
        const _deleteCar = async (carId) => {
            if (_isDeleting) {
                Toast.warning('Please wait, deletion in progress...');
                return;
            }
            
            const confirmed = confirm('⚠️ Warning: Delete this car?\n\nAll associated requests will also be deleted permanently.\n\nThis action cannot be undone!');
            if (!confirmed) return;
            
            _isDeleting = true;
            
            const deletedCar = store.state.items.find(c => c.id == carId);
            store.dispatch('DELETE_CAR', (state) => ({
                ...state,
                items: state.items.filter(c => c.id != carId),
                currentCar: state.currentCar?.id == carId ? null : state.currentCar
            }));
            _render();
            
            try {
                const requests = await api.getRequests();
                if (requests && requests.length) {
                    const carRequests = requests.filter(r => r.carid == carId);
                    for (const req of carRequests) {
                        await api.deleteRequest(req.id);
                    }
                    if (carRequests.length > 0) {
                        Toast.info(`Deleted ${carRequests.length} associated request(s)`);
                    }
                }
                
                await api.deleteCar(carId);
                validator.removeFromMaps(carId);
                
                const newRequests = await api.getRequests();
                _updateStats(store.state.items, newRequests || []);
                
                Toast.success('Car deleted successfully');
                
                if (_getCurrentScreen() === 'details') {
                    _goBack();
                }
            } catch (error) {
                store.dispatch('RESTORE_CAR', (state) => ({
                    ...state,
                    items: [...state.items, deletedCar].sort((a, b) => {
                        const nameA = `${a.brand || ''} ${a.model || ''}`;
                        const nameB = `${b.brand || ''} ${b.model || ''}`;
                        return nameA.localeCompare(nameB);
                    })
                }));
                _render();
                Logger.error('Delete failed:', error);
                Toast.error('Failed to delete car');
            } finally {
                _isDeleting = false;
            }
        };
        
        const _viewCar = async (carId) => {
            let car = store.state.items.find(c => c.id == carId);

            if (!car) {
                car = await api.getCar(carId);
            }

            if (!car) {
                Toast.error('Car not found');
                return;
            }

            store.dispatch('VIEW_CAR', { currentCar: car });
            _showScreen('details');
            _renderDetails();
        };
        
        const _handleLoadMore = () => {
            const current = store.state.displayCount;
            const total = store.state.items.length;
            const newCount = Math.min(current + CONFIG.UI.LOAD_STEP, total);
            
            store.dispatch('LOAD_MORE', { displayCount: newCount, viewAllState: 'partial' });
            _render();
        };
        
        const _handleViewAll = () => {
            store.dispatch('VIEW_ALL', { viewAllState: 'all', displayCount: store.state.items.length });
            _render();
        };
        
        const _handleViewLess = () => {
            store.dispatch('VIEW_LESS', { viewAllState: 'partial', displayCount: CONFIG.UI.INITIAL_DISPLAY });
            _render();
        };
        
        const _setupRealtimeValidation = () => {
            const addBrandInput = _getElement('add-car-brand');
            const addModelInput = _getElement('add-car-model');
            const addYearInput = _getElement('add-car-year');
            const editBrandInput = _getElement('edit-car-brand');
            const editModelInput = _getElement('edit-car-model');
            const editYearInput = _getElement('edit-car-year');
            
            const validateDuplicateField = (inputs, isEdit = false, carId = null) => {
                const brand = inputs.brand?.value.trim();
                const model = inputs.model?.value.trim();
                const year = inputs.year?.value.trim();
                
                if (brand && model && year) {
                    const duplicateCheck = validator.duplicateCar(brand, model, year, isEdit ? carId : null);
                    if (!duplicateCheck.valid) {
                        Toast.warning(duplicateCheck.message);
                        return false;
                    }
                }
                return true;
            };
            
            const debouncedValidate = () => {
                globalDebounce(() => {
                    if (addBrandInput && addModelInput && addYearInput) {
                        validateDuplicateField({
                            brand: addBrandInput,
                            model: addModelInput,
                            year: addYearInput
                        }, false);
                    }
                });
            };
            
            if (addBrandInput) addBrandInput.addEventListener('input', debouncedValidate);
            if (addModelInput) addModelInput.addEventListener('input', debouncedValidate);
            if (addYearInput) addYearInput.addEventListener('input', debouncedValidate);
            
            if (editBrandInput && editModelInput && editYearInput) {
                const debouncedEditValidate = () => {
                    globalDebounce(() => {
                        validateDuplicateField({
                            brand: editBrandInput,
                            model: editModelInput,
                            year: editYearInput
                        }, true, _editingCarId);
                    });
                };
                editBrandInput.addEventListener('input', debouncedEditValidate);
                editModelInput.addEventListener('input', debouncedEditValidate);
                editYearInput.addEventListener('input', debouncedEditValidate);
            }
        };
        
        let _isActionProcessing = false;
        
        const _actionMap = {
            [ACTIONS.ADD]: () => _showScreen('add'),
            [ACTIONS.BACK]: (el) => el.dataset.force ? _showScreen(el.dataset.force, false) : _goBack(),
            [ACTIONS.LOAD_MORE]: _handleLoadMore,
            [ACTIONS.VIEW_ALL]: _handleViewAll,
            [ACTIONS.VIEW_LESS]: _handleViewLess,
            [ACTIONS.VIEW]: (el) => el.dataset.id && _viewCar(el.dataset.id),
            [ACTIONS.EDIT]: (el) => el.dataset.id && _editCar(el.dataset.id),
            [ACTIONS.DELETE]: (el) => el.dataset.id && _deleteCar(el.dataset.id),
            [ACTIONS.RETRY]: () => _loadCars(),
        };
        
        const _handleClick = (e) => {
        const trigger = e.target.closest('[data-action]');
        if (!trigger) return;
        
        const action = trigger.dataset.action;
        if ((action === ACTIONS.DELETE || action === ACTIONS.EDIT) && _isActionProcessing) {
            Toast.warning('Please wait...');
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        //  FIX: Handle edit from details screen without data-id
        if (action === ACTIONS.EDIT && !trigger.dataset.id && _getCurrentScreen() === 'details') {
            const carId = store.state.currentCar?.id;
            if (carId) {
                _editCar(carId);
                return;
            }
        }
        
        const handler = _actionMap[action];
        if (handler) {
            if (action === ACTIONS.DELETE || action === ACTIONS.EDIT) {
                _isActionProcessing = true;
                Promise.resolve(handler(trigger)).finally(() => {
                    setTimeout(() => { _isActionProcessing = false; }, 500);
                });
            } else {
                handler(trigger);
            }
        }
    };
        
        const _handleResize = () => {
            globalDebounce(() => {
                if (_getCurrentScreen() === 'list') _render();
                if (_getCurrentScreen() === 'details' && store.state.currentCar) _renderDetails();
            });
        };
        
        const _handleFormSubmit = async (e) => {
            e.preventDefault();
            if (_isProcessing) return;
            
            _isProcessing = true;
            const form = e.target;
            const isAdd = form.id === 'add-car-form';
            
            const formData = {
                brand: _getElement(isAdd ? 'add-car-brand' : 'edit-car-brand')?.value.trim(),
                model: _getElement(isAdd ? 'add-car-model' : 'edit-car-model')?.value.trim(),
                year: _getElement(isAdd ? 'add-car-year' : 'edit-car-year')?.value.trim(),
                condition: _getElement(isAdd ? 'add-car-condition' : 'edit-car-condition')?.value,
                color: _getElement(isAdd ? 'add-car-color' : 'edit-car-color')?.value.trim(),
                category: _getElement(isAdd ? 'add-car-category' : 'edit-car-category')?.value,
                price: _getElement(isAdd ? 'add-car-price' : 'edit-car-price')?.value.trim(),
                licenseplate: _getElement(isAdd ? 'add-car-licenseplate' : 'edit-car-licenseplate')?.value.trim(),
                notes: _getElement(isAdd ? 'add-car-notes' : 'edit-car-notes')?.value.trim()
            };
            
            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn?.innerHTML;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            }
            
            let result;
            if (isAdd) {
                result = await _addCar(formData);
                if (result.success) form.reset();
            } else {
                const carId = _getElement('edit-car-id')?.value;
                if (carId) result = await _updateCar(carId, formData);
                else result = { success: false, message: 'Invalid car ID' };
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
            
            const addForm = _getElement('add-car-form');
            const editForm = _getElement('edit-car-form');
            if (addForm) addForm.addEventListener('submit', _handleFormSubmit);
            if (editForm) editForm.addEventListener('submit', _handleFormSubmit);
            
            _setupRealtimeValidation();
            _setupReactiveUI();
        };
        
        const _unbindEvents = () => {
            document.body.removeEventListener('click', _handleClick);
            window.removeEventListener('resize', _handleResize);
            
            const addForm = _getElement('add-car-form');
            const editForm = _getElement('edit-car-form');
            if (addForm) addForm.removeEventListener('submit', _handleFormSubmit);
            if (editForm) editForm.removeEventListener('submit', _handleFormSubmit);
            
            if (_unsubscribeStore) _unsubscribeStore();
        };
        
        const init = async () => {
            if (_isInitialized) return;
            
            _container = _getElement('cars-container');
            if (!_container) return;
            
            _bindEvents();
            await _loadCars();
            _isInitialized = true;
        };
        
        const destroy = () => {
            _unbindEvents();
            store.destroy();
            _navStack = [];
            _navSet.clear();
            Object.keys(_elements).forEach(key => delete _elements[key]);
            _isInitialized = false;
            if (_skeletonTimeout) clearTimeout(_skeletonTimeout);
            Logger.log('Module destroyed');
        };
        
        return {
            init,
            destroy,
            reload: _loadCars,
            getState: () => store.state,
            goBack: _goBack,
            viewCarDetails: _viewCar,
            editCar: _editCar,
            deleteCar: _deleteCar
        };
    };

    const initCarsModule = () => {
        if (!window.API) {
            Logger.error('API instance required - make sure api.js loads first');
            Toast.error('API not loaded. Please refresh the page.');
            return null;
        }
        
        const module = createCarsModule();
        window.CarsModule = module;
        module.init();
        return module;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initCarsModule());
    } else {
        setTimeout(() => initCarsModule(), 100);
    }

    window.addEventListener('beforeunload', () => {
        if (window.CarsModule?.destroy) window.CarsModule.destroy();
    });