/**
 * Class MemoryStorage extends StorageBase
 * @constructor
 * @extends {StorageBase}
 */
function MemoryStorage() {
	var _store = {};

	this.setMany = function(map, next)
	{
		setTimeout(function() {
			var err = null;
			try {
				for ( var key in map )
					_store[key] = map[key];
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err);
		}, 0);
	};

	this.getMany = function(keys, next)
	{
		setTimeout(function() {
			var err = null, out = [], key;
			try {
				for (var i = 0, l = keys.length; i < l; i++) {
					key = keys[i];
					out.push( key in _store ? _store[key] : null );
				}
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err, out);
		}, 0);
	};

	this.unsetMany = function(keys, next)
	{
		setTimeout(function() {
			var err = null;
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					if (_store.hasOwnProperty(keys[i])) 
						delete _store[keys[i]];
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err);
		}, 0);
	};
	
	this.set = function(key, value, next) 
	{
		setTimeout(function() {
			var err = null;
			try {
				_store[key] = value;
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err);
		}, 0);
	};
	
	this.get = function(key, next) 
	{
		setTimeout(function() {
			var err = null, out;
			try {
				out = key in _store ? _store[key] : null;
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err, out);
			return out;
		});
	};
	
	this.unset = function(key, next) 
	{
		setTimeout(function() {
			var err = null;
			try {
				if (_store.hasOwnProperty(key)) 
					delete _store[key];
			} catch (ex) {
				err = ex;
			}
			if (next) 
				next(err);
		}, 0);
	};
}

MemoryStorage.prototype = Storage.getEnginePrototype();
MemoryStorage.prototype.constructor = MemoryStorage;
Storage.registerEngine("MemoryStorage", MemoryStorage);
