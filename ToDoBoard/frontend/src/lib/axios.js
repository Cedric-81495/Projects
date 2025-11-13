import axios from "axios"

// In production, there is no localhost so we have to make this dynamin
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

const api = axios.create({
   baseURL: BASE_URL,
});

export default api;