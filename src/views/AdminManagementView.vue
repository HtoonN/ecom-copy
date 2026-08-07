<template>
  <div>
    <v-card-title class="d-flex align-center">
      จัดการผู้ดูแลระบบ ({{ pagination.total }})
      <v-spacer />
      <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus">เพิ่มแอดมิน</v-btn>
    </v-card-title>

    <v-row class="mx-5 mt-1">
      <v-col cols="4">
        <v-text-field label="ค้นหาชื่อ / Username" variant="outlined" density="compact" v-model="filter.keyword"
          append-inner-icon="mdi-magnify" clearable @update:modelValue="fetchAdmins({ page: 1 })"></v-text-field>
      </v-col>
      <v-col>
        <v-btn color="blue" class="ml-5" @click="fetchAdmins({ page: 1 })" variant="outlined">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Admin Table -->
    <v-data-table-server v-model:items-per-page="pagination.perPage" :headers="headers" :items="pagination.data"
      :items-length="pagination.total" :loading="loading" class="elevation-1 mx-5" fixed-header
      height="calc(100dvh - 295px)">

      <template v-slot:item.role="{ item }">
        <v-chip v-if="item.role" color="primary" size="small">{{ item.role.name }}</v-chip>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:item.is_active="{ item }">
        <v-chip :color="item.is_active ? 'success' : 'error'" size="small">
          {{ item.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
        </v-chip>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn icon variant="text" size="small" v-if="item.id !== currentUserId" color="primary"
          @click="openEditDialog(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn v-if="item.id !== currentUserId" icon variant="text" size="small" color="error"
          @click="confirmDelete(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>

      <template v-slot:bottom>
        <v-pagination v-model="pagination.page" :length="pagination.lastPage" @next="updatePage" @prev="updatePage"
          :total-visible="5">
          <template v-slot:item="item">
            <v-btn :key="item" fab small class="ma-2 elevation-0" @click="updatePage(item.page)"
              :color="pagination.page == item.page ? 'grey-lighten-2' : ''">
              {{ item.page }}
            </v-btn>
          </template>
        </v-pagination>
      </template>
    </v-data-table-server>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title>{{ dialog.isEdit ? 'แก้ไขข้อมูลแอดมิน' : 'เพิ่มแอดมินใหม่' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="dialog.form.username" label="Username" variant="outlined" density="compact"
            :disabled="dialog.isEdit" class="mb-2"></v-text-field>

          <v-text-field v-model="dialog.form.name" label="ชื่อ-นามสกุล" variant="outlined" density="compact"
            class="mb-2"></v-text-field>

          <v-text-field v-model="dialog.form.password"
            :label="dialog.isEdit ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'" variant="outlined"
            density="compact" type="password" class="mb-2"></v-text-field>

          <v-select v-model="dialog.form.role_id" :items="roles" item-title="name" item-value="id" label="เลือก Role"
            variant="outlined" density="compact" class="mb-2"></v-select>

          <v-switch v-if="dialog.isEdit" v-model="dialog.form.is_active" label="สถานะใช้งาน" color="success"
            inset></v-switch>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.show = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" @click="saveAdmin" :loading="dialog.saving">บันทึก</v-btn>
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
  name: "AdminManagementView",
  data() {
    return {
      loading: false,
      roles: [],
      currentUserId: null,
      filter: { keyword: "" },
      pagination: {
        data: [],
        page: 1,
        perPage: 20,
        total: 0,
        lastPage: 0,
      },
      headers: [
        { title: "ID", key: "id", sortable: false, width: "60px" },
        { title: "Username", key: "username", sortable: false },
        { title: "ชื่อ", key: "name", sortable: false },
        { title: "Role", key: "role", sortable: false },
        { title: "สถานะ", key: "is_active", sortable: false, align: "center" },
        { title: "วันที่สร้าง", key: "created_at", sortable: false },
        { title: "", key: "actions", sortable: false, align: "center", width: "120px" },
      ],
      dialog: {
        show: false,
        isEdit: false,
        saving: false,
        form: {
          id: null,
          username: "",
          name: "",
          password: "",
          role_id: null,
          is_active: true,
        },
      },
    };
  },
  methods: {
    async fetchAdmins({ page = 1 }) {
      this.loading = true;
      try {
        const res = await httpClient({ requiresAuth: true }).get(`${prefix}/admins`, {
          params: {
            page,
            limit: this.pagination.perPage,
            keyword: this.filter.keyword || "",
          },
        });
        this.pagination = res.data;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    async fetchRoles() {
      try {
        const res = await httpClient({ requiresAuth: true }).get(`${prefix}/roles`);
        this.roles = res.data;
      } catch (e) {
        console.error(e);
      }
    },

    openCreateDialog() {
      this.dialog.isEdit = false;
      this.dialog.form = {
        id: null,
        username: "",
        name: "",
        password: "",
        role_id: null,
        is_active: true,
      };
      this.dialog.show = true;
    },

    openEditDialog(item) {
      this.dialog.isEdit = true;
      this.dialog.form = {
        id: item.id,
        username: item.username,
        name: item.name || "",
        password: "",
        role_id: item.role_id,
        is_active: !!item.is_active,
      };
      this.dialog.show = true;
    },

    async saveAdmin() {
      this.dialog.saving = true;
      try {
        if (this.dialog.isEdit) {
          const payload = {
            name: this.dialog.form.name,
            role_id: this.dialog.form.role_id,
            is_active: this.dialog.form.is_active,
          };
          if (this.dialog.form.password) {
            payload.password = this.dialog.form.password;
          }
          await httpClient({ requiresAuth: true }).put(`${prefix}/admins/${this.dialog.form.id}`, payload);
          Swal.fire({ toast: true, position: "top-end", icon: "success", title: "อัปเดตสำเร็จ", showConfirmButton: false, timer: 2000 });
        } else {
          if (!this.dialog.form.username || !this.dialog.form.password) {
            Swal.fire("Error", "กรุณากรอก Username และ Password", "error");
            this.dialog.saving = false;
            return;
          }
          await httpClient({ requiresAuth: true }).post(`${prefix}/admins`, {
            username: this.dialog.form.username,
            password: this.dialog.form.password,
            name: this.dialog.form.name,
            role_id: this.dialog.form.role_id,
          });
          Swal.fire({ toast: true, position: "top-end", icon: "success", title: "เพิ่มแอดมินสำเร็จ", showConfirmButton: false, timer: 2000 });
        }
        this.dialog.show = false;
        this.fetchAdmins({ page: this.pagination.page });
      } catch (e) {
        console.error(e);
        const msg = e?.response?.data?.[0]?.message || "เกิดข้อผิดพลาด";
        Swal.fire("Error", msg, "error");
      } finally {
        this.dialog.saving = false;
      }
    },

    async confirmDelete(item) {
      const result = await Swal.fire({
        title: "ยืนยันการลบ?",
        text: `ต้องการลบแอดมิน "${item.username}" ใช่หรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d60326",
        cancelButtonColor: "#9e9e9e",
        confirmButtonText: "ลบ",
        cancelButtonText: "ยกเลิก",
      });
      if (!result.isConfirmed) return;

      try {
        await httpClient({ requiresAuth: true }).delete(`${prefix}/admins/${item.id}`);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "ลบสำเร็จ", showConfirmButton: false, timer: 2000 });
        this.fetchAdmins({ page: this.pagination.page });
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "ไม่สามารถลบแอดมินได้", "error");
      }
    },

    updatePage(newPage) {
      if (newPage !== "...") {
        this.fetchAdmins({ page: parseInt(newPage) });
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    },
  },
  async mounted() {
    try {
      const userStr = localStorage.getItem("md_console_user");
      if (userStr) {
        this.currentUserId = JSON.parse(userStr).id || null;
      }
    } catch (e) {
      console.error(e);
    }
    await this.fetchRoles();
    this.fetchAdmins({ page: 1 });
  },
};
</script>
