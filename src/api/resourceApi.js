import httpClient from './httpClient';

const prefix = '/core'
export default resourcesApi

function resourcesApi(resource) {
    return {
        async index(query) {
            const response = await httpClient({ requiresAuth: true }).get(`${prefix}/${resource}${queryBuilder(query)}`);
            return response.data;
        },
        async show (id) {
            const response = await httpClient({ requiresAuth: true }).get(`${prefix}/${resource}/${id}`);
            return response.data;
        },
        async store (payload) {
            const response = await httpClient({ requiresAuth: true }).post(`${prefix}/${resource}`, payload);
            return response.data;
        },
        async update (id, payload) {
            const response = await httpClient({ requiresAuth: true }).put(`${prefix}/${resource}/${id}`, payload);
            return response.data;
        },
        async delete (id) {
            const response = await httpClient({ requiresAuth: true }).delete(`${prefix}/${resource}/${id}`);
            return response.data;
        }
    }
}

function queryBuilder (query) {
    if (!query) return ''
    var queryString = Object.keys(query).map(key => query[key] ? `${key}=${query[key]}&` : '').join('').slice(0, -1)
    return queryString ? `?${queryString}` : ''
}