<template>
    <v-dialog v-model="dialog" max-width="800">
        <v-card>
            <v-card-title>
                เลขบัญชี สำหรับจองผ่านไลน์ ({{ provider_name || " " }})
            </v-card-title>
            <v-card-text class="pb-5" style="height: 60dvh;">
                <v-form ref="formRef" v-model="valid" lazy-validation>
                    <v-row>
                        <v-col cols="6" class="d-flex justify-center align-center">
                            <v-file-input
                                ref="fileInput"
                                v-model="selectedImage"
                                accept="image/*"
                                :multiple="false"
                                @change="previewImage"
                                style="display: none;"
                            ></v-file-input>
                            <!-- Image preview (clickable) -->
                            <div style="width: 400px; height: 55dvh;"  v-if="imageUrl" class="d-flex justify-center align-center" >
                            <v-hover v-slot="{ isHovering, props }">
                                    <v-img 
                                    v-bind="props"
                                        :src="imageUrl"
                                        max-width="300px"
                                        max-height="55dvh"
                                        style="cursor: pointer; object-fit: contain;"
                                        @click="triggerFileInput"
                                    >
                                        <v-btn v-if="isHovering" style="position: absolute;left: 50%;top: 50%;transform: translate(-50%, -50%);" color="primary" >คลิกเพื่อเปลี่ยน QR-Code</v-btn>
                                    </v-img> 
                                </v-hover>
                            </div>
                            <v-btn v-else @click="triggerFileInput" prepend-icon="mdi-plus" color="grey" variant="text"> 
                                เลือก QR-Code
                            </v-btn>
                        </v-col>
                        <v-col cols="6" class="d-flex flex-column justify-space-between">
                            <div>
                                <!-- Select -->
                                <v-select
                                    label="ชื่อ ธนารคาร"
                                    :items="bankOptions"
                                    v-model="form.bank_id"
                                    item-title="name"
                                    item-value="id"
                                    variant="underlined"
                                    :rules="[rules.required]"
                                ></v-select>

                                <!-- Text Fields -->
                                <v-text-field
                                    label="ชื่อบัญชี"
                                    v-model="form.acc_name"
                                    variant="underlined"
                                ></v-text-field>

                                <v-text-field
                                    label="เลขบัญชี"
                                    v-model="form.acc_no"
                                    variant="underlined"
                                    :rules="[rules.required]"
                                ></v-text-field>

                                <!-- Submit Button -->
                                <v-card-actions v-if="isDirty || !form.id">
                                    
                                    <v-spacer></v-spacer>
                                    <v-btn
                                        color="primary"
                                        :disabled="!isDirty || !isCompleteField"
                                        @click="submitForm"
                                        
                                        prepend-icon="mdi-check"
                                        class="px-4"
                                >
                                    บันทึก
                                </v-btn>
                                <v-btn
                                color=""
                                    :disabled="!isDirty"
                                    @click="cancelForm"
                                    
                                    prepend-icon="mdi-close"
                                    class="px-4"
                                >
                                {{ form.id ? 'ยกเลิกการแก้ไข' : 'ยกเลิก' }}
                                </v-btn>
                                </v-card-actions>
                            </div>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
// import accountService from '@/api/accountService';
// import oldApi from '@/stores/oldApi';
import Swal from 'sweetalert2';

