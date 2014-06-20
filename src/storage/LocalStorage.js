/**
 * Class LocalStorage extends LocalStorage
 */
function LocalStorage() 
{
	this.setMany = function(map, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for ( var key in map )
					localStorage.setItem( key, map[key] );
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
					out.push( localStorage.getItem( key ) );
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
					localStorage.removeItem( key );
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
				localStorage.setItem( key, value );
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
					onSuccess(localStorage.getItem( key ));
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.unset = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				localStorage.removeItem( key );
				if (onSuccess)
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
}
LocalStorage.prototype = Storage.getEnginePrototype();
LocalStorage.prototype.constructor = LocalStorage;
Storage.registerEngine("LocalStorage", LocalStorage);
