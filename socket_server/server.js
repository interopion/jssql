var fs    = require('fs');
var async = require('async');
var app   = require('http').createServer(handler);
var io    = require('socket.io')(app, {
  origins:'jsdb.dev:* http://jsdb.dev:* http://www.jsdb.dev:*'
});

var RPC_API = {
  
  set : function(key, value, cb) {
    fs.writeFile('./databases/' + key + '.json', value, function(err) {
      if (err) 
        return cb(err, null);
      return cb(null, value);
    });
  },

  get : function(key, cb) {
    fs.readFile('./databases/' + key + '.json', function(err, data) {
      if (err) 
        return cb(err, null);
      return cb(null, data);
    });
  },

  unset : function(key, cb) {
    fs.unlink('./databases/' + key + '.json', function(err) {
      return cb(err || null, null);
    });
  },

  setMany : function(map, cb) {
    var workers = {};
    for (var key in map) {
      workers[key] = (function(key, value) {
        return function(cb) {
          fs.writeFile('./databases/' + key + '.json', value, function(err) {
            cb(err, value);
          });
        };
      })(key, map[key]);
    }
    async.parallel(workers, cb);
  },

  getMany : function(keys, cb) {
    async.map(keys, function(key, next) {
      fs.readFile('./databases/' + key + '.json', function(err, data) {
        if (err) 
          return next(err, null);
        next(null, data);
      });
    }, function(err, out) {
      cb(err, err ? null : out);
    });
  },

  unsetMany : function(keys, cb) {
    async.map(keys, function(key, next) {
      fs.unlink('./databases/' + key + '.json', function(err) {
        if (err) 
          return next(err, null);
        next(null, null);
      });
    }, function(err, out) {
      cb(err, null);
    });
  }
};


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
  socket.on("rpc", function(e, cb) {
    if (typeof RPC_API[e.cmd] != "function")
      return cb("No such method '" + e.cmd + "'", null);
    e.args.push(cb);
    RPC_API[e.cmd].apply(null, e.args);
  });
});

app.listen(3001);
