var Storage = (function() {

	var engines         = {},
		engineInstances = {},
		baseProto       = {};

	each(["set", "get", "unset", "setMany", "getMany", "unsetMany"], function(name) {
		var fn = arguments[arguments.length - 1];
		fn = isFunction(fn) ? fn : function(msg) {
			throw msg;
		};
		baseProto[name] = function() {
			fn('Action "' + name + '" failed. Method not implemented.');
		};
	});

	baseProto.load = function(cb) {
		cb(null, this);
	};

	var StorageBase = Class.extend(baseProto);

	function getRegisteredEngines() {
		var out = {};
		each(engines, function(fn, name) {
			out[name] = fn.label || name;
		});
		return out;
	}

	function registerEngine(name, proto, statics) {
		if (engines[name])
			throw new Error(
				'Storage engine "' + name + '" is already registered.'
			);
		
		engines[name] = StorageBase.extend(proto, statics);
		return engines[name];
	}

	function getEngine(options, cb) {
		var storage = engineInstances[options.type], EngineClass;
		if (!storage) {
			EngineClass = engines[options.type];
			if (!EngineClass)
				throw new Error(
					'No such ttorage engine "' + options.type + '".'
				);
			storage = new EngineClass(options);
			storage.load(function(err) {
				if (err)
					return cb(err, null);
				engineInstances[options.type] = storage;
				cb(null, storage);
			});
		} else {
			cb(null, storage);
		}
	}

	jsSQL.getStorageEngine            = getEngine;
	jsSQL.registerStorageEngine       = registerEngine;
	jsSQL.getRegisteredStorageEngines = getRegisteredEngines;

	return {
		getEngine      : getEngine,
		registerEngine : registerEngine
	};

})();

/**
 * @classdesc The Storage is a singleton storage manager
 
var Storage = (function() {
	var engines = {},
		engineInstances = {};

	var proto = {};

	each(["set", "get", "unset", "setMany", "getMany", "unsetMany"], function(name) {
		var fn = arguments[arguments.length - 1];
		fn = isFunction(fn) ? fn : function(msg) {
			throw msg;
		};
		proto[name] = function() {
			fn('Action "' + name + '" failed. Method not implemented.');
		};
	});

	proto.load = function(cb) {
		cb(null, this);
	};
	
	return {
		
		getEngine : function(options, cb) {
			var storage = engineInstances[options.type];
			if (!storage) {
				storage = new engines[options.type](options);
				storage.load(function(err) {
					if (err)
						return cb(err, null);
					engineInstances[options.type] = storage;
					cb(null, storage);
				});
			} else {
				cb(null, storage);
			}
		},

		registerEngine : function(name, constructor) {
			if (engines[name])
				throw new Error(
					'Storage engine "' + name + '" is already registered.'
				);
			engines[name] = constructor;
		},

		proto : proto
	};
})();*/
