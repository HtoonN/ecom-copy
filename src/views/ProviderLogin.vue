<template>
    <v-card>
        <v-card-title>Provider Login</v-card-title>
        <v-card-text>
            <v-row class="my-2">
                <v-col :cols="6">
                    <v-text-field 
                        label="ค้นหา" 
                        variant="solo" 
                        hide-details
                        @update:model-value="updateSearch"
                        clearable
                        v-model="search"
                        append-inner-icon="mdi-magnify"
                    >
                    </v-text-field>
                </v-col>
                <v-col cols="12">
                    <v-data-table-server 
                        :headers="headers" 
                        :items="pagination.data" 
                        :itemsLength="pagination.total" 
                        height="calc(100dvh - 350px)"
                        :loading="loading"
                    >
                        <template v-slot:bottom>
                            <v-pagination
                                v-model="pagination.page"
                                :length="pagination.lastPage"
                                @next="updatePage"
                                @prev="updatePage"
                                total-visible="5"
                            >
                                <template v-slot:item="item">
                                    <v-btn
                                        :key="item"
                                        fab
                                        small
                                        class="ma-2 elevation-0"
                                        @click="updatePage(item.page)"
                                        :color="pagination.page == item.page ? 'grey-lighten-2' : ''">
                                        {{ item.page  }}
                                    </v-btn>
                                </template>
                            </v-pagination>
                        </template>
                        <template v-slot:item.action = {item}>
                            <v-btn color="primary" @click="loginToArena(item, true)">Login POS</v-btn>
                            <v-btn color="primary" @click="loginToArena(item, false)" class="ml-2">Get Token</v-btn>
                            <v-btn variant="outlined" color="primary" @click="openChangePassword(item)" class="ml-2">Change Password</v-btn>
                        </template>
                        <template v-slot:item.username = {item}>
                            {{ item.url_nickname || item.phone_number || '-' }}
                        </template>
                    </v-data-table-server>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
    <copy-token-dialog ref="copy_token"/>
    <change-password-dialog
        v-model="changePasswordDialogOpen"
        :provider="selectedProvider"
        :loading="changePasswordLoading"
        @submit="confirmChangePassword"
    />
  
</template>

<script>
import Swal from 'sweetalert2';
import ConsoleService from '../api/ConsoleService';
import localService from '../api/localService';
import copyTokenDialog from '../components/copyTokenDialog.vue';
import changePasswordDialog from '../components/ChangePasswordDialog.vue';

export default {
  components: { copyTokenDialog, changePasswordDialog },
    name:'providerLogin',
    data(){
        return {
            username:'',
            token: null,
            targetUrl: "https://pos-d1b.pages.dev/warehouse",
            search:'',
            loading: false,
            headers: [
                { title: 'ID', key: 'id', sortable: false, align: 'left' },
                { title: 'ชื่อสนาม', key: 'fullname', sortable: false },
                { title: 'Username', key: 'username', sortable: false },
                { title: ' ', key: 'action', sortable: false, align: 'end' },
            ],
            pagination: {
                page: 1,
                perPage: 20,
                data: [],
                lastPage:1,
                total: 0,
            },
            changePasswordDialogOpen: false,
            selectedProvider: null,
            changePasswordLoading: false,
        }
    },
    methods:{
        updatePage(pageNo){
            this.fetchData({page: pageNo || 1, search: this.search || ''});
        },
        async fetchData(query){
            this.loading = true;
            // this.pagination = await ConsoleService.getProviderLogin(query);
            const res  = await localService.getProviders(query);
            this.pagination = res.data;
            this.loading = false;
        },
        goToArenaWithToken(token, providerName = "Token"){
            this.$refs.copy_token.open(token, providerName);
        },

        goToPosWithToken(token){
            const url = `${this.targetUrl}?pos_token=${token}`;
            console.log(url);
            window.open(url, "_blank");
        },

        updateSearch(search){
            this.fetchData({ page:1, search });
        },
        openChangePassword(item){
            this.selectedProvider = item;
            this.changePasswordDialogOpen = true;
        },
        async confirmChangePassword(newPassword){
            if (!this.selectedProvider) {
                return;
            }

            const providerName = this.selectedProvider.fullname || this.selectedProvider.url_nickname || this.selectedProvider.phone_number || '-';
            const confirmation = await Swal.fire({
                title: "Confirm Change Password",
                text: `Change password for ${providerName}?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Change",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#d60326",
            });

            if (!confirmation.isConfirmed) {
                return;
            }

            this.changePasswordLoading = true;
            const res = await localService.changeProviderPassword({
                id: this.selectedProvider.id,
                password: newPassword,
            });
            this.changePasswordLoading = false;

            if (res.success) {
                Swal.fire({
                    title: "Success",
                    text: "Password updated.",
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#d60326",
                });
                this.changePasswordDialogOpen = false;
            } else {
                Swal.fire({
                    title: "Failed",
                    text: res.message || "Unable to update password.",
                    icon: "error",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#d60326",
                });
            }
        },
        async loginToArena(item, pos = false) {
            const { fullname } = item;
            const preusername = item.url_nickname || item.phone_number;
            const id = item.id;
            const providerName = fullname || item.url_nickname || item.phone_number || "Token";

            if (!pos) {
                await this.performProviderLogin(id, pos, providerName);
                return;
            }

            const { value: formValues } = await Swal.fire({
                title: 'Generate Token',
                html: `
                    <p>(${fullname})</p>
                    <input id="swal-username" class="swal2-input" value="${preusername}">
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Generate",
                cancelButtonText: "ยกเลิก",
                confirmButtonColor: "#d60326",
                focusConfirm: true,
                preConfirm: () => {
                    const username = document.getElementById("swal-username").value;

                    if (!username) {
                        Swal.showValidationMessage("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"); // Please fill in username & password
                    }
                    return { username };
                },
            });

            if (formValues) {
                await this.performProviderLogin(id, pos, providerName);
            }
        },
        async performProviderLogin(id, pos, providerName) {
            const payload = { id };

            Swal.fire({
                title: "กำลังเข้าสู่ระบบ...", // Logging in...
                text: "กรุณารอสักครู่",       // Please wait
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const res = await localService.providerLogin(payload);

            if (res.success) {
                Swal.close();
                if (pos) {
                    this.goToPosWithToken(res.data.token);
                } else {
                    this.goToArenaWithToken(res.data.token, providerName);
                }
            } else {
                Swal.fire({
                    title: "ไม่สำเร็จ",
                    text: res.message,
                    icon: "error",
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#d60326",
                });
            }
        },
    },
    async mounted(){
        this.fetchData({page: 1, search: ''});
    }

}
</script>

<style>

</style>
