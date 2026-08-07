<template>
  <v-dialog v-model="dialog" width="600" persistent>
    <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
           {{ formData.id ? 'แก้ไขข้อมูลภาษี' : 'สร้างข้อมูลภาษี' }}
            <v-btn icon="mdi-close" color="primary" variant="text" size="small" @click="close"/>
        </v-card-title>
        <v-card-text>
            <v-form v-model="isValid">
                <v-row dense> 
                    <v-col cols="6">
                        <v-autocomplete
                            v-model="formData.provider_id"
                            :items="providers"
                            item-title="fullname"
                            item-value="id"
                            label="Provider"
                            variant="solo"
                            :readonly="formData.id ? true : !!fixedProviderId"
                        /> 
                    </v-col>
                     <v-col cols="6">
                        <v-text-field label="เลขประจำตัวผู้เสียภาษี" variant="solo" :rules="[rules.required]" v-model="formData.tax_id"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field label="ชื่อบริษัท" variant="solo" :rules="[rules.required]" v-model="formData.tax_name"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <v-text-field label="ชื่อร้านค้า" variant="solo" :rules="[rules.required]" v-model="formData.store_name"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field label="ที่อยู่ผู้เสียภาษี 1" variant="solo" :rules="[rules.required]" v-model="formData.tax_address"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field label="ข้อความหัก ณ ที่ จ่าย" variant="solo" v-model="formData.withholding_tax_text"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <v-textarea label="หมายเหตุ" variant="solo" hide-details v-model="formData.free_text"></v-textarea>
                    </v-col>
                </v-row>
            </v-form>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="create" :disabled="!isValid" color="primary" :loading="loading">บันทึก</v-btn>
            <v-btn @click="close">ยกเลิก</v-btn>
        </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Swal from 'sweetalert2';
import ConsoleService from '../api/ConsoleService';
import ProviderTaxService from '../api/ProviderTaxService';

export default {
    name:'addAddress',
    emits: ['refresh'],
    props: {
        fixedProviderId: {
            type: Number,
            default: null
        }
    },
    data(){
        return {
            dialog: false,
            isValid: true,
            formData: {
                provider: null,
            },
            rules: {
                required: (v) => !!v || 'ช่องนี้จำเป็นต้องกรอก',
                email: (v) =>
                /.+@.+\..+/.test(v) || 'E-mail must be valid',
                positiveNumber: (v) =>
                (!isNaN(v) && Number(v) > 0) || 'ต้องเป็นตัวเลขที่มากกว่า 0',
            },
            providers: [],
            formData:{
                tax_name:'',
                store_name:'',
                tax_id:'',
                provider_id: this.fixedProviderId || null,
                tax_address:'',
                free_text:'',
                withholding_tax_text:'',
                id: null,
            },
            loading: false,
        }
    },
    methods:{
        close(){
            this.clear();
            this.dialog = false;
        },
        open(data){
            if (this.fixedProviderId) {
                this.formData.provider_id = this.fixedProviderId;
            }
            if(data){
                this.formData.id = data.id;
                this.formData.tax_name = data.tax_name;
                this.formData.store_name = data.store_name;
                this.formData.tax_id = data.tax_id;
                this.formData.provider_id = data.provider_id;
                this.formData.tax_address = data.tax_address;
                this.formData.free_text = data.free_text;
                this.formData.withholding_tax_text = data.withholding_tax_text;
            }
            this.dialog = true;
            this.getProviders();
        },
        clear(){
            this.formData = {
                tax_name:'',
                store_name:'',
                tax_id:'',
                provider_id: this.fixedProviderId || null,
                tax_address:'',
                free_text:'',
                withholding_tax_text:'',
            }
        },
        async getProviders() {
            this.providers = await ConsoleService.getProviders();
            if(this.formData.id){
                this.providers = this.providers;
            } else if (this.fixedProviderId) {
                // If it's a fixed provider, don't filter out providers
                this.providers = this.providers;
            } else {
                this.providers = this.providers.filter((provider) => !provider.provider_tax_data);
            }
            
        },
        async create(){
            this.loading = true;
            if(this.formData.id){
                const payload = {
                    provider_id: this.formData.provider_id,
                    store_name: this.formData.store_name,
                    tax_id: this.formData.tax_id,
                    tax_name: this.formData.tax_name,
                    tax_address: this.formData.tax_address,
                    free_text: this.formData.free_text,
                    withholding_tax_text: this.formData.withholding_tax_text
                };
                const res = await ProviderTaxService.updateProviderTax(this.formData.id, payload);
                if(!res.error){
                    Swal.fire({
                        toast: true,
                        position: 'top-end', // มุมขวาบน
                        icon: 'success',
                        title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
                        showConfirmButton: false,
                        timer: 2000, // 2 วินาที
                        timerProgressBar: true,
                    });
                    this.$emit("refresh");
                    this.close();
                }else{
                     await Swal.fire({
                        icon: 'error',
                        title: 'ไม่สำเร็จ',
                        text: res.message || 'กรุณาตรวจสอบและลองอีกครั้ง',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor : "#d60326",
                    });
                }
            }else{
                const payload = {
                        provider_id: this.formData.provider_id,
                        store_name: this.formData.store_name,
                        tax_id: this.formData.tax_id,
                        tax_name: this.formData.tax_name,
                        tax_address: this.formData.tax_address,
                        free_text: this.formData.free_text,
                        withholding_tax_text: this.formData.withholding_tax_text
                    };
                const res = await ProviderTaxService.createProviderTax(payload);

                if(!res.error){
                    Swal.fire({
                        toast: true,
                        position: 'top-end', // มุมขวาบน
                        icon: 'success',
                        title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
                        showConfirmButton: false,
                        timer: 2000, // 2 วินาที
                        timerProgressBar: true,
                        zIndex: 9999
                    });
                    this.$emit("refresh");
                    this.close();
                }else{
                     await Swal.fire({
                        icon: 'error',
                        title: 'สร้างไม่สำเร็จ',
                        text: res.message || 'กรุณาตรวจสอบและลองอีกครั้ง',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor : "#d60326",
                    });
                }
            }
            this.loading = false;  
        },
    },
    mounted(){
        this.getProviders();
    }
}
</script>

<style>

</style>