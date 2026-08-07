import httpClient from './httpClient';
const prefix = '/book-scope'


export default {
    async getCourtTypes(provider_id) {
        const path = '/court-types'
        const response = await httpClient({ requiresAuth: true }).get(`${prefix}${path}/${provider_id}`)

        return response.data
    },

    async createBookScope(data){
        const path = '/create'
        const response = await httpClient({ requiresAuth: true }).post(`${prefix}${path}`, data)

        return response.data
    },

    async getProvidersBookScopes() {
        const path = '/providers/book-scopes'
        const response = await httpClient({ requiresAuth: true }).get(`${prefix}${path}`)

        return response.data
    },

    async getProviderBookScopes(id) {
        const path = `/providers/${id}/book-scopes`
        const response = await httpClient({ requiresAuth: true }).get(`${prefix}${path}`)

        return response.data
    },

    async settingProviderBookScope(id, data) {
        const path = `/providers/${id}/settings`
        const response = await httpClient({ requiresAuth: true }).put(`${prefix}${path}`, data)

        return response.data
    },


    async deleteBookScope(id) {
        const path = `/book-scopes/${id}'`
        const response = await httpClient({ requiresAuth: true }).delete(`${prefix}${path}`)

        return response.data
    },

    async deleteBookScopeTemplate(id) {
        const path = `/book-scope-templates/${id}'`
        const response = await httpClient({ requiresAuth: true }).delete(`${prefix}${path}`)

        return response.data
    },

    
}