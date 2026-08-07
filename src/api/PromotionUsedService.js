import localClient from "./localClient";

const makeParams = ({ page = 1, page_size = 20, promoname, provider_id, created_from, created_to } = {}) => {
  const params = {
    page,
    page_size,
  };

  if (promoname) {
    params.promoname = promoname;
  }

  if (provider_id !== null && provider_id !== undefined && provider_id !== "") {
    params.provider_id = provider_id;
  }

  if (created_from) {
    params.created_from = created_from;
  }

  if (created_to) {
    params.created_to = created_to;
  }

  return params;
};

export default {
  async getPromotionUsers(payload = {}) {
    const client = localClient({ requiresAuth: true });
    const res = await client.get("/api/protected/provider/promotion-users", {
      params: makeParams(payload),
    });
    return res.data;
  },
};
