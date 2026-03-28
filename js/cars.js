/**
 * Cars Module - Handles all car-related functionality
 * Fixed: Event listeners, error handling, ID-based relationships
 */

const CarsModule = (function() {
    // Private state
    let currentCars = [];
    let eventListenersBound = false;
    let isInitialized = false;

    // ==================== INITIALIZATION ====================
    function init() {
        if (isInitialized) return;
        
        console.log('🚗 Cars Module Initialized');
        loadCars();
        bindEvents();
        isInitialized = true;
    }

    function bindEvents() {
        if (eventListenersBound) return;
        
        // Add Car Form
        const addForm = document.getElementById('add-car-form');
        if (addForm) {
            // Remove existing listener to avoid duplicates
            const newAddForm = addForm.cloneNode(true);
            addForm.parentNode.replaceChild(newAddForm, addForm);
            newAddForm.addEventListener('submit', addCar);
        }

        // Edit Car Form
        const editForm = document.getElementById('edit-car-form');
        if (editForm) {
            const newEditForm = editForm.cloneNode(true);
            editForm.parentNode.replaceChild(newEditForm, editForm);
            newEditForm.addEventListener('submit', updateCar);
        }

        // Cancel buttons
        const cancelAddBtn = document.getElementById('cancel-add-car');
        if (cancelAddBtn) {
            const newCancelAdd = cancelAddBtn.cloneNode(true);
            cancelAddBtn.parentNode.replaceChild(newCancelAdd, cancelAddBtn);
            newCancelAdd.addEventListener('click', () => App.showScreen('cars-list'));
        }

        const cancelEditBtn = document.getElementById('cancel-edit-car');
        if (cancelEditBtn) {
            const newCancelEdit = cancelEditBtn.cloneNode(true);
            cancelEditBtn.parentNode.replaceChild(newCancelEdit, cancelEditBtn);
            newCancelEdit.addEventListener('click', () => App.showScreen('cars-list'));
        }

        // Back buttons
        const backFromAdd = document.getElementById('back-from-add-car');
        if (backFromAdd) {
            const newBackAdd = backFromAdd.cloneNode(true);
            backFromAdd.parentNode.replaceChild(newBackAdd, backFromAdd);
            newBackAdd.addEventListener('click', () => App.showScreen('cars-list'));
        }

        const backFromDetails = document.getElementById('back-from-car-details');
        if (backFromDetails) {
            const newBackDetails = backFromDetails.cloneNode(true);
            backFromDetails.parentNode.replaceChild(newBackDetails, backFromDetails);
            newBackDetails.addEventListener('click', () => App.showScreen('cars-list'));
        }

        const backFromEdit = document.getElementById('back-from-edit-car');
        if (backFromEdit) {
            const newBackEdit = backFromEdit.cloneNode(true);
            backFromEdit.parentNode.replaceChild(newBackEdit, backFromEdit);
            newBackEdit.addEventListener('click', () => App.showScreen('cars-list'));
        }

        // FAB button
        const fabBtn = document.getElementById('fab-add');
        if (fabBtn) {
            const newFab = fabBtn.cloneNode(true);
            fabBtn.parentNode.replaceChild(newFab, fabBtn);
            newFab.addEventListener('click', () => App.showScreen('add-car'));
        }

        eventListenersBound = true;
    }

    // ==================== CHECK DUPLICATE CAR ====================
    async function checkDuplicateCar(brand, model, year, excludeCarId = null) {
        try {
            const cars = await API.getCars();
            
            const duplicate = cars.find(car => {
                const isSameBrand = car.brand?.toLowerCase() === brand.toLowerCase();
                const isSameModel = car.model?.toLowerCase() === model.toLowerCase();
                const isSameYear = car.year?.toString() === year.toString();
                const isDifferentCar = excludeCarId ? car.id != excludeCarId : true;
                
                return isSameBrand && isSameModel && isSameYear && isDifferentCar;
            });
            
            if (duplicate) {
                return {
                    isDuplicate: true,
                    message: `This car already exists: ${duplicate.brand} ${duplicate.model} (${duplicate.year})`,
                    existingCar: duplicate
                };
            }
            
            return { isDuplicate: false };
        } catch (error) {
            console.error('Error checking duplicate car:', error);
            return { isDuplicate: false, error: true };
        }
    }

    // ==================== LOAD CARS ====================
    async function loadCars() {
        const container = document.getElementById('cars-container');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"><div class="spinner"></div><p>Loading cars...</p></div></div>';
            
            currentCars = await API.getCars() || [];
            displayCars(currentCars);
            
            // Notify SearchModule to refresh data if needed
            if (window.SearchModule && window.SearchModule.refreshData) {
                window.SearchModule.refreshData();
            }
        } catch (error) {
            console.error('Error loading cars:', error);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading cars</h3><p>Please try again</p></div>';
            App.showToast('Failed to load cars', 'error');
        }
    }

    // ==================== DISPLAY CARS ====================
    function displayCars(cars) {
        const container = document.getElementById('cars-container');
        if (!container) return;

        if (!cars || cars.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-car-side"></i>
                    <h3>No cars found</h3>
                    <p>Add your first car to get started</p>
                    <button type="button" class="btn btn-primary" onclick="App.showScreen('add-car')">
                        <i class="fa-solid fa-plus" style="font-size:16px;margin:5px"></i> Add Car
                    </button>
                </div>
            `;
            return;
        }

        let html = '';
        cars.forEach(car => html += createCarCard(car));
        container.innerHTML = html;
    }

    // ==================== CREATE CAR CARD ====================
    function createCarCard(car) {
        const brand = car.brand || '';
        const model = car.model || '';
        const year = car.year || '';
        const carName = `${brand} ${model} (${year})`.trim();
        
        let detailsHtml = '';
        
        if (car.color) {
            detailsHtml += `<span class="detail-badge"><i class="fa-solid fa-palette"></i> ${App.escapeHtml(car.color)}</span>`;
        }
        
        if (car.category) {
            detailsHtml += `<span class="detail-badge"><i class="fa-solid fa-tag"></i> ${App.escapeHtml(car.category)}</span>`;
        }
        
        if (car.condition) {
            detailsHtml += `<span class="detail-badge"><i class="fa-solid fa-clipboard-check"></i> ${App.formatCondition(car.condition)}</span>`;
        }
        
        if (car.licenseplate) {
            detailsHtml += `<span class="detail-badge"><i class="fa-solid fa-plate"></i> ${App.escapeHtml(car.licenseplate)}</span>`;
        }
        
        const priceHtml = car.price 
            ? `<span class="detail-badge price-badge"><i class="fa-solid fa-dollar-sign"></i> ${App.formatPrice(car.price)}</span>`
            : `<span class="detail-badge"><i class="fa-solid fa-dollar-sign"></i> Price on request</span>`;
        
        const notesHtml = car.notes 
            ? `<div class="car-notes-preview"><i class="fa-regular fa-note-sticky"></i> ${App.truncateText(car.notes, 60)}</div>`
            : '';
        
        return `
            <div class="result-card car-result-card" data-type="car" data-id="${car.id}" onclick="CarsModule.viewCarDetails('${car.id}')">
                <div class="result-header">
                    <div class="result-icon car">
                        <i class="fa-solid fa-car"></i>
                    </div>
                    <div class="result-title">
                        <h4>${App.escapeHtml(carName)}</h4>
                        <div class="result-type">Car</div>
                        <div class="car-actions" onclick="event.stopPropagation()">
                            <button type="button" class="btn-icon btn-edit" onclick="CarsModule.editCar('${car.id}')" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="btn-icon btn-delete" onclick="CarsModule.deleteCar('${car.id}')" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="result-details">
                    ${detailsHtml}
                    ${priceHtml}
                </div>
                ${notesHtml}
            </div>
        `;
    }

    // ==================== VIEW CAR DETAILS ====================
    async function viewCarDetails(carId) {
        try {
            const car = await API.getCar(carId);
            if (!car) {
                App.showToast('Car not found', 'error');
                return;
            }

            const container = document.getElementById('car-details-container');
            if (!container) return;

            const brand = car.brand || '';
            const model = car.model || '';
            const year = car.year || '';

            container.innerHTML = `
                <div class="car-details-view">
                    <div class="detail-header">
                        <i class="fa-solid fa-car"></i>
                        <h3>${App.escapeHtml(brand)} ${App.escapeHtml(model)} (${App.escapeHtml(year)})</h3>
                    </div>
                    <div class="info-cards">
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-trademark"></i></div>
                            <div class="info-content">
                                <label>Brand</label>
                                <div class="info-value">${App.escapeHtml(brand) || 'Not specified'}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-car-side"></i></div>
                            <div class="info-content">
                                <label>Model</label>
                                <div class="info-value">${App.escapeHtml(model) || 'Not specified'}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-calendar-alt"></i></div>
                            <div class="info-content">
                                <label>Year</label>
                                <div class="info-value">${App.escapeHtml(year) || 'Not specified'}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-clipboard-check"></i></div>
                            <div class="info-content">
                                <label>Condition</label>
                                <div class="info-value">${App.formatCondition(car.condition || 'Not specified')}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-palette"></i></div>
                            <div class="info-content">
                                <label>Color</label>
                                <div class="info-value">${App.escapeHtml(car.color || 'Not specified')}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-tag"></i></div>
                            <div class="info-content">
                                <label>Category</label>
                                <div class="info-value">${car.category ? App.escapeHtml(car.category.charAt(0).toUpperCase() + car.category.slice(1)) : 'Not specified'}</div>
                            </div>
                        </div>
                        
                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-dollar-sign"></i></div>
                            <div class="info-content">
                                <label>Price</label>
                                <div class="info-value">${car.price ? App.formatPrice(car.price) : 'Price on request'}</div>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="info-icon"><i class="fa-solid fa-plate"></i></div>
                            <div class="info-content">
                                <label>License Plate</label>
                                <div class="info-value">${car.licenseplate ? App.escapeHtml(car.licenseplate) : 'Not specified'}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${car.notes ? `
                    <div class="notes-section">
                        <div class="notes-header">
                            <i class="fa-regular fa-note-sticky"></i>
                            <h3>Notes</h3>
                        </div>
                        <div class="notes-content">
                            ${App.escapeHtml(car.notes).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="form-actions" style="margin-top: 1.5rem;">
                        <button type="button" class="btn btn-warning" onclick="CarsModule.editCar('${car.id}')" style="flex: 1;">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button type="button" class="btn btn-danger" onclick="CarsModule.deleteCar('${car.id}')" style="flex: 1;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;

            App.showScreen('car-details');
        } catch (error) {
            console.error('Error viewing car:', error);
            App.showToast('Failed to load car details', 'error');
        }
    }

    // ==================== ADD CAR ====================
    async function addCar(e) {
        e.preventDefault();
        
        const brand = document.getElementById('add-car-brand').value.trim();
        const model = document.getElementById('add-car-model').value.trim();
        const year = document.getElementById('add-car-year').value.trim();
        const condition = document.getElementById('add-car-condition').value;
        const color = document.getElementById('add-car-paint').value.trim();
        const category = document.getElementById('add-car-category').value;
        const price = parseFloat(document.getElementById('add-car-price').value) || null;
        const notes = document.getElementById('add-car-notes').value.trim() || null;
        const licensePlate = document.getElementById('add-car-licenseplate')?.value.trim() || null;

        // Validate required fields
        if (!brand || !model || !year || !condition || !color || !category) {
            App.showToast('All fields are required', 'error');
            return;
        }

        // Check for duplicate car
        const duplicateCheck = await checkDuplicateCar(brand, model, year);
        
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        const carData = {
            brand,
            model,
            year,
            condition,
            color,
            category,
            price,
            notes,
            licensePlate
        };

        try {
            await API.addCar(carData);
            App.showToast('Car added successfully', 'success');
            document.getElementById('add-car-form').reset();
            await loadCars();
            App.showScreen('cars-list');
        } catch (error) {
            console.error('Error adding car:', error);
            App.showToast(error.message || 'Failed to add car', 'error');
        }
    }

    // ==================== EDIT CAR ====================
    async function editCar(carId) {
        try {
            const car = await API.getCar(carId);
            
            if (!car) {
                App.showToast('Car not found', 'error');
                return;
            }

            // Populate form fields
            const brandField = document.getElementById('edit-car-brand');
            const modelField = document.getElementById('edit-car-model');
            const yearField = document.getElementById('edit-car-year');
            const conditionField = document.getElementById('edit-car-condition');
            const colorField = document.getElementById('edit-car-paint');
            const categoryField = document.getElementById('edit-car-category');
            const priceField = document.getElementById('edit-car-price');
            const notesField = document.getElementById('edit-car-notes');
            const licenseField = document.getElementById('edit-car-licenseplate');
            const updateBtn = document.getElementById('update-car');

            if (brandField) brandField.value = car.brand || '';
            if (modelField) modelField.value = car.model || '';
            if (yearField) yearField.value = car.year || '';
            if (conditionField) conditionField.value = car.condition || '';
            if (colorField) colorField.value = car.color || '';
            if (categoryField) categoryField.value = car.category || '';
            if (priceField) priceField.value = car.price || '';
            if (notesField) notesField.value = car.notes || '';
            if (licenseField) licenseField.value = car.licenseplate || '';
            if (updateBtn) updateBtn.dataset.carId = carId;

            App.showScreen('edit-car');
        } catch (error) {
            console.error('Error editing car:', error);
            App.showToast('Failed to load car for edit', 'error');
        }
    }

    // ==================== UPDATE CAR ====================
    async function updateCar(e) {
        e.preventDefault();
        
        const carId = document.getElementById('update-car')?.dataset.carId;
        if (!carId) {
            App.showToast('Invalid car ID', 'error');
            return;
        }

        const brand = document.getElementById('edit-car-brand').value.trim();
        const model = document.getElementById('edit-car-model').value.trim();
        const year = document.getElementById('edit-car-year').value.trim();
        const condition = document.getElementById('edit-car-condition').value;
        const color = document.getElementById('edit-car-paint').value.trim();
        const category = document.getElementById('edit-car-category').value;
        const price = document.getElementById('edit-car-price').value.trim() ? parseFloat(document.getElementById('edit-car-price').value) : null;
        const notes = document.getElementById('edit-car-notes').value.trim() || null;
        const licensePlate = document.getElementById('edit-car-licenseplate')?.value.trim() || null;

        if (!brand || !model || !year || !condition || !color || !category) {
            App.showToast('All fields are required', 'error');
            return;
        }

        const duplicateCheck = await checkDuplicateCar(brand, model, year, carId);
        
        if (duplicateCheck.isDuplicate) {
            App.showToast(duplicateCheck.message, 'warning', 4000);
            return;
        }

        const carData = {
            brand,
            model,
            year,
            condition,
            color,
            category,
            price,
            notes,
            licensePlate
        };

        try {
            await API.updateCar(carId, carData);
            App.showToast('Car updated successfully', 'success');
            await loadCars();
            App.showScreen('cars-list');
        } catch (error) {
            console.error('Error updating car:', error);
            App.showToast(error.message || 'Failed to update car', 'error');
        }
    }

    // ==================== DELETE CAR ====================
    async function deleteCar(carId) {
        if (!confirm('Are you sure you want to delete this car? All associated requests will also be deleted.')) return;

        try {
            // Delete associated requests first
            const requests = await API.getRequests();
            const carRequests = requests.filter(req => req.carid == carId);
            
            if (carRequests.length > 0) {
                await Promise.all(carRequests.map(req => API.deleteRequest(req.id)));
                App.showToast(`Deleted ${carRequests.length} request(s) associated with this car`, 'info');
            }
            
            await API.deleteCar(carId);
            App.showToast('Car deleted successfully', 'success');
            await loadCars();
            
            // Refresh requests if RequestsModule is loaded
            if (window.RequestsModule && RequestsModule.loadRequests) {
                await RequestsModule.loadRequests();
            }
        } catch (error) {
            console.error('Error deleting car:', error);
            App.showToast('Failed to delete car', 'error');
        }
    }

    // ==================== PUBLIC API ====================
    return { 
        init, 
        loadCars, 
        viewCarDetails, 
        editCar, 
        deleteCar,
        getCurrentCars: () => currentCars
    };
})();

window.CarsModule = CarsModule;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cars-container')) {
        CarsModule.init();
    }
});