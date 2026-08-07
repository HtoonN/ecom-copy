<template>
  <div class="affiliate-page">
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-3">
      <div>
        <h2 class="text-h5 font-weight-bold">Console Affiliate</h2>
        <div class="text-caption text-medium-emphasis">
          ข้อมูลตัวอย่างสำหรับหน้าคอนโซล affiliate
        </div>
      </div>
      <div class="d-flex align-center justify-center ga-2 flex-wrap">
        <div>
          <VueDatePicker
            v-model="selectedMonth"
            :month-picker="true"
            auto-apply
            locale="th"
            format="MMMM yyyy"
            placeholder="เลือกเดือน (ว่าง = ทั้งหมด)"
            input-class-name="month-picker-input"
            @update:model-value="fetchAffiliateData"
          />
        </div>
        <div>
          <v-btn color="blue" variant="outlined" :loading="loading" @click="fetchAffiliateData">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <v-progress-linear v-if="loading" color="primary" indeterminate class="mb-3" />

    <v-row class="mb-2">
      <v-col cols="12" md="4">
        <v-card class="pa-5 metric-card metric-card--booking" rounded="lg" elevation="2">
          <div class="metric-title">จำนวน booking ทั้งหมด</div>
          <div class="metric-value">{{ formatNumber(dashboard.booking_count) }}</div>
          <div class="metric-subtitle">
            {{ selectedMonthLabel }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-5 metric-card metric-card--gmv" rounded="lg" elevation="2">
          <div class="metric-title">ยอดจองรวม</div>
          <div class="metric-value">{{ formatCurrency(dashboard.total_gmv) }}</div>
          <div class="metric-subtitle">
            {{ selectedMonthLabel }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-5 metric-card metric-card--users" rounded="lg" elevation="2">
          <div class="metric-title">User ทั้งหมด</div>
          <div class="metric-value">{{ formatNumber(dashboard.total_users) }}</div>
          <div class="metric-subtitle">
            {{ selectedMonthLabel }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100 list-card" rounded="lg" elevation="2">
          <div class="text-subtitle-1 font-weight-bold mb-3">
            Top 10 User ที่มีคนกดซื้อด้วยเยอะสุด
          </div>
          <v-list density="compact">
            <v-list-item
              v-for="(user, index) in dashboard.top_users"
              :key="user.id"
              class="px-0"
            >
              <template #prepend>
                <v-avatar :class="rankBadgeClass(index)" size="32">
                  <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ user.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatNumber(user.booking_count) }} booking • {{ formatCurrency(user.total_pay) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100 list-card" rounded="lg" elevation="2">
          <div class="text-subtitle-1 font-weight-bold mb-3">
            Top 10 สนามที่มีคนใช้ Affiliate เยอะสุด
          </div>
          <v-list density="compact">
            <v-list-item
              v-for="(provider, index) in dashboard.top_providers"
              :key="provider.id"
              class="px-0"
            >
              <template #prepend>
                <v-avatar :class="rankBadgeClass(index)" size="32">
                  <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ provider.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatNumber(provider.booking_count) }} booking •
                {{ formatCurrency(provider.total_pay) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-4 table-card" rounded="lg" elevation="2">
      <div class="pa-4 d-flex justify-space-between align-center flex-wrap ga-2">
        <div>
          <div class="text-subtitle-1 font-weight-bold">ตารางการใช้งาน</div>
          <div class="text-caption text-medium-emphasis">
            {{ selectedMonthLabel }}
          </div>
        </div>
      </div>
      <v-data-table
        :headers="usageHeaders"
        :items="usageItems"
        item-key="booking_id"
        height="420"
        fixed-header
        class="affiliate-table"
      >
        <template #item.time_range="{ item }">
          <div class="text-body-2">
            {{ formatDateTime(item.time_start) }} - {{ formatDateTime(item.time_end) }}
          </div>
        </template>
        <template #item.total_pay="{ item }">
          <span class="font-weight-medium">{{ formatCurrency(item.total_pay) }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import moment from "moment";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import localService from "../api/localService";

export default {
  components: { VueDatePicker },
  data() {
    return {
      selectedMonth: null,
      dashboard: {
        booking_count: 0,
        total_gmv: 0,
        total_users: 0,
        top_users: [],
        top_providers: [],
      },
      usageItems: [],
      loading: false,
      usageHeaders: [
        { title: "Booking ID", key: "booking_id", sortable: false },
        { title: "Provider Name", key: "provider_name", sortable: false },
        { title: "Time Start + Time End", key: "time_range", sortable: false },
        { title: "Affiliate ID", key: "affiliate_id", sortable: false },
        { title: "Affiliate Name", key: "affiliate_name", sortable: false },
        { title: "Total Pay", key: "total_pay", sortable: false },
      ],
    };
  },
  computed: {
    selectedMonthLabel() {
      if (!this.selectedMonth) return "ภาพรวมทั้งหมด";
      return `เดือน ${moment(this.selectedMonth).format("MMMM YYYY")}`;
    },
  },
  methods: {
    async fetchAffiliateData() {
      this.loading = true;
      try {
        const month = this.selectedMonth;
        const [dashboardRes, usageRes] = await Promise.all([
          localService.getConsoleAffiliateDashboard({ month }),
          localService.getConsoleAffiliateUsage({ month }),
        ]);

        const dashboard = dashboardRes?.data || {};
        this.dashboard = {
          booking_count: dashboard.booking_count || 0,
          total_gmv: dashboard.total_gmv || 0,
          total_users: dashboard.total_users || 0,
          top_users: dashboard.top_users || [],
          top_providers: dashboard.top_providers || [],
        };
        this.usageItems = usageRes?.data?.items || [];
      } finally {
        this.loading = false;
      }
    },
    formatNumber(value) {
      return Number(value || 0).toLocaleString("th-TH");
    },
    formatCurrency(value) {
      return Number(value || 0).toLocaleString("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatDateTime(value) {
      if (!value) return "-";
      return moment(value, "YYYY-MM-DD HH:mm").format("DD/MM/YYYY HH:mm");
    },
    rankBadgeClass(index) {
      if (index === 0) return "rank-badge rank-badge--gold";
      if (index === 1) return "rank-badge rank-badge--bronze";
      if (index === 2) return "rank-badge rank-badge--silver";
      return "rank-badge";
    },
  },
  mounted() {
    this.fetchAffiliateData();
  },
};
</script>

<style scoped>
.affiliate-page {
  min-height: 99dvh;
  padding: 8px 4px 16px;
}

.metric-card {
  border-top: 4px solid transparent;
  position: relative;
  overflow: hidden;
}

.metric-card--booking {
  border-top-color: #3949ab;
}

.metric-card--gmv {
  border-top-color: #00897b;
}

.metric-card--users {
  border-top-color: #f9a825;
}

.metric-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #4b4b4b;
}

.metric-value {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 6px;
  color: #111111;
}

.metric-subtitle {
  margin-top: 6px;
  font-size: 0.85rem;
  color: #7b7b7b;
}

.list-card {
  border: 1px solid #f0f0f0;
}

.table-card {
  border: 1px solid #f0f0f0;
}

.affiliate-table :deep(.v-data-table__td),
.affiliate-table :deep(.v-data-table__th) {
  font-size: 0.9rem;
}

:deep(.month-picker-input) {
  min-width: 220px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  padding: 10px 12px;
}

.header-controls {
  padding-top: 4px;
  padding-bottom: 4px;
}

.rank-badge {
  background: #f3f4f6;
  color: #4b4b4b;
}

.rank-badge--gold {
  background: #f9a825;
  color: #ffffff;
}

.rank-badge--silver {
  background: #9ea7b3;
  color: #ffffff;
}

.rank-badge--bronze {
  background: #c7783c;
  color: #ffffff;
}
</style>
