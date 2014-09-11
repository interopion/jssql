/**
 * Class SessionStorage
 */
jsSQL.registerStorageEngine("SessionStorage", {

	/**
	 * @constructor
	 */
	construct : function SessionStorage() {
		if (!window.sessionStorage || typeof sessionStorage.setItem != "function")
			throw new Error("sessionStorage is not supported");
	},

	setMany : function(map, next) {
		jsSQL.nextTick(function() {
			var err = null;
			try {
				for ( var key in map )
					sessionStorage.setItem( key, JSON.stringify(map[key]) );
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err);
		});
	},

	getMany : function(keys, next) {
		jsSQL.nextTick(function() {
			var err = null, out = [];
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					out.push( JSON.parse(sessionStorage.getItem( keys[i] )) );
			} catch (ex) {
				err = ex;
			}
			if (next)
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
		jsSQL.nextTick(function() {
			var err = null;
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					sessionStorage.removeItem( keys[i] );
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err);
		});
	},

	set : function(key, value, next) {
		jsSQL.nextTick(function() {
			var err = null;
			try {
				sessionStorage.setItem( key, JSON.stringify(value) );
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err);
		});
	},
	
	get : function(key, next) {
		jsSQL.nextTick(function() {
			var err = null, out;
			try {
				out = JSON.parse(sessionStorage.getItem( key ));
			} catch (ex) {
				err = ex;
			}
			if (next)
				next(err, out);
		});
	},
	
	unset : function(key, next) {
		jsSQL.nextTick(function() {
			var err = null;
			try {
				sessionStorage.removeItem( key );
			} catch (ex) {
				err = ex;
			}
			if (next) 
				next(err);
		});
	}
}, {
	label : "Session Storage"
});
