<template>
  <div>
    <v-card>
      <v-card-title class="pa-0">

        <v-row class="px-4 pt-4 pb-1" align="center" dense>
          <v-col cols="8" class="d-flex align-left">
            <p>จับคู่รหัสประกันกับรายการ Tournament</p>
          </v-col>
          <v-col cols="4" class="d-flex text-right">
            <v-btn color="warning" variant="outlined" @click="cleanupExpired" :loading="cleaningUp">
              <v-icon class="mr-1" size="small">mdi-broom</v-icon>
              ล้างหมดอายุ
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="success" variant="outlined" @click="openImportDialog">
              <v-icon class="mr-1" size="small">mdi-file-upload</v-icon>
              นำเข้า
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="openMappingDialog">
              <v-icon class="mr-1" size="small">mdi-plus</v-icon>
              สร้างประกัน
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <!-- Filters Row -->

      <v-row class="px-4 pt-4 pb-1" align="center" dense>
        <v-col cols="4">
          <v-autocomplete v-model="tournamentFilter" :items="tournamentOptions" item-title="label" item-value="value"
            label="รายการ Tournament" variant="outlined" density="compact" hide-details clearable
            @update:model-value="filterData"></v-autocomplete>
        </v-col>
        <v-col cols="2">
          <v-select v-model="periodFilter" :items="periodOptions" item-title="label" item-value="value" label="ช่วงเวลา"
            variant="outlined" density="compact" hide-details @update:model-value="onPeriodChange"></v-select>
        </v-col>
        <v-col cols="2">
          <v-text-field label="ค้นหารหัสประกัน" v-model="searchText" variant="outlined" density="compact" hide-details
            append-inner-icon="mdi-magnify" @update:model-value="filterData" clearable></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-select v-model="statusFilter" :items="statusOptions" item-title="label" item-value="value" label="สถานะ"
            variant="outlined" density="compact" hide-details @update:model-value="filterData"></v-select>
        </v-col>
        <v-col cols="2">
          <v-btn color="blue" @click="refreshData" variant="outlined" density="compact" icon="mdi-refresh"></v-btn>
        </v-col>
      </v-row>

      <!-- Table -->
      <v-data-table :headers="headers" :items="filteredItems" item-key="id" height="calc(100dvh - 300px)" fixed-header
        :loading="loading">
        <template #item.index="{ index }">
          {{ index + 1 }}
        </template>
        <template #item.date="{ item }">
          {{ formatDate(item.date_start) === formatDate(item.date_end) ? formatDate(item.date_start) :
            `${formatDate(item.date_start)} - ${formatDate(item.date_end)}` }}
        </template>
        <template #item.activated="{ item }">
          <v-chip :color="item.activated ? 'success' : 'grey'" size="small">
            {{ item.activated ? 'ใช้งาน' : 'ไม่ใช้งาน' }}
          </v-chip>
        </template>
        <template #item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center">
            <v-tooltip :text="item.activated ? 'ไม่สามารถส่งอีเมลได้ เนื่องจากรหัสถูกใช้งานแล้ว' : 'ส่งอีเมล'"
              location="top">
              <template v-slot:activator="{ props }">
                <v-btn color="primary" size="small" variant="text" v-bind="props" @click="openEmailDialog(item)"
                  :disabled="!!item.activated">
                  <v-icon>mdi-email-fast</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip :text="item.activated ? 'ไม่สามารถลบได้ เนื่องจากรหัสถูกใช้งานแล้ว' : 'ลบ'" location="top">
              <template v-slot:activator="{ props }">
                <span v-bind="props">
                  <v-btn color="error" size="small" variant="text" @click="confirmDelete(item)"
                    :disabled="!!item.activated">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </span>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create Mapping Dialog -->
    <v-dialog v-model="mappingDialog" persistent max-width="900">
      <v-card>
        <v-card-title class="text-h6" style="border-bottom: 1px solid #ccc">
          จับคู่รหัสประกันกับ Tournament
        </v-card-title>

        <v-card-text class="pt-4">
          <!-- Tournament Selection -->
          <v-autocomplete v-model="selectedTournament" :items="tournaments" item-title="displayName" item-value="id"
            label="เลือกรายการ Tournament" variant="outlined" :loading="loadingTournaments" return-object
            class="mb-4"></v-autocomplete>

          <!-- Insurance Codes Selection with Table -->
          <div class="insurance-codes-section">
            <p class="text-subtitle-1 font-weight-medium mb-2">เลือกรหัสประกัน</p>

            <!-- Search Box with Multiple Code Support -->
            <v-textarea v-model="codeSearchInput" label="ค้นหารหัสประกัน (คั่นด้วย comma หรือ Enter)" variant="outlined"
              rows="2" auto-grow placeholder="เช่น 6S4101, 6S7402, 6S5470 หรือ paste จาก Excel"
              @update:model-value="filterAvailableCodes" hide-details class="mb-2"></v-textarea>

            <!-- Action Buttons -->
            <div class="d-flex align-center gap-2 mb-2">
              <v-btn size="small" color="primary" variant="outlined" @click="selectAllFiltered"
                :disabled="filteredAvailableCodes.length === 0">
                <v-icon class="mr-1">mdi-checkbox-multiple-marked</v-icon>
                เลือกทั้งหมดที่ค้นเจอ ({{ filteredAvailableCodes.length }})
              </v-btn>
              <v-btn size="small" color="secondary" variant="outlined" @click="deselectAll"
                :disabled="selectedCodes.length === 0">
                <v-icon class="mr-1">mdi-checkbox-multiple-blank-outline</v-icon>
                ยกเลิกทั้งหมด
              </v-btn>
              <v-btn size="small" variant="text" @click="clearSearch">
                <v-icon class="mr-1">mdi-close</v-icon>
                ล้างการค้นหา
              </v-btn>
            </div>

            <!-- Insurance Codes Table -->
            <v-data-table :headers="dialogCodesHeaders" :items="filteredAvailableCodes" :loading="loadingCodes"
              height="300px" fixed-header density="compact" item-key="id" class="codes-selection-table"
              :items-per-page="-1" hide-default-footer>
              <template #item="{ item, index }">
                <tr :class="{
                  'selected-row': isCodeSelected(item.id),
                  'cursor-pointer': true
                }" @click="handleRowClick($event, item, index)">
                  <td style="width: 50px">
                    <v-checkbox-btn :model-value="isCodeSelected(item.id)"
                      @update:model-value="toggleCodeSelection(item)" @click.stop></v-checkbox-btn>
                  </td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.company_name || '-' }}</td>
                  <td>{{ item.bundle_name || '-' }}</td>
                </tr>
              </template>
            </v-data-table>

            <!-- Selected Count -->
            <div class="mt-3 pa-2 bg-blue-lighten-5 rounded">
              <v-icon color="primary" class="mr-1">mdi-check-circle</v-icon>
              จำนวนรหัสประกันที่เลือก: <strong class="text-primary">{{ selectedCodes.length }}</strong> รายการ
              <span v-if="selectedCodes.length > 0" class="text-caption text-grey ml-2">
                (กด Shift+Click เพื่อเลือกช่วง)
              </span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn color="primary" @click="createMapping" :disabled="!selectedTournament || !selectedCodes.length"
            :loading="creating">
            บันทึก
          </v-btn>
          <v-btn variant="text" @click="closeMappingDialog">ยกเลิก</v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Import Dialog -->
    <v-dialog v-model="importDialog" persistent max-width="600">
      <v-card>
        <v-card-title class="text-h6" style="border-bottom: 1px solid #ccc">
          นำเข้ารหัสประกัน (Excel/CSV)
        </v-card-title>

        <v-card-text class="pt-4">
          <v-file-input v-model="importFile" label="เลือกไฟล์ Excel หรือ CSV" accept=".xlsx,.xls,.csv"
            variant="outlined" prepend-icon="mdi-file-excel" show-size></v-file-input>

          <v-alert type="info" variant="tonal" class="mt-2">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="mb-1"><strong>รูปแบบไฟล์ที่รองรับ:</strong></p>
                <ul class="ml-4">
                  <li>insurance_company_id (ห้ามว่าง)</li>
                  <li>insurance_bundle_id (ว่างได้)</li>
                  <li>code (ห้ามว่าง, ต้องไม่ซ้ำ)</li>
                </ul>
              </div>
              <v-btn color="primary" variant="outlined" size="small" @click="downloadTemplate">
                <v-icon class="mr-1">mdi-download</v-icon>
                ดาวน์โหลด Template
              </v-btn>
            </div>
          </v-alert>

          <!-- Import Results -->
          <div v-if="importResults" class="mt-4">
            <v-alert v-if="importResults.imported > 0" type="success" variant="tonal" class="mb-2">
              นำเข้าสำเร็จ: {{ importResults.imported }} รายการ
            </v-alert>
            <v-alert v-if="importResults.failed > 0" type="error" variant="tonal">
              ไม่สำเร็จ: {{ importResults.failed }} รายการ
              <ul class="ml-4 mt-2">
                <li v-for="(err, idx) in importResults.results.errors" :key="idx">
                  แถว {{ err.row }}: {{ err.message }}
                </li>
              </ul>
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn color="success" @click="importCodes" :disabled="!importFile" :loading="importing">
            นำเข้า
          </v-btn>
          <v-btn variant="text" @click="closeImportDialog">ปิด</v-btn>

        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Send Email Dialog -->
    <v-dialog v-model="emailDialog" max-width="550" persistent>
      <v-card>


        <v-card-text class="pt-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <div><strong>รหัส:</strong> {{ emailItem?.insurance_code }}</div>
            <div><strong>รายการ:</strong> {{ emailItem?.tournament_name }}</div>
          </v-alert>

          <v-text-field v-model="emailTo" label="อีเมลผู้รับ" variant="outlined" prepend-inner-icon="mdi-email"
            placeholder="example@email.com" :rules="emailRules" :error-messages="emailError"
            @update:model-value="emailError = ''" autofocus></v-text-field>
        </v-card-text>

        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" @click="emailDialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="sendEmail" :loading="sendingEmail">
            <v-icon class="mr-1">mdi-send</v-icon>
            ส่งอีเมล
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Insurance Codes Table Section -->
    <v-card class="mt-4">
      <v-card-title>
        <p>รหัสประกัน Tournament</p>
      </v-card-title>

      <v-row class="pa-4 align-center" dense>
        <v-col cols="3">
          <v-text-field label="ค้นหารหัส" v-model="codesSearchText" variant="solo" hide-details
            append-inner-icon="mdi-magnify" @update:model-value="filterCodesData" clearable></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-select v-model="codesStatusFilter" :items="statusOptions" item-title="label" item-value="value"
            label="สถานะ" variant="solo" hide-details @update:model-value="filterCodesData"></v-select>
        </v-col>
        <v-col cols="7" class="d-flex justify-end">
          <v-btn color="blue" @click="fetchInsuranceCodes" variant="outlined">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <v-data-table :headers="codesHeaders" :items="filteredCodes" item-key="id" height="400px" fixed-header
        :loading="loadingCodes">
        <template #item.index="{ index }">
          {{ index + 1 }}
        </template>
        <template #item.activated="{ item }">
          <v-chip :color="item.activated ? 'success' : 'grey'" size="small">
            {{ item.activated ? 'ใช้งาน' : 'ไม่ใช้งาน' }}
          </v-chip>
        </template>
        <template #item.activated_at="{ item }">
          {{ formatDateTime(item.activated_at) }}
        </template>
        <template #item.created_at="{ item }">
          {{ formatDateTime(item.created_at) }}
        </template>
        <template #item.actions="{ item }">
          <v-tooltip :text="item.activated ? 'ไม่สามารถลบได้ เนื่องจากรหัสถูกใช้งานแล้ว' : 'ลบ'" location="top">
            <template v-slot:activator="{ props }">
              <span v-bind="props">
                <v-btn color="error" size="small" variant="text" @click="confirmDeleteCode(item)"
                  :disabled="!!item.activated">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </span>
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import Swal from 'sweetalert2'
import moment from 'moment'
import InsuranceTournamentService from '../api/InsuranceTournamentService'

