<template>
  <v-card class="elevation-1 bg-white mb-4">
    <v-card-title class="d-flex justify-space-between align-center pb-0 pt-4 px-6 border-b pb-3">
      <p class="text-h6 font-weight-bold">Provider Info ({{ data?.fullname }})</p>
    </v-card-title>

    <v-tabs v-model="tab" color="primary" align-tabs="start" class="px-4 mt-2">
      <v-tab value="profile"><v-icon start>mdi-account</v-icon> Customer Profile</v-tab>
      <v-tab value="media"><v-icon start>mdi-image-multiple</v-icon> เปิดสนาม</v-tab>
      <v-tab value="condition"><v-icon start>mdi-file-document-outline</v-icon>Conditions</v-tab>
      <v-tab value="subscription"><v-icon start>mdi-key-variant</v-icon> Subscription</v-tab>
      <v-tab value="system"><v-icon start>mdi-cog</v-icon> System Setting</v-tab>
      <v-tab value="commission"><v-icon start>mdi-percent</v-icon> Commission</v-tab>
    </v-tabs>
    <v-divider></v-divider>

    <v-card-text class="pt-4" style="background-color: #f5f7f9;">
      <v-window v-model="tab" v-if="data">
        <!-- Tab 1: Customer Profile -->
        <v-window-item value="profile">
          <v-card class="pa-5 mb-4 elevation-0">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 text-primary">ข้อมูลพื้นฐาน/สถานที่</h3>
            <v-row dense>
              <v-col cols="12">
                <v-text-field label="ชื่อสนาม" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.venue_name"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field label="ละติจูด (Lat)" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.lat" @update:model-value="onCoordsChange"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field label="ลองจิจูด (Long)" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.lng" @update:model-value="onCoordsChange"></v-text-field>
              </v-col>
              <v-col cols="12">
                <div id="map-selector" class="rounded border elevation-2"
                  style="height: 300px; width: 100%; z-index: 1;"></div>
              </v-col>
              <v-col cols="12">
                <v-text-field label="ย่าน" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.zone"></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-autocomplete label="จังหวัด" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.province" :items="provinces" item-title="name_th" item-value="name_th"
                  @update:model-value="onProvinceChange"></v-autocomplete>
              </v-col>
              <v-col cols="4">
                <v-autocomplete label="เขต/อำเภอ" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.district" :items="districts" item-title="name_th" item-value="name_th"
                  @update:model-value="onDistrictChange" :disabled="!data.customer_profile.province"></v-autocomplete>
              </v-col>

              <v-col cols="4">
                <v-autocomplete label="ตำบล" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.sub_district" :items="sub_districts" item-title="name_th"
                  item-value="name_th" :disabled="!data.customer_profile.district"
                  @update:model-value="onSubDistrictChange"></v-autocomplete>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>
            <h3 class="text-subtitle-1 font-weight-bold mb-4 text-primary">ข้อมูลผู้ประกอบการ และการติดต่อ</h3>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-select label="ประเภท" :items="['บุคคลธรรมดา', 'นิติบุคคล']" variant="outlined" density="compact"
                  hide-details v-model="data.customer_profile.tax_type"></v-select>
              </v-col>
              <v-col cols="12" sm="8">
                <v-text-field label="ชื่อผู้ประกอบการ" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.operator_name"></v-text-field>
              </v-col>
              <v-col cols="12" sm="12">
                <v-text-field label="เลขประจำตัว 13 หลัก" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.tax_id"></v-text-field>
              </v-col>
              <v-col cols="12" sm="12">
                <v-textarea rows="2" label="ที่อยู่ผู้ประกอบการ" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.address"></v-textarea>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>
            <h3 class="text-subtitle-1 font-weight-bold mb-4 text-primary">ผู้ติดต่อ (Contact Person)</h3>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field label="ชื่อผู้ติดต่อ" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.contact_name"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="เบอร์โทรติดต่อ" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.contact_phone"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="อีเมล" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.email"></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>
            <h3 class="text-subtitle-1 font-weight-bold mb-4 text-primary">ข้อมูลธนาคาร (Bank Info)</h3>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field label="ชื่อบัญชี" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.account_name"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field label="เลขที่บัญชี" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.account_number"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-select label="ธนาคาร" variant="outlined" density="compact" hide-details
                  v-model="data.customer_profile.bank_id" :items="banks" item-title="name" item-value="id"></v-select>
              </v-col>
            </v-row>

            <v-divider class="my-5"></v-divider>
            <div class="d-flex align-center justify-space-between mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-0 text-primary">ข้อมูลภาษี (Provider Tax)</h3>
            </div>

            <v-row dense>
              <v-col cols="6">
                <v-text-field label="เลขประจำตัวผู้เสียภาษี" variant="outlined" density="compact" hide-details
                  v-model="taxFormData.tax_id"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field label="ชื่อบริษัท" variant="outlined" density="compact" hide-details
                  v-model="taxFormData.tax_name"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field label="ชื่อร้านค้า" variant="outlined" density="compact" hide-details
                  v-model="taxFormData.store_name"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field label="ที่อยู่ผู้เสียภาษี" variant="outlined" density="compact" hide-details
                  v-model="taxFormData.tax_address"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field label="ข้อความหัก ณ ที่จ่าย" variant="outlined" density="compact" hide-details
                  v-model="taxFormData.withholding_tax_text"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea label="หมายเหตุ" variant="outlined" density="compact" hide-details rows="2"
                  v-model="taxFormData.free_text"></v-textarea>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>

        <!-- Tab 5: Media & Settings -->
        <v-window-item value="media">
          <v-card class="pa-5 mb-4 elevation-0">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 text-primary">รูปภาพ และโลโก้ (Media & Logos)</h3>
            <div class="logo-section mb-6">
              <div class="logo-header mb-2">
                <span class="text-subtitle-2">Logos</span>
                <span class="logo-hint ml-2 text-caption text-grey">Click a logo to change or upload.</span>
              </div>
              <v-row class="logo-grid pl-2" dense no-gutters>
                <div v-for="logoType in logoTypes" :key="logoType.key" class="mr-4">
                  <div class="logo-card" :class="{ 'logo-card--empty': !getLogoUrl(logoType.key) }"
                    @click="triggerLogoFileSelect(logoType.key)">
                    <v-img v-if="getLogoUrl(logoType.key)" :src="getLogoUrl(logoType.key)" aspect-ratio="1" contain
                      height="100" class="logo-thumb" />
                    <div v-else class="logo-placeholder">
                      <v-icon size="28">mdi-image-outline</v-icon>
                      <div class="logo-placeholder-text">No image</div>
                    </div>
                    <div class="logo-footer mt-2">
                      <div class="logo-label">{{ logoType.label }}</div>
                    </div>
                  </div>
                </div>
              </v-row>
              <input ref="logoFileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden-file-input"
                @change="onLogoFileSelected" />
            </div>

            <div class="media-section">
              <div class="media-actions d-flex align-center justify-space-between mb-4">
                <div>
                  <span class="text-subtitle-2">Media</span>
                  <span class="section-total ml-1 text-grey">({{ totalMediaCount }})</span>
                </div>
                <div class="media-left d-flex gap-2">
                  <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" size="small"
                    :disabled="loading || mediaLoading || savingMedia" @click="triggerFileSelect">
                    Add Images
                  </v-btn>
                  <v-btn v-if="selectedFilePreviews.length > 0" color="primary" prepend-icon="mdi-upload" size="small"
                    class="ml-2" :disabled="loading || mediaLoading || savingMedia || selectedFiles.length === 0"
                    @click="uploadSelectedImages">
                    Upload
                    <span class="upload-count bg-white text-primary ml-1 px-1 rounded">{{ selectedFiles.length }}</span>
                  </v-btn>
                </div>
              </div>
              <div v-if="displayedMediaImages.length > 0 || selectedFilePreviews.length > 0"
                class="media-row d-flex overflow-x-auto pb-4" ref="mediaRow">
                <div v-for="(url, index) in displayedMediaImages" :key="`media-${index}`" class="media-item mr-4">
                  <v-img :src="url" aspect-ratio="1" contain height="120" width="120"
                    class="media-thumb bg-grey-lighten-4 rounded-lg border" />
                </div>
                <div v-for="(url, index) in selectedFilePreviews" :key="`preview-${index}`"
                  class="media-item position-relative mr-4">
                  <v-img :src="url" aspect-ratio="1" contain height="120" width="120"
                    class="media-thumb media-thumb--pending bg-grey-lighten-4 rounded-lg border border-primary border-dashed" />
                  <v-btn icon="mdi-close" size="x-small" variant="tonal" color="error"
                    class="media-remove position-absolute" style="top: 4px; right: 4px;"
                    @click="removeSelectedPreview(index)" />
                </div>
              </div>
              <div v-else
                class="text-center text-grey-darken-1 py-6 bg-grey-lighten-4 rounded-lg border-dashed border mb-2">No
                images yet.</div>
              <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png" class="hidden-file-input"
                @change="onFilesSelected" />
            </div>

            <v-divider class="my-5"></v-divider>
            <div class="detail-section mb-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-0 text-primary">รายละเอียด (Details)</h3>
                <div class="detail-actions" v-if="detailDirty">
                  <v-btn variant="outlined" color="grey" size="small" @click="resetDetailForm">
                    Cancel
                  </v-btn>
                  <v-btn color="primary" size="small" :loading="detailSaving" class="ml-2" @click="saveDetailForm">
                    Update Names
                  </v-btn>
                </div>
              </div>
              <v-row dense class="mb-4">
                <v-col cols="12" sm="6">
                  <v-text-field v-model="detailForm.fullname" label="Fullname (TH)" placeholder="ชื่อสนาม" clearable
                    hide-details variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="detailForm.fullname_en" label="Fullname (EN)"
                    placeholder="Venue Name (English)" clearable hide-details variant="outlined" density="compact" />
                </v-col>
              </v-row>
              <div class="detail-row--switch">
                <div class="detail-switch">
                  <div class="detail-switch__label">Open Provider</div>
                  <v-switch v-model="detailForm.open_provider" :true-value="1" :false-value="0" color="primary"
                    hide-details density="compact" inset @update:model-value="onSwitchChanged" />
                </div>
                <div class="detail-switch">
                  <div class="detail-switch__label">Hide On App</div>
                  <v-switch v-model="detailForm.hide_on_app" :true-value="1" :false-value="0" color="primary"
                    hide-details density="compact" inset @update:model-value="onSwitchChanged" />
                </div>
                <div class="detail-switch">
                  <div class="detail-switch__label">Hide On Web</div>
                  <v-switch v-model="detailForm.hide_on_web" :true-value="1" :false-value="0" color="primary"
                    hide-details density="compact" inset @update:model-value="onSwitchChanged" />
                </div>
              </div>
            </div>

            <v-divider class="my-5"></v-divider>
            <div class="court-type-section mb-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-0 text-primary">
                  จำนวนคอร์ท (Courts) <span class="text-grey text-caption">({{ data?.court_types?.length || 0 }})</span>
                </h3>
              </div>
              <v-row dense>
                <v-col v-for="courtType in data?.court_types || []" :key="courtType.id" cols="12" sm="6" md="4">
                  <v-card variant="outlined" class="court-type-card mb-2">
                    <v-card-text class="d-flex align-center justify-space-between py-3 px-4">
                      <div class="d-flex flex-column">
                        <div class="court-type-name font-weight-bold text-subtitle-1">
                          {{ courtType.name }}
                        </div>
                        <div class="court-type-name-en text-grey-darken-1 text-subtitle-2">
                          {{ courtType.name_en || 'No English Name' }}
                        </div>
                      </div>
                      <v-btn icon="mdi-pencil" variant="text" color="primary" size="small"
                        @click="openEditCourtDialog(courtType)" />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col v-if="!data?.court_types?.length" cols="12">
                  <div class="text-center text-grey-darken-1 py-4 bg-grey-lighten-4 rounded-lg border-dashed border">No
                    courts defined for this venue.</div>
                </v-col>
              </v-row>
            </div>

            <v-divider class="my-5"></v-divider>
            <div class="facilities-section mb-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <h3 class="text-subtitle-1 font-weight-bold mb-0 text-primary">สิ่งอำนวยความสะดวก (Facilities) <span
                    class="text-grey text-caption">({{ facilityTotal }})</span></h3>
                <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" size="small"
                  :disabled="loading || isProviderLoading || detailSaving" @click="openFacilityDialog">
                  Create Facilities
                </v-btn>
              </div>
              <v-data-table v-if="tableReady" :headers="facilityHeaders" :items="facilityTableItems"
                class="facility-table border rounded-lg" :items-per-page="10" density="compact">
                <template v-slot:no-data>
                  <div class="py-4 text-grey-darken-1 text-center">No facilities selected.</div>
                </template>
              </v-data-table>
              <div v-else class="text-center py-6 border rounded-lg bg-grey-lighten-4">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </div>
          </v-card>
        </v-window-item>

        <!-- Tab 2: Subscription -->
        <v-window-item value="subscription">
          <v-card class=" mb-4 elevation-0 bg-grey-lighten-4 rounded-lg">
            <div class="d-flex align-center mb-2">
              <h4 class="text-h6 font-weight-bold mb-0 ml-2 text-primary">Current Subscription</h4>
            </div>

            <!-- Visualization Card -->
            <v-card class="pa-8 mb-6 elevation-2 rounded-xl bg-white subscription-card position-relative">
              <v-btn icon="mdi-pencil" variant="tonal" density="comfortable" color="primary" size="small"
                class="position-absolute" style="top: 16px; right: 16px;" @click="editPackageDialog = true"
                title="แก้ไขแพ็คเกจ"></v-btn>
              <v-row class="mb-8">
                <!-- <v-col cols="6">
                  <div class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-2">Start Date</div>
                  <div class="text-h6 font-weight-bold">{{ startDateFormatted }}</div>
                  <div class="text-caption text-grey">{{ startTimeFormatted }}</div>
                </v-col> -->
                <v-col cols="6">
                  <div class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-2">End Date</div>
                  <div class="text-h6 font-weight-bold">{{ endDateFormatted }}</div>
                  <div class="text-caption text-grey">{{ endTimeFormatted }}</div>
                </v-col>
                <v-col cols="6">
                  <div>
                    <div class="text-h3 font-weight-bold line-height-1 mb-1">{{ remainingDaysCount }}</div>
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase">Left Days</div>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="mb-8"></v-divider>

              <v-row class="mb-10">
                <v-col cols="6">
                  <div class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-2">Subscription Type
                  </div>
                  <div class="text-h6 font-weight-bold text-primary">{{ data.subscription.name || 'N/A' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-uppercase text-caption font-weight-bold text-grey-darken-1 mb-2">Price</div>
                  <div class="text-h6 font-weight-bold">{{ data.subscription.price || '-' }}</div>
                </v-col>
              </v-row>

            </v-card>



            <!-- Subscription Log (Placeholder) -->
            <div class="mt-6 mb-2">
              <h4 class="text-subtitle-1 font-weight-bold mb-3 ml-2 text-primary">Subscription History</h4>
              <v-card class="elevation-0 border bg-white rounded-lg">
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th class="text-left font-weight-bold">วันที่ดำเนินการ</th>
                      <th class="text-left font-weight-bold">แพ็คเกจ</th>
                      <th class="text-left font-weight-bold">ราคา</th>
                      <th class="text-left font-weight-bold">วันที่หมดอายุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="text-grey">
                      <td colspan="4" class="text-center py-6 text-caption">ยังไม่มีข้อมูลการเปลี่ยนแปลงแพ็คเกจ
                        (ระบบกำลังพัฒนา)</td>
                    </tr>
                    <!-- ตัวอย่าง Mockup (สามารถเปิดใช้งานเมื่อต่อ API จริง) -->
                    <!-- <tr>
                      <td class="text-caption">01/01/2024 10:30</td>
                      <td class="text-caption text-success font-weight-bold">ต่ออายุ / เปลี่ยนแพ็คเกจ</td>
                      <td class="text-caption">Premium Plan</td>
                      <td class="text-caption">Admin (admin@matchday.com)</td>
                    </tr> -->
                  </tbody>
                </v-table>
              </v-card>
            </div>
          </v-card>
        </v-window-item>

        <!-- Tab 3: System Setting -->
        <v-window-item value="system">
          <v-card class="mb-4 pa-4 elevation-0 border-0 bg-transparent">
            <v-card class="pa-4 mb-4 elevation-1">
              <h6 class="mb-4">Court</h6>
              <v-row no-gutters>
                <v-col cols="4">
                  <v-switch label="Show Court Type" hide-details v-model="data.provider_setting.show_court_type"
                    color="primary" :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Show Court" hide-details v-model="data.provider_setting.show_court" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Can Select Court" hide-details v-model="data.provider_setting.can_select_court"
                    color="primary" :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Fixed Hour" hide-details v-model="data.provider_setting.fixed_hour" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Half Hour" hide-details v-model="data.provider_setting.half_hour" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Round Up" hide-details v-model="data.provider_setting.round_up" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>
              </v-row>
              <v-row class="mt-2">
                <v-col cols="6">
                  <v-text-field label="Min Duration" variant="outlined" density="compact" type="number" :step="30"
                    :min="0" clearable hide-details :model-value="data.provider_setting.min_duration"
                    @update:model-value="data.provider_setting.min_duration = $event === '' || $event === null ? null : Number($event)"
                    @keydown.prevent placeholder="ไม่ตั้งค่า"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field label="Fix Duration" variant="outlined" density="compact" type="number" :step="30"
                    :min="0" clearable hide-details :model-value="data.provider_setting.fix_duration"
                    @update:model-value="data.provider_setting.fix_duration = $event === '' || $event === null ? null : Number($event)"
                    @keydown.prevent placeholder="ไม่ตั้งค่า"></v-text-field>
                </v-col>
              </v-row>
            </v-card>

            <v-card class="pa-4 mb-4 elevation-1">
              <h6 class="mb-4">LIFF setting</h6>
              <v-row>
                <v-col cols="6"><v-text-field label="Liff Verify Slip Text" density="compact" variant="outlined"
                    hide-details v-model="data.provider_setting.liff_verify_slip_text"></v-text-field></v-col>
                <v-col cols="6"><v-select label="Liff Booking Minute" variant="outlined" density="compact" hide-details
                    :items="numberOptions" v-model="data.provider_setting.liff_booking_minute"></v-select></v-col>
              </v-row>
              <v-row no-gutters class="mt-2">
                <v-col cols="4">
                  <v-switch label="Liff Verity Slip" hide-details v-model="data.provider_setting.liff_verify_slip"
                    color="primary" :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4"><v-switch label="Liff Check QR in Slip" hide-details
                    v-model="data.provider_setting.liff_check_qr_in_slip" color="primary" :true-value="1"
                    :false-value="0"></v-switch></v-col>
                <v-col cols="4">
                  <v-switch label="QR Generate" hide-details v-model="data.provider_setting.qr_generate" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Slip Detect Bank Account" hide-details
                    v-model="data.provider_setting.slip_detect_bank_account" color="primary" :true-value="1"
                    :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Show Logo on Receipt" hide-details
                    v-model="data.provider_setting.show_logo_on_receipt" color="primary" :true-value="1"
                    :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Tax Invoice Enable" hide-details v-model="data.provider_setting.tax_invoice_enable"
                    color="primary" :true-value="1" :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Withholding Tax Enable" hide-details
                    v-model="data.provider_setting.withholding_tax_enable" color="primary" :true-value="1"
                    :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Liff Show My Booking" hide-details
                    v-model="data.provider_setting.liff_show_my_booking" color="primary" :true-value="1"
                    :false-value="0"></v-switch>
                </v-col>
              </v-row>
            </v-card>

            <v-card class="pa-4 mb-4 elevation-1">
              <h6 class="mb-4 mt-2">Setting</h6>
              <v-row class="mb-1">
                <v-col><v-select label="Allow Booking Move" variant="outlined" density="compact" hide-details
                    :items="allowBookingMoveOptions" v-model="data.provider_setting.allow_booking_move"
                    multiple></v-select></v-col>
                <v-col><v-select label="Max Booking Movements" variant="outlined" density="compact" hide-details
                    :items="numberOptions" v-model="data.provider_setting.max_booking_movements"></v-select></v-col>
              </v-row>
              <v-row no-gutters>
                <v-col cols="4">
                  <v-switch label="Half Hour Export Table" hide-details
                    v-model="data.provider_setting.half_hour_export_table" color="primary" :true-value="1"
                    :false-value="0"></v-switch>
                </v-col>

                <v-col cols="4">
                  <v-switch label="IoT Enabled" hide-details v-model="data.provider_setting.iot_enabled" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>

                <v-col cols="4">
                  <v-switch label="Booking Scope Enable" hide-details
                    v-model="data.provider_setting.booking_scope_enable" color="primary" :true-value="1"
                    :false-value="0"></v-switch>
                </v-col>
                <v-col cols="4">
                  <v-switch label="Arena Mfa" hide-details v-model="data.provider_setting.arena_mfa" color="primary"
                    :true-value="1" :false-value="0"></v-switch>
                </v-col>
              </v-row>
            </v-card>

            <v-card class="pa-4 mb-4 elevation-1">
              <h6 class="mb-2">Notification</h6>
              <v-row no-gutters>
                <v-col>
                  <v-switch label="Noti Booking Update" hide-details v-model="data.provider_setting.noti_booking_update"
                    color="primary" :true-value="1" :false-value="0"></v-switch>
                </v-col>
              </v-row>
            </v-card>
          </v-card>
        </v-window-item>

        <!-- Tab 4: Provider Conditions -->
        <v-window-item value="condition">
          <v-card class="pa-4 mb-4 elevation-0 border bg-white rounded-lg">
            <div class="d-flex align-center justify-space-between mb-4">
              <h4 class="text-subtitle-1 font-weight-bold mb-0 text-primary">เงื่อนไขการจอง (Provider Conditions)</h4>
              <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" size="small"
                @click="openAddConditionDialog">
                เพิ่มข้อมูล
              </v-btn>
            </div>

            <v-data-table :headers="conditionHeaders" :items="conditions" :loading="conditionsLoading"
              class="elevation-1 border rounded-lg" density="compact">
              <template v-slot:item.text="{ item }">
                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ item.text || '-' }}
                </div>
              </template>
              <template v-slot:item.text_en="{ item }">
                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ item.text_en || '-' }}
                </div>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" color="primary" variant="text" @click="openEditConditionDialog(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" color="error" variant="text" @click="confirmDeleteCondition(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- Tab 6: Commission Settings -->
        <v-window-item value="commission">
          <v-card class="pa-5 mb-4 elevation-0">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 text-primary">ตั้งค่าค่าธรรมเนียม (Commission Settings)
            </h3>

            <div v-if="!commissionData" class="text-center py-6">
              <p class="mb-4 text-grey">ยังไม่มีข้อมูลค่าธรรมเนียมสำหรับสนามนี้ในระบบ</p>
              <v-btn color="success" prepend-icon="mdi-plus" @click="createCommission">เพิ่มข้อมูลค่าธรรมเนียม</v-btn>
            </div>

            <v-form v-else ref="commissionForm">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field label="ค่าธรรมเนียม (Fee)" v-model.number="commissionForm.fee" type="number"
                    variant="outlined" density="compact" min="0" placeholder="ไม่มีค่าธรรมเนียม"
                    clearable></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select label="ประเภทค่าธรรมเนียม (Fee Type)" v-model="commissionForm.fee_type" :items="[
                    { title: '%', value: 'percent' },
                    { title: 'จำนวนเงิน', value: 'value' }
                  ]" item-title="title" item-value="value" variant="outlined" density="compact"></v-select>
                </v-col>

                <v-col cols="12" sm="6" class="d-flex align-center">
                  <!-- <span class="mr-3 text-subtitle-2">Vat นอก</span> -->
                  <v-switch v-model="commissionForm.is_out_vat" :true-value="1" :false-value="0" color="primary"
                    hide-details inset>
                    <template v-slot:label>
                      <span>{{ commissionForm.is_out_vat === 1 ? 'Vat นอก' : 'Vat ใน' }}</span>
                    </template>
                  </v-switch>
                </v-col>

                <v-col cols="12" sm="6" class="d-flex align-center">
                  <!-- <span class="mr-3 text-subtitle-2">ถอด Vat</span> -->
                  <v-switch v-model="commissionForm.is_extract_vat" :true-value="1" :false-value="0" color="primary"
                    hide-details inset>
                    <template v-slot:label>
                      <span>{{ commissionForm.is_extract_vat === 1 ? 'ถอด Vat' : 'ไม่ถอด Vat' }}</span>
                    </template>
                  </v-switch>
                </v-col>
              </v-row>

              <!-- Main save button at the bottom of the card will handle saving now -->
            </v-form>
          </v-card>
        </v-window-item>
      </v-window>
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions class="pa-4 bg-white">
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="save" :loading="loading" variant="elevated" class="px-6">บันทึก</v-btn>
    </v-card-actions>

    <!-- Success Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="3000" color="success" location="top" elevation="24">
      <div class="d-flex align-center">
        <v-icon icon="mdi-check-circle" class="mr-2"></v-icon>
        {{ snackbarText }}
      </div>
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">ปิด</v-btn>
      </template>
    </v-snackbar>

    <!-- Dialog for Editing Package -->
    <v-dialog v-model="editPackageDialog" max-width="500" persistent>
      <v-card class="rounded-lg" v-if="data && data.subscription">
        <v-card-title class="d-flex justify-space-between align-center pt-4 px-6 border-b pb-3">
          <span class="text-h6 font-weight-bold">Edit Package Details</span>
          <v-btn icon="mdi-close" variant="text" density="compact" @click="editPackageDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pt-6">
          <v-row dense>
            <v-col cols="12">
              <p class="text-caption text-grey-darken-1 mb-1">เลือกแพ็คเกจ</p>
              <v-select variant="outlined" density="compact" hide-details :items="providerPackages" item-title="name"
                item-value="id" v-model="data.subscription.package_id"></v-select>
            </v-col>
            <v-col cols="12" class="mt-4">
              <p class="text-caption text-grey-darken-1 mb-1">ปรับวันหมดอายุ</p>
              <vue-date-picker v-model="data.subscription.end_date" :enable-time-picker="false" :teleport="true"
                auto-apply :clearable="false" class="compact-datepicker w-100" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="editPackageDialog = false">ปิด</v-btn>
          <v-btn color="primary" variant="elevated" class="px-6" @click="editPackageDialog = false">ตกลง</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <facility-picker-dialog v-model="facilityDialogOpen" :facilities="facilityPickerOptions"
      :existing-ids="existingFacilityIds" :loading="creatingFacilities" @confirm="confirmAddFacilities" />
    <AddProviderCondition ref="addConditionDialog" :fixed-provider-id="data?.id" @refresh="fetchConditions" />

    <!-- Court Type Edit Dialog -->
    <v-dialog v-model="courtEditDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="headline">Edit Court Name</v-card-title>
        <v-card-text>
          <v-text-field v-model="courtEditForm.name" label="Court Name (TH)" variant="outlined" class="mb-3" />
          <v-text-field v-model="courtEditForm.name_en" label="Court Name (EN)" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="courtEditDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="courtSaving" @click="saveCourtType">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import ConsoleService from "../api/ConsoleService";
import localService from "../api/localService";
import ProviderConditionService from "../api/providerConditionTexts";
import ProviderTaxService from "../api/ProviderTaxService";
import FacilityPickerDialog from "./facilityPickerDialog.vue";
import AddProviderCondition from "./addProviderCondition.vue";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { formatEndDate } from "../helper/helper";
import moment from "moment";
import Swal from "sweetalert2";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issues in bundlers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default {
  components: { VueDatePicker, FacilityPickerDialog, AddProviderCondition },
  name: "providerSettingModel",
  emits: ["refresh", "close"],
  props: {
    providerData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      tab: 'profile',
      data: null,
      loading: false,
      providerPackages: [],
      provinces: [],
      districts: [],
      sub_districts: [],
      banks: [],
      snackbar: false,
      snackbarText: '',
      map: null,
      marker: null,
      originalData: null,
      editPackageDialog: false,
      mediaLoading: false,
      savingMedia: false,
      mediaImages: [],
      logos: {},
      logoTypes: [
        { key: "logo", label: "Logo" },
        { key: "logo_backup", label: "Logo Backup" },
        { key: "logo2", label: "Logo 2" },
        { key: "logo2_backup", label: "Logo 2 Backup" },
      ],
      activeLogoType: null,
      logoUploadingByType: {},
      selectedFiles: [],
      selectedFilePreviews: [],
      facilitiesLoading: false,
      creatingFacilities: false,
      facilities: [],
      facilityDialogOpen: false,
      facilityHeaders: [
        { title: "No", key: "no", sortable: false, width: "48px", align: "center" },
        { title: "Facility", key: "name", sortable: false },
        { title: "Detail", key: "detail", sortable: false },
      ],
      facilityProvidersByProviderId: {},
      detailForm: {
        fullname: "",
        fullname_en: "",
        open_provider: 1,
        hide_on_app: 0,
        hide_on_web: 0,
      },
      detailOriginal: {
        fullname: "",
        fullname_en: "",
        open_provider: 1,
        hide_on_app: 0,
        hide_on_web: 0,
      },
      detailSaving: false,
      courtEditForm: { id: null, name: "", name_en: "" },
      courtEditDialogOpen: false,
      courtSaving: false,
      conditionsLoading: false,
      conditions: [],
      conditionHeaders: [
        { title: 'Type', key: 'type', sortable: true },
        { title: 'Text (TH)', key: 'text', sortable: false },
        { title: 'Text (EN)', key: 'text_en', sortable: false },
        { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' },
      ],
      taxesLoading: false,
      taxFormData: {
        id: null,
        provider_id: null,
        tax_id: '',
        tax_name: '',
        store_name: '',
        tax_address: '',
        withholding_tax_text: '',
        free_text: ''
      },
      commissionData: null,
      savingCommission: false,
      commissionForm: {
        fee: null,
        fee_type: 'percent',
        is_out_vat: 0,
        is_extract_vat: 0
      },
    };
  },
  computed: {
    detailDirty() {
      return (
        JSON.stringify(this.getDetailComparableForButtons(this.detailForm)) !==
        JSON.stringify(this.getDetailComparableForButtons(this.detailOriginal))
      );
    },
    displayedMediaImages() {
      return this.mediaImages || [];
    },
    totalMediaCount() {
      return this.displayedMediaImages.length + this.selectedFilePreviews.length;
    },
    selectedFacilityProviders() {
      if (!this.data?.id) return [];
      return this.facilityProvidersByProviderId[this.data.id] || [];
    },
    facilityTableItems() {
      return this.selectedFacilityProviders.map((facilityProvider, index) => {
        const facility = this.facilities.find((item) => item.id === facilityProvider.facility_id) || {};
        return {
          no: index + 1,
          name: facility.name || facility.fullname || facility.title || facilityProvider.facility_id,
          detail: facilityProvider.detail || "-",
        };
      });
    },
    facilityTotal() {
      return this.facilityTableItems.length;
    },
    facilityPickerOptions() {
      return this.facilities.map((facility) => ({
        id: facility.id,
        name: facility.name || facility.fullname || facility.title || facility.id,
        provider_id: facility.provider_id,
      }));
    },
    existingFacilityIds() {
      return this.selectedFacilityProviders.map((item) => item.facility_id).filter(Boolean);
    },
    isProviderLoading() {
      return this.mediaLoading || this.facilitiesLoading;
    },
    tableReady() {
      return !this.mediaLoading && !this.facilitiesLoading;
    },
    numberOptions() {
      return Array.from({ length: 10 }, (_, i) => ({
        title: i + 1,
        value: i + 1,
      }));
    },
    durationOptions() {
      return Array.from({ length: 11 }, (_, i) => ({
        title: i * 30,
        value: i * 30,
      }));
    },
    allowBookingMoveOptions() {
      return [
        { title: "LINE", value: "line" },
        { title: "APP", value: "app" },
      ];
    },
    remainingDaysText() {
      if (!this.data || !this.data.subscription || !this.data.subscription.end_date) return '-';
      return this.calculateRemainingDays(this.data.subscription.end_date);
    },
    remainingDaysCount() {
      if (!this.data || !this.data.subscription || !this.data.subscription.end_date) return 0;
      const diff = new Date(this.data.subscription.end_date).getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    },
    startDateFormatted() {
      if (!this.data?.subscription?.created_at) return '-';
      return moment(this.data.subscription.created_at).format('DD/MM/YYYY');
    },
    startTimeFormatted() {
      if (!this.data?.subscription?.created_at) return '-';
      return moment(this.data.subscription.created_at).format('HH:mm:ss');
    },
    endDateFormatted() {
      if (!this.data?.subscription?.end_date) return '-';
      return moment(this.data.subscription.end_date).format('DD/MM/YYYY');
    },
    endTimeFormatted() {
      if (!this.data?.subscription?.end_date) return '23:59:59';
      return moment(this.data.subscription.end_date).format('HH:mm:ss');
    },
    progressPercent() {
      if (!this.data?.subscription?.created_at || !this.data?.subscription?.end_date) return 0;
      const start = new Date(this.data.subscription.created_at).getTime();
      const end = new Date(this.data.subscription.end_date).getTime();
      const now = new Date().getTime();

      const total = end - start;
      if (total <= 0) return 100;

      const elapsed = now - start;
      const percent = (elapsed / total) * 100;
      return Math.min(100, Math.max(0, percent));
    }
  },
  watch: {
    providerData: {
      immediate: true,
      handler(val) {
        if (val) {
          this.initData(val);
        }
      }
    },
    provinces: {
      handler(val) {
        if (val && val.length > 0) {
          this.initAddressData();
        }
      }
    },
    "data.subscription.package_id": {
      handler(val) {
        if (this.data && this.data.subscription && this.providerPackages.length > 0) {
          const pkg = this.providerPackages.find(p => p.id === val);
          if (pkg) {
            this.data.subscription.price = pkg.price || 0;
          }
        }
      }
    },
    tab(newTab) {
      if (newTab === 'profile' && this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 100);
      }
    }
  },
  methods: {
    createCommission() {
      this.commissionData = {
        provider_id: this.data.id,
        fee: '0',
        fee_type: 'percent',
        is_out_vat: 0,
        is_extract_vat: 0
      };
      this.commissionForm = {
        fee: 0,
        fee_type: 'percent',
        is_out_vat: 0,
        is_extract_vat: 0
      };
    },
    async saveCommission() {
      try {
        this.savingCommission = true;
        const payload = {
          provider_id: this.data.id,
          fee: this.commissionForm.fee !== null && this.commissionForm.fee !== '' ? this.commissionForm.fee : 0,
          fee_type: this.commissionForm.fee_type || 'percent',
          is_out_vat: this.commissionForm.is_out_vat ? 1 : 0,
          is_extract_vat: this.commissionForm.is_extract_vat ? 1 : 0
        };

        const res = await ConsoleService.saveProviderCommission(payload);
        if (res) {
          this.commissionData = res;
          this.snackbarText = 'บันทึกตั้งค่าค่าธรรมเนียมสำเร็จ';
          this.snackbar = true;
          this.$emit('refresh');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถบันทึกข้อมูลค่าธรรมเนียมได้'
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: err.message
        });
      } finally {
        this.savingCommission = false;
      }
    },
    normalizeAllowBookingMove(value) {
      const normalized = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(",")
          : [];

      return normalized
        .map((item) => String(item).trim().toLowerCase())
        .filter((item) => item === "line" || item === "app");
    },
    serializeAllowBookingMove(value) {
      const normalized = this.normalizeAllowBookingMove(value);
      return normalized.length ? normalized.join(",") : null;
    },
    calculateRemainingDays(date) {
      if (!date) return '-';
      const diff = new Date(date).getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      return days >= 0 ? `${days} วัน` : 'หมดอายุแล้ว';
    },
    async initData(data) {
      if (data.commission) {
        this.commissionData = { ...data.commission };
        this.commissionForm = {
          fee: data.commission.fee ? parseFloat(data.commission.fee) : null,
          fee_type: data.commission.fee_type || 'percent',
          is_out_vat: data.commission.is_out_vat || 0,
          is_extract_vat: data.commission.is_extract_vat || 0
        };
      } else {
        this.commissionData = null;
        this.commissionForm = {
          fee: null,
          fee_type: 'percent',
          is_out_vat: 0,
          is_extract_vat: 0
        };
      }

      // Initialize default structures if missing
      this.data = {
        id: data.id,
        fullname: data.fullname,
        fullname_en: data.fullname_en,
        court_types: data.court_types || [],
        provider_setting: { ...data.provider_setting },
        commission: data.commission || null,
        customer_profile: data.customer_profile || {
          venue_name: data.fullname || '',
          lat: data.lat || '',
          lng: data.lng || '',
          zone: data.location || '',
          sub_district: data.address?.sub_district || data.address?.subdistrict || '',
          district: data.address?.district?.name_th || data.address?.district || '',
          province: data.address?.province?.name_th || data.address?.province || '',
          tax_type: 'นิติบุคคล',
          operator_name: data.provider_tax_data?.tax_name || '',
          tax_id: data.provider_tax_data?.tax_id || '',
          address: data.provider_tax_data?.tax_address || data.address?.name || '',
          contact_name: data.fullname || '',
          contact_phone: data.phone_number || '',
          email: data.email || '',
          account_name: data.bank_account?.acc_name || '',
          account_number: data.bank_account?.acc_no || '',
          bank_id: data.bank_account?.bank_id || null,
          province_id: data.address?.province_id || null,
          district_id: data.address?.district_id || null,
          subdistrict_id: data.address?.subdistrict_id || null,
        },
        subscription: {
          package_id: data.pos_subscription?.package?.id || null,
          end_date: data.pos_subscription?.end_date ? new Date(data.pos_subscription.end_date) : null,
          created_at: data.pos_subscription?.created_at || null,
          name: data.pos_subscription?.package?.name || '',
          price: data.pos_subscription?.package?.price || '',
          logs: (data.packages || []).map(p => ({
            expire_date: p.expire_date ? String(p.expire_date).substring(0, 10) : '',
            remaining_days: this.calculateRemainingDays(p.expire_date),
            package_name: p.package?.name || '',
            price: p.package?.price || '-',
            status: 'success'
          }))
        }
      };

      this.data.provider_setting.allow_booking_move =
        this.normalizeAllowBookingMove(this.data.provider_setting.allow_booking_move);

      // Save original data for change detection
      this.originalData = JSON.parse(JSON.stringify(this.data));

      this.initAddressData();

      this.tab = 'profile'; // Reset tab to first one on open

      // Init map after DOM update
      this.$nextTick(() => {
        if (!this.map) {
          this.initMap();
        } else {
          this.syncMapToData();
        }
      });

      // Fetch media and logos
      this.fetchProviderMedia(this.data.id);

      // Fetch provider conditions
      this.fetchConditions();

      // Fetch provider taxes
      await this.fetchTaxes();
      this.originalData.taxFormData = JSON.parse(JSON.stringify(this.taxFormData));


    },
    initMap() {
      const lat = parseFloat(this.data.customer_profile.lat) || 13.7563; // Default to Bangkok
      const lng = parseFloat(this.data.customer_profile.lng) || 100.5018;

      this.map = L.map('map-selector', {
        scrollWheelZoom: false
      }).setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

      this.marker.on('dragend', () => {
        const pos = this.marker.getLatLng();
        this.data.customer_profile.lat = pos.lat.toFixed(6);
        this.data.customer_profile.lng = pos.lng.toFixed(6);
      });

      this.map.on('click', (e) => {
        this.marker.setLatLng(e.latlng);
        this.data.customer_profile.lat = e.latlng.lat.toFixed(6);
        this.data.customer_profile.lng = e.latlng.lng.toFixed(6);
      });
    },
    syncMapToData() {
      if (!this.map || !this.marker) return;
      const lat = parseFloat(this.data.customer_profile.lat);
      const lng = parseFloat(this.data.customer_profile.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const latlng = L.latLng(lat, lng);
        this.marker.setLatLng(latlng);
        this.map.panTo(latlng);
      }
    },
    onCoordsChange() {
      this.syncMapToData();
    },
    async initAddressData() {
      if (!this.data || !this.data.customer_profile) return;

      const profile = this.data.customer_profile;
      if (profile.province && this.provinces.length > 0) {
        const matchedProv = this.provinces.find(p => p.name_th === profile.province);
        if (matchedProv) {
          profile.province_id = matchedProv.id;
          this.districts = await ConsoleService.getDistricts(matchedProv.id);
          if (profile.district && this.districts.length > 0) {
            const matchedDist = this.districts.find(d => d.name_th === profile.district);
            if (matchedDist) {
              profile.district_id = matchedDist.id;
              this.sub_districts = await ConsoleService.getSubDistricts(matchedDist.id);
              if (profile.sub_district && this.sub_districts.length > 0) {
                const matchedSub = this.sub_districts.find(s => s.name_th === profile.sub_district);
                if (matchedSub) {
                  profile.subdistrict_id = matchedSub.id;
                }
              }
            }
          }
        }
      }
    },
    async onProvinceChange(val) {
      if (!this.data) return;
      this.data.customer_profile.district = '';
      this.data.customer_profile.sub_district = '';
      this.data.customer_profile.province_id = null;
      this.data.customer_profile.district_id = null;
      this.data.customer_profile.subdistrict_id = null;
      this.districts = [];
      this.sub_districts = [];
      if (val) {
        const matched = this.provinces.find(p => p.name_th === val);
        if (matched) {
          this.data.customer_profile.province_id = matched.id;
          this.districts = await ConsoleService.getDistricts(matched.id);
        }
      }
    },
    async onDistrictChange(val) {
      if (!this.data) return;
      this.data.customer_profile.sub_district = '';
      this.data.customer_profile.district_id = null;
      this.data.customer_profile.subdistrict_id = null;
      this.sub_districts = [];
      if (val) {
        const matched = this.districts.find(d => d.name_th === val);
        if (matched) {
          this.data.customer_profile.district_id = matched.id;
          this.sub_districts = await ConsoleService.getSubDistricts(matched.id);
        }
      }
    },
    async onSubDistrictChange(val) {
      if (!this.data) return;
      this.data.customer_profile.subdistrict_id = null;
      if (val) {
        const matched = this.sub_districts.find(s => s.name_th === val);
        if (matched) {
          this.data.customer_profile.subdistrict_id = matched.id;
        }
      }
    },
    // Media and Logo methods
    async fetchProviderMedia(providerId) {
      if (!providerId) return;
      this.mediaLoading = true;
      const res = await localService.getProviderMedia(providerId);
      this.mediaLoading = false;

      if (res && res.success) {
        const rawImages = res.data?.photos || res.data?.images || res.data?.media || res.data?.image_urls || [];
        const normalized = Array.isArray(rawImages)
          ? rawImages
            .map((item) => {
              if (typeof item === "string") return item;
              return item?.image || item?.image_prod || item?.url || item?.image_url || item?.path || null;
            })
            .filter(Boolean)
          : [];
        this.mediaImages = normalized;
        const rawLogos = res.data?.logos || {};
        this.logos = rawLogos && typeof rawLogos === "object" ? rawLogos : {};

        const rawFacilities = res.data?.facility_providers || [];
        this.facilityProvidersByProviderId = {
          ...this.facilityProvidersByProviderId,
          [providerId]: Array.isArray(rawFacilities) ? rawFacilities : [],
        };

        const rawDetail =
          res.data?.provider ||
          res.data?.provider_detail ||
          res.data?.provider_data ||
          res.data?.provider_info ||
          res.data?.detail ||
          null;
        const detailSource = rawDetail || res.data || {};
        const nextDetail = {
          fullname: detailSource.fullname || this.data?.fullname || "",
          fullname_en: detailSource.fullname_en || this.data?.fullname_en || "",
          open_provider: (detailSource.open_provider ?? detailSource.available ?? detailSource.avaliable) === 0 ? 0 : 1,
          hide_on_app: (detailSource.hide_on_app ?? detailSource.hidden_app) === 1 ? 1 : 0,
          hide_on_web: (detailSource.hide_on_web ?? detailSource.hidden_page) === 1 ? 1 : 0,
        };
        this.detailForm = { ...nextDetail };
        this.detailOriginal = { ...nextDetail };
      } else {
        this.mediaImages = [];
        this.logos = {};
      }
    },
    async fetchFacilities() {
      this.facilitiesLoading = true;
      try {
        const response = await localService.getProviderFacilities();
        const rawData = response.data?.data || response.data || [];
        this.facilities = Array.isArray(rawData) ? rawData : [];
      } catch (error) {
        console.error("Failed to load facilities", error);
      } finally {
        this.facilitiesLoading = false;
      }
    },
    async fetchConditions() {
      if (!this.data?.id) return;
      this.conditionsLoading = true;
      try {
        const res = await ProviderConditionService.getProviderConditions({ provider_id: this.data.id });
        if (!res.error) {
          this.conditions = res || [];
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.conditionsLoading = false;
      }
    },
    async fetchTaxes() {
      if (!this.data?.id) return;
      this.taxesLoading = true;
      try {
        const res = await ProviderTaxService.getProvidersTax(this.data.id);
        const taxesData = res && res.data ? res.data : (Array.isArray(res) ? res : []);
        if (taxesData.length > 0) {
          const item = taxesData[0];
          this.taxFormData = {
            id: item.id,
            provider_id: item.provider_id,
            tax_id: item.tax_id || '',
            tax_name: item.tax_name || '',
            store_name: item.store_name || '',
            tax_address: item.tax_address || '',
            withholding_tax_text: item.withholding_tax_text || '',
            free_text: item.free_text || ''
          };
        } else {
          this.taxFormData = {
            id: null,
            provider_id: this.data.id,
            tax_id: '',
            tax_name: '',
            store_name: '',
            tax_address: '',
            withholding_tax_text: '',
            free_text: ''
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.taxesLoading = false;
      }
    },
    openAddConditionDialog() {
      if (!this.data?.id) return;
      if (this.$refs.addConditionDialog) {
        this.$refs.addConditionDialog.open();
      }
    },
    openEditConditionDialog(item) {
      if (!this.data?.id) return;
      if (this.$refs.addConditionDialog) {
        this.$refs.addConditionDialog.open(item);
      }
    },
    async confirmDeleteCondition(item) {
      const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `ต้องการลบข้อมูลเงื่อนไขรายการนี้หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#d60326',
        cancelButtonColor: '#9e9e9e',
      });

      if (result.isConfirmed) {
        await this.deleteConditionItem(item.id);
      }
    },
    async deleteConditionItem(id) {
      const res = await ProviderConditionService.deleteProviderCondition(id);
      if (!res.error) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'ลบสำเร็จ',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        this.fetchConditions();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ลบไม่สำเร็จ',
          text: res.message || "Unable to delete.",
          confirmButtonText: 'OK',
        });
      }
    },
    openFacilityDialog() {
      if (!this.data?.id || this.loading || this.isProviderLoading) return;
      this.facilityDialogOpen = true;
    },
    confirmAddFacilities(selectedIds) {
      if (!this.data?.id) return;
      this.createFacilities(this.data.id, selectedIds);
    },
    async createFacilities(providerId, facilityIds) {
      if (!providerId || !facilityIds || facilityIds.length === 0) return;
      this.creatingFacilities = true;
      let hadError = false;

      for (const facilityId of facilityIds) {
        const res = await localService.createFacilityProviders({
          provider_id: providerId,
          facility_id: facilityId,
          detail: "",
        });
        if (!res || res.success === false) {
          hadError = true;
          break;
        }
      }

      this.creatingFacilities = false;
      this.facilityDialogOpen = false;

      if (!hadError) {
        Swal.fire({
          title: "Created",
          text: "Facilities have been mapped.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderMedia(providerId);
      } else {
        Swal.fire({
          title: "Failed",
          text: "Unable to map some facilities.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    async saveDetailForm(fields) {
      if (!this.data?.id) return;
      this.detailSaving = true;

      const apiPayload = {
        hidden_app: this.detailForm.hide_on_app,
        hidden_page: this.detailForm.hide_on_web === null ? null : this.detailForm.hide_on_web === 1,
        available: this.detailForm.open_provider === null ? null : this.detailForm.open_provider === 1,
        fullname: this.detailForm.fullname,
        fullname_en: this.detailForm.fullname_en,
        location: this.data.customer_profile.zone,
        lat: this.data.customer_profile.lat,
        lng: this.data.customer_profile.lng,
      };

      const res = await ConsoleService.updateProviderSetting({
        provider_id: this.data.id,
        data: apiPayload,
      });

      this.detailSaving = false;

      if (res && res.success !== false) {
        const isAutoSwitchUpdate =
          Array.isArray(fields) &&
          fields.every((field) => ["open_provider", "hide_on_app", "hide_on_web"].includes(field));

        if (isAutoSwitchUpdate) {
          Swal.fire({
            title: "Updated",
            icon: "success",
            toast: true,
            position: "top-end",
            timer: 1400,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            title: "Success",
            text: "Provider details updated.",
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
        }
        this.detailOriginal = { ...this.detailForm };
        // Sync local data name properties
        this.data.fullname = this.detailForm.fullname;
        this.data.fullname_en = this.detailForm.fullname_en;
        this.$emit("refresh");
      } else {
        Swal.fire({
          title: "Failed",
          text: "Unable to update provider details.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    onSwitchChanged() {
      this.saveDetailForm(["open_provider", "hide_on_app", "hide_on_web"]);
    },
    resetDetailForm() {
      this.detailForm = { ...this.detailOriginal };
    },
    openEditCourtDialog(courtType) {
      this.courtEditForm = {
        id: courtType.id,
        name: courtType.name || "",
        name_en: courtType.name_en || "",
      };
      this.courtEditDialogOpen = true;
    },
    async saveCourtType() {
      if (!this.courtEditForm.id) return;
      this.courtSaving = true;
      const res = await ConsoleService.updateCourtType(this.courtEditForm.id, {
        name: this.courtEditForm.name,
        name_en: this.courtEditForm.name_en,
      });
      this.courtSaving = false;
      if (res) {
        Swal.fire({
          title: "Success",
          text: "Court name updated.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });

        // Update local state directly so UI updates without reloading
        if (this.data && Array.isArray(this.data.court_types)) {
          const index = this.data.court_types.findIndex((c) => c.id === this.courtEditForm.id);
          if (index !== -1) {
            this.data.court_types[index].name = this.courtEditForm.name;
            this.data.court_types[index].name_en = this.courtEditForm.name_en;
          }
        }
        this.$emit("refresh");
        this.courtEditDialogOpen = false;
      } else {
        Swal.fire({
          title: "Failed",
          text: "Unable to update court name.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    getDetailComparableForButtons(source) {
      return {
        fullname: this.normalizeText(source.fullname),
        fullname_en: this.normalizeText(source.fullname_en),
      };
    },
    normalizeText(value) {
      if (value === null || value === undefined) return null;
      const trimmed = String(value).trim();
      return trimmed === "" ? null : trimmed;
    },
    triggerFileSelect() {
      if (this.loading || this.mediaLoading || this.savingMedia) return;
      this.$refs.fileInput?.click();
    },
    onFilesSelected(event) {
      const files = Array.from(event?.target?.files || []);
      const validTypes = ["image/jpeg", "image/png"];
      const validFiles = files.filter((file) => validTypes.includes(file.type));

      if (validFiles.length === 0) {
        Swal.fire({
          title: "Invalid Files",
          text: "Please select JPG or PNG images.",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
        if (event?.target) event.target.value = "";
        return;
      }

      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      this.selectedFilePreviews = [
        ...this.selectedFilePreviews,
        ...validFiles.map((file) => URL.createObjectURL(file)),
      ];

      if (event?.target) {
        event.target.value = "";
      }

      this.scrollMediaRowToEnd();
    },
    async uploadSelectedImages() {
      if (!this.data?.id || this.selectedFiles.length === 0) return;

      Swal.fire({
        title: "Uploading Images...",
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.savingMedia = true;
      let hadError = false;

      for (const file of this.selectedFiles) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await localService.uploadProviderMedia(this.data.id, formData);
        if (!res || !res.success) {
          hadError = true;
          break;
        }
      }

      this.savingMedia = false;

      if (!hadError) {
        Swal.close();
        await Swal.fire({
          title: "Success",
          text: "Provider media saved.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderMedia(this.data.id);
        this.clearSelectedFiles();
      } else {
        Swal.close();
        Swal.fire({
          title: "Failed",
          text: "Unable to upload one or more images.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    getLogoUrl(type) {
      return this.logos?.[type] || "";
    },
    triggerLogoFileSelect(type) {
      if (!this.data?.id || this.loading || this.mediaLoading || this.savingMedia) return;
      if (this.logoUploadingByType?.[type]) return;
      this.activeLogoType = type;
      this.$refs.logoFileInput?.click();
    },
    async onLogoFileSelected(event) {
      const file = event?.target?.files?.[0];
      const logoType = this.activeLogoType;
      if (!file || !logoType) {
        if (event?.target) event.target.value = "";
        return;
      }

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          title: "Invalid File",
          text: "Please select a JPG, PNG, or WEBP image.",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
        if (event?.target) event.target.value = "";
        return;
      }

      if (event?.target) event.target.value = "";

      const previewUrl = URL.createObjectURL(file);
      const result = await Swal.fire({
        title: "Confirm Upload",
        text: `Replace ${logoType.replace("_", " ")} ?`,
        imageUrl: previewUrl,
        imageAlt: "Logo preview",
        imageWidth: 220,
        showCancelButton: true,
        confirmButtonText: "Upload",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d60326",
      });
      URL.revokeObjectURL(previewUrl);

      if (result.isConfirmed) {
        await this.uploadLogo(logoType, file);
      }
    },
    async uploadLogo(logoType, file) {
      if (!this.data?.id) return;

      this.logoUploadingByType = { ...this.logoUploadingByType, [logoType]: true };
      Swal.fire({
        title: "Uploading Logo...",
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();
      formData.append("logo_type", logoType);

      // Auto resize logo logic
      const resizedFile = await this.resizeLogoFile(file);
      formData.append("file", resizedFile || file);

      const res = await localService.uploadProviderLogo(this.data.id, formData);
      this.logoUploadingByType = { ...this.logoUploadingByType, [logoType]: false };

      if (res && res.success) {
        Swal.close();
        await Swal.fire({
          title: "Success",
          text: "Logo updated.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderMedia(this.data.id);
      } else {
        Swal.close();
        Swal.fire({
          title: "Failed",
          text: (res && res.message) || "Unable to update logo.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    async resizeLogoFile(file) {
      const maxSize = 512;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = dataUrl;
        });

        const { width, height } = img;
        if (Math.max(width, height) <= maxSize) {
          return file;
        }

        const scale = maxSize / Math.max(width, height);
        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const quality = outputType === "image/jpeg" ? 0.85 : undefined;

        const blob = await new Promise((resolve) => {
          canvas.toBlob(
            (b) => resolve(b),
            outputType,
            quality
          );
        });

        if (!blob) return file;
        const ext = outputType === "image/png" ? "png" : "jpg";
        const baseName = file.name?.replace(/\.[^/.]+$/, "") || "logo";
        return new File([blob], `${baseName}.${ext}`, { type: outputType });
      } catch (e) {
        console.log("resizeLogoFile failed", e);
        return file;
      }
    },
    clearSelectedFiles() {
      this.selectedFilePreviews.forEach((url) => URL.revokeObjectURL(url));
      this.selectedFiles = [];
      this.selectedFilePreviews = [];
    },
    removeSelectedPreview(index) {
      const previewUrl = this.selectedFilePreviews[index];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      this.selectedFilePreviews.splice(index, 1);
      this.selectedFiles.splice(index, 1);
    },
    scrollMediaRowToEnd() {
      this.$nextTick(() => {
        const row = this.$refs.mediaRow;
        if (row && row.scrollWidth) {
          row.scrollLeft = row.scrollWidth;
        }
      });
    },
    getChanges() {
      if (!this.data || !this.originalData) return [];

      const labels = {
        'venue_name': 'ชื่อสนาม',
        'lat': 'ละติจูด',
        'lng': 'ลองจิจูด',
        'zone': 'ย่าน',
        'province': 'จังหวัด',
        'district': 'เขต/อำเภอ',
        'sub_district': 'ตำบล',
        'tax_type': 'ประเภทภาษี',
        'operator_name': 'ชื่อผู้ประกอบการ',
        'tax_id': 'เลขประจำตัว 13 หลัก',
        'address': 'ที่อยู่ผู้ประกอบการ',
        'contact_name': 'ชื่อผู้ติดต่อ',
        'contact_phone': 'เบอร์โทรติดต่อ',
        'email': 'อีเมล',
        'account_name': 'ชื่อบัญชีธนาคาร',
        'account_number': 'เลขที่บัญชีธนาคาร',
        'bank_id': 'ธนาคาร'
      };

      const changes = [];

      // Check customer_profile changes
      for (const key in labels) {
        if (this.data.customer_profile[key] !== this.originalData.customer_profile[key]) {
          changes.push(labels[key]);
        }
      }

      // Check provider_setting changes
      const settingLabels = {
        'book_scope_enable': 'จองข้ามวัน',
        'show_court_type': 'รูปแบบสนาม',
        'show_logo_on_receipt': 'โลโก้ในใบเสร็จ',
        'show_court': 'แสดงเลขสนาม',
        'tax_invoice_enable': 'ใบกำกับภาษี',
        'withholding_tax_enable': 'ภาษีหัก ณ ที่จ่าย',
        'noti_booking_update': 'แจ้งเตือนการจอง',
        'iot_enabled': 'ระบบ IoT'
      };

      for (const key in settingLabels) {
        if (this.data.provider_setting[key] !== this.originalData.provider_setting[key]) {
          changes.push(settingLabels[key]);
        }
      }
      const normalizeSettingValue = (value) => {
        if (Array.isArray(value) || (value && typeof value === "object")) {
          try {
            return JSON.stringify(value);
          } catch (e) {
            return String(value);
          }
        }
        return value;
      };
      const allProviderSettingKeys = new Set([
        ...Object.keys(this.data.provider_setting || {}),
        ...Object.keys(this.originalData.provider_setting || {}),
      ]);
      for (const key of allProviderSettingKeys) {
        if (key in settingLabels) continue;
        if (
          normalizeSettingValue(this.data.provider_setting[key]) !==
          normalizeSettingValue(this.originalData.provider_setting[key])
        ) {
          changes.push(key);
        }
      }

      // Check subscription changes
      if (this.data.subscription.package_id !== this.originalData.subscription.package_id) {
        changes.push('แพ็กเกจ');
      }
      const s1 = this.data.subscription.end_date ? new Date(this.data.subscription.end_date).getTime() : null;
      const s2 = this.originalData.subscription.end_date ? new Date(this.originalData.subscription.end_date).getTime() : null;
      if (s1 !== s2) {
        changes.push('วันสิ้นสุดแพ็กเกจ');
      }

      // Check tax config changes
      if (this.originalData.taxFormData) {
        const taxLabels = {
          'tax_id': 'เลขประจำตัวผู้เสียภาษี',
          'tax_name': 'ชื่อบริษัท',
          'store_name': 'ชื่อร้านค้า',
          'tax_address': 'ที่อยู่ผู้เสียภาษี',
          'withholding_tax_text': 'ข้อความหัก ณ ที่จ่าย',
          'free_text': 'หมายเหตุ'
        };
        for (const key in taxLabels) {
          if (this.taxFormData[key] !== this.originalData.taxFormData[key]) {
            changes.push(taxLabels[key] + " (ข้อมูลภาษี)");
          }
        }
      }

      // Check commission config changes
      if (this.commissionForm) {
        const originalFee = this.originalData && this.originalData.commission ? parseFloat(this.originalData.commission.fee) : null;
        const originalFeeType = this.originalData && this.originalData.commission ? this.originalData.commission.fee_type : null;
        const originalIsOutVat = this.originalData && this.originalData.commission ? this.originalData.commission.is_out_vat : null;
        const originalIsExtractVat = this.originalData && this.originalData.commission ? this.originalData.commission.is_extract_vat : null;

        const newFee = this.commissionForm.fee;
        const newFeeType = this.commissionForm.fee_type;
        const newIsOutVat = this.commissionForm.is_out_vat;
        const newIsExtractVat = this.commissionForm.is_extract_vat;

        // Only compare if user has initialized the form (commissionData is not null)
        if (this.commissionData) {
          if (originalFee !== newFee) {
            changes.push(`ค่าธรรมเนียม (${originalFee !== null ? originalFee : 'ไม่มี'} -> ${newFee !== null ? newFee : 'ไม่มี'})`);
          }
          if (originalFeeType !== newFeeType) {
            changes.push(`ประเภทค่าธรรมเนียม (${originalFeeType || 'percent'} -> ${newFeeType})`);
          }
          if (originalIsOutVat !== newIsOutVat) {
            changes.push(`Vat นอก/ใน (${originalIsOutVat === 1 ? 'Vat นอก' : 'Vat ใน'} -> ${newIsOutVat === 1 ? 'Vat นอก' : 'Vat ใน'})`);
          }
          if (originalIsExtractVat !== newIsExtractVat) {
            changes.push(`ถอด Vat (${originalIsExtractVat === 1 ? 'ถอด' : 'ไม่ถอด'} -> ${newIsExtractVat === 1 ? 'ถอด Vat' : 'ไม่ถอด Vat'})`);
          }
        }
      }

      return changes;
    },
    async save() {
      const changes = this.getChanges();

      if (changes.length === 0) {
        Swal.fire({
          title: 'ไม่มีการเปลี่ยนแปลง',
          icon: 'info',
          confirmButtonText: 'ตกลง'
        });
        return;
      }

      const result = await Swal.fire({
        title: 'ยืนยันการบันทึก',
        html: `คุณได้แก้ไขข้อมูลดังนี้:<br><br><ul style="text-align: left; padding-left: 50px;">${changes.map(c => `<li>${c}</li>`).join('')}</ul><br>ต้องการบันทึกข้อมูลใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, บันทึกเลย',
        cancelButtonText: 'ยกเลิก'
      });

      if (!result.isConfirmed) return;

      this.loading = true;

      const allowBookingMovePayload = this.serializeAllowBookingMove(
        this.data.provider_setting.allow_booking_move
      );

      // Update provider settings (as originally implemented)
      const res = await ConsoleService.updateProviderSetting({
        provider_id: this.data.id,
        data: {
          ...this.data.provider_setting,
          allow_booking_move: allowBookingMovePayload,
          bank_id: this.data.customer_profile.bank_id,
          acc_no: this.data.customer_profile.account_number,
          acc_name: this.data.customer_profile.account_name,
          fullname: this.data.customer_profile.venue_name,
          lat: this.data.customer_profile.lat,
          lng: this.data.customer_profile.lng,
          location: this.data.customer_profile.zone,
          phone_number: this.data.customer_profile.contact_phone,
          email: this.data.customer_profile.email,
          province: this.data.customer_profile.province,
          district: this.data.customer_profile.district,
          subdistrict: this.data.customer_profile.sub_district,
          province_id: this.data.customer_profile.province_id,
          district_id: this.data.customer_profile.district_id,
          subdistrict_id: this.data.customer_profile.subdistrict_id,
          tax_name: this.data.customer_profile.operator_name,
          tax_id: this.data.customer_profile.tax_id,
          tax_address: this.data.customer_profile.address,
        },
      });

      // Update provider subscription
      if (this.data.subscription.package_id && this.data.subscription.end_date) {
        const formattedEndDate = formatEndDate(this.data.subscription.end_date);
        await ConsoleService.updateProviderPackage({
          provider_id: this.data.id,
          package_id: this.data.subscription.package_id,
          end_date: formattedEndDate
        });
      }

      // Update Provider Tax
      if (this.taxFormData) {
        const taxPayload = {
          provider_id: this.taxFormData.provider_id || this.data.id,
          store_name: this.taxFormData.store_name,
          tax_id: this.taxFormData.tax_id,
          tax_name: this.taxFormData.tax_name,
          tax_address: this.taxFormData.tax_address,
          free_text: this.taxFormData.free_text,
          withholding_tax_text: this.taxFormData.withholding_tax_text
        };
        if (this.taxFormData.id) {
          await ProviderTaxService.updateProviderTax(this.taxFormData.id, taxPayload);
        } else if (taxPayload.tax_name || taxPayload.tax_id) {
          await ProviderTaxService.createProviderTax(taxPayload);
        }
      }

      // Update Provider Commission (if form is initialized)
      if (this.commissionData) {
        const payload = {
          provider_id: this.data.id,
          fee: this.commissionForm.fee !== null && this.commissionForm.fee !== '' ? this.commissionForm.fee : 0,
          fee_type: this.commissionForm.fee_type || 'percent',
          is_out_vat: this.commissionForm.is_out_vat ? 1 : 0,
          is_extract_vat: this.commissionForm.is_extract_vat ? 1 : 0
        };
        const commRes = await ConsoleService.saveProviderCommission(payload);
        if (commRes) {
          this.commissionData = commRes;
          this.data.commission = commRes;
        }
      }

      this.originalData = JSON.parse(JSON.stringify(this.data));
      this.originalData.taxFormData = JSON.parse(JSON.stringify(this.taxFormData));
      this.loading = false;
      this.snackbarText = 'บันทึกข้อมูลเรียบร้อยแล้ว';
      this.snackbar = true;
      this.$emit("refresh");
      await this.fetchTaxes();
    },
  },
  async mounted() {
    this.providerPackages = await ConsoleService.getPackages();
    this.provinces = await ConsoleService.getProvinces();
    this.banks = await ConsoleService.getBanks();
    this.fetchFacilities();
  },
  beforeUnmount() {
    if (this.clearSelectedFiles) {
      this.clearSelectedFiles();
    }
  }
};
</script>

