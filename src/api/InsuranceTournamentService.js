import httpClient from "./httpClient";

const prefix = "/md-console/insurance-tournament";

export default {
    /**
     * Get available tournaments (deleted=0 and is_active=1)
     */
    async getTournaments() {
        const res = await httpClient({ requiresAuth: true }).get(
            `${prefix}/tournaments`
        );
        return res.data;
    },

    /**
     * Get available insurance codes (not yet mapped)
     */
    async getAvailableInsuranceCodes() {
        const res = await httpClient({ requiresAuth: true }).get(
            `${prefix}/available-codes`
        );
        return res.data;
    },

    /**
     * Get all mapped tournaments with insurance codes
     */
    async getMappedTournaments() {
        const res = await httpClient({ requiresAuth: true }).get(
            `${prefix}/mappings`
        );
        return res.data;
    },

    /**
     * Create mapping between tournament and insurance codes
     * @param {number} tournament_id - Tournament ID
     * @param {number[]} insurance_code_ids - Array of insurance code IDs
     */
    async createMapping({ tournament_id, insurance_code_ids }) {
        const res = await httpClient({ requiresAuth: true }).post(
            `${prefix}/mapping`,
            { tournament_id, insurance_code_ids }
        );
        return res.data;
    },

    /**
     * Delete a mapping
     * @param {number} id - Mapping ID
     */
    async deleteMapping(id) {
        const res = await httpClient({ requiresAuth: true }).delete(
            `${prefix}/mapping/${id}`
        );
        return res.data;
    },

    /**
     * Cleanup expired mappings - remove mappings for expired tournaments
     * where insurance code hasn't been activated
     */
    async cleanupExpiredMappings() {
        const res = await httpClient({ requiresAuth: true }).post(
            `${prefix}/cleanup-expired`
        );
        return res.data;
    },

    /**
     * Import insurance codes from Excel/CSV file
     * @param {File} file - Excel or CSV file
     */
    async importInsuranceCodes(file) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await httpClient({ requiresAuth: true }).post(
            `${prefix}/import-codes`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return res.data;
    },

    /**
     * Get insurance codes list (category = 'tournament' and deleted = 0)
     */
    async getInsuranceCodes() {
        const res = await httpClient({ requiresAuth: true }).get(
            `${prefix}/insurance-codes`
        );
        return res.data;
    },

    /**
     * Delete insurance code (soft delete)
     * @param {number} id - Insurance code ID
     */
    async deleteInsuranceCode(id) {
        const res = await httpClient({ requiresAuth: true }).delete(
            `${prefix}/insurance-code/${id}`
        );
        return res.data;
    },

    /**
     * Send insurance code email to user via backend
     * @param {string} email - Email address
     * @param {string} insurance_code - Insurance code
     * @param {string} tournament_name - Tournament name
     */
    async insuranceEmailTournament(email, insurance_code, tournament_name) {
        const res = await httpClient({ requiresAuth: true }).post(
            `${prefix}/send-insurance-email`,
            { email, insurance_code, tournament_name }
        );
        return res.data;
    }
};
