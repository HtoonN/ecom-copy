<template>
    <v-card-title>
        สร้างโปรโมชั่น
    </v-card-title>
    <v-card-text class="mt-4">
        <v-row dense>
            <v-col cols="7" class="d-flex ga-4 align-center">
             <v-text-field 
                label="ค้าหารหัสโปรโมชั่น" 
                v-model="search"  
                hide-details 
                variant="solo" 
                single-line clearable 
                @update:model-value = "() => {
                        pagination.page = 1;
                        fetchData();
                    }">
                    <template v-slot:prepend>
                    <v-autocomplete
                        v-model="selected_provider"
                        @update:model-value="fetchData"
                        :items="providers"
                        item-title="fullname"
                        item-value="id"
                        label="Provider"
                        clearable
                        variant="solo"
                        style="width: 200px"
                        hide-details
                    /> 
                    </template>
                    <template v-slot:append-inner>
                        <v-icon @click="fetchData">mdi-magnify</v-icon>
                    </template>
                </v-text-field>
                <v-btn color="blue" variant="outlined" @click="fetchData"><v-icon>mdi-refresh</v-icon></v-btn>
            </v-col>
            <v-col cols="5" class="d-flex justify-end ga-2 align-center">
                <v-btn prepend-icon="mdi-plus" color="primary" @click="addPromotion">เพิ่มโปรโมชั่น</v-btn>
            <v-btn prepend-icon="mdi-file-import" variant="outlined" color="primary" @click="openImportDialog">Import Promotion</v-btn><v-btn 
                prepend-icon="mdi-microsoft-excel" 
                variant="outlined" 
                color="#1D6F42" 
                @click="exportExcel" 
                :loading="exporting"
            >Export</v-btn>
            </v-col>
        </v-row>
    </v-card-text>
    <v-card-text>
    <v-tabs
      bg-color="primary"
    >
      <v-tab  @click="() => { is_expired = 0; pagination.data = []; pagination.page = 1; this.fetchData() }">Active</v-tab>
      <v-tab  @click="() => { is_expired = 1; pagination.data = []; pagination.page = 1; this.fetchData() }">Expire</v-tab>
        </v-tabs>
        <v-window class="mt-4">
            <v-window-item>
            <v-data-table-server :headers="headers" :items="pagination.data" height="calc(100dvh - 390px)" fixed-header :items-length="data.length">
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
                <template v-slot:item.delete = {item}>
                    <v-btn color="primary"  @click="deletePromotion(item.id, item.name)"><v-icon>mdi-delete</v-icon></v-btn>
                    </template>
                <template v-slot:item.edit = {item}>
                    <v-btn color="primary"  @click="updatePromotion(item)"><v-icon>mdi-pencil</v-icon></v-btn>
                    </template>
                <template v-slot:item.no = {index}>
                        {{ index + 1 }}
                    </template>
                <template v-slot:item.discount = {item}>
                        {{ getDiscountValue(item.type, item.value) }}
                    </template>
                <template v-slot:item.active_duration = {item}>
                        {{ item.active_duration }} นาที
                    </template>
                <template v-slot:item.expire_date = {item}>
                        {{ formatRange(item.expire_start, item.expire_end) }}
                    </template>
                <template v-slot:item.duration_date = {item}>
                    {{ item.duration_start && item.duration_end ? formatRange(item.duration_start, item.duration_end) : '-'}}
                    </template>
                <template v-slot:item.is_matchday = {item}>
                        {{ item.is_matchday ? "MatchDay" : "Provider" }}
                    </template>
                <template v-slot:item.condition.max_reduction = {item}>
                        {{ item.condition?.max_reduction ? `${item.condition.max_reduction} บาท` : " " }}
                    </template>
                 <template v-slot:item.display_discount = {item}>
                    <v-btn variant="text" color="primary" @click="openDiscountDetail(item)" size="small">แสดงส่วนลด</v-btn>
                    </template>
                </v-data-table-server>
            </v-window-item>
        </v-window>
    </v-card-text>
    <add-promotion ref="add_promotion" @refresh="successCreateRefresh" />
    <promo-discount-detail ref="promo_discount_detail" :providers="providers" @refresh="fetchData" />
    <v-dialog v-model="importDialog" max-width="1400" persistent>
        <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
                <span>Import Promotion</span>
                <v-btn icon="mdi-close" variant="text" @click="closeImportDialog" />
            </v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12" md="4">
                        <v-autocomplete
                            v-model="importProviderId"
                            @update:model-value="onImportProviderChange"
                            :items="importProviderOptions"
                            item-title="__searchLabel"
                            item-value="id"
                            label="Select Provider"
                            variant="outlined"
                            hide-details="auto"
                            clearable
                            :custom-filter="filterImportProvider"
                            no-data-text="No providers found"
                        />
                    </v-col>
                    <v-col cols="12" md="8">
                        <v-file-input
                            v-model="importFile"
                            accept=".xlsx"
                            label="Select .xlsx file"
                            variant="outlined"
                            prepend-icon="mdi-microsoft-excel"
                            hide-details="auto"
                            :disabled="!importProviderId"
                            @update:model-value="onImportFileChange"
                        />
                    </v-col>
                </v-row>
                <v-alert
                    v-if="!importProviderId"
                    class="mt-3"
                    type="info"
                    variant="tonal"
                    density="comfortable"
                >
                    Please select provider before selecting file.
                </v-alert>
                <v-card class="mt-4" variant="outlined">
                    <v-data-table
                        :headers="importPreviewHeaders"
                        :items="importPreviewRows"
                        :items-per-page="10"
                        height="420"
                        fixed-header
                    />
                </v-card>
            </v-card-text>
            <v-card-actions class="justify-end">
                <span v-if="importSubmitting" class="text-body-2 mr-3">
                    {{ importProgressCurrent }}/{{ importProgressTotal }}
                </span>
                <v-btn
                    color="primary"
                    :disabled="!importPreviewRows.length || importSubmitting"
                    :loading="importSubmitting"
                    @click="submitImportPreview"
                >Import</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import moment from 'moment';
