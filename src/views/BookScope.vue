<template>
  <v-card-title>Book Scope</v-card-title>
  <v-row>
    <v-col cols="12">
      <v-card :elevation="0" :loading="init_loading">
        <v-row>
          <v-col style="display: flex">
            <v-card-title> กำหนดการจองตามช่วงเวลา </v-card-title>
            <v-autocomplete
              class="mt-2"
              v-model="provider_filter_selected"
              :items="providers"
              item-title="fullname"
              item-value="id"
              label="ค้นหาสนาม"
              clearable
              variant="outlined"
              color="primary"
              density="compact"
              hide-details="auto"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="`(${item.value}) ${item.title}`"
                >
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col align="end" class="ma-3">
            <v-btn color="primary" @click="showAddBookScopeDialog()">
              + เพิ่ม
            </v-btn>
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-card v-for="provider in provider_filtered" class="mb-5">
          <div style="display: flex; justify-content: space-between">
            <v-card-title style="display: flex; gap: 20px" class="pb-0">
              <div>
                ({{ provider.provider_id }}) {{ provider.provider.fullname }}
              </div>
              <v-switch
                color="primary"
                v-model="provider.enable"
                :label="`เปิดใช้งาน`"
                density="compact"
                style="margin-top: -5px"
                @update:modelValue="(e) => onProviderEnableChanged(e, provider)"
              >
              </v-switch>
            </v-card-title>
            <v-btn
              class="ma-3"
              color="primary"
              @click="showAddBookScopeDialog(provider.provider_id)"
            >
              + เพิ่ม
            </v-btn>
          </div>
          <div style="overflow-x: auto">
            <v-data-table
              :headers="columns"
              density="compact"
              :items="
                provider.book_scopes.map((e, i) => {
                  e.no = i + 1;
                  return e;
                })
              "
              class="elevation-0"
            >
              <template #bottom="{ pageCount }"> </template>
              <template #item.actions="{ item }">
                <div style="width: 100px; height: 100%">
                  <v-btn
                    icon
                    color="error"
                    @click="deleteBookScope(item)"
                    variant="text"
                    size="small"
                  >
                    <v-icon>mdi-delete</v-icon>
                    ลบ
                  </v-btn>
                </div>
              </template>
              <template #item.repeat="{ item }">
                <div style="width: 100px">
                  <v-btn
                    v-if="item.book_scope_template"
                    icon
                    color="error"
                    @click="deleteBookScopeTemplate(item.book_scope_template)"
                    variant="text"
                    size="small"
                    style="margin-left: 15px"
                  >
                    <v-icon>mdi-delete-clock</v-icon>
                    ยกเลิก
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-card>
    </v-col>
    <v-dialog v-model="show_add_book_scope" width="550px" persistent>
      <v-card>
        <v-card-title> เพิ่มช่วงเวลาเปิดให้จอง </v-card-title>
        <v-form ref="scopeForm">
          <v-card-text>
            <v-autocomplete
              v-model="scope_form.provider_id"
              :items="providers"
              item-title="fullname"
              item-value="id"
              label="สนาม"
              auto-select-first
              @update:model-value="onProviderChanged"
              :rules="scope_rules.provider_id"
              variant="outlined"
              color="primary"
              density="compact"
              hide-details="auto"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="`(${item.value}) ${item.title}`"
                >
                </v-list-item>
              </template>
            </v-autocomplete>
            <v-checkbox
              v-model="scope_form.is_repeat"
              label="สร้างซ้ำ ทุกๆเดือน"
              density="compact"
              hide-details="auto"
              color="primary"
            >
            </v-checkbox>
            <div>
              <v-card-text class="px-0"> เวลาที่เปิดให้จอง </v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="scope_form.book_scope_time_start"
                    label="เริ่ม"
                    type="datetime-local"
                    color="primary"
                    hide-details="auto"
                    :rules="scope_rules.book_scope_time_start"
                    density="compact"
                    variant="outlined"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="scope_form.book_scope_time_end"
                    label="สิ้นสุด"
                    type="datetime-local"
                    color="primary"
                    hide-details="auto"
                    :rules="scope_rules.book_scope_time_end"
                    density="compact"
                    variant="outlined"
                  >
                  </v-text-field>
                </v-col>
                <v-col
                  v-if="scope_form.is_repeat"
                  cols="12"
                  md="6"
                  style="margin-top: -25px"
                >
                  <v-checkbox
                    v-model="scope_form.book_scope_end_of_month_checked"
                    color="primary"
                    label="เวลาสิ้นสุดถึงสิ้นเดือน"
                    density="compact"
                    hide-details="auto"
                  >
                  </v-checkbox>
                </v-col>
              </v-row>
            </div>
            <div>
              <v-card-text class="px-0"> เวลาที่จองได้ </v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="scope_form.scope_slot_time_start"
                    label="เริ่ม"
                    type="datetime-local"
                    color="primary"
                    hide-details="auto"
                    :rules="scope_rules.scope_slot_time_start"
                    density="compact"
                    variant="outlined"
                  >
                  </v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="scope_form.scope_slot_time_end"
                    label="สิ้นสุด"
                    type="datetime-local"
                    color="primary"
                    hide-details="auto"
                    :rules="scope_rules.scope_slot_time_end"
                    density="compact"
                    variant="outlined"
                  >
                  </v-text-field>
                </v-col>
                <v-col
                  v-if="scope_form.is_repeat"
                  cols="12"
                  md="6"
                  style="margin-top: -25px"
                >
                  <v-checkbox
                    v-model="scope_form.scope_slot_end_of_month_checked"
                    color="primary"
                    label="เวลาสิ้นสุดถึงสิ้นเดือน"
                    density="compact"
                  >
                  </v-checkbox>
                </v-col>
              </v-row>
            </div>
            <v-row :class="`${scope_form.is_repeat ? '' : 'mt-5'}`">
              <v-col cols="12">
                <v-autocomplete
                  v-model="scope_form.court_type_ids"
                  auto-select-first
                  :items="court_types"
                  item-title="name"
                  item-value="id"
                  label="ประเภทสนาม"
                  :rules="scope_rules.court_type_ids"
                  variant="outlined"
                  color="primary"
                  density="compact"
                  hide-details="auto"
                  chips
                  multiple
                  closable-chips
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="`(${item.value}) ${item.raw.provider_sport.sport.name} - ${item.title}`"
                    >
                    </v-list-item>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
            <v-card-actions class="pa-0 mt-5">
              <v-col align="end">
                <v-btn
                  color="primary"
                  class="mr-3"
                  @click="closeBookScopeDialog()"
                >
                  ยกเลิก
                </v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  @click="addBookScope()"
                  :loading="create_loading"
                >
                  เพิ่ม
                </v-btn>
              </v-col>
            </v-card-actions>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import resourcesApi from "../api/resourceApi";
