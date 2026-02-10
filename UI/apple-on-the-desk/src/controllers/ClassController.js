import Server from '../services/server';

export default class ClassController {
    constructor(classId) {
        this.classId = classId;
    }

    async getClasses() {
        try {
            const response = await Server.getClasses();
            return response.classes ?? [];
        } catch (error) {
            console.error('Error getting classes:', error);
            throw error;
        }
    }

    async getClassNames() {
        try {
            const response = await Server.getClassNames();
            return response.classes ?? [];
        } catch (error) {
            console.error('Error getting class names:', error);
            throw error;
        }
    }

    async getClassById(id) {
        try {
            const response = await Server.getClassById(id);
            return response.class;
        } catch (error) {
            console.error('Error getting class by id:', error);
            throw error;
        }
    }

    async createClass(data) {
        try {
            const response = await Server.createClass(data);
            return response.class ?? response;
        } catch (error) {
            console.error('Error creating class:', error);
            throw error;
        }
    }

    async updateClass(id, data) {
        try {
            const response = await Server.updateClass(id, data);
            return response;
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    }

    async deleteClass(id) {
        try {
            const response = await Server.deleteClass(id);
            return response;
        } catch (error) {
            console.error('Error deleting class:', error);
            throw error;
        }
    }
}