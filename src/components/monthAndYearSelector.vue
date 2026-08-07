<template>
  <div class="month-year-selector">
    <v-autocomplete
      v-model="selectedMonth"
      @update:modelValue="emitDate"
      :items="months"
    >
    </v-autocomplete>

    <v-autocomplete
      v-model="selectedYear"
      @update:modelValue="emitDate"
      :items="years"
    >
    </v-autocomplete>
  </div>
</template>

<script>
export default {
  emits: ["date-selected"],
  data() {
    return {
      selectedMonth: null,
      selectedYear: new Date().getFullYear(), // Default to current year
      months: [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ],
      years: this.generateYears(),
    };
  },
  methods: {
    generateYears() {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 10; // Start 10 years before current year
      const endYear = currentYear + 10; // End 10 years after current year
      let years = [];
      for (let i = startYear; i <= endYear; i++) {
        years.push(i);
      }
      return years;
    },
    emitDate() {
      const selectedDate = `${this.selectedMonth} ${this.selectedYear}`;
      if (this.selectedMonth && this.selectedYear) {
        this.$emit("date-selected", selectedDate);
      }
    },
  },
};
</script>

<style scoped>
.month-year-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

select {
  padding: 5px;
  font-size: 14px;
}
</style>
