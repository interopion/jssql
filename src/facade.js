var API = {
	query  : query2,
	config : config,
	on     : events.on.bind(events),
	one    : events.one.bind(events),
	off    : events.off.bind(events),
	each   : forEachRow,
	getDatabase : function(dbName) {
		return getDatabase(dbName, true);
	},
	getTable : function(tableName, dbName) {
		return getTable(tableName, dbName, true);
	}
};

function jsSQL(opts, cb) {

	if (!cb) {
		cb = opts;
		opts = {};
	}

	mixin(CFG, opts);
	
	if (!isFunction(cb))
		return;

	if (!JSDB.SERVER.loaded) {
		JSDB.events.one("load:server", function() {
			cb(API);	
		});
	} else {
		cb(API);
	}
}

function config(options) {
	if (options === undefined)
		return mixin({}, CFG);
	mixin(CFG, options);
}

function forEachRow(sql, cb) {
	query2(sql, function(err, result) {
		if (err) throw err;

		if (result && result.rows) {
			result.rows.forEach(cb);
		}
	});
}

jsSQL.on  = API.on;
jsSQL.one = API.one;
jsSQL.off = API.off;

window.jsSQL = jsSQL;