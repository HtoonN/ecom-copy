<template>
  <v-card-title
    >Manage Provider Packages ( {{ pagination.total }} )</v-card-title
  >
  <v-row class="mx-5 mt-3">
    <v-col
      ><v-text-field
        label="Enter Provider Name"
        variant="outlined"
        density="compact"
        v-model="filter.search"
        clearable
      ></v-text-field
    ></v-col>
    <v-col
      ><v-select
        label="Select Package"
        variant="outlined"
        density="compact"
        item-value="id"
        item-title="name"
        :items="providerPackages"
        v-model="filter.provider_package"
        clearable
      ></v-select
    ></v-col>
    <v-col
      ><vue-date-picker
        v-model="filter.end_date"
        placeholder="Expired at"
        :enable-time-picker="false"
        :format="previewFormat(filter.end_date)"
        auto-apply
        :input-class="'custom-input'"
    /></v-col>
    <v-col cols="12" lg="auto"
      ><v-btn color="primary" @click="search">Search</v-btn>
      <v-btn color="primary" class="ml-2" @click="refreshFilter">Clear</v-btn>
      <v-btn color="blue" class="ml-2" @click="refresh" variant="outlined">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-col>
  </v-row>

  <v-card class="ma-4">
    <v-data-table-server
      v-model:items-per-page="pagination.perPage"
      :headers="header"
      :items="pagination.data"
      :itemsLength="pagination.total"
      :loading="loading"
      class="elevation-1"
      fixed-header
      height="calc(100dvh - 330px)"
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
      <template v-slot:item.manage="{ item }">
        <v-btn @click="openEditModel(item)" size="small" color="primary">
          Manage
        </v-btn>
      </template>
      <template v-slot:item.package="{ item }">
        {{ item.package.name }}
      </template>
      <template v-slot:item.end_date="{ item }">
        {{ formatDate(item.pos_subscription.end_date) }}
      </template>
      <template v-slot:item.remaining_days="{ item }">
        {{ remainingDays(item.pos_subscription.end_date) }} Days
      </template>
    </v-data-table-server>
  </v-card>
  <manage-provider-packages-model
    ref="edit_model"
    @refresh="fetch(preparePayload)"
  />
</template>

<script>
import moment from "moment";
import ManageProviderPackagesModel from "../components/ManageProviderPackagesModel.vue";
import ConsoleService from "../api/ConsoleService";
import { formatEndDate, previewFormat } from "../helper/helper";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
export default {
  components: { ManageProviderPackagesModel, VueDatePicker },
  name: "manageProviderPackages",
  data() {
    return {
      previewFormat,
      loading: false,
      pagination: {
        data: [],
        page: 1,
        perPage: 20,
        total: 10,
        lastPage: 10,
      },
      providerPackages: [],

      filter: { provider_package: null, end_date: null, search: null },
    };
  },
  computed: {
    header() {
      return [
        {
          title: "Provider ID",
          key: "id",
          sortable: false,
        },
        {
          title: "Name",
          key: "fullname",
          sortable: false,
        },
        {
          title: "Package",
          key: "pos_subscription.package.name",
          sortable: false,
        },
        {
          title: "Expired at",
          key: "end_date",
          sortable: false,
        },
        {
          title: "Remaining Days",
          key: "remaining_days",
          sortable: false,
        },
        {
          title: "",
          align: "end",
          key: "manage",
          sortable: false,
        },
      ];
    },
    randomProviders() {
      const packageOptions = [
        { id: 1, name: "Premium One" },
        { id: 2, name: "Premium Two" },
        { id: 3, name: "Premium Gold" },
        { id: 4, name: "Premium Ultra" },
      ];

      const randomDate = () => {
        const start = new Date();
        const end = new Date("2026-12-31");
        const date = new Date(
          start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
        return date.toISOString().split("T")[0]; // returns "YYYY-MM-DD"
      };

      const randomId = () =>
        Math.floor(Math.random() * 90000 + 10000).toString();

      const providers = [];
      for (let i = 0; i < 20; i++) {
        const pkg =
          packageOptions[Math.floor(Math.random() * packageOptions.length)];
        providers.push({
          provider_id: randomId(),
          provider_name: `Provider Name ${i + 1}`,
          package: { ...pkg },
          end_date: randomDate(),
        });
      }

      return providers;
    },
    preparePayload() {
      return {
        page: this.pagination.page,
        search: this.filter.search,
        package_id: this.filter.provider_package,
        end_date: formatEndDate(this.filter.end_date),
      };
    },
  },
  methods: {
    openEditModel(data) {
      this.$refs.edit_model.open(data);
    },
    formatDate(date) {
      return moment(date).format("DD/MM/YYYY");
    },
    remainingDays(date) {
      return moment(date).diff(moment(), "days");
    },
    cleanFilter() {
      this.filter = { search: null, end_date: null, provider_package: null };
    },
    async fetch(payload) {
      const res = await ConsoleService.getProviderPackage(payload);
      if (res) {
        this.pagination = res;
      }
    },
    refreshFilter() {
      this.cleanFilter();
      this.fetch({ page: 1 });
    },
    search() {
      this.fetch({
        ...this.preparePayload,
        page: 1,
      });
    },
    updatePage(newPage) {
      if (newPage != "...") {
        this.pagination.page = parseInt(newPage);
        this.fetch({
          page: newPage,
          ...this.preparePayload,
        });
      }
    },
    refresh() {
      this.fetch(this.preparePayload);
    },
  },
  async mounted() {
    this.fetch({ page: 1 });
    this.providerPackages = await ConsoleService.getPackages();
  },
};
</script>

<style scoped>
.custom-input {
  border: 2px solid #42b983;
  border-radius: 8px;
  padding: 8px;
  font-weight: bold;
  color: #333;
}
</style>
