<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="6" md="3" class="pt-5">
        <v-autocomplete label="ชื่อสนาม" :items="providers" v-model="selectedProvider" item-title="fullname"
          item-value="id" @update:modelValue="onProviderSelected" dense clearable></v-autocomplete>
      </v-col>
      <v-col cols="12" sm="6" md="3" class="pt-5">
        <month-and-year-selector @date-selected="selectedDate" />
      </v-col>

      <v-col cols="12" sm="6" md="3" class="pt-5">
        <v-autocomplete class="my-autocomplete" label="Week" :items="weeks" item-text="display" item-title="label"
          v-model="selectedWeek" return-object @change="onWeekSelected" dense clearable>
        </v-autocomplete>
      </v-col>
      <v-col cols="12" sm="6" md="1" class="pt-7">
        <v-btn class="my-button" block color="primary" @click="getData">ค้นหา</v-btn>
      </v-col>

      <v-col cols="12" sm="6" md="1" class="pt-7">
        <v-btn class="my-button" block color="primary" @click="getData">Refresh</v-btn>
      </v-col>

      <v-col cols="12" sm="6" md="1" class="pt-7">
        <v-btn class="my-button" block color="primary" @click="resetSelections">Clear</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="text-right">
        <v-btn @click="exportBySheet" color="#1d6f42" variant="outlined" :disabled="!groupItems.length"><v-icon
            class="mr-2">mdi-microsoft-excel</v-icon>ส่งออก Excel Vat</v-btn>
        <v-btn @click="exportBySheetV2" color="#1d6f42" variant="outlined" :disabled="!groupItems.length"
          class="ml-2"><v-icon class="mr-2">mdi-microsoft-excel</v-icon>ส่งออก Excel Vat V2</v-btn>
        <v-btn @click="openPdfSettings" color="#C62828" variant="outlined" :disabled="!groupItems.length"
          class="ml-2"><v-icon class="mr-2">mdi-file-pdf-box</v-icon>PDF Vat</v-btn>
        <v-btn @click="exportExcel(groupItems)" color="#0000FF" variant="outlined" :disabled="!groupItems.length"
          class="ml-2"><v-icon class="mr-2">mdi-microsoft-excel</v-icon>ส่งออก Excel</v-btn>
      </v-col>
    </v-row>
    <v-card outlined elevation="2" class="pa-3 my-5" v-for="(item, index) in groupItems" :key="index">
      <v-card-title class="text-h6 d-flex justify-space-between">
        <div>
          <span style="font-weight: bolder">{{ item.provider.fullname }}</span>
          : {{ selectedWeekText }}
        </div>
      </v-card-title>
      <v-card-title class="text-h6">รวม {{ item.total_hr.toFixed(2) }} ชั่วโมง
        ราคารวม {{ formatNumberWithCommas(item.total_summary_price) }} บาท
      </v-card-title>
      <!-- ราคาสุทธิ {{ formatNumberWithCommas(item.total_price) }} บาท -->
      <v-card-text>
        <v-data-table-virtual :headers="headers" :items="item.items" :height="item.items.length > 4 ? '250' : ''"
          item-value="name" fixed-header :row-props="getRowProps"></v-data-table-virtual>
      </v-card-text>
    </v-card>

    <v-dialog v-model="pdfDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">ตั้งค่า PDF VAT</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">เลือกสนามที่จะส่งออก</div>
                <v-autocomplete v-model="pdfSelectedProvider" :items="pdfProviderOptions" item-title="title"
                  item-value="value" label="เลือกสนาม (สามารถพิมพ์ค้นหาและเลือกได้หลายสนาม)" variant="outlined"
                  density="compact" hide-details class="mb-4" multiple chips clearable></v-autocomplete>

                <div class="text-subtitle-1 mb-2">เลือกข้อมูลเพิ่มเติม</div>
                <v-checkbox v-model="pdfColumns" value="bookerName" label="ชื่อผู้จอง (Booker Name)"
                  hide-details></v-checkbox>
                <v-checkbox v-model="pdfColumns" value="sport" label="ประเภทกีฬา (Sport Type)"
                  hide-details></v-checkbox>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="pdfDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="text" @click="confirmExportPdfVat">ส่งออก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import moment from "moment-timezone";
