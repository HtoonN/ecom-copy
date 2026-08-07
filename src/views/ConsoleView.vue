<template>
  <v-layout class="rounded rounded-md border">
    <v-app-bar :elevation="2" color="primary">
      <template v-slot:prepend>
        <img src="../assets/icons/logo.png" width="50px" />
      </template>
      <v-app-bar-title>Matchday Console</v-app-bar-title>
      <template v-slot:append>
        <v-btn @click="confirmLogout">Log out</v-btn>
      </template>
    </v-app-bar>
    <v-navigation-drawer permanent>
      <v-expansion-panels :static="true" variant="accordion" density="dense" style="width: 260px; margin-top: 1px"
        v-model="panel" multiple>
        <v-expansion-panel>
          <v-expansion-panel-title color="primary">
            GENERAL ADMIN
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-for="g_tab in general_tabs" :key="g_tab.value" class="my-1">
              <v-list-item v-if="hasPermission(g_tab.permission)" :value="g_tab.value" class="custom"
                @click="changeTab(g_tab.value)" :active="g_tab.value === tab" active-class="custom-active">
                <v-list-item-title>{{ g_tab.name }}</v-list-item-title>
              </v-list-item>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel density="dense">
          <v-expansion-panel-title color="primary">
            SUPERVISOR
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-for="g_tab in supervisior_tabs" :key="g_tab.value" class="my-1">
              <v-list-item v-if="hasPermission(g_tab.permission)" :value="g_tab.value" class="custom"
                @click="changeTab(g_tab.value)" :active="g_tab.value === tab" active-class="custom-active">
                <v-list-item-title>{{ g_tab.name }}</v-list-item-title>
              </v-list-item>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-navigation-drawer>

    <v-main class="d-flex align-center justify-center" height="300">
      <v-container fluid>
        <div style="flex-grow: 1; overflow-y: auto">
          <v-window v-model="tab">
            <v-window-item value="depa-dashboard">
              <DepaDashboardView />
            </v-window-item>
            <v-window-item value="console-affiliate">
              <ConsoleAffiliateView />
            </v-window-item>
            <v-window-item value="events">
              <EventsView />
            </v-window-item>
            <v-window-item value="free_courts">
              <FreeCourtsView />
            </v-window-item>
            <v-window-item value="promo_notification">
              <PromoNotification />
            </v-window-item>
            <v-window-item value="account">
              <AccountView />
            </v-window-item>
            <v-window-item value="import">
              <ImportView />
            </v-window-item>
            <v-window-item value="liffsetting">
              <LiffSettingView />
            </v-window-item>
            <v-window-item value="manage-provider-packages">
              <manageProviderPackages />
            </v-window-item>
            <v-window-item value="provider-setting">
              <ProviderSetting />
            </v-window-item>
            <v-window-item value="account2">
              <Account2View />
            </v-window-item>
            <v-window-item value="account2-v2">
              <Account2ViewV2 />
            </v-window-item>
            <v-window-item value="account-v2">
              <AccountViewV2 />
            </v-window-item>
            <v-window-item value="create_promotion">
              <create-promotion />
            </v-window-item>
            <v-window-item value="promotion_used">
              <PromotionUsed />
            </v-window-item>
            <v-window-item value="provider_tax">
              <ProviderTax />
            </v-window-item>
            <v-window-item value="insurance_sales_report">
              <InsuranceSalesReport />
            </v-window-item>
            <v-window-item value="provider_login">
              <ProviderLogin />
            </v-window-item>
            <v-window-item value="provider-media">
              <ProviderMedia />
            </v-window-item>
            <v-window-item value="provider-staff">
              <ProviderStaff />
            </v-window-item>
            <v-window-item value="manage-role-permission">
              <ManageRolePermissionView />
            </v-window-item>
            <v-window-item value="book-scope">
              <BookScope />
            </v-window-item>
            <v-window-item value="provider-condition">
              <ProviderConditionView />
            </v-window-item>
            <v-window-item value="manage-match">
              <ManageMatchView />
            </v-window-item>
            <v-window-item value="map-tournament">
              <MapTournament />
            </v-window-item>
            <v-window-item value="admin-management">
              <AdminManagementView />
            </v-window-item>
            <v-window-item value="role-permission">
              <RolePermissionView />
            </v-window-item>
          </v-window>
        </div>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script>
