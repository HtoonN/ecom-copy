import httpClient from "./httpClient";
import billAgentClient from "./billAgentClient";

let providers = [];

const prefix = "/md-console";
export default {
  async createEvent(data) {
    const res = await httpClient({ requiresAuth: true }).post(
      prefix + `/event`,
      data
    );

    return res.data;
  },

  async getProviders() {
    if (providers.length) {
      console.log('Already fetch providers');
      return providers;
    } else {
      const res = await httpClient({ requiresAuth: true }).get(
        prefix + `/providers`, {
        params: {
          with: 'tax_data,provider_sports,court_types.courts',
        }
      }
      );

      providers = res.data;

      return res.data;
    }

  },
  async getEvents(body) {
    const res = await httpClient({ requiresAuth: true }).post(
      prefix + `/events`,
      body
    );

    return res.data;
  },
  async deleteEvent(id) {
    const res = await httpClient({ requiresAuth: true }).delete(
      prefix + `/event/${id}`
    );

    return res.data;
  },
  async getProviderFreeCourts(body) {
    const res = await httpClient({ requiresAuth: true }).post(
      prefix + `/providers/free-courts`,
      body
    );

    return res.data;
  },
  async getProvinces() {
    const res = await httpClient({ requiresAuth: true }).get(
      prefix + `/provinces`
    );

    return res.data;
  },
  async getDistricts(provinceId) {
    const res = await httpClient({ requiresAuth: true }).get(
      prefix + `/districts/${provinceId}`
    );

    return res.data;
  },
  async getSubDistricts(districtId) {
    const res = await httpClient({ requiresAuth: true }).get(
      prefix + `/sub_districts/${districtId}`
    );

    return res.data;
  },
  async getSports() {
    const res = await httpClient({ requiresAuth: true }).get(
      prefix + `/sports`
    );

    return res.data;
  },
  async getBanks() {
    const res = await httpClient({ requiresAuth: true }).get(
      prefix + `/banks`
    );

    return res.data;
  },
  async createPromoNotification(data) {
    const res = await httpClient({ requiresAuth: true }).post(prefix + `/promo`, data)
    return res.data;
  },
  async getPromoNotifications(promo_type_id) {
    const res = await httpClient({ requiresAuth: true }).get(prefix + `/promos?promo_type_id[]=${promo_type_id}`)

    return res.data;
  },
  async getPromoNotificationHistory(page) {
    const res = await httpClient({ requiresAuth: true }).get(prefix + `/promo-histories?page=${page}`)

    return res.data;
  },

  async getMatch(startTime, endTime, providerId) {
    const res = await httpClient({ requiresAuth: true }).get(
      `${prefix}/accounts/matches?time_start=${encodeURIComponent(
        startTime
      )}&time_end=${encodeURIComponent(endTime)}&provider_id=${providerId}`
    );
    return res.data;
  },
  async getMatchV2(startTime, endTime, providerId) {
    const res = await httpClient({ requiresAuth: true }).get(
      `${prefix}/accounts/matches-v2?time_start=${encodeURIComponent(
        startTime
      )}&time_end=${encodeURIComponent(endTime)}&provider_id=${providerId}`
    );
    return res.data;
  },
  async getAccountWeeks(date) {
    const res = await httpClient({ requiresAuth: true }).get(`${prefix}/accounts/weeks?date=${encodeURIComponent(date)}`)
    return res.data
  },
  async getProviderByToken(token) {
    const res = await httpClientConsole({ token, arena_api: true }).get(
      `/arena/profile`
    );

    return res.data;
  },
  async importMatches(data) {
    const res = await httpClientConsole({ requiresAuth: false }).post(
      `/import-matches`,
      data
    );
    return res.data;
  },

  async getAccountWeeks(date) {
    const res = await httpClient({ requiresAuth: true }).get(
      `${prefix}/accounts/weeks?date=${encodeURIComponent(date)}`
    );
    return res.data;
  },
  async getPackages() {
    try {
      const res = await httpClient({ requiresAuth: true }).get(
        `${prefix}/packages`
      );

      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async login({ username, password }) {
    try {
      const res = await httpClient({ requiresAuth: false }).post(
        `${prefix}/login`,
        { username, password }
      );

      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async getProviderPackage({ page = 1, search, package_id, end_date }) {
    try {
      const res = await httpClient({ requiresAuth: true }).get(
        `${prefix}/providers`,
        {
          params: {
            with: "package",
            page: page,
            provider_name: search,
            package_id,
            end_date,
          },
        }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async updateProviderPackage({ provider_id, package_id, end_date }) {
    try {
      const res = await httpClient({ requiresAuth: true }).put(
        `${prefix}/provider-package/${provider_id}`,
        { package_id, end_date }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async updateProviderSetting({ provider_id, data }) {
    try {
      const res = await httpClient({ requiresAuth: true }).put(
        `${prefix}/provider-setting/${provider_id}`,
        { ...data }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async updateCourtType(id, { name, name_en }) {
    try {
      const res = await httpClient({ requiresAuth: true }).put(
        `${prefix}/court-type/${id}`,
        { name, name_en }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async saveProviderCommission(payload) {
    try {
      const res = await httpClient({ requiresAuth: true }).post(
        `${prefix}/provider-commission`,
        payload
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async getProviderSetting({ page = 1, search = "" }) {
    try {
      const res = await httpClient({ requiresAuth: true }).get(
        `${prefix}/providers`,
        {
          params: {
            with: "setting,tax_data,address,bank_account,subscription,provider_sports,court_types,commission",
            page,
            provider_name: search,
          },
        }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async getProviderLogin({ page = 1, search = "" }) {
    try {
      const res = await httpClient({ requiresAuth: true }).get(
        `${prefix}/providers`,
        {
          params: {
            page,
            provider_name: search,
          },
        }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async getProviderLiff({ page = 1, search = "" }) {
    try {
      const res = await httpClient({ requiresAuth: true }).get(
        `${prefix}/providers`,
        {
          params: {
            page,
            provider_name: search,
            with: "liff",
          },
        }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async updateProviderLiff(providerId, payload) {
    try {
      await httpClient({ requiresAuth: true }).post(`/md-console/liff/update-provider-liff/${providerId}`, payload);
      return {
        success: true,
      }

    } catch (e) {
      return {
        success: false,
        message: `${e.response.data[0].field} : ${e.response.data[0].message}`
      };
    }
  },
  async getLiffCredentials() {
    try {
      const res = await httpClient({ requiresAuth: true }).get('/md-console/liff/credentials');
      return res.data;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async createLiffApp(payload, headers) {
    try {
      const res = await httpClient({ requiresAuth: true }).post(
        '/md-console/liff/create-liff-app',
        payload,
        { headers }
      );
      return res.data;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async uploadProviderLogo(providerId, payload) {
    try {
      const res = await httpClient({ requiresAuth: true }).post(
        `/md-console/liff/upload-logo/${providerId}`,
        payload
      );
      return res.data;
    } catch (e) {
      console.log(e);
      return { success: false, message: e.message };
    }
  },
  async providerLogin(payload) {
    try {
      // https://arenamobile2.matchday-backend.com/login-pitch
      const res = await httpClient({ requiresAuth: false }).post(
        "/login-pitch",
        payload
      );
      return {
        success: true,
        data: res.data.token,
      };
    } catch (e) {
      return {
        success: false,
        message: `${e.response.data[0].field} : ${e.response.data[0].message}`,
      };
    }
  },

  async createBillSettlement(payload) {
    const client = billAgentClient({ requiresAuth: true });
    const res = await client.post("/matchday/payment", payload);
    return res.data;
  },

  async getBillSettlements({ providerId, month, usePaidAt = false }) {
    const client = billAgentClient({ requiresAuth: true });
    const res = await client.get(
      `/matchday/payment/settlement/${encodeURIComponent(
        providerId
      )}/${encodeURIComponent(month)}`,
      {
        params: usePaidAt ? { use_paid_at: 1 } : {},
      }
    );
    return res.data;
  },

  async updateBillSettlementPayment(billPaymentId, payload) {
    const client = billAgentClient({ requiresAuth: true });
    const res = await client.put(
      `/matchday/payment/${encodeURIComponent(billPaymentId)}`,
      payload
    );
    return res.data;
  },

  async addBillSettlementPayment(billId, payload) {
    const client = billAgentClient({ requiresAuth: true });
    const res = await client.post(
      `/matchday/payment/${encodeURIComponent(billId)}`,
      payload
    );
    return res.data;
  },
  async createCourt(courtTypeId, { name, name_en, price = 0, image = null }) {
    try {
      const res = await httpClient({ requiresAuth: true }).post(
        `${prefix}/providers/court/${courtTypeId}`,
        { name, name_en, price, image }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async updateCourt(id, { name, name_en, price = 0, image = null }) {
    try {
      const res = await httpClient({ requiresAuth: true }).put(
        `${prefix}/providers/court/${id}`,
        { name, name_en, price, image }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
  async deleteCourt(id, name) {
    try {
      const res = await httpClient({ requiresAuth: true }).delete(
        `${prefix}/providers/court/${id}`,
        { data: { name } }
      );
      return res.data ? res.data : false;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};