import Swal from "sweetalert2";
import monthAndYearSelector from "../components/monthAndYearSelector.vue";
import exportExcelAllTablesV2 from "../helper/export_excel_all_tablesV2";
import formatNumberWithCommas from "../helper/formatNumberWithComma";
import excel_by_sheet from "../helper/excel_by_sheet";
import excel_by_sheet_v2 from "../helper/excel_by_sheet_v2";
import exportPdfVat from "../helper/pdf_by_sheet";
import format_date_time from "../helper/format_date_time";

export default {
  name: "account2View",
  components: { monthAndYearSelector },
  data() {
    return {
      formatNumberWithCommas,
      selectedMonth: null,
      selectedWeek: null,
      year: null,
      weeks: [],
      headers: [
        { title: "ลำดับ", align: "start", key: "no" },
        { title: "ID", align: "end", key: "id" },
        { title: "ชื่อผู้จอง", key: "user_fullname" },
        { title: "ประเภทกีฬา", key: "sport_name" },
        { title: "เวลาเริ่ม", align: "start", key: "start_date" },
        { title: "เวลาสิ้นสุด", align: "start", key: "end_date" },
        { title: "สร้างเมื่อ", align: "start", key: "created_at" },
        { title: "ชั่วโมง", align: "end", key: "hr" },
        { title: "ราคารวม", align: "end", key: "sumary_price" },
        { title: "ค่าธรรมเนียม", align: "end", key: "fee" },
        { title: "มัดจำ", align: "end", key: "deposit_amount" },
        { title: "ค่าบริการ", align: "end", key: "service_price" },
        { title: "ราคาส่วนลด", align: "end", key: "discount_name" },
        { title: "ส่วนลด", align: "end", key: "discount" },
        { title: "ประเภทส่วนลด", align: "end", key: "is_matchday" },
        { title: "ราคาสุทธิ", align: "end", key: "net_price" },
        { title: "ประกัน", align: "end", key: "insurance" },
        { title: "สรุป ", align: "end", key: "sumary_all" },
      ],
      selectedWeekText: null,
      groupItems: [],
      pdfDialog: false,
      pdfSelectedProvider: [],
      pdfColumns: [],
      tableLoading: false,
      provider_id: null,
      selectedProvider: null,
      providers: [],
      sortedResponse: [],
    };
  },
  beforeCreate() {
    this.months = [
      "มกราคม 2024",
      "กุมภาพันธ์ 2024",
      "มีนาคม 2024",
      "เมษายน 2024",
      "พฤษภาคม 2024",
      "มิถุนายน 2024",
      "กรกฎาคม 2024",
      "สิงหาคม 2024",
      "กันยายน 2024",
      "ตุลาคม 2024",
      "พฤศจิกายน 2024",
      "ธันวาคม 2024",
    ];
  },
  _methods: {
    getRowProps({ item }) {
      return {
        class: item.isSummaryRow ? 'summary-row' : ''
      };
    },
    exportExcel(tables) {
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

          let combinedData = [];

          tables.forEach((table) => {
            const obj = {};
            obj.selectedWeekText = `${table.provider.fullname} : ${this.selectedWeekText}`;
            obj.totalBooking = table.total_booking ?? 0;
            obj.totalText = `รวม ${table.total_hr.toFixed(
              2
            )} ชั่วโมง ${formatNumberWithCommas(table.total_summary_price)} บาท`;

            // เอา summary rows ไปต่อท้ายข้อมูลปกติ (เฉพาะตอน export excel)
            const regularItems = table.items.filter(item => !item.isSummaryRow);
            const summaryItems = table.items.filter(item => item.isSummaryRow);
            const data = [...regularItems, ...summaryItems].map((item) => ({
              no: item.no,
              id: item.id,
              user_fullname: item.user_fullname,
              sport_name: item.sport_name,
              start_date: item.start_date,
              end_date: item.end_date,
              created_at: item.created_at,
              hr: item.hr,
              sumary_price: item.sumary_price,
              discount_name: item.discount_name,
              discount: item.discount,
              is_matchday: item.is_matchday,
              net_price: item.net_price,
              insurance: item.insurance?.toString() || '0',
              fee: item.fee?.toString() || '0',
              deposit_amount: item.deposit_amount?.toString() || '0',
              service_price: item.service_price?.toString() || '0',
              sumary_all: item.sumary_all
            }));

            obj.items = data;

            combinedData.push(obj);
          });

          //console.log(combinedData);

          exportExcelAllTablesV2({
            tables: combinedData,
            filename: `${this.selectedWeekText} Exported at ${moment().format(
              "DD/MM/YYYY HH:mm:ss"
            )}`,
          });
        }
      });
    },

    exportBySheet() {
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
      const year = this.selectedMonth.split(" ")[1];
      const numericMonth = monthMapping[selectedMonthName] || "01";
      const monthAndYear = `${year}-${numericMonth}`;

      const res = this.getMonthRange(monthAndYear);

      const sheets = [];
      this.groupItems.forEach((table, index) => {
        const obj = {};

        obj.total_pr = formatNumberWithCommas(table.total_price);
        obj.total_hr = table.total_hr;

        obj.sheetName = table.provider.fullname?.slice(0, 30) || `Sheet ${index + 1}`;
        obj.companyName = table.provider.fullname || " ";
        obj.timePeriod = format_date_time(this.selectedWeek?.time_start || res.time_start, this.selectedWeek?.time_end || res.time_end, { longMonth: true });

        const data = table.items
          .filter(item => !item.isSummaryRow) // Exclude summary rows
          .map((item) => ({
            matchId: item.id,
            Customer: item.user_fullname,
            Sport: item.sport_name,
            date: format_date_time(item.start_raw, item.end_raw),
            time: format_date_time(item.start_raw, item.end_raw, { isTime: true }),
            hours: item.hr,
            rate: item.real_price / item.hr,
            total: item.real_price,
          }));

        obj.records = data;

        sheets.push(obj);
      });

      excel_by_sheet(sheets,
        `${this.selectedWeekText} Exported at ${moment().format(
          "DD/MM/YYYY HH:mm:ss"
        )}`
      );
    },

    exportBySheetV2() {
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
      const year = this.selectedMonth.split(" ")[1];
      const numericMonth = monthMapping[selectedMonthName] || "01";
      const monthAndYear = `${year}-${numericMonth}`;

      const res = this.getMonthRange(monthAndYear);

      const sheets = [];
      this.groupItems.forEach((table, index) => {
        const obj = {};

        obj.total_pr = formatNumberWithCommas(table.total_price);
        obj.total_hr = table.total_hr;

        obj.sheetName = table.provider.fullname?.slice(0, 30) || `Sheet ${index + 1}`;
        obj.companyName = table.provider.fullname || " ";
        obj.timePeriod = format_date_time(this.selectedWeek?.time_start || res.time_start, this.selectedWeek?.time_end || res.time_end, { longMonth: true });

        const commission = table.provider.commission || {
          fee: "0",
          fee_type: "percent",
          is_out_vat: 0,
          is_extract_vat: 0
        };
        obj.commission = commission;

        const feeRate = parseFloat(commission.fee) || 0;
        const feeType = commission.fee_type;
        const isOutVat = !!commission.is_out_vat;
        const isExtractVat = !!commission.is_extract_vat;

        const data = table.items
          .filter(item => !item.isSummaryRow) // Exclude summary rows
          .map((item) => {
            const hours = parseFloat(item.hr) || 0;
            const total = parseFloat(item.real_price) || 0;

            // Calculate fee
            let fee = 0;
            if (feeType === 'percent') {
              if (isExtractVat) {
                fee = Math.round(((total / 1.07) * (feeRate / 100)) * 10000) / 10000;
              } else {
                fee = Math.round((total * (feeRate / 100)) * 10000) / 10000;
              }
            } else if (feeType === 'value') {
              fee = Math.round((feeRate * hours) * 10000) / 10000;
            }

            // Calculate vat
            let vat = 0;
            if (isOutVat) {
              vat = Math.round((fee * 0.07) * 10000) / 10000;
            }

            return {
              matchId: item.id,
              Customer: item.user_fullname,
              Sport: item.sport_name,
              date: format_date_time(item.start_raw, item.end_raw),
              time: format_date_time(item.start_raw, item.end_raw, { isTime: true }),
              hours: item.hr,
              rate: item.real_price / item.hr,
              total: item.real_price,
              fee: fee,
              vat: vat,
              start_raw: item.start_raw,
              end_raw: item.end_raw
            };
          });

        obj.records = data;

        sheets.push(obj);
      });

      excel_by_sheet_v2(sheets,
        `${this.selectedWeekText} Exported at ${moment().format(
          "DD/MM/YYYY HH:mm:ss"
        )}`
      );
    },

    openPdfSettings() {
      this.pdfSelectedProvider = [];
      this.pdfDialog = true;
    },

    async confirmExportPdfVat() {
      this.pdfDialog = false;

      Swal.fire({
        title: 'กำลังสร้างไฟล์ PDF...',
        text: 'กรุณารอสักครู่ (อาจใช้เวลาสักพักขึ้นอยู่กับจำนวนข้อมูล)',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
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
        const year = this.selectedMonth.split(" ")[1];
        const numericMonth = monthMapping[selectedMonthName] || "01";
        const monthAndYear = `${year}-${numericMonth}`;

        const res = this.getMonthRange(monthAndYear);

        const targetItems = this.pdfSelectedProvider && this.pdfSelectedProvider.length > 0 && !this.pdfSelectedProvider.includes('ALL')
          ? this.groupItems.filter(item => this.pdfSelectedProvider.includes(item.provider.id))
          : this.groupItems;

        const sheets = [];
        targetItems.forEach((table, index) => {
          const obj = {};
          const feeRate = table.provider.commission?.fee || 0;
          const feeType = table.provider.commission?.fee_type || 'percent';
          const isOutVat = table.provider.commission?.is_out_vat;
          const isExtractVat = table.provider.commission?.is_extract_vat;

          obj.total_pr = formatNumberWithCommas(table.total_price);
          obj.total_hr = table.total_hr;
          obj.commission = { fee: feeRate, fee_type: feeType, is_out_vat: isOutVat, is_extract_vat: isExtractVat };

          obj.sheetName = table.provider.fullname?.slice(0, 30) || `Sheet ${index + 1}`;
          obj.companyName = table.provider.fullname || " ";
          obj.timePeriod = format_date_time(this.selectedWeek?.time_start || res.time_start, this.selectedWeek?.time_end || res.time_end, { longMonth: true });

          const data = table.items
            .filter(item => !item.isSummaryRow)
            .map((item) => {
              return {
                matchId: item.id,
                Customer: item.user_fullname,
                Sport: item.sport_name,
                date: format_date_time(item.start_raw, item.end_raw),
                time: format_date_time(item.start_raw, item.end_raw, { isTime: true }),
                hours: item.hr,
                rate: item.real_price / item.hr,
                total: item.real_price,
                fee: item.fee,
                vat: item.vat
              };
            });

          obj.records = data;
          sheets.push(obj);
        });

        // Let the UI render the sweetalert before heavy PDF task
        await new Promise(resolve => setTimeout(resolve, 100));

        // If exporting more than one provider, download as ZIP
        const shouldZip = targetItems.length > 1;

        await exportPdfVat(sheets, {
          isZip: shouldZip,
          columns: this.pdfColumns,
          onProgress: (current, total) => {
            Swal.update({
              title: `กำลังสร้างไฟล์ PDF (${current}/${total})...`,
              text: `ดำเนินการเสร็จแล้ว ${current} จากทั้งหมด ${total} สนาม`
            });
            Swal.showLoading();
          }
        }, `${this.selectedWeekText} Exported at ${moment().format("DD/MM/YYYY HH:mm:ss")}`);

        Swal.close();
      } catch (error) {
        console.error("PDF Export Error:", error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถสร้างไฟล์ PDF ได้: ' + error.message,
        });
      }
    },

    resetSelections() {
      this.selectedMonth = null;
      this.selectedWeek = null;
      this.selectedWeekText = null;
      this.groupItems = [];
    },

    getData() {
      if (this.selectedWeek) {
        this.triggerWeekSelection();
      } else if (this.selectedMonth) {
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
        const year = this.selectedMonth.split(" ")[1];
        const numericMonth = monthMapping[selectedMonthName] || "01";
        const monthAndYear = `${year}-${numericMonth}`;
        const res = this.getMonthRange(monthAndYear);

        const startDate = moment(res.time_start).format(
          "YYYY/MM/DD"
        );
        const endDate = moment(res.time_end).format(
          "YYYY/MM/DD"
        );

        this.selectedWeekText = `รายเดือน (${selectedMonthName}) : ${startDate} - ${endDate}`;

        this.onWeekSelected(res);

      }
    },

    triggerWeekSelection() {
      if (this.selectedWeek) {
        this.onWeekSelected(this.selectedWeek);

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
      } else {
        console.log("No week selected");
      }
    },

    async onWeekSelected(selectedWeek) {
      try {
        const startTime = selectedWeek.time_start;
        const endTime = selectedWeek.time_end;

        this.tableLoading = true

        const response = await ConsoleService.getMatchV2(startTime, endTime, this.selectedProvider);

        this.sortedResponse = response.sort((a, b) => {
          const startTimeA = moment(a.time_start.replace("Z", ""));
          const startTimeB = moment(b.time_start.replace("Z", ""));
          return startTimeA - startTimeB;
        });

        //Group

        let grouped = Object.values(
          this.sortedResponse.reduce((acc, item) => {
            const key = item.provider_id;
            if (!acc[key]) {
              acc[key] = {
                provider_id: key,
                provider: item.provider,
                items: [],
                total_hr: 0,
                total_summary_price: 0,
                total_price: 0,
                total_booking: 0,
              };
            }
            acc[key].items.push(item);
            acc[key].total_booking += 1;
            return acc;
          }, {})
        );

        const arr = grouped.map((data) => {
          // First, process all items
          const processedItems = data.items.map((item, index) => {
            const startTime = moment(item.time_start)
              .subtract(1, "minutes")
              .format("YYYY-MM-DD HH:mm:ss");
            const endTime = moment(item.time_end).format(
              "YYYY-MM-DD HH:mm:ss"
            );
            const formattedStartTime =
              moment(startTime).format("DD/MM/YY HH:mm:ss");
            const formattedEndTime =
              moment(endTime).format("DD/MM/YY HH:mm:ss");
            const formattedStartTimeNoTime =
              moment(startTime).format("DD/MM/YY");
            const dateKey = moment(startTime).format("YYYY-MM-DD");
            const durationInHours = moment(endTime).diff(
              moment(startTime),
              "hours",
              true
            );
            data.total_hr += durationInHours;

            // Use bill_order from new API structure
            let discount = item.bill_order?.discount || 0;
            let netPrice = item.bill_order?.net_price || 0;
            let isMatchday = item.bill_order?.promotion?.is_matchday === 1;
            let hasPromotion = !!item.bill_order?.promotion;
            let insurance = item.bill_order?.insurance_price || 0;
            let fee = item.bill_order?.fee || 0;

            // Calculate real_price based on discount type
            let realPrice;
            if (hasPromotion) {
              if (isMatchday) {
                // ส่วนลด matchday: net_price + discount
                realPrice = netPrice - discount - insurance;
              } else {
                // ส่วนลด provider: net_price - discount
                realPrice = netPrice - insurance;
              }
            } else {
              // ไม่มีส่วนลด: ใช้ net_price ปกติ
              realPrice = netPrice - insurance;
            }

            data.total_summary_price += realPrice;
            data.total_price += realPrice;
            netPrice = netPrice - insurance

            const summaryAll = `${formattedStartTimeNoTime} ${durationInHours.toFixed(
              2
            )}hr ${realPrice} บาท`;

            return {
              no: index + 1,
              id: item.id,
              start_raw: startTime,
              end_raw: endTime,
              start_date: formattedStartTime,
              end_date: formattedEndTime,
              hr: durationInHours.toFixed(2),
              sumary_price: item?.total_price?.toFixed(2) || 0,
              real_price: realPrice.toFixed(2),
              discount_name: item.bill_order?.promotion?.name || '-',
              discount: discount,
              is_matchday: item.bill_order?.promotion
                ? (item.bill_order.promotion.is_matchday === 1 ? 'matchday' : 'provider')
                : '-',

              sumary_all: summaryAll,
              provider_id: item.provider_id,
              provider_name: item.provider?.fullname,
              user_fullname: item.user?.fullname || '-',
              sport_name: item.sport?.name || '-',
              net_price: netPrice,
              insurance: item.bill_order?.insurance_price || 0,
              fee: fee,
              deposit_amount: item.deposit_amount || 0,
              service_price: item.bill_order?.service_price || 0,
              created_at: moment(item.created_at).format("DD/MM/YY HH:mm:ss"),
              dateKey: dateKey,
              isSummaryRow: false
            };
          });

          // Group by date and add summary rows
          const groupedByDate = {};
          processedItems.forEach(item => {
            if (!groupedByDate[item.dateKey]) {
              groupedByDate[item.dateKey] = [];
            }
            groupedByDate[item.dateKey].push(item);
          });

          // Build final items array with summary rows
          const itemsWithSummary = [];
          let rowNo = 1;
          Object.keys(groupedByDate).sort().forEach(dateKey => {
            const dayItems = groupedByDate[dateKey];
            let dayTotalHr = 0;
            let dayTotalPrice = 0;

            dayItems.forEach(item => {
              item.no = rowNo++;
              dayTotalHr += parseFloat(item.hr);
              dayTotalPrice += parseFloat(item.real_price);
              itemsWithSummary.push(item);
            });

            // Add summary row for this day
            const formattedDate = moment(dateKey).format("DD/MM/YY");
            itemsWithSummary.push({
              no: '',
              id: `รวมวันที่ ${formattedDate}`,
              start_date: '',
              end_date: '',
              created_at: '',
              hr: dayTotalHr.toFixed(2),
              sumary_price: '',
              discount_name: '',
              discount: '',
              is_matchday: '',
              net_price: dayTotalPrice.toFixed(2),
              insurance: '',
              fee: '',
              deposit_amount: '',
              service_price: '',
              sumary_all: `รวม ${dayTotalHr.toFixed(2)} ชม. ${dayTotalPrice.toFixed(2)} บาท`,
              isSummaryRow: true
            });
          });

          return { ...data, items: itemsWithSummary };
        });
        this.groupItems = arr;
      } catch (error) {
        console.error("Error in onWeekSelected:", error);
      } finally {
        this.tableLoading = false
      }
    },

    selectedDate(date) {
      this.selectedMonth = date;
      this.fetchDatas();
    },

    async fetchProviders() {
      try {
        const response = await ConsoleService.getProviders();
        this.providers = response;
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    },

    async fetchDatas() {
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
      const year = this.selectedMonth.split(" ")[1];
      const numericMonth = monthMapping[selectedMonthName] || "01";
      const monthAndYear = `${year}-${numericMonth}`;

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
    onProviderSelected(provider_id) {
      this.provider_id = provider_id || null;
    },
    getMonthRange(yyyyMm) {
      const [year, month] = yyyyMm.split("-").map(Number);

      // Start of month → 00:00:00
      const start = new Date(year, month - 1, 1, 0, 0, 0);

      // End of month → 23:59:59
      const end = new Date(year, month, 0, 23, 59, 59);

      // Format YYYY-MM-DD HH:MM:SS in local time
      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

      return {
        time_start: fmt(start),
        time_end: fmt(end),
      };
    },

  },
  get methods() {
    return this._methods;
  },
  set methods(value) {
    this._methods = value;
  },

  watch: {
    selectedMonth(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchDatas();
      }
    },
    pdfSelectedProvider(newVal, oldVal) {
      if (!newVal || newVal.length === 0) return;
      // If "ALL" was newly added, make it the only selected item.
      if (newVal.includes('ALL') && (!oldVal || !oldVal.includes('ALL'))) {
        this.pdfSelectedProvider = ['ALL'];
      }
      // If "ALL" was already selected and user selected other fields, remove "ALL".
      else if (newVal.includes('ALL') && newVal.length > 1) {
        this.pdfSelectedProvider = newVal.filter(item => item !== 'ALL');
      }
    },
  },

  computed: {
    pdfProviderOptions() {
      const options = this.groupItems.map(item => ({
        title: item.provider.fullname,
        value: item.provider.id
      }));
      options.unshift({ title: 'ส่งออกทั้งหมด (ใช้เวลาโหลดนาน)', value: 'ALL' });
      return options;
    }
  },

  created() {
    console.log('Account 2 created');
    this.fetchProviders();
  },
};
</script>

<style scoped>
.my-autocomplete .v-input__control {
  min-height: 100px;
  width: 50%;
}

.wide-text-field {
  min-height: 50px;
  width: auto;
}

.summary-row {
  background-color: #e0e0e0 !important;
  font-weight: bold;
}
</style>
