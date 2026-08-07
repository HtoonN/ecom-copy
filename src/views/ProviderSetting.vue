<template>
  <div v-if="!selectedData" class="w-100">
    <v-card-title>Provider Settings ({{ pagination.total }})</v-card-title>
  <v-row class="mx-5 mt-3">
    <v-col cols="4"
      ><v-text-field
        label="Enter Provider Name"
        variant="outlined"
        density="compact"
        v-model="filter.search"
        append-inner-icon="mdi-magnify"
        clearable
        @update:modelValue="fetch({ page: 1 })"
      ></v-text-field
    ></v-col>
    <v-col>
      <v-btn color="blue" class="ml-5" @click="fetch" variant="outlined"
        ><v-icon>mdi-refresh</v-icon></v-btn
      >
    </v-col>
  </v-row>

  <v-data-table-server
    v-model:items-per-page="pagination.perPage"
    :headers="header"
    :items="pagination.data"
    :itemsLength="pagination.total"
    :loading="loading"
    class="elevation-1 my-custom-table cursor-pointer"
    fixed-header
    height="calc(100dvh - 295px)"
    @click:row="handleRowClick"
  >
    <template v-slot:bottom>
      <v-pagination
        v-model="pagination.page"
        :length="pagination.lastPage"
        @next="updatePage"
        @prev="updatePage"
        :total-visible="5"
      >
        <template v-slot:item="item">
          <v-btn
            :key="item"
            fab
            small
            class="ma-2 elevation-0"
            @click="updatePage(item.page)"
            :color="pagination.page == item.page ? 'grey-lighten-2' : ''"
          >
            {{ item.page }}
          </v-btn>
        </template>
      </v-pagination>
    </template>

    <template
      v-for="column in header"
      v-slot:[`item.${column.key}`]="{ item }"
      :key="column.key"
    >
      <template
        v-if="
          ![
            'id',
            'fullname',
            'liff_verify_slip_text',
            'allow_booking_move',
            'max_booking_movements',
            'liff_booking_minute',
            'min_duration',
            'fix_duration',
            'actions',
            'bank_account',
            'commission'
          ].includes(column.key)
        "
      >
        <div class="d-flex justify-center" v-if="item.provider_setting">
          <v-icon
            :color="item.provider_setting[column.key] ? 'success' : 'grey'"
            >{{
              "mdi-check-bold"
            }}
          </v-icon>
        </div>
        <div v-else class="text-center">-</div>
      </template>

      <template v-else-if="column.key === 'allow_booking_move'">
        <div class="d-flex justify-start ga-1" v-if="item.provider_setting">
          <v-chip
            v-if="item.provider_setting[column.key]"
            style="white-space: nowrap"
            v-for="(txt, index) in allowBookingMoveText(
              item.provider_setting[column.key]
            )"
            :key="index"
            >{{ txt.toUpperCase() }}</v-chip
          >
          <div v-else>-</div>
        </div>
        <div v-else>-</div>
      </template>

      <template v-else-if="column.key === 'liff_verify_slip_text'">
        <span style="white-space: wrap">{{
          item.provider_setting && item.provider_setting[column.key]
            ? item.provider_setting[column.key]
            : "-"
        }}</span></template
      >

      <template v-else-if="column.key === 'commission'">
        <div class="d-flex justify-center">
          <v-icon
            v-if="item.commission"
            color="success"
          >
            mdi-check-bold
          </v-icon>
          <span v-else>-</span>
        </div>
      </template>

      <template v-else-if="column.key === 'id'">
        {{ item.id }}
      </template>

      <template v-else-if="column.key === 'fullname'">
        <span style="white-space: nowrap">{{
          item.fullname
        }}</span></template
      >

      <template v-else-if="column.key === 'liff_booking_minute'">
        <template v-if="item.provider_setting">
          {{ item.provider_setting[column.key] }}
          {{
            item.provider_setting[column.key]
              ? item.provider_setting[column.key] > 1
                ? "Mins"
                : "Min"
              : "-"
          }}
        </template>
        <template v-else>-</template>
      </template>

      <template v-else-if="column.key === 'max_booking_movements'">
        <template v-if="item.provider_setting">
          {{ item.provider_setting[column.key] }}
          {{
            item.provider_setting[column.key]
              ? item.provider_setting[column.key] > 1
                ? "Times"
                : "Time"
              : "-"
          }}
        </template>
        <template v-else>-</template>
      </template>

      <template v-else-if="column.key === 'min_duration' || column.key === 'fix_duration'">
        {{
          item.provider_setting && item.provider_setting[column.key] != null
            ? item.provider_setting[column.key] + ' Min'
            : "-"
        }}
      </template>

      <template v-else-if="column.key === 'actions'">
        <v-btn
          icon
          @click="openModel(item)"
          variant="text"
          size="small"
          color="primary"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>

      <template v-else-if="column.key === 'bank_account'">
        <v-btn
          @click.stop="openBankAcountModel(item)"
          size="x-small"
          color="primary"
          variant="outlined"
          disabled
        >
        Bank Account
        </v-btn>
      </template>

      <template v-else>
        {{ item.provider_setting ? item.provider_setting[column.key] : '-' }}
      </template>
    </template>
  </v-data-table-server>
  </div>

  <div v-else class="w-100 px-2 fade-in">
    <div class="d-flex align-center mb-3 mt-1">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" color="primary" @click="selectedData = null" class="font-weight-bold text-body-1 ml-n2">ย้อนกลับไปหน้ารายการ (Back to list)</v-btn>
    </div>
    <provider-setting-model :providerData="selectedData" @refresh="fetch(preparePayload)" @close="selectedData = null" />
  </div>

  <provider-bank-account ref="bank_acc" />
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import ProviderBankAccount from '../components/providerBankAccount.vue';
import ProviderSettingModel from "../components/ProviderSettingModel.vue";
export default {
  components: { ProviderSettingModel, ProviderBankAccount },
  name: "providerSetting",
  data() {
    return {
      selectedData: null,
      loading: false,
      pagination: {
        data: [],
        page: 1,
        perPage: 20,
        total: 0,
        lastPage: 0,
      },

      filter: { search: null },
    };
  },
  computed: {
    header() {
      return [
        {
          title: "ID",
          key: "id",
          sortable: false,
          width: "20%",
        },
        {
          title: "Name",
          key: "fullname",
          sortable: false,
        },
        {
          title: "Bank Account",
          key: "bank_account",
          sortable: false,
        },
        {
          title: "Commission VAT",
          key: "commission",
          sortable: false,
          align: "center",
        },
        {
          title: "Booking Scope Enable",
          key: "book_scope_enable",
          sortable: false,
          align: "center",
        },
        {
          title: "Show Court Type",
          key: "show_court_type",
          sortable: false,
        },
        {
          title: "Show Logo on Receipt",
          key: "show_logo_on_receipt",
          sortable: false,
        },
        {
          title: "Show Court",
          key: "show_court",
          sortable: false,
        },
        {
          title: "Tax Invoice Enable",
          key: "tax_invoice_enable",
          sortable: false,
        },
        {
          title: "Withholding Tax Enable",
          key: "withholding_tax_enable",
          sortable: false,
        },
        {
          title: "Noti Booking Update",
          key: "noti_booking_update",
          sortable: false,
        },
        {
          title: "IoT Enable",
          key: "iot_enabled",
          sortable: false,
        },
        {
          title: "Liff Verify Slip",
          key: "liff_verify_slip",
          sortable: false,
        },
        {
          title: "Liff Check QR in Slip",
          key: "liff_check_qr_in_slip",
          sortable: false,
        },
        {
          title: "QR Generate",
          key: "qr_generate",
          sortable: false,
        },
        {
          title: "Slip Detect Bank Account",
          key: "slip_detect_bank_account",
          sortable: false,
        },
        {
          title: "Half Hour Export Table",
          key: "half_hour_export_table",
          sortable: false,
        },
        {
          title: "Can Select Court",
          key: "can_select_court",
          sortable: false,
        },
        {
          title: "Arena_Mfa",
          key: "arena_mfa",
          sortable: false,
        },
        {
          title: "Liff Show My Booking",
          key: "liff_show_my_booking",
          sortable: false,
        },
        {
          title: "Liff Booking Minute",
          key: "liff_booking_minute",
          sortable: false,
        },
        {
          title: "Max Booking Movements",
          key: "max_booking_movements",
          sortable: false,
        },
        {
          title: "Allow Booking Move",
          key: "allow_booking_move",
          sortable: false,
        },
        {
          title: "Liff Verify Slip Text",
          key: "liff_verify_slip_text",
          sortable: false,
        },
        {
          title: "Fixed Hour",
          key: "fixed_hour",
          sortable: false,
        },
        {
          title: "Half Hour",
          key: "half_hour",
          sortable: false,
        },
        {
          title: "Round Up",
          key: "round_up",
          sortable: false,
        },
        {
          title: "Min Duration",
          key: "min_duration",
          sortable: false,
        },
        {
          title: "Fix Duration",
          key: "fix_duration",
          sortable: false,
        }
      ];
    },

    preparePayload() {
      return {
        page: this.pagination.page,
        search: this.filter.search,
      };
    },
  },
  methods: {
    cleanFilter() {
      this.filter = { search: null, end_date: null, provider_package: null };
    },
    async fetch({ page = 1 }) {
      const res = await ConsoleService.getProviderSetting({
        ...this.preparePayload,
        page,
      });

      this.pagination = res;
    },
    refreshFilter() {
      this.cleanFilter();
      this.fetch(this.preparePayload);
    },
    checkBinaryStatus(value) {
      if (value === 1) return "Enabled";
      if (value === 0) return "Disabled";
      return ""; // Optional: for non-binary inputs
    },
    allowBookingMoveText(type) {
      if (type) {
        return type.split(",");
      } else {
        return "";
      }
    },
    handleRowClick(event, { item }) {
      this.selectedData = item;
    },
    searchChanged(text) {
      console.log(text);
    },

    manage(data) {
      console.log(data);
    },
    updatePage(newPage) {
      if (newPage != "...") {
        this.fetch({ page: parseInt(newPage) });
      }
    },
    openBankAcountModel(data){
      this.$refs.bank_acc.open(data);
      // console.log(data);
    }
  },
  async mounted() {
    // const arr = Array.from({ length: 20 }, (_, i) => {
    //   return {
    //     "provider_id": i + 1000,
    //     "provider_name": `Provider ${i}`,
    //     "book_scope_enable": 0,
    //     "show_court_type": 1,
    //     "show_logo_on_receipt": 1,
    //     "show_court": 1,
    //     "tax_invoice_enable": 0,
    //     "withholding_tax_enable": 0,
    //     "noti_booking_update": 0,
    //     "iot_enabled": 1,
    //     "liff_verify_slip": 0,
    //     "liff_check_qr_in_slip": 1,
    //     "qr_generate": 0,
    //     "slip_detect_bank_account": 0,
    //     "liff_booking_minute": i,
    //     "liff_verify_slip_text": "Some Text",
    //     "allow_booking_move": "line,app", ///line | app | line, app
    //     "max_booking_movements": i,
    //     "half_hour_export_table": 1,
    //     "can_select_court": 1,
    //     "arena_mfa": 0,
    //     "liff_show_my_booking": 0,
    //   };
    // });
    // this.pagination.data = arr;

    this.fetch({ page: 1 });
  },
};
</script>

<style scoped>
tr,
td {
  text-align: center;
}

tr,
th {
  width: 100px;
}

.no-click {
  pointer-events: none;
}

.my-custom-table {
  white-space: nowrap;
}

.cursor-pointer :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.cursor-pointer :deep(tbody tr:hover) {
  background-color: #f0f7ff !important; /* สีฟ้าอ่อนบางๆ สบายตา */
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
