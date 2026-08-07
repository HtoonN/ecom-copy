import { createRouter, createWebHistory } from "vue-router";
import LoginDialog from "../components/LoginDialog.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "console",
      component: () => import("../views/ConsoleView.vue"),
      meta: { requiresAuth: true },
    },
    { path: "/login", component: LoginDialog },
  ],
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("md_console");

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (to.path === "/login" && isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
