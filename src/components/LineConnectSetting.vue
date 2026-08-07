<template>
  <v-dialog v-model="dialog" persistent>
    <v-card class="box">
      <v-card-title class="d-flex justify-space-between text-primary"
        ><div>ตั้งค่าการเชื่อมต่อ LINE</div>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          color="black"
          @click="close"
        ></v-btn
      ></v-card-title>
      <v-divider></v-divider>
      <v-card-item>
        <div class="d-flex">
          <div>
            <v-checkbox
              color="primary"
              v-model="isCheck"
              ref="myCheckbox"
            ></v-checkbox>
          </div>
          <div class="ml-7" style="cursor: pointer" @click="toggleCheckbox">
            เปิดให้ระบบส่งข้อความอัตโนมัติผ่าน LINE OA (ประเภทข้อความที่ส่ง
            สามารถเลือกได้ภาย หลัง)
          </div>
        </div>
        <!-- 1 -->
        <div class="d-flex mt-3">
          <div class="ps-4">1</div>
          <div class="ml-8">
            <p class="mb-2">Create Messaging API Channel (with LINE OA)</p>
            <v-text-field
              label="Channel Id"
              variant="underlined"
              class="ma-2"
              hide-details
              v-model="channel_id"
            ></v-text-field>
            <v-text-field
              label="Channel Secret"
              variant="underlined"
              class="ma-2"
              v-model="channel_secret"
              hide-details
            ></v-text-field>
          </div>
        </div>
        <!-- 2 -->
        <div class="d-flex mt-5">
          <div class="ps-4">2</div>
          <div class="ml-8">
            <p class="mb-2">
              Create LINE Login Channel (with LINE Developers Console)
            </p>
            <v-text-field
              label="LIFF ID"
              variant="underlined"
              class="ma-2"
              hide-details
              v-model="liff_id"
            ></v-text-field>
            <v-text-field
              label="Copy"
              variant="underlined"
              class="ma-2"
              hint="Endpoint URL (form LIFF of LINE Developers Console)"
              persistent-hint
              v-model="e_url"
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyText(e_url)"
            ></v-text-field>
          </div>
        </div>
      </v-card-item>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="tonal" @click="submit">Submit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "lineconnectsetting",
  props: {},
  data() {
    return {
      dialog: false,
      channel_id: "",
      channel_secret: "",
      liff_id: "",
      e_url: "",
      isCheck: false,
    };
  },
  computed: {},
  methods: {
    open(data) {
      this.e_url = data.endpoint_url;
      this.channel_id = data.channel_id;
      this.channel_secret = data.channel_secret;
      this.liff_id = data.liff_id;
      this.dialog = true;
    },
    close() {
      this.dialog = false;
    },
    submit() {
      if (this.isCheck) {
        const obj = {
          e_url: this.e_url,
          channel_id: this.channel_id,
          channel_secret: this.channel_secret,
          liff_id: this.liff_id,
        };
        console.log(obj);
      }
    },
    copyText(text) {
      console.log(text);
    },
    toggleCheckbox() {
      // Toggle the checkbox using its ref
      this.isCheck = !this.isCheck;
    },
  },
};
</script>

<style scoped>
.box {
  width: 600px;
  max-height: 90vh;
  overflow: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@media screen and (max-width: 700px) {
  .box {
    width: 95vw;
  }
}
</style>
