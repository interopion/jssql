/**
 * Class MemoryStorage extends StorageBase
 */
function MemoryStorage() {
	var _store = {};

	this.setMany = function(map, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for ( var key in map )
					_store[key] = map[key];
				if (onSuccess) 
						onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.getMany = function(keys, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				var out = [];
				for (var i = 0, l = keys.length; i < l; i++)
					out.push( _store[key] );
				if (onSuccess) 
					onSuccess( out );
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.unsetMany = function(keys, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					if (_store.hasOwnProperty(keys[i])) 
						delete _store[keys[i]];
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.set = function(key, value, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				_store[key] = val;
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.get = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				if (onSuccess) 
					onSuccess( _store[key] );
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.unset = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				if (_store.hasOwnProperty(key)) 
					delete _store[key];
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
}

MemoryStorage.prototype = Storage.getEnginePrototype();
MemoryStorage.prototype.constructor = MemoryStorage;
Storage.registerEngine("MemoryStorage", MemoryStorage);