import addPromotion from '../components/addPromotion.vue';
import Swal from 'sweetalert2';
import PromotionService from '../api/PromotionService';
import ConsoleService from '../api/ConsoleService';
import PromoDiscountDetail from '../components/PromoDiscountDetail.vue';
import * as XLSX from 'xlsx-js-style';
export default {
    components: { addPromotion, PromoDiscountDetail },
    name:'createPromotion',
    computed: {
        importProviderOptions() {
            return this.providers
                .filter((provider) => provider.id !== null && provider.id !== undefined)
                .map((provider) => ({
                    ...provider,
                    __searchLabel: `${provider.fullname || provider.name || ''} (${provider.id})`.trim(),
                }));
        }
    },
    data(){
        return {
            headers: [
                { title: 'ลำคับ', key: 'no', sortable: false, align: 'center' },
                { title: 'ประเภท Code', key: 'is_matchday', sortable: false, align: 'center' },
                { title: 'รหัสโปรโมชั่น', key: 'name', sortable: false },
                { title: 'Provider', key: 'provider.fullname', sortable: false },
                { title: 'ส่วนลด', key: 'discount', sortable: false },
                { title: 'ลดสุงสุดไม่เกิน', key: 'condition.max_reduction', sortable: false },
                { title: 'ชั่วโมงที่ลด', key: 'active_duration', sortable: false, align: "center"  },
                { title: 'วันที่ใช้งานได้', key: 'expire_date', sortable: false, align: 'center' },
                { title: 'วันที่จองได้', key: 'duration_date', sortable: false, align: 'center' },
                { title: 'จํานวนคงเหลือ', key: 'remaining', sortable: false, align: "center"  },
                { title: 'จำนวนสูงสุด', key: 'total_use', sortable: false, align: "center"  },
                { title: 'จำนวนการใช้งานต่อคน', key: 'user_limit', sortable: false, align: "center" },
                { title: ' ', key: 'display_discount', sortable: false, align: "center" },
                { title: ' ', key: 'edit', sortable: false },
                { title: ' ', key: 'delete', sortable: false },
            ],
            data: [],
            pagination: {
                page: 1,
                lastPage: 0,
                data: [],
                total: 0,
            },
            search: null,
            providers: [{ name: "provider 1", id: 1 }],
            exporting: false,
            selected_provider: null,
            is_expired: false,
            importDialog: false,
            importProviderId: null,
            importFile: null,
            importPreviewRows: [],
            importSubmitting: false,
            importProgressCurrent: 0,
            importProgressTotal: 0,
            importStatusMessage: '',
            importStatusType: 'info',
            importApiErrors: [],
            importSuccessRows: [],
            importPreviewHeaders: [
                { title: 'no', key: 'preview_row_no', sortable: false },
                { title: 'provider name', key: 'provider_name_or_id', sortable: false },
                { title: 'promotion name', key: 'promotion_name', sortable: false },
                { title: 'type ส่วนลด', key: 'discount_type', sortable: false },
                { title: 'ลดเท่าไหร่', key: 'discount_value', sortable: false },
                { title: 'จำนวนครั้งการใช้งานสูงสุด', key: 'max_usage', sortable: false },
                { title: '1 คนใช้ได้กี่ครั้ง', key: 'usage_per_user', sortable: false },
                { title: 'expire start', key: 'expire_start', sortable: false },
                { title: 'expire end', key: 'expire_end', sortable: false },
                { title: 'duration start', key: 'duration_start', sortable: false },
                { title: 'duration end', key: 'duration_end', sortable: false },
                { title: 'duration user', key: 'duration_user', sortable: false },
            ],
        }
    },
    methods:{
        openImportDialog() {
            this.importDialog = true;
        },
        closeImportDialog() {
            this.forceCloseImportDialog();
        },
        forceCloseImportDialog() {
            this.importDialog = false;
            this.importProviderId = null;
            this.importFile = null;
            this.importPreviewRows = [];
            this.importSubmitting = false;
            this.importProgressCurrent = 0;
            this.importProgressTotal = 0;
            this.importStatusMessage = '';
            this.importStatusType = 'info';
            this.importApiErrors = [];
            this.importSuccessRows = [];
        },
        async onImportFileChange(fileValue) {
            this.importStatusMessage = '';
            this.importStatusType = 'info';
            this.importApiErrors = [];
            const file = Array.isArray(fileValue) ? fileValue[0] : fileValue;
            if (!file || !(file instanceof File)) {
                this.importPreviewRows = [];
                return;
            }
            if (!this.importProviderId) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Provider',
                    text: 'Please select provider before selecting file.',
                    confirmButtonColor: '#e3342f',
                    confirmButtonText: 'OK'
                });
                this.importFile = null;
                this.importPreviewRows = [];
                return;
            }
            try {
                const rows = await this.parsePromotionFile(file);
                const validation = this.validatePromotionRows(rows);
                if (!validation.valid) {
                    this.importPreviewRows = [];
                    this.showImportValidationErrors(validation.errors);
                    return;
                }
                this.importPreviewRows = rows;
                console.log('Import promotion payload:', this.buildImportPayload(rows));
            } catch (error) {
                this.importPreviewRows = [];
                Swal.fire({
                    icon: 'error',
                    title: 'Import Failed',
                    text: error?.message || 'Cannot read .xlsx file or file has no rows.',
                    confirmButtonColor: '#e3342f',
                    confirmButtonText: 'OK'
                });
            }
        },
        onImportProviderChange() {
            this.importStatusMessage = '';
            this.importStatusType = 'info';
            this.importApiErrors = [];
            this.importPreviewRows = [];
            this.importFile = null;
        },
        getSelectedProviderLabel() {
            const provider = this.providers.find((item) => item.id === this.importProviderId);
            if (!provider) return '';
            return provider.fullname || provider.name || String(provider.id || '');
        },
        filterImportProvider(value, query, item) {
            const q = String(query || '').trim().toLowerCase();
            if (!q) return true;
            const raw = item?.raw || {};
            const fields = [value, raw.__searchLabel, raw.fullname, raw.name, raw.id]
                .filter((v) => v !== null && v !== undefined)
                .map((v) => String(v).toLowerCase());
            return fields.some((field) => field.includes(q));
        },
        normalizeNumber(value) {
            if (value === null || value === undefined || value === '') return NaN;
            const normalized = String(value).replace(/,/g, '').trim();
            if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;
            return Number(normalized);
        },
        normalizeDurationUser(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return NaN;
            const minuteTextMatch = raw.match(/^(\d+(?:\.\d+)?)\s*นาที$/);
            if (minuteTextMatch) {
                return Number(minuteTextMatch[1]);
            }
            if (/^\d+(?:\.\d+)?$/.test(raw)) {
                return Number(raw);
            }
            return NaN;
        },
        normalizeDateTimeForPayload(value, isEnd = false) {
            const raw = String(value ?? '').trim();
            if (!raw) return '';

            const withTimeFormats = [
                'YYYY-MM-DD HH:mm:ss',
                'YYYY-MM-DD HH:mm',
                'YYYY-MM-DD HH',
                'YYYY/MM/DD HH:mm:ss',
                'YYYY/MM/DD HH:mm',
                'YYYY/MM/DD HH',
                'DD/MM/YYYY HH:mm:ss',
                'DD/MM/YYYY HH:mm',
                'DD/MM/YYYY HH',
            ];
            const dateOnlyFormats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY'];

            const parsedWithTime = moment(raw, withTimeFormats, true);
            if (parsedWithTime.isValid()) {
                return parsedWithTime.format('YYYY-MM-DD HH:mm:ss');
            }

            const parsedDateOnly = moment(raw, dateOnlyFormats, true);
            if (parsedDateOnly.isValid()) {
                return `${parsedDateOnly.format('YYYY-MM-DD')} ${isEnd ? '23:59:59' : '00:00:00'}`;
            }

            return '';
        },
        validateDiscountType(value) {
            const raw = String(value || '').trim().toLowerCase();
            const compact = raw.replace(/\s+/g, '');
            const allowed = ['value', 'val', 'percent', 'percentage', '%', 'บาท', 'เปอร์เซ็นต์'];
            return allowed.includes(raw) || allowed.includes(compact);
        },
        normalizeHeaderKey(value) {
            return String(value || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[._-]/g, ' ');
        },
        getHeaderAliases() {
            return {
                promotion_name: ['promotion name', 'promotion', 'ชื่อโปรโมชั่น'],
                discount_type: ['type ส่วนลด', 'discount type', 'type', 'ประเภทส่วนลด'],
                discount_value: ['ลดเท่าไหร่', 'discount', 'discount value', 'ส่วนลด'],
                max_usage: [
                    'จำนวนครั้งการใช้งานสูงสุด',
                    'จำนวนครั้งการใช้สูงสุด',
                    'จำนวนการใช้งานสูงสุด',
                    'จำนวนการใช้สูงสุด',
                    'จำนวนสูงสุด',
                    'max usage',
                    'max use',
                    'maximum use',
                    'maximum usage',
                    'total use',
                    'total usage',
                ],
                usage_per_user: ['1 คนใช้ได้กี่ครั้ง', 'usage per user', 'user limit', 'limit per user', 'ใช้ได้กี่ครั้งต่อคน'],
                expire_start: ['expire start', 'time start', 'start time', 'เวลาเริ่ม'],
                expire_end: ['expire end', 'time end', 'end time', 'เวลาสิ้นสุด'],
                duration_start: ['duration start', 'start date', 'วันเริ่ม'],
                duration_end: ['duration end', 'end date', 'วันสิ้นสุด'],
                duration_user: ['duration user', 'user duration', 'ชั่วโมงที่ลด', 'เวลาที่ลด'],
            };
        },
        resolveHeaderIndexes(headerRow) {
            const normalizedHeaders = headerRow.map((h) => this.normalizeHeaderKey(h));
            const aliases = this.getHeaderAliases();
            const result = {};
            const missing = [];

            Object.keys(aliases).forEach((key) => {
                const normalizedAliases = aliases[key].map((alias) => this.normalizeHeaderKey(alias));
                const foundIndex = normalizedHeaders.findIndex((name) => normalizedAliases.includes(name));
                if (foundIndex === -1) {
                    const fallbackIndex = normalizedHeaders.findIndex((name) => {
                        if (key === 'max_usage') {
                            return (
                                (name.includes('จำนวน') && name.includes('สูงสุด')) ||
                                (name.includes('max') && (name.includes('use') || name.includes('usage')))
                            );
                        }
                        return false;
                    });

                    if (fallbackIndex >= 0) {
                        result[key] = fallbackIndex;
                    } else {
                        missing.push(aliases[key][0]);
                    }
                } else {
                    result[key] = foundIndex;
                }
            });

            return { indexes: result, missing };
        },
        detectHeaderRow(sheetRows) {
            const scanLimit = Math.min(sheetRows.length, 10);
            let best = { rowIndex: -1, indexes: {}, missing: ['header'], score: -1 };

            for (let i = 0; i < scanLimit; i += 1) {
                const row = Array.isArray(sheetRows[i]) ? sheetRows[i] : [];
                const resolved = this.resolveHeaderIndexes(row);
                const score = Object.keys(resolved.indexes).length;
                if (score > best.score) {
                    best = { rowIndex: i, indexes: resolved.indexes, missing: resolved.missing, score };
                }
                if (resolved.missing.length === 0) {
                    return { rowIndex: i, indexes: resolved.indexes, missing: [] };
                }
            }

            return { rowIndex: best.rowIndex, indexes: best.indexes, missing: best.missing };
        },
        validatePromotionRows(rows) {
            const errors = [];
            rows.forEach((row, index) => {
                const rowNo = row.__rowNo || (index + 1);
                const rowErrors = [];

                if (!String(row.promotion_name || '').trim()) {
                    rowErrors.push('promotion name is required');
                }
                if (!this.validateDiscountType(row.discount_type)) {
                    rowErrors.push('type ส่วนลด must be Value or Percent');
                }
                if (!Number.isFinite(this.normalizeNumber(row.discount_value))) {
                    rowErrors.push('ลดเท่าไหร่ must be number only');
                }
                if (!Number.isFinite(this.normalizeNumber(row.max_usage))) {
                    rowErrors.push('จำนวนครั้งการใช้งานสูงสุด must be number only');
                }
                if (!Number.isFinite(this.normalizeNumber(row.usage_per_user))) {
                    rowErrors.push('1 คนใช้ได้กี่ครั้ง must be number only');
                }
                if (!String(row.expire_start || '').trim()) {
                    rowErrors.push('expire start is required');
                }
                if (!String(row.expire_end || '').trim()) {
                    rowErrors.push('expire end is required');
                }
                const durationUser = this.normalizeDurationUser(row.duration_user);
                if (!Number.isFinite(durationUser) || durationUser <= 0) {
                    rowErrors.push('duration user must be number or <number> นาที (example: 60 or 60 นาที)');
                }

                if (rowErrors.length) {
                    errors.push(`Row ${rowNo}: ${rowErrors.join(', ')}`);
                }
            });
            return {
                valid: errors.length === 0,
                errors,
            };
        },
        normalizePromotionType(value) {
            const raw = String(value || '').trim().toLowerCase();
            if (raw === 'value' || raw === 'val' || raw === 'บาท') return 'value';
            return 'percent';
        },
        buildImportPayload(rows) {
            return rows.map((row) => ({
                __rowNo: row.__rowNo,
                active_duration: this.normalizeDurationUser(row.duration_user),
                duration_start: this.normalizeDateTimeForPayload(row.duration_start, false),
                duration_end: this.normalizeDateTimeForPayload(row.duration_end, true),
                expire_end: this.normalizeDateTimeForPayload(row.expire_end, true),
                expire_start: this.normalizeDateTimeForPayload(row.expire_start, false),
                is_matchday: 0,
                name: row.promotion_name || '',
                owner_available: false,
                provider_id: this.importProviderId,
                total_use: this.normalizeNumber(row.max_usage),
                type: this.normalizePromotionType(row.discount_type),
                value: this.normalizeNumber(row.discount_value),
                max_reduction: null,
                user_limit: this.normalizeNumber(row.usage_per_user),
                model_discounts: [],
                model_scope_enabled: 0,
                model_scopes: '',
            }));
        },
        async submitImportPreview() {
            const payload = this.buildImportPayload(this.importPreviewRows || []);
            if (!payload.length) return;

            this.importSubmitting = true;
            this.importProgressCurrent = 0;
            this.importProgressTotal = payload.length;
            this.importApiErrors = [];
            this.importSuccessRows = [];
            this.importStatusType = 'info';

            for (let i = 0; i < payload.length; i += 1) {
                this.importProgressCurrent = i + 1;
                this.importStatusMessage = `Importing ${i + 1}/${payload.length}`;
                try {
                    const res = await PromotionService.createPromotion(payload[i]);
                    if (res?.error) {
                        throw new Error(res.message || 'Create promotion failed');
                    }
                    this.importSuccessRows.push(i + 1);
                } catch (error) {
                    const rowNo = i + 1;
                    const message = error?.message || 'Mock API error';
                    this.importApiErrors.push(`Row ${rowNo}: ${message}`);
                    break;
                }
            }

            this.importSubmitting = false;
            this.importProgressCurrent = 0;
            this.importProgressTotal = 0;
            if (this.importApiErrors.length) {
                this.importStatusType = 'error';
                this.importStatusMessage = `Import finished with errors (${payload.length - this.importApiErrors.length}/${payload.length} success)`;
                Swal.fire({
                    icon: 'error',
                    title: 'Import Failed Some Rows',
                    html: `<ul style="margin:0;padding-left:20px;text-align:left;">${this.importApiErrors.map((msg) => `<li>${msg}</li>`).join('')}</ul>`,
                    width: 900,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#e3342f',
                });
            } else {
                this.importStatusType = 'success';
                this.importStatusMessage = `Import success (${payload.length}/${payload.length})`;
                Swal.fire({
                    icon: 'success',
                    title: 'Import Success Rows',
                    text: this.importSuccessRows.join(', '),
                    confirmButtonText: 'OK',
                });
            }

            console.log(payload);
        },
        showImportValidationErrors(errors) {
            const maxShow = 30;
            const list = errors.slice(0, maxShow).map((msg) => `<li style="text-align:left;">${msg}</li>`).join('');
            const moreText = errors.length > maxShow ? `<p style="text-align:left;">...and ${errors.length - maxShow} more rows</p>` : '';
            Swal.fire({
                icon: 'error',
                title: 'Invalid Data In File',
                html: `<ul style="margin:0;padding-left:20px;">${list}</ul>${moreText}`,
                width: 900,
                confirmButtonText: 'OK',
                confirmButtonColor: '#e3342f',
            });
        },
        parsePromotionFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
                        if (!sheetRows.length) {
                            reject(new Error('No rows found in this file.'));
                            return;
                        }

                        const { rowIndex: headerRowIndex, indexes, missing } = this.detectHeaderRow(sheetRows);
                        if (missing.length) {
                            reject(new Error(`Missing required columns: ${missing.join(', ')}`));
                            return;
                        }

                        const providerLabel = this.getSelectedProviderLabel();
                        const normalizedRows = sheetRows
                            .map((row, idx) => ({ row, idx }))
                            .filter((item) => item.idx > headerRowIndex)
                            .filter((item) => Array.isArray(item.row) && item.row.some((cell) => String(cell).trim() !== ''))
                            .map((item) => ({
                                preview_row_no: 0,
                                __rowNo: item.idx + 1,
                                provider_name_or_id: providerLabel,
                                promotion_name: item.row[indexes.promotion_name] ?? '',
                                discount_type: item.row[indexes.discount_type] ?? '',
                                discount_value: item.row[indexes.discount_value] ?? '',
                                max_usage: item.row[indexes.max_usage] ?? '',
                                usage_per_user: item.row[indexes.usage_per_user] ?? '',
                                expire_start: item.row[indexes.expire_start] ?? '',
                                expire_end: item.row[indexes.expire_end] ?? '',
                                duration_start: item.row[indexes.duration_start] ?? '',
                                duration_end: item.row[indexes.duration_end] ?? '',
                                duration_user: item.row[indexes.duration_user] ?? '',
                            }))
                            .map((row, index) => ({
                                ...row,
                                preview_row_no: index + 1,
                            }));
                        if (!normalizedRows.length) {
                            reject(new Error('No rows found in this file.'));
                            return;
                        }
                        resolve(normalizedRows);
                    } catch (e) {
                        reject(new Error('Cannot parse selected .xlsx file.'));
                    }
                };
                reader.onerror = () => reject(new Error('Cannot read selected file.'));
                reader.readAsArrayBuffer(file);
            });
        },
        updatePage(){
            this.fetchData();
        },

        selectPage(pageNo){
            if(!(this.pagination.page == pageNo)){
                this.pagination.page = Number(pageNo);
                this.fetchData();
            }
        },
        addPromotion(){
            this.$refs.add_promotion.open();
        },
        async fetchData(query) {
            const res = await PromotionService.getPromotions({
                ...query,
                page: this.pagination.page,
                name: this.search,
                provider_id: this.selected_provider,
                is_expired: this.is_expired,
            });
            this.pagination = res;
        },
        deletePromotion(id, name){
            Swal.fire({
                title: 'ยืนยันการลบ',
                text: `คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่น ( ${name} )`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e3342f',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก',
            }).then( async (result) => {
                if (result.isConfirmed) {
                    const res = await PromotionService.deletePromotion(id);
                    if(res){
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'ลบสำเร็จ',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                        });
                        this.fetchData();
                    }else{
                        Swal.fire({
                            icon: 'error',
                            title: 'ลบไม่สำเร็จ',
                            text: 'กรุณาตรวจสอบและลองใหม่อีกครั้ง',
                            confirmButtonColor: '#e3342f',
                            confirmButtonText: 'ตกลง'
                        });
                    }
                }
            });
        },
        successCreateRefresh(){
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'ลบสำเร็จ',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            this.fetchData();
        },
        getDiscountValue(type, amount){
            if (type === 'percent') {
                return `${amount} %`;
            } else {
                return `${amount} บาท`;
            }
        },
        formatRange(start, end){
            return `${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`;
        },
        async exportExcel(){
            this.exporting = true;
            await PromotionService.downloadPromotions({ is_xlsx: true , is_expired: this.is_expired});
            this.exporting = false;
        },
        async getProviders() {
            const data = await ConsoleService.getProviders();
            this.providers = [{ id: null, fullname: 'ทังหมด' }, ...data];
        },
        openDiscountDetail(id){
            this.$refs.promo_discount_detail.open(id);
        },
        updatePromotion(data){
            this.$refs.add_promotion.open(data);
        }
    },
    mounted(){
        this.fetchData();
        this.getProviders();
    }
}
</script>

<style>

</style>

