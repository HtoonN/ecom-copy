<template>
  <v-dialog v-model="internalOpen" max-width="520">
    <v-card>
      <v-card-title>Create Facilities</v-card-title>
      <v-card-text>
        <v-select
          v-model="internalSelected"
          :items="filteredFacilities"
          item-title="name"
          item-value="id"
          label="Select Facilities"
          multiple
          variant="solo"
          :loading="loading"
          :disabled="loading"
          clearable
        />
        <v-textarea
          v-model="internalDetail"
          label="Detail"
          variant="solo"
          rows="3"
          auto-grow
          class="mt-4"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" :disabled="internalSelected.length === 0" @click="confirm">
          Add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "FacilityPickerDialog",
  props: {
    modelValue: { type: Boolean, default: false },
    facilities: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    providerId: { type: [Number, String], default: null },
    selectedIds: { type: Array, default: () => [] },
    existingIds: { type: Array, default: () => [] },
  },
  emits: ["update:modelValue", "confirm"],
  data() {
    return {
      internalOpen: this.modelValue,
      internalSelected: [...this.selectedIds],
      internalDetail: "",
    };
  },
  computed: {
    filteredFacilities() {
      const existingSet = new Set(this.existingIds);
      if (!this.providerId) return this.facilities;
      return this.facilities.filter((facility) => {
        if (facility.provider_id === undefined || facility.provider_id === null) return true;
        return facility.provider_id === this.providerId;
      }).filter((facility) => !existingSet.has(facility.id));
    },
  },
  watch: {
    modelValue(val) {
      this.internalOpen = val;
      if (val) {
        this.internalSelected = [...this.selectedIds];
        this.internalDetail = "";
      }
    },
    internalOpen(val) {
      this.$emit("update:modelValue", val);
    },
  },
  methods: {
    close() {
      this.internalOpen = false;
    },
    confirm() {
      this.$emit("confirm", {
        ids: this.internalSelected,
        detail: this.internalDetail?.trim() || "",
      });
      this.internalOpen = false;
    },
  },
};
</script>

<style scoped>
</style>
