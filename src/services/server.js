import axios from 'axios'

const apiBase
    = import.meta.env.DEV
        ? '/api/'
        : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/')

const http = axios.create({
    baseURL: apiBase,
    headers: {
        'Content-Type': 'application/json',
    },
})

console.log('apiBase', apiBase)

/** Set a function that returns the current Firebase ID token (for API auth). */
export function setAuthGetter(getToken) {
    _authGetter = getToken
}
let _authGetter = null

http.interceptors.request.use(async config => {
    if (_authGetter) {
        try {
            const token = await _authGetter()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        } catch { /* empty */ }
    }
    return config
})

class Server {
    constructor() {
        this.http = http
    }

    async getClasses() {
        try {
            const response = await this.http.get('/classes')
            return response.data
        } catch (error) {
            console.error('Error getting classes:', error)
            throw error
        }
    }

    async getClassNames() {
        try {
            const response = await this.http.get('/classes/names')
            return response.data
        } catch (error) {
            console.error('Error getting class names:', error)
            throw error
        }
    }

    async getClassById(id) {
        try {
            const response = await this.http.get(`/classes/${id}`)
            return response.data
        } catch (error) {
            console.error('Error getting class by id:', error)
            throw error
        }
    }

    async createClass(data) {
        try {
            const response = await this.http.post('/classes', data)
            return response.data
        } catch (error) {
            console.error('Error creating class:', error)
            throw error
        }
    }

    async updateClass(id, data) {
        try {
            const response = await this.http.put(`/classes/${id}`, data)
            return response.data
        } catch (error) {
            console.error('Error updating class:', error)
            throw error
        }
    }

    async deleteClass(id) {
        try {
            const response = await this.http.delete(`/classes/${id}`)
            return response.data
        } catch (error) {
            console.error('Error deleting class:', error)
            throw error
        }
    }

    async getAllPointsCategories() {
        try {
            const response = await this.http.get('/points-categories')
            return response.data
        } catch (error) {
            console.error('Error getting all points categories:', error)
            throw error
        }
    }

    async createPointsCategory(data) {
        try {
            const response = await this.http.post('/points-categories', data)
            return response.data
        } catch (error) {
            console.error('Error creating points category:', error)
            throw error
        }
    }

    async updatePointsCategory(id, data) {
        try {
            const response = await this.http.put(`/points-categories/${encodeURIComponent(id)}`, data)
            return response.data
        } catch (error) {
            console.error('Error updating points category:', error)
            throw error
        }
    }

    async deletePointsCategory(id) {
        try {
            const response = await this.http.delete(`/points-categories/${encodeURIComponent(id)}`)
            return response.data
        } catch (error) {
            console.error('Error deleting points category:', error)
            throw error
        }
    }

    async getShopItems(classId) {
        try {
            const params = classId ? { classId } : {}
            const response = await this.http.get('/shop-items', { params })
            return response.data
        } catch (error) {
            console.error('Error getting shop items:', error)
            throw error
        }
    }

    async createShopItem(data) {
        try {
            const response = await this.http.post('/shop-items', data)
            return response.data
        } catch (error) {
            console.error('Error creating shop item:', error)
            throw error
        }
    }

    async updateShopItem(id, data) {
        try {
            const response = await this.http.put(`/shop-items/${encodeURIComponent(id)}`, data)
            return response.data
        } catch (error) {
            console.error('Error updating shop item:', error)
            throw error
        }
    }

    async deleteShopItem(id) {
        try {
            const response = await this.http.delete(`/shop-items/${encodeURIComponent(id)}`)
            return response.data
        } catch (error) {
            console.error('Error deleting shop item:', error)
            throw error
        }
    }

    async purchaseItems(classId, studentIds, shopItemIds) {
        try {
            const response = await this.http.post(`/classes/${classId}/purchase`, {
                studentIds,
                shopItemIds,
            })
            return response.data
        } catch (error) {
            console.error('Error purchasing items:', error)
            throw error
        }
    }

    async getPurchaseHistory(classId) {
        try {
            const response = await this.http.get(`/classes/${classId}/purchase-history`)
            return response.data
        } catch (error) {
            console.error('Error fetching purchase history:', error)
            throw error
        }
    }

    async awardPoints(classId, categoryId, selectedStudentIds, isForGroup = false) {
        try {
            const response = await this.http.post(`/classes/${classId}/award-points`, {
                categoryId,
                selectedStudentIds,
                isForGroup: !!isForGroup,
            })
            return response.data
        } catch (error) {
            console.error('Error awarding points:', error)
            throw error
        }
    }

    async generateGroups(classId, numberOfGroups) {
        try {
            const response = await this.http.post(`/classes/${classId}/generate-groups`, { numberOfGroups })
            return response.data
        } catch (error) {
            console.error('Error generating groups:', error)
            throw error
        }
    }

    async getGroups(classId) {
        try {
            const response = await this.http.get(`/classes/${classId}/groups`)
            return response.data
        } catch (error) {
            console.error('Error getting groups:', error)
            throw error
        }
    }

    async clearGroups(classId) {
        try {
            const response = await this.http.put(`/classes/${classId}/clear-groups`)
            return response.data
        } catch (error) {
            console.error('Error clearing groups:', error)
            throw error
        }
    }

    async assignStudentToGroup(classId, studentId, groupName) {
        try {
            const response = await this.http.put(`/classes/${classId}/students/${studentId}/group`, { group: groupName })
            return response.data
        } catch (error) {
            console.error('Error assigning student to group:', error)
            throw error
        }
    }

