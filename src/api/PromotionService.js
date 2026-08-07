import httpClient from "./httpClient";

const prefix = "/md-console/promotions";
export default {
    async createPromotion(data) {
        try {
            const res = await httpClient({ requiresAuth: true }).post(
                prefix,
                data
            );
            return { data: res.data, error: false };
        } catch (e) {
            console.log(e);
            return {
                message: e.response.data.errors.map((error) => error.message).join('\n'),
                error: true,
            };
        }
    },
    async updatePromotion(id, data) {
        try {
            const res = await httpClient({ requiresAuth: true }).put(
                prefix + `/${id}`,
                data
            );
            return { data: res.data, error: false };
        } catch (e) {
            console.log(e);
            return {
                message: e.response.data.errors.map((error) => error.message).join('\n'),
                error: true,
            };
        }
    },
    async getPromotions(payload) {
        const params = makeParams(payload);
        try {
            const res = await httpClient({ requiresAuth: true }).get(
                prefix,
                {
                    params,
                }
            );
            return res.data;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    async downloadPromotions(payload) {
        const params = makeParams(payload);
        try {
            await httpClient({ requiresAuth: true }).get(prefix, {
                params,
                responseType: 'blob',
            })
                .then((response) => {
                    const blob = new Blob([response.data], {
                        type: response.headers['content-type'],
                    });

                    // Extract filename from content-disposition
                    const disposition = response.headers['content-disposition'];
                    let filename = 'Promotion export.xlsx';

                    if (disposition) {
                        const match = disposition.match(/filename="(.+)"/);
                        if (match && match[1]) {
                            filename = match[1];
                        }
                    }

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    window.URL.revokeObjectURL(url);
                })
                .catch((error) => {
                    console.error('Error downloading file:', error);
                });
        } catch (e) {
            console.log(e);
        }
    },
    async deletePromotion(id) {
        try {
            const res = await httpClient({ requiresAuth: true }).delete(
                prefix + `/${id}`,
            );
            return res.data;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
}

function makeParams(obj) {
    const keys = ['provider_id', 'is_xlsx', 'page', 'name', 'is_expired'];
    return Object.fromEntries(
        keys
            .filter((key) => obj[key])
            .map((key) => [key, obj[key]])
    );
}