<style scoped>
/* Custom styling for sleek UI tabs */
:deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.2px;
}
</style>
<style scoped>
.subscription-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
}

.line-height-1 {
  line-height: 1;
}

.subscription-progress :deep(.v-progress-linear__determinate) {
  background: linear-gradient(90deg, #1de9b6 0%, #00bfa5 100%) !important;
}

.subscription-progress :deep(.v-progress-linear__background) {
  background: #f5f5f5 !important;
  opacity: 1 !important;
}

.compact-datepicker :deep(.dp__input) {
  height: 40px;
  border-radius: 4px;
}

.logo-section {
  margin-bottom: 24px;
}

.logo-header {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.logo-grid {
  margin: 0;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: nowrap;
}

.logo-card {
  width: 160px;
  max-width: 160px;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  background: #ffffff;
}

.logo-card:hover {
  border-color: #d60326;
  box-shadow: 0 4px 12px rgba(214, 3, 38, 0.08);
  transform: translateY(-2px);
}

.logo-card--empty {
  background: #f9fafb;
}

.logo-thumb {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #f0f0f0;
}

.logo-placeholder {
  height: 80px;
  width: 80px;
  margin: 0 auto;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6b7280;
  border: 1px dashed #cbd5e1;
}

.logo-placeholder-text {
  font-size: 10px;
}

.logo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-label {
  font-size: 11px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  width: 100%;
}

.hidden-file-input {
  display: none;
}

.media-row {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0 8px;
  scrollbar-width: thin;
  scrollbar-color: #d60326 rgba(214, 3, 38, 0.12);
}

.media-row::-webkit-scrollbar {
  height: 6px;
}

.media-row::-webkit-scrollbar-track {
  background: rgba(214, 3, 38, 0.12);
  border-radius: 999px;
}

.media-row::-webkit-scrollbar-thumb {
  background: #d60326;
  border-radius: 999px;
}

.media-item {
  position: relative;
  flex: 0 0 auto;
}

.media-thumb {
  border-radius: 12px;
}

.media-thumb--pending {
  border-color: #d60326;
}

.media-remove {
  z-index: 2;
  background-color: white !important;
}

.upload-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
}

.detail-row--switch {
  display: inline-flex;
  width: auto;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-switch {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0 16px 0 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  min-height: 56px;
  background: white;
}

.detail-switch__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  width: 140px;
  padding-left: 16px;
}

.facility-table :deep(th) {
  font-weight: 600 !important;
  color: #374151 !important;
  background-color: #f9fafb !important;
}

.court-type-section {
  margin-top: 16px;
  margin-bottom: 24px;
}

.court-type-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.court-type-card:hover {
  border-color: #d60326;
  box-shadow: 0 4px 12px rgba(214, 3, 38, 0.08);
  transform: translateY(-2px);
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
