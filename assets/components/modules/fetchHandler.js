/** @format */

// ---------------------------
// fetch با JSON
// ---------------------------
import axiosInstance from "../../utils/interceptor.js";

const fetchHandler = async (url, method, body = null, headers = null) => {
  const config = { headers };
  let res;
  if (method.toLowerCase() === "get") {
    res = await axiosInstance.get(url, config);
  } else {
    res = await axiosInstance[method](url, body, config);
  }
  return res.data;
};


export default fetchHandler;
