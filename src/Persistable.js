/**
 * @constructor
 * @abstract
 * @classdesc The base class for persistable objects. Provides the basic methods
 * for key-value based async. persistance
 */
function Persistable() {}

Persistable.prototype = {
	
	/**
	 * The storage engine instance used by this object.
	 * @todo This should be configurable!
	 */
	//storage : Storage.getEngine(CFG.storageEngine),

	getStorage : function() 
	{
		return Storage.getEngine(CFG.storageEngine);
	},
	
	/**
	 * The method that should generate and return the plain (JSON) 
	 * representation of the object. The subclasses must redefine it.
	 * @return {Object}
	 * @abstract
	 */
	toJSON : function() 
	{
		throw "Please implement the 'toJSON' method to return the JSON " + 
			"representation of the instance";
	},
	
	/**
	 * Each subclass must define it's own storage key which is the key used for
	 * the key-value base storage
	 * @abstract
	 * @return {String}
	 */
	getStorageKey : function()
	{
		throw "Please implement the 'getStorageKey' method to return the " + 
			"storage key";
	},
	
	/**
	 * This method attempts to read the serialized version of the instance from
	 * the storage and parse it to JS Object
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	read : function(next)
	{
		this.getStorage().get(this.getStorageKey(), function(err, data) {
			if (err)
				return next(err, null);

			try {
				data = JSON.parse(data);
			} catch (ex) {
				err = ex;
			}
			
			next(err, data);
		});
	},
	
	/**
	 * Saves the data in the storage.
	 * @param {Object|Array} data - The data to store
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	write : function(data, next)
	{
		this.getStorage().set( this.getStorageKey(),  JSON.stringify(data), next );
	},
	
	/**
	 * Deletes the corresponding data from the storage.
	 * @param {Function} onSuccess An "error-first" style callback
	 * @return {void}
	 */
	drop : function(next)
	{
		return this.getStorage().unset(this.getStorageKey(), next);
	},
	
	/**
	 * Saves the instance (as JSON) in the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	save : function(next) 
	{
		this.write( this.toJSON(), next );
	},
	
	/**
	 * Reads the corresponding data from the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	load : function(next)
	{
		this.read(next);
	}
};

