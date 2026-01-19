import axios from "axios";

// export axios config
export const AxiosConfig = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true
}) 