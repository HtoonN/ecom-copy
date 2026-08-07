<template>
  <v-dialog v-model="dialog" width="500" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <p>
          Manage Package
          <span class="text-subtitle-2">({{ data.fullname || "" }})</span>
        </p>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="error"
          size="small"
          @click="close"
        ></v-btn>
      </v-card-title>
      <v-divider class="mx-4"></v-divider>
      <v-card-text>
        <v-select
          v-model="value"
          label="Select package"
          variant="solo"
          :items="providerPackage"
          item-value="id"
          item-title="name"
        />
        <!-- <v-text-field
          type="date"
          label="Expired at"
          variant="solo"
          v-model="end_date"
        /> -->
        <vue-date-picker
          v-model="end_date"
          placeholder="Expired at"
          :enable-time-picker="false"
          :teleport="true"
          :format="previewFormat(end_date)"
          auto-apply
          :clearable="false"
        />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" color="primary" @click="close"
            >ยกเลิก</v-btn
          >
          <v-btn class="bg-primary" @click="save" :loading="loading"
            >บันทึก</v-btn
          >
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import { formatEndDate, previewFormat } from "../helper/helper";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

export default {
  components: { VueDatePicker },
  name: "manageProviderPackagesModel",
  emits: ["refresh"],
  data() {
    return {
      previewFormat,
      dialog: false,
      data: null,
      value: null,
      end_date: null,

      loading: false,
      providerPackage: [],
    };
  },
  computed: {},
  methods: {
    open(data) {
      if (data) {
        this.data = { ...data };
        this.value = data.pos_subscription.package.id || null;
        this.end_date = new Date(data.pos_subscription.end_date) || null;

        this.dialog = true;
      }
    },
    close() {
      this.dialog = false;
    },
    clean() {
      this.data = null;
    },
    async save() {
      const formatted_end_date = formatEndDate(this.end_date);

      this.loading = true;
      const res = await ConsoleService.updateProviderPackage({
        provider_id: this.data.id,
        package_id: this.value,
        end_date: formatted_end_date,
      });
      this.$emit("refresh");
      this.loading = false;
      this.close();
    },
  },
  async mounted() {
    this.providerPackage = await ConsoleService.getPackages();
  },
};
</script>

<style></style>
