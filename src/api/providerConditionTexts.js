import httpClient from "./httpClient";

const prefix = "/md-console";

export default {
    async getProviderConditions(params = {}) {
        try {
            const res = await httpClient({ requiresAuth: true }).get(
                `${prefix}/provider-condition`,
                { params }
            );
            return res.data;
        } catch (e) {
            console.error(e);
            return { error: true, message: e.response?.data?.message || 'เกิดข้อผิดพลาด' };
        }
    },

    async createProviderCondition(data) {
        try {
            const res = await httpClient({ requiresAuth: true }).post(
                `${prefix}/provider-condition`,
                data
            );
            return res.data;
        } catch (e) {
            console.error(e);
            return { error: true, message: e.response?.data?.message || 'เกิดข้อผิดพลาด' };
        }
    },

    async updateProviderCondition(id, data) {
        try {
            const res = await httpClient({ requiresAuth: true }).put(
                `${prefix}/provider-condition/${id}`,
                data
            );
            return res.data;
        } catch (e) {
            console.error(e);
            return { error: true, message: e.response?.data?.message || 'เกิดข้อผิดพลาด' };
        }
    },

    async deleteProviderCondition(id) {
        try {
            const res = await httpClient({ requiresAuth: true }).delete(
                `${prefix}/provider-condition/${id}`
            );
            return res.data;
        } catch (e) {
            console.error(e);
            return { error: true, message: e.response?.data?.message || 'เกิดข้อผิดพลาด' };
        }
    },
};
