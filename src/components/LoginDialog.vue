<template>
  <v-container class="d-flex justify-center align-center" style="height: 100vh" fluid>
    <v-card class="pa-5 transparent-card" elevation="3" max-width="400" style="width: 350px">
      <h2 class="text-center mb-4 text-primary">Login</h2>

      <v-text-field ref="username_field" v-model="username" label="Username" append-inner-icon="mdi-account" dense
        variant="outlined" class="mt-20" @keydown.enter="this.$refs.password_field.focus()"></v-text-field>

      <v-text-field ref="password_field" v-model="password" label="Password"
        :append-inner-icon="passwordVisible ? 'mdi-eye' : 'mdi-eye-off'" :type="passwordVisible ? 'text' : 'password'"
        @click:append-inner="togglePasswordVisibility" dense variant="outlined" @keydown.enter="login"></v-text-field>

      <v-btn class="mt-2" color="#d60326" block large @click="login" :loading="loading">
        Login
      </v-btn>
    </v-card>
  </v-container>
</template>

<script>
import Swal from "sweetalert2";
import ConsoleService from "../api/ConsoleService";

export default {
  name: "logindialog",
  data() {
    return {
      username: "",
      password: "",
      rememberMe: false,
      passwordVisible: false,
      loading: false,
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
    async login() {
      this.loading = true;
      const res = await ConsoleService.login({
        username: this.username,
        password: this.password,
      });

      if (res) {
        console.log("Log in");
        localStorage.setItem("md_console", res.token?.token);

        // Save user permissions
        if (res.user && res.user.permissions) {
          localStorage.setItem("md_console_permissions", JSON.stringify(res.user.permissions));
          localStorage.setItem("md_console_user", JSON.stringify(res.user));
        } else {
          // Default or old behavior
          localStorage.setItem("md_console_permissions", JSON.stringify([]));
        }

        this.$router.push("/");
      } else {
        this.showLoginFailedAlert();
      }
      this.loading = false;
    },
    showLoginFailedAlert() {
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#d60326",
      });
    },
  },
  mounted() {
    this.$refs.username_field.focus();
  },
};
</script>

<style scoped>
.transparent-card {
  background: rgba(255, 255, 255, 0.128);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: none;
}

h2 {
  color: #ffffff;
}

.text-center {
  color: #ffffff;
}

.v-text-field input {
  color: #000;
}
</style>
