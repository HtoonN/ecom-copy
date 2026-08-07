<template>
  <div class="role-page">
    <div class="page-header">
      <div>
        <div class="eyebrow">สิทธิ์การใช้งาน</div>
        <h1>ตัวกำหนดสิทธิ์ตามบทบาท</h1>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        :disabled="!selectedProviderId || loading"
        @click="startCreateRole"
      >
        เพิ่มบทบาท
      </v-btn>
    </div>

    <v-card class="provider-card" variant="outlined">
      <v-row align="center">
        <v-col cols="12" md="6" lg="5">
          <label class="field-label">Provider</label>
          <v-autocomplete
            v-model="selectedProviderId"
            :items="providers"
            item-title="fullname"
            item-value="id"
            placeholder="เลือก Provider"
            variant="outlined"
            density="compact"
            :loading="loadingProviders"
            :disabled="loadingProviders"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" md="6" lg="7" class="provider-summary">
          <v-btn
            variant="outlined"
            color="secondary"
            :disabled="!selectedProviderId || loading"
            @click="loadProviderData(selectedProviderId)"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <div v-if="!selectedProviderId" class="empty-state">
      <v-icon size="56" color="grey-lighten-1">mdi-domain</v-icon>
      <div class="empty-title">เลือก Provider เพื่อจัดการบทบาท</div>
      <div class="empty-copy">ระบบจะแสดง role groups, staff ในแต่ละกลุ่ม และชุดสิทธิ์ของ provider ที่เลือก</div>
    </div>

    <template v-else>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <v-card class="section-card" variant="outlined">
        <div class="section-kicker">บทบาท</div>
        <div class="role-table">
          <div class="role-row role-head">
            <div>บทบาท</div>
            <div>สิทธิ์ที่เปิดใช้</div>
            <div>พนักงานที่กำหนด</div>
            <div></div>
          </div>

          <div v-if="roles.length === 0" class="role-empty">
            ยังไม่มีบทบาท
          </div>

          <div
            v-for="role in roles"
            :key="role.id"
            class="role-row"
            :class="{ active: selectedRole && selectedRole.id === role.id }"
            @click="selectRole(role)"
          >
            <button class="role-name" type="button">{{ role.name }}</button>
            <div class="permission-count">{{ activePermissionCount(role) }} / {{ role.permissions.length }}</div>
            <div @click.stop>
              <v-autocomplete
                :model-value="staffIdsByRole(role.id)"
                :items="staffOptions"
                item-title="label"
                item-value="id"
                placeholder="เลือกพนักงาน"
                variant="outlined"
                density="compact"
                hide-details
                multiple
                chips
                closable-chips
                :disabled="loading || role.isDraft"
                @update:model-value="updateRoleStaffs(role, $event)"
              />
            </div>
            <div class="row-actions" @click.stop>
              <v-btn icon variant="outlined" color="primary" size="small" @click="editRole(role)">
                <v-icon size="18">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon variant="outlined" color="primary" size="small" @click="confirmDeleteRole(role)">
                <v-icon size="18">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </v-card>

      <v-card class="section-card role-form" variant="outlined">
        <div class="form-title">
          <div>
            <div class="section-kicker">{{ editingRoleId ? "ตั้งค่าบทบาท" : "สร้างบทบาท" }}</div>
            <label class="field-label">ชื่อบทบาท</label>
          </div>
          <v-btn color="primary" variant="flat" :loading="savingRole" :disabled="!roleForm.name" @click="saveRole">
            บันทึกบทบาท
          </v-btn>
        </div>
        <v-text-field
          v-model="roleForm.name"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="updateRoleFormName"
        />
      </v-card>

      <v-card class="permission-card" variant="outlined">
        <div class="permission-header">
          <div>
            <div class="section-kicker">ชุดสิทธิ์</div>
            <div class="muted">เลือกแล้ว {{ selectedPermissionTotal }} / {{ roleForm.permissions.length }}</div>
          </div>
          <div class="permission-actions">
            <v-btn variant="outlined" color="primary" @click="setAllPermissions(true)">เลือกทั้งหมด</v-btn>
            <v-btn variant="outlined" color="primary" @click="setAllPermissions(false)">ล้าง</v-btn>
          </div>
        </div>

        <v-tabs v-model="permissionTab" color="primary" density="comfortable">
          <v-tab v-for="group in topPermissionGroups" :key="group.key" :value="group.key">
            {{ group.label }} {{ group.active }} / {{ group.total }}
          </v-tab>
        </v-tabs>

        <v-window v-model="permissionTab">
          <v-window-item v-for="group in topPermissionGroups" :key="group.key" :value="group.key">
            <div class="permission-category-all">
              <div>
                <strong>{{ group.label }}</strong>
                <div class="muted">เลือกแล้ว {{ group.active }} / {{ group.total }}</div>
              </div>
              <v-switch
                :model-value="group.active === group.total && group.total > 0"
                color="primary"
                hide-details
                inset
                @update:model-value="toggleTopGroup(group.key, $event)"
              />
            </div>

            <div class="permission-grid">
              <v-card
                v-for="category in groupedPermissions[group.key]"
                :key="category.key"
                class="permission-group"
                variant="outlined"
              >
                <div class="permission-group-head">
                  <div>
                    <h3>{{ category.label }}</h3>
                    <div class="muted">{{ category.active }} / {{ category.items.length }}</div>
                  </div>
                  <v-switch
                    :model-value="category.active === category.items.length && category.items.length > 0"
                    color="primary"
                    hide-details
                    inset
                    @update:model-value="toggleCategory(category.items, $event)"
                  />
                </div>

                <label v-for="permission in category.items" :key="permission.feature_id" class="permission-item">
                  <input
                    type="checkbox"
                    :checked="permission.active"
                    @change="setPermission(permission.feature_id, $event.target.checked)"
                  />
                  <span>{{ permissionLabel(permission.feature_id) }}</span>
                  <code>{{ permission.feature_id }}</code>
                </label>
              </v-card>
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </template>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import ConsoleService from "../api/ConsoleService";
import ProviderRolePermissionService from "../api/ProviderRolePermissionService";