import EventsView from "@/views/EventsView.vue";
import FreeCourtsView from "./FreeCourtsView.vue";
import PromoNotification from "./PromoNotification.vue";
import AccountView from "./AccountView.vue";
import ImportView from "./ImportView.vue";
import LiffSettingView from "./LiffSettingView.vue";
import ManageProviderPackages from "./ManageProviderPackages.vue";
import ProviderSetting from "./ProviderSetting.vue";
import Swal from "sweetalert2";
import Account2View from "./Account2View.vue";
import Account2ViewV2 from "./Account2ViewV2.vue";
import AccountViewV2 from "./AccountViewV2.vue";
import CreatePromotion from './createPromotion.vue';
import PromotionUsed from "./PromotionUsed.vue";
import ProviderTax from './ProviderTax.vue';
import InsuranceSalesReport from "./InsuranceSalesReport.vue";
import ProviderLogin from "./ProviderLogin.vue";
import ProviderMedia from "./ProviderMedia.vue";
import ProviderStaff from "./ProviderStaff.vue";
import BookScope from "./BookScope.vue"
import ProviderConditionView from "./ProviderConditionView.vue"
import ManageMatchView from "./ManageMatchView.vue"
import MapTournament from "./MapTournament.vue";
import DepaDashboardView from "./DepaDashboardView.vue";
import ConsoleAffiliateView from "./ConsoleAffiliateView.vue";
import AdminManagementView from "./AdminManagementView.vue";
import RolePermissionView from "./RolePermissionView.vue";
import ManageRolePermissionView from "./ManageRolePermissionView.vue";

