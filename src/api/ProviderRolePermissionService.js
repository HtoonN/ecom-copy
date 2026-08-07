import localClient from "./localClient";

const normalizePayloadRoles = (data) => {
  const roles = data?.roles || data?.role_groups || data?.data || data || [];
  return Array.isArray(roles) ? roles : [];
};

const normalizePayloadStaffs = (data) => {
  const staffs = data?.staffs || data?.staff || data?.provider_staffs || data?.data || data || [];
  return Array.isArray(staffs) ? staffs : [];
};

const errorResponse = (e, fallbackMessage) => ({
  success: false,
  status: e?.response?.status,
  data: e?.response?.data,
  message: e?.response?.data?.message || fallbackMessage,
});

export default {
  async getRoleGroups(providerId) {
    try {
      const res = await localClient({ requiresAuth: true }).get(
        `/api/protected/provider/${providerId}/roles`
      );
      return { success: true, data: normalizePayloadRoles(res.data) };
    } catch (e) {
      return errorResponse(e, "Unable to load role groups");
    }
  },

  async getStaffs(providerId) {
    try {
      const res = await localClient({ requiresAuth: true }).get(
        `/api/protected/provider/${providerId}/staff`
      );
      return { success: true, data: normalizePayloadStaffs(res.data) };
    } catch (e) {
      return errorResponse(e, "Unable to load provider staff");
    }
  },

  async createRoleGroup(providerId, payload) {
    try {
      const res = await localClient({ requiresAuth: true }).post(
        `/api/protected/provider/${providerId}/roles`,
        payload
      );
      return { success: true, data: res.data };
    } catch (e) {
      return errorResponse(e, "Unable to create role group");
    }
  },

  async updateRoleGroup(providerId, roleId, payload) {
    try {
      const res = await localClient({ requiresAuth: true }).put(
        `/api/protected/provider/${providerId}/roles/${roleId}`,
        payload
      );
      return { success: true, data: res.data };
    } catch (e) {
      return errorResponse(e, "Unable to update role group");
    }
  },

  async deleteRoleGroup(providerId, roleId) {
    try {
      await localClient({ requiresAuth: true }).delete(
        `/api/protected/provider/${providerId}/roles/${roleId}`
      );
      return { success: true };
    } catch (e) {
      return errorResponse(e, "Unable to delete role group");
    }
  },

  async updateStaffRole(staffId, roleId) {
    try {
      const res = await localClient({ requiresAuth: true }).put(
        `/api/protected/staff/${staffId}/role`,
        { role_id: roleId }
      );
      return { success: true, data: res.data };
    } catch (e) {
      return errorResponse(e, "Unable to update staff role");
    }
  },
};
