import Server from '../services/server';

export default class PointsController {

    constructor(classId) {
        this.classId = classId;
    }

    async getPointsCategories() {
        const response = await Server.getAllPointsCategories();
        return response.pointsCategories ?? [];
    }

    async awardPoints(categoryId, selectedStudents, allStudents) {
        // Extract student IDs from the selected students
        const selectedStudentIds = selectedStudents.map(s => s.id);
        
        // Call the backend endpoint which handles all the logic
        const response = await Server.awardPoints(this.classId, categoryId, selectedStudentIds);
        
        return response.students;
    }

    async createPointsCategory(name, value) {
        const response = await Server.createPointsCategory(this.classId, { name, value });
        return response.pointsCategory;
    }

    async deletePointsCategory(categoryId) {
        const response = await Server.deletePointsCategory(this.classId, categoryId);
        return response.pointsCategory;
    }
}