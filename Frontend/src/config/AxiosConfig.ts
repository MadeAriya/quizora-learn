import axios from "axios";
import { supabase } from "./SupabaseConfig";

// export axios config
export const AxiosConfig = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true
});

AxiosConfig.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);