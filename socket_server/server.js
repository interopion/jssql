var fs    = require('fs');
var app   = require('http').createServer(handler);
var io    = require('socket.io')(app, {
  origins:'jsdb.dev:* http://jsdb.dev:* http://www.jsdb.dev:*'
});

var RPC_API = require("./rpc_api.js");


function handler(req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  socket.on("ping", function() {
    console.log("receive: PING");
    socket.emit("pong");
  });
  socket.on("rpc", function(e, cb) {
    console.log("receive: %j", arguments);
    if (typeof RPC_API[e.cmd] != "function")
      return cb("No such method '" + e.cmd + "'", null);
    e.args.push(function() {
      console.log("   send: %j", arguments);
      cb.apply(this, arguments);
    });
    RPC_API[e.cmd].apply(null, e.args);
  });
});

app.listen(3001);
