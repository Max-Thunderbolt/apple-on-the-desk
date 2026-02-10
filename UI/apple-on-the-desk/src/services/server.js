import axios from 'axios';

const http = axios.create({
    baseURL: 'http://localhost:3001/api/', //'http://13.246.227.85/api/', //'https://apple-on-the-desk-api.onrender.com/api/', //localhost:3001/api/
    headers: {
        'Content-Type': 'application/json',
    },
});

class Server {
    constructor() {
        this.http = http;
    }
    async getClasses() {
        try {
            const response = await this.http.get('/classes');
            return response.data;
        } catch (error) {
            console.error('Error getting classes:', error);
            throw error;
        }
    }

    async getClassNames() {
        try {
            const response = await this.http.get('/classes/names');
            return response.data;
        } catch (error) {
            console.error('Error getting class names:', error);
            throw error;
        }
    }

    async getClassById(id) {
        try {
            const response = await this.http.get(`/classes/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error getting class by id:', error);
            throw error;
        }
    }

    async createClass(data) {
        try {
            const response = await this.http.post('/classes', data);
            return response.data;
        } catch (error) {
            console.error('Error creating class:', error);
            throw error;
        }
    }

    async updateClass(id, data) {
        try {
            const response = await this.http.put(`/classes/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    }

    async deleteClass(id) {
        try {
            const response = await this.http.delete(`/classes/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting class:', error);
            throw error;
        }
    }

    async getAllPointsCategories() {
        try {
            const response = await this.http.get('/points-categories');
            return response.data;
        } catch (error) {
            console.error('Error getting all points categories:', error);
            throw error;
        }
    }

    async getShopItems() {
        try {
            const response = await this.http.get('/shop-items');
            return response.data;
        } catch (error) {
            console.error('Error getting shop items:', error);
            throw error;
        }
    }

    async updateStudentPoints(classId, data) {
        try {
            const response = await this.http.put(`/classes/${classId}/students`, data);
            console.log('response', response);
            return response.data;
        } catch (error) {
            console.error('Error updating student points:', error);
            throw error;
        }
    }

    async awardPoints(classId, categoryId, selectedStudentIds) {
        try {
            const response = await this.http.post(`/classes/${classId}/award-points`, {
                categoryId,
                selectedStudentIds
            });
            return response.data;
        } catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }
}

const serverInstance = new Server();
export default serverInstance;