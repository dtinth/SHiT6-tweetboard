import axios from "axios";

const client = axios.create({
  baseURL: "https://tweet-party.glitch.me/",
});

const response = await client.post("/options", {
  adminKey: process.env.ADMIN_KEY,
  options: {
    whiteboard: true,
  },
});

console.log(response.data);
