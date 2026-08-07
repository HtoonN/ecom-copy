
import localClient from "./localClient";

/**
 * DEPA Dashboard Snapshot API
 *
 * Route:
 * GET /md-console/depa-dashboard
 *
 * Query params:
 * - time_start: "YYYY-MM-DD HH:mm:ss" (optional)
 * - time_end: "YYYY-MM-DD HH:mm:ss" (optional)
 *
 * Expected response shape (example):
 * {
 *   "data": {
 *     "booking_count": 1200,
 *     "total_gmv": 3500000,
 *     "insurance_sale_count": 420,
 *     "unique_users": 390,
 *     "sp_free_count": 180,
 *     "sp_paid_count": 75
 *   }
 * }
 */
const prefix = "/md-console/depa-dashboard";

export default {
  async getSnapshot(payload) {
    const params = makeParams(payload);
    try {
      const res = await localClient({ requiresAuth: true }).get(prefix, {
        params,
      });
      return res.data;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};

function makeParams(obj) {
  const keys = ["time_start", "time_end"];
  return Object.fromEntries(
    keys.filter((key) => obj[key]).map((key) => [key, obj[key]])
  );
}
