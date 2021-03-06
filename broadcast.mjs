import axios from "axios";

const client = axios.create({
  baseURL: "https://tweet-party.glitch.me/",
});

const response = await client.post("/broadcast", {
  adminKey: process.env.ADMIN_KEY,
  payload: process.argv[2],
});

console.log(response.data);
