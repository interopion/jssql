/**
 * Class MemoryStorage extends StorageBase
 * @extends {StorageBase}
 */
jsSQL.registerStorageEngine("MemoryStorage", {
	
	/**
	 * @constructor
	 */
	construct : function MemoryStorage() {
		var _store = {};

		this.setMany = function(map, next)
		{
			for ( var key in map )
				_store[key] = map[key];
			next(null);
		};

		this.getMany = function(keys, next)
		{
			var out = [], key, i, l = keys.length;
			for (i = 0; i < l; i++) {
				key = keys[i];
				out.push( key in _store ? _store[key] : null );
			}
			next(null, out);
		};

		this.unsetMany = function(keys, next)
		{
			for (var i = 0, l = keys.length; i < l; i++)
				if (_store.hasOwnProperty(keys[i])) 
					delete _store[keys[i]];
			next(null);
		};
		
		this.set = function(key, value, next) 
		{
			_store[key] = value;
			next(null);
		};
		
		this.get = function(key, next) 
		{
			next(null, key in _store ? _store[key] : null);
		};
		
		this.unset = function(key, next) 
		{
			if (_store.hasOwnProperty(key)) 
				delete _store[key];
			next(null);
		};
	}
}, {
	label : "Memory Storage"
});

