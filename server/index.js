var express = require('express');
var app = express();
const path = require("path");
const https = require('https');
const fs = require('fs');

const options = {
	key: fs.readFileSync(path.join(__dirname, "./key.pem")),
	cert: fs.readFileSync(path.join(__dirname, "./cert.pem"))
};

app.use((req, res, next) => {
	res.set("Cross-Origin-Opener-Policy", "same-origin");
	res.set("Cross-Origin-Embedder-Policy", "require-corp");
	next();
});

app.use(express.static(path.join(__dirname, "../")));

https.createServer(options, app).listen(3000);