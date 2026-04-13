/**
 * Dashboard Module - Statistics Only
 * Desktop only - Shows all statistics without tables
 */

const DashboardModule = (function() {
    let isInitialized = false;
    let carsData = [];
    let clientsData = [];
    let requestsData = [];

    function init() {
        if (isInitialized) return;
        console.log('📊 Dashboard Module Initialized - Statistics Only');
        loadAllData();
        isInitialized = true;
    }

    async function loadAllData() {
        try {
            [carsData, clientsData, requestsData] = await Promise.all([
                API.getCars(),
                API.getClients(),
                API.getRequests()
            ]);
            
            loadMainStats();
            loadCarsStats();
            loadClientsStats();
            loadRequestsStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            App.showToast('Failed to load dashboard data', 'error');
        }
    }

    // ========== MAIN STATS ==========
    function loadMainStats() {
        const totalSales = calculateTotalSales();
        document.getElementById('total-cars').textContent = carsData.length || 0;
        document.getElementById('total-sales').textContent = '$' + totalSales.toLocaleString();
        document.getElementById('total-clients').textContent = clientsData.length || 0;
        document.getElementById('total-requests').textContent = requestsData.length || 0;
    }

    function calculateTotalSales() {
        const completedRequests = requestsData.filter(r => r.status === 'completed');
        const carIds = [...new Set(completedRequests.map(r => r.carid).filter(id => id))];
        let total = 0;
        carIds.forEach(carId => {
            const car = carsData.find(c => c.id == carId);
            if (car && car.price) total += parseFloat(car.price);
        });
        return total;
    }

    // ========== CARS STATISTICS ==========
    function loadCarsStats() {
        // Available vs Rented (based on requests)
        const requestedCarIds = new Set(requestsData.map(r => r.carid).filter(id => id));
        const rentedCount = carsData.filter(c => requestedCarIds.has(c.id)).length;
        const availableCount = carsData.length - rentedCount;
        
        document.getElementById('available-cars').textContent = availableCount;
        document.getElementById('rented-cars').textContent = rentedCount;
        
        // Average Price
        const totalPrice = carsData.reduce((sum, car) => sum + (parseFloat(car.price) || 0), 0);
        const avgPrice = carsData.length > 0 ? totalPrice / carsData.length : 0;
        document.getElementById('avg-price').textContent = '$' + Math.round(avgPrice).toLocaleString();
        
        // Min & Max Price
        const prices = carsData.map(c => parseFloat(c.price)).filter(p => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        document.getElementById('min-price').textContent = '$' + minPrice.toLocaleString();
        document.getElementById('max-price').textContent = '$' + maxPrice.toLocaleString();
        
        // Most Popular Brand
        const brandCount = {};
        carsData.forEach(car => {
            if (car.brand) {
                brandCount[car.brand] = (brandCount[car.brand] || 0) + 1;
            }
        });
        let mostPopularBrand = '-';
        let maxBrandCount = 0;
        for (const [brand, count] of Object.entries(brandCount)) {
            if (count > maxBrandCount) {
                maxBrandCount = count;
                mostPopularBrand = brand;
            }
        }
        document.getElementById('most-popular-brand').textContent = mostPopularBrand;
        
        // Most Popular Model
        const modelCount = {};
        carsData.forEach(car => {
            if (car.model) {
                const key = `${car.brand} ${car.model}`;
                modelCount[key] = (modelCount[key] || 0) + 1;
            }
        });
        let mostPopularModel = '-';
        let maxModelCount = 0;
        for (const [model, count] of Object.entries(modelCount)) {
            if (count > maxModelCount) {
                maxModelCount = count;
                mostPopularModel = model;
            }
        }
        document.getElementById('most-popular-model').textContent = mostPopularModel;
        
        // Most Popular Category
        const categoryCount = {};
        carsData.forEach(car => {
            if (car.category) {
                categoryCount[car.category] = (categoryCount[car.category] || 0) + 1;
            }
        });
        let mostPopularCategory = '-';
        let maxCategoryCount = 0;
        for (const [category, count] of Object.entries(categoryCount)) {
            if (count > maxCategoryCount) {
                maxCategoryCount = count;
                mostPopularCategory = category;
            }
        }
        document.getElementById('most-popular-category').textContent = mostPopularCategory;
        
        // Most Popular Color
        const colorCount = {};
        carsData.forEach(car => {
            if (car.color) {
                colorCount[car.color] = (colorCount[car.color] || 0) + 1;
            }
        });
        let mostPopularColor = '-';
        let maxColorCount = 0;
        for (const [color, count] of Object.entries(colorCount)) {
            if (count > maxColorCount) {
                maxColorCount = count;
                mostPopularColor = color;
            }
        }
        document.getElementById('most-popular-color').textContent = mostPopularColor;
        
        // Most Popular Condition
        const conditionCount = {};
        carsData.forEach(car => {
            if (car.condition) {
                conditionCount[car.condition] = (conditionCount[car.condition] || 0) + 1;
            }
        });
        let mostPopularCondition = '-';
        let maxConditionCount = 0;
        for (const [condition, count] of Object.entries(conditionCount)) {
            if (count > maxConditionCount) {
                maxConditionCount = count;
                mostPopularCondition = condition;
            }
        }
        // Format condition for display
        const conditionMap = {
            'excellent': 'Excellent',
            'very_good': 'Very Good',
            'good': 'Good',
            'fair': 'Fair',
            'needs_maintenance': 'Needs Maintenance'
        };
        mostPopularCondition = conditionMap[mostPopularCondition] || mostPopularCondition;
        document.getElementById('most-popular-condition').textContent = mostPopularCondition;
    }

    // ========== CLIENTS STATISTICS ==========
    function loadClientsStats() {
        // New clients this month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const newClientsMonth = clientsData.filter(client => {
            if (!client.registeredat) return false;
            const date = new Date(client.registeredat);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
        document.getElementById('new-clients-month').textContent = newClientsMonth;
        
        // New clients this week
        const currentWeekStart = new Date();
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const newClientsWeek = clientsData.filter(client => {
            if (!client.registeredat) return false;
            const date = new Date(client.registeredat);
            return date >= currentWeekStart;
        }).length;
        document.getElementById('new-clients-week').textContent = newClientsWeek;
        
        // Most Active Client (most requests)
        const clientRequestCount = {};
        requestsData.forEach(req => {
            if (req.clientid) {
                clientRequestCount[req.clientid] = (clientRequestCount[req.clientid] || 0) + 1;
            }
        });
        
        let mostActiveClient = '-';
        let maxRequests = 0;
        for (const [clientId, count] of Object.entries(clientRequestCount)) {
            if (count > maxRequests) {
                maxRequests = count;
                const client = clientsData.find(c => c.id == clientId);
                mostActiveClient = client ? client.name : '-';
            }
        }
        document.getElementById('most-active-client').textContent = mostActiveClient;
    }

    // ========== REQUESTS STATISTICS ==========
    function loadRequestsStats() {
        const active = requestsData.filter(r => r.status === 'active').length;
        const completed = requestsData.filter(r => r.status === 'completed').length;
        const pending = requestsData.filter(r => r.status === 'pending').length;
        
        document.getElementById('active-requests').textContent = active;
        document.getElementById('completed-requests').textContent = completed;
        document.getElementById('pending-requests').textContent = pending;
        
        // Completion Rate
        const total = requestsData.length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        document.getElementById('completion-rate').textContent = completionRate + '%';
        
        // Average Order Value (from completed requests)
        const completedRequests = requestsData.filter(r => r.status === 'completed');
        let totalOrderValue = 0;
        completedRequests.forEach(req => {
            const car = carsData.find(c => c.id == req.carid);
            if (car && car.price) totalOrderValue += parseFloat(car.price);
        });
        const avgOrderValue = completedRequests.length > 0 ? totalOrderValue / completedRequests.length : 0;
        document.getElementById('avg-order-value').textContent = '$' + Math.round(avgOrderValue).toLocaleString();
    }

    return {
        init
    };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    DashboardModule.init();
});