const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const PORT = process.env.PORT || 3000;

app.use((_, res, next) => {
  res.set("Cross-Origin-Opener-Policy", "same-origin");
  res.set("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.static(path.join(__dirname, "../dist")));

http
  .createServer({}, app)
  .listen(PORT)
  .on("listening", () => {
    console.log("Server is running on port " + PORT);
  });
