<template>
  <v-card-text>
    <v-row align="center" no-gutters>
      <v-col cols="2" md="2" sm="3" class="mr-2">
        วันที่:
        <v-text-field
          v-model="datetime"
          type="date"
          variant="outlined"
          density="compact"
        >
        </v-text-field>
      </v-col>
      <v-col cols="2" md="2" sm="3" class="mr-2">
        ค้นหาจากชื่อสนาม:
        <v-text-field
          v-model="search_name"
          variant="outlined"
          density="compact"
        >
        </v-text-field>
      </v-col>
      <v-col cols="3" md="2" sm="4" class="mr-2">
        ค้นหาจากกีฬา:
        <v-select
          v-model="sports_selected"
          :items="sports"
          multiple
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          :loading="init_loading"
        >
          <template v-slot:selection="{ item, index }">
            <v-chip v-if="index < 2">
              <span>{{ item.title }}</span>
            </v-chip>
            <span
              v-if="index === 2"
              class="text-grey text-caption align-self-center"
            >
              (+{{ sports_selected.length - 2 }} others)
            </span>
          </template>
        </v-select>
      </v-col>
      <v-col cols="2" md="2" sm="3" class="mr-2">
        จังหวัด:
        <v-select
          v-model="province_ids"
          :items="provinces"
          item-title="name_th"
          item-value="id"
          variant="outlined"
          density="compact"
          :loading="init_loading"
          multiple
        >
          <template v-slot:selection="{ item, index }">
            <span v-if="index < 1" class="d-inline-block">
              {{ formatSelection(item.title) }}
            </span>
            <span
              v-if="index === 1"
              class="text-grey text-caption align-self-center ml-1"
            >
              (+{{ province_ids.length - 1 }})
            </span>
          </template>
        </v-select>
      </v-col>
      <v-col cols="2" md="2" sm="3" class="mr-2">
        เขต/อำเภอ:
        <v-select
          v-model="district_ids"
          :items="districts"
          item-title="full_name"
          item-value="id"
          variant="outlined"
          density="compact"
          :loading="init_loading"
          multiple
        >
          <template v-slot:selection="{ item, index }">
            <span v-if="index < 1" class="d-inline-block">
              {{ formatSelection(item.title) }}
            </span>
            <span
              v-if="index === 1"
              class="text-grey text-caption align-self-center ml-1"
            >
              (+{{ district_ids.length - 1 }})
            </span>
          </template>
        </v-select>
      </v-col>
      <v-btn
        @click="search"
        color="blue"
        variant="outlined"
        size="large"
      >
        <v-icon>mdi-magnify</v-icon> ค้นหา
      </v-btn>
      <v-btn
        class="ml-2"
        @click="clearSearch"
        color="primary"
        variant="outlined"
        size="large"
      >
        ล้าง
      </v-btn>
    </v-row>
    <div v-if="!loading">
      <v-card
        v-for="{ provider, courts } in providers"
        class="my-2 pb-2"
        variant="outlined"
      >
        <v-card-title>
          {{ provider.fullname }} - {{ provider?.address?.province?.name_th }}
          {{ provider?.address?.district?.name_th }}
          <v-card-subtitle class="pa-0">
            เปิดปิด: {{ provider.minTime }} -
            {{ maxTimeDisplay(provider.maxTime) }}
            <v-chip v-for="sport in provider.provider_sports" class="mr-1">
              {{ sport.sport.name }}
            </v-chip>
          </v-card-subtitle>
        </v-card-title>
        <v-row class="mt-1">
          <v-col v-for="court in courts" cols="4">
            <v-card-text class="py-0">
              {{ court.court_name }}:
              <v-chip
                v-for="(free, index) in court.frees"
                color="success"
                class="mr-2 mb-1"
                >{{ toTimeFormate(free.time_start) }} -
                {{ toTimeFormate(free.time_end) }}
              </v-chip>
            </v-card-text>
          </v-col>
        </v-row>
      </v-card>
    </div>
    <div v-else class="d-flex align-center justify-center">
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
  </v-card-text>
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import moment from "moment";

export default {
  data() {
    return {
      providers: [],
      datetime: moment().format("YYYY-MM-DD"),
      loading: false,
      province_ids: [],
      district_ids: [],
      provinces: [],
      districts: [],
      init_loading: false,
      search_name: "",
      sports: [],
      sports_selected: [],
    };
  },
  watch: {
    province_ids() {
      this.district_ids = [];
      if (this.province_ids.length > 0) {
        this.getDistricts();
      } else {
        this.districts = [];
      }
    },
  },
  methods: {
    toTimeFormate(date) {
      return moment(date).format("HH:mm");
    },
    maxTimeDisplay(maxTime) {
      var hour = maxTime.split(":")[0];
      var minute = maxTime.split(":")[1];
      return hour > 24 ? hour - 24 + ":" + minute : hour + ":" + minute;
    },
    async fetchDatas() {
      this.loading = true;
      this.providers = await ConsoleService.getProviderFreeCourts({
        datetime: this.datetime,
        province_ids: this.province_ids,
        district_ids: this.district_ids,
        search_name: this.search_name,
        sports_selected: this.sports_selected,
      });
      this.loading = false;
    },
    async initDataFilter() {
      this.init_loading = true;
      this.sports = await ConsoleService.getSports();
      this.provinces = await ConsoleService.getProvinces();
      this.init_loading = false;
    },
    async getDistricts() {
      this.init_loading = true;
      this.districts = [];
      for (const provinceId of this.province_ids) {
        const province = this.provinces.find((p) => p.id === provinceId);
        const districts = await ConsoleService.getDistricts(provinceId);
        const districtsWithProvince = districts.map((d) => ({
          ...d,
          full_name: `${province?.name_th} - ${d.name_th}`,
        }));
        this.districts = [...this.districts, ...districtsWithProvince];
      }
      this.init_loading = false;
    },
    clearSearch() {
      this.datetime = moment().format("YYYY-MM-DD");
      this.province_ids = [];
      this.district_ids = [];
      this.search_name = "";
      this.sports_selected = [];
    },
    search() {
      this.fetchDatas();
    },
    formatSelection(text) {
      if (!text) return "";
      return text.length > 10 ? text.substring(0, 10) + "..." : text;
    },
  },
  mounted() {
    this.initDataFilter();
  },
};
</script>
