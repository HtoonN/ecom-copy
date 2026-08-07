<template>
  <div>
    <!-- Header -->
    <v-card-title class="d-flex align-center">
      จัดการสิทธิ์การใช้งาน
    </v-card-title>

    <!-- Two-panel layout: Roles on the left, Permissions on the right -->
    <v-row class="mx-3">
      <!-- ===================== LEFT: ROLES SECTION ===================== -->
      <v-col cols="7">
        <v-card variant="outlined" class="pa-0">
          <v-card-title class="d-flex align-center bg-primary text-white py-2 px-4" style="font-size: 14px;">
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            Roles ({{ roles.length }})
            <v-spacer />
            <v-btn size="small" variant="tonal" color="white" @click="openCreateRoleDialog" prepend-icon="mdi-plus">
              เพิ่ม Role
            </v-btn>
          </v-card-title>

          <!-- Role list -->
          <v-list density="compact" class="pa-0" style="max-height: calc(100dvh - 250px); overflow-y: auto;">
            <template v-for="(role, idx) in roles" :key="role.id">
              <v-list-item
                :active="selectedRole && selectedRole.id === role.id"
                active-class="bg-red-lighten-5"
                @click="selectRole(role)"
                class="role-item"
              >
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-shield-check</v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">{{ role.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="role.description" class="text-caption">
                  {{ role.description }}
                </v-list-item-subtitle>
                <v-list-item-subtitle class="text-caption mt-1">
                  <v-chip size="x-small" color="info" variant="tonal" class="mr-1">
                    {{ (role.permissions || []).length }} permissions
                  </v-chip>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn icon variant="text" size="x-small" color="primary" @click.stop="openEditRoleDialog(role)" class="mr-1"
                    v-if="!isOwnRole(role)">
                    <v-icon size="18">mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon variant="text" size="x-small" color="error" @click.stop="confirmDeleteRole(role)"
                    v-if="!isOwnRole(role)">
                    <v-icon size="18">mdi-delete</v-icon>
                  </v-btn>
                  <v-chip v-if="isOwnRole(role)" size="x-small" color="grey" variant="tonal" class="ml-1">
                    <v-icon size="12" class="mr-1">mdi-lock</v-icon>
                    Role ของคุณ
                  </v-chip>
                </template>
              </v-list-item>
              <v-divider v-if="idx < roles.length - 1" />
            </template>

            <v-list-item v-if="roles.length === 0">
              <v-list-item-title class="text-center text-grey py-8">
                ยังไม่มี Role
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- ===================== RIGHT: PERMISSIONS ASSIGNMENT ===================== -->
      <v-col cols="5">
        <v-card variant="outlined" class="pa-0">
          <v-card-title class="d-flex align-center py-2 px-4" style="font-size: 14px;"
            :class="selectedRole ? 'bg-primary text-white' : 'bg-grey-lighten-3'">
            <v-icon class="mr-2">mdi-key-chain</v-icon>
            <span v-if="selectedRole">สิทธิ์ของ "{{ selectedRole.name }}"</span>
            <span v-else class="text-grey">เลือก Role เพื่อจัดการสิทธิ์</span>
          </v-card-title>

          <!-- Permissions checkboxes when a role is selected -->
          <div v-if="selectedRole" style="max-height: calc(100dvh - 310px); overflow-y: auto;">
            <!-- Warning when viewing own role -->
            <v-alert v-if="isOwnRole(selectedRole)" type="info" variant="tonal" density="compact" class="mx-4 mt-3">
              <v-icon size="16" class="mr-1">mdi-information</v-icon>
              ไม่สามารถแก้ไขสิทธิ์ของ Role ตัวเองได้
            </v-alert>

            <!-- Group permissions by category -->
            <div v-for="(group, groupName) in groupedPermissions" :key="groupName" class="px-4 py-2">
              <div class="d-flex align-center mb-1">
                <v-icon size="16" color="primary" class="mr-1">mdi-folder</v-icon>
                <span class="text-subtitle-2 font-weight-bold text-primary">{{ groupName }}</span>
                <v-spacer />
                <v-btn variant="text" size="x-small" density="compact" @click="toggleGroup(group, groupName)"
                  :disabled="isOwnRole(selectedRole)">
                  {{ isGroupAllChecked(group) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด' }}
                </v-btn>
              </div>
              <div v-for="perm in group" :key="perm.id" class="ml-4">
                <v-checkbox
                  v-model="selectedPermissionIds"
                  :value="perm.id"
                  :label="`${perm.name} (${perm.slug})`"
                  density="compact"
                  hide-details
                  color="primary"
                  class="permission-checkbox"
                  :disabled="isOwnRole(selectedRole)"
                />
              </div>
              <v-divider class="mt-2" />
            </div>

            <div v-if="allPermissions.length === 0" class="text-center text-grey pa-8">
              ยังไม่มี Permission ในระบบ
            </div>
          </div>

          <div v-else class="text-center text-grey pa-12">
            <v-icon size="64" color="grey-lighten-2">mdi-hand-pointing-left</v-icon>
            <div class="mt-3">กรุณาเลือก Role จากรายการด้านซ้ายเพื่อจัดการสิทธิ์</div>
          </div>

          <!-- Save button -->
          <v-card-actions v-if="selectedRole" class="px-4 pb-3">
            <v-btn variant="text" size="small" @click="selectAllPermissions" :disabled="isOwnRole(selectedRole)">
              เลือกทั้งหมด
            </v-btn>
            <v-btn variant="text" size="small" @click="deselectAllPermissions" :disabled="isOwnRole(selectedRole)">
              ยกเลิกทั้งหมด
            </v-btn>
            <v-spacer />
            <v-btn color="primary" variant="flat" @click="saveRolePermissions" :loading="savingPermissions"
              prepend-icon="mdi-content-save" :disabled="isOwnRole(selectedRole)">
              บันทึกสิทธิ์
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- ===================== PERMISSIONS MANAGEMENT SECTION ===================== -->
    <v-row class="mx-3 mt-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center bg-grey-darken-3 text-white py-2 px-4" style="font-size: 14px;">
            <v-icon class="mr-2">mdi-key</v-icon>
            จัดการ Permissions ({{ allPermissions.length }})
            <v-spacer />
            <v-btn size="small" variant="tonal" color="white" @click="openCreatePermDialog" prepend-icon="mdi-plus">
              เพิ่ม Permission
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="permHeaders"
            :items="allPermissions"
            :items-per-page="10"
            class="elevation-0"
            density="compact"
          >
            <template v-slot:item.roles_count="{ item }">
              <v-chip size="x-small" color="info" variant="tonal">
                {{ getRolesUsingPermission(item.id) }} roles
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn icon variant="text" size="small" color="primary" @click="openEditPermDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="confirmDeletePermission(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- ===================== ROLE DIALOG ===================== -->
    <v-dialog v-model="roleDialog.show" max-width="450" persistent>
      <v-card>
        <v-card-title>{{ roleDialog.isEdit ? 'แก้ไข Role' : 'สร้าง Role ใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="roleDialog.form.name" label="ชื่อ Role" variant="outlined" density="compact"
            class="mb-2" />
          <v-textarea v-model="roleDialog.form.description" label="คำอธิบาย (ไม่บังคับ)" variant="outlined"
            density="compact" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="roleDialog.show = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" @click="saveRole" :loading="roleDialog.saving">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ===================== PERMISSION DIALOG ===================== -->
    <v-dialog v-model="permDialog.show" max-width="450" persistent>
      <v-card>
        <v-card-title>{{ permDialog.isEdit ? 'แก้ไข Permission' : 'สร้าง Permission ใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="permDialog.form.name" label="ชื่อ Permission" variant="outlined" density="compact"
            class="mb-2" />
          <v-text-field v-model="permDialog.form.slug" label="Slug (ค่าที่ใช้ในระบบ)" variant="outlined"
            density="compact" class="mb-2" :hint="slugHint" persistent-hint
            @update:modelValue="autoSlug = false" />
          <v-textarea v-model="permDialog.form.description" label="คำอธิบาย (ไม่บังคับ)" variant="outlined"
            density="compact" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="permDialog.show = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" @click="savePermission" :loading="permDialog.saving">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import httpClient from "../api/httpClient";
import Swal from "sweetalert2";

const prefix = "/md-console";

export default {
  name: "RolePermissionView",
  data() {
    return {
      roles: [],
      allPermissions: [],
      selectedRole: null,
      selectedPermissionIds: [],
      savingPermissions: false,
      autoSlug: true,

      permHeaders: [
        { title: "ID", key: "id", sortable: true, width: "60px" },
        { title: "ชื่อ", key: "name", sortable: true },
        { title: "Slug", key: "slug", sortable: true },
        { title: "คำอธิบาย", key: "description", sortable: false },
        { title: "ใช้โดย", key: "roles_count", sortable: false, align: "center" },
        { title: "", key: "actions", sortable: false, align: "center", width: "100px" },
      ],

      roleDialog: {
        show: false,
        isEdit: false,
        saving: false,
        form: { id: null, name: "", description: "" },
      },

      permDialog: {
        show: false,
        isEdit: false,
        saving: false,
        form: { id: null, name: "", slug: "", description: "" },
      },
    };
  },

  computed: {
    currentUserRole() {
      try {
        const userStr = localStorage.getItem('md_console_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user.role || null;
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
      return null;
    },

    groupedPermissions() {
      const groups = {};
      for (const perm of this.allPermissions) {
        const parts = (perm.slug || "").split("_");
        const category = parts.length > 1 ? parts.slice(0, -1).join("_") : "other";
        // Capitalize the group name
        const groupLabel = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (!groups[groupLabel]) groups[groupLabel] = [];
        groups[groupLabel].push(perm);
      }
      return groups;
    },

    slugHint() {
      if (!this.permDialog.isEdit) {
        return 'เช่น menu_events, menu_provider_settings';
      }
      return '';
    },
  },

  watch: {
    "permDialog.form.name"(val) {
      if (this.autoSlug && !this.permDialog.isEdit && val) {
        this.permDialog.form.slug = val
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
      }
    },
  },

  methods: {
    // =================== FETCH ===================
    async fetchRoles() {
      try {
        const res = await httpClient({ requiresAuth: true }).get(`${prefix}/roles`);
        this.roles = res.data;
      } catch (e) {
        console.error(e);
      }
    },

    async fetchPermissions() {
      try {
        const res = await httpClient({ requiresAuth: true }).get(`${prefix}/permissions`);
        this.allPermissions = res.data;
      } catch (e) {
        console.error(e);
      }
    },

    // =================== ROLE SELECTION ===================
    selectRole(role) {
      this.selectedRole = role;
      this.selectedPermissionIds = (role.permissions || []).map((p) => p.id);
    },

    isOwnRole(role) {
      return this.currentUserRole && role && role.name === this.currentUserRole;
    },

    // =================== ROLE CRUD ===================
    openCreateRoleDialog() {
      this.roleDialog.isEdit = false;
      this.roleDialog.form = { id: null, name: "", description: "" };
      this.roleDialog.show = true;
    },

    openEditRoleDialog(role) {
      this.roleDialog.isEdit = true;
      this.roleDialog.form = {
        id: role.id,
        name: role.name,
        description: role.description || "",
      };
      this.roleDialog.show = true;
    },

    async saveRole() {
      this.roleDialog.saving = true;
      try {
        if (this.roleDialog.isEdit) {
          await httpClient({ requiresAuth: true }).put(`${prefix}/roles/${this.roleDialog.form.id}`, {
            name: this.roleDialog.form.name,
            description: this.roleDialog.form.description,
          });
          Swal.fire({ toast: true, position: "top-end", icon: "success", title: "อัปเดต Role สำเร็จ", showConfirmButton: false, timer: 2000 });
        } else {
          if (!this.roleDialog.form.name) {
            Swal.fire("Error", "กรุณากรอกชื่อ Role", "error");
            this.roleDialog.saving = false;
            return;
          }
          await httpClient({ requiresAuth: true }).post(`${prefix}/roles`, {
            name: this.roleDialog.form.name,
            description: this.roleDialog.form.description,
          });
          Swal.fire({ toast: true, position: "top-end", icon: "success", title: "สร้าง Role สำเร็จ", showConfirmButton: false, timer: 2000 });
        }
        this.roleDialog.show = false;
        await this.fetchRoles();
        // Re-select if was selected
        if (this.selectedRole) {
          const updated = this.roles.find((r) => r.id === this.selectedRole.id);
          if (updated) this.selectRole(updated);
        }
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "เกิดข้อผิดพลาดในการบันทึก Role", "error");
      } finally {
        this.roleDialog.saving = false;
      }
    },

    async confirmDeleteRole(role) {
      const result = await Swal.fire({
        title: "ยืนยันการลบ?",
        text: `ต้องการลบ Role "${role.name}" ใช่หรือไม่? สิทธิ์ที่เชื่อมอยู่จะถูกยกเลิก`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d60326",
        cancelButtonColor: "#9e9e9e",
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;

      try {
        await httpClient({ requiresAuth: true }).delete(`${prefix}/roles/${role.id}`);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "ลบ Role สำเร็จ", showConfirmButton: false, timer: 2000 });
        if (this.selectedRole && this.selectedRole.id === role.id) {
          this.selectedRole = null;
          this.selectedPermissionIds = [];
        }
        this.fetchRoles();
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "ไม่สามารถลบ Role ได้", "error");
      }
    },

    // =================== ROLE PERMISSIONS SYNC ===================
    async saveRolePermissions() {
      if (!this.selectedRole) return;
      this.savingPermissions = true;
      try {
        const res = await httpClient({ requiresAuth: true }).put(
          `${prefix}/roles/${this.selectedRole.id}/permissions`,
          { permission_ids: this.selectedPermissionIds }
        );
        // Update local data
        const updatedRole = res.data;
        const idx = this.roles.findIndex((r) => r.id === updatedRole.id);
        if (idx > -1) {
          this.roles[idx] = updatedRole;
        }
        this.selectedRole = updatedRole;
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกสิทธิ์สำเร็จ", showConfirmButton: false, timer: 2000 });
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "เกิดข้อผิดพลาดในการบันทึกสิทธิ์", "error");
      } finally {
        this.savingPermissions = false;
      }
    },

    // =================== PERMISSION GROUP HELPERS ===================
    toggleGroup(group) {
      const allChecked = this.isGroupAllChecked(group);
      for (const perm of group) {
        const idx = this.selectedPermissionIds.indexOf(perm.id);
        if (allChecked) {
          if (idx > -1) this.selectedPermissionIds.splice(idx, 1);
        } else {
          if (idx === -1) this.selectedPermissionIds.push(perm.id);
        }
      }
    },

    isGroupAllChecked(group) {
      return group.every((p) => this.selectedPermissionIds.includes(p.id));
    },

    selectAllPermissions() {
      this.selectedPermissionIds = this.allPermissions.map((p) => p.id);
    },

    deselectAllPermissions() {
      this.selectedPermissionIds = [];
    },

    // =================== PERMISSION CRUD ===================
    openCreatePermDialog() {
      this.permDialog.isEdit = false;
      this.autoSlug = true;
      this.permDialog.form = { id: null, name: "", slug: "", description: "" };
      this.permDialog.show = true;
    },

    openEditPermDialog(perm) {
      this.permDialog.isEdit = true;
      this.autoSlug = false;
      this.permDialog.form = {
        id: perm.id,
        name: perm.name,
        slug: perm.slug,
        description: perm.description || "",
      };
      this.permDialog.show = true;
    },

    async savePermission() {
      this.permDialog.saving = true;
      try {
        if (this.permDialog.isEdit) {
          await httpClient({ requiresAuth: true }).put(`${prefix}/permissions/${this.permDialog.form.id}`, {
            name: this.permDialog.form.name,
            slug: this.permDialog.form.slug,
            description: this.permDialog.form.description,
          });
          Swal.fire({ toast: true, position: "top-end", icon: "success", title: "อัปเดต Permission สำเร็จ", showConfirmButton: false, timer: 2000 });
        } else {
          if (!this.permDialog.form.name || !this.permDialog.form.slug) {
            Swal.fire("Error", "กรุณากรอกชื่อและ Slug", "error");
            this.permDialog.saving = false;
            return;
          }
          await httpClient({ requiresAuth: true }).post(`${prefix}/permissions`, {
            name: this.permDialog.form.name,
            slug: this.permDialog.form.slug,
            description: this.permDialog.form.description,
          });
          Swal.fire({ toast: true, position: "top-end", icon: "success", title: "สร้าง Permission สำเร็จ", showConfirmButton: false, timer: 2000 });
        }
        this.permDialog.show = false;
        await this.fetchPermissions();
        // Refresh roles to get updated permission data
        await this.fetchRoles();
        if (this.selectedRole) {
          const updated = this.roles.find((r) => r.id === this.selectedRole.id);
          if (updated) this.selectRole(updated);
        }
      } catch (e) {
        console.error(e);
        const msg = typeof e?.response?.data === "string" ? e.response.data : "เกิดข้อผิดพลาด";
        Swal.fire("Error", msg, "error");
      } finally {
        this.permDialog.saving = false;
      }
    },

    async confirmDeletePermission(perm) {
      const result = await Swal.fire({
        title: "ยืนยันการลบ?",
        text: `ต้องการลบ Permission "${perm.name}" (${perm.slug}) ใช่หรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d60326",
        cancelButtonColor: "#9e9e9e",
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;

      try {
        await httpClient({ requiresAuth: true }).delete(`${prefix}/permissions/${perm.id}`);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "ลบ Permission สำเร็จ", showConfirmButton: false, timer: 2000 });
        await this.fetchPermissions();
        await this.fetchRoles();
        if (this.selectedRole) {
          const updated = this.roles.find((r) => r.id === this.selectedRole.id);
          if (updated) this.selectRole(updated);
          else {
            this.selectedRole = null;
            this.selectedPermissionIds = [];
          }
        }
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "ไม่สามารถลบ Permission ได้", "error");
      }
    },

    getRolesUsingPermission(permId) {
      return this.roles.filter((r) => (r.permissions || []).some((p) => p.id === permId)).length;
    },
  },

  async mounted() {
    await Promise.all([this.fetchRoles(), this.fetchPermissions()]);
  },
};
</script>

<style scoped>
.role-item {
  cursor: pointer;
  transition: background-color 0.15s;
}

.role-item:hover {
  background-color: #f5f5f5;
}

.permission-checkbox :deep(.v-label) {
  font-size: 13px;
}
</style>