import BookScopeSettingService from "../api/BookScopeSettingService";
import moment from "moment";
import Swal from "sweetalert2";
export default {
  name: " book-scope",
  data() {
    return {
      show_add_book_scope: false,
      providers: [],
      court_types: [],
      init_loading: false,
      columns: [
        {
          key: "no",
          title: "ลำดับ",
         
        },
        {
          key: "book_scope",
          title: "เวลาที่เปิดให้จอง",
         
        },
        {
          key: "scope_slot",
          title: "เวลาที่จองได้",
         
        },
        {
          key: "court_types",
          title: "ประเภทสนาม",
         
        },
        {
          key: "actions",
          title: "จัดการ",
         
          align: "center",
        },
        {
          key: "next_book_scope",
          title: "เวลาที่เปิดให้จองรอบถัดไป",
         
        },
        {
          key: "next_scop_slot",
          title: "เวลาที่จองได้รอบถัดไป",
         
        },
        {
          key: "repeat",
          title: "การสร้างซ้ำ",
         
        },
      ],
      scope_form: {
        provider_id: 1,

        book_scope_time_start: null,
        book_scope_time_end: null,
        book_scope_duration: 0,
        book_scope_end_of_month_checked: false,

        scope_slot_time_start: null,
        scope_slot_time_end: null,
        scope_slot_duration: 0,
        scope_slot_end_of_month_checked: false,
        court_type_ids: [],
        is_repeat: false,
      },
      scope_rules: {
        provider_id: [(v) => !!v || "กรุณาเลือกสนาม"],
        book_scope_time_start: [(v) => !!v || "กรุณาระบุ"],
        book_scope_time_end: [(v) => !!v || "กรุณาระบุ"],
        scope_slot_time_start: [(v) => !!v || "กรุณาระบุ"],
        scope_slot_time_end: [(v) => !!v || "กรุณาระบุ"],
        court_type_ids: [(v) => !!v.length || "กรุณาเลือกประเภทสนาม"],
      },
      create_loading: false,
      providers_book_scopes: [],
      provider_filter_selected: null,

      provider_book_scope: null,
    };
  },
  computed: {
    last_day_of_months() {
      return [28, 29, 30, 31];
    },
    render_type() {
      return this.$route.name;
    },
    provider_filtered() {
      return this.getProviderFilter();
    },
  },
  watch: {
    "scope_form.book_scope_time_end": {
      handler: function (val, oldVal) {
        console.log("book_scope_time_end");
        var target = moment(val).date();
        this.scope_form.book_scope_end_of_month_checked =
          this.last_day_of_months.filter((e) => e == target).length > 0
            ? true
            : false;
      },
      deep: false,
    },
    "scope_form.scope_slot_time_end": {
      handler: function (val, oldVal) {
        console.log("scope_slot_time_end");
        var target = moment(val).date();
        this.scope_form.scope_slot_end_of_month_checked =
          this.last_day_of_months.filter((e) => e == target).length > 0
            ? true
            : false;
      },
      deep: true,
    },
  },
  methods: {
    async showAddBookScopeDialog(provider_id) {
      this.scope_form.book_scope_time_start = moment().format(
        "YYYY-MM-DD 00:00:00"
      );
      this.scope_form.book_scope_time_end = moment(
        moment().endOf("month")
      ).format("YYYY-MM-DD 23:59:59");

      this.scope_form.scope_slot_time_start = moment().format(
        "YYYY-MM-DD 00:00:00"
      );
      this.scope_form.scope_slot_time_end = moment(
        moment().endOf("month")
      ).format("YYYY-MM-DD 23:59:59");
      this.show_add_book_scope = true;
      if (!provider_id) {
        this.scope_form.provider_id = this.providers[0].id;
        provider_id = this.scope_form.provider_id;
      } else {
        this.scope_form.provider_id = provider_id;
      }
      this.getCourtTypes(provider_id);
    },
    closeBookScopeDialog() {
      this.show_add_book_scope = false;
    },
    calDuration({ time_start, time_end }) {
      var duration = moment(time_end).diff(moment(time_start), "days");
      return parseInt(duration);
    },
    async addBookScope() {
      const { valid } = await this.$refs.scopeForm.validate();
      if (!valid) return;
      this.scope_form.book_scope_time_start = moment(
        this.scope_form.book_scope_time_start
      ).format("YYYY-MM-DD HH:mm:ss");
      this.scope_form.book_scope_time_end = moment(
        this.scope_form.book_scope_time_end
      ).format("YYYY-MM-DD HH:mm:ss");

      this.scope_form.scope_slot_time_start = moment(
        this.scope_form.scope_slot_time_start
      ).format("YYYY-MM-DD HH:mm:ss");
      this.scope_form.scope_slot_time_end = moment(
        this.scope_form.scope_slot_time_end
      ).format("YYYY-MM-DD HH:mm:ss");

      ///get day duration
      this.scope_form.book_scope_duration = this.calDuration({
        time_start: this.scope_form.book_scope_time_start,
        time_end: this.scope_form.book_scope_time_end,
      });
      this.scope_form.scope_slot_duration = this.calDuration({
        time_start: this.scope_form.scope_slot_time_start,
        time_end: this.scope_form.scope_slot_time_end,
      });

      console.log(this.scope_form);
      try {
        this.create_loading = true;
        await BookScopeSettingService.createBookScope(this.scope_form);
        this.create_loading = false;
        this.show_add_book_scope = false;
        Swal.fire({
          title: "สำเร็จ",
          text: "สร้างสำเร็จ",
          icon: "success",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#e21515",
          showConfirmButton: false,
          toast: true,
          timer: 2000,
        });
        ///clear form
        this.scope_form = {
          provider_id: 1,

          book_scope_time_start: null,
          book_scope_time_end: null,
          book_scope_duration: 0,
          book_scope_end_of_month_checked: false,

          scope_slot_time_start: null,
          scope_slot_time_end: null,
          scope_slot_duration: 0,
          scope_slot_end_of_month_checked: false,
          court_type_ids: [],
          is_repeat: false,
        };
        this.getProvidersBookScopes();
      } catch (error) {
        this.create_loading = false;
        Swal.fire({
          title: "ผิดพลาด",
          text: "เกิดข้อผิดพลาด",
          icon: "error",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#e21515",
        });
      }
    },
    async getProviders() {
      var res = await resourcesApi("providers").index({
        online: true,
      });
      this.providers = res.data;
    },
    async getCourtTypes(provider_id) {
      var res = await BookScopeSettingService.getCourtTypes(provider_id);
      this.court_types = res.data;
    },
    onProviderChanged(v) {
      if (!v) this.scope_form.court_type_ids = [];
      if (v != this.scope_form.provider_id) {
        this.scope_form.court_type_ids = [];
        this.getCourtTypes(v);
      }
    },
    async getProvidersBookScopes() {
      this.init_loading = true;
      var res = await BookScopeSettingService.getProvidersBookScopes();
      this.init_loading = false;
      this.providers_book_scopes = res.data;
    },
    async getProviderBookScopes(provider_id) {
      var res = await BookScopeSettingService.getProviderBookScopes(
        provider_id
      );
      this.provider_book_scope = res.data;
    },
    getProviderFilter() {
      return this.provider_filter_selected
        ? this.providers_book_scopes.filter(
            (e) => e.provider_id == this.provider_filter_selected
          )
        : this.providers_book_scopes;
    },
    onProviderEnableChanged(v, provider) {
      Swal.fire({
        title: "ยืนยันการแก้ไข",
        text: "คุณต้องการแก้ไขใช่หรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e21515",
        cancelButtonText: "ยกเลิก",
        confirmButtonText: "ยืนยัน",
      }).then((result) => {
        if (result.isConfirmed) {
          BookScopeSettingService.settingProviderBookScope(
            provider.provider_id,
            {
              book_scope_enable: v,
            }
          )
            .then((res) => {
              Swal.fire({
                title: "สำเร็จ",
                text: "แก้ไขสำเร็จ",
                icon: "success",
                showConfirmButton: false,
                toast: true,
                timer: 2000,
              });
            })
            .catch((error) => {
              provider.enable = !v;
              Swal.fire({
                toast: true,
                icon: "error",
                title: "แก้ไขไม่สำเร็จ",
                timer: 3000,
                showConfirmButton: false,
              });
            });
        } else {
          provider.enable = !v;
        }
      });
    },
    async deleteBookScope(book_scope) {
      Swal.fire({
        title: "ยืนยันการลบรอบนี้",
        text: "คุณต้องการลบใช่หรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e21515",
        cancelButtonText: "ยกเลิก",
        confirmButtonText: "ยืนยัน",
      }).then((result) => {
        if (result.isConfirmed) {
          BookScopeSettingService.deleteBookScope(book_scope.id)
            .then((res) => {
              Swal.fire({
                title: "สำเร็จ",
                text: "ลบสำเร็จ",
                icon: "success",
                showConfirmButton: false,
                toast: true,
                timer: 2000,
              });
              this.updateProviderScopesData(book_scope.provider_id);
            })
            .catch((error) => {
              Swal.fire({
                toast: true,
                icon: "error",
                title: "ลบไม่สำเร็จ",
                timer: 3000,
                showConfirmButton: false,
              });
            });
        }
      });
    },
    async deleteBookScopeTemplate(template) {
      Swal.fire({
        title: "ยืนยันการลบการสร้างซ้ำนี้",
        text: "ถ้าลบรอบการจองทั้งหมดของรูปแบบนี้จะถูกลบไปด้วย คุณต้องการลบใช่หรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e21515",
        cancelButtonText: "ยกเลิก",
        confirmButtonText: "ยืนยัน",
      }).then((result) => {
        if (result.isConfirmed) {
          BookScopeSettingService.deleteBookScopeTemplate(template.id)
            .then((res) => {
              Swal.fire({
                title: "สำเร็จ",
                text: "ลบสำเร็จ",
                icon: "success",
                showConfirmButton: false,
                toast: true,
                timer: 2000,
              });
              this.updateProviderScopesData(template.provider_id);
            })
            .catch((error) => {
              Swal.fire({
                toast: true,
                icon: "error",
                title: "ลบไม่สำเร็จ",
                timer: 3000,
                showConfirmButton: false,
              });
            });
        }
      });
    },
    async updateProviderScopesData(provider_id) {
      var index = this.providers_book_scopes.findIndex(
        (e) => e.provider_id == provider_id
      );
      var res = await BookScopeSettingService.getProviderBookScopes(
        provider_id
      );
      this.providers_book_scopes[index] = res.data;
    },
  },
  mounted() {
    this.getProviders();
    this.getProvidersBookScopes();
    if (this.render_type === "book-scope-detail") {
      this.getProviderBookScopes(this.$route.params.provider_id);
    }
  },
};
</script>
