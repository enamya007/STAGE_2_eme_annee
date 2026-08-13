import axios from 'axios';
import {AxiosInstance} from 'axios';

const instance_api:AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
});
export default instance_api;