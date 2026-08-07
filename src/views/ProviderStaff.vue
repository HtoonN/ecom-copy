<template>
  <v-card>
    <v-card-title>Provider Staff</v-card-title>
    <v-card-text>
      <v-row class="my-2" align="center">
        <v-col cols="12" md="6">
          <div class="provider-actions">
            <v-autocomplete
              v-model="selectedProviderId"
              :items="providers"
              item-title="fullname"
              item-value="id"
              label="Search Provider"
              variant="solo"
              :loading="loadingProviders"
              :disabled="loadingProviders"
              hide-details
              clearable
            />
            <v-btn
              v-if="selectedProviderId"
              color="blue"
              variant="outlined"
              :disabled="loadingProviders || loadingStaffs"
              @click="refresh"
              class="provider-refresh"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row v-if="selectedProviderId && loadingStaffs" class="my-2" align="center" justify="center">
        <v-col cols="12" class="d-flex justify-center">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
      </v-row>

      <v-row v-if="selectedProviderId && !loadingStaffs" class="my-2" align="center">
        <v-col cols="12">
          <div class="staff-actions">
            <div class="section-title">
              Staffs <span class="section-total">({{ staffTableItems.length }})</span>
            </div>
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-account-plus"
              :disabled="loadingProviders || loadingStaffs || creatingStaff"
              :loading="creatingStaff"
              @click="openCreateStaffDialog"
            >
              Create Staff
            </v-btn>
          </div>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="staffHeaders"
            :items="staffTableItems"
            class="elevation-1 staff-table"
            density="compact"
            :items-per-page="-1"
            hide-default-footer
          />
          <div v-if="staffTableItems.length === 0" class="text-center text-grey-darken-1 py-6">
            No provider staff found.
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import Swal from "sweetalert2";
import localService from "../api/localService";
import ConsoleService from "../api/ConsoleService";

