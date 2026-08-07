<template>
  <v-card-title>
    โปรโมชันพิเศษ
    <v-btn class="ml-3" color="primary" @click="showCreateNotification">
      เพิ่มโปรโมชัน
    </v-btn>
    <v-btn class="ml-2" @click="refresh" color="blue" variant="outlined">
      <v-icon>mdi-refresh</v-icon>
    </v-btn>
  </v-card-title>

  <v-row>
    <v-col cols="8">
      <v-tabs v-model="tab">
        <v-tab value="today"> วันนี้ </v-tab>
        <v-tab value="history"> ประวัติ </v-tab>
      </v-tabs>
      <v-divider></v-divider>
      <v-window v-model="tab">
        <v-window-item value="today">
          <DataTable
            :columns="promo_colums"
            :loading="today_loading"
            :data="promos"
            @view="promo_detail = $event"
          >
            <template #build-read_count="{ item }">
              {{ item.read_amount }} / {{ getSentTotal(item) }}
            </template>

            <template #build-created_at="{ item }">
              {{ item.run_at || item.created_at }}
            </template>
          </DataTable>
        </v-window-item>
        <v-window-item value="history">
          <DataTable
            :columns="promo_colums"
            :loading="history_loading"
            :pagination="promos_history"
            @view="promo_detail = $event"
            @page-changed="onPageChanged"
          >
            <template #build-read_count="{ item }">
              {{ item?.read_amount }} / {{ getSentTotal(item) }}
            </template>

            <template #build-created_at="{ item }">
              {{ item.run_at || item.created_at }}
            </template>
          </DataTable>
        </v-window-item>
      </v-window>
    </v-col>
    <v-divider vertical style="height: 85dvh"></v-divider>
    <v-col>
      <div v-if="promo_detail">
        <v-card-text class="pa-0" style="font-size: 14px"
          >#{{ promo_detail.id }}</v-card-text
        >
        <v-card-text class="pa-0" style="font-size: 14px">{{
          promo_detail.topic
        }}</v-card-text>
        <img
          v-if="promo_detail.image"
          :src="promo_detail.image"
          style="width: 359px; object-fit: cover"
          class="mt-2"
        />
        <v-card-text class="pa-0">{{ promo_detail.detail }}</v-card-text>
        <v-card-subtitle class="pa-0 mt-2"
          >เวลาส่ง:
          {{
            getDateFormat(promo_detail.run_at || promo_detail.created_at)
          }}</v-card-subtitle
        >
        <v-card-subtitle class="pa-0"
          >อ่านแล้ว: {{ promo_detail.read_amount }} /
          {{ getSentTotal(promo_detail) }}</v-card-subtitle
        >
      </div>
    </v-col>
  </v-row>

  <v-dialog v-model="create_dialog" width="max-content" persistent>
    <v-card style="height: 100%">
      <!-- create form -->
      <v-card-text v-if="!is_preview">
        <div
          style="
            display: flex;
            flex-direction: row;
            justify-content: space-between;
          "
        >
          <span style="font-size: 15px">ตั้งค่าโปรโมชัน</span>
        </div>
        <v-divider></v-divider>
        <v-form class="mt-5" ref="create_form">
          <v-row>
            <v-col>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="create_form.topic"
                    label="หัวข้อโปรโมชัน*"
                    variant="outlined"
                    density="compact"
                    counter="200"
                    :rules="create_rules.title"
                  ></v-textarea>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="create_form.detail"
                    label="รายละเอียดโปรโมชัน*"
                    variant="outlined"
                    density="compact"
                    counter="500"
                    :rules="create_rules.description"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-col>
            <v-col>
              <v-row>
                <v-col cols="12">
                  <v-card-subtitle class="pa-0">รูปโปรโมชัน</v-card-subtitle>
                  <ImageUpload
                    class="mt-2"
                    :textPlaceholder="`เลือกรูปโปรโมชัน`"
                    :subTextPlaceholder="`718 x 533 พิกเซล`"
                    style="width: 359px; height: 266.5px"
                    :value="create_form.image"
                    @changed="create_form.image = $event"
                    width="359px"
                    height="266.5px"
                  >
                  </ImageUpload>
                </v-col>
                <v-col cols="8">
                  <v-text-field
                    v-model="create_form.run_at"
                    label="ตั้งเวลา"
                    variant="outlined"
                    density="compact"
                    type="datetime-local"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="outlined"
            @click="create_dialog = false"
          >
            ยกเลิก
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="nextToPreview">
            ถัดไป
          </v-btn>
        </v-card-actions>
      </v-card-text>

      <!-- preview from -->
      <v-card-text v-else>
        <div style="display: flex; flex-direction: row">
          <span style="font-size: 15px">ตัวอย่างก่อนส่ง</span>
        </div>
        <v-divider></v-divider>
        <v-row class="my-4">
          <v-col>
            <v-card-text class="pa-0" style="font-size: 14px">{{
              create_form.topic
            }}</v-card-text>
            <img
              v-if="create_form.image"
              :src="create_form.image"
              style="width: 359px; height: 266.5px; object-fit: cover"
              class="mt-2"
            />
            <v-card-text class="pa-0">{{ create_form.detail }}</v-card-text>
            <v-card-text v-if="create_form.run_at" class="px-0"
              >ตั้งเวลาส่ง: {{ getDateFormat(create_form.run_at) }}</v-card-text
            >
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="outlined" @click="is_preview = false">
            ย้อนกลับ
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="sentNotification"
            :loading="create_loading"
          >
            ส่งหาลูกค้า
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import ImageUpload from "@/components/ImageUpload.vue";
import DataTable from "@/components/DataTable.vue";
import Swal from "sweetalert2";
import moment from "moment";

