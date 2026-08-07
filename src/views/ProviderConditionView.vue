<template>
    <v-card flat>
        <v-card-title class="d-flex justify-space-between align-center">
            <span>Provider Condition</span>
            <v-btn color="primary" @click="openAddDialog">
                <v-icon left>mdi-plus</v-icon>
                เพิ่มข้อมูล
            </v-btn>
        </v-card-title>
        <v-card-text>
            <v-text-field v-model="search" label="ค้นหา" prepend-inner-icon="mdi-magnify" variant="outlined"
                density="compact" class="mb-4" style="max-width: 300px;" />
            <v-data-table :headers="headers" :items="filteredItems" :loading="loading" class="elevation-1">
                <template v-slot:item.provider="{ item }">
                    {{ item.provider?.fullname || '-' }}
                </template>
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
                    <v-btn icon size="small" color="primary" variant="text" @click="openEditDialog(item)">
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon size="small" color="error" variant="text" @click="confirmDelete(item)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>
            </v-data-table>
        </v-card-text>

        <AddProviderCondition ref="addDialog" @refresh="fetchData" />
    </v-card>
</template>

<script>
import ProviderConditionService from '../api/providerConditionTexts';
import AddProviderCondition from '../components/addProviderCondition.vue';
import Swal from 'sweetalert2';

export default {
    name: 'ProviderConditionView',
    components: {
        AddProviderCondition,
    },
    data() {
        return {
            loading: false,
            search: '',
            items: [],
            headers: [
                { title: 'Provider', key: 'provider.fullname', sortable: true },
                { title: 'Type', key: 'type', sortable: true },
                { title: 'Text (TH)', key: 'text', sortable: false },
                { title: 'Text (EN)', key: 'text_en', sortable: false },
                { title: 'จัดการ', key: 'actions', sortable: false, align: 'center' },
            ],
        };
    },
    computed: {
        filteredItems() {
            if (!this.search) return this.items;
            const searchLower = this.search.toLowerCase();
            return this.items.filter(item =>
                item.provider?.fullname?.toLowerCase().includes(searchLower) ||
                item.type?.toLowerCase().includes(searchLower) ||
                item.text?.toLowerCase().includes(searchLower) ||
                item.text_en?.toLowerCase().includes(searchLower)
            );
        },
    },
    methods: {
        async fetchData() {
            this.loading = true;
            const res = await ProviderConditionService.getProviderConditions();
            if (!res.error) {
                this.items = res;
            }
            this.loading = false;
        },
        openAddDialog() {
            this.$refs.addDialog.open();
        },
        openEditDialog(item) {
            this.$refs.addDialog.open(item);
        },
        async confirmDelete(item) {
            const result = await Swal.fire({
                title: 'ยืนยันการลบ?',
                text: `ต้องการลบข้อมูลของ ${item.provider?.fullname || 'รายการนี้'} หรือไม่?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'ลบ',
                cancelButtonText: 'ยกเลิก',
                confirmButtonColor: '#d60326',
                cancelButtonColor: '#9e9e9e',
            });

            if (result.isConfirmed) {
                await this.deleteItem(item.id);
            }
        },
        async deleteItem(id) {
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
                this.fetchData();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ลบไม่สำเร็จ',
                    text: res.message,
                    confirmButtonText: 'OK',
                });
            }
        },
    },
    mounted() {
        this.fetchData();
    },
};
</script>
