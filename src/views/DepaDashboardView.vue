<template>
  <div class="dashboard-page">
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-3">
      <h2 class="text-h5 font-weight-bold">DEPA Dashboard</h2>
      <div class="d-flex align-center ga-2">
        <!-- <VueDatePicker
          placeholder="Select date range"
          :enable-time-picker="false"
          auto-apply
          locale="th"
          format="dd/MM/yyyy"
          style="width: 260px"
          range
          v-model="dateRange"
          @update:model-value="fetchDashboardData"
        /> -->
        <v-btn
          color="blue"
          variant="outlined"
          :loading="loading"
          @click="fetchDashboardData"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </div>

    <v-progress-linear v-if="loading" color="primary" indeterminate class="mb-3" />

    <v-row>
      <v-col cols="12" lg="6">
        <v-card class="pa-5 h-100 sp-card" rounded="lg" elevation="2">
          <div class="text-h6 font-weight-bold mb-4">จำนวน SP</div>
          <div class="sp-card-content">
            <div class="sp-ring" :style="spRingStyle">
              <div class="sp-ring-inner">
                <div class="text-caption text-medium-emphasis">Paid</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ paidSpPercent.toFixed(0) }}%
                </div>
              </div>
            </div>

            <div class="sp-stats">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Paid SP</span>
                <span class="font-weight-bold sp-paid-value">{{ formatNumber(paidSpCount) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Free SP</span>
                <span class="font-weight-bold sp-free-value">{{ formatNumber(freeSpCount) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-3">
                <span class="text-body-2">Total SP</span>
                <span class="font-weight-bold sp-total-value">{{ formatNumber(paidSpCount + freeSpCount) }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="6">
        <v-card class="pa-4 mb-3 metric-card metric-card--booking" rounded="lg" elevation="2">
          <div class="text-h6 font-weight-bold mb-3">ยอดจำนวนการจองรายครั้ง</div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2">Booking Count</span>
            <span class="text-subtitle-1 font-weight-bold">{{ formatNumber(bookingCount) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-2">Total GMV</span>
            <span class="text-subtitle-1 font-weight-bold">{{ formatCurrency(totalGmv) }}</span>
          </div>
        </v-card>

        <v-card class="pa-4 metric-card metric-card--insurance" rounded="lg" elevation="2">
          <div class="text-h6 font-weight-bold mb-3">ยอดการซื้อประกัน</div>
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-body-2">Sale Count</span>
            <span class="text-subtitle-1 font-weight-bold">{{ formatNumber(insuranceSaleCount) }}</span>
          </div>
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-2">Unique Users</span>
            <span class="text-subtitle-1 font-weight-bold">{{ formatNumber(uniqueUsers) }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import moment from "moment";
import DepaDashboardService from "../api/DepaDashboardService";

export default {
  components: { VueDatePicker },
  data() {
    return {
      bookingCount: 0,
      totalGmv: 0,
      insuranceSaleCount: 0,
      uniqueUsers: 0,
      freeSpCount: 0,
      paidSpCount: 0,
      dateRange: [
        moment().startOf("month").toDate(),
        moment().endOf("month").toDate(),
      ],
      loading: false,
    };
  },
  computed: {
    paidSpPercent() {
      const total = this.freeSpCount + this.paidSpCount;
      if (!total) return 0;
      return (this.paidSpCount / total) * 100;
    },
    spRingStyle() {
      const paid = this.paidSpPercent;
      return {
        background: `conic-gradient(#d60326 0% ${paid}%, #f9a825 ${paid}% 100%)`,
      };
    },
  },
  methods: {
    pickNumberValue(...candidates) {
      const valid = candidates.find(
        (value) => value !== undefined && value !== null
      );
      return Number(valid || 0);
    },
    async fetchDashboardData() {
      this.loading = true;
      try {
        const hasValidRange =
          Array.isArray(this.dateRange) &&
          this.dateRange.length === 2 &&
          this.dateRange[0] &&
          this.dateRange[1];

        const payload = {
          time_start: hasValidRange
            ? moment(this.dateRange[0]).format("YYYY-MM-DD 00:00:00")
            : null,
          time_end: hasValidRange
            ? moment(this.dateRange[1]).format("YYYY-MM-DD 23:59:59")
            : null,
        };

        const res = await DepaDashboardService.getSnapshot(payload);
        const data = res?.data || res || {};
        const booking = data.booking || {};
        const insurance = data.insurance || {};
        const sp = data.sp || data.service_provider || {};

        this.bookingCount = this.pickNumberValue(
          data.booking_count,
          booking.count,
          booking.booking_count
        );
        this.totalGmv = this.pickNumberValue(
          data.total_gmv,
          booking.total_gmv,
          booking.gmv
        );
        this.insuranceSaleCount = this.pickNumberValue(
          data.insurance_sale_count,
          insurance.sale_count,
          insurance.count
        );
        this.uniqueUsers = this.pickNumberValue(
          data.unique_users,
          insurance.unique_users
        );
        this.freeSpCount = this.pickNumberValue(
          data.sp_free_count,
          sp.free,
          sp.free_count
        );
        this.paidSpCount = this.pickNumberValue(
          data.sp_paid_count,
          sp.paid,
          sp.paid_count
        );
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
  },
  mounted() {
    this.fetchDashboardData();
  },
};
</script>

<style scoped>
.dashboard-page {
  min-height: 99dvh;
}

.metric-card {
  border-top: 4px solid transparent;
}

.metric-card--booking {
  border-top-color: #3949ab;
}

.metric-card--insurance {
  border-top-color: #00897b;
}

.metric-card--sp {
  border-top-color: #d60326;
}

.sp-total-value {
  color: #111111;
}

.sp-paid-value {
  color: #d60326;
}

.sp-free-value {
  color: #f9a825;
}

.sp-card {
  min-height: 262px;
}

.sp-card-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 50px;
}

.sp-stats {
  flex: 1;
  max-width: 220px;
}

.sp-ring {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sp-ring-inner {
  width: 126px;
  height: 126px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 960px) {
  .sp-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .sp-stats {
    width: 100%;
    max-width: none;
  }
}
</style>