import ConsoleService from "../api/ConsoleService";

export default {
  components: {
    ImageUpload,
    DataTable,
  },
  data() {
    return {
      tab: "today",
      promo_colums: [
        {
          title: "id",
          key: "id",
          align: "start",
          sortable: false,
          width: "100px",
        },
        {
          title: "หัวข้อ",
          key: "topic",
          align: "start",
          sortable: false,
        },
        {
          title: "วันที่ส่ง",
          key: "created_at",
          align: "start",
          width: "250px",
          sortable: false,
        },
        {
          title: "อ่านแล้ว/ทั้งหมด",
          key: "read_count",
          align: "start",
          width: "150px",
          sortable: false,
          is_build: true,
        },
        {
          title: "ดูรายละเอียด",
          key: "action",
          align: "start",
          width: "200px",
          sortable: false,
          actions: [
            {
              name: "view",
              icon: "mdi-eye",
              color: "primary",
            },
          ],
        },
      ],
      promo_detail: null,

      promos: [],
      promos_history: {
        page: 1,
        total: 0,
        data: [],
        perPage: 10,
      },

      create_dialog: false,
      create_form: {
        topic: "",
        detail: "",
        image: null,
        run_at: null,
      },
      create_rules: {
        title: [
          (v) => !!v || "กรุณากรอกหัวข้อโปรโมชัน",
          (v) =>
            (v && v.length <= 200) || "หัวข้อโปรโมชันต้องไม่เกิน 200 ตัวอักษร",
        ],
        description: [
          (v) => !!v || "กรุณากรอกรายละเอียดโปรโมชัน",
          (v) =>
            (v && v.length <= 500) ||
            "รายละเอียดโปรโมชันต้องไม่เกิน 500 ตัวอักษร",
        ],
      },
      is_preview: false,
      create_loading: false,
      today_loading: false,
      history_loading: false,
    };
  },
  methods: {
    getDateFormat(value) {
      return moment(value).format("YYYY-MM-DD HH:mm:ss");
    },
    showCreateNotification() {
      this.create_form = {
        topic: "",
        detail: "",
        image: null,
        run_at: null,
      };
      this.is_preview = false;
      this.create_dialog = true;
    },
    nextToPreview() {
      this.$refs.create_form.validate().then(({ valid }) => {
        if (valid) {
          this.is_preview = true;
        }
      });
    },
    async sentNotification() {
      try {
        this.create_form.promo_type_id = 1;
        if (this.create_form.run_at) {
          this.create_form.run_at = moment(this.create_form.run_at).format(
            "YYYY-MM-DD HH:mm:ss"
          );
        }
        this.create_loading = true;
        await ConsoleService.createPromoNotification(this.create_form);
        this.create_dialog = false;
        this.create_loading = false;
        this.fetchPromos();
        Swal.fire({
          icon: "success",
          title: "เพิ่มการส่งแจ้งเตือนสำเร็จ",
          showConfirmButton: false,
          timer: 1000,
        });
      } catch (error) {
        this.create_loading = false;
        Swal.fire({
          icon: "error",
          title: "เพิ่มการส่งแจ้งเตือนไม่สำเร็จ",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    },
    async fetchPromos() {
      this.today_loading = true;
      this.promos = await ConsoleService.getPromoNotifications(1);
      this.today_loading = false;
    },
    async fetchPromosHistory(page = 1) {
      this.history_loading = true;
      this.promos_history = await ConsoleService.getPromoNotificationHistory(
        page
      );
      this.history_loading = false;
    },
    onPageChanged(page) {
      this.fetchPromosHistory(page);
    },
    async refresh() {
      await this.fetchPromos();
      await this.fetchPromosHistory();
    },
    getSentTotal(noti) {
      if (!noti.user_ids) return "N/A";
      var user_ids = noti.user_ids.split(",");
      return user_ids.length;
    },
  },
  mounted() {
    this.fetchPromos();
    this.fetchPromosHistory();
  },
};
</script>
