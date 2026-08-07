<template>
    <div class="mx-5">
        <v-row>
            <v-col cols="12" md="5">
                <v-card-title class="pl-0">Create Event</v-card-title>
                <v-container>
                    <v-form ref="event_form">
                        <v-row>
                            <v-col cols="6">
                                <v-autocomplete v-model="form_data.provider_id" :items="providers" item-title="fullname"
                                    item-value="id" label="สนาม" variant="outlined" color="primary" density="compact"
                                    :rules="validate_rules.provider">
                                    <template v-slot:item="{ props, item }">
                                        <v-list-item v-bind="props" :title="`(${item.value}) ${item.title}`">
                                        </v-list-item>
                                    </template>
                                </v-autocomplete>
                            </v-col>
                            <v-col cols="6">
                                <TextField v-model="form_data.name" label="ชื่อก๊วน" :rules="validate_rules.name">
                                </TextField>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="6">
                                <v-select v-model="form_data.days" :items="days" item-title="name" item-value="id"
                                    label="วัน" multiple variant="outlined" color="primary" density="compact" dense :single-line="true" :rules="validate_rules.days">
                                </v-select>
                            </v-col>
                            <v-col cols="3">
                                <TextField v-model="form_data.time_start" label="เวลาเริ่ม" type="time"
                                    :rules="validate_rules.start_time"></TextField>
                            </v-col>
                            <v-col cols="3">
                                <TextField v-model="form_data.time_end" label="เวลาสิ้นสุด" type="time"
                                    :rules="validate_rules.end_time"></TextField>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="6">
                                <TextField v-model="form_data.contact_name" label="ชื่อผู้ติดต่อ"></TextField>
                            </v-col>
                            <v-col cols="6">
                                <TextField v-model="form_data.phone_number" label="เบอร์โทร"></TextField>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="6">
                                <TextField v-model="form_data.ticket_price" label="ราคาต่อหัว" type="number"></TextField>
                            </v-col>
                            <v-col cols="6">
                                <v-select v-model="form_data.week" :items="weeks" label="ต่อเนื่องรายสัปดาห์"
                                    variant="outlined" color="primary" density="compact" dense>
                                </v-select>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <v-textarea v-model="form_data.message" label="ข้อความเพิ่มเติม" density="compact" rows="3"
                                    color="primary" variant="outlined"></v-textarea>
                            </v-col>
                        </v-row>
                        <v-row>
                            <ImageUpload @changed="onImageChnaged" :value="form_data.photo" width="150px">

                            </ImageUpload>
                        </v-row>
                        <div class="d-flex justify-end mt-5">
                            <v-btn prepend-icon="mdi-plus" color="primary" @click="createEvent" :loading="progress_loading">
                                ตกลง
                            </v-btn>
                        </div>
                    </v-form>
                </v-container>
            </v-col>
            <v-divider vertical class="h-full"></v-divider>
            <v-col cols="12" md="7">
                <v-card-title class="pl-0">Events</v-card-title>
                <DataTable 
                    :loading="table_loading"
                    :pagination="event_pagination"
                    :columns="event_columns"
                    :search="{
                        placeholder: 'ค้นหาก๊วน',
                    }"
                    @on-search="searchChanged"
                    @page-changed="updatePage"
                    @delete="deleteEvent"
                >
                    <template #top-bar>
                        <v-row>
                            <v-col cols="5">
                                <v-autocomplete v-model="filter_provider" :items="providers" item-title="fullname" clearable
                                    item-value="id" label="สนาม" variant="outlined" color="primary" density="compact">
                                    <template v-slot:item="{ props, item }">
                                        <v-list-item v-bind="props" :title="`(${item.value}) ${item.title}`" :value="item.value">
                                        </v-list-item>
                                    </template>
                                </v-autocomplete>
                            </v-col>
                            <!-- datetime range -->
                            <v-col cols="4">
                                    <TextField v-model="filter_date" type="date" label="วันที่"></TextField>
                            </v-col>
                            <v-col>
                                <v-btn
                                    @click="refresh"
                                    color="blue"
                                    variant="outlined"
                                    size="large"
                                >
                                    <v-icon>mdi-refresh</v-icon>
                                </v-btn>
                            </v-col>
                        </v-row>
                    </template>
                    <template #build-provider="{ item }">
                        <label>{{ item.provider.fullname }}</label>
                    </template>
                    <template #build-name="{ item }">
                        <label>{{ item.preference.name }}</label>
                    </template>
                    <template #build-datetime="{ item }">
                        <label>{{ datetimeFormat(item.time_start) }} {{ datetimeFormat(item.time_start, 'HH:mm') }} - {{ datetimeFormat(item.time_end, 'HH:mm') }}</label>
                    </template>
                </DataTable>
            </v-col>
        </v-row>
    </div>
    <v-snackbar v-model="create_event_snackbar" location="top" :color="create_event_status">
        {{ create_event_status == 'success' ? 'สร้างก๊วนสำเร็จ' : 'สร้างก๊วนไม่สำเร็จ' }}
    </v-snackbar>
    <v-snackbar v-model="delete_event_snackbar" location="top" :color="delete_event_status">
        {{ delete_event_status == 'success' ? 'ลบก๊วนสำเร็จ' : 'ลบก๊วนไม่สำเร็จ' }}
    </v-snackbar>
