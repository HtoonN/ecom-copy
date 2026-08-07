<template>
  <v-card-title>
    Promotion Used
  </v-card-title>
  <v-card-text class="mt-4">
    <v-row dense>
      <v-col cols="7" class="d-flex ga-4 align-center">
        <v-text-field
          label="ค้าหารหัสโปรโมชั่น"
          v-model="search"
          hide-details
          variant="solo"
          single-line
          clearable
          @update:model-value="() => {
            pagination.page = 1;
            fetchData();
          }"
        >
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
        <v-btn color="blue" variant="outlined" @click="fetchData">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="5" class="d-flex justify-end ga-2 align-center">
        <VueDatePicker
          v-model="dateRange"
          range
          :enable-time-picker="false"
          auto-apply
          locale="th"
          placeholder="เลือกช่วงวันที่ใช้"
          @update:model-value="() => { pagination.page = 1; fetchData(); }"
          style="max-width: 300px"
        />
      </v-col>
    </v-row>
  </v-card-text>

  <v-card-text>
    <v-data-table-server
      :headers="headers"
      :items="pagination.data"
      height="calc(100dvh - 360px)"
      fixed-header
      :items-length="pagination.total"
    >
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
              :color="pagination.page == item.page ? 'grey-lighten-2' : ''"
            >
              {{ item.page }}
            </v-btn>
          </template>
        </v-pagination>
      </template>

      <template v-slot:item.no="{ index }">
        {{ index + 1 }}
      </template>

      <template v-slot:item.is_matchday="{ item }">
        {{ item.promotion?.is_matchday ? "MatchDay" : "Provider" }}
      </template>

      <template v-slot:item.name="{ item }">
        {{ item.promotion?.name || '-' }}
      </template>

      <template v-slot:item.provider.fullname="{ item }">
        {{ getProviderName(item.promotion?.provider_id) }}
      </template>

      <template v-slot:item.discount="{ item }">
        {{ getDiscountValue(item.promotion?.type, item.promotion?.value) }}
      </template>

      <template v-slot:item.condition.max_reduction="{ item }">
        {{ getMaxReduction(item.promotion) }}
      </template>

      <template v-slot:item.active_duration="{ item }">
        {{ item.promotion?.active_duration ? `${item.promotion.active_duration} นาที` : "-" }}
      </template>

      <template v-slot:item.expire_date="{ item }">
        {{ formatRange(item.promotion?.expire_start, item.promotion?.expire_end) }}
      </template>

      <template v-slot:item.duration_date="{ item }">
        {{ item.promotion?.duration_start && item.promotion?.duration_end ? formatRange(item.promotion.duration_start, item.promotion.duration_end) : '-' }}
      </template>

      <template v-slot:item.used_date="{ item }">
        {{ formatUsedDate(item.created_at) }}
      </template>

      <template v-slot:item.user_limit="{ item }">
        {{ item.promotion?.user_limit ?? "-" }}
      </template>

    </v-data-table-server>
  </v-card-text>
</template>

<script>
import moment from "moment";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import PromotionUsedService from "../api/PromotionUsedService";
import ConsoleService from "../api/ConsoleService";

export default {
  name: "PromotionUsed",
  components: { VueDatePicker },
  data() {
    return {
      headers: [
        { title: "ลำคับ", key: "no", sortable: false, align: "center" },
        { title: "ประเภท Code", key: "is_matchday", sortable: false, align: "center" },
        { title: "รหัสโปรโมชั่น", key: "name", sortable: false },
        { title: "Provider", key: "provider.fullname", sortable: false },
        { title: "วัน/เวลา ที่ใช้", key: "used_date", sortable: false, align: "center" },
        { title: "ส่วนลด", key: "discount", sortable: false },
        { title: "ลดสุงสุดไม่เกิน", key: "condition.max_reduction", sortable: false },
        { title: "ชั่วโมงที่ลด", key: "active_duration", sortable: false, align: "center" },
        { title: "วันที่จองได้", key: "duration_date", sortable: false, align: "center" },
        { title: "วันที่ใช้งานได้", key: "expire_date", sortable: false, align: "center" },
        { title: "จำนวนการใช้งานต่อคน", key: "user_limit", sortable: false, align: "center" },
      ],
      pagination: {
        page: 1,
        lastPage: 0,
        data: [],
        total: 0,
        pageSize: 20,
      },
      search: null,
      providers: [{ id: null, fullname: "ทั้งหมด" }],
      selected_provider: null,
      dateRange: null,
    };
  },
  methods: {
    updatePage() {
      this.fetchData();
    },
    selectPage(pageNo) {
      if (this.pagination.page !== pageNo) {
        this.pagination.page = Number(pageNo);
        this.fetchData();
      }
    },
    async fetchData() {
      const res = await PromotionUsedService.getPromotionUsers({
        page: this.pagination.page,
        page_size: this.pagination.pageSize,
        promoname: this.search,
        provider_id: this.selected_provider,
        created_from: this.dateRange ? moment(this.dateRange[0]).format("YYYY-MM-DD") : null,
        created_to: this.dateRange ? moment(this.dateRange[1]).format("YYYY-MM-DD") : null,
      });

      const rows = Array.isArray(res?.data) ? res.data : [];
      const sorted = rows
        .slice()
        .sort((a, b) => moment(b.used_at).valueOf() - moment(a.used_at).valueOf());

      this.pagination = {
        page: res?.meta?.page || 1,
        lastPage: res?.meta?.total_pages || 0,
        total: res?.meta?.total || 0,
        pageSize: res?.meta?.page_size || this.pagination.pageSize,
        data: sorted,
      };
    },
    async getProviders() {
      const data = await ConsoleService.getProviders();
      this.providers = [{ id: null, fullname: "ทั้งหมด" }, ...data];
    },
    getProviderName(providerId) {
      if (!providerId) return "-";
      const provider = this.providers.find((p) => p.id === providerId);
      return provider ? provider.fullname : providerId;
    },
    getDiscountValue(type, amount) {
      if (!type && !amount) return "-";
      if (type === "percent") {
        return `${amount} %`;
      }
      return `${amount} บาท`;
    },
    getMaxReduction(promotion) {
      const maxReduction =
        promotion?.condition?.max_reduction ??
        promotion?.apply_conditions?.max_reduction ??
        null;
      return maxReduction ? `${maxReduction} บาท` : " ";
    },
    formatRange(start, end) {
      if (!start || !end) return "-";
      return `${moment(start).format("DD/MM/YYYY")} - ${moment(end).format("DD/MM/YYYY")}`;
    },
    formatUsedDate(value) {
      if (!value) return "-";
      return moment(value).format("DD/MM/YYYY HH:mm");
    },
  },
  mounted() {
    this.fetchData();
    this.getProviders();
  },
};
</script>

<style>
</style>