    async updateStudentConstraints(classId, studentId, cannotPairWith) {
        try {
            const response = await this.http.put(`/classes/${classId}/students/${studentId}/constraints`, { cannotPairWith })
            return response.data
        } catch (error) {
            console.error('Error updating student constraints:', error)
            throw error
        }
    }

    async deleteAccount() {
        try {
            const response = await this.http.delete('/account')
            return response.data
        } catch (error) {
            console.error('Error deleting account:', error)
            throw error
        }
    }

    async upsertUser() {
        try {
            const response = await this.http.post('/user')
            return response.data
        } catch (error) {
            console.error('Error upserting user:', error)
            throw error
        }
    }

    async getUser() {
        try {
            const response = await this.http.get('/user')
            return response.data
        } catch (error) {
            console.error('Error getting user:', error)
            throw error
        }
    }

    async getAdminOverview(params = {}) {
        try {
            const response = await this.http.get('/admin/overview', { params })
            return response.data
        } catch (error) {
            console.error('Error loading admin overview:', error)
            throw error
        }
    }

    async createAdminSchool(data) {
        try {
            const response = await this.http.post('/admin/schools', data)
            return response.data
        } catch (error) {
            console.error('Error creating school:', error)
            throw error
        }
    }

    async listAdminSchools() {
        try {
            const response = await this.http.get('/admin/schools')
            return response.data
        } catch (error) {
            console.error('Error listing schools:', error)
            throw error
        }
    }

    async addAdminSchoolMember(schoolId, body) {
        try {
            const response = await this.http.post(
                `/admin/schools/${encodeURIComponent(schoolId)}/members`,
                body
            )
            return response.data
        } catch (error) {
            console.error('Error adding school member:', error)
            throw error
        }
    }

    async searchAdminUsers(q) {
        try {
            const response = await this.http.get('/admin/users/search', { params: { q } })
            return response.data
        } catch (error) {
            console.error('Error searching users:', error)
            throw error
        }
    }

    async createAdminSchoolJoinCode(schoolId, role) {
        try {
            const response = await this.http.post(
                `/admin/schools/${encodeURIComponent(schoolId)}/join-codes`,
                { role }
            )
            console.log('response', response.data);
            return response.data
        } catch (error) {
            console.error('Error creating school join code:', error)
            throw error
        }
    }

    async getAdminSchoolMembers(schoolId) {
        try {
            const response = await this.http.get(`/admin/schools/${encodeURIComponent(schoolId)}/members`)
            return response.data
        } catch (error) {
            console.error('Error loading school members:', error)
            throw error
        }
    }

    async createSchoolJoinCode(schoolId, role) {
        try {
            const response = await this.http.post(
                `/schools/${encodeURIComponent(schoolId)}/join-codes`,
                { role }
            )
            console.log('response', response.data);
            return response.data
        } catch (error) {
            console.error('Error creating school join code:', error)
            throw error
        }
    }

    async addSchoolMember(schoolId, body) {
        try {
            const response = await this.http.post(`/schools/${encodeURIComponent(schoolId)}/members`, body)
            return response.data
        } catch (error) {
            console.error('Error adding school member:', error)
            throw error
        }
    }

    async searchSchoolUsers(schoolId, q) {
        try {
            const response = await this.http.get(
                `/schools/${encodeURIComponent(schoolId)}/users/search`,
                { params: { q } }
            )
            return response.data
        } catch (error) {
            console.error('Error searching school users:', error)
            throw error
        }
    }

    async getSchoolDashboard(schoolId, params = {}) {
        try {
            const response = await this.http.get(
                `/schools/${encodeURIComponent(schoolId)}/dashboard`,
                { params }
            )
            return response.data
        } catch (error) {
            console.error('Error loading school dashboard:', error)
            throw error
        }
    }

    async getSchoolTeachers(schoolId) {
        try {
            const response = await this.http.get(`/schools/${encodeURIComponent(schoolId)}/teachers`)
            return response.data
        } catch (error) {
            console.error('Error loading teachers:', error)
            throw error
        }
    }

    async removeSchoolTeacher(schoolId, teacherUserId) {
        try {
            const response = await this.http.delete(
                `/schools/${encodeURIComponent(schoolId)}/teachers/${encodeURIComponent(teacherUserId)}`
            )
            return response.data
        } catch (error) {
            console.error('Error removing school teacher:', error)
            throw error
        }
    }

    async joinSchoolByCode(code) {
        try {
            const response = await this.http.post(`/schools/join/${encodeURIComponent(code)}`)
            return response.data
        } catch (error) {
            console.error('Error joining school with code:', error)
            throw error
        }
    }

    async getTutorialStructure() {
        try {
            const response = await this.http.get('/tutorial-structure')
            return response.data
        } catch (error) {
            console.error('Error getting tutorial structure:', error)
            throw error
        }
    }

    async getOnboardingProgress() {
        try {
            const response = await this.http.get('/onboarding-progress')
            return response.data
        } catch (error) {
            console.error('Error getting onboarding progress:', error)
            throw error
        }
    }

    async upsertOnboardingProgress(data) {
        try {
            const response = await this.http.post('/onboarding-progress', data)
            return response.data
        } catch (error) {
            console.error('Error updating onboarding progress:', error)
            throw error
        }
    }
}

const serverInstance = new Server()
export default serverInstance
