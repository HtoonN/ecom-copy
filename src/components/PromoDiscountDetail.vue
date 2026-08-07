<template>
    <v-dialog v-model="dialog" width="600px" persistent>
        <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
                <p>รายละเอียดส่วนลดตามประเภท <v-btn size="x-small" color="primary" @click="addDiscount">เพิ่ม</v-btn>
                </p>
                <v-btn variant="text" color="primary" icon="mdi-close" @click="close" />
            </v-card-title>
            <v-divider class="mx-4" />
            <v-card-text>
                <v-table height="300px" fixed-header>
                    <thead>
                        <tr>
                            <th>ประเภท</th>
                            <th>ชื่อ</th>
                            <th> </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(discount, index) in model_discounts" :key="index">
                            <td style="width: 200px; padding: 10px 5px;">
                                <v-select variant="solo" v-model="discount.model" :items="model_options"
                                    @update:model-value="updateDiscount(discount)" hide-details></v-select>
                            </td>
                            <td style="padding: 10px 5px;">
                                <v-select variant="solo" :disabled="!discount.model" v-model="discount.model_id"
                                    :items="discount.list" item-value="value" item-title="title"
                                    hide-details></v-select>
                            </td>
                            <td style="text-align: right; width: 50px; padding: 10px 5px">
                                <v-btn @click="removeDiscount(index)" color="primary">ลบ</v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="submit" :loading="loading">บันทึก</v-btn>
                <v-btn color="secondary" @click="close">ยกเลิก</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { toRaw } from 'vue';
import PromotionService from '../api/PromotionService';
import Swal from 'sweetalert2';

export default {
    name: 'promoDiscountDetail',
    props: {
        providers: {
            type: Array,
            default: () => []
        }
    },
    emits: ['refresh'],
    data() {
        return {
            dialog: false,
            model_discounts: [],
            discount_options: {
                sport: [],
                court: [],
                court_type: []
            },
            model_options: [
                { title: 'กีฬา', value: 'sport' },
                // { title: 'สนาม', value: 'court' },
                { title: 'ประเภทสนาม', value: 'court_type' }
            ],
            promotionId: null,
            loading: false,
        }
    },
    methods: {
        open(data) {
            if (data) {
                this.promotionId = data.id;

                // โหลด discount options ตาม provider ที่เลือก
                this.initDiscountOptions(data.provider_id);

                // โหลด model_discounts และเพิ่ม list สำหรับ dropdown
                if (data.model_discounts && data.model_discounts.length > 0) {
                    this.model_discounts = toRaw(data.model_discounts.map(d => ({
                        model: d.model_name,
                        model_id: d.model_id,
                        list: this.discount_options[d.model_name] || []
                    })));
                } else {
                    this.model_discounts = [];
                }
            }
            this.dialog = true;
        },
        close() {
            this.dialog = false;
            this.model_discounts = [];
            this.promotionId = null;
        },
        async submit() {
            this.loading = true;

            // filter และ map เฉพาะ model_name, model_id (ไม่เอา list)
            const filteredDiscounts = this.model_discounts
                .filter(d => d.model && d.model_id)
                .map(({ model, model_id }) => ({ model_name: model, model_id }));

            // สร้าง unique model types จาก model_discounts
            const uniqueModels = [...new Set(filteredDiscounts.map(d => d.model_name))];

            const payload = {
                model_discounts: filteredDiscounts,
                model_scope_enabled: filteredDiscounts.length > 0 ? 1 : 0,
                model_scopes: uniqueModels.join(','),
            };

            const res = await PromotionService.updatePromotion(this.promotionId, payload);

            if (!res.error) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                this.$emit('refresh');
                this.close();
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
        removeDiscount(index) {
            this.model_discounts.splice(index, 1);
        },
        addDiscount() {
            this.model_discounts.push({ model: null, model_id: null, list: [] });
        },
        updateDiscount(discount) {
            discount.model_id = null;
            discount.list = this.discount_options[discount.model];
        },
        initDiscountOptions(providerId) {
            const sport = [];
            const court = [];
            const court_type = [];

            // หา provider จาก providers list
            const provider = this.providers.find(p => p.id === providerId);
            if (!provider) {
                return;
            }

            // ดึง sport จาก provider_sports
            if (provider.provider_sports) {
                for (const sportData of provider.provider_sports) {
                    sport.push({
                        value: sportData.sport_id,
                        title: sportData.sport?.name || `Sport ${sportData.sport_id}`
                    });
                }
            }

            // ดึง court_type และ court จาก court_types
            if (provider.court_types) {
                for (const courtTypeData of provider.court_types) {
                    court_type.push({
                        value: courtTypeData.id,
                        title: courtTypeData.name
                    });

                    // ดึง courts จาก court_type
                    if (courtTypeData.courts) {
                        for (const courtData of courtTypeData.courts) {
                            court.push({
                                value: courtData.id,
                                title: courtData.name
                            });
                        }
                    }
                }
            }

            this.discount_options = {
                sport,
                court,
                court_type
            };
        },
    }
}
</script>

<style></style>