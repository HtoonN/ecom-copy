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

export default ({ requiresAuth }) => {
  const tempToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjQsImlhdCI6MTc0NzE5MzcwMywic3ViIjoiU3VwZXJBZG1pbiJ9.wtDOY0HQabKBPa6nGufbh2J-lzrzRI3VSq6pidVQgqA`;
  const token = localStorage.getItem("md_console");
  const isDevelopment = process.env.NODE_ENV === 'development';
  // const baseURL = isDevelopment ? 'http://localhost:3001' : 'https://staging-servers-karwn.ondigitalocean.app';
  const baseURL = 'https://staging-servers-karwn.ondigitalocean.app';
  var options = {
    baseURL,
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