export default {
  name: "ManageRolePermissionView",
  data() {
    return {
      providers: [],
      selectedProviderId: null,
      roles: [],
      staffs: [],
      selectedRole: null,
      editingRoleId: null,
      permissionTab: "arena",
      loadingProviders: false,
      loading: false,
      savingRole: false,
      roleForm: {
        name: "",
        permissions: [],
      },
    };
  },
  computed: {
    staffOptions() {
      return this.staffs.map((staff) => ({
        ...staff,
        label: staff.fullname || staff.username || `Staff #${staff.id}`,
      }));
    },
    selectedPermissionTotal() {
      return this.roleForm.permissions.filter((permission) => permission.active).length;
    },
    groupedPermissions() {
      const groups = {};
      for (const permission of this.roleForm.permissions) {
        const [topKey] = permission.feature_id.split(".");
        const categoryInfo = this.permissionCategory(permission.feature_id);
        const categoryKey = categoryInfo.key;
        if (!groups[topKey]) groups[topKey] = [];
        let category = groups[topKey].find((item) => item.key === categoryKey);
        if (!category) {
          category = {
            key: categoryKey,
            label: categoryInfo.label,
            items: [],
            active: 0,
          };
          groups[topKey].push(category);
        }
        category.items.push(permission);
      }

      Object.keys(groups).forEach((topKey) => {
        groups[topKey].forEach((category) => {
          category.active = category.items.filter((item) => item.active).length;
        });
      });

      return groups;
    },
    topPermissionGroups() {
      return Object.keys(this.groupedPermissions).map((key) => {
        const categories = this.groupedPermissions[key];
        const total = categories.reduce((sum, category) => sum + category.items.length, 0);
        const active = categories.reduce((sum, category) => sum + category.active, 0);
        return {
          key,
          label: key.toUpperCase(),
          total,
          active,
        };
      });
    },
  },
  watch: {
    selectedProviderId(providerId) {
      this.loadProviderData(providerId);
    },
    topPermissionGroups(groups) {
      if (!groups.some((group) => group.key === this.permissionTab)) {
        this.permissionTab = groups[0]?.key || "arena";
      }
    },
  },
  methods: {
    async fetchProviders() {
      this.loadingProviders = true;
      try {
        const response = await ConsoleService.getProviders();
        this.providers = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
      } catch (error) {
        this.providers = [];
        Swal.fire("Failed", "Unable to load providers.", "error");
      } finally {
        this.loadingProviders = false;
      }
    },
    async loadProviderData(providerId) {
      this.roles = [];
      this.staffs = [];
      this.selectedRole = null;
      this.editingRoleId = null;
      this.roleForm = { name: "", permissions: [] };
      if (!providerId) return;

      this.loading = true;
      const [roleRes, staffRes] = await Promise.all([
        ProviderRolePermissionService.getRoleGroups(providerId),
        ProviderRolePermissionService.getStaffs(providerId),
      ]);
      this.loading = false;

      if (!roleRes.success || !staffRes.success) {
        Swal.fire("Failed", "Unable to load role permission data.", "error");
        return;
      }

      this.roles = this.normalizeRoles(roleRes.data);
      this.staffs = this.normalizeStaffs(staffRes.data);
      if (this.roles.length) {
        this.selectRole(this.roles[0]);
      }
    },
    normalizeRoles(roles) {
      return (Array.isArray(roles) ? roles : []).map((role) => ({
        id: role.id,
        name: role.name || "ไม่ระบุชื่อ",
        permissions: this.normalizePermissions(role.permissions || []),
      }));
    },
    normalizeStaffs(staffs) {
      return (Array.isArray(staffs) ? staffs : []).map((staff) => ({
        ...staff,
        role_id: staff.role_id ?? staff.role?.id ?? null,
      }));
    },
    normalizePermissions(permissions) {
      return permissions.map((permission) => ({
        feature_id: permission.feature_id || permission.slug || permission.id,
        active: Boolean(permission.active),
      })).filter((permission) => permission.feature_id);
    },
    selectRole(role) {
      this.selectedRole = role;
      this.editingRoleId = role.isDraft ? null : role.id;
      this.roleForm = {
        name: role.name,
        permissions: this.clonePermissions(role.permissions),
      };
    },
    startCreateRole() {
      const draftRole = this.roles.find((role) => role.isDraft);
      if (draftRole) {
        this.selectRole(draftRole);
        return;
      }

      const template = this.roles[0]?.permissions || [];
      const nextRole = {
        id: `draft-${Date.now()}`,
        isDraft: true,
        name: this.nextRoleName(),
        permissions: this.clonePermissions(template).map((permission) => ({
          ...permission,
          active: false,
        })),
      };
      this.roles = [...this.roles, nextRole];
      this.selectRole(nextRole);
    },
    editRole(role) {
      this.selectRole(role);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    clonePermissions(permissions) {
      return permissions.map((permission) => ({ ...permission }));
    },
    activePermissionCount(role) {
      const permissions =
        this.selectedRole && String(this.selectedRole.id) === String(role.id)
          ? this.roleForm.permissions
          : role.permissions || [];
      return permissions.filter((permission) => permission.active).length;
    },
    staffIdsByRole(roleId) {
      return this.staffs
        .filter((staff) => String(staff.role_id) === String(roleId))
        .map((staff) => staff.id);
    },
    async updateRoleStaffs(role, staffIds) {
      if (role.isDraft) return;
      const nextIds = (staffIds || []).map(String);
      const currentIds = this.staffIdsByRole(role.id).map(String);
      const addedIds = nextIds.filter((id) => !currentIds.includes(id));
      const removedIds = currentIds.filter((id) => !nextIds.includes(id));

      const updates = [
        ...addedIds.map((staffId) => ({ staffId, roleId: role.id })),
        ...removedIds.map((staffId) => ({ staffId, roleId: null })),
      ];

      if (!updates.length) return;

      const previousStaffs = this.staffs.map((staff) => ({ ...staff }));
      this.staffs = this.staffs.map((staff) => {
        const update = updates.find((item) => String(item.staffId) === String(staff.id));
        return update ? { ...staff, role_id: update.roleId } : staff;
      });

      for (const update of updates) {
        const res = await ProviderRolePermissionService.updateStaffRole(update.staffId, update.roleId);
        if (!res.success) {
          this.staffs = previousStaffs;
          Swal.fire("Failed", res.message || "Unable to update staff role.", "error");
          return;
        }
      }
    },
    setPermission(featureId, active) {
      this.roleForm.permissions = this.roleForm.permissions.map((permission) =>
        permission.feature_id === featureId ? { ...permission, active } : permission
      );
      this.syncSelectedRoleDraft();
    },
    setAllPermissions(active) {
      this.roleForm.permissions = this.roleForm.permissions.map((permission) => ({
        ...permission,
        active,
      }));
      this.syncSelectedRoleDraft();
    },
    toggleCategory(items, active) {
      const ids = items.map((item) => item.feature_id);
      this.roleForm.permissions = this.roleForm.permissions.map((permission) =>
        ids.includes(permission.feature_id) ? { ...permission, active } : permission
      );
      this.syncSelectedRoleDraft();
    },
    toggleTopGroup(topKey, active) {
      this.roleForm.permissions = this.roleForm.permissions.map((permission) =>
        permission.feature_id.startsWith(`${topKey}.`) ? { ...permission, active } : permission
      );
      this.syncSelectedRoleDraft();
    },
    updateRoleFormName(name) {
      if (!this.selectedRole?.isDraft) return;
      this.roles = this.roles.map((role) =>
        role.id === this.selectedRole.id ? { ...role, name } : role
      );
      this.selectedRole = { ...this.selectedRole, name };
    },
    syncSelectedRoleDraft() {
      if (!this.selectedRole?.isDraft) return;
      const permissions = this.clonePermissions(this.roleForm.permissions);
      this.roles = this.roles.map((role) =>
        role.id === this.selectedRole.id ? { ...role, permissions } : role
      );
      this.selectedRole = { ...this.selectedRole, permissions };
    },
    nextRoleName() {
      return `บทบาท ${this.roles.length + 1}`;
    },
    async saveRole() {
      if (!this.selectedProviderId || !this.roleForm.name) return;
      this.savingRole = true;
      const basePayload = {
        name: this.roleForm.name,
        permissions: this.clonePermissions(this.roleForm.permissions),
      };
      const payload = this.editingRoleId
        ? { id: this.editingRoleId, ...basePayload }
        : basePayload;
      const res = this.editingRoleId
        ? await ProviderRolePermissionService.updateRoleGroup(this.selectedProviderId, this.editingRoleId, payload)
        : await ProviderRolePermissionService.createRoleGroup(this.selectedProviderId, payload);
      this.savingRole = false;

      if (!res.success) {
        Swal.fire("Failed", res.message || "Unable to save role group.", "error");
        return;
      }

      await this.loadProviderData(this.selectedProviderId);
      const targetId = res.data?.id || this.editingRoleId;
      const savedRole = this.roles.find((role) => String(role.id) === String(targetId));
      if (savedRole) this.selectRole(savedRole);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "บันทึกบทบาทสำเร็จ",
        showConfirmButton: false,
        timer: 1800,
      });
    },
    async confirmDeleteRole(role) {
      if (role.isDraft) {
        this.roles = this.roles.filter((item) => item.id !== role.id);
        if (this.selectedRole && this.selectedRole.id === role.id) {
          const nextRole = this.roles[0] || null;
          if (nextRole) {
            this.selectRole(nextRole);
          } else {
            this.selectedRole = null;
            this.editingRoleId = null;
            this.roleForm = { name: "", permissions: [] };
          }
        }
        return;
      }

      const result = await Swal.fire({
        title: "ลบบทบาท?",
        text: `ต้องการลบ ${role.name} ใช่หรือไม่`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#d60326",
      });
      if (!result.isConfirmed) return;
      const res = await ProviderRolePermissionService.deleteRoleGroup(this.selectedProviderId, role.id);
      if (!res.success) {
        Swal.fire("Failed", res.message || "Unable to delete role group.", "error");
        return;
      }
      await this.loadProviderData(this.selectedProviderId);
    },
    permissionCategory(featureId) {
      if (featureId.startsWith("arena.booking.") || featureId.startsWith("arena.pos.")) {
        return { key: "arena.booking", label: "Arena / การจอง" };
      }
      if (featureId.startsWith("arena.settings.")) {
        return { key: "arena.settings", label: "Arena / ตั้งค่า" };
      }
      if (featureId.startsWith("arena.")) {
        return { key: "arena.page", label: "Arena / หน้าเพจ" };
      }
      if (featureId.startsWith("pos.warehouse.purchase_bill.")) {
        return { key: "pos.sales", label: "POS / การขาย" };
      }
      if (featureId.startsWith("pos.member.")) {
        return { key: "pos.main", label: "POS / หลัก" };
      }
      if (featureId.startsWith("pos.warehouse.")) {
        return { key: "pos.warehouse", label: "POS / คลังสินค้า" };
      }
      if (featureId.startsWith("pos.promotion.")) {
        return { key: "pos.promotion", label: "POS / โปรโมชั่น" };
      }
      return { key: featureId.split(".").slice(0, 2).join("."), label: featureId.replace(/\./g, " / ") };
    },
    permissionLabel(featureId) {
      const labels = {
        "arena.booking.view": "เปิด booking ได้",
        "arena.booking.payment": "กดชำระเงินใน booking ได้",
        "arena.booking.edit": "กด edit ใน booking ได้",
        "arena.booking.cancel": "ยกเลิก/ลบการจองได้",
        "arena.booking.summary.view": "กดเปิด Summary ได้",
        "arena.pos.view": "เปิด Pos ขายของได้",
        "arena.pos.credit_sale": "สามารถใช้ระบบซื้อเชื่อได้",
        "arena.dashboard.view": "เข้าหน้า Dashboard ได้",
        "arena.monthly_calendar.view": "เข้าหน้าตารางรายเดือนได้",
        "arena.group.view": "เข้าหน้าก๊วน/บุฟเฟต์ได้",
        "arena.account.view": "เข้าหน้าบัญชีรายการโอนเงินได้",
        "arena.iot.view": "เข้าหน้า IoT ได้",
        "arena.settings.general.view": "หน้าข้อมูลทั่วไปสนาม",
        "arena.settings.staff.view": "หน้าตั้งค่าพนง",
        "arena.settings.court.view": "ตั้งค่าสนาม",
        "arena.settings.promo_time.view": "ตั้งค่าเวลาโปรโมชั่น",
        "arena.settings.special_day.view": "ตั้งราคาวันพิเศษ",
        "arena.settings.special_day.vie": "ตั้งราคาวันพิเศษ",
        "arena.settings.holiday.view": "ตั้งค่าวันหยุดสนาม",
        "arena.settings.option_price.view": "ตั้งราคาเฉพาะกลุ่ม",
        "arena.settings.option_price.vi": "ตั้งราคาเฉพาะกลุ่ม",
        "pos.member.view": "เข้าหน้า member ได้",
        "pos.member.create": "create member ได้",
        "pos.member.edit": "edit member ได้",
        "pos.member.delete": "del member ได้",
        "pos.member.detail.view": "กดดูรายละเอียด member ได้",
        "pos.warehouse.view": "เข้าหน้าคลังสินค้าได้",
        "pos.warehouse.inventory.view": "เข้าเมนูสินค้าได้",
        "pos.warehouse.inventory.manage": "กดเมนู สินค้าได้",
        "pos.warehouse.history.view": "กดเมนู ประวัติ ได้",
        "pos.warehouse.inventory.sales_history.view": "กดดูประวัติการขายของสินค้า",
        "pos.warehouse.inventory.sales_": "กดดูประวัติการขายของสินค้า",
        "pos.warehouse.inventory.edit": "edit ข้อมูลสินค้าได้",
        "pos.warehouse.inventory.delete": "del สินค้านั้นๆ ได้",
        "pos.warehouse.service.view": "เข้าหน้าบริการเสริมได้",
        "pos.warehouse.service.create": "create service ได้",
        "pos.warehouse.service.edit": "edit service ได้",
        "pos.warehouse.service.delete": "del service ได้",
        "pos.warehouse.coach.view": "เข้าเมนู Coach ได้",
        "pos.warehouse.coach.create": "create Coach ได้",
        "pos.warehouse.coach.edit": "edit Coach ได้",
        "pos.warehouse.coach.delete": "del Coach ได้",
        "pos.warehouse.report.view": "รายงาน",
        "pos.warehouse.vendor.view": "ผู้จัดจำหน่าย",
        "pos.warehouse.machine.view": "ข้อมูลเครื่อง Pos",
        "pos.warehouse.account.view": "ข้อมูลเลข บช QRCode",
        "pos.warehouse.purchase_bill.create": "SAVE AS CREDIT / ซื้อเชื่อ",
        "pos.warehouse.purchase_bill.cr": "SAVE AS CREDIT / ซื้อเชื่อ",
        "pos.promotion.view": "โปรโมชั่น",
        "pos.promotion.create": "create promotion ได้",
        "pos.promotion.edit": "edit promotion ได้",
        "pos.promotion.delete": "del promotion ได้",
        "pos.promotion.export": "ส่งออกโปรโมชั่นได้",
        "pos.promotion.import_or_auto_coupon": "ใช้ปุ่ม auto สร้างคูปอง ได้",
        "pos.promotion.import_or_auto_create": "ใช้ปุ่ม auto สร้างคูปอง ได้",
        "pos.promotion.import_or_auto_c": "ใช้ปุ่ม auto สร้างคูปอง ได้",
      };
      return labels[featureId] || featureId.replace(/\./g, " ");
    },
  },
  mounted() {
    this.fetchProviders();
  },
};
</script>

