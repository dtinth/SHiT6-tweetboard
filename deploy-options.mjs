import axios from "axios";

const client = axios.create({
  baseURL: "https://tweet-party.glitch.me/",
});

const response = await client.post("/options", {
  adminKey: process.env.ADMIN_KEY,
  options: {
    // http://gg.gg/11m3k6
    iframe: "https://www.tldraw.com/r/1656677360571",
    // iframe:
    //   "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FZ1aNyKVqR0ZPGv86z6tYLh%2FFigJam%3Fnode-id%3D0%253A1",
  },
});

console.log(response.data);
