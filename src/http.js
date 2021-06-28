import axios from 'axios';
import { message } from 'antd';
const getToken = () => {
  return localStorage.getItem('Authorization')
}

axios.defaults.timeout = 50000;
//返回其他状态吗
axios.defaults.validateStatus = function(status) {
  return status >= 200 && status <= 500; // 默认的
};

//跨域请求，允许保存cookie
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  config => {
    const meta = config.meta || {};
    const isToken = meta.isToken;
    if (!isToken) {
      config.headers['Authorization'] = `Bearer ${getToken()}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
//HTTPresponse拦截
axios.interceptors.response.use(
  res => {
    const newToken = res.headers.authorization;
    if (newToken) {
      localStorage.setItem('Authorization', newToken)
    }
    const statusCode = res.data.retCode;
    const messageText = res.data.retCode || '未知错误';
    // 如果是401则跳转到登录页面
    if(res.status === 401) {
      window.location.href = "/login"
    }
    // if (statusCode === 401) store.dispatch('FedLogOut').then(() => router.push({path: '/login'}));
    // if (statusCode === 2000) router.push({ path: '/login' });
    // 如果请求为非200否者默认统一处理
    if (statusCode !== 'succeeded') {
      if (res.data) {
        return res;
      }
      message.warning(messageText);
      return Promise.reject(new Error(messageText));
    }
    return res;
  },
  error => {
    return Promise.reject(new Error(error));
  }
);

export default axios;