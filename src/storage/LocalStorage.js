/**
 * Class LocalStorage extends LocalStorage
 * @constructor
 * @extends {StorageBase}
 */
function LocalStorage() 
{
	if (!window.localStorage || !isFunction(localStorage.setItem))
		throw new Error("localStorage is not supported");

	this.setMany = function(map, next)
	{
		setTimeout(function() {
			var err = null;
			try {
				for ( var key in map )
					localStorage.setItem( key, map[key] );
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
			var err = null, out = [];
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					out.push( localStorage.getItem( keys[i] ) );
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err, out);
		}, 0);
	};

	/**
	 * Delete multiple items. If everything goes well, calls the onSuccess
	 * callback. Otherwise calls the onError callback.
	 * @param {Array} keys - An array of keys to delete
	 * @param {Function} onSuccess - This is called on success without arguments
	 * @param {Function} onError - This is called on error with the error as
	 * single argument
	 * @return {void} undefined - This method is async. so use the callbacks
	 */
	this.unsetMany = function(keys, next)
	{
		setTimeout(function() {
			var err = null;
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					localStorage.removeItem( keys[i] );
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
				localStorage.setItem( key, value );
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
				out = localStorage.getItem( key );
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err, out);
		}, 0);
	};
	
	this.unset = function(key, next) 
	{
		setTimeout(function() {
			var err = null;
			try {
				localStorage.removeItem( key );
			} catch (ex) {
				err = ex;
			}
			if (next) 
				next(err);
		}, 0);
	};
}
LocalStorage.prototype = Storage.getEnginePrototype();
LocalStorage.prototype.constructor = LocalStorage;
Storage.registerEngine("LocalStorage", LocalStorage);
