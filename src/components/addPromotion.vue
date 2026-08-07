<template>
    <v-dialog v-model="dialog" width="700px" persistent>
        <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
                {{ id ? 'แก้ไขโปรโมชั่น' : 'เพิ่มโปรโมชั่น' }}
                <v-btn variant="text" icon="mdi-close" color="primary" @click="close" />
            </v-card-title>
            <v-card-text style="max-height: calc(100dvh - 200px); overflow: auto;">
                <v-form ref="form" v-model="isValid">
                    <v-row dense>
                        <v-col cols="12">
                            <v-select label="ประเภท Code" variant="solo"
                                :items="[{ title: 'Matchday', value: 1 }, { title: 'Provider', value: 0 }]"
                                v-model="formData.is_matchday" />
                        </v-col>
                        <v-col cols="6">
                            <v-autocomplete v-model="formData.provider_id" :items="providers" item-title="fullname"
                                item-value="id" label="สนาม" clearable variant="solo"
                                @update:model-value="initDiscountOptions" />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field v-model="formData.name" label="รหัสโปรโมชั่น" :rules="[rules.required]"
                                required variant="solo" />
                        </v-col>
                        <v-col cols="4" class="d-flex">
                            <v-select v-model="formData.type" label="ประเภทการลด" :rules="[rules.required]" required
                                variant="solo"
                                :items="[{ title: 'เปอร์เซ็นต์(%)', value: 'percent' }, { title: 'บาท(THB)', value: 'value' }]" />
                        </v-col>
                        <v-col cols="4">
                            <v-combobox v-model="formData.value" :items="[20, 50, 70, 100]" label="เลือกหรือพิมพ์จำนวน"
                                type="number" hide-detail variant="solo"
                                :rules="[rules.required, rules.positiveNumber]" />
                        </v-col>
                        <v-col cols="4">
                            <v-combobox v-model="formData.max_reduction" :items="[20, 50, 70, 100]"
                                label="ลดสูงสุดไม่เกิน(บาท)" type="number" hide-detail variant="solo"
                                :rules="[rules.validatePositiveOrNull]" :disabled="formData.type !== 'percent'" />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field v-model="formData.active_duration" label="ชั่วโมงที่ลด (นาที)"
                                :rules="[rules.required, rules.positiveNumber]" required type="number" variant="solo" />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field v-model="formData.total_use" label="จำนวนสูงสุด"
                                :rules="[rules.required, rules.positiveNumber]" required variant="solo" type="number" />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field v-model="formData.user_limit" label="จำนวนการใช้งานต่อคน"
                                :rules="[rules.required, rules.positiveNumber]" required variant="solo" type="number" />
                        </v-col>

                        <v-col cols="12">
                            <p>วันที่ใช้งานได้</p>
                        </v-col>
                        <v-col cols="6">
                            <VueDatePicker placeholder="เริ่ม" :enable-time-picker="false" auto-position="top"
                                auto-apply v-model="formData.expire_start" locale="th" format="dd-MM-yyyy"
                                :min-date="new Date()" :rules="[rules.required]" />
                        </v-col>
                        <v-col cols="6">
                            <VueDatePicker placeholder="สิ้นสุด" :enable-time-picker="false" auto-position="top"
                                auto-apply v-model="formData.expire_end" locale="th" format="dd-MM-yyyy"
                                :min-date="new Date()" :rules="[rules.required]" />
                        </v-col>
                        <v-col cols="12" class="pt-0">
                            <div class="d-flex flex-wrap ga-2 align-center">
                                <v-btn class="all-day-btn" size="small" variant="text"
                                    :style="getAllDayBtnStyle(isAllServingSelected)" rounded="pill" type="button"
                                    @click="toggleAllServingDays">
                                    ทุกวัน
                                </v-btn>
                                <v-btn class="day-btn" v-for="day in dayOptions" :key="`serving-${day.value}`"
                                    size="small" :color="isServingSelected(day.value) ? day.color : 'grey-lighten-1'"
                                    :variant="isServingSelected(day.value) ? 'flat' : 'outlined'" rounded="pill"
                                    @click="toggleServingDay(day.value)">
                                    {{ day.title }}
                                </v-btn>
                            </div>
                        </v-col>
                        <v-col cols="6">
                            <v-select v-model="servingStartTime" :items="timeOptions" label="เวลาเริ่มจอง"
                                variant="solo"  />
                        </v-col>
                        <v-col cols="6">
                            <v-select v-model="servingEndTime" :items="timeOptions" label="เวลาสิ้นสุดจอง"
                                variant="solo"  />
                        </v-col>

                        <v-col cols="12">
                            <p>วันที่เล่น</p>
                        </v-col>
                        <v-col cols="6">
                            <VueDatePicker placeholder="เริ่ม" :enable-time-picker="false" auto-position="top"
                                auto-apply v-model="formData.duration_start" locale="th" format="dd-MM-yyyy"
                                :min-date="new Date()" />
                        </v-col>
                        <v-col cols="6">
                            <VueDatePicker placeholder="สิ้นสุด" :enable-time-picker="false" auto-position="top"
                                auto-apply v-model="formData.duration_end" locale="th" format="dd-MM-yyyy"
                                :min-date="new Date()" />
                        </v-col>
                        <v-col cols="12" class="pt-0">
                            <div class="d-flex flex-wrap ga-2 align-center">
                                <v-btn class="all-day-btn" size="small" variant="text"
                                    :style="getAllDayBtnStyle(isAllBookableSelected)" rounded="pill" type="button"
                                    @click="toggleAllBookableDays">
                                    ทุกวัน
                                </v-btn>
                                <v-btn class="day-btn" v-for="day in dayOptions" :key="`bookable-${day.value}`"
                                    size="small" :color="isBookableSelected(day.value) ? day.color : 'grey-lighten-1'"
                                    :variant="isBookableSelected(day.value) ? 'flat' : 'outlined'" rounded="pill"
                                    @click="toggleBookableDay(day.value)">
                                    {{ day.title }}
                                </v-btn>
                            </div>
                        </v-col>
                        <v-col cols="6">
                            <v-select v-model="bookableStartTime" :items="timeOptions" label="เวลาเริ่มเล่น"
                                variant="solo" />
                        </v-col>
                        <v-col cols="6">
                            <v-select v-model="bookableEndTime" :items="timeOptions" label="เวลาสิ้นสุดเล่น"
                                variant="solo"  />
                        </v-col>

                        <v-col cols="12">
                            <div>
                                <label style="text-align: start;">ส่วนลดตามประเภท <v-btn size="x-small" color="primary"
                                        @click="addDiscount">เพิ่ม</v-btn></label>
                                <v-table height="200px" fixed-header>
                                    <thead>
                                        <tr>
                                            <th>ประเภท</th>
                                            <th>ชื่อ</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(discount, index) in model_discounts" :key="index">
                                            <td style="width: 200px; padding: 10px 5px;">
                                                <v-select variant="solo" v-model="discount.model" :items="model_options"
                                                    @update:model-value="updateDiscount(discount)" hide-details />
                                            </td>
                                            <td style="padding: 10px 5px;">
                                                <v-select variant="solo" :disabled="!discount.model"
                                                    v-model="discount.model_id" :items="discount.list"
                                                    item-value="value" item-title="title" hide-details />
                                            </td>
                                            <td style="text-align: right; width: 50px; padding: 10px 5px;">
                                                <v-btn @click="removeDiscount(index)" color="primary">ลบ</v-btn>
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </div>
                        </v-col>

                        <v-col cols="6">
                            <v-checkbox label="User can activate" color="primary" hide-details
                                v-model="formData.owner_available" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    @click="submitForm"
                    :disabled="!isValid || !formData.expire_start || !formData.expire_end"
                    color="primary"
                    :loading="loading"
                >
                    บันทึก
                </v-btn>
                <v-btn @click="close">ยกเลิก</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { toRaw } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import PromotionService from '../api/PromotionService';
