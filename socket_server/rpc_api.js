var fs    = require('fs');
var async = require('async');
var exec  = require('child_process').exec;

// Read
// =============================================================================
function readServer(serverName, cb) {
	fs.readFile(
		serverName + "/" + serverName + ".json", 
		{ encoding : "utf8" }, 
		function(err, data) {
			if (err) {
				console.error(err);
				//return cb(null, '{"databases":{}}');
			}
			cb(null, data || null);
		}
	);
}

function readDatabase(serverName, dbName, cb) {
	fs.readFile(
		serverName + "/" + dbName + "/" + dbName + ".json", 
		{ encoding : "utf8" }, 
		cb
	);
}

function readTable(serverName, dbName, tableName, cb) {
	fs.readFile(
		serverName + "/" + dbName + "/" + tableName + "/" + tableName + ".json", 
		{ encoding : "utf8" }, 
		cb
	);
}

function readRow(serverName, dbName, tableName, rowID, cb) {
	fs.readFile(
		serverName + "/" + dbName + "/" + tableName + "/" + rowID + ".json", 
		{ encoding : "utf8" }, 
		cb
	);
}

// Write
// =============================================================================
function writeServer(serverName, data, cb) {
	writeFile(
		serverName + "/" + serverName + ".json", 
		data, 
		cb
	);
}

function writeDatabase(serverName, dbName, data, cb) {
	writeFile(
		serverName + "/" + dbName + "/" + dbName + ".json", 
		data, 
		cb
	);
}

function writeTable(serverName, dbName, tableName, data, cb) {
	writeFile(
		serverName + "/" + dbName + "/" + tableName + "/" + tableName + ".json", 
		data, 
		cb
	);
}

function writeRow(serverName, dbName, tableName, rowID, data, cb) {
	writeFile(
		serverName + "/" + dbName + "/" + tableName + "/" + rowID + ".json", 
		data, 
		cb
	);
}

// Delete
// =============================================================================
function deleteServer(serverName, cb) {
	exec('rm -rf ' + serverName, cb);
}

function deleteDatabase(serverName, dbName, cb) {
	exec('rm -rf ' + serverName + "/" + dbName, cb);
}

function deleteTable(serverName, dbName, tableName, cb) {
	exec('rm -rf ' + serverName + "/" + dbName + "/" + tableName, cb);
}

function deleteRow(serverName, dbName, tableName, rowID, cb) {
	fs.unlink(
		serverName + "/" + dbName + "/" + tableName + "/" + rowID + ".json",
		function(err) {
			if (err) {
				if (err.code == "ENOENT")
					return cb(null, null);
				cb(err, null);
			}
			cb(null, null);
		}
	);
}



function getFolder(path, cb) {
	fs.mkdir(path, 0777, function(err) {
		if (err) {
			if (err.code == 'EEXIST') {
				cb(null, true);
			} else {
				console.error(err);
				cb(err, false);
			}
		} else {
			cb(null, true);
		}
	});
}

function writeFile(path, value, next) {//console.log(path);
	var tokens = path.split("/"),
		file   = tokens.pop(),
		buff   = [process.cwd()];
	// JSDB/world/City.json
	async.eachSeries(tokens, function(name, cb) {
		buff.push(name); 
		getFolder(buff.join("/"), cb);
	}, function(err) {
		fs.writeFile(path, value, next);
	});
}

function keyToPath(key) {
	var toks = key.split("."),
		len  = toks.length,
		file = toks[len - 1];

	switch (len) {
		// server file   -> JSDB/JSDB.json
		case 1:
			return toks.join("/") + "/" + file + ".json";

		// database file -> JSDB/world/world.json
		case 2:
			return toks.join("/") + "/" + file + ".json";

		// table file    -> JSDB/world/City/City.json
		case 3:
			return toks.join("/") + "/" + file + ".json";

		// row file      -> JSDB/world/City/1.json
		case 4:
			return toks.join("/") + ".json";
	}

	throw "Invalid key";
}

exports.set = function(key, value, cb) {
	writeFile(keyToPath(key), value, function(err) {
		if (err) 
			return cb(err, null);
		return cb(null, value);
	});
};

exports.get = function(key, cb) {
	var t = key.split(".");
	switch (t.length) {
		case 1:
			return readServer(t[0], cb);
		case 2:
			return readDatabase(t[0], t[1], cb);
		case 3:
			return readTable(t[0], t[1], t[2], cb);
		case 4:
			return readRow(t[0], t[1], t[2], t[3], cb);
	}
	cb(new Error("Invalid key: " + key));
};

exports.unset = function(key, cb) {
	var t = key.split(".");
	switch (t.length) {
		case 1:
			return deleteServer(t[0], cb);
		case 2:
			return deleteDatabase(t[0], t[1], cb);
		case 3:
			return deleteTable(t[0], t[1], t[2], cb);
		case 4:
			return deleteRow(t[0], t[1], t[2], t[3], cb);
	}
	cb(new Error("Invalid key: " + key));

	//fs.unlink(keyToPath(key), function(err) {
	//	return cb(err || null, null);
	//});
};

exports.setMany = function(map, cb) {
	var workers = {};
	for (var key in map) {
		workers[key] = (function(key, value) {
			return function(cb) {
				exports.set(key, value, cb);
			};
		})(key, map[key]);
	}
	async.parallel(workers, cb);
};

exports.getMany = function(keys, cb) {
	async.map(keys, exports.get, cb);
};

exports.unsetMany = function(keys, cb) {
	async.map(keys, exports.unset, cb);
};