export default {
  components: {
    EventsView,
    BookScope,
    FreeCourtsView,
    PromoNotification,
    AccountView,
    ImportView,
    LiffSettingView,
    ManageProviderPackages,
    ProviderSetting,
    Account2View,
    Account2ViewV2,
    AccountViewV2,
    CreatePromotion,
    PromotionUsed,
    ProviderTax,
    InsuranceSalesReport,
    ProviderLogin,
    ProviderMedia,
    ProviderStaff,
    ProviderConditionView,
    ManageMatchView,
    MapTournament,
    DepaDashboardView,
    ConsoleAffiliateView,
    AdminManagementView,
    RolePermissionView,
    ManageRolePermissionView,
  },
  data() {
    return {
      expension_panel: [],
      panel: [0, 1],
      tab: "provider-setting",
      general_tabs: [
        {
          value: "depa-dashboard",
          name: "DEPA Dashboard",
          permission: "menu_depa_dashboard"
        },
        // {
        //   value: "console-affiliate",
        //   name: "Console Affiliate",
        //   permission: "menu_console_affiliate"
        // },
        {
          value: "free_courts",
          name: "Free Courts",
          permission: "menu_free_courts"
        },
        {
          value: "import",
          name: "Import",
          permission: "menu_import"
        },
        {
          value: "liffsetting",
          name: "LIFF Setting",
          permission: "menu_liff_setting"
        },
        {
          value: "manage-provider-packages",
          name: "Manage Provider Packages",
          permission: "menu_provider_packages"
        },
        {
          value: "provider-setting",
          name: "Provider Settings",
          permission: "menu_provider_settings"
        },
        {
          value: "provider-media",
          name: "Provider Media",
          permission: "menu_provider_media"
        },
        {
          value: "provider-staff",
          name: "Provider Staff",
          permission: "menu_provider_media"
        },
        {
          value: "manage-role-permission",
          name: "Manage Role and Permission",
          permission: "menu_manage_admins"
        },
        {
          value: "book-scope",
          name: "Book Scope",
          permission: "menu_book_scope"
        },
        // {
        //   value: "provider-condition",
        //   name: "Provider Condition",
        //   permission: "menu_provider_condition"
        // },
        {
          value: "manage-match",
          name: "Manage Match",
          permission: "menu_manage_match"
        },
      ],
      supervisior_tabs: [
        {
          value: "events",
          name: "Events",
          permission: "menu_events"
        },
        {
          value: "account",
          name: "Settlement สนาม",
          permission: "menu_settlement"
        },
        {
          value: "account-v2",
          name: "Settlement สนามV2",
          permission: "menu_settlement"
        },
        {
          value: "account2",
          name: "All Settlement",
          permission: "menu_all_settlement"
        },
        {
          value: "account2-v2",
          name: "All SettlementV2",
          permission: "menu_all_settlement"
        },
        {
          value: "promo_notification",
          name: "Promo Notification",
          permission: "menu_promo_notification"
        },
        {
          value: "create_promotion",
          name: "Create Promotion",
          permission: "menu_create_promotion"
        },
        {
          value: "promotion_used",
          name: "Promotion Used",
          permission: "menu_create_promotion"
        },
        // {
        //   value: "provider_tax",
        //   name: "Provider Tax",
        //   permission: "menu_provider_tax"
        // },
        {
          value: "insurance_sales_report",
          name: "Insurance Sales Report",
          permission: "menu_insurance_sales_report"
        },
        {
          value: "provider_login",
          name: "Provider Login",
          permission: "menu_provider_login"
        },
        {
          value: "map-tournament",
          name: "Tournaments Insurance",
          permission: "menu_tournaments_insurance"
        },
        {
          value: "admin-management",
          name: "Admin Management",
          permission: "menu_manage_admins"
        },
        {
          value: "role-permission",
          name: "Role & Permission",
          permission: "menu_manage_admins"
        },
      ],
      userPermissions: [],
    };
  },
  methods: {
    changeTab(tab) {
      this.tab = tab;
      this.$router.push({ query: { tab: tab } });
    },
    hasPermission(permission) {
      if (!this.userPermissions || this.userPermissions.length === 0) return true; // fallback or superadmin handling if needed, adjust if strictly blocking
      return this.userPermissions.includes(permission);
    },
    checkParams() {
      let requestedTab = this.$route.query.tab || this.tab;

      const allTabs = [...this.general_tabs, ...this.supervisior_tabs];
      const targetTabDef = allTabs.find(t => t.value === requestedTab);

      if (!targetTabDef || !this.hasPermission(targetTabDef.permission)) {
        const firstAvailable = allTabs.find(t => this.hasPermission(t.permission));
        if (firstAvailable) {
          requestedTab = firstAvailable.value;
        }
      }

      this.tab = requestedTab;

      if (this.$route.query.tab !== requestedTab) {
        this.$router.replace({ query: { tab: requestedTab } });
      }
    },
    async confirmLogout() {
      const result = await Swal.fire({
        title: "คุณแน่ใจหรือไม่?",
        text: "คุณต้องการออกจากระบบ",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ใช่, ออกจากระบบ",
        cancelButtonText: "ยกเลิก",
        reverseButtons: true,
        confirmButtonColor: "#d60326",
        cancelButtonColor: "#9e9e9e",
      });

      if (result.isConfirmed) {
        this.logout();
      }
    },
    logout() {
      localStorage.removeItem("md_console");
      this.$router.push("/login");
    },
  },
  mounted() {
    // Load permissions from localStorage
    const savedPermissions = localStorage.getItem("md_console_permissions");
    if (savedPermissions) {
      try {
        this.userPermissions = JSON.parse(savedPermissions);
      } catch (e) {
        console.error("Error parsing permissions", e);
        this.userPermissions = [];
      }
    }

    this.checkParams();
    console.log("Current Tab:", this.tab);
  },
  watch: {
    '$route.query.tab': function (newTab) {
      if (newTab && newTab !== this.tab) {
        this.checkParams();
      }
    }
  }
};
</script>
<style scoped>
.v-tab.v-tab--selected {
  font-weight: bold;
}

.custom {
  color: transparent;
}

/* Optional: ensure title inside list-item also gets colored */
.custom-active .v-list-item-title {
  color: #d60326 !important;
}

.v-list-item-title {
  color: rgb(48, 47, 47);
}
</style>

