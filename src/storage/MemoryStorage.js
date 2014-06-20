/**
 * Class MemoryStorage extends StorageBase
 */
function MemoryStorage() {
	var _store = {};
	
	this.set = function(key, value, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				_store[key] = val;
				(onSuccess || noop)();
			} catch (ex) {
				(onError||noop)(ex);
			}
		}, 0);
	};
	
	this.get = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				(onSuccess||noop)(_store[key]);
			} catch (ex) {
				(onError||noop)(ex);
			}
		}, 0);
	};
	
	this.unset = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				if (_store.hasOwnProperty(key)) delete _store[key];
				(onSuccess||noop)();
			} catch (ex) {
				(onError||noop)(ex);
			}
		}, 0);
	};
}

MemoryStorage.prototype = Storage.getEnginePrototype();
MemoryStorage.prototype.constructor = MemoryStorage;
Storage.registerEngine("MemoryStorage", MemoryStorage);