</template>

<script>
import ConsoleService from '../api/ConsoleService';
import moment from 'moment';

import TextField from '../components/TextField.vue';
import ImageUpload from '@/components/ImageUpload.vue';
import DataTable from '@/components/DataTable.vue';
export default {
    components: {
        TextField,
        ImageUpload,
        DataTable,
    },
    data() {
        return {
            form_data: {
                provider_id: null,
                name: null,
                contact_name: null,
                phone_number: null,
                days: [],
                time_start: null,
                time_end: null,
                ticket_price: null,
                week: null,
                message: null,
                photo: null,
            },
            validate_rules: {
                provider: [
                    value => !!value || 'กรุณาเลือกสนาม'
                ],
                name: [
                    value => !!value || 'กรุณากรอกชื่อก๊วน'
                ],
                days: [
                    value => value.length > 0 || 'กรุณาเลือกวัน'
                ],
                start_time: [
                    value => !!value || 'กรุณากรอกเวลาเริ่ม'
                ],
                end_time: [
                    value => !!value || 'กรุณากรอกเวลาสิ้นสุด'
                ],
            },
            providers: [],
            query_provider: null,
            days: [
                { id: 0, name: 'อาทิตย์' },
                { id: 1, name: 'จันทร์' },
                { id: 2, name: 'อังคาร' },
                { id: 3, name: 'พุธ' },
                { id: 4, name: 'พฤหัสบดี' },
                { id: 5, name: 'ศุกร์' },
                { id: 6, name: 'เสาร์' },
            ],
            weeks: [...Array.from({ length: 13 }, (_, i) => i), 24],
            progress_loading: false,
            create_event_snackbar: false,
            delete_event_snackbar: false,
            create_event_status: null,
            delete_event_status: null,
            event_pagination: {},
            filter_provider: null,
            filter_date: null,
            filter_name: null,
            event_columns: [
                {
                    title: 'ID',
                    key: 'id',
                    sortable: false,
                },
                {
                    title: 'สนาม',
                    key: 'provider',
                    is_build: true,
                    sortable: false,
                },
                {
                    title: 'ชื่อก๊วน',
                    key: 'name',
                    is_build: true,
                    sortable: false,
                },
                {
                    title: 'วัน-เวลา',
                    key: 'datetime',
                    is_build: true,
                    sortable: false,
                },
                {
                    title: 'ราคาต่อหัว',
                    key: 'ticket_price',
                    width: '13%',
                    sortable: false,
                },
                {
                    title: 'Action',
                    key: 'action',
                    width: '10%',
                    sortable: false,
                    actions: [
                        // {
                        //     name: 'edit',
                        //     icon: 'mdi-pencil',
                        //     color: 'blue',
                        // },
                        {
                            name: 'delete',
                            icon: 'mdi-delete',
                            color: 'red',
                        }
                    ]
                }
            ],
            table_loading: false,
        }
    },
    watch: {
        filter_provider: function (val) {
                this.getEvents({ page: 1 })
        },
        filter_date: function (val) {
                this.getEvents({ page: 1 })
        }
    },
    methods: {
        datetimeFormat(date, format = 'DD-MM-YYYY') {
            return moment(date).format(format)
        },
        async createEvent() {
            const { valid } = await this.$refs.event_form.validate()
            if (!valid) return;

            this.progress_loading = true
            try {
                await ConsoleService.createEvent(this.form_data)
                this.create_event_status = 'success'
                this.getEvents({ page: 1 })
                this.clearForm()
            } catch (error) {
                this.create_event_status = 'error'
            }
            this.create_event_snackbar = true
            this.progress_loading = false
        },
        async getProviders() {
            const data = await ConsoleService.getProviders()
            this.providers = data
        },
        onImageChnaged(image) {
            this.form_data.photo = image
        },
        clearForm() {
            this.form_data = {
                provider_id: null,
                name: null,
                contact_name: null,
                phone_number: null,
                days: [],
                time_start: null,
                time_end: null,
                ticket_price: null,
                week: null,
                message: null,
                photo: null,
            }
        },
        searchChanged(query) {
            this.filter_name = query
            this.getEvents({ page: 1 })
        },
        updatePage(page) {
            this.getEvents({ page })
        },
        async getEvents({ page }) {
            var body = {}
            body.page = page
            if (this.filter_provider) {
                body.provider_id = this.filter_provider
            }
            if (this.filter_date) {
                body.date = this.filter_date
            }
            if (this.filter_name) {
                body.name = this.filter_name
            }
            this.table_loading = true
            const data = await ConsoleService.getEvents(body)
            this.table_loading = false
            this.event_pagination = data
        },
        async deleteEvent(item) {
            try{
                await ConsoleService.deleteEvent(item.id)
                this.delete_event_status = 'success'
                this.getEvents({ page: 1 })
            }catch(error) {
                console.log(error)
                this.delete_event_status = 'error'
            }
            this.delete_event_snackbar = true
        },
        refresh() {
            this.getEvents({ page: 1 })
        }
    },
    mounted() {
        this.getEvents({ page: 1})
        this.getProviders()
    }
}
</script>
