/**
 * API Module - Handles all HTTP requests to Supabase REST API
 */

const API = (function() {
    const BASE_URL = "https://pjgixwacmudsjcdjwqdc.supabase.co/rest/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2l4d2FjbXVkc2pjZGp3cWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI2MDQsImV4cCI6MjA4OTY2ODYwNH0.cXZLKO3QbW-G7hca4_8c8pH2n7suRHvvBJO6F459lkU";

    function getHeaders() {
        return {
            "Content-Type": "application/json",
            "apikey": API_KEY,
            "Authorization": `Bearer ${API_KEY}`,
            "Prefer": "return=representation"
        };
    }

    async function handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        if (response.status === 204) return true;
        return response.json();
    }

    // ==================== CLIENTS API ====================
    async function getClients() {
        const response = await fetch(`${BASE_URL}/clients?select=*`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }

    async function getClient(id) {
        const response = await fetch(`${BASE_URL}/clients?id=eq.${id}&select=*`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data[0] || null;
    }

    async function addClient(client) {
        const newClient = {
            name: client.name,
            email: client.email,
            phone: client.phone,
            notes: client.notes,
            registeredat: client.registeredAt,
            updatedat: client.updatedAt
        };

        const response = await fetch(`${BASE_URL}/clients`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(newClient)
        });

        const data = await handleResponse(response);
        return data[0];
    }

    async function updateClient(id, client) {
        const updatedClient = {
            name: client.name,
            email: client.email,
            phone: client.phone,
            notes: client.notes,
            updatedat: client.updatedAt
        };

        const response = await fetch(`${BASE_URL}/clients?id=eq.${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(updatedClient)
        });

        const data = await handleResponse(response);
        return data[0];
    }

    async function deleteClient(id) {
        const response = await fetch(`${BASE_URL}/clients?id=eq.${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return handleResponse(response);
    }

    // ==================== REQUESTS API ====================
    async function getRequests() {
        // Added sorting by createdat in descending order (newest first)
        const response = await fetch(`${BASE_URL}/requests?select=*&order=createdat.desc`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }

    async function getRequest(id) {
        const response = await fetch(`${BASE_URL}/requests?id=eq.${id}&select=*`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data[0] || null;
    }

    async function addRequest(request) {
        const newRequest = {
            clientid: request.clientId,
            carid: request.carId,
            status: request.status,
            title: request.title || "New Request",
            clientname: request.clientName,
            carname: request.carName,
            notes: request.notes || "",
            createdat: new Date().toISOString()
        };

        console.log("Sending request:", newRequest);

        const response = await fetch(`${BASE_URL}/requests`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(newRequest)
        });

        const data = await handleResponse(response);
        return data[0];
    }

    async function updateRequest(id, request) {
        const updatedRequest = {
            clientid: request.clientId,
            carid: request.carId,
            status: request.status,
            title: request.title,
            clientname: request.clientName,
            carname: request.carName,
            notes: request.notes
        };

        const response = await fetch(`${BASE_URL}/requests?id=eq.${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(updatedRequest)
        });

        const data = await handleResponse(response);
        return data[0];
    }

    async function deleteRequest(id) {
        const response = await fetch(`${BASE_URL}/requests?id=eq.${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return handleResponse(response);
    }

    // ==================== CARS API ====================
    async function getCars() {
        const response = await fetch(`${BASE_URL}/cars?select=*`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }

    async function getCar(id) {
        const response = await fetch(`${BASE_URL}/cars?id=eq.${id}&select=*`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return data[0] || null;
    }

    async function addCar(car) {
        const newCar = {
            brand: car.brand,
            model: car.model,
            year: car.year,
            condition: car.condition,
            color: car.color,
            category: car.category,
            price: car.price,
            notes: car.notes || null,
            licenseplate: car.licensePlate || null,
            clientid: car.clientId || null,
            createdat: new Date().toISOString()
        };

        const response = await fetch(`${BASE_URL}/cars`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(newCar)
        });

        const data = await handleResponse(response);
        return data[0];
    }

    async function updateCar(id, car) {
        const updatedCar = {
            brand: car.brand,
            model: car.model,
            year: car.year,
            condition: car.condition,
            color: car.color,
            category: car.category,
            price: car.price,
            notes: car.notes || null
        };

        const response = await fetch(`${BASE_URL}/cars?id=eq.${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(updatedCar)
        });

        const data = await handleResponse(response);
        return data[0];
    }

    async function deleteCar(id) {
        const response = await fetch(`${BASE_URL}/cars?id=eq.${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return handleResponse(response);
    }

    return {
        getClients,
        getClient,
        addClient,
        updateClient,
        deleteClient,
        getRequests,
        getRequest,
        addRequest,
        updateRequest,
        deleteRequest,
        getCars,
        getCar,
        addCar,
        updateCar,
        deleteCar
    };
})();

window.API = API;