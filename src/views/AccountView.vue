<template>
  <v-container >
    <v-card outlined elevation="1" class="mb-6 filter-card">
      <div class="filter-card-header">
        <v-card-title class="text-h6 font-weight-medium">ตัวกรองการค้นหา</v-card-title>
        <v-select
          class="year-select"
          :items="yearOptions"
          v-model="selectedYearValue"
          label="ปี"
          density="comfortable"
          hide-details
          @update:modelValue="onYearSelected"
        ></v-select>
      </div>
      <v-card-text>
        <v-row class="gy-4">
          <v-col cols="12" md="4">
            <v-autocomplete
              label="Provider"
              :items="providers"
              v-model="selectedProvider"
              item-title="fullname"
              item-value="id"
              @update:modelValue="onProviderSelected"
              dense
            ></v-autocomplete>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              class="full-width"
              :items="monthOptions"
              label="เดือน"
              v-model="selectedMonthName"
              clearable
              @update:modelValue="onMonthSelected"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-autocomplete
              label="Week"
              :items="weeks"
              item-text="display"
              item-title="label"
              v-model="selectedWeek"
              return-object
              @change="onWeekSelected"
              dense
              clearable
            ></v-autocomplete>
          </v-col>

          <v-col cols="12">
            <div class="filter-actions">
              <v-btn color="primary" class="filter-action-btn" @click="triggerWeekSelection">
                ดึงข้อมูล
              </v-btn>
              <v-btn
                color="primary"
                variant="tonal"
                class="filter-action-btn"
                @click="resetSelections"
              >
                Clear
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card outlined elevation="1" class="pa-4 mb-6 settlement-card">
      <v-card-title class="text-h6 font-weight-medium">
        จัดการการชำระบิล
      </v-card-title>
      <v-card-text>
        <div class="settlement-create-trigger">
          <div class="settlement-create-context">
            <div class="settlement-context-item">
              <span class="context-label">Provider</span>
              <span class="context-value">{{ getSelectedProviderName || '-' }}</span>
            </div>
            <div class="settlement-context-item">
              <span class="context-label">รอบบิล</span>
              <span class="context-value">{{ selectedWeekText || '-' }}</span>
            </div>
            <div class="settlement-context-item">
              <span class="context-label">Settle Date</span>
              <span class="context-value">{{ settlementForm.settle_date || '-' }}</span>
            </div>
          </div>
          <v-btn
            color="primary"
            :disabled="!canOpenCreateSettlement"
            @click="openCreateSettlementDialog"
          >
            สร้างการชำระบิล 
          </v-btn>
        </div>

        <v-divider class="my-4"></v-divider>

        <div class="settlement-list-header">
          <div class="text-subtitle-1 font-weight-medium">
            รายการชำระบิลเดือนนี้
          </div>
          <v-switch
            class="use-paid-at-switch"
            v-model="usePaidAt"
            inset
            hide-details
            color="primary"
            :label="usePaidAt ? 'ใช้ Paid At' : 'ใช้ Bill Date'"
            @update:modelValue="handleUsePaidAtUpdate"
          ></v-switch>
        </div>

        <v-skeleton-loader
          v-if="billSettlementsLoading"
          type="list-item-three-line"
          class="mt-4"
        ></v-skeleton-loader>

        <v-alert
          v-else-if="!billSettlements.length"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          ไม่มีการชำระบิลสำหรับเดือนนี้
        </v-alert>

        <v-list
          v-else
          class="bill-settlement-list mt-4"
          density="comfortable"
        >
          <v-list-item
            v-for="settlement in billSettlements"
            :key="settlement.id"
            @click="openEditSettlement(settlement)"
            class="bill-settlement-item"
          >
            <v-list-item-title>
              {{ formatDate(settlement.bill_date) || '-' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              ID: {{ settlement.id }} · {{ formatCurrency(settlement.amount) }} บาท
            </v-list-item-subtitle>
            <template #append>
              <v-icon color="primary">mdi-pencil</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card outlined elevation="2" class="pa-4">
      <div class="summary-header">
        <div class="text-h5 font-weight-medium">
          รอบบิลที่ {{ selectedWeekText }}
        </div>
        <v-btn
          @click="exportExcel"
          color="#1d6f42"
          variant="outlined"
          :disabled="!showItem.length"
        >
          <v-icon class="mr-2">mdi-microsoft-excel</v-icon>ส่งออก Excel
        </v-btn>
      </div>

      <div class="text-h6 mt-2">
        รวม {{ totalHours }} ชั่วโมง {{ totalOnMatchdayPrice }} บาท
      </div>

      <v-divider class="my-4"></v-divider>

      <v-data-table-virtual
        :loading="tableLoading"
        :headers="headers"
        :items="showItem"
        height="400"
        item-value="name"
        fixed-header
      ></v-data-table-virtual>
    </v-card>

    <v-dialog v-model="createSettlementDialogVisible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">
          สร้างการชำระบิล
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleCreateSettlement">
            <v-row class="gy-4">
              <v-col cols="12" md="6">
                <v-text-field
                  label="Provider"
                  :model-value="getSelectedProviderName || ''"
                  disabled
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Settle Date"
                  v-model="settlementForm.settle_date"
                  disabled
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Paid At"
                  v-model="settlementForm.paid_at"
                  type="datetime-local"
                  :max="maxPaidAt"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  label="Bank"
                  :items="bankOptions"
                  item-title="label"
                  item-value="id"
                  v-model="settlementForm.bank_id"
                  clearable
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Amount"
                  v-model="settlementForm.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            variant="text"
            :disabled="creatingBillSettlement"
            @click="closeCreateSettlementDialog"
          >
            ยกเลิก
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!canCreateSettlement || creatingBillSettlement"
            :loading="creatingBillSettlement"
            @click="handleCreateSettlement"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="billSettlementDialog" max-width="780">
      <v-card>
        <v-card-title class="text-h6 dialog-title">
          จัดการการชำระบิล
          <span v-if="activeSettlement" class="dialog-subtitle">
            รอบบิล {{ formatDate(activeSettlement.bill_date) || '-' }} · ID {{
              activeSettlement.id
            }}
          </span>
        </v-card-title>
        <v-card-text class="py-0">
          <div class="bill-payment-section">
            <v-data-table
              v-if="billPaymentTableItems.length"
              :headers="billPaymentHeaders"
              :items="billPaymentTableItems"
              class="bill-payment-table"
              density="comfortable"
              :items-per-page="-1"
              hide-default-footer
            >
              <template #item.actions="{ item }">
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  @click="openBillPaymentDialog('edit', item.raw)">
                  แก้ไข
                </v-btn>
              </template>
            </v-data-table>
            <v-alert
              v-else
              type="info"
              variant="tonal"
              class="mt-4"
            >
              ยังไม่มีรายการชำระสำหรับบิลนี้
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions class="justify-space-between">
          <v-btn variant="text" @click="closeBillSettlementDialog">ปิด</v-btn>
          <v-btn
            color="primary"
            :disabled="!activeSettlement"
            @click="openBillPaymentDialog('create')"
          >
            เพิ่มการชำระ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="billPaymentDialogVisible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">
          {{ billPaymentDialogTitle }}
        </v-card-title>
        <v-card-text>
          <div
            v-if="isBillPaymentEdit && billPaymentForm"
            class="payment-dialog-meta mb-4"
          >
            <div>Payment ID: {{ billPaymentForm.id }}</div>
            <div>
              ชำระเมื่อ {{ formatDateTime(billPaymentForm.paid_at) || '-' }}
            </div>
            <div>ธนาคาร: {{ getBankLabel(billPaymentForm.bank_id) }}</div>
          </div>
          <v-text-field
            label="Amount"
            v-model="billPaymentForm.amount"
            type="number"
            step="0.01"
            min="0"
            required
          ></v-text-field>
          <v-text-field
            v-if="isBillPaymentCreate"
            label="Paid At"
            v-model="billPaymentForm.paid_at"
            type="datetime-local"
            :max="maxPaidAt"
            required
          ></v-text-field>
          <v-select
            v-if="isBillPaymentCreate"
            label="Bank"
            :items="bankOptions"
            item-title="label"
            item-value="id"
            v-model="billPaymentForm.bank_id"
            clearable
            required
          ></v-select>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="closeBillPaymentDialog">ยกเลิก</v-btn>
          <v-btn
            color="primary"
            :disabled="!canSubmitBillPayment || savingBillPayment"
            :loading="savingBillPayment"
            @click="handleBillPaymentSubmit"
          >
            {{ billPaymentSubmitLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import ConsoleService from "../api/ConsoleService";

const BANK_OPTIONS = Object.freeze([
  { id: "1", label: "ธนาคารกรุงเทพ (BBL)", name: "ธนาคารกรุงเทพ", english: "Bankok Bank", code: "BBL" },
  { id: "2", label: "ธนาคารกสิกรไทย (KBANK)", name: "ธนาคารกสิกรไทย", english: "Kasikorn Bank", code: "KBANK" },
  { id: "3", label: "ไม่ระบุ", name: "ไม่ระบุ", english: "unknow", code: "00" },
  { id: "4", label: "ธนาคารไทยพาณิชย์ (SCB)", name: "ธนาคารไทยพาณิชย์", english: "SCB Bank", code: "SCB" },
  { id: "5", label: "ธนาคารกรุงไทย (KTB)", name: "ธนาคารกรุงไทย", english: "krungthaibank", code: "KTB" },
  { id: "6", label: "ธนาคารกรุงศรีอยุธยา (BAY)", name: "ธนาคารกรุงศรีอยุธยา", english: "Kkrungsribank", code: "BAY" },
  { id: "7", label: "ธนาคารออมสิน (GSB)", name: "ธนาคารออมสิน", english: "gsb bank", code: "GSB" },
  { id: "8", label: "ส่วนตัว", name: "ส่วนตัว", english: "private", code: "pv" },
  { id: "9", label: "ธนาคารเกียรตินาคินภัทร (KKP)", name: "ธนาคารเกียรตินาคินภัทร", english: "Kiatnakin", code: "KKP" },
  { id: "10", label: "ธนาคารทหารไทยธนชาต (TTB)", name: "ธนาคารทหารไทยธนชาต", english: "ttb", code: "TTB" },
  { id: "11", label: "ธนาคารซีไอเอ็มบีไทย (CIMB)", name: "ธนาคารซีไอเอ็มบีไทย", english: "CIMB Thai Bank", code: "CIMB" },
  { id: "12", label: "ธนาคารไทยเครดิต (TCRB)", name: "ธนาคารไทยเครดิต", english: "Thai Credit Bank", code: "TCRB" },
]);
import moment from "moment-timezone";
import exportExcelFun from "../helper/export_excel";
import Swal from "sweetalert2";
import monthAndYearSelector from "../components/monthAndYearSelector.vue";
import calculateTotalOnMatchday from "../helper/calculateTotalOnMatchday";

export default {
  data() {
    return {
      selectedMonth: null,
      selectedWeek: null,
      year: null,
      weeks: [],
      headers: [
        { title: "ลำดับ", align: "start", key: "No" },
        { title: "ชื่อสนาม", key: "provider_name" },
        { title: "ID", align: "end", key: "id" },
        { title: "ชื่อผู้จอง", key: "user_fullname" },
        { title: "ประเภทกีฬา", key: "sport_name" },
        { title: "เวลาเริ่ม", align: "start", key: "start_date" },
        { title: "เวลาสิ้นสุด", align: "start", key: "end_date" },
        { title: "สร้างเมื่อ", key: "created_at" },
        { title: "ชั่วโมง", align: "end", key: "hr" },
        { title: "ราคารวม", align: "end", key: "sumary_price" },
        { title: "ราคาสุทธิ", align: "end", key: "real_price" },
        { title: "ส่วนลด", align: "end", key: "discount" },
        { title: "ประกัน", align: "end", key: "insurance" },
        { title: "สรุป ", align: "end", key: "sumary_all" },
      ],
      selectedWeekText: null,
      providers: [],
      selectedWeeksResponse: [],
      selectedProvider: null,
      tableLoading: false,
      defaultYear: new Date().getFullYear(),
      monthOptions: [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ],
      yearOptions: [],
      selectedYearValue: new Date().getFullYear(),
      selectedMonthName: null,
      selectedMonthParam: null,
      bankOptions: BANK_OPTIONS,
      settlementForm: {
        settle_date: "",
        paid_at: moment().format("YYYY-MM-DDTHH:mm"),
        amount: "",
        provider_id: null,
        bank_id: "",
      },
      billSettlements: [],
      billSettlementsLoading: false,
      creatingBillSettlement: false,
      billSettlementDialog: false,
  createSettlementDialogVisible: false,
  usePaidAt: false,
      activeSettlement: null,
      billPaymentHeaders: [
        { title: "Payment ID", key: "id" },
        { title: "ชำระเมื่อ", key: "paid_at_display" },
        { title: "ธนาคาร", key: "bank_display" },
        { title: "ยอดชำระ", key: "amount_display", align: "end" },
        { title: "", key: "actions", sortable: false, align: "end" },
      ],
      billPaymentDialogVisible: false,
      billPaymentDialogMode: "create",
      billPaymentForm: {
        id: null,
        amount: "",
        paid_at: moment().format("YYYY-MM-DDTHH:mm"),
        bank_id: "",
      },
      savingBillPayment: false,
    };
  },
  _methods: {
    exportExcel() {
      Swal.fire({
        icon: "question",
        title: "ส่งออก Excel",
        text: "คุณแน่ใจหรือไม่ว่าจะส่งออก Excel",
        showCancelButton: true,
        cancelButtonText: "ยกเลิก",
        confirmButtonText: "ยีนยัน",
        confirmButtonColor: "red",
      }).then(async (re) => {
        if (re.isConfirmed) {
          const title = `รอบบิลที่ ${this.selectedWeekText} รวม ${this.totalHours} ชั่วโมง ${this.totalOnMatchdayPrice} บาท`;
          const filename = `รอบบิลที่ ${this.selectedWeekText}`;

          const dataRows = this.showItem.map((item) => {
            return {
              ลำดับ: item.No,
              Provider: item.provider_name,
              ID: item.id,
              ชื่อผู้จอง: item.user_fullname,
              ประเภทกีฬา: item.sport_name,
              เวลาเริ่ม: item.start_date,
              เวลาสิ้นสุด: item.end_date,
              สร้างเมื่อ: item.created_at,
              ชั่วโมง: item.hr,
              ราคารวม: item.sumary_price,
              ราคาสุทธิ: item.real_price,
              ส่วนลด: item.discount,
              ประกัน: item.insurance,
              สรุป: item.sumary_all,
              
            };
          });
          const toNumber = (value) => {
            const normalized = String(value ?? "").replace(/,/g, "").trim();
            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : 0;
          };
          const gmvFromTableTotal = dataRows.reduce(
            (acc, row) => acc + toNumber(row["ราคารวม"]),
            0
          );
          const formatSummaryNumber = (value) =>
            Number(value || 0).toLocaleString("en-US", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
          const emptyRow = Object.keys(dataRows[0] || {}).reduce((acc, key) => {
            acc[key] = "";
            return acc;
          }, {});
          const data = [
            ...dataRows,
            emptyRow,
            { ...emptyRow, สร้างเมื่อ: "GMV", ราคารวม: formatSummaryNumber(gmvFromTableTotal) },
            {
              ...emptyRow,
              สร้างเมื่อ: "No. of bookings",
              ราคารวม: formatSummaryNumber(this.showItem.length),
            },
          ];
          const gmvRow = dataRows.length + 4;
          const bookingRow = dataRows.length + 5;
          const merges = [
            { s: { r: gmvRow - 1, c: 7 }, e: { r: gmvRow - 1, c: 8 } },
            { s: { r: bookingRow - 1, c: 7 }, e: { r: bookingRow - 1, c: 8 } },
          ];
          const cellStyles = [
            {
              cell: `H${gmvRow}`,
              style: {
                alignment: { horizontal: "right", vertical: "center" },
                font: { bold: true },
              },
            },
            { cell: `J${gmvRow}`, style: { alignment: { horizontal: "right", vertical: "center" } } },
            {
              cell: `H${bookingRow}`,
              style: {
                alignment: { horizontal: "right", vertical: "center" },
                font: { bold: true },
              },
            },
            { cell: `J${bookingRow}`, style: { alignment: { horizontal: "right", vertical: "center" } } },
          ];

          exportExcelFun({ data, title, filename, sheetname: "sheet", merges, cellStyles });
        }
      });
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      return moment(dateStr).format("DD/MM/YYYY");
    },

    generateYearOptions() {
      const current = this.defaultYear;
      const span = 10;
      const years = [];
      for (let year = current - span; year <= current + span; year += 1) {
        years.push(year);
      }
      return years;
    },

    onMonthSelected(value) {
      this.selectedMonthName = value || null;
      if (!value) {
        this.selectedMonth = null;
        this.selectedMonthParam = null;
        return;
      }
      this.emitSelectedMonthYear();
    },

    onYearSelected(value) {
      this.selectedYearValue = value || this.defaultYear;
      this.emitSelectedMonthYear();
    },

    emitSelectedMonthYear() {
      if (this.selectedMonthName && this.selectedYearValue) {
        const selectedDate = `${this.selectedMonthName} ${this.selectedYearValue}`;
        this.selectedDate(selectedDate);
      }
    },

    resetSelections() {
      this.selectedProvider = null;
      this.selectedMonth = null;
      this.selectedWeek = null;
      this.selectedWeeksResponse = [];
      this.selectedWeekText = null;
      this.selectedMonthParam = null;
      this.billSettlements = [];
      this.activeSettlement = null;
      this.billSettlementDialog = false;
      this.createSettlementDialogVisible = false;
      this.billPaymentDialogVisible = false;
  this.usePaidAt = false;
      this.selectedMonthName = null;
      this.selectedYearValue = this.defaultYear;
      this.resetSettlementForm({ preserveSelection: false });
      this.resetBillPaymentForm({ preserveBank: false });
    },
    async triggerWeekSelection() {
      if (!this.selectedWeek) {
        if(this.selectedMonthParam){
          const { time_start, time_end } = this.getMonthDateRange(this.selectedMonthParam);
           await this.onWeekSelected({ time_start, time_end });
          const startDate = moment(time_start).format(
            "YYYY/MM/DD"
          );
          const endDate = moment(time_end).format(
            "YYYY/MM/DD"
          );
          this.selectedWeekText = `${startDate} - ${endDate}`;
          console.log(time_start, time_end);
          return
        }else{
          console.log("No week selected or month selected");
          return;
        }
      }

      await this.onWeekSelected(this.selectedWeek);

      const selectedWeekData = this.weeks.find(
        (week) => week.time_start === this.selectedWeek.time_start
      );

      if (selectedWeekData) {
        const weekNumber = selectedWeekData.week;
        const startDate = moment(selectedWeekData.time_start).format(
          "YYYY/MM/DD"
        );
        const endDate = moment(selectedWeekData.time_end).format(
          "YYYY/MM/DD"
        );
        this.selectedWeekText = `รอบบิลที่ ${weekNumber} ${startDate} - ${endDate}`;
      } else {
        this.selectedWeekText = "Week data not found";
      }

      this.updateSettlementSettleDate(this.selectedWeek);

      if (this.selectedProvider && this.selectedMonthParam) {
        await this.fetchBillSettlements();
      }
    },
    async handleUsePaidAtUpdate(value) {
      this.usePaidAt = Boolean(value);
      if (this.selectedProvider && this.selectedMonthParam) {
        await this.fetchBillSettlements();
      }
    },
    async searchMonthly() {
      if (this.selectedWeek) {
        const selectedWeekData = this.weeks.find(
          (week) => week.time_start === this.selectedWeek.time_start
        );

        if (selectedWeekData) {
          const weekNumber = selectedWeekData.week;
          const startTime = moment(selectedWeekData.time_start).format(
            "YYYY-MM-DD 00:00:00"
          );
          const endTime = moment(selectedWeekData.time_end).format(
            "YYYY-MM-DD 23:59:59"
          );

          const response = await ConsoleService.getMatch(startTime, endTime);
          this.selectedWeeksResponse = response;
          this.selectedWeekText = ` ${weekNumber} ${startTime} - ${endTime}`;
        } else {
          this.selectedWeekText = "Week data not found";
        }

      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่มีสัปดาห์ที่เลือก",
          confirmButtonColor: "#d60326",
        });
      }
    },
    debugInput(value) {
      console.log("Week selected:", value);
    },

    async onWeekSelected(selectedWeek) {
      try {
        const startTime = selectedWeek.time_start;
        const endTime = selectedWeek.time_end;

        const providerId = this.selectedProvider;
         this.tableLoading = true
        const response = await ConsoleService.getMatch(
          startTime,
          endTime,
          providerId
        );

        this.selectedWeeksResponse = response;
      } catch (error) {
        console.error("Error in onWeekSelected:", error);
      } finally {
        this.tableLoading = false
      }

      this.updateSettlementSettleDate(selectedWeek);
    },
    onProviderSelected(provider_id) {
      this.settlementForm.provider_id = provider_id || null;
    },

    selectedDate(date) {
      this.selectedMonth = date;
      if (date) {
        const parts = date.split(" ");
        if (parts[0]) {
          this.selectedMonthName = parts[0];
        }
        if (parts[1]) {
          const parsedYear = parseInt(parts[1], 10);
          if (!Number.isNaN(parsedYear)) {
            this.selectedYearValue = parsedYear;
          }
        }
      }
    },

    async fetchDatas() {
      if (!this.selectedMonth) {
        return;
      }
      const selectedMonthName = this.selectedMonth.replace(/ \d{4}/, "").trim();

      const monthMapping = {
        มกราคม: "01",
        กุมภาพันธ์: "02",
        มีนาคม: "03",
        เมษายน: "04",
        พฤษภาคม: "05",
        มิถุนายน: "06",
        กรกฎาคม: "07",
        สิงหาคม: "08",
        กันยายน: "09",
        ตุลาคม: "10",
        พฤศจิกายน: "11",
        ธันวาคม: "12",
      };
  const parts = this.selectedMonth.split(" ");
  const year = parts[1] || this.selectedYearValue;
      const numericMonth = monthMapping[selectedMonthName] || "01";
      const monthAndYear = `${year}-${numericMonth}`;

      this.selectedMonthParam = monthAndYear;

      try {
        const response = await ConsoleService.getAccountWeeks(monthAndYear);

        this.weeks = response.map((item) => {
          const startDateFormatted = moment(item.time_start).format(
            "YYYY/MM/DD"
          );
          item.label = `Week ${item.week}: ${startDateFormatted}`;
          return item;
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },

    async fetchProviders() {
      try {
        const response = await ConsoleService.getProviders();
        this.providers = response;
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    },
    async handleCreateSettlement() {
      if (!this.canCreateSettlement) {
        return;
      }

      const payload = {
        settle_date: this.settlementForm.settle_date,
        paid_at: moment(this.settlementForm.paid_at).isValid()
          ? moment(this.settlementForm.paid_at).toISOString()
          : this.settlementForm.paid_at,
        bank_id: this.settlementForm.bank_id,
        amount: parseFloat(this.settlementForm.amount),
        provider_id: this.settlementForm.provider_id,
      };

      this.creatingBillSettlement = true;
      try {
        await ConsoleService.createBillSettlement(payload);
        Swal.fire({
          icon: "success",
          title: "สร้างการชำระบิลสำเร็จ",
          confirmButtonColor: "#1d6f42",
        });
        this.resetSettlementForm();
        this.createSettlementDialogVisible = false;
        await this.fetchBillSettlements({ silent: true });
      } catch (error) {
        console.error("Error creating bill settlement:", error);
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถสร้างการชำระบิล",
          text: error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#d60326",
        });
      } finally {
        this.creatingBillSettlement = false;
      }
    },
    async fetchBillSettlements({ silent = false } = {}) {
      if (!this.selectedProvider || !this.selectedMonthParam) {
        if (!silent) {
          Swal.fire({
            icon: "warning",
            title: "กรุณาเลือก Provider และ Month",
            confirmButtonColor: "#d60326",
          });
        }
        return;
      }

      if (!silent) {
        this.billSettlementsLoading = true;
      }

      try {
        const response = await ConsoleService.getBillSettlements({
          providerId: this.selectedProvider,
          month: this.selectedMonthParam,
          usePaidAt: this.usePaidAt,
        });
        this.billSettlements = this.normalizeBillSettlements(response);
      } catch (error) {
        console.error("Error fetching bill settlements:", error);
        if (!silent) {
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถดึงข้อมูล",
            text: error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
            confirmButtonColor: "#d60326",
          });
        }
      } finally {
        this.billSettlementsLoading = false;
      }
    },
    openCreateSettlementDialog() {
      if (!this.canOpenCreateSettlement) {
        Swal.fire({
          icon: "warning",
          title: "กรุณาเลือกรอบบิลและ Provider",
          confirmButtonColor: "#d60326",
        });
        return;
      }
      this.resetSettlementForm({ preserveSelection: true });
      this.createSettlementDialogVisible = true;
    },
    closeCreateSettlementDialog() {
      if (this.creatingBillSettlement) {
        return;
      }
      this.createSettlementDialogVisible = false;
      this.resetSettlementForm({ preserveSelection: true });
    },
    openEditSettlement(settlement) {
      if (!settlement) return;
      this.setActiveSettlement(settlement);
      this.billSettlementDialog = true;
    },
    closeBillSettlementDialog() {
      if (this.savingBillPayment) {
        return;
      }
      this.billSettlementDialog = false;
      this.activeSettlement = null;
      this.billPaymentDialogVisible = false;
      this.billPaymentDialogMode = "create";
      this.resetBillPaymentForm({ preserveBank: false });
    },
    openBillPaymentDialog(mode, payment = null) {
      if (!this.activeSettlement) return;
      this.billPaymentDialogMode = mode;

      if (mode === "create") {
        this.resetBillPaymentForm({ preserveBank: true });
        this.billPaymentForm.id = null;
        if (!this.billPaymentForm.bank_id) {
          this.billPaymentForm.bank_id = this.settlementForm.bank_id || "";
        }
      } else if (payment) {
        this.billPaymentForm = {
          id: payment.id,
          amount:
            payment.amount !== undefined && payment.amount !== null
              ? payment.amount.toString()
              : "",
          paid_at: payment.paid_at || "",
          bank_id: payment.bank_id || "",
        };
      }

      this.billPaymentDialogVisible = true;
    },
    closeBillPaymentDialog() {
      if (this.savingBillPayment) {
        return;
      }
      this.billPaymentDialogVisible = false;
    },
    async handleBillPaymentSubmit() {
      if (!this.canSubmitBillPayment || !this.activeSettlement) {
        return;
      }

      this.savingBillPayment = true;
      try {
        if (this.isBillPaymentCreate) {
          const payload = {
            amount: parseFloat(this.billPaymentForm.amount),
            paid_at: moment(this.billPaymentForm.paid_at).isValid()
              ? moment(this.billPaymentForm.paid_at).toISOString()
              : this.billPaymentForm.paid_at,
            bank_id: this.billPaymentForm.bank_id,
          };

          await ConsoleService.addBillSettlementPayment(
            this.activeSettlement.id,
            payload
          );

          Swal.fire({
            icon: "success",
            title: "เพิ่มการชำระสำเร็จ",
            confirmButtonColor: "#1d6f42",
          });
        } else {
          const payload = {
            amount: parseFloat(this.billPaymentForm.amount),
          };

          await ConsoleService.updateBillSettlementPayment(
            this.billPaymentForm.id,
            payload
          );

          Swal.fire({
            icon: "success",
            title: "อัปเดตยอดสำเร็จ",
            confirmButtonColor: "#1d6f42",
          });
        }

        this.billPaymentDialogVisible = false;
        await this.refreshActiveSettlement();
        if (this.isBillPaymentCreate) {
          this.resetBillPaymentForm({ preserveBank: true });
        }
      } catch (error) {
        console.error("Error saving bill payment:", error);
        Swal.fire({
          icon: "error",
          title: this.isBillPaymentCreate
            ? "ไม่สามารถเพิ่มการชำระ"
            : "ไม่สามารถอัปเดตยอด",
          text: error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#d60326",
        });
      } finally {
        this.savingBillPayment = false;
      }
    },
    async refreshActiveSettlement() {
      await this.fetchBillSettlements({ silent: true });
      if (!this.activeSettlement) {
        return;
      }
      const updated = this.billSettlements.find(
        (item) => item.id === this.activeSettlement.id
      );
      if (updated) {
        this.setActiveSettlement(updated);
      } else {
        this.activeSettlement = null;
        this.billSettlementDialog = false;
        this.billPaymentDialogVisible = false;
      }
    },
    setActiveSettlement(settlement) {
      const normalized = {
        ...settlement,
        bill_payments: Array.isArray(settlement.bill_payments)
          ? settlement.bill_payments
          : [],
      };
      this.activeSettlement = normalized;
      if (this.billPaymentDialogMode === "create") {
        this.resetBillPaymentForm({ preserveBank: true });
      }
    },
    resetBillPaymentForm({ preserveBank = false } = {}) {
      const bankId = preserveBank
        ? this.billPaymentForm.bank_id || this.settlementForm.bank_id
        : this.settlementForm.bank_id;
      this.billPaymentForm = {
        id: null,
        amount: "",
        paid_at: moment().format("YYYY-MM-DDTHH:mm"),
        bank_id: bankId || "",
      };
    },
    normalizeBillSettlements(settlements) {
      const list = Array.isArray(settlements)
        ? settlements
        : Array.isArray(settlements?.data)
        ? settlements.data
        : [];
      return list.map((item) => ({
        ...item,
        bill_payments: Array.isArray(item.bill_payments)
          ? item.bill_payments
          : [],
      }));
    },
    updateSettlementSettleDate(week) {
      if (week && week.time_start) {
        this.settlementForm.settle_date = moment(week.time_start)
          .format("YYYY-MM-DD");
      } else {
        this.settlementForm.settle_date = "";
      }
    },
    resetSettlementForm({ preserveSelection = true } = {}) {
      const settleDate = preserveSelection ? this.settlementForm.settle_date : "";
      const providerId = preserveSelection
        ? this.settlementForm.provider_id
        : null;
      const bankId = preserveSelection ? this.settlementForm.bank_id : "";
      this.settlementForm = {
        settle_date: settleDate,
        paid_at: moment().format("YYYY-MM-DDTHH:mm"),
        amount: "",
        provider_id: providerId,
        bank_id: bankId,
      };
    },
    formatDateTime(dateStr) {
      if (!dateStr) return "";
      return moment(dateStr).format("DD/MM/YYYY HH:mm");
    },
    formatCurrency(value) {
      if (value === undefined || value === null || value === "") {
        return "0.00";
      }

      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) {
        return value;
      }

      return numberValue.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    getBankLabel(bankId) {
      const option = this.bankOptionMap[bankId];
      return option ? option.label : bankId || "-";
    },
    getMonthDateRange(monthStr) {
      // monthStr format: "YYYY-MM"
      const time_start = moment(monthStr, "YYYY-MM")
        .startOf("month")
        .format("YYYY-MM-DD HH:mm:ss");

      const time_end = moment(monthStr, "YYYY-MM")
        .endOf("month")
        .format("YYYY-MM-DD HH:mm:ss");

      return { time_start, time_end };
    }
  },
  get methods() {
    return this._methods;
  },
  set methods(value) {
    this._methods = value;
  },

  watch: {
    selectedMonth(newVal, oldVal) {
      if (newVal !== oldVal && newVal) {
        this.billSettlements = [];
        this.fetchDatas();
        this.activeSettlement = null;
        this.billSettlementDialog = false;
        this.createSettlementDialogVisible = false;
        this.resetBillPaymentForm({ preserveBank: false });
      }

      if (!newVal) {
        this.selectedMonthParam = null;
        this.selectedMonthName = null;
        this.weeks = [];
        this.selectedWeeksResponse = [];
        this.selectedWeek = null;
        this.selectedWeekText = null;
      }
    },
    selectedWeek(newVal) {
      this.updateSettlementSettleDate(newVal);
    },
    selectedProvider(newVal) {
      this.settlementForm.provider_id = newVal || null;
      this.billSettlements = [];
      this.activeSettlement = null;
      this.billSettlementDialog = false;
      this.createSettlementDialogVisible = false;
      this.resetBillPaymentForm({ preserveBank: false });
    },
  },

  computed: {
    getSelectedProviderName() {
      let name;
      this.providers.map((p) => {
        if (p.id === this.selectedProvider) {
          name = p.fullname;
        }
      });

      return name;
    },
    bankOptionMap() {
      return this.bankOptions.reduce((acc, option) => {
        acc[option.id] = option;
        return acc;
      }, {});
    },
    canOpenCreateSettlement() {
      return Boolean(
        this.settlementForm.provider_id &&
        this.settlementForm.settle_date
      );
    },
    canCreateSettlement() {
      const amount = parseFloat(this.settlementForm.amount);
      const hasAmount = !Number.isNaN(amount) && amount >= 0;
      return (
        Boolean(this.settlementForm.settle_date) &&
        Boolean(this.settlementForm.paid_at) &&
        Boolean(this.settlementForm.provider_id) &&
        Boolean(this.settlementForm.bank_id) &&
        hasAmount
      );
    },
    billPaymentTableItems() {
      if (!this.activeSettlement || !this.activeSettlement.bill_payments) {
        return [];
      }
      return this.activeSettlement.bill_payments.map((payment) => ({
        ...payment,
        paid_at_display: payment.paid_at
          ? this.formatDateTime(payment.paid_at)
          : "-",
        bank_display: this.getBankLabel(payment.bank_id),
        amount_display: this.formatCurrency(payment.amount),
      }));
    },
    isBillPaymentCreate() {
      return this.billPaymentDialogMode === "create";
    },
    isBillPaymentEdit() {
      return this.billPaymentDialogMode === "edit";
    },
    billPaymentDialogTitle() {
      if (this.isBillPaymentCreate) {
        return "เพิ่มการชำระ";
      }
      if (this.isBillPaymentEdit) {
        return "แก้ไขยอดชำระ";
      }
      return "จัดการการชำระ";
    },
    billPaymentSubmitLabel() {
      return this.isBillPaymentCreate ? "เพิ่ม" : "บันทึก";
    },
    canSubmitBillPayment() {
      const amount = parseFloat(this.billPaymentForm.amount);
      const hasAmount = !Number.isNaN(amount) && amount >= 0;

      if (!hasAmount) {
        return false;
      }

      if (this.isBillPaymentCreate) {
        return (
          Boolean(this.billPaymentForm.paid_at) &&
          Boolean(this.billPaymentForm.bank_id) &&
          Boolean(this.activeSettlement && this.activeSettlement.id)
        );
      }

      return Boolean(this.billPaymentForm.id);
    },
    maxPaidAt() {
      return moment().format("YYYY-MM-DDTHH:mm");
    },
    showItem() {
      if (!this.selectedWeeksResponse) {
        console.log(this.selectedWeeksResponse);
        return [];
      }
      const sortedResponse = this.selectedWeeksResponse.sort((a, b) => {
        const startTimeA = moment(a.time_start.replace("Z", ""));
        const startTimeB = moment(b.time_start.replace("Z", ""));
        return startTimeA - startTimeB;
      });
      return sortedResponse.map((item, index) => {
        const startTimeStripped = item.time_start.replace("Z", "");
        const endTimeStripped = item.time_end.replace("Z", "");
        const startTime = moment(startTimeStripped)
          .subtract(1, "minutes")
          .format("YYYY-MM-DD HH:mm:ss");
        const endTime = moment(endTimeStripped).format("YYYY-MM-DD HH:mm:ss");
        const formattedStartTime =
          moment(startTime).format("DD/MM/YY HH:mm:ss");
        const formattedEndTime = moment(endTime).format("DD/MM/YY HH:mm:ss");
        const formattedStartTimeNoTime = moment(startTime).format("DD/MM/YY");
        const durationInHours = moment(endTime).diff(
          moment(startTime),
          "hours",
          true
        );

        let discount = 0;
        let realPrice = item.total_price;

        if (item.match_discount && item.match_discount.total_discount) {
          discount = item.match_discount.total_discount;
          realPrice = item.total_price - discount;
        }
        const total_on_matchday = calculateTotalOnMatchday(item);

        // const summaryAll = `${formattedStartTimeNoTime} ${durationInHours.toFixed(
        //   2
        // )}hr ${realPrice}`;
        const summaryAll = `${formattedStartTimeNoTime} ${durationInHours.toFixed(
          2
        )}hr ${total_on_matchday}`;

        return {
          No: index + 1,
          id: item.id,
          start_date: formattedStartTime,
          end_date: formattedEndTime,
          hr: durationInHours.toFixed(2),
          sumary_price: item.total_price,
          real_price: realPrice,
          discount: item.match_discount?.promotion?.name
            ? `${discount} (${item.match_discount.promotion.name})`
            : discount.toString(),
          sumary_all: summaryAll,
          provider_id: item.provider_id,
          provider_name: item.provider?.fullname,
          user_fullname: item.user?.fullname || '-',
          sport_name: item.sport?.name || '-',
          insurance: item.insurance_bundle_order?.net_price || 0,
          created_at: moment(item.created_at).format("DD/MM/YY HH:mm:ss"),
          total_on_matchday: total_on_matchday,
        };
      });
    },
    totalRealPrice() {
      if (!this.showItem || !this.showItem.length) return 0;

      const total = this.showItem.reduce((acc, item) => {
        const price = Number(item.real_price);
        return acc + (isNaN(price) ? 0 : price);
      }, 0);

      return total;
    },
    totalOnMatchdayPrice() {
      if (!this.showItem || !this.showItem.length) return 0;

      const total = this.showItem.reduce((acc, item) => {
        const price = Number(item.total_on_matchday);
        return acc + (isNaN(price) ? 0 : price);
      }, 0);

      return total;
    },
    totalHours() {
      if (!this.selectedWeeksResponse || !this.selectedWeeksResponse.length)
        return 0;

      const total = this.selectedWeeksResponse.reduce((acc, item) => {
        const startTimeStripped = item.time_start.replace("Z", "");
        const endTimeStripped = item.time_end.replace("Z", "");
        const startTime = moment(startTimeStripped)
          .subtract(1, "minutes")
          .format("YYYY-MM-DD HH:mm:ss");
        const endTime = moment(endTimeStripped).format("YYYY-MM-DD HH:mm:ss");
        const durationInHours = moment(endTime).diff(
          moment(startTime),
          "hours",
          true
        );
        return acc + durationInHours;
      }, 0);

      return total.toFixed(2);
    },
  },

  created() {
    this.yearOptions = this.generateYearOptions();
    this.selectedYearValue = this.defaultYear;
    this.resetSettlementForm({ preserveSelection: false });
    this.fetchProviders();
  },
};
</script>

<style scoped>
.filter-card {
  border-radius: 12px;
}

.filter-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px 0 16px;
}

.year-select {
  max-width: 180px;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.filter-action-btn {
  min-width: 150px;
}

.full-width {
  width: 100%;
}

.settlement-card {
  border-radius: 12px;
}

.settlement-create-trigger {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.settlement-create-context {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.settlement-context-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}

.context-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.context-value {
  font-weight: 500;
}

.settlement-list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.use-paid-at-switch {
  margin-left: auto;
}

.bill-settlement-list {
  max-height: 260px;
  overflow-y: auto;
}

.bill-settlement-item {
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.bill-settlement-item:hover {
  background-color: rgba(29, 111, 66, 0.08);
}

.dialog-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dialog-subtitle {
  font-size: 0.875rem;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.6);
}

.bill-payment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.bill-payment-entry {
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bill-payment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.bill-payment-actions {
  display: flex;
  justify-content: flex-end;
}

.summary-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 600px) {
  .summary-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .filter-action-btn {
    flex: 1 1 calc(50% - 12px);
  }

  .settlement-list-header {
    align-items: flex-start;
  }

  .dialog-title {
    gap: 6px;
  }

  .filter-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .year-select {
    max-width: 100%;
  }
}
</style>
