<template>
    <v-card-title>Insurance Sales Report</v-card-title>
    <v-card-text>
        <v-row class="my-2">
            <v-col cols="5">
                <v-text-field 
                    label="ค้นหา" 
                    v-model="search" 
                    variant="solo" hide-details    
                    append-inner-icon="mdi-magnify" 
                    @update:model-value="() => {
                        pagination.page = 1;
                        fetchData();
                    }"
                    clearable
                     >
                    <template v-slot:append>
                        <v-btn color="blue" @click="fetchData" variant="outlined" :loading="loading"> <v-icon>mdi-refresh</v-icon> </v-btn>
                    </template>
                </v-text-field>
                
            </v-col>
            <v-col cols="7" class="d-flex justify-end align-center ga-3">
                <VueDatePicker
                    placeholder="Select Date"
                    :enable-time-picker="false"
                    auto-apply
                    locale="th"
                    format="dd/MM/yyyy"
                    style="width: 250px"
                    range
                    v-model="date"
                    @update:model-value="() => {
                        pagination.page = 1;
                        fetchData();
                    }"
                />
                <v-btn
                    prepend-icon="mdi-microsoft-excel" 
                    variant="outlined" 
                    color="#1D6F42" 
                    @click="exportExcel" 
                    :loading="exporting"
                >Export</v-btn>
            </v-col>
        </v-row>
        <v-data-table-server :headers="headers" :items="pagination.data" height="calc(100dvh - 320px)" fixed-header :itemsLength="pagination.data.length">
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
                            :color="pagination.page == item.page ? 'grey-lighten-2' : ''"
                        >
                            {{ item.page  }}
                        </v-btn>
                    </template>
                </v-pagination>
            </template>
                <template v-slot:item.no = "{index}">
                    {{ index + 1 }}
                </template>
                <template v-slot:item.created_at = "{item}">
                   {{ moment(item.created_at).format('DD/MM/YYYY HH:mm:ss') }}
                </template>
                <template v-slot:item.activated_at = "{item}">
                   {{ item.activated_at ? moment(item.activated_at).format('DD/MM/YYYY HH:mm:ss') : ' ' }}
                </template>
        </v-data-table-server>
    </v-card-text>
</template>

<script>
import VueDatePicker from '@vuepic/vue-datepicker';
import moment from 'moment';
import InsuranceService from '../api/InsuranceService';
export default {
    name: 'insurcanceSalesReport',
    components:{ VueDatePicker },
    data(){
        return {
            headers: [
                { title: 'ลำคับ', key: 'no', sortable: false, align: 'center' },
                { title:'วันที่ซื้อ', key: 'created_at', sortable: false, align:'center'},
                { title: 'รหัสประกัน', key: 'insurance_code', sortable: false },
                { title: 'ผู้ใช้งาน', key: 'user', sortable: false },
                { title: 'ชื้อผู้เอาประกัน', key: 'activated_name', sortable: false },
                { title: 'วันที่เปิดใช้งาน', key: 'activated_at', sortable: false },
            ],
            search: null,
            pagination: {
                page: 1,
                lastPage: 0,
                data: []
            },
            exporting: false,
            date: null,
            moment,
            loading: false,
        }; 
    },
    methods:{
        selectPage(pageNo){
            if(!(this.pagination.page == pageNo)){
                this.pagination.page = Number(pageNo);
                this.fetchData();
            }
        },
        updatePage(){    
                this.fetchData(); 
        },
        async fetchData(query){
            this.loading = true;
            this.pagination = 
                await InsuranceService.getInsurance(
                    { 
                        ...query,
                        page: this.pagination.page, 
                        time_start : this.date ? moment(this.date[0]).format("YYYY-MM-DD 00:00:00") : null, 
                        time_end: this.date ? moment(this.date[1]).format('YYYY-MM-DD 23:59:59') : null, 
                        search: this.search,
                    });
            this.loading = false;
          
        },
        async exportExcel(){
            this.exporting = true;
            var params = {
                is_xlsx: 1,
                search: this.search,
            }
            if(this.date){
                params = {
                    ...params,
                    time_start : moment(this.date[0]).format("YYYY-MM-DD 00:00:00"),
                    time_end: moment(this.date[1]).format('YYYY-MM-DD 23:59:59'),
                }
            }
            await InsuranceService.downloadInsurance(params);
            this.exporting = false;
        }
    },
    mounted() {
        this.fetchData();
    }
}
</script>

<style>

</style>