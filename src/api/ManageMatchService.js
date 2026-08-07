import httpClient from "./httpClient";

const prefix = "/md-console";

export default {
    /**
     * Get match detail by ID
     * @param {number} matchId - Match ID to fetch
     * @returns {Promise<Object>} Match data
     */
    async getMatchDetail(matchId) {
        try {
            const res = await httpClient({ requiresAuth: true }).get(
                `${prefix}/match/${matchId}`
            );
            return res.data ? res.data : false;
        } catch (error) {
            console.error("getMatchDetail error:", error);
            return { error: error.response?.data?.error || error.message };
        }
    },

    /**
     * Get match activity logs
     * @param {number} matchId - Match ID
     * @param {number} limit - Max number of logs to return (default: 20)
     * @returns {Promise<Array>} Array of log entries
     */
    async getMatchLogs(matchId, provider_id, limit = 20) {
        try {
            const res = await httpClient({ requiresAuth: true }).get(
                `${prefix}/match/${matchId}/${provider_id}/logs`,
                { params: { limit } }
            );
            return res.data ? res.data : [];
        } catch (error) {
            console.error("getMatchLogs error:", error);
            return [];
        }
    },

    /**
     * Update match data
     * @param {number} matchId - Match ID to update
     * @param {number} providerId - Provider ID
     * @param {Object} data - Fields to update (time_start, time_end, name, tel, remark)
     * @returns {Promise<Object>} Updated match data or error
     */
    async updateMatch(matchId, providerId, data) {
        try {
            const res = await httpClient({ requiresAuth: true }).put(
                `${prefix}/match/${matchId}/${providerId}`,
                data
            );
            return res.data ? res.data : false;
        } catch (error) {
            console.error("updateMatch error:", error);
            return { error: error.response?.data?.error || error.message };
        }
    },

    /**
     * Check if court is available for the given time range
     * @param {number} courtId - Court ID
     * @param {string} timeStart - Start time (datetime string)
     * @param {string} timeEnd - End time (datetime string)
     * @param {number|null} excludeMatchId - Match ID to exclude (for editing)
     * @returns {Promise<Object>} { available: boolean, overlapping_matches: Array }
     */
    async checkCourtAvailability(courtId, timeStart, timeEnd, excludeMatchId = null) {
        try {
            const res = await httpClient({ requiresAuth: true }).post(
                `${prefix}/check-court-availability`,
                {
                    court_id: courtId,
                    time_start: timeStart,
                    time_end: timeEnd,
                    exclude_match_id: excludeMatchId,
                }
            );
            return res.data ? res.data : { available: false, overlapping_matches: [] };
        } catch (error) {
            console.error("checkCourtAvailability error:", error);
            return { available: false, error: error.message };
        }
    },

    /**
     * Move all matches in a stack to new times
     * @param {number} stackId - Stack ID
     * @param {number} providerId - Provider ID
     * @param {Object} data - { time_start: "HH:mm", time_end: "HH:mm" }
     * @returns {Promise<Object>} Result
     */
    async moveStack(stackId, providerId, data) {
        try {
            const res = await httpClient({ requiresAuth: true }).put(
                `${prefix}/move-stack/${stackId}/${providerId}`,
                data
            );
            return res.data ? res.data : false;
        } catch (error) {
            console.error("moveStack error:", error);
            return { error: error.response?.data?.error || error.message, conflicts: error.response?.data?.conflicts };
        }
    },
};