export default {
  name: "ProviderStaff",
  data() {
    return {
      providers: [],
      selectedProviderId: null,
      loadingProviders: false,
      loadingStaffs: false,
      creatingStaff: false,
      staffsByProviderId: {},
      staffHeaders: [
        { title: "No", key: "no", sortable: false, width: "48px", align: "center" },
        { title: "Username", key: "username", sortable: false },
        { title: "Level", key: "level", sortable: false },
      ],
    };
  },
  computed: {
    selectedProvider() {
      if (!this.selectedProviderId) return null;
      return this.providers.find((provider) => String(provider.id) === String(this.selectedProviderId)) || null;
    },
    selectedProviderStaffs() {
      if (!this.selectedProviderId) return [];
      return this.staffsByProviderId[this.selectedProviderId] || [];
    },
    staffTableItems() {
      return this.selectedProviderStaffs.map((staff, index) => ({
        no: index + 1,
        username: staff?.username || "-",
        level: staff?.level ?? staff?.staff_level ?? "-",
      }));
    },
  },
  methods: {
    async fetchProviders() {
      this.loadingProviders = true;
      try {
        const response = await ConsoleService.getProviders();
        const providers = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        this.providers = providers;
      } catch (error) {
        this.providers = [];
        Swal.fire({
          title: "Failed",
          text: "Unable to load providers.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      } finally {
        this.loadingProviders = false;
      }
    },
    async fetchProviderStaffs(providerId) {
      if (!providerId) return;
      this.loadingStaffs = true;
      const res = await localService.getProviderStaffs(providerId);
      this.loadingStaffs = false;

      if (res.success) {
        const rawStaffs =
          res.data?.staffs ||
          res.data?.staff ||
          res.data?.provider_staffs ||
          res.data?.provider_staff ||
          res.data?.data ||
          res.data ||
          [];
        this.staffsByProviderId = {
          ...this.staffsByProviderId,
          [providerId]: Array.isArray(rawStaffs) ? rawStaffs : [],
        };
      } else {
        this.staffsByProviderId = {
          ...this.staffsByProviderId,
          [providerId]: [],
        };
        Swal.fire({
          title: "Failed",
          text: res.message || "Unable to load provider staff.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    refresh() {
      this.fetchProviders();
      if (this.selectedProviderId) {
        this.fetchProviderStaffs(this.selectedProviderId);
      }
    },
    async openCreateStaffDialog() {
      if (!this.selectedProviderId) return;
      const providerName =
        this.selectedProvider?.fullname ||
        this.selectedProvider?.name ||
        `Provider ID: ${this.selectedProviderId}`;
      const safeProviderName = String(providerName).replace(/[<>]/g, "");

      const modalResult = await Swal.fire({
        title: `Create Staff - ${safeProviderName}`,
        html: `
          <input
            id="staff-username"
            class="swal2-input"
            placeholder="Username"
            autocomplete="off"
            style="display:block;box-sizing:border-box;width:320px;max-width:100%;margin:1em auto;"
          />
          <input
            id="staff-password"
            class="swal2-input"
            placeholder="Password"
            type="password"
            autocomplete="new-password"
            style="display:block;box-sizing:border-box;width:320px;max-width:100%;margin:1em auto;"
          />
          <select
            id="staff-level"
            class="swal2-input"
            style="
              display: block;
              box-sizing: border-box;
              width: 320px;
              min-width: 320px;
              max-width: 320px;
              margin: 1em auto;
              height: 2.625em;
              border: 1px solid #d9d9d9;
              border-radius: 0.1875em;
              padding: 0 0.75em;
              font-size: 1.125em;
              font-weight: 400;
              line-height: 2.625em;
              color: inherit;
              background-color: #fff;
              appearance: none;
              -webkit-appearance: none;
              -moz-appearance: none;
              background-image: linear-gradient(45deg, transparent 50%, #6b7280 50%), linear-gradient(135deg, #6b7280 50%, transparent 50%);
              background-position: calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px);
              background-size: 5px 5px, 5px 5px;
              background-repeat: no-repeat;
            "
          >
            <option value="">Select level</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Create",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d60326",
        preConfirm: () => {
          const username = document.getElementById("staff-username")?.value?.trim();
          const password = document.getElementById("staff-password")?.value || "";
          const levelRaw = document.getElementById("staff-level")?.value?.trim();
          const level = Number(levelRaw);

          if (!username) {
            Swal.showValidationMessage("Username is required.");
            return null;
          }
          if (!password) {
            Swal.showValidationMessage("Password is required.");
            return null;
          }
          if (!levelRaw || !Number.isFinite(level) || level < 1 || level > 6) {
            Swal.showValidationMessage("Please select level 1 to 6.");
            return null;
          }

          return {
            username,
            password,
            level,
          };
        },
      });

      if (!modalResult.isConfirmed || !modalResult.value) return;
      await this.createStaff(modalResult.value);
    },
    async createStaff(formValues) {
      if (!this.selectedProviderId) return;

      this.creatingStaff = true;
      const payload = {
        username: formValues.username,
        password: formValues.password,
        level: formValues.level,
        provider_id: this.selectedProviderId,
      };
      const res = await localService.createStaff(payload);
      this.creatingStaff = false;

      if (res.success) {
        Swal.fire({
          title: "Success",
          text: "Staff created.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderStaffs(this.selectedProviderId);
        return;
      }

      if (res.status === 409 && res.field === "username") {
        Swal.fire({
          title: "Username Exists",
          text: res.message || "username already exists",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
        return;
      }

      Swal.fire({
        title: "Failed",
        text: res.message || "Unable to create staff.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d60326",
      });
    },
  },
  mounted() {
    this.fetchProviders();
  },
  watch: {
    selectedProviderId(newVal) {
      this.fetchProviderStaffs(newVal);
    },
  },
};
</script>

<style scoped>
.provider-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-actions :deep(.v-input) {
  flex: 1;
}

.provider-refresh {
  height: 40px;
  min-height: 40px;
}

.staff-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.section-total {
  color: #6b7280;
  font-weight: 600;
}

.staff-table :deep(.v-data-table-footer),
.staff-table :deep(.v-data-table__bottom),
.staff-table :deep(.v-data-footer),
.staff-table :deep(.v-pagination) {
  display: none !important;
}

.staff-table :deep(thead tr) {
  background-color: #d60326;
}

.staff-table :deep(thead th) {
  color: #ffffff !important;
}

.staff-table :deep(th),
.staff-table :deep(td) {
  white-space: nowrap;
  padding: 4px 8px;
}
</style>
