import httpClient from "./httpClient";

const prefix = "/md-console/insurance-sales";
export default {
   
    async getInsurance(payload) {
        const params = makeParams(payload);
        try{
            const res = await httpClient({ requiresAuth: true }).get(
              prefix,
              {
                params,
              }
            );
            return res.data ;
        }catch(e){
            console.log(e);
            return false;
        }
    },
    async downloadInsurance(payload){
            const params = makeParams(payload);
            try{
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
                    let filename = 'Insurance Export.xlsx';
    
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
            }catch(e){
                console.log(e);
            }
        },
    
}

function makeParams(obj) {
    const keys = [ 'is_xlsx', 'page', 'search', 'time_start', 'time_end'];
    return Object.fromEntries(
        keys
        .filter((key) => obj[key])
        .map((key) => [key, obj[key]])
    );
}
