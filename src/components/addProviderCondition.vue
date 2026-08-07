<template>
    <v-dialog v-model="dialog" width="600px" persistent>
        <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
                {{ id ? 'แก้ไข Provider Condition' : 'เพิ่ม Provider Condition' }}
                <v-btn variant="text" icon="mdi-close" color="primary" @click="close" />
            </v-card-title>
            <v-card-text>
                <v-form ref="form" v-model="isValid">
                    <v-row dense>
                        <v-col cols="12">
                            <v-autocomplete v-model="formData.provider_id" :items="providers" item-title="fullname"
                                item-value="id" label="Provider" :rules="[rules.required]" variant="solo" :disabled="!!fixedProviderId" />
                        </v-col>
                        <v-col cols="12">
                            <v-select v-model="formData.type" :items="typeOptions" label="Type" variant="solo" />
                        </v-col>
                        <v-col cols="12">
                            <label>ข้อความภาษาไทย</label>

                            <v-textarea v-model="formData.text" placeholder="กรอกข้อความภาษาไทย" variant="solo" />

                        </v-col>
                        <v-col cols="12">
                            <label>ข้อความภาษาอังกฤษ</label>

                            <v-textarea v-model="formData.text_en" placeholder="Enter English text" variant="solo" />

                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="submitForm" :disabled="!isValid" color="primary" :loading="loading">บันทึก</v-btn>
                <v-btn @click="close">ยกเลิก</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import ProviderConditionService from '../api/providerConditionTexts';
import ConsoleService from '../api/ConsoleService';
import Swal from 'sweetalert2';
import { VueEditor } from 'vue3-editor';

export default {
    name: 'addProviderCondition',
    components: { VueEditor },
    emits: ['refresh'],
    props: {
        fixedProviderId: {
            type: Number,
            default: null
        }
    },
    data() {
        return {
            dialog: false,
            isValid: false,
            loading: false,
            id: null,
            customToolbar: [
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
            ],
            providers: [],
            typeOptions: [
                { title: 'condition', value: 'condition' },
                { title: 'text', value: 'text' },
            ],
            formData: {
                provider_id: null,
                type: 'text',
                text: '',
                text_en: '',
            },
            rules: {
                required: (v) => !!v || 'ช่องนี้จำเป็นต้องกรอก',
            },
        }
    },
    methods: {
        async open(data) {
            await this.getProviders();
            
            if (this.fixedProviderId) {
                 this.formData.provider_id = this.fixedProviderId;
            }

            if (data && data.id) {
                this.id = data.id;
                this.formData = {
                    provider_id: data.provider_id || this.fixedProviderId,
                    type: data.type || 'condition',
                    text: data.text || '',
                    text_en: data.text_en || '',
                };
            }
            this.dialog = true;
        },
        close() {
            this.dialog = false;
            this.clean();
        },
        clean() {
            this.id = null;
            this.formData = {
                provider_id: this.fixedProviderId || null,
                type: 'condition',
                text: '',
                text_en: '',
            };
            this.isValid = false;
        },
        async submitForm() {
            this.loading = true;

            // แปลง newline เป็น <br> สำหรับ HTML
            const payload = {
                ...this.formData,
                text: this.formData.text || '', //?.replace(/\n/g, '<br>') || '',
                text_en: this.formData.text_en || '', //?.replace(/\n/g, '<br>') || '',
            };

            let res;

            if (this.id) {
                res = await ProviderConditionService.updateProviderCondition(this.id, payload);
            } else {
                res = await ProviderConditionService.createProviderCondition(payload);
            }

            if (!res.error) {
                this.close();
                this.$emit('refresh');
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: this.id ? 'แก้ไขสำเร็จ' : 'สร้างสำเร็จ',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สำเร็จ',
                    text: res.message,
                    confirmButtonText: 'OK',
                });
            }
            this.loading = false;
        },
        async getProviders() {
            const data = await ConsoleService.getProviders();
            this.providers = data;
        },
    },
}
</script>
