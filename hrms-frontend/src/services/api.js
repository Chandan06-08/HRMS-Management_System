import axios from "axios";

const baseUrl = (process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const API = axios.create({
  baseURL: `${baseUrl}/`,
});

export default API;
