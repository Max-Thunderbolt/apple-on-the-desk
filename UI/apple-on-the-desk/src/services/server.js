import axios from 'axios';

const apiBase =
    import.meta.env.DEV
        ? '/api/'
        : (import.meta.env.VITE_API_URL || 'https://apple-on-the-desk-api.onrender.com/api/');

const http = axios.create({
    baseURL: apiBase,
    headers: {
        'Content-Type': 'application/json',
    },
});

/** Set a function that returns the current Firebase ID token (for API auth). */
export function setAuthGetter(getToken) {
    _authGetter = getToken;
}
let _authGetter = null;

http.interceptors.request.use(async (config) => {
    if (_authGetter) {
        try {
            const token = await _authGetter();
            if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch (_) { }
    }
    return config;
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

    async createPointsCategory(data) {
        try {
            const response = await this.http.post('/points-categories', data);
            return response.data;
        } catch (error) {
            console.error('Error creating points category:', error);
            throw error;
        }
    }

    async updatePointsCategory(id, data) {
        try {
            const response = await this.http.put(`/points-categories/${encodeURIComponent(id)}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating points category:', error);
            throw error;
        }
    }

    async deletePointsCategory(id) {
        try {
            const response = await this.http.delete(`/points-categories/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting points category:', error);
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

    async createShopItem(data) {
        try {
            const response = await this.http.post('/shop-items', data);
            return response.data;
        } catch (error) {
            console.error('Error creating shop item:', error);
            throw error;
        }
    }

    async updateShopItem(id, data) {
        try {
            const response = await this.http.put(`/shop-items/${encodeURIComponent(id)}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating shop item:', error);
            throw error;
        }
    }

    async deleteShopItem(id) {
        try {
            const response = await this.http.delete(`/shop-items/${encodeURIComponent(id)}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting shop item:', error);
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

    async awardPoints(classId, categoryId, selectedStudentIds, isForGroup = false) {
        try {
            const response = await this.http.post(`/classes/${classId}/award-points`, {
                categoryId,
                selectedStudentIds,
                isForGroup: !!isForGroup
            });
            return response.data;
        } catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }

    async generateGroups(classId, numberOfGroups) {
        try {
            const response = await this.http.post(`/classes/${classId}/generate-groups`, { numberOfGroups });
            return response.data;
        } catch (error) {
            console.error('Error generating groups:', error);
            throw error;
        }
    }

    async getGroups(classId) {
        try {
            const response = await this.http.get(`/classes/${classId}/groups`);
            return response.data;
        } catch (error) {
            console.error('Error getting groups:', error);
            throw error;
        }
    }

    async clearGroups(classId) {
        try {
            const response = await this.http.put(`/classes/${classId}/clear-groups`);
            return response.data;
        } catch (error) {
            console.error('Error clearing groups:', error);
            throw error;
        }
    }

    async assignStudentToGroup(classId, studentId, groupName) {
        try {
            const response = await this.http.put(`/classes/${classId}/students/${studentId}/group`, { group: groupName });
            return response.data;
        } catch (error) {
            console.error('Error assigning student to group:', error);
            throw error;
        }
    }

    async updateStudentConstraints(classId, studentId, cannotPairWith) {
        try {
            const response = await this.http.put(`/classes/${classId}/students/${studentId}/constraints`, { cannotPairWith });
            return response.data;
        } catch (error) {
            console.error('Error updating student constraints:', error);
            throw error;
        }
    }

    async deleteAccount() {
        try {
            const response = await this.http.delete('/account');
            return response.data;
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error;
        }
    }
}

const serverInstance = new Server();
export default serverInstance;
