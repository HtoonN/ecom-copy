<template>
  <v-dialog v-model="internalDialog" persistent max-width="700">
    <v-card>
      <v-card-title class="text-h6" style="border-bottom: 1px solid #ccc">
        Tournament to Insurance Mapping
      </v-card-title>

      <v-card-text>
        <div> Tournament Total : {{ tournament_total || '-'}}</div>
        <div> Total Rows : {{ total_insurances || "-" }}</div>
      </v-card-text>

      <v-card-text class="pa-0">
        <div class="table-wrapper">
          <v-table density="compact">
            <thead>
              <tr>
                <th>Tournament ID</th>
                <th>Insurance Count</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in mappings" :key="i">
                <td>{{ row.id }}</td>
                <td>{{ row.insurance_count }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="accept">Accept</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmMappingDialog',

  data() {
    return {
      internalDialog: false,
      mappings: [],
      _resolve: null, // Promise resolver
      tournament_total: 0,
      total_insurances: 0,
    };
  },

  methods: {
    open(data) {
        // store table data
        this.mappings = data;

        // calculate summary
        this.tournament_total = data.length;

        this.total_insurances = data.reduce(
            (sum, item) => sum + Number(item.insurance_count || 0),
            0
        );

        this.internalDialog = true;

        // RETURN PROMISE → wait for user action
        return new Promise((resolve) => {
            this._resolve = resolve;
        });
    },

    accept() {
      this.internalDialog = false;
      this._resolve(true); // ✅ ACCEPT
    },

    cancel() {
      this.internalDialog = false;
      this._resolve(false); // ❌ CANCEL
    },
  },
};
</script>

<style scoped>
.table-wrapper {
  max-height: 320px;
  overflow-y: auto;
}
</style>