<style scoped>
.role-page {
  background: #f3f5f8;
  min-height: calc(100vh - 96px);
  padding: 16px 8px 32px;
}

.page-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow,
.section-kicker {
  color: #e11b22;
  font-size: 13px;
  font-weight: 800;
}

h1 {
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
  margin: 4px 0 0;
}

.provider-card,
.section-card,
.permission-card {
  background: #fff;
  border-color: #dce3ec;
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 16px;
}

.provider-summary {
  align-items: end;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.field-label {
  color: #1f2f46;
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.empty-state {
  align-items: center;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 56px 16px;
  text-align: center;
}

.empty-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.empty-copy,
.muted {
  color: #53657d;
  font-size: 13px;
}

.role-table {
  margin-top: 18px;
  overflow-x: auto;
}

.role-row {
  align-items: center;
  border-bottom: 1px solid #e6edf5;
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(180px, 1fr) 140px minmax(280px, 1.2fr) 92px;
  min-width: 920px;
  padding: 16px 12px;
}

.role-row.active {
  background: #fff3f3;
}

.role-empty {
  border-bottom: 1px solid #e6edf5;
  color: #64748b;
  font-size: 14px;
  padding: 28px 12px;
  text-align: center;
}

.role-head {
  color: #34465c;
  font-size: 13px;
  font-weight: 800;
  padding-bottom: 12px;
}

.role-name {
  background: transparent;
  border: 0;
  color: #e11b22;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  padding: 0;
  text-align: left;
}

.permission-count {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.role-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-title,
.permission-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.permission-actions {
  display: flex;
  gap: 8px;
}

.permission-category-all {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e5edf5;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  margin: 0 0 16px;
  padding: 14px 16px;
}

.permission-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.permission-group {
  border-color: #e1e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.permission-group-head {
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid #e7edf4;
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
}

.permission-group h3 {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  margin: 0;
}

.permission-item {
  align-items: center;
  border-bottom: 1px solid #e9eff6;
  display: flex;
  gap: 10px;
  min-height: 52px;
  padding: 10px 16px;
}

.permission-item:last-child {
  border-bottom: 0;
}

.permission-item input {
  accent-color: #1976d2;
  height: 16px;
  width: 16px;
}

.permission-item span {
  color: #0f172a;
  font-weight: 800;
}

.permission-item code {
  background: #eef3f8;
  border-radius: 4px;
  color: #29415f;
  font-size: 11px;
  padding: 3px 6px;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .page-header,
  .form-title,
  .permission-header {
    align-items: stretch;
    flex-direction: column;
  }

  .provider-summary {
    justify-content: flex-start;
  }

  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