export default {
    name:'accountNo',
    data() {
        return {
            provider_name: '',
            valid: false,
            loading: false,
            selectedImage: null,
            form: {
                acc_name: '',
                acc_no: '',
                bank_id: null,
            },
            original: {
                acc_name: '',
                acc_no: '',
                bank_id: null,
            },
            bankOptions: ['Option 1', 'Option 2', 'Option 3'],
            imageUrl: null,
            originalImageUrl : null,
            rules: {
                required: v => !!v || 'กรุณากรอกข้อมูล',
                number: v => /^[0-9]+$/.test(v) || 'Must be a number'
            },
            file: null,
            dialog: false,
        }
    },
    computed: {
        isDirty() {
        // Enable button if any field changed
            return (
                this.form.acc_name !== this.original.acc_name ||
                this.form.acc_no !== this.original.acc_no ||
                this.imageUrl !== this.originalImageUrl ||
                this.form.bank_id !== this.original.bank_id
            );
        },
        isCompleteField(){
            return this.valid && this.imageUrl ;
        }
    },
    methods: {
        triggerFileInput() {
            this.$refs.fileInput.click()
        },
        previewImage(data) {
            this.file = data.target.files[0];
             if (!this.file) return
            // Vuetify 3 single file input returns the file directly (not array)
            // this.selectedImage = file

            // Make sure it's a File instance
            if (this.file instanceof File) {
                this.imageUrl = URL.createObjectURL(this.file)
            } else {
                console.error('Selected item is not a file:', this.file)
                this.imageUrl = null
            }
        },

        submitForm() {
            // Step 1: Confirm save
            Swal.fire({
                text: 'คุณต้องการบันทึกข้อมูลนี้หรือไม่',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'ใช่, บันทึกเลย!',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#e21515'
            }).then(async (result) => {
                
                if (result.isConfirmed) {
                    let res = false;
                    const formData = new FormData()
                    if(this.file){
                        formData.append("qrcode", this.file);
                    }else if(this.form.id){
                        formData.append('qrcode',this.imageUrl);
                    }
                    formData.append("acc_name", this.form.acc_name);   
                    formData.append("acc_no", this.form.acc_no);
                    formData.append("bank_id", this.form.bank_id);
                    // Step 2: Show loading
                    Swal.fire({
                        title: 'กำลังบันทึก...',
                        text: 'โปรดรอสักครู่',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    if(this.original.id){
                        console.log('updating...');
                        res = await accountService.updateAccount(this.form.id, formData);
                    
                    }else{
                        console.log('create...');
                        res = await accountService.createAccount(formData);
                    }

                     Swal.close();

                    if (res) {
                    // Step 3: Success toast
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'บันทึกข้อมูลสำเร็จ!',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                            confirmButtonColor: '#e21515'
                        });
                        this.fetcData();
                    } else {
                    // Step 4: Error alert
                        Swal.fire({
                            title: 'ไม่สำเร็จ!',
                            text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                            icon: 'error',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#e21515',
                            showConfirmButton: true,
                        });
                    }
                }
            });
            
        },
        deleteAccount(){
            // Step 1: Confirm delete
            Swal.fire({
                title: 'คุณแน่ใจหรือไม่?',
                text: 'คุณต้องการลบบัญชีธนาคารนี้หรือไม่',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'ใช่, ลบเลย!',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#e21515'
            }).then(async (result) => {
                if (result.isConfirmed) {
                // Step 2: Show loading
                    Swal.fire({
                        title: 'กำลังลบ...',
                        text: 'โปรดรอสักครู่',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    let res = false;
                    res = await accountService.deleteAccount(this.form.id);

                    if (res) {
                    // Step 3: Success toast
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'ลบบัญชีธนาคารเรียบร้อยแล้ว!',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                            confirmButtonColor: '#e21515'
                        });
                        this.clean();
                    } else {
                    // Step 4: Error alert
                        Swal.fire({
                            title: 'ไม่สำเร็จ!',
                            text: 'เกิดข้อผิดพลาดในการลบบัญชีธนาคาร',
                            icon: 'error',
                            confirmButtonText: 'ตกลง',
                            confirmButtonColor: '#e21515'
                        });
                    }
                }
            });
        },
        cancelForm(){
            this.form = { ...this.original };
            this.imageUrl = this.originalImageUrl;
        },
        async fetcData(){
            this.loading = true;
            const res = await accountService.getAccountInfo();
            // const res = {data:[]};
            if(res.data[0]){
                this.original = { ...res.data[0] };
                this.form = { ...res.data[0] };
                this.imageUrl = res.data[0].qrcode;
                this.originalImageUrl = res.data[0].qrcode;
            }
            this.loading = false;
        },
        clean(){
            this.form = {
                acc_name: '',
                acc_no: '',
                bank_id: null,
            };
            this.original= {
                acc_name: '',
                acc_no: '',
                bank_id: null,
            };
            this.imageUrl = null;
            this.originalImageUrl = null;
            this.valid = false;
            this.provider_name = '';
        },
        open(data){
            console.log(data);
            if(data){
                this.provider_name = data.fullname;
                this.dialog = true;
            }
        },
        close(){
            this.dialog = false;
            this.clean();
        }
    },
    // async mounted(){
    //      this.bankOptions = await oldApi().getBanks();
    //      this.fetcData();
    // }
    
}
</script>
