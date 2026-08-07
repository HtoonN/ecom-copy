import localClient from "./localClient";
import {
  affiliateDashboardMock,
  affiliateUsageMock,
  resolveAffiliateMonthKey,
} from "./mockConsoleAffiliateData";

export default {
    async getProviders(query) {
        try{
            const res = await localClient({ requiresAuth: true }).get(
              '/api/protected/provider_logins'  ,
              {
                params : query,
              }
            );
            return {data: res.data, error: false} ;
        }catch(e){
            console.log(e);
            return {
                message: e.response.data.errors.map((error) => error.message).join('\n'),
                error: true,
            };
        }
      },
      async providerLogin(payload){
          try{
            const res = await localClient({ requiresAuth: false }).post('/api/login', payload);
            return {
              success: true,
              data : res.data,
            }
      
          }catch (e) {
            console.log(e);
            return {
              success: false,
              message: `${e.response.data.field} : ${e.response.data.message}`
            };
          }
        },
      async changeProviderPassword(payload){
          try{
            const res = await localClient({ requiresAuth: true }).put(
              `/api/protected/provider/${payload.id}/change-password`,
              { password: payload.password }
            );
            return {
              success: true,
              data: res.data,
            };
          }catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to update password",
            };
          }
        },
      async uploadProviderMedia(providerId, formData){
          try{
            const res = await localClient({ requiresAuth: true }).put(
              `/api/protected/provider/${providerId}/media`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            return {
              success: true,
              data: res.data,
            };
          }catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to upload provider media",
            };
          }
        },
      async uploadProviderLogo(providerId, formData){
          try{
            const res = await localClient({ requiresAuth: true }).put(
              `/api/protected/provider/${providerId}/logo`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            return {
              success: true,
              data: res.data,
            };
          }catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to upload provider logo",
            };
          }
        },
      async getProviderMedia(providerId){
          try{
            const res = await localClient({ requiresAuth: true }).get(
              `/api/protected/provider/${providerId}/media`
            );
            return {
              success: true,
              data: res.data,
            };
          }catch (e) {
            console.log(e);
            return {
              success: true,
              data: {
                image_url: "https://placehold.co/600x400?text=Provider+Media",
              },
              mocked: true,
            };
          }
        },
      async uploadProviderLiffMedia(providerId, { file, field }){
          if (!providerId || !file || !field) {
            return {
              success: false,
              message: "Missing LIFF media upload data",
            };
          }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("field", field);

          try {
            const res = await localClient({ requiresAuth: true }).put(
              `/provider/${providerId}/media/liff`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to upload LIFF media",
            };
          }
        },
      async getProviderStaffs(providerId){
          try{
            const res = await localClient({ requiresAuth: true }).get(
              `/api/protected/provider/${providerId}/staff`
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            try {
              const fallbackRes = await localClient({ requiresAuth: true }).get(
                `/api/protected/provider/${providerId}/staffs`
              );
              return {
                success: true,
                data: fallbackRes.data,
              };
            } catch (fallbackError) {
              console.log(fallbackError);
              return {
                success: false,
                message: fallbackError?.response?.data?.message || "Unable to load provider staffs",
              };
            }
          }
        },
      async createStaff(payload) {
          try {
            const res = await localClient({ requiresAuth: true }).post(
              "/api/protected/staff",
              payload
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            console.log(e);
            return {
              success: false,
              status: e?.response?.status,
              field: e?.response?.data?.field,
              message: e?.response?.data?.message || "Unable to create staff",
            };
          }
        },
      async updateProviderSettings(providerId, payload) {
          try {
            const res = await localClient({ requiresAuth: true }).put(
              `/api/protected/provider/${providerId}/settings`,
              payload
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to update provider settings",
            };
          }
        },
      async updateProviderPublicFields(providerId, payload) {
          try {
            const res = await localClient({ requiresAuth: true }).put(
              `/api/protected/provider/${providerId}/public-fields`,
              payload
            );
            return res.data;
          } catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to update provider public fields",
            };
          }
        },
      async getProviderFacilities() {
          try {
            const res = await localClient({ requiresAuth: true }).get(
              "/api/protected/provider/facilities"
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to load facilities",
            };
          }
        },
      async createFacilityProviders(payload) {
          try {
            const res = await localClient({ requiresAuth: true }).post(
              "/api/protected/provider/facility_providers",
              payload
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to create facilities",
            };
          }
        },
      async updateCourt(courtId, payload) {
          try {
            const res = await localClient({ requiresAuth: true }).put(
              `/api/protected/court/${courtId}`,
              {
                name: payload.name,
                name_en: payload.name_en,
              }
            );
            return {
              success: true,
              data: res.data,
            };
          } catch (e) {
            console.log(e);
            return {
              success: false,
              message: e?.response?.data?.message || "Unable to update court",
            };
          }
        },
      async getConsoleAffiliateDashboard({ month } = {}) {
          const monthKey = resolveAffiliateMonthKey(month);
          const monthlyData = monthKey ? affiliateDashboardMock.monthly[monthKey] : null;
          return {
            success: true,
            mocked: true,
            data: {
              ...(monthlyData || affiliateDashboardMock.overall),
              available_months: affiliateDashboardMock.months,
              month: monthKey,
            },
          };
        },
      async getConsoleAffiliateUsage({ month } = {}) {
          const monthKey = resolveAffiliateMonthKey(month);
          const monthlyItems = monthKey ? affiliateUsageMock.monthly[monthKey] : null;
          return {
            success: true,
            mocked: true,
            data: {
              items: monthlyItems || affiliateUsageMock.overall,
              month: monthKey,
            },
          };
        }
}
