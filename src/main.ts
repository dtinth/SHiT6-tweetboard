import Admin from "./Admin.svelte";
import App from "./App.svelte";
import "./index.css";
import { queryParams } from "./queryParams";

const target = document.getElementById("app");
const app =
  queryParams.get("mode") === "admin"
    ? new Admin({ target: target })
    : new App({ target: target });

export default app;