import moment from 'moment';
import ConsoleService from '../api/ConsoleService';
import Swal from 'sweetalert2';

const ALL_DOW = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_FORM_DATA = () => ({
    provider_id: null,
    active_duration: 60,
    type: 'percent',
    total_use: 10,
    user_limit: 1,
    value: 100,
    max_reduction: null,
    owner_available: false,
    is_matchday: 0,
    duration_end: null,
    duration_start: null,
    expire_end: null,
    expire_start: null,
    name: null,
    serving_period: null,
    serving_dow: null,
    bookable_time: null,
    bookable_dow: null
});

export default {
    name: 'addPromotion',
    components: { VueDatePicker },
    emits: ['refresh'],
    data() {
        return {
            dialog: false,
            model_discounts: [],
            discount_options: {
                sport: [
                    { value: 1, title: 'ฟุตบอล' },
                    { value: 2, title: 'บาสเก็ตบอล' },
                    { value: 3, title: 'แบดมินตัน' }
                ],
                court: [
                    { value: 1, title: 'สนามหญ้าเทียม' },
                    { value: 2, title: 'สนามบาสเก็ตบอล' },
                    { value: 3, title: 'สนามฟุตซอล' }
                ],
                court_type: [
                    { value: 1, title: 'สนามหญ้าเทียม' },
                    { value: 2, title: 'สนามบาสเก็ตบอล' },
                    { value: 3, title: 'สนามฟุตซอล' }
                ]
            },
            model_options: [
                { title: 'กีฬา', value: 'sport' },
                // { title: 'สนาม', value: 'court' },
                { title: 'ประเภทสนาม', value: 'court_type' }
            ],
            rules: {
                required: (v) => !!v || 'ช่องนี้จำเป็นต้องกรอก',
                email: (v) =>
                    /.+@.+\..+/.test(v) || 'E-mail must be valid',
                positiveNumber: (v) =>
                    (!isNaN(v) && Number(v) >= 0) || 'ต้องเป็นตัวเลขที่ไม่ต่ํากว่า 0',
                validatePositiveOrNull: (value) =>
                    value === null || (typeof value === 'number' && value > 0),

            },
            formData: {
                provider_id: null,
                active_duration: 60,
                type: 'percent',
                total_use: 10,
                user_limit: 1,
                value: 100,
                max_reduction: null,
                owner_available: false,
                is_matchday: 0,
                duration_end: null,
                duration_start: null,
                expire_end: null,
                expire_start: null,
                name: null,
            },
            dayOptions: [
                { title: 'อา', value: 0, color: 'red-darken-1' },
                { title: 'จ', value: 1, color: 'amber-darken-2' },
                { title: 'อ', value: 2, color: 'pink-darken-1' },
                { title: 'พ', value: 3, color: 'green-darken-1' },
                { title: 'พฤ', value: 4, color: 'orange-darken-2' },
                { title: 'ศ', value: 5, color: 'blue-darken-1' },
                { title: 'ส', value: 6, color: 'deep-purple-darken-1' }
            ],
            timeOptions: [],
            servingStartTime: null,
            servingEndTime: null,
            bookableStartTime: null,
            bookableEndTime: null,
            selectedServingDow: [],
            selectedBookableDow: [],
            formData: DEFAULT_FORM_DATA(),
            isValid: false,
            providers: [],
            search: null,
            loading: false,
            id: null,
            isOpeningEdit: false
        };
    },
    watch: {
        'formData.provider_id'() {
            if (this.isOpeningEdit) {
                return;
            }
            this.model_discounts = [];
        },
        servingStartTime() {
            this.syncScheduleFields();
        },
        servingEndTime() {
            this.syncScheduleFields();
        },
        bookableStartTime() {
            this.syncScheduleFields();
        },
        bookableEndTime() {
            this.syncScheduleFields();
        },
        selectedServingDow: {
            deep: true,
            handler() {
                this.syncScheduleFields();
            }
        },
        selectedBookableDow: {
            deep: true,
            handler() {
                this.syncScheduleFields();
            }
        }
    },
    computed: {
        isAllServingSelected() {
            return this.selectedServingDow.length === ALL_DOW.length;
        },
        isAllBookableSelected() {
            return this.selectedBookableDow.length === ALL_DOW.length;
        }
    },
    methods: {
        addPromotion() {
            this.$refs.add_promotion.open();
        },
        buildTimeOptions() {
            const options = [];
            for (let hour = 0; hour < 24; hour += 1) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const h = String(hour).padStart(2, '0');
                    const m = String(minute).padStart(2, '0');
                    options.push(`${h}:${m}`);
                }
            }
            this.timeOptions = options;
        },
        parsePeriod(period, fallbackStart = null, fallbackEnd = null) {
            if (!period || typeof period !== 'string' || !period.includes('-')) {
                return { start: fallbackStart, end: fallbackEnd };
            }
            const [start, end] = period.split('-');
            return {
                start: start || fallbackStart,
                end: end || fallbackEnd
            };
        },
        parseDow(dow) {
            if (!dow) return [];
            if (Array.isArray(dow)) {
                return [...new Set(dow.map(Number).filter((v) => !Number.isNaN(v)))].sort((a, b) => a - b);
            }
            return [...new Set(String(dow).split(',').map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v)))].sort((a, b) => a - b);
        },
        isServingSelected(dow) {
            return this.selectedServingDow.includes(dow);
        },
        isBookableSelected(dow) {
            return this.selectedBookableDow.includes(dow);
        },
        toggleServingDay(dow) {
            if (this.isServingSelected(dow)) {
                this.selectedServingDow = this.selectedServingDow.filter((d) => d !== dow);
            } else {
                this.selectedServingDow = [...this.selectedServingDow, dow].sort((a, b) => a - b);
            }
        },
        toggleBookableDay(dow) {
            if (this.isBookableSelected(dow)) {
                this.selectedBookableDow = this.selectedBookableDow.filter((d) => d !== dow);
            } else {
                this.selectedBookableDow = [...this.selectedBookableDow, dow].sort((a, b) => a - b);
            }
        },
        toggleAllServingDays() {
            this.selectedServingDow = this.isAllServingSelected ? [] : [...ALL_DOW];
        },
        toggleAllBookableDays() {
            this.selectedBookableDow = this.isAllBookableSelected ? [] : [...ALL_DOW];
        },
        syncScheduleFields() {
            const hasServingDow = this.selectedServingDow.length > 0;
            const hasBookableDow = this.selectedBookableDow.length > 0;
            const servingPeriod = hasServingDow && this.servingStartTime && this.servingEndTime
                ? `${this.servingStartTime}-${this.servingEndTime}`
                : null;
            const bookableTime = hasBookableDow && this.bookableStartTime && this.bookableEndTime
                ? `${this.bookableStartTime}-${this.bookableEndTime}`
                : null;
            this.formData.serving_period = servingPeriod;
            this.formData.bookable_time = bookableTime;
            this.formData.serving_dow = hasServingDow ? this.selectedServingDow.join(',') : null;
            this.formData.bookable_dow = hasBookableDow ? this.selectedBookableDow.join(',') : null;
        },
        getAllDayBtnStyle(isSelected) {
            return {
                color: isSelected ? '#000000' : '#9e9e9e',
                backgroundColor: 'transparent'
            };
        },
        model_id_options() {
            if (this.model_discounts.length === 0) return [];
            const model = this.model_discounts[this.model_discounts.length - 1].model;
            return this.discount_options[model];
        },
        removeDiscount(index) {
            this.model_discounts.splice(index, 1);
        },
        addDiscount() {
            this.model_discounts.push({ model: null, model_id: null });
        },
        updateDiscount(discount) {
            discount.model_id = null;
            discount.list = this.discount_options[discount.model];
        },
        open(data) {
            if (data) {
                this.isOpeningEdit = true;
                this.id = data.id;
                this.formData = {
                    provider_id: data.provider_id,
                    active_duration: data.active_duration,
                    type: data.type,
                    total_use: data.total_use,
                    user_limit: data.user_limit,
                    value: data.value,
                    max_reduction: data.condition?.max_reduction || null,
                    owner_available: data.owner_avaluable,
                    is_matchday: data.is_matchday,
                    duration_end: data.duration_end,
                    duration_start: data.duration_start,
                    expire_end: data.expire_end,
                    expire_start: data.expire_start,
                    name: data.name,
                    serving_period: data.serving_period || null,
                    serving_dow: data.serving_dow || null,
                    bookable_time: data.bookable_time || null,
                    bookable_dow: data.bookable_dow || null
                };

                const servingPeriod = this.parsePeriod(this.formData.serving_period);
                this.servingStartTime = servingPeriod.start;
                this.servingEndTime = servingPeriod.end;

                const bookablePeriod = this.parsePeriod(this.formData.bookable_time);
                this.bookableStartTime = bookablePeriod.start;
                this.bookableEndTime = bookablePeriod.end;

                this.selectedServingDow = this.parseDow(data.serving_dow);
                this.selectedBookableDow = this.parseDow(data.bookable_dow);
                this.syncScheduleFields();

                this.initDiscountOptions(data.provider_id);

                if (data.model_discounts && data.model_discounts.length > 0) {
                    this.model_discounts = toRaw(data.model_discounts.map((d) => ({
                        model: d.model_name,
                        model_id: d.model_id,
                        list: this.discount_options[d.model_name] || []
                    })));
                } else {
                    this.model_discounts = [];
                }

                this.$nextTick(() => {
                    this.isOpeningEdit = false;
                });
            } else {
                this.id = null;
                this.clean();
            }

            this.dialog = true;
        },
        close() {
            this.dialog = false;
            this.clean();
        },
        clean() {
            this.id = null;
            this.formData = DEFAULT_FORM_DATA();
            this.servingStartTime = null;
            this.servingEndTime = null;
            this.bookableStartTime = null;
            this.bookableEndTime = null;
            this.selectedServingDow = [];
            this.selectedBookableDow = [];
            this.model_discounts = [];
            this.isValid = false;
        },
        async submitForm() {
            this.loading = true;
            if (!this.formData.expire_start || !this.formData.expire_end) {
                this.loading = false;
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สำเร็จ',
                    text: 'กรุณาเลือกวันที่ใช้งานได้ (เริ่ม/สิ้นสุด)',
                    confirmButtonText: 'OK'
                });
                return;
            }

            const filteredDiscounts = this.model_discounts
                .filter((d) => d.model && d.model_id)
                .map(({ model, model_id }) => ({ model_name: model, model_id }));
            const uniqueModels = [...new Set(filteredDiscounts.map((d) => d.model_name))];

            const servingPeriodPayload = this.servingStartTime && this.servingEndTime
                ? `${this.servingStartTime}-${this.servingEndTime}`
                : null;
            const bookableTimePayload = this.bookableStartTime && this.bookableEndTime
                ? `${this.bookableStartTime}-${this.bookableEndTime}`
                : null;
            const servingDowPayload = this.selectedServingDow.length ? this.selectedServingDow.join(',') : null;
            const bookableDowPayload = this.selectedBookableDow.length ? this.selectedBookableDow.join(',') : null;

            const payload = {
                ...this.formData,
                expire_start: this.formData.expire_start ? moment(this.formData.expire_start).format('YYYY-MM-DD 00:00:00') : null,
                expire_end: this.formData.expire_end ? moment(this.formData.expire_end).format('YYYY-MM-DD 23:59:59') : null,
                duration_end: this.formData.duration_end ? moment(this.formData.duration_end).format('YYYY-MM-DD 23:59:59') : null,
                duration_start: this.formData.duration_start ? moment(this.formData.duration_start).format('YYYY-MM-DD 00:00:00') : null,
                serving_period: servingPeriodPayload,
                bookable_time: bookableTimePayload,
                serving_dow: servingDowPayload,
                bookable_dow: bookableDowPayload,
                model_discounts: filteredDiscounts,
                model_scope_enabled: filteredDiscounts.length > 0 ? 1 : 0,
                model_scopes: uniqueModels.join(',')
            };

            let res;
            if (this.id) {
                res = await PromotionService.updatePromotion(this.id, payload);
            } else {
                res = await PromotionService.createPromotion(payload);
            }

            if (!res.error) {
                this.close();
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สำเร็จ',
                    text: res.message,
                    confirmButtonText: 'OK'
                });
            }
            this.loading = false;
        },
        async getProviders() {
            const data = await ConsoleService.getProviders();
            this.providers = [{ id: null, fullname: 'ทั้งหมด' }, ...data];
        },
        initDiscountOptions(providerId) {
            const sport = [];
            const court = [];
            const court_type = [];

            const provider = this.providers.find((p) => p.id === providerId);
            if (!provider) {
                return;
            }

            if (provider.provider_sports) {
                for (const sportData of provider.provider_sports) {
                    sport.push({
                        value: sportData.sport_id,
                        title: sportData.sport?.name || `Sport ${sportData.sport_id}`
                    });
                }
            }

            if (provider.court_types) {
                for (const courtTypeData of provider.court_types) {
                    court_type.push({
                        value: courtTypeData.id,
                        title: courtTypeData.name
                    });

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
        }
    },
    mounted() {
        this.buildTimeOptions();
        this.getProviders();
    }
};
</script>

<style scoped>
.my-swal-zindex {
    z-index: 9999 !important;
}

.all-day-btn {
    background-color: transparent !important;
    border: none !important;
    border-radius: 999px !important;
}
</style>
