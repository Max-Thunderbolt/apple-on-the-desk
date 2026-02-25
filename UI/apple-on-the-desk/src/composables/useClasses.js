import { ref } from 'vue';
import Server from '../services/server';

/**
 * Composable for class list and CRUD. Use in components that need to load,
 * create, update, or delete classes.
 */
export function useClasses() {
    const classes = ref([]);

    async function getClasses() {
        try {
            const response = await Server.getClasses();
            return response.classes ?? [];
        } catch (error) {
            console.error('Error getting classes:', error);
            throw error;
        }
    }

    async function getClassNames() {
        try {
            const response = await Server.getClassNames();
            return response.classes ?? [];
        } catch (error) {
            console.error('Error getting class names:', error);
            throw error;
        }
    }

    async function getClassById(id) {
        try {
            const response = await Server.getClassById(id);
            return response.class;
        } catch (error) {
            console.error('Error getting class by id:', error);
            throw error;
        }
    }

    async function createClass(data) {
        try {
            const response = await Server.createClass(data);
            return response.class ?? response;
        } catch (error) {
            console.error('Error creating class:', error);
            throw error;
        }
    }

    async function updateClass(id, data) {
        try {
            const response = await Server.updateClass(id, data);
            return response;
        } catch (error) {
            console.error('Error updating class:', error);
            throw error;
        }
    }

    async function deleteClass(id) {
        try {
            const response = await Server.deleteClass(id);
            return response;
        } catch (error) {
            console.error('Error deleting class:', error);
            throw error;
        }
    }

    async function loadClasses() {
        classes.value = await getClassNames();
    }

    return {
        classes,
        loadClasses,
        getClasses,
        getClassNames,
        getClassById,
        createClass,
        updateClass,
        deleteClass,
    };
}
