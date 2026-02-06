import axios from 'axios';

const http = axios.create({
    baseURL: 'http://13.246.227.85/api/', //'https://apple-on-the-desk-api.onrender.com/api/', //localhost:3001/api/
    headers: {
        'Content-Type': 'application/json',
    },
});

async function getClasses() {
    try {
        const response = await http.get('/classes');
        return response.data;
    } catch (error) {
        console.error('Error getting classes:', error);
        throw error;
    }
}

async function getClassNames() {
    try {
        const response = await http.get('/classes/names');
        return response.data;
    } catch (error) {
        console.error('Error getting class names:', error);
        throw error;
    }
}

async function getClassById(id) {
    try {
        const response = await http.get(`/classes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error getting class by id:', error);
        throw error;
    }
}

async function createClass(data) {
    try {
        const response = await http.post('/classes', data);
        return response.data;
    } catch (error) {
        console.error('Error creating class:', error);
        throw error;
    }
}

async function updateClass(id, data) {
    try {
        const response = await http.put(`/classes/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating class:', error);
        throw error;
    }
}

async function deleteClass(id) {
    try {
        const response = await http.delete(`/classes/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting class:', error);
        throw error;
    }
}

async function getAllPointsCategories() {
    try {
        const response = await http.get('/points-categories');
        return response.data;
    } catch (error) {
        console.error('Error getting all points categories:', error);
        throw error;
    }
}

async function getShopItems() {
    try {
        const response = await http.get('/shop-items');
        return response.data;
    } catch (error) {
        console.error('Error getting shop items:', error);
        throw error;
    }
}

export {
    getClasses,
    getClassNames,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    getAllPointsCategories,
    getShopItems
};