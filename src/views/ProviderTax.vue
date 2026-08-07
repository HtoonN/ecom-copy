<template>
    <v-card>
        <v-card-title>Provider Tax</v-card-title>
        <v-card-text class="mt-3">
            <v-row justify="end">
                <v-col cols="5">
                <v-autocomplete
                    v-model="selected_provider"
                    @update:model-value="fetchData"
                    :items="providers"
                    item-title="fullname"
                    item-value="id"
                    label="สนาม"
                    clearable
                    variant="solo"
                    hide-details
                >
                    <template v-slot:append>
                        <v-btn color="blue" @click="fetchData" variant="outlined"> <v-icon>mdi-refresh</v-icon> </v-btn>
                    </template>
                </v-autocomplete> 
                </v-col>
                <v-col cols="7" class="text-right">
                    <v-btn color="primary" prepend-icon="mdi-plus" @click="addAddress()">สร้างข้อมูลภาษี</v-btn>
                </v-col>
            </v-row>
        </v-card-text>
        <v-card-text>
            <v-data-table-server :headers="headers" :items="pagination.data" height="calc(100dvh - 325px)" fixed-header :items-length="pagination.data.length">
                <template v-slot:bottom>
                    <v-pagination
                        v-model="pagination.page"
                        :length="pagination.lastPage"
                        @next="updatePage"
                        @prev="updatePage"
                        total-visible="5"
                    >
                        <template v-slot:item="item">
                            <v-btn
                                :key="item"
                                fab
                                small
                                class="ma-2 elevation-0"
                                @click="selectPage(item.page)"
                                :color="pagination.page == item.page ? 'grey-lighten-2' : ''">
                                {{ item.page  }}
                            </v-btn>
                        </template>
                </v-pagination>
                </template>
                 <template v-slot:item.no = "{index}">
                    {{ index + 1 }}
                 </template>
                 <template v-slot:item.address = "{item}">
                    {{ item.tax_address || "" }} {{ item.tax_address2 || " "}}
                 </template>
                 <template v-slot:item.manage = "{item}">
                    <v-btn color="primary" @click="addAddress(item)"><v-icon>mdi-pencil</v-icon></v-btn>
                 </template>
            </v-data-table-server>
        </v-card-text>
    </v-card>
    <AddProviderTax ref="create_address" @refresh="fetchData()"/>
</template>

<script>
import ConsoleService from '../api/ConsoleService';
import ProviderTaxService from '../api/ProviderTaxService';
import AddProviderTax from '../components/addProviderTax.vue'
export default {
  components: { AddProviderTax },
    name:'providerAddress',
    data(){
        return {
             headers: [
                { title: 'ลำคับ', key: 'no', sortable: false, align: 'center' },
                { title: 'สนาม', key: 'provider_fullname', sortable: false },
                { title: 'เลขหระจำตัวผู้เสียภาษี', key: 'tax_id', sortable: false },
                { title: 'ชื่อบริษัท', key: 'tax_name', sortable: false },
                { title: 'ชื่อร้านค้า', key: 'store_name', sortable: false },
                { title: 'ที่อยู่ผู้เสียภาษี', key: 'address', sortable: false },
                { title: 'ข้อความหัก ณ ที่ จ่าย', key: 'withholding_tax_text', sortable: false },                
                { title: 'หมายเหตุ', key: 'free_text', sortable: false },              
                { title: '', key: 'manage', sortable: false },
            ],
            search: null,
            pagination: {
                page: 1,
                lastPage: 0,
                data:[]
            },
            selected_provider: null,
            providers: []
        }
    },
    methods:{
        addAddress(data){
            this.$refs.create_address.open(data);
        },
        selectPage(pageNo){
            if(!(this.pagination.page == pageNo)){
                this.pagination.page = Number(pageNo);
                this.fetchData();
            }
        },
        updatePage(){     
            this.fetchData(); 
        },
        async fetchData(){
            this.pagination = await ProviderTaxService.getProvidersTax(this.selected_provider);
        },
         async getProviders() {
            const data = await ConsoleService.getProviders();
            this.providers = [{ id: null, fullname: 'ทังหมด' }, ...data];
            
        },
    },
    mounted(){
        this.fetchData();
        this.getProviders();
    }
}
</script>

<style>

</style>