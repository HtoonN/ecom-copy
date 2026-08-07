<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span>Manage Match</span>
        </v-card-title>
        <v-card-text>
            <!-- Search Section -->
            <v-row class="mb-4">
                <v-col cols="12" md="4">
                    <v-text-field v-model="searchId" label="Match ID" placeholder="กรอกรหัสการจอง"
                        prepend-inner-icon="mdi-magnify" variant="outlined" density="compact" type="number"
                        @keyup.enter="searchMatch" :loading="loading" />
                </v-col>
                <v-col cols="12" md="2">
                    <v-btn color="primary" @click="searchMatch" :loading="loading" block>
                        <v-icon left>mdi-magnify</v-icon>
                        ค้นหา
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Error Alert -->
            <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="mb-4"
                @click:close="errorMessage = ''">
                {{ errorMessage }}
            </v-alert>

            <!-- Match Details Section -->
            <v-card v-if="matchData" variant="outlined" class="mb-4">
                <v-card-title class="d-flex justify-space-between">
                    <span>รายละเอียดการจอง #{{ matchData.id }}</span>
                    <v-chip :color="getStatusColor(matchData.payment_status)" size="small">
                        {{ getStatusText(matchData.payment_status) }}
                    </v-chip>
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <!-- Read-only Info -->
                        <v-col cols="12" md="6">
                            <v-table density="compact">
                                <tbody>
                                    <tr>
                                        <td class="font-weight-bold" width="150">รหัสการจอง</td>
                                        <td>{{ matchData.id }}</td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold">สนาม (Provider)</td>
                                        <td>{{ matchData.provider?.fullname || '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold">คอร์ท (Court)</td>
                                        <td>{{ matchData.court?.name || '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold">ลักษณะการจอง</td>
                                        <td>{{ getMatchTypeText(matchData.match_type) }}</td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold">ค่าเช่าสนาม</td>
                                        <td>{{ formatPrice(matchData.match_price) }} บาท</td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold">ยอดรวม</td>
                                        <td>{{ formatPrice(matchData.total_price) }} บาท</td>
                                    </tr>
                                    <tr>
                                        <td class="font-weight-bold">ชำระแล้ว</td>
                                        <td>{{ formatPrice(matchData.paid_amount) }} บาท</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-col>

                        <!-- Editable Fields -->
                        <v-col cols="12" md="6">
                            <v-form ref="editForm" v-model="formValid">
                                <v-text-field v-model="editData.date" label="วันที่จอง" type="date" variant="outlined"
                                    density="compact" class="mb-2" />
                                <v-row>
                                    <v-col cols="6">
                                        <v-text-field v-model="editData.time_start" label="เวลาเริ่มเล่น" type="time"
                                            variant="outlined" density="compact" />
                                    </v-col>
                                    <v-col cols="6">
                                        <v-text-field v-model="editData.time_end" label="เวลาสิ้นสุด" type="time"
                                            variant="outlined" density="compact" />
                                    </v-col>
                                </v-row>
                                <v-text-field v-model="editData.name" label="ชื่อผู้จอง" variant="outlined"
                                    density="compact" class="mb-2" />
                                <v-text-field v-model="editData.tel" label="เบอร์โทรศัพท์" variant="outlined"
                                    density="compact" class="mb-2" />
                                <v-textarea v-model="editData.remark" label="หมายเหตุ" variant="outlined"
                                    density="compact" rows="2" />

                                <div class="d-flex justify-end mt-4">
                                    <!-- <v-btn color="grey" variant="text" @click="resetEditData" class="mr-2">
                                        รีเซ็ต
                                    </v-btn> -->
                                    <v-btn color="primary" @click="saveMatch" :loading="saving">
                                        <v-icon left>mdi-content-save</v-icon>
                                        บันทึก
                                    </v-btn>
                                </div>
                            </v-form>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <!-- Longbook Stack Section -->
            <v-card v-if="matchData && matchData.stack && matchData.stack.matches && matchData.stack.matches.length > 1"
                variant="outlined" class="mb-4">
                <v-card-title class="d-flex justify-space-between align-center">
                    <span>
                        <v-icon left>mdi-layers-triple</v-icon>
                        จองต่อเนื่อง — Stack #{{ matchData.stack.id }}
                    </span>
                    <v-btn color="primary" variant="flat" size="small" @click="openMoveStackDialog">
                        <v-icon left>mdi-clock-edit-outline</v-icon>
                        ย้ายเวลาจองต่อเนื่อง
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <v-table density="compact">
                        <thead>
                            <tr>
                                <th>Match ID</th>
                                <th>คอร์ท</th>
                                <th>วันที่</th>
                                <th>เวลาเริ่ม</th>
                                <th>เวลาสิ้นสุด</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="m in matchData.stack.matches" :key="m.id"
                                :class="{ 'bg-blue-lighten-5': m.id === matchData.id }">
                                <td>
                                    <a href="#" @click.prevent="searchId = m.id; searchMatch()">
                                        {{ m.id }}
                                    </a>
                                </td>
                                <td>{{ m.court?.name || '-' }}</td>
                                <td>{{ formatDate(m.time_start) }}</td>
                                <td>{{ formatTime(m.time_start) }}</td>
                                <td>{{ formatTime(m.time_end) }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>

            <!-- Activity Logs Section -->
            <v-card v-if="matchData" variant="outlined">
                <v-card-title>
                    <v-icon left>mdi-history</v-icon>
                    ประวัติการบันทึกกิจกรรม
                </v-card-title>
                <v-card-text>
                    <v-progress-linear v-if="logsLoading" indeterminate color="primary" />
                    <div v-else-if="formattedLogs.length === 0" class="text-center text-grey py-4">
                        ไม่มีประวัติกิจกรรม
                    </div>
                    <div v-else class="logs-container">
                        <v-timeline density="compact" side="end">
                            <v-timeline-item v-for="log in formattedLogs" :key="log.id" dot-color="primary"
                                size="x-small">
                                <template v-slot:opposite>
                                    <span class="text-caption">{{ formatLogTimestamp(log.created_at) }}</span>
                                </template>
                                <v-card density="compact">
                                    <v-card-text class="py-2">
                                        <div class="d-flex align-center flex-wrap ga-1">
                                            <v-chip size="x-small" color="primary">{{ log.staffDisplay }}</v-chip>
                                            <v-chip size="x-small" color="secondary" variant="outlined">{{ log.subject
                                            }}</v-chip>
                                        </div>
                                        <div v-if="log.subjectContent" class="text-caption mt-1"
                                            style="max-width: 400px; word-wrap: break-word;">
                                            {{ log.subjectContent }}
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-timeline-item>
                        </v-timeline>
                    </div>
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>

    <!-- Move Stack Dialog -->
    <v-dialog v-model="moveStackDialog" max-width="450" persistent>
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon left class="mr-2">mdi-clock-edit-outline</v-icon>
                ย้ายเวลาจองต่อเนื่อง
            </v-card-title>
            <v-card-text>
                <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                    เปลี่ยนเวลาของแมทช์ทั้งหมดใน Stack #{{ matchData?.stack?.id }}
                    ({{ matchData?.stack?.matches?.length || 0 }} แมทช์)
                </v-alert>
                <v-row>
                    <v-col cols="6">
                        <v-text-field v-model="moveStackData.time_start" label="เวลาเริ่มใหม่" type="time"
                            variant="outlined" density="compact" />
                    </v-col>
                    <v-col cols="6">
                        <v-text-field v-model="moveStackData.time_end" label="เวลาสิ้นสุดใหม่" type="time"
                            variant="outlined" density="compact" />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="justify-end px-4 pb-4">
                <v-btn variant="text" @click="moveStackDialog = false">ยกเลิก</v-btn>
                <v-btn color="deep-purple" variant="flat" @click="confirmMoveStack" :loading="movingStack">
                    <v-icon left>mdi-check</v-icon>
                    ยืนยันย้ายเวลา
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import ManageMatchService from '../api/ManageMatchService';
import Swal from 'sweetalert2';
import moment from 'moment';

export default {
    name: 'ManageMatchView',
    data() {
        return {
            searchId: '',
            loading: false,
            saving: false,
            logsLoading: false,
            errorMessage: '',
            formValid: true,
            matchData: null,
            logs: [],
            editData: {
                date: '',
                time_start: '',
                time_end: '',
                name: '',
                tel: '',
                remark: '',
            },
            // Move Stack
            moveStackDialog: false,
            movingStack: false,
            moveStackData: {
                time_start: '',
                time_end: '',
            },
        };
    },
    computed: {
        formattedLogs() {
            if (!Array.isArray(this.logs)) return [];

            return this.logs
                .filter((log) => log && typeof log === 'object')
                .slice(0, 20)
                .map((log) => {
                    const { subject, subjectContent } = this.resolveLogSummary(log);
                    return {
                        ...log,
                        subject: subject || '-',
                        subjectContent: subjectContent || '-',
                        staffDisplay: log.staff_name || 'แอดมิน',
                    };
                });
        },
    },
    methods: {
        async searchMatch() {
            if (!this.searchId) {
                this.errorMessage = 'กรุณากรอกรหัสการจอง';
                return;
            }

            this.loading = true;
            this.errorMessage = '';
            this.matchData = null;
            this.logs = [];

            const result = await ManageMatchService.getMatchDetail(this.searchId);

            if (result.error) {
                this.errorMessage = result.error;
            } else if (result) {
                this.matchData = result;
                this.resetEditData();
                this.loadLogs();
            } else {
                this.errorMessage = 'ไม่พบข้อมูลแมทช์';
            }

            this.loading = false;
        },

        async loadLogs() {

            if (!this.matchData) return;

            this.logsLoading = true;
            const logs = await ManageMatchService.getMatchLogs(this.matchData.id, this.matchData?.provider.id, 20);
            if (logs) {
                this.logs = logs.logs;
            }
            //console.log(this.logs.logs);
            this.logsLoading = false;
        },

        resetEditData() {
            if (!this.matchData) return;

            const timeStart = moment(this.matchData.time_start);
            const timeEnd = moment(this.matchData.time_end);

            this.editData = {
                date: timeStart.format('YYYY-MM-DD'),
                time_start: timeStart.format('HH:mm'),
                time_end: timeEnd.format('HH:mm'),
                name: this.matchData.name || '',
                tel: this.matchData.tel || '',
                remark: this.matchData.remark || '',
            };
        },

        async saveMatch() {
            if (!this.matchData) return;

            // Confirmation dialog before saving
            const confirm = await Swal.fire({
                icon: 'question',
                title: 'ยืนยันการบันทึก',
                text: 'คุณต้องการบันทึกการเปลี่ยนแปลงนี้หรือไม่?',
                showCancelButton: true,
                confirmButtonText: 'บันทึก',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#1976D2',
            });

            if (!confirm.isConfirmed) return;

            // Build time strings
            const newTimeStart = `${this.editData.date} ${this.editData.time_start}:00`;
            const newTimeEnd = `${this.editData.date} ${this.editData.time_end}:00`;

            // Validate time order
            if (moment(newTimeEnd).isSameOrBefore(moment(newTimeStart))) {
                Swal.fire({
                    icon: 'error',
                    title: 'เวลาไม่ถูกต้อง',
                    text: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
                });
                return;
            }

            // Check for overlap if time changed
            const originalTimeStart = moment(this.matchData.time_start).format('YYYY-MM-DD HH:mm:ss');
            const originalTimeEnd = moment(this.matchData.time_end).format('YYYY-MM-DD HH:mm:ss');

            if (newTimeStart !== originalTimeStart || newTimeEnd !== originalTimeEnd) {
                this.saving = true;

                const availability = await ManageMatchService.checkCourtAvailability(
                    this.matchData.court_id,
                    newTimeStart,
                    newTimeEnd,
                    this.matchData.id
                );

                if (!availability.available) {
                    this.saving = false;
                    const overlaps = availability.overlapping_matches || [];
                    const overlapText = overlaps.map(m =>
                        `#${m.id}: ${moment(m.time_start).format('HH:mm')} - ${moment(m.time_end).format('HH:mm')}`
                    ).join('\n');

                    Swal.fire({
                        icon: 'error',
                        title: 'เวลาชนกับแมทช์อื่น',
                        html: `<p>ไม่สามารถบันทึกได้ เนื่องจากเวลาชนกับแมทช์ต่อไปนี้:</p><pre>${overlapText}</pre>`,
                    });
                    return;
                }
            }

            this.saving = true;

            const updateData = {
                time_start: newTimeStart,
                time_end: newTimeEnd,
                name: this.editData.name,
                tel: this.editData.tel,
                remark: this.editData.remark,
            };

            const result = await ManageMatchService.updateMatch(this.matchData.id, this.matchData.provider.id, updateData);

            this.saving = false;

            if (result.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'บันทึกไม่สำเร็จ',
                    text: result.error,
                });
            } else if (result.status === 'success') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    showConfirmButton: false,
                    timer: 2000,
                });
                // Reload match data
                this.searchMatch();
            }
        },

        getStatusColor(status) {
            const colors = {
                paid: 'success',
                partial: 'warning',
                unpaid: 'error',
            };
            return colors[status] || 'grey';
        },

        getStatusText(status) {
            const texts = {
                paid: 'ชำระแล้ว',
                partial: 'ชำระบางส่วน',
                unpaid: 'ยังไม่ชำระ',
            };
            return texts[status] || status;
        },

        getMatchTypeText(type) {
            const texts = {
                normal: 'จองปกติ',
                gs: 'ก๊วน/บุฟเฟต์',
                longbook: 'จองต่อเนื่อง',
            };
            return texts[type] || type;
        },

        formatDate(datetime) {
            return moment(datetime).format('DD/MM/YYYY');
        },

        formatTime(datetime) {
            return moment(datetime).format('HH:mm');
        },

        openMoveStackDialog() {
            // Check: only allow moving if all matches have price = 0
            const nonZero = (this.matchData.stack.matches || []).filter(
                m => (m.total_price || 0) !== 0 && (m.match_price || 0) !== 0
            );
            if (nonZero.length > 0) {
                const ids = nonZero.map(m => `#${m.id}`).join(', ');
                Swal.fire({
                    icon: 'warning',
                    title: 'ไม่สามารถย้ายเวลาได้',
                    html: `<p>ย้ายได้เฉพาะแมทช์ราคา 0 บาทเท่านั้น</p><p>แมทช์ที่มีราคา: <b>${ids}</b></p>`,
                });
                return;
            }
            // Pre-fill with current match's time
            this.moveStackData.time_start = moment(this.matchData.time_start).format('HH:mm');
            this.moveStackData.time_end = moment(this.matchData.time_end).format('HH:mm');
            this.moveStackDialog = true;
        },

        async confirmMoveStack() {
            if (!this.moveStackData.time_start || !this.moveStackData.time_end) {
                Swal.fire({ icon: 'error', title: 'กรุณากรอกเวลา', text: 'กรุณากรอกเวลาเริ่มและเวลาสิ้นสุด' });
                return;
            }

            if (this.moveStackData.time_end <= this.moveStackData.time_start) {
                Swal.fire({ icon: 'error', title: 'เวลาไม่ถูกต้อง', text: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น' });
                return;
            }

            const confirm = await Swal.fire({
                icon: 'warning',
                title: 'ยืนยันย้ายเวลา',
                html: `<p>ย้ายเวลาจองต่อเนื่อง Stack #${this.matchData.stack.id}</p>
                       <p><b>${this.matchData.stack.matches.length} แมทช์</b> จะเปลี่ยนเป็น</p>
                       <p>${this.moveStackData.time_start} — ${this.moveStackData.time_end}</p>`,
                showCancelButton: true,
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#7E57C2',
            });

            if (!confirm.isConfirmed) return;

            this.movingStack = true;

            const result = await ManageMatchService.moveStack(
                this.matchData.stack.id,
                this.matchData.provider.id,
                {
                    time_start: this.moveStackData.time_start,
                    time_end: this.moveStackData.time_end,
                }
            );

            this.movingStack = false;

            if (result.error) {
                let errorHtml = `<p>${result.error}</p>`;
                if (result.conflicts && result.conflicts.length > 0) {
                    const conflictLines = result.conflicts.map(c => {
                        const overlaps = c.overlapping.map(o =>
                            `#${o.id}: ${moment(o.time_start).format('HH:mm')} - ${moment(o.time_end).format('HH:mm')}`
                        ).join('<br>');
                        return `<b>Match #${c.match_id} (${c.date})</b>:<br>${overlaps}`;
                    }).join('<br><br>');
                    errorHtml += `<div style="text-align:left; margin-top:8px;">${conflictLines}</div>`;
                }
                Swal.fire({ icon: 'error', title: 'ย้ายเวลาไม่สำเร็จ', html: errorHtml });
                return;
            }

            this.moveStackDialog = false;
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `ย้ายเวลา ${result.updated_count || ''} แมทช์สำเร็จ`,
                showConfirmButton: false,
                timer: 2500,
            });
            // Reload match data
            this.searchMatch();
        },

        formatPrice(price) {
            return (price || 0).toLocaleString();
        },

        formatDateTime(datetime) {
            return moment(datetime).format('DD/MM/YYYY HH:mm');
        },

        formatLogTimestamp(value) {
            if (!value) return '-';
            const parsed = moment(value, 'YYYY-MM-DD HH:mm:ss', true);
            const fallback = parsed.isValid() ? parsed : moment(value);
            return fallback.isValid() ? fallback.format('YYYY-MM-DD HH:mm:ss') : '-';
        },

        normalizeRequestBody(payload) {
            if (payload === null || payload === undefined) return null;
            if (typeof payload === 'string') {
                const trimmed = payload.trim();
                if (!trimmed.length) return null;
                try {
                    return JSON.parse(trimmed);
                } catch (error) {
                    return trimmed;
                }
            }
            if (typeof payload === 'object') return payload;
            return payload;
        },

        resolveLogSummary(log) {
            if (!log || typeof log !== 'object') {
                return { subject: '-', subjectContent: '-' };
            }

            const payload = this.normalizeRequestBody(log.request_body);
            const methodText = (log.method || '').toLowerCase();
            const payloadObject = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;

            const payloadHas = (keys = []) => {
                if (!payloadObject) return false;
                return keys.some((key) => Object.prototype.hasOwnProperty.call(payloadObject, key));
            };

            let subject = 'อัปเดตแมทช์';

            if (methodText.includes('create')) {
                subject = 'สร้างแมทช์';
            } else if (methodText.includes('delete') || methodText.includes('cancel')) {
                subject = 'ยกเลิก/ลบแมทช์';
            } else if (payloadHas(['check_in', 'payment_status', 'paid_amount', 'paid_at', 'bank_id']) || methodText.includes('payment')) {
                subject = 'อัปเดตการชำระเงิน';
            } else if (payloadHas(['change_price', 'changePrice'])) {
                subject = 'แก้ไขราคา';
            } else if (payloadHas(['time_start', 'time_end', 'court_id'])) {
                subject = 'แก้ไขตารางแมทช์';
            } else if (methodText.includes('edit') || methodText.includes('update')) {
                subject = 'แก้ไขแมทช์';
            } else if (log.method) {
                subject = log.method;
            }

            // Compose subjectContent
            let subjectContent = '';
            if (payloadObject) {
                const parts = [];
                if (payloadObject.time_start) parts.push(`เริ่ม: ${moment(payloadObject.time_start).format('HH:mm')}`);
                if (payloadObject.time_end) parts.push(`สิ้นสุด: ${moment(payloadObject.time_end).format('HH:mm')}`);
                if (payloadObject.description) parts.push(`ผู้จอง: ${payloadObject.description}`);
                if (payloadObject.remark) parts.push(`หมายเหตุ: ${payloadObject.remark}`);
                if (payloadObject.match_price !== undefined) parts.push(`ราคา: ${payloadObject.match_price} บาท`);
                subjectContent = parts.join(' | ');
            }

            if (!subjectContent && typeof payload === 'string') {
                subjectContent = payload.length > 100 ? payload.slice(0, 97) + '...' : payload;
            }

            return { subject, subjectContent };
        },
    },
};
</script>

<style scoped>
.v-table td {
    padding: 8px 12px !important;
}

.logs-container {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
}

.logs-container::-webkit-scrollbar {
    width: 6px;
}

.logs-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}
</style>