export default {
  data() {
    return {
      searchText: '',
      tournamentFilter: null,
      tournamentOptions: [],
      periodFilter: 'ongoing',
      periodOptions: [
        { label: 'ทั้งหมด', value: 'all' },
        { label: 'กำลังแข่ง', value: 'ongoing' },
        { label: 'จบไปแล้ว', value: 'ended' },
      ],
      statusFilter: 'all',
      statusOptions: [
        { label: 'ทั้งหมด', value: 'all' },
        { label: 'รหัสที่ถูกใช้งาน', value: 'activated' },
        { label: 'รหัสที่ไม่ถูกใช้', value: 'not_activated' },
      ],
      items: [],
      filteredItems: [],
      loading: false,
      headers: [
        { title: 'ลำดับ', key: 'index', width: '80px' },
        { title: 'ชื่อรายการ', key: 'tournament_name' },
        { title: 'สนามที่จัด', key: 'provider_name' },
        { title: 'วันที่แข่งขัน', key: 'date' },
        { title: 'รหัสประกัน', key: 'insurance_code' },
        { title: 'สถานะ', key: 'activated', width: '120px' },
        { title: 'วันที่สร้าง', key: 'created_at', width: '180px' },
        { title: 'จัดการ', key: 'actions', width: '120px', sortable: false },
      ],

      // Dialog state
      mappingDialog: false,
      tournaments: [],
      availableCodes: [],
      selectedTournament: null,
      selectedCodes: [],
      loadingTournaments: false,
      loadingCodes: false,
      creating: false,
      cleaningUp: false,

      // Email dialog state
      emailDialog: false,
      emailItem: null,
      emailTo: '',
      emailError: '',
      sendingEmail: false,
      emailRules: [
        v => !!v || 'กรุณากรอกอีเมล',
        v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง',
      ],

      // Import state
      importDialog: false,
      importFile: null,
      importing: false,
      importResults: null,

      // Insurance codes table state
      insuranceCodes: [],
      filteredCodes: [],
      loadingCodes: false,
      codesSearchText: '',
      codesStatusFilter: 'all',
      codesHeaders: [
        { title: 'ลำดับ', key: 'index', width: '70px' },
        { title: 'บริษัทประกันภัย', key: 'company_name' },
        { title: 'แพคเกจ', key: 'bundle_name' },
        { title: 'ชื่อ-นามสกุล', key: 'user_fullname' },
        { title: 'ผู้เอาประกัน', key: 'applicant_fullname' },
        { title: 'รหัส', key: 'code', width: '150px' },
        { title: 'สถานะ', key: 'activated', width: '100px' },
        { title: 'วันที่เปิดใช้งาน', key: 'activated_at', width: '150px' },
        { title: 'วันที่สร้าง', key: 'created_at', width: '150px' },
        { title: 'จัดการ', key: 'actions', width: '80px', sortable: false },
      ],

      // Dialog enhanced selection state
      codeSearchInput: '',
      filteredAvailableCodes: [],
      lastClickedIndex: null,
      dialogCodesHeaders: [
        { title: '', key: 'checkbox', width: '50px', sortable: false },
        { title: 'รหัสประกัน', key: 'code' },
        { title: 'บริษัท', key: 'company_name' },
        { title: 'แพคเกจ', key: 'bundle_name' },
      ],
    }
  },

  methods: {
    formatDate(date) {
      return date ? moment(date).format('DD/MM/YYYY') : '-'
    },

    formatDateTime(date) {
      return date ? moment(date).format('DD/MM/YYYY HH:mm') : '-'
    },

    filterData() {
      let result = this.items

      // Filter by period (date_end)
      if (this.periodFilter && this.periodFilter !== 'all') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (this.periodFilter === 'ongoing') {
          result = result.filter(item => {
            const endDate = new Date(item.date_end)
            endDate.setHours(23, 59, 59, 999)
            return endDate >= today
          })
        } else if (this.periodFilter === 'ended') {
          result = result.filter(item => {
            const endDate = new Date(item.date_end)
            endDate.setHours(23, 59, 59, 999)
            return endDate < today
          })
        }
      }

      // Filter by tournament
      if (this.tournamentFilter) {
        result = result.filter(item => item.tournament_name === this.tournamentFilter)
      }

      // Filter by status
      if (this.statusFilter === 'activated') {
        result = result.filter(item => item.activated === 1)
      } else if (this.statusFilter === 'not_activated') {
        result = result.filter(item => item.activated === 0)
      }

      // Filter by search text
      if (this.searchText) {
        const search = this.searchText.toLowerCase()
        result = result.filter(item =>
          (item.tournament_name && item.tournament_name.toLowerCase().includes(search)) ||
          (item.provider_name && item.provider_name.toLowerCase().includes(search)) ||
          (item.insurance_code && item.insurance_code.toLowerCase().includes(search))
        )
      }

      this.filteredItems = result
    },

    async fetchMappings() {
      this.loading = true
      try {
        this.items = await InsuranceTournamentService.getMappedTournaments()

        // Build tournament options for autocomplete filter
        this.buildTournamentOptions()

        // Apply default filter
        this.filterData()
      } catch (error) {
        console.error('Failed to fetch mappings:', error)
        Swal.fire('Error', 'ไม่สามารถดึงข้อมูลได้', 'error')
      } finally {
        this.loading = false
      }
    },

    buildTournamentOptions() {
      // Filter items by period first, then extract unique tournament names
      let source = this.items
      if (this.periodFilter && this.periodFilter !== 'all') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (this.periodFilter === 'ongoing') {
          source = source.filter(item => {
            const endDate = new Date(item.date_end)
            endDate.setHours(23, 59, 59, 999)
            return endDate >= today
          })
        } else if (this.periodFilter === 'ended') {
          source = source.filter(item => {
            const endDate = new Date(item.date_end)
            endDate.setHours(23, 59, 59, 999)
            return endDate < today
          })
        }
      }
      const uniqueTournaments = [...new Set(source.map(item => item.tournament_name).filter(Boolean))]
      this.tournamentOptions = uniqueTournaments.sort().map(name => ({ label: name, value: name }))
    },

    onPeriodChange() {
      // Clear tournament selection since options will change
      this.tournamentFilter = null
      this.buildTournamentOptions()
      this.filterData()
    },

    async openMappingDialog() {
      this.mappingDialog = true
      this.selectedTournament = null
      this.selectedCodes = []

      // Load tournaments and codes
      this.loadingTournaments = true
      this.loadingCodes = true

      try {
        const [tournaments, codes] = await Promise.all([
          InsuranceTournamentService.getTournaments(),
          InsuranceTournamentService.getAvailableInsuranceCodes()
        ])

        // Format tournament display names and filter out expired tournaments
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        this.tournaments = tournaments
          .filter(t => {
            // Only show tournaments where date_end hasn't passed
            const endDate = new Date(t.date_end)
            endDate.setHours(23, 59, 59, 999)
            return endDate >= today
          })
          .map(t => ({
            ...t,
            displayName: `${t.name} (${this.formatDate(t.date_start)} - ${this.formatDate(t.date_end)})`
          }))

        // Create lookup map from insuranceCodes (which has company_name, bundle_name, and tournament_name)
        const codeInfoMap = new Map()
        this.filteredItems.forEach(ic => {
          codeInfoMap.set(ic.insurance_code, {
            company_name: ic.company_name || '-',
            bundle_name: ic.bundle_name || '-',
            tournament_name: ic.tournament_name // null means not mapped yet
          })
        })
        // Filter out already-mapped codes (tournament_name is not null) and enrich with company/bundle info
        this.availableCodes = codes
          .filter(code => {
            const info = codeInfoMap.get(code.code)
            // Keep only codes where tournament_name is null/undefined (not mapped yet)
            return !info || !info.tournament_name
          })
          .map(code => {
            const info = codeInfoMap.get(code.code) || {}
            return {
              ...code,
              company_name: info.company_name || code.company_name || '-',
              bundle_name: info.bundle_name || code.bundle_name || '-'
            }
          })
        //console.log('Available codes:', this.availableCodes)
        this.filteredAvailableCodes = this.availableCodes
      } catch (error) {
        console.error('Failed to load dialog data:', error)
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error')
      } finally {
        this.loadingTournaments = false
        this.loadingCodes = false
      }
    },

    closeMappingDialog() {
      this.mappingDialog = false
      this.selectedTournament = null
      this.selectedCodes = []
      this.codeSearchInput = ''
      this.filteredAvailableCodes = []
      this.lastClickedIndex = null
    },

    async createMapping() {
      if (!this.selectedTournament || !this.selectedCodes.length) return

      this.creating = true

      try {

        await InsuranceTournamentService.createMapping({
          tournament_id: this.selectedTournament.id,
          insurance_code_ids: this.selectedCodes
        })

        Swal.fire('สำเร็จ', 'จับคู่รหัสประกันเรียบร้อย', 'success')
        this.closeMappingDialog()
        this.fetchMappings()
      } catch (error) {
        console.error('Failed to create mapping:', error)
        Swal.fire('Error', 'ไม่สามารถจับคู่ได้', 'error')
      } finally {
        this.creating = false
      }
    },

    // Enhanced selection helper methods
    filterAvailableCodes() {
      if (!this.codeSearchInput || !this.codeSearchInput.trim()) {
        this.filteredAvailableCodes = this.availableCodes
        return
      }

      // Split by comma, newline, or space and clean up
      const searchTerms = this.codeSearchInput
        .split(/[,\n\r]+/)
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 0)

      if (searchTerms.length === 0) {
        this.filteredAvailableCodes = this.availableCodes
        return
      }

      this.filteredAvailableCodes = this.availableCodes.filter(code => {
        const codeValue = (code.code || '').toLowerCase()
        // Match if any search term matches the code
        return searchTerms.some(term => codeValue.includes(term))
      })
    },

    selectAllFiltered() {
      this.filteredAvailableCodes.forEach(code => {
        if (!this.selectedCodes.includes(code.id)) {
          this.selectedCodes.push(code.id)
        }
      })
    },

    deselectAll() {
      this.selectedCodes = []
    },

    clearSearch() {
      this.codeSearchInput = ''
      this.filteredAvailableCodes = this.availableCodes
    },

    isCodeSelected(id) {
      return this.selectedCodes.includes(id)
    },

    toggleCodeSelection(item) {
      const index = this.selectedCodes.indexOf(item.id)
      if (index === -1) {
        this.selectedCodes.push(item.id)
      } else {
        this.selectedCodes.splice(index, 1)
      }
    },

    handleRowClick(event, item, index) {
      if (event.shiftKey && this.lastClickedIndex !== null) {
        // Shift+Click: select range
        const start = Math.min(this.lastClickedIndex, index)
        const end = Math.max(this.lastClickedIndex, index)

        for (let i = start; i <= end; i++) {
          const code = this.filteredAvailableCodes[i]
          if (code && !this.selectedCodes.includes(code.id)) {
            this.selectedCodes.push(code.id)
          }
        }
      } else {
        // Normal click: toggle selection
        this.toggleCodeSelection(item)
      }
      this.lastClickedIndex = index
    },
    openEmailDialog(item) {
      this.emailItem = item
      this.emailTo = ''
      this.emailError = ''
      this.emailDialog = true
    },

    async sendEmail() {
      // Validate email
      if (!this.emailTo) {
        this.emailError = 'กรุณากรอกอีเมล'
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.emailTo)) {
        this.emailError = 'รูปแบบอีเมลไม่ถูกต้อง'
        return
      }

      this.sendingEmail = true
      try {
        await InsuranceTournamentService.insuranceEmailTournament(
          this.emailTo,
          this.emailItem.insurance_code,
          this.emailItem.tournament_name
        )

        Swal.fire('สำเร็จ', `ส่งอีเมลไปยัง ${this.emailTo} เรียบร้อย`, 'success')
        this.emailDialog = false
      } catch (error) {
        console.error('Failed to send email:', error)
        Swal.fire('Error', 'ไม่สามารถส่งอีเมลได้', 'error')
      } finally {
        this.sendingEmail = false
      }
    },

    async confirmDelete(item) {
      if (item.activated) {
        Swal.fire('ไม่สามารถลบได้', 'รหัสประกันนี้ถูกใช้งานแล้ว ไม่สามารถลบได้', 'warning')
        return
      }

      const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `ต้องการลบรหัสประกัน ${item.insurance_code} ออกจาก ${item.tournament_name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#d33',
      })

      if (result.isConfirmed) {
        await this.deleteMapping(item.id)
      }
    },

    async deleteMapping(id) {
      try {
        await InsuranceTournamentService.deleteMapping(id)
        Swal.fire('สำเร็จ', 'ลบการจับคู่เรียบร้อย', 'success')
        this.fetchMappings()
      } catch (error) {
        console.error('Failed to delete mapping:', error)
        Swal.fire('Error', 'ไม่สามารถลบได้', 'error')
      }
    },

    refreshData() {
      this.searchText = ''
      this.tournamentFilter = null
      this.periodFilter = 'ongoing'
      this.statusFilter = 'all'
      this.fetchMappings()
    },

    async cleanupExpired() {
      const result = await Swal.fire({
        title: 'ยืนยันการลบรายการหมดอายุ?',
        text: 'ระบบจะลบ mapping ของ tournament ที่หมดอายุแล้วและประกันยังไม่ได้ใช้งาน',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ff9800',
      })

      if (!result.isConfirmed) return

      this.cleaningUp = true
      try {
        const res = await InsuranceTournamentService.cleanupExpiredMappings()
        Swal.fire('สำเร็จ', res.message, 'success')
        this.fetchMappings()
      } catch (error) {
        console.error('Failed to cleanup:', error)
        Swal.fire('Error', 'ไม่สามารถลบรายการหมดอายุได้', 'error')
      } finally {
        this.cleaningUp = false
      }
    },

    // Import methods
    openImportDialog() {
      this.importDialog = true
      this.importFile = null
      this.importResults = null
    },

    closeImportDialog() {
      this.importDialog = false
      this.importFile = null
      this.importResults = null
    },

    downloadTemplate() {
      // Create CSV content with headers and example row
      const headers = ['insurance_company_id', 'insurance_bundle_id', 'code']
      const exampleRow = ['1', '', 'TRN001']

      const csvContent = [
        headers.join(','),
        exampleRow.join(',')
      ].join('\n')

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', 'insurance_codes_template.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    async importCodes() {
      if (!this.importFile) return

      this.importing = true
      this.importResults = null

      try {
        // Vuetify 3 v-file-input returns array of files
        const file = Array.isArray(this.importFile) ? this.importFile[0] : this.importFile
        const result = await InsuranceTournamentService.importInsuranceCodes(file)
        this.importResults = result

        if (result.imported > 0) {
          Swal.fire('สำเร็จ', `นำเข้ารหัสประกันเรียบร้อย ${result.imported} รายการ`, 'success')
          this.fetchInsuranceCodes()
          this.importFile = null // Clear file input after success
        }
      } catch (error) {
        console.error('Failed to import:', error)
        Swal.fire('Error', 'ไม่สามารถนำเข้าข้อมูลได้', 'error')
      } finally {
        this.importing = false
      }
    },

    // Insurance codes table methods
    async fetchInsuranceCodes() {
      this.loadingCodes = true
      try {
        this.insuranceCodes = await InsuranceTournamentService.getInsuranceCodes()
        this.filteredCodes = this.insuranceCodes
      } catch (error) {
        console.error('Failed to fetch insurance codes:', error)
        Swal.fire('Error', 'ไม่สามารถดึงข้อมูลรหัสประกันได้', 'error')
      } finally {
        this.loadingCodes = false
      }
    },

    filterCodesData() {
      let result = this.insuranceCodes

      // Filter by status
      if (this.codesStatusFilter === 'activated') {
        result = result.filter(item => item.activated === 1)
      } else if (this.codesStatusFilter === 'not_activated') {
        result = result.filter(item => item.activated === 0)
      }

      // Filter by search text
      if (this.codesSearchText) {
        const search = this.codesSearchText.toLowerCase()
        result = result.filter(item =>
          (item.code && item.code.toLowerCase().includes(search)) ||
          (item.company_name && item.company_name.toLowerCase().includes(search)) ||
          (item.bundle_name && item.bundle_name.toLowerCase().includes(search)) ||
          (item.user_fullname && item.user_fullname.toLowerCase().includes(search)) ||
          (item.applicant_fullname && item.applicant_fullname.toLowerCase().includes(search))
        )
      }

      this.filteredCodes = result
    },

    async confirmDeleteCode(item) {
      if (item.activated) {
        Swal.fire('ไม่สามารถลบได้', 'รหัสประกันนี้ถูกใช้งานแล้ว ไม่สามารถลบได้', 'warning')
        return
      }

      const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `ต้องการลบรหัสประกัน ${item.code}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#d33',
      })

      if (result.isConfirmed) {
        await this.deleteCode(item.id)
      }
    },

    async deleteCode(id) {
      try {
        await InsuranceTournamentService.deleteInsuranceCode(id)
        Swal.fire('สำเร็จ', 'ลบรหัสประกันเรียบร้อย', 'success')
        this.fetchInsuranceCodes()
      } catch (error) {
        console.error('Failed to delete code:', error)
        Swal.fire('Error', 'ไม่สามารถลบรหัสประกันได้', 'error')
      }
    },
  },

  mounted() {
    this.fetchMappings()
    this.fetchInsuranceCodes()
  }
}
</script>

<style scoped>
.codes-selection-table .selected-row {
  background-color: #e3f2fd !important;
}

.codes-selection-table .cursor-pointer {
  cursor: pointer;
}

.codes-selection-table .cursor-pointer:hover {
  background-color: #f5f5f5;
}

.codes-selection-table .selected-row:hover {
  background-color: #bbdefb !important;
}

.insurance-codes-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}
</style>
