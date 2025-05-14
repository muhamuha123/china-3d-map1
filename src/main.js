import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import "./style.css";
import axios from "axios";

// 本地地址
axios.defaults.baseURL = 'http://127.0.0.1:8000'

let app = createApp(App);
app.use(router).mount("#app");
