import axios from 'axios';
import {AxiosInstance} from 'axios';

const intance_api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 5000,
});
export default intance_api;