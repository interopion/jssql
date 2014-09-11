(function() {
	function _setMany(map) {
		for ( var key in map )
			localStorage.setItem( key, JSON.stringify(map[key]) );
	}

	function _getMany(keys) {
		var out = [];
		for (var i = 0, l = keys.length; i < l; i++)
			out.push( JSON.parse(localStorage.getItem( keys[i] )) );
		return out;
	}

	function _unsetMany(keys) {
		for (var i = 0, l = keys.length; i < l; i++)
			localStorage.removeItem( keys[i] );
	}

	function _set(key, value) {
		localStorage.setItem( key, JSON.stringify(value) );
	}

	function _get(key) {
		return JSON.parse(localStorage.getItem( key ));
	}

	function _unset(key) {
		localStorage.removeItem( key );
	}

	/**
	 * Class LocalStorage extends StorageBase
	 * @extends {StorageBase}
	 */
	jsSQL.registerStorageEngine("LocalStorage", {

		/**
		 * @constructor
		 */
		construct : function LocalStorage() {
			if (!window.localStorage || !isFunction(localStorage.setItem))
				throw new Error("localStorage is not supported");
		},

		setMany : function(map, next) {
			nextTick(function() {
				var err = null;
				try {
					_setMany(map);
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err);
			});
		},

		getMany : function(keys, next) {
			nextTick(function() {
				var err = null, out = [];
				try {
					out = _getMany(keys);
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err, out);
			});
		},

		/**
		 * Delete multiple items. If everything goes well, calls the onSuccess
		 * callback. Otherwise calls the onError callback.
		 * @param {Array} keys - An array of keys to delete
		 * @param {Function} onSuccess - This is called on success without arguments
		 * @param {Function} onError - This is called on error with the error as
		 * single argument
		 * @return {void} undefined - This method is async. so use the callbacks
		 */
		unsetMany : function(keys, next) {
			nextTick(function() {
				var err = null;
				try {
					_unsetMany(keys);
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err);
			});
		},

		set : function(key, value, next) {
			nextTick(function() {
				var err = null;
				try {
					_set( key, value );
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err);
			});
		},
		
		get : function(key, next) {
			nextTick(function() {
				var err = null, out;
				try {
					out = _get( key );
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err, out);
			});
		},
		
		unset : function(key, next) {
			nextTick(function() {
				var err = null;
				try {
					_unset( key );
				} catch (ex) {
					err = ex;
				}
				//if (next) 
					next(err);
			});
		}
	}, {
		label : "Local Storage"
	});
})();