<template>
  <v-dialog v-model="internalOpen" max-width="520">
    <v-card>
      <v-card-title>Change Password</v-card-title>
      <v-card-text>
        <div class="mb-4">
          <div class="provider-label">Provider</div>
          <div class="provider-name">{{ providerName }}</div>
        </div>

        <v-text-field
          v-model="newPassword"
          label="New Password"
          variant="solo"
          :append-inner-icon="passwordVisible ? 'mdi-eye' : 'mdi-eye-off'"
          :type="passwordVisible ? 'text' : 'password'"
          @click:append-inner="togglePasswordVisibility"
          :disabled="loading"
          @keydown.enter="submit"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="close" :disabled="loading">Cancel</v-btn>
        <v-btn color="primary" @click="submit" :loading="loading">Update</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ChangePasswordDialog",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: Object,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      internalOpen: this.modelValue,
      newPassword: "",
      passwordVisible: false,
    };
  },
  computed: {
    providerName() {
      if (!this.provider) return "-";
      return (
        this.provider.fullname ||
        this.provider.url_nickname ||
        this.provider.phone_number ||
        "-"
      );
    },
  },
  watch: {
    modelValue(value) {
      this.internalOpen = value;
      if (value) {
        this.newPassword = "";
        this.passwordVisible = false;
      }
    },
    internalOpen(value) {
      this.$emit("update:modelValue", value);
    },
  },
  methods: {
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
    close() {
      this.internalOpen = false;
    },
    submit() {
      if (!this.newPassword) {
        return;
      }
      this.$emit("submit", this.newPassword);
    },
  },
};
</script>

<style scoped>
.provider-label {
  color: rgba(0, 0, 0, 0.54);
}

.provider-name {
  font-weight: 600;
}
</style>
