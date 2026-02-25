import { unref } from 'vue';
import Server from '../services/server';

/**
 * Composable for points categories and awarding points, scoped to a class.
 * @param {import('vue').Ref<string> | string} classIdRef - Class ID (ref or string)
 */
export function usePoints(classIdRef) {
    async function getPointsCategories() {
        const response = await Server.getAllPointsCategories();
        return response.pointsCategories ?? [];
    }

    async function awardPoints(categoryId, selectedStudents, allStudents, isForGroup = false) {
        const id = unref(classIdRef);
        const selectedStudentIds = selectedStudents.map((s) => s.id);
        const response = await Server.awardPoints(id, categoryId, selectedStudentIds, isForGroup);
        return response.students;
    }

    async function createPointsCategory(name, value) {
        const response = await Server.createPointsCategory({ name, value });
        return response.pointsCategory;
    }

    async function updatePointsCategory(id, name, value) {
        const response = await Server.updatePointsCategory(id, { name, value });
        return response.pointsCategory;
    }

    async function deletePointsCategory(categoryId) {
        await Server.deletePointsCategory(categoryId);
    }

    return {
        getPointsCategories,
        awardPoints,
        createPointsCategory,
        updatePointsCategory,
        deletePointsCategory,
    };
}
