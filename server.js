
/*
const express = require('express');
const app = express();
app.use(express.json());
var cors = require('cors');
app.use(cors());
const https = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/build', express.json(), (req, res) => {
  console.log(req.body)
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
*/

const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
var cors = require('cors');
app.use(cors());

app.listen(8080, function () {
  console.log('listening on 8080')
}); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/build', (req, res) => {
  console.log('build req received');
});

app.post('/build', express.json(), (req, res) => {
  console.log(req.body)
});
