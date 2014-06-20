/**
 * Class LocalStorage extends LocalStorage
 */
function LocalStorage() 
{
	this.set = function(key, value, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				localStorage.setItem( key, value );
				(onSuccess || noop)();
			} catch (ex) {
				if (onError) onError(ex);
			}
		}, 0);
	};
	
	this.get = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				(onSuccess||noop)(localStorage.getItem( key ));
			} catch (ex) {
				if (onError) onError(ex);
			}
		}, 0);
	};
	
	this.unset = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				localStorage.removeItem( key );
				(onSuccess||noop)();
			} catch (ex) {
				if (onError) onError(ex);
			}
		}, 0);
	};
}
LocalStorage.prototype = Storage.getEnginePrototype();
LocalStorage.prototype.constructor = LocalStorage;
Storage.registerEngine("LocalStorage", LocalStorage);
