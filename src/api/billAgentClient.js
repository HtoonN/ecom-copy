import axios from "axios";

const responseInterceptor = (response) => {
  switch (response.status) {
    case 200:
      break;
    default:
      console.log(response);
  }

  return response;
};

const errorInterceptor = (error) => {
  if (!error.response) {
    return Promise.reject(error);
  }

  switch (error.response.status) {
    case 400:
      console.error(error.response.status, error.message);
      break;
    default:
      console.error(error.response.status, error.message);
  }
  return Promise.reject(error);
};

const BASE_URL = "https://micro-services-v5bfo.ondigitalocean.app/bill-agent";

export default ({ requiresAuth } = { requiresAuth: true }) => {
  const token = localStorage.getItem("md_console");
  const options = {
    baseURL: BASE_URL,
  };

  if (requiresAuth) {
    options.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  const instance = axios.create(options);
  instance.interceptors.response.use(responseInterceptor, errorInterceptor);

  return instance;
};
