import httpClient from "./httpClient";
const prefix = "/md-console/provider-taxs";

export default {
    async createProviderTax(data) {
        try{
            const res = await httpClient({ requiresAuth: true }).post(
                prefix  ,
                data
            );
            return { data: res.data, error: false } ;
        }catch(e){
            console.log(e);
            return {
                message: e.response?.data?.errors.map((error) => error.message).join('\n') || "Error",
                error: true,
            };
        }
    },
    async getProvidersTax(provider_id) {
        try{
            const res = await httpClient({ requiresAuth: true }).get(
                prefix  ,
                {
                    params:{
                        provider_id,
                    }
                }
            );
            return res.data ? res.data : false ;
        }catch(e){
            console.log(e);
            return false;
        }
    },
    async updateProviderTax(id, data) {
        try{
            const res = await httpClient({ requiresAuth: true }).put(
                prefix + `/${id}` ,
                data
            );
            return { data: res.data, error: false } ;
        }catch(e){
            console.log(e);
            return {
                message: e.response?.data?.errors.map((error) => error.message).join('\n') || "Error",
                error: true,
            };
        }
    },
}