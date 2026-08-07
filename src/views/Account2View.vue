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
        {{ formatNumberWithCommas(item.total_price) }} บาท</v-card-title>

      <v-card-text>
        <v-data-table-virtual :headers="headers" :items="item.items" :height="item.items.length > 4 ? '250' : ''"
          item-value="name" fixed-header></v-data-table-virtual>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import moment from "moment-timezone";
import Swal from "sweetalert2";
import monthAndYearSelector from "../components/monthAndYearSelector.vue";
import exportExcelAllTables from "../helper/export_excel_all_tables";
import formatNumberWithCommas from "../helper/formatNumberWithComma";
import exportExcelFun from "../helper/export_excel";
import excel_by_sheet from "../helper/excel_by_sheet";
import format_date_time from "../helper/format_date_time";
import calculateTotalOnMatchday from "../helper/calculateTotalOnMatchday";

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
        { title: "ส่วนลด", align: "end", key: "discount" },
        { title: "ราคาสุทธิ", align: "end", key: "real_price" },
        { title: "ประกัน", align: "end", key: "insurance" },
        { title: "สรุป ", align: "end", key: "sumary_all" },
      ],
      selectedWeekText: null,
      groupItems: [],
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
            obj.totalText = `รวม ${table.total_hr.toFixed(
              2
            )} ชั่วโมง ${formatNumberWithCommas(table.total_price)} บาท`;

            const data = table.items.map((item) => ({
              no: item.no,
              id: item.id,
              user_fullname: item.user_fullname,
              sport_name: item.sport_name,
              start_date: item.start_date,
              end_date: item.end_date,
              hr: item.hr,
              sumary_price: item.sumary_price,
              discount: item.discount,
              real_price: item.real_price,
              insurance: item.insurance.toString(),
              sumary_all: item.sumary_all,
              created_at: item.created_at
            }));

            obj.items = data;

            combinedData.push(obj);
          });

          exportExcelAllTables({
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

        const data = table.items.map((item) => ({
          matchId: item.id,
          Customer: item.user_fullname,
          Sport: item.sport_name,
          date: format_date_time(item.start_raw, item.end_raw),
          time: format_date_time(item.start_raw, item.end_raw, { isTime: true }),
          hours: item.hr,
          rate: item.real_price / item.hr,
          total: item.total_on_matchday,
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

        const response = await ConsoleService.getMatch(startTime, endTime, this.selectedProvider);

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
                total_price: 0,
              };
            }
            acc[key].items.push(item);
            return acc;
          }, {})
        );

        const arr = grouped.map((data) => {
          const a_i = data.items.map((item, index) => {
            const startTimeStripped = item.time_start.replace("Z", "");
            const endTimeStripped = item.time_end.replace("Z", "");
            const startTime = moment(startTimeStripped)
              .subtract(1, "minutes")
              .format("YYYY-MM-DD HH:mm:ss");
            const endTime = moment(endTimeStripped).format(
              "YYYY-MM-DD HH:mm:ss"
            );
            const formattedStartTime =
              moment(startTime).format("DD/MM/YY HH:mm:ss");
            const formattedEndTime =
              moment(endTime).format("DD/MM/YY HH:mm:ss");
            const formattedStartTimeNoTime =
              moment(startTime).format("DD/MM/YY");
            const durationInHours = moment(endTime).diff(
              moment(startTime),
              "hours",
              true
            );
            data.total_hr += durationInHours;

            let discount = 0;
            let realPrice = item.total_price;

            if (item.match_discount && item.match_discount.total_discount) {
              discount = item.match_discount.total_discount;
              realPrice = item.total_price - discount;
            }
            const total_on_matchday = calculateTotalOnMatchday(item);
            data.total_price += total_on_matchday;
            const summaryAll = `${formattedStartTimeNoTime} ${durationInHours.toFixed(
              2
            )}hr ${total_on_matchday} บาท`;

            return {
              no: index + 1,
              id: item.id,
              start_raw: startTime,
              end_raw: endTime,
              start_date: formattedStartTime,
              end_date: formattedEndTime,
              hr: durationInHours.toFixed(2),
              sumary_price: item.total_price.toFixed(2),
              real_price: realPrice.toFixed(2),
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
              total_on_matchday: total_on_matchday.toFixed(2),
            };
          });
          return { ...data, items: a_i };
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
  },

  computed: {},

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
</style>
