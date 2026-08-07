<template>
  <v-card>
    <v-card-title>Provider Media</v-card-title>
    <v-card-text>
      <v-row class="my-2" align="center">
        <v-col cols="12" md="6">
          <div class="provider-actions">
            <v-autocomplete v-model="selectedProviderId" :items="providers" item-title="fullname" item-value="id"
              label="Search Provider" variant="solo" :loading="loading" :disabled="loading" hide-details clearable />
            <v-btn v-if="selectedProviderId" color="blue" variant="outlined" :disabled="loading"
              @click="refreshProviders" class="provider-refresh">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>

          </div>

        </v-col>
      </v-row>
      <v-row v-if="selectedProviderId && isProviderLoading" class="my-2" align="center" justify="center">
        <v-col cols="12" class="d-flex justify-center">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
      </v-row>
      <v-row v-else-if="selectedProviderId" class="my-2" align="center">
        <v-col cols="12">
          <div class="logo-section">
            <div class="logo-header">
              <div class="section-title">Logos</div>
              <div class="logo-hint">Click a logo to change or upload.</div>
            </div>
            <v-row class="logo-grid" dense no-gutters>
              <v-col v-for="logoType in logoTypes" :key="logoType.key" cols="auto">
                <div class="logo-card" :class="{ 'logo-card--empty': !getLogoUrl(logoType.key) }"
                  @click="triggerLogoFileSelect(logoType.key)">
                  <v-img v-if="getLogoUrl(logoType.key)" :src="getLogoUrl(logoType.key)" aspect-ratio="1" contain
                    height="100" class="logo-thumb" />
                  <div v-else class="logo-placeholder">
                    <v-icon size="28">mdi-image-outline</v-icon>
                    <div class="logo-placeholder-text">No image</div>
                  </div>
                  <div class="logo-footer">
                    <div class="logo-label">{{ logoType.label }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
            <input ref="logoFileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden-file-input"
              @change="onLogoFileSelected" />
          </div>
          <div class="liff-media-section">
            <div class="logo-header">
              <div class="section-title">LIFF Media</div>
              <div class="logo-hint">Upload the LIFF logo and background images.</div>
            </div>
            <v-row class="liff-media-grid" dense no-gutters>
              <v-col v-for="mediaType in liffMediaTypes" :key="mediaType.key" cols="auto">
                <div class="liff-media-card" :class="[
                  `liff-media-card--${mediaType.key}`,
                  { 'logo-card--empty': !getLiffMediaUrl(mediaType.key) },
                ]"
                  @click="triggerLiffMediaFileSelect(mediaType.key)">
                  <v-img v-if="getLiffMediaUrl(mediaType.key)" :src="getLiffMediaUrl(mediaType.key)"
                    :aspect-ratio="mediaType.aspectRatio" cover class="liff-media-thumb"
                    :class="`liff-media-thumb--${mediaType.key}`" />
                  <div v-else class="liff-media-placeholder" :class="`liff-media-placeholder--${mediaType.key}`">
                    <v-icon size="28">mdi-image-outline</v-icon>
                    <div class="logo-placeholder-text">No image</div>
                  </div>
                  <div class="logo-footer">
                    <div class="logo-label">{{ mediaType.label }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
            <input ref="liffMediaFileInput" type="file" accept="image/jpeg,image/png,image/webp"
              class="hidden-file-input" @change="onLiffMediaFileSelected" />
          </div>
          <div class="media-section">
            <div class="media-actions">
              <div class="section-title">
                Media <span class="section-total">({{ totalMediaCount }})</span>
              </div>
              <div class="media-left">
                <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus"
                  :disabled="loading || mediaLoading || saving" @click="triggerFileSelect">
                  Add Images
                </v-btn>
                <v-btn v-if="selectedFilePreviews.length > 0" color="primary" prepend-icon="mdi-upload"
                  :disabled="loading || mediaLoading || saving || selectedFiles.length === 0"
                  @click="uploadSelectedImages">
                  Upload Images
                  <span class="upload-count">{{ selectedFiles.length }}</span>
                </v-btn>
              </div>
            </div>
            <div v-if="displayedMediaImages.length > 0 || selectedFilePreviews.length > 0" class="media-row"
              ref="mediaRow">
              <div v-for="(url, index) in displayedMediaImages" :key="`media-${index}`" class="media-item">
                <v-img :src="url" aspect-ratio="1" contain class="media-thumb" />
              </div>
              <div v-for="(url, index) in selectedFilePreviews" :key="`preview-${index}`" class="media-item">
                <div class="media-preview">
                  <v-img :src="url" aspect-ratio="1" contain class="media-thumb media-thumb--pending" />
                  <v-btn icon="mdi-close" size="x-small" variant="tonal" class="media-remove"
                    @click="removeSelectedPreview(index)" />
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey-darken-1 py-6">No images yet.</div>
          </div>
          <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png" class="hidden-file-input"
            @change="onFilesSelected" />
        </v-col>
      </v-row>
      <!-- Court Type Section -->
      <v-row v-if="selectedProviderId && tableReady" class="court-type-section" align="center">
        <v-col cols="12" class="court-type-header d-flex align-center justify-space-between">
          <div class="section-title">
            Court Type <span class="section-total">({{ selectedProvider?.court_types?.length || 0 }})</span>
          </div>
        </v-col>
        <v-col cols="12">
          <v-row dense>
            <v-col v-for="courtType in selectedProvider?.court_types || []" :key="courtType.id" cols="12" sm="6" md="4">
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
            <v-col v-if="!selectedProvider?.court_types?.length" cols="12">
              <div class="text-center text-grey-darken-1 py-4 bg-grey-lighten-4 rounded-lg border-dashed border">No
                court types defined for this venue.</div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Court Section -->
      <v-row v-if="selectedProviderId && tableReady" class="court-section mb-6" align="center">
        <v-col cols="12" class="court-header d-flex align-center justify-space-between mb-2">
          <div class="section-title">
            Court <span class="section-total">({{ totalCourtsCount }})</span>
          </div>
          <!-- <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-plus"
            :disabled="!selectedProvider?.court_types?.length"
            @click="openAddSingleCourtDialog"
          >
            เพิ่มข้อมูล
          </v-btn> -->
        </v-col>
        <v-col cols="12">
          <v-row dense>
            <v-col v-for="court in allCourts" :key="court.id" cols="12" sm="6" md="4">
              <v-card variant="outlined" class="court-card mb-2">
                <v-card-text class="d-flex align-center justify-space-between py-3 px-4">
                  <div class="d-flex flex-column">
                    <div class="court-name font-weight-bold text-subtitle-1">
                      {{ court.name }}
                    </div>
                    <div class="court-name-en text-grey-darken-1 text-subtitle-2">
                      {{ court.name_en || 'No English Name' }}
                    </div>
                    <div class="court-type-badge text-caption text-primary mt-1">
                      Type: {{ court.court_type_name }}
                    </div>
                  </div>
                  <div class="d-flex align-center">
                    <v-btn icon="mdi-pencil" variant="text" color="primary" size="small"
                      @click="openEditSingleCourtDialog(court)" />
                    <!-- <v-btn icon="mdi-delete" variant="text" color="error" size="small"
                      @click="confirmDeleteSingleCourt(court)" /> -->
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col v-if="!allCourts.length" cols="12">
              <div class="text-center text-grey-darken-1 py-4 bg-grey-lighten-4 rounded-lg border-dashed border">No
                courts defined for this venue.</div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-row v-if="selectedProviderId && tableReady" class="facility-section" align="center">
        <v-col cols="12" class="facility-actions">
          <div class="section-title">
            Facilities <span class="section-total">({{ facilityTotal }})</span>
          </div>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus"
            :disabled="facilitiesLoading || creatingFacilities || facilities.length === 0" @click="openFacilityDialog">
            Create Facilities
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table :headers="facilityHeaders" :items="facilityTableItems" class="elevation-1 facility-table"
            density="compact" :items-per-page="-1" hide-default-footer />
        </v-col>
      </v-row>

      <v-row v-if="selectedProviderId && tableReady" class="conditions-section mb-6" align="center">
        <v-col cols="12" class="conditions-actions d-flex align-center justify-space-between mb-2">
          <div class="section-title">
            เงื่อนไขการจอง (Provider Conditions) <span class="section-total">({{ conditions.length || 0 }})</span>
          </div>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-plus" :disabled="conditionsLoading"
            @click="openAddConditionDialog">
            เพิ่มข้อมูล
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table :headers="conditionHeaders" :items="conditions" :loading="conditionsLoading"
            class="elevation-1 border rounded-lg" density="compact" :items-per-page="-1" hide-default-footer>
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
        </v-col>
      </v-row>

      <v-row v-if="selectedProviderId && !isProviderLoading" class="detail-section" align="center">
        <v-col cols="12">
          <div class="detail-header">
            <div class="section-title">Details</div>
          </div>
          <div class="detail-grid">
            <div class="detail-row detail-row--fields mb-4">
              <div class="detail-field detail-field--text">
                <v-text-field v-model="detailForm.fullname" label="Fullname (TH)" placeholder="ชื่อสนาม" clearable
                  hide-details variant="outlined" />
              </div>
              <div class="detail-field detail-field--text">
                <v-text-field v-model="detailForm.fullname_en" label="Fullname (EN)" placeholder="Venue Name (English)"
                  clearable hide-details variant="outlined" />
              </div>
            </div>
            <div class="detail-row detail-row--fields">
              <div class="detail-field detail-field--text">
                <v-text-field v-model="detailForm.latitude" type="number" step="any" label="Latitude"
                  placeholder="10.1312312312321" clearable hide-details variant="outlined" />
              </div>
              <div class="detail-field detail-field--text">
                <v-text-field v-model="detailForm.longitude" type="number" step="any" label="Longitude"
                  placeholder="10.1312312312321" clearable hide-details variant="outlined" />
              </div>
              <div class="detail-actions detail-actions--inline" :class="{ 'detail-actions--hidden': !detailDirty }">
                <v-btn variant="outlined" color="grey" @click="resetDetailForm">
                  Cancel
                </v-btn>
                <v-btn color="primary" :loading="detailSaving" @click="saveDetailForm">
                  Update
                </v-btn>
              </div>
            </div>
            <div class="detail-row detail-row--address">
              <div class="detail-field detail-field--wide">
                <v-text-field v-model="detailForm.location" label="Location" placeholder="อเมืองจังหวัดเชียงใหม่"
                  clearable hide-details variant="outlined" />
              </div>
            </div>
            <div class="detail-row detail-row--switch">
              <div class="">
                <div class="detail-switch">
                  <div class="detail-switch__label">Open Provider</div>
                  <v-switch v-model="detailForm.avaliable" :true-value="1" :false-value="0" color="primary" hide-details
                    density="compact" inset @update:model-value="onSwitchChanged" />
                </div>
              </div>
              <div class="detail-field">
                <div class="detail-switch">
                  <div class="detail-switch__label">Hide On App</div>
                  <v-switch v-model="detailForm.hide_on_app" :true-value="1" :false-value="0" color="primary"
                    hide-details density="compact" inset @update:model-value="onSwitchChanged" />
                </div>
              </div>
              <div class="detail-field">
                <div class="detail-switch">
                  <div class="detail-switch__label">Hide On Web</div>
                  <v-switch v-model="detailForm.hide_on_web" :true-value="1" :false-value="0" color="primary"
                    hide-details density="compact" inset @update:model-value="onSwitchChanged" />
                </div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row v-if="selectedProviderId && tableReady" class="checktime-section mt-n2" align="center">
        <v-col cols="12">
          <div class="section-title mb-3">Generate Checktime</div>
          <div class="checktime-hint mb-2">
            All courts are selected by default. The link automatically uses the shorter hide or show court list.
          </div>
          <v-card variant="outlined" class="checktime-card">
            <v-card-text>
              <v-row align="start">
                <v-col cols="12">
                  <v-select v-model="checktimeCourtIds" :items="allCourts" item-title="name" item-value="id"
                    label="Select Courts" variant="outlined" multiple chips closable-chips hide-details>
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props"
                        :subtitle="`${item.raw.court_type_name || 'Court'} · ID: ${item.raw.id}`" />
                    </template>
                  </v-select>
                </v-col>
                <v-col cols="6">
                  <div class="checktime-theme-field">
                    <v-menu :close-on-content-click="false">
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" class="checktime-color-button" variant="outlined" height="56"
                          aria-label="Open theme color picker">
                          <span class="checktime-color-swatch"
                            :style="{ backgroundColor: checktimeTheme ? checktimeThemePickerColor : 'transparent' }" />
                        </v-btn>
                      </template>
                      <v-color-picker :model-value="checktimeThemePickerColor" mode="hex" :modes="['hex']"
                        hide-inputs @update:model-value="setChecktimeTheme" />
                    </v-menu>
                    <v-text-field :model-value="checktimeTheme" label="Theme Color" variant="outlined" maxlength="7"
                      prefix="#" hint="Pick a color or paste ff8600 / #ff8600" persistent-hint
                      @update:model-value="setChecktimeTheme" />
                  </div>
                </v-col>
                <v-col cols="6">
                  <v-select v-model="checktimeMode" :items="checktimeModeOptions" label="Mode" variant="outlined"
                    hide-details />
                </v-col>
                <v-col cols="12" class="d-flex align-center ga-3 pt-0">
                  <v-btn class="checktime-action-button" color="primary" prepend-icon="mdi-clock-outline" height="44"
                    size="small"
                    :disabled="allCourts.length === 0" @click="generateChecktimeLink('checktime', 'Checktime')">
                    Checktime
                  </v-btn>
                  <v-btn class="checktime-action-button" color="primary" variant="outlined"
                    prepend-icon="mdi-view-dashboard-outline" height="44" size="small"
                    :disabled="allCourts.length === 0"
                    @click="generateChecktimeLink('checktime-board', 'Checktime Board')">
                    Checktime Board
                  </v-btn>
                  <v-btn class="checktime-action-button" color="primary" variant="outlined"
                    prepend-icon="mdi-sort" height="44" size="small"
                    :disabled="allCourts.length === 0" @click="openCourtOrderDialog">
                    Checktime with Court Order
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <facility-picker-dialog v-model="facilityDialogOpen" :facilities="facilityPickerOptions"
        :loading="facilitiesLoading || creatingFacilities" :provider-id="selectedProviderId"
        :existing-ids="existingFacilityIds" @confirm="confirmAddFacilities" />
      <AddProviderCondition ref="addConditionDialog" :fixed-provider-id="selectedProviderId"
        @refresh="fetchConditions(selectedProviderId)" />

      <v-dialog v-model="liffConfirmDialog" max-width="420px" persistent>
        <v-card class="liff-confirm-card">
          <v-card-title class="liff-confirm-title">Confirm Upload</v-card-title>
          <v-card-text>
            <div class="liff-confirm-copy">Replace LIFF {{ liffConfirmConfig.label || liffConfirmMediaType }} ?</div>
            <div class="liff-confirm-frame" :style="liffConfirmFrameStyle">
              <img v-if="liffConfirmPreviewUrl" :src="liffConfirmPreviewUrl" alt="LIFF media preview" />
            </div>
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn variant="text" color="grey-darken-1" :disabled="liffConfirmUploading"
              @click="closeLiffConfirmDialog">
              Cancel
            </v-btn>
            <v-btn color="primary" :loading="liffConfirmUploading" @click="confirmLiffMediaDialogUpload">
              Upload
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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

      <!-- Individual Court Add/Edit Dialog -->
      <v-dialog v-model="courtSingleEditDialog" max-width="500px" persistent>
        <v-card class="rounded-lg">
          <v-card-title class="d-flex justify-space-between align-center pt-4 px-6 border-b pb-3">
            <span class="text-h6 font-weight-bold">{{ courtSingleForm.id ? 'Edit Court' : 'Add Court' }}</span>
            <v-btn icon="mdi-close" variant="text" density="compact" @click="courtSingleEditDialog = false"></v-btn>
          </v-card-title>
          <v-card-text class="pt-6">
            <v-row dense>
              <v-col cols="12" class="mb-4">
                <v-select v-model="courtSingleForm.court_type_id" :items="selectedProvider?.court_types || []"
                  item-title="name" item-value="id" label="Court Type" variant="outlined" density="compact" hide-details
                  :disabled="!!courtSingleForm.id" />
              </v-col>
              <v-col cols="12" class="mb-4">
                <v-text-field v-model="courtSingleForm.name" label="Court Name (TH)" variant="outlined"
                  density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="courtSingleForm.name_en" label="Court Name (EN)" variant="outlined"
                  density="compact" hide-details />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="courtSingleEditDialog = false">Cancel</v-btn>
            <v-btn color="primary" variant="elevated" class="px-6" :loading="courtSingleSaving"
              @click="saveSingleCourt">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="checktimeDialogOpen" max-width="680px">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>{{ generatedChecktimeLabel }} Link</span>
            <v-btn icon="mdi-close" variant="text" size="small" @click="checktimeDialogOpen = false" />
          </v-card-title>
          <v-card-text>
            <v-textarea :model-value="generatedChecktimeLink" label="Generated URL" variant="outlined" rows="3"
              readonly hide-details auto-grow />
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-content-copy" @click="copyChecktimeLink">
              Copy Link
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Court Order Dialog -->
      <v-dialog v-model="courtOrderDialogOpen" max-width="560px">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Arrange Court Order</span>
            <v-btn icon="mdi-close" variant="text" size="small" @click="courtOrderDialogOpen = false" />
          </v-card-title>
          <v-card-text>
            <div class="court-order-hint mb-3">Drag the handle (or use the arrows) to set the display order.</div>
            <v-list class="court-order-list" density="compact">
              <v-list-item v-for="(court, index) in courtOrderList" :key="court.id" class="court-order-item"
                draggable="true" @dragstart="onCourtOrderDragStart(index, $event)" @dragover="onCourtOrderDragOver"
                @drop="onCourtOrderDrop(index)" @dragend="onCourtOrderDragEnd">
                <template v-slot:prepend>
                  <v-icon class="court-order-handle" icon="mdi-drag" />
                  <span class="court-order-index">{{ index + 1 }}</span>
                </template>
                <v-list-item-title>{{ court.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ court.court_type_name || 'Court' }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn icon="mdi-chevron-up" variant="text" size="small" :disabled="index === 0"
                    @click="moveCourtOrderItem(index, -1)" />
                  <v-btn icon="mdi-chevron-down" variant="text" size="small"
                    :disabled="index === courtOrderList.length - 1" @click="moveCourtOrderItem(index, 1)" />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn variant="outlined" color="grey" @click="courtOrderDialogOpen = false">Cancel</v-btn>
            <v-btn color="primary" prepend-icon="mdi-link-variant" @click="generateCourtOrderLink">
              Generate Link
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>

<script>
import Swal from "sweetalert2";
import localService from "../api/localService";
import ConsoleService from "../api/ConsoleService";
import FacilityPickerDialog from "../components/facilityPickerDialog.vue";
import ProviderConditionService from "../api/providerConditionTexts";
import AddProviderCondition from "../components/addProviderCondition.vue";

export default {
  name: "ProviderMedia",
  components: { FacilityPickerDialog, AddProviderCondition },
  data() {
    return {
      providers: [],
      selectedProviderId: null,
      selectedFiles: [],
      selectedFilePreviews: [],
      loading: false,
      saving: false,
      mediaLoading: false,
      mediaImages: [],
      logos: {},
      liffMedia: {
        logo: "",
        background: "",
      },
      liffMediaTypes: [
        { key: "logo", label: "Logo", field: "liff_logo", aspectRatio: 1, previewWidth: 146, previewHeight: 146 },
        { key: "background", label: "Background", field: "liff_bg_url", aspectRatio: 16 / 9, previewWidth: 244, previewHeight: 137 },
      ],
      activeLiffMediaType: null,
      liffMediaUploadingByType: {},
      liffConfirmDialog: false,
      liffConfirmMediaType: null,
      liffConfirmFile: null,
      liffConfirmPreviewUrl: "",
      logoTypes: [
        { key: "logo", label: "Logo" },
        { key: "logo_backup", label: "Logo Backup" },
        { key: "logo2", label: "Logo 2" },
        { key: "logo2_backup", label: "Logo 2 Backup" },
      ],
      activeLogoType: null,
      logoUploadingByType: {},
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
      courtOrdersRaw: null,
      detailForm: {
        latitude: "",
        longitude: "",
        location: "",
        avaliable: 1,
        hide_on_app: 0,
        hide_on_web: 0,
      },
      detailOriginal: {
        latitude: "",
        longitude: "",
        location: "",
        avaliable: 1,
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
      courtSingleEditDialog: false,
      courtSingleForm: { id: null, court_type_id: null, name: '', name_en: '' },
      courtSingleSaving: false,
      checktimeCourtIds: [],
      checktimeTheme: null,
      checktimeMode: 'light',
      checktimeModeOptions: ['light', 'dark'],
      checktimeDialogOpen: false,
      generatedChecktimeLink: '',
      generatedChecktimeLabel: 'Checktime',
      courtOrderDialogOpen: false,
      courtOrderList: [],
      courtOrderDragIndex: null,
    };
  },
  computed: {
    displayedMediaImages() {
      return this.mediaImages || [];
    },
    totalMediaCount() {
      return this.displayedMediaImages.length + this.selectedFilePreviews.length;
    },
    selectedProvider() {
      if (!this.selectedProviderId) return null;
      return this.providers.find((p) => p.id === this.selectedProviderId) || null;
    },
    selectedFacilityProviders() {
      if (!this.selectedProviderId) return [];
      return this.facilityProvidersByProviderId[this.selectedProviderId] || [];
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
    checktimeThemePickerColor() {
      return /^([0-9a-f]{6})$/i.test(this.checktimeTheme) ? `#${this.checktimeTheme}` : '#ffffff';
    },
    isProviderLoading() {
      return this.mediaLoading || this.facilitiesLoading;
    },
    tableReady() {
      return !this.mediaLoading && !this.facilitiesLoading;
    },
    detailDirty() {
      return (
        JSON.stringify(this.getDetailComparableForButtons(this.detailForm)) !==
        JSON.stringify(this.getDetailComparableForButtons(this.detailOriginal))
      );
    },
    totalCourtsCount() {
      if (!this.selectedProvider || !this.selectedProvider.court_types) return 0;
      return this.selectedProvider.court_types.reduce((total, ct) => total + (ct.courts ? ct.courts.length : 0), 0);
    },
    allCourts() {
      if (!this.selectedProvider || !this.selectedProvider.court_types) return [];
      const list = [];
      for (const ct of this.selectedProvider.court_types) {
        if (ct.courts && Array.isArray(ct.courts)) {
          for (const court of ct.courts) {
            list.push({
              ...court,
              court_type_name: ct.name,
              court_type_id: ct.id
            });
          }
        }
      }
      const orderIds = this.getDefaultCourtOrderIds();
      if (orderIds.length === 0) return list;
      const orderIndex = new Map(orderIds.map((id, index) => [id, index]));
      return [...list].sort((a, b) => {
        const aIndex = orderIndex.has(a.id) ? orderIndex.get(a.id) : orderIds.length;
        const bIndex = orderIndex.has(b.id) ? orderIndex.get(b.id) : orderIds.length;
        return aIndex - bIndex;
      });
    },
    liffConfirmConfig() {
      return this.liffMediaTypes.find((item) => item.key === this.liffConfirmMediaType) || {};
    },
    liffConfirmFrameStyle() {
      const width = this.liffConfirmConfig.previewWidth || 220;
      const height = this.liffConfirmConfig.previewHeight || 220;
      return {
        "--preview-width": `${width}px`,
        aspectRatio: `${width} / ${height}`,
      };
    },
    liffConfirmUploading() {
      return this.isLiffMediaUploading(this.liffConfirmMediaType);
    },
  },
  methods: {
    setChecktimeTheme(value) {
      const normalizedTheme = String(value || '')
        .replace(/#/g, '')
        .replace(/[^0-9a-f]/gi, '')
        .slice(0, 6)
        .toLowerCase();
      this.checktimeTheme = normalizedTheme || null;
    },
    generateChecktimeLink(path, label) {
      if (!this.selectedProviderId || this.allCourts.length === 0) return;
      const baseUrl = `https://arena.matchday.co.th/${path}/${encodeURIComponent(this.selectedProviderId)}`;
      const allCourtIds = this.allCourts.map((court) => court.id);
      const selectedIds = new Set(this.checktimeCourtIds.map((id) => String(id)));
      const shownCourtIds = allCourtIds.filter((id) => selectedIds.has(String(id)));
      const hiddenCourtIds = allCourtIds.filter((id) => !selectedIds.has(String(id)));
      const normalizedTheme = String(this.checktimeTheme || '')
        .trim()
        .replace(/^#/, '');
      const params = new URLSearchParams();
      if (/^[0-9a-f]{6}$/i.test(normalizedTheme)) {
        params.set('theme', normalizedTheme);
      }
      params.set('mode', this.checktimeMode || 'light');
      if (hiddenCourtIds.length > 0) {
        const useHide = hiddenCourtIds.length <= shownCourtIds.length;
        params.set(useHide ? 'hide' : 'show', (useHide ? hiddenCourtIds : shownCourtIds).join(','));
      }
      this.generatedChecktimeLink = `${baseUrl}?${params.toString().replace(/%2C/g, ',')}`;
      this.generatedChecktimeLabel = label;
      this.checktimeDialogOpen = true;
    },
    getDefaultCourtOrderIds() {
      const raw = this.courtOrdersRaw;
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed?.ids) ? parsed.ids : [];
      } catch (e) {
        return [];
      }
    },
    openCourtOrderDialog() {
      if (this.allCourts.length === 0) return;
      const selectedIds = new Set(this.checktimeCourtIds.map((id) => String(id)));
      const availableCourts = this.allCourts.filter((court) => selectedIds.has(String(court.id)));
      const courtsById = new Map(availableCourts.map((court) => [court.id, court]));
      const baseList = this.courtOrderList.length > 0 ? this.courtOrderList : availableCourts;
      const ordered = baseList
        .map((court) => courtsById.get(court.id))
        .filter(Boolean);
      const orderedIds = new Set(ordered.map((court) => court.id));
      const missing = availableCourts.filter((court) => !orderedIds.has(court.id));
      this.courtOrderList = [...ordered, ...missing];
      this.courtOrderDialogOpen = true;
    },
    moveCourtOrderItem(index, delta) {
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= this.courtOrderList.length) return;
      const list = [...this.courtOrderList];
      const [moved] = list.splice(index, 1);
      list.splice(targetIndex, 0, moved);
      this.courtOrderList = list;
    },
    onCourtOrderDragStart(index, event) {
      this.courtOrderDragIndex = index;
      if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
      }
    },
    onCourtOrderDragOver(event) {
      event.preventDefault();
      if (event?.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    },
    onCourtOrderDrop(targetIndex) {
      if (this.courtOrderDragIndex === null || this.courtOrderDragIndex === targetIndex) return;
      const list = [...this.courtOrderList];
      const [moved] = list.splice(this.courtOrderDragIndex, 1);
      list.splice(targetIndex, 0, moved);
      this.courtOrderList = list;
      this.courtOrderDragIndex = null;
    },
    onCourtOrderDragEnd() {
      this.courtOrderDragIndex = null;
    },
    generateCourtOrderLink() {
      if (!this.selectedProviderId || this.courtOrderList.length === 0) return;
      const baseUrl = `https://arena.matchday.co.th/checktime/${encodeURIComponent(this.selectedProviderId)}`;
      const orderedIds = this.courtOrderList.map((court) => court.id);
      const orderedIdSet = new Set(orderedIds.map((id) => String(id)));
      const hiddenCourtIds = this.allCourts
        .map((court) => court.id)
        .filter((id) => !orderedIdSet.has(String(id)));
      const normalizedTheme = String(this.checktimeTheme || '')
        .trim()
        .replace(/^#/, '');
      const params = new URLSearchParams();
      if (/^[0-9a-f]{6}$/i.test(normalizedTheme)) {
        params.set('theme', normalizedTheme);
      }
      params.set('mode', this.checktimeMode || 'light');
      params.set('court_order', orderedIds.join(','));
      if (hiddenCourtIds.length > 0) {
        const useHide = hiddenCourtIds.length <= orderedIds.length;
        params.set(useHide ? 'hide' : 'show', (useHide ? hiddenCourtIds : orderedIds).join(','));
      }
      this.generatedChecktimeLink = `${baseUrl}?${params.toString().replace(/%2C/g, ',')}`;
      this.generatedChecktimeLabel = 'Court Order';
      this.courtOrderDialogOpen = false;
      this.checktimeDialogOpen = true;
    },
    async copyChecktimeLink() {
      if (!this.generatedChecktimeLink) return;
      try {
        await navigator.clipboard.writeText(this.generatedChecktimeLink);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Link copied',
          showConfirmButton: false,
          timer: 1600,
        });
      } catch (error) {
        const input = document.createElement('textarea');
        input.value = this.generatedChecktimeLink;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Link copied',
          showConfirmButton: false,
          timer: 1600,
        });
      }
    },
    getDetailComparableForButtons(source) {
      return {
        fullname: this.normalizeText(source.fullname),
        fullname_en: this.normalizeText(source.fullname_en),
        latitude: this.normalizeText(source.latitude),
        longitude: this.normalizeText(source.longitude),
        location: this.normalizeText(source.location),
      };
    },
    getDetailComparable(source) {
      return {
        fullname: this.normalizeText(source.fullname),
        fullname_en: this.normalizeText(source.fullname_en),
        latitude: this.normalizeText(source.latitude),
        longitude: this.normalizeText(source.longitude),
        location: this.normalizeText(source.location),
        avaliable: this.normalizeFlag(source.avaliable),
        hide_on_app: this.normalizeFlag(source.hide_on_app),
        hide_on_web: this.normalizeFlag(source.hide_on_web),
      };
    },
    normalizeNumber(value) {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    },
    normalizeText(value) {
      if (value === null || value === undefined) return null;
      const trimmed = String(value).trim();
      return trimmed === "" ? null : trimmed;
    },
    normalizeFlag(value) {
      if (value === "" || value === null || value === undefined) return 0;
      const val = Number(value);
      return val === 1 ? 1 : 0;
    },
    setDetailFormFromProvider(provider) {
      if (!provider) {
        this.detailForm = {};
        this.detailOriginal = {};
        return;
      }
      const rawAvaliable =
        provider?.avaliable ??
        provider?.available ??
        provider?.open_provider ??
        provider?.open ??
        provider?.is_open;
      const selected = this.selectedProvider || {};
      const next = {
        fullname: provider?.fullname ?? selected?.fullname ?? "",
        fullname_en: provider?.fullname_en ?? selected?.fullname_en ?? "",
        latitude: provider?.latitude === 0 ? "0" : provider?.latitude ? String(provider.latitude) : "",
        longitude: provider?.longitude === 0 ? "0" : provider?.longitude ? String(provider.longitude) : "",
        location: provider?.location ?? selected?.location ?? provider?.address ?? selected?.address ?? "",
        avaliable: rawAvaliable === 0 ? 0 : 1,
        hide_on_app: provider?.hide_on_app === 1 ? 1 : 0,
        hide_on_web: provider?.hide_on_web === 1 ? 1 : 0,
      };
      this.detailForm = { ...next };
      this.detailOriginal = { ...next };
    },
    resetDetailForm() {
      this.detailForm = { ...this.detailOriginal };
    },
    async saveDetailForm(fields) {
      if (!this.selectedProviderId) return;
      this.detailSaving = true;
      const payloadAll = this.getDetailComparable(this.detailForm);
      const payload = Array.isArray(fields)
        ? fields.reduce((acc, key) => {
          acc[key] = payloadAll[key];
          return acc;
        }, {})
        : payloadAll;

      const apiPayload = {
        fullname: payloadAll.fullname,
        fullname_en: payloadAll.fullname_en,
        lat: payloadAll.latitude,
        lng: payloadAll.longitude,
        hidden_app: payloadAll.hide_on_app,
        hidden_page: payloadAll.hide_on_web,
        available: payloadAll.avaliable,
        location: payloadAll.location,
      };

      const res = await ConsoleService.updateProviderSetting({
        provider_id: this.selectedProviderId,
        data: apiPayload,
      });

      this.detailSaving = false;

      if (res && res.success !== false) {
        const isAutoSwitchUpdate =
          Array.isArray(fields) &&
          fields.every((field) => ["avaliable", "hide_on_app", "hide_on_web"].includes(field));
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
        const updated = { ...(this.selectedProvider || {}), ...payload };
        this.providers = this.providers.map((provider) =>
          provider.id === this.selectedProviderId ? updated : provider
        );
        if (Array.isArray(fields)) {
          const nextOriginal = { ...this.detailOriginal };
          fields.forEach((field) => {
            nextOriginal[field] = this.detailForm[field];
          });
          this.detailOriginal = nextOriginal;
        } else {
          this.setDetailFormFromProvider(updated);
        }
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
      this.saveDetailForm(["avaliable", "hide_on_app", "hide_on_web"]);
    },
    async fetchProviders() {
      this.loading = true;
      try {
        const response = await ConsoleService.getProviders();
        const providers = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        this.providers = providers;
        if (this.selectedProviderId) {
          this.setDetailFormFromProvider(this.selectedProvider);
        }
      } catch (error) {
        Swal.fire({
          title: "Failed",
          text: "Unable to load providers.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
        this.providers = [];
      } finally {
        this.loading = false;
      }
    },
    refreshProviders() {
      this.fetchProviders();
      if (this.selectedProviderId) {
        this.fetchProviderMedia(this.selectedProviderId);
        this.fetchConditions(this.selectedProviderId);
      }
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
    triggerFileSelect() {
      if (this.loading || this.mediaLoading || this.saving) return;
      this.$refs.fileInput?.click();
    },
    async uploadSelectedImages() {
      if (!this.selectedProviderId || this.selectedFiles.length === 0) {
        Swal.fire({
          title: "Missing Data",
          text: "Please select a provider and at least one image.",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
        return;
      }

      Swal.fire({
        title: "Uploading Images...",
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.saving = true;
      let hadError = false;

      for (const file of this.selectedFiles) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await localService.uploadProviderMedia(this.selectedProviderId, formData);
        if (!res.success) {
          hadError = true;
          break;
        }
      }

      this.saving = false;

      if (!hadError) {
        Swal.close();
        await Swal.fire({
          title: "Success",
          text: "Provider media saved.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderMedia(this.selectedProviderId);
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
    isLogoUploading(type) {
      return Boolean(this.logoUploadingByType?.[type]);
    },
    getLiffMediaUrl(type) {
      return this.liffMedia?.[type] || "";
    },
    isLiffMediaUploading(type) {
      return Boolean(this.liffMediaUploadingByType?.[type]);
    },
    triggerLiffMediaFileSelect(type) {
      if (!this.selectedProviderId || this.loading || this.mediaLoading || this.saving) return;
      if (this.isLiffMediaUploading(type)) return;
      this.activeLiffMediaType = type;
      this.$refs.liffMediaFileInput?.click();
    },
    async onLiffMediaFileSelected(event) {
      const file = event?.target?.files?.[0];
      const mediaType = this.activeLiffMediaType;
      if (!file || !mediaType) {
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
      await this.confirmLiffMediaUpload(mediaType, file);
    },
    async confirmLiffMediaUpload(mediaType, file) {
      this.closeLiffConfirmDialog();
      this.liffConfirmMediaType = mediaType;
      this.liffConfirmFile = file;
      this.liffConfirmPreviewUrl = URL.createObjectURL(file);
      this.liffConfirmDialog = true;
    },
    closeLiffConfirmDialog() {
      if (this.liffConfirmPreviewUrl) {
        URL.revokeObjectURL(this.liffConfirmPreviewUrl);
      }
      this.liffConfirmDialog = false;
      this.liffConfirmMediaType = null;
      this.liffConfirmFile = null;
      this.liffConfirmPreviewUrl = "";
    },
    async confirmLiffMediaDialogUpload() {
      if (!this.liffConfirmMediaType || !this.liffConfirmFile) return;
      const uploaded = await this.uploadLiffMedia(this.liffConfirmMediaType, this.liffConfirmFile);
      if (uploaded) {
        this.closeLiffConfirmDialog();
      }
    },
    async uploadLiffMedia(mediaType, file) {
      if (!this.selectedProviderId) return false;

      const config = this.liffMediaTypes.find((item) => item.key === mediaType) || {};
      this.liffMediaUploadingByType = { ...this.liffMediaUploadingByType, [mediaType]: true };

      const res = await localService.uploadProviderLiffMedia(this.selectedProviderId, {
        file,
        field: config.field,
      });
      this.liffMediaUploadingByType = { ...this.liffMediaUploadingByType, [mediaType]: false };

      if (res.success) {
        const uploadedLiffMedia = this.normalizeLiffMediaResponse(res.data);
        if (uploadedLiffMedia.logo || uploadedLiffMedia.background) {
          this.liffMedia = {
            ...this.liffMedia,
            ...uploadedLiffMedia,
          };
        } else {
          await this.fetchProviderMedia(this.selectedProviderId);
        }
        return true;
      } else {
        Swal.fire({
          title: "Failed",
          text: res.message || "Unable to update LIFF media.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
        return false;
      }
    },
    triggerLogoFileSelect(type) {
      if (!this.selectedProviderId || this.loading || this.mediaLoading || this.saving) return;
      if (this.isLogoUploading(type)) return;
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
      await this.confirmLogoUpload(logoType, file);
    },
    async confirmLogoUpload(logoType, file) {
      const previewUrl = URL.createObjectURL(file);
      const result = await Swal.fire({
        title: "Confirm Upload",
        text: `Replace ${logoType.replace("_", " ")} ?`,
        imageUrl: previewUrl,
        imageAlt: "Logo preview",
        imageWidth: 220,
        customClass: {
          image: "logo-confirm-image",
        },
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
      if (!this.selectedProviderId) return;

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
      const resizedFile = await this.resizeLogoFile(file);
      formData.append("file", resizedFile || file);

      const res = await localService.uploadProviderLogo(this.selectedProviderId, formData);
      this.logoUploadingByType = { ...this.logoUploadingByType, [logoType]: false };

      if (res.success) {
        Swal.close();
        await Swal.fire({
          title: "Success",
          text: "Logo updated.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderMedia(this.selectedProviderId);
      } else {
        Swal.close();
        Swal.fire({
          title: "Failed",
          text: res.message || "Unable to update logo.",
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
    resetForm() {
      this.selectedProviderId = null;
      this.clearSelectedFiles();
      this.mediaImages = [];
      this.logos = {};
      this.liffMedia = { logo: "", background: "" };
      this.courtOrdersRaw = null;
    },
    async fetchProviderMedia(providerId) {
      if (!providerId) {
        this.mediaImages = [];
        this.logos = {};
        this.liffMedia = { logo: "", background: "" };
        this.courtOrdersRaw = null;
        return;
      }

      this.mediaLoading = true;
      const res = await localService.getProviderMedia(providerId);
      this.mediaLoading = false;

      if (res.success) {
        const rawDetail =
          res.data?.provider ||
          res.data?.provider_detail ||
          res.data?.provider_data ||
          res.data?.provider_info ||
          res.data?.detail ||
          null;
        const detailSource = rawDetail || res.data || {};
        const hasDetailKey = [
          "latitude",
          "longitude",
          "lat",
          "lng",
          "location",
          "address",
          "avaliable",
          "available",
          "open_provider",
          "hide_on_app",
          "hide_on_web",
          "hidden_app",
          "hidden_page",
          "hidden_web",
        ].some((key) => detailSource?.[key] !== undefined);
        if (hasDetailKey) {
          const normalizedDetail = {
            latitude: detailSource?.latitude ?? detailSource?.lat ?? "",
            longitude: detailSource?.longitude ?? detailSource?.lng ?? "",
            location: detailSource?.location ?? detailSource?.address ?? "",
            avaliable:
              detailSource?.avaliable ??
              detailSource?.available ??
              detailSource?.open_provider ??
              detailSource?.open ??
              detailSource?.is_open,
            hide_on_app: detailSource?.hide_on_app ?? detailSource?.hidden_app,
            hide_on_web: detailSource?.hide_on_web ?? detailSource?.hidden_page ?? detailSource?.hidden_web,
          };
          this.setDetailFormFromProvider(normalizedDetail);
        }

        const rawImages =
          res.data?.photos ||
          res.data?.images ||
          res.data?.media ||
          res.data?.image_urls ||
          [];
        const normalized = Array.isArray(rawImages)
          ? rawImages
            .map((item) => {
              if (typeof item === "string") return item;
              return item?.image || item?.image_prod || item?.url || item?.image_url || item?.path || null;
            })
            .filter(Boolean)
          : [];
        this.mediaImages = normalized;
        this.courtOrdersRaw = res.data?.court_orders ?? null;
        const rawLogos = res.data?.logos || {};
        this.logos = rawLogos && typeof rawLogos === "object" ? rawLogos : {};
        this.liffMedia = this.normalizeLiffMediaResponse(res.data);
        const facilityProviders = res.data?.facility_providers || [];
        this.facilityProvidersByProviderId = {
          ...this.facilityProvidersByProviderId,
          [providerId]: Array.isArray(facilityProviders) ? facilityProviders : [],
        };
      } else {
        this.mediaImages = [];
        Swal.fire({
          title: "Failed",
          text: res.message || "Unable to load provider media.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    normalizeLiffMediaResponse(data) {
      const rawLiffMedia = {
        ...(data || {}),
        ...(data?.data || {}),
        ...(data?.provider || {}),
        ...(data?.logos || {}),
        ...(data?.data?.logos || {}),
        ...(data?.liff_media || {}),
        ...(data?.liffMedia || {}),
      };
      return {
        logo: rawLiffMedia?.liff_logo || "",
        background: rawLiffMedia?.liff_bg_url || "",
      };
    },
    async fetchFacilities() {
      this.facilitiesLoading = true;
      const res = await localService.getProviderFacilities();
      this.facilitiesLoading = false;

      if (res.success) {
        const rawFacilities = res.data?.data || res.data || [];
        this.facilities = Array.isArray(rawFacilities) ? rawFacilities : [];
      } else {
        this.facilities = [];
        Swal.fire({
          title: "Failed",
          text: res.message || "Unable to load facilities.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
    },
    openFacilityDialog() {
      this.facilityDialogOpen = true;
    },
    confirmAddFacilities(payload) {
      const selectedIds = Array.isArray(payload) ? payload : payload?.ids;
      const detail = Array.isArray(payload) ? "" : payload?.detail || "";
      if (!this.selectedProviderId || !selectedIds?.length) return;

      const createPayload = selectedIds.map((facilityId) => ({
        provider_id: this.selectedProviderId,
        facility_id: facilityId,
        detail,
      }));
      console.log("create facilities payload", createPayload);

      this.createFacilities(createPayload);
    },
    async createFacilities(createPayload) {
      this.creatingFacilities = true;
      const res = await localService.createFacilityProviders(createPayload);
      this.creatingFacilities = false;

      if (res.success) {
        Swal.fire({
          title: "Success",
          text: "Facilities created.",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
        await this.fetchProviderMedia(this.selectedProviderId);
      } else {
        Swal.fire({
          title: "Failed",
          text: res.message || "Unable to create facilities.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#d60326",
        });
      }
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

        // Update local state directly so UI updates without reloading all providers
        if (this.selectedProvider && Array.isArray(this.selectedProvider.court_types)) {
          const index = this.selectedProvider.court_types.findIndex((c) => c.id === this.courtEditForm.id);
          if (index !== -1) {
            this.selectedProvider.court_types[index].name = this.courtEditForm.name;
            this.selectedProvider.court_types[index].name_en = this.courtEditForm.name_en;
          }
        }
        this.courtEditDialogOpen = false;
      } else {
        Swal.fire({
          title: "Failed",
          text: "Unable to update court name.",
        });
      }
    },
    openAddSingleCourtDialog() {
      if (!this.selectedProvider || !this.selectedProvider.court_types || !this.selectedProvider.court_types.length) return;
      this.courtSingleForm = {
        id: null,
        court_type_id: this.selectedProvider.court_types[0].id,
        name: '',
        name_en: '',
      };
      this.courtSingleEditDialog = true;
    },
    openEditSingleCourtDialog(court) {
      this.courtSingleForm = {
        id: court.id,
        court_type_id: court.court_type_id,
        name: court.name || '',
        name_en: court.name_en || '',
      };
      this.courtSingleEditDialog = true;
    },
    async saveSingleCourt() {
      if (!this.courtSingleForm.court_type_id || !this.courtSingleForm.name) {
        Swal.fire({
          title: 'เตือน',
          text: 'กรุณากรอกชื่อสนามภาษาไทย',
          icon: 'warning',
        });
        return;
      }

      this.courtSingleSaving = true;
      let res;
      if (this.courtSingleForm.id) {
        res = await localService.updateCourt(this.courtSingleForm.id, {
          name: this.courtSingleForm.name,
          name_en: this.courtSingleForm.name_en,
        });
      } else {
        res = await ConsoleService.createCourt(this.courtSingleForm.court_type_id, {
          name: this.courtSingleForm.name,
          name_en: this.courtSingleForm.name_en,
        });
      }
      this.courtSingleSaving = false;

      if (res && (res.success || res.status === 'Success' || res.created || res.updated)) {
        Swal.fire({
          title: 'สำเร็จ',
          text: this.courtSingleForm.id ? 'แก้ไขข้อมูลสนามสำเร็จ' : 'เพิ่มข้อมูลสนามสำเร็จ',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });

        // Update local state directly so UI updates instantly
        if (this.selectedProvider && Array.isArray(this.selectedProvider.court_types)) {
          if (this.courtSingleForm.id) {
            // Edit
            const courtType = this.selectedProvider.court_types.find(c => c.id === this.courtSingleForm.court_type_id);
            if (courtType && Array.isArray(courtType.courts)) {
              const courtIndex = courtType.courts.findIndex(court => court.id === this.courtSingleForm.id);
              if (courtIndex !== -1) {
                courtType.courts[courtIndex].name = this.courtSingleForm.name;
                courtType.courts[courtIndex].name_en = this.courtSingleForm.name_en;
              }
            }
          } else {
            // Create
            const courtType = this.selectedProvider.court_types.find(c => c.id === this.courtSingleForm.court_type_id);
            if (courtType) {
              if (!courtType.courts) {
                courtType.courts = [];
              }
              courtType.courts.push({
                id: res.created,
                court_type_id: this.courtSingleForm.court_type_id,
                name: this.courtSingleForm.name,
                name_en: this.courtSingleForm.name_en
              });
            }
          }
        }

        this.courtSingleEditDialog = false;
      } else {
        Swal.fire({
          title: 'ไม่สำเร็จ',
          text: (res && res.error) || 'ไม่สามารถบันทึกข้อมูลสนามได้',
          icon: 'error',
        });
      }
    },
    async confirmDeleteSingleCourt(court) {
      const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `ต้องการลบสนาม "${court.name}" หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#d60326',
        cancelButtonColor: '#9e9e9e',
      });

      if (result.isConfirmed) {
        this.courtSingleSaving = true;
        const res = await ConsoleService.deleteCourt(court.id, court.name);
        this.courtSingleSaving = false;
        if (res && (res.status === 'Success' || res.deleted)) {
          Swal.fire({
            title: 'สำเร็จ',
            text: 'ลบสนามสำเร็จ',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false,
          });

          // Update local state directly
          if (this.selectedProvider && Array.isArray(this.selectedProvider.court_types)) {
            const courtType = this.selectedProvider.court_types.find(c => c.id === court.court_type_id);
            if (courtType && Array.isArray(courtType.courts)) {
              courtType.courts = courtType.courts.filter(item => item.id !== court.id);
            }
          }
        } else {
          Swal.fire({
            title: 'ไม่สำเร็จ',
            text: (res && res.error) || 'ไม่สามารถลบสนามได้',
            icon: 'error',
          });
        }
      }
    },
    async fetchConditions(providerId = this.selectedProviderId) {
      if (!providerId) {
        this.conditions = [];
        return;
      }
      this.conditionsLoading = true;
      try {
        const res = await ProviderConditionService.getProviderConditions({ provider_id: providerId });
        if (res && !res.error) {
          this.conditions = res || [];
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.conditionsLoading = false;
      }
    },
    openAddConditionDialog() {
      if (!this.selectedProviderId) return;
      if (this.$refs.addConditionDialog) {
        this.$refs.addConditionDialog.open();
      }
    },
    openEditConditionDialog(item) {
      if (!this.selectedProviderId) return;
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
      if (res && !res.error) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'ลบสำเร็จ',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        this.fetchConditions(this.selectedProviderId);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ลบไม่สำเร็จ',
          text: (res && res.message) || "Unable to delete.",
          confirmButtonText: 'OK',
        });
      }
    },
  },
  mounted() {
    this.fetchProviders();
    this.fetchFacilities();
  },
  beforeUnmount() {
    this.clearSelectedFiles();
    this.closeLiffConfirmDialog();
  },
  watch: {
    selectedProviderId(newVal) {
      this.courtOrdersRaw = null;
      this.fetchProviderMedia(newVal);
      this.fetchConditions(newVal);
      this.clearSelectedFiles();
      this.activeLogoType = null;
      this.activeLiffMediaType = null;
      this.closeLiffConfirmDialog();
      this.checktimeCourtIds = this.allCourts.map((court) => court.id);
      this.generatedChecktimeLink = '';
      this.generatedChecktimeLabel = 'Checktime';
      this.checktimeDialogOpen = false;
      this.courtOrderList = [];
      this.courtOrderDialogOpen = false;
      this.setDetailFormFromProvider(this.selectedProvider);
    },
  },
};
</script>

<style scoped>
.hidden-file-input {
  display: none;
}

.media-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.media-section {
  margin-bottom: 32px;
}

.detail-section {
  margin-bottom: 20px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.checktime-section {
  margin-bottom: 24px;
}

.checktime-card {
  border-color: #e0e0e0;
  border-radius: 12px;
}

.checktime-hint {
  color: #757575;
  font-size: 0.875rem;
}

.checktime-action-button {
  min-width: 180px;
}

.checktime-theme-field {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.checktime-theme-field .v-input {
  flex: 1;
}

.checktime-color-button {
  min-width: 56px;
  padding: 0;
}

.court-order-hint {
  color: #757575;
  font-size: 0.875rem;
}

.court-order-list {
  max-height: 420px;
  overflow-y: auto;
}

.court-order-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: grab;
}

.court-order-item:active {
  cursor: grabbing;
}

.court-order-handle {
  cursor: grab;
  margin-right: 8px;
  color: #9e9e9e;
}

.court-order-index {
  min-width: 20px;
  margin-right: 8px;
  font-weight: 600;
  color: #757575;
}

.checktime-color-swatch {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 6px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
}

.detail-actions--inline {
  margin-left: auto;
}

.detail-actions--hidden {
  opacity: 0;
  pointer-events: none;
}

.detail-grid {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.detail-row--fields {
  flex-wrap: nowrap;
}

.detail-row--address {
  width: 100%;
}

.detail-row--switch {
  display: inline-flex;
  width: auto;
  margin-top: 24px;
  margin-bottom: 20px;
}

.detail-field {
  flex: 0 0 auto;
}

.detail-field--text {
  width: 260px;
}

.detail-field--wide {
  flex: 1 1 auto;
  min-width: 260px;
}

.detail-switch {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  min-height: 56px;

}

.detail-switch__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  width: 140px;
  padding-left: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-switch :deep(.v-switch) {
  width: 72px;
  margin-right: 0;
}

.logo-section {
  margin-bottom: 50px;
}

.liff-media-section {
  margin-bottom: 50px;
}

.facility-section,
.conditions-section {
  margin-top: 8px;
}

.logo-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
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

.logo-hint {
  font-size: 11px;
  color: #6b7280;
}

.logo-grid {
  margin: 0;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: nowrap;
}

.liff-media-grid {
  margin: 0;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.logo-card {
  width: 200px;
  max-width: 200px;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 8px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  background: #ffffff;
}

.logo-card:hover {
  border-color: #d60326;
  box-shadow: 0 8px 18px rgba(214, 3, 38, 0.12);
  transform: translateY(-2px);
}

.logo-card--empty {
  background: #f9fafb;
}

.liff-media-card {
  min-height: 187px;
  margin: 0;
  border-radius: 14px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  background: #ffffff;
}

.liff-media-card--logo {
  width: 162px;
  max-width: 162px;
}

.liff-media-card--background {
  width: 260px;
  max-width: 260px;
}

.liff-media-card:hover {
  box-shadow: 0 8px 18px rgba(214, 3, 38, 0.12);
  transform: translateY(-2px);
}

.liff-media-thumb {
  width: 100%;
  height: 146px;
  border-radius: 10px;
  background: #ffffff;
}

.liff-media-thumb--logo {
  width: 146px;
  margin: 0 auto;
}

.liff-media-thumb--background {
  height: 137px;
}

.liff-media-placeholder {
  height: 146px;
  width: 100%;
  margin: 0 auto;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6b7280;
}

.liff-media-placeholder--logo {
  width: 146px;
}

.liff-media-placeholder--background {
  height: 137px;
}

.logo-thumb {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  border-radius: 10px;
  background: #ffffff;
}

.logo-placeholder {
  height: 100px;
  width: 100px;
  margin: 0 auto;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6b7280;
}

.logo-placeholder-text {
  font-size: 11px;
}

.logo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.logo-grid :deep(.v-col) {
  padding: 0;
  flex: 0 0 auto;
}

.liff-media-grid :deep(.v-col) {
  padding: 0;
  flex: 0 0 auto;
}

.logo-label {
  font-size: 11px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  width: 100%;
}

.media-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.media-grid {
  margin-top: 4px;
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

.media-item {
  position: relative;
  flex: 0 0 180px;
}

.media-thumb {
  border-radius: 12px;
  border: 2px solid #f0f0f0;
}

.media-thumb--pending {
  border-color: #d60326;
}

.media-preview {
  position: relative;
}

.media-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 22px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  color: #d60326;
}

.upload-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
}

.facility-total {
  margin-bottom: 8px;
}

.facility-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
}

.facility-table :deep(.v-data-table-footer),
.facility-table :deep(.v-data-table__bottom),
.facility-table :deep(.v-data-footer),
.facility-table :deep(.v-pagination) {
  display: none !important;
}

.facility-table :deep(thead tr) {
  background-color: #d60326;
}

.facility-table :deep(thead th) {
  color: #ffffff !important;
}

.facility-table :deep(th),
.facility-table :deep(td) {
  white-space: nowrap;
  padding: 4px 8px;
}

.facility-table :deep(.v-data-table__td),
.facility-table :deep(.v-data-table__th) {
  width: auto !important;
}

.facility-table :deep(thead th:first-child),
.facility-table :deep(tbody td:first-child) {
  width: 48px !important;
  padding: 2px 4px;
  text-align: center;
}


.facility-table :deep(table) {
  table-layout: auto;
  width: 100%;
}

:deep(.logo-confirm-image) {
  width: 100%;
  height: auto;
  max-height: 220px;
  object-fit: contain;
}

.liff-confirm-card {
  border-radius: 12px;
}

.liff-confirm-title {
  font-size: 15px;
  font-weight: 700;
  padding: 20px 24px 4px;
}

.liff-confirm-copy {
  font-size: 14px;
  color: #374151;
  text-align: center;
  margin-bottom: 12px;
}

.liff-confirm-frame {
  width: min(var(--preview-width), 100%);
  max-height: 65vh;
  overflow: hidden;
  border-radius: 10px;
  margin: 12px auto 0;
  background: #f8fafc;
}

.liff-confirm-frame img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.court-type-section,
.court-section {
  margin-top: 24px;
  margin-bottom: 24px;
}

.court-type-card,
.court-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.court-type-card:hover,
.court-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.court-type-name,
.court-name {
  color: #1f2937;
}

.court-type-name-en,
.court-name-en {
  color: #4b5563;
}
</style>
