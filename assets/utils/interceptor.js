/** @format */

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (err) => {
    try {
      const originalRequest = err.config;
      if (err.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const res = await axiosInstance.get("/refresh");
        const data = res.data;
        if (!data.success) {
          return Promise.reject("لطفا وارد حساب کاربری خود شوید");
        }
        return axiosInstance(originalRequest);
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
