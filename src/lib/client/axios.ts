import axios from "axios";
import { apiBaseUrl } from "../get-env";


const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default api;
