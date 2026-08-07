<template>
  <div>
    <v-row class="mx-5 mt-3">
      <v-col cols="4">
        <v-text-field label="Enter Provider Name" variant="outlined" density="compact" v-model="filter.search"
          append-inner-icon="mdi-magnify" clearable @update:modelValue="fetch({ page: 1 })"></v-text-field>
      </v-col>
      <v-col>
        <v-btn color="blue" class="ml-5" @click="fetch" variant="outlined">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col class="text-center">
        <v-progress-circular indeterminate class="mt-5"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else>
      <!-- Left Table -->
      <v-col :cols="7">
        <v-card flat>
          <v-card-title>
            Provider Lists ( {{ pagination.total }} )
          </v-card-title>

          <v-card class="ma-2">
            <v-data-table-server v-model:items-per-page="pagination.perPage" :headers="header" :items="pagination.data"
              :itemsLength="pagination.total" :loading="loading" class="elevation-1" fixed-header
              height="calc(100dvh - 225px)">
              <!-- Row template -->
              <template v-slot:item="{ item, index }">
                <tr @click="selectProvider(item)" :class="{ 'selected-row': get_selected_provider?.id === item.id }">
                  <td>{{ item.id }}</td>
                  <td>{{ item.fullname }}</td>
                  <td>
                    {{ item.endpoint_url }}
                    <v-icon v-if="item.endpoint_url" class="liff-id" @click.stop="copyText(item)"
                      size="small">mdi-content-copy</v-icon>
                  </td>
                </tr>
              </template>

              <!-- Pagination -->
              <template v-slot:bottom>
                <v-pagination v-model="pagination.page" :length="pagination.lastPage" @next="updatePage"
                  @prev="updatePage" :total-visible="5">
                  <template v-slot:item="item">
                    <v-btn :key="item" fab small class="ma-2 elevation-0" @click="updatePage(item.page)"
                      :color="pagination.page == item.page ? 'grey-lighten-2' : ''">
                      {{ item.page }}
                    </v-btn>
                  </template>
                </v-pagination>
              </template>
            </v-data-table-server>
          </v-card>
        </v-card>
      </v-col>

      <v-divider vertical style="height: calc(100dvh - 90px)"></v-divider>

      <!-- Right Card -->
      <v-col :cols="5">
        <v-card flat>
          <v-card-item>
            <v-card v-if="get_selected_provider" flat>
              <v-card-text>
                <table width="100%">
                  <tr>
                    <td class="font-weight-bold">Provider ID</td>
                    <td>
                      {{ get_selected_provider.id }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Name</td>
                    <td>
                      {{ get_selected_provider.fullname }}
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">LIFF ID</td>
                    <td>
                      <v-text-field v-model="liff_id" dense hide-details></v-text-field>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Provider Logo</td>
                    <td>
                      <template v-if="get_selected_provider.logo">
                        <img :src="get_selected_provider.logo"
                          style="max-height: 100px; max-width: 100px; object-fit: contain;" />
                      </template>
                      <template v-else>
                        <input type="file" accept="image/*" @change="onLogoSelected" />
                      </template>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Channel ID</td>
                    <td>
                      <v-text-field v-model="channelId" dense hide-details></v-text-field>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold">Channel Secret</td>
                    <td>
                      <v-text-field v-model="channelSecret" dense hide-details></v-text-field>
                    </td>
                  </tr>
                </table>

                <v-btn color="primary" class="mt-3" @click="saveProvider(get_selected_provider)">Save</v-btn>
              </v-card-text>
            </v-card>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <line-connect-setting ref="lineconnectsetting" />
  </div>
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import LineConnectSetting from "../components/LineConnectSetting.vue";
import copyToClipboard from "../helper/copyText";
import Swal from 'sweetalert2';

export default {
  components: { LineConnectSetting },
  name: "liffsetting",
  data() {
    return {
      list: [],
      selected_provider: null,
      loading: false,
      pagination: {
        data: [],
        page: 1,
        perPage: 20,
        total: 10,
        lastPage: 10,
      },
      filter: { search: null },
      channelId: '',
      channelSecret: ''
    };
  },
  computed: {
    liff_id: {
      get() {
        return this.get_selected_provider?.liff_id?.replace('https://liff.line.me/', '') || '';
      },
      set(value) {
        if (this.get_selected_provider) {
          this.get_selected_provider.liff_id = value;
        }
      }
    },
    get_selected_provider() {
      if (this.selected_provider) {
        return this.selected_provider;
      } else {
        return this.pagination.data.length ? this.pagination.data[0] : null;
      }
    },
    header() {
      return [
        { title: "Provider ID", key: "id", sortable: false },
        { title: "Provider Name", key: "fullname", sortable: false, align: "center" },
        { title: "LIFF URL", key: "endpoint_url", sortable: false, align: "center" },
      ];
    },
    preparePayload() {
      return {
        page: this.pagination.page,
        search: this.filter.search,
      };
    },
  },
  methods: {
    selectProvider(item) {
      this.selected_provider = { ...item };
    },
    copyText(item) {
      item.copy = true;
      copyToClipboard(item.endpoint_url);
      setTimeout(() => {
        item.copy = false;
      }, 1000);
    },
    connectLineSettingDialog() {
      this.$refs.lineconnectsetting.open(this.get_selected_provider);
    },
    async fetchCredentials() {
      const creds = await ConsoleService.getLiffCredentials();
      if (creds && creds.channelId && creds.channelSecret) {
        this.channelId = creds.channelId;
        this.channelSecret = creds.channelSecret;
      }
    },
    async generateLiffUrl() {
      if (!this.channelId || !this.channelSecret) {
        Swal.fire('Error', 'Please input Channel ID and Secret', 'error');
        return;
      }
      if (!this.get_selected_provider) return;

      this.loading = true;
      try {
        const payload = {
          providers: [{
            id: this.get_selected_provider.id,
            name: this.get_selected_provider.fullname
          }]
        };
        const headers = {
          'x-channel-id': this.channelId,
          'x-channel-secret': this.channelSecret
        };

        const res = await ConsoleService.createLiffApp(payload, headers);
        if (res && res.createdList && res.createdList.length > 0) {
          const liffApp = res.createdList[0];
          this.get_selected_provider.endpoint_url = `https://liff.line.me/${liffApp.liffId}`;
          this.get_selected_provider.liff_id = liffApp.liffId;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'สร้าง LIFF URL สำเร็จ',
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          Swal.fire('Error', 'ล้มเหลวในการสร้าง LIFF', 'error');
        }
      } catch (e) {
        Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
      } finally {
        this.loading = false;
      }
    },
    onLogoSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        try {
          const res = await ConsoleService.uploadProviderLogo(this.get_selected_provider.id, { image: base64 });
          if (res && res.message === 'success') {
            this.get_selected_provider.logo = res.logo;
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'อัพโหลดโลโก้สำเร็จ', showConfirmButton: false, timer: 2000 });
          } else {
            Swal.fire('Error', res.message || 'Upload failed', 'error');
          }
        } catch (err) {
          Swal.fire('Error', 'Upload error', 'error');
        }
      };
      reader.readAsDataURL(file);
    },
    async fetch({ page = 1 }) {
      this.loading = true;
      const res = await ConsoleService.getProviderLiff({
        ...this.preparePayload,
        page,
      });

      res.data = res.data.map((e) => {
        if (e.liff_id) {
          e.endpoint_url = e.liff_id.startsWith('http') ? e.liff_id : `https://liff.line.me/${e.liff_id}`;
        }
        return e;
      });
      this.pagination = res;
      this.loading = false;
    },
    updatePage(newPage) {
      if (newPage != "...") {
        this.fetch({ page: parseInt(newPage) });
      }
    },
    async saveProvider(provider) {
      const result = await Swal.fire({
        title: 'ยืนยันการบันทึก?',
        text: 'คุณต้องการบันทึกข้อมูลนี้หรือไม่',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
      });
      if (!result.isConfirmed) return;

      this.loading = true;
      try {
        // Generate LIFF URL first if credentials are available and no liff_id yet
        if (this.channelId && this.channelSecret && !provider.liff_id) {
          const payload = {
            providers: [{
              id: provider.id,
              name: provider.fullname
            }]
          };
          const headers = {
            'x-channel-id': this.channelId,
            'x-channel-secret': this.channelSecret
          };
          const res = await ConsoleService.createLiffApp(payload, headers);
          if (res && res.createdList && res.createdList.length > 0) {
            const liffApp = res.createdList[0];
            provider.endpoint_url = `https://liff.line.me/${liffApp.liffId}`;
            provider.liff_id = liffApp.liffId;
          } else {
            Swal.fire('Error', 'ล้มเหลวในการสร้าง LIFF', 'error');
            return;
          }
        }

        // Save provider
        await ConsoleService.updateProviderLiff(provider.id, {
          liff_id: provider.liff_id
        });
        this.fetch({ page: this.pagination.page });
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      } catch (e) {
        console.error(e);
        Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetch({ page: 1 });
    this.fetchCredentials();
  },
};
</script>

<style scoped>
.liff-id {
  cursor: pointer;
  margin-left: 10px;
  color: grey;
}

.liff-check {
  margin-left: 10px;
  color: rgb(8, 231, 8);
}

.liff-id:hover {
  color: black;
}

.liff-id:active {
  scale: 0.7;
}

.provider-id {
  cursor: pointer;
}

.provider-id:active {
  scale: 0.95;
}

.selected-row {
  background-color: #e3f2fd;
}

th,
td {
  border: none;
  padding: 0px 0px 20px 0px;
}
</style>
