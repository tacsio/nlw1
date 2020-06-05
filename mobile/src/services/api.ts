import axios from 'axios';

const api = axios.create({
	baseURL: 'http://152.168.0.103:3333'
});

export default api;