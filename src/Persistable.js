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
	storage : Storage.getEngine("LocalStorage"),
	
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
	read : function(onSuccess, onError)
	{
		this.storage.get(this.getStorageKey(), function(data) {
			try {
				var result = JSON.parse(data);
				onSuccess(result);
			} catch (ex) {
				onError(ex);
			}
		}, onError);
	},
	
	/**
	 * Saves the data in the storage.
	 * @param {Object|Array} data - The data to store
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	write : function(data, onSuccess, onError)
	{
		this.storage.set(
			this.getStorageKey(), 
			JSON.stringify(data), 
			onSuccess, 
			onError 
		);
	},
	
	/**
	 * Deletes the corresponding data from the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	drop : function(onSuccess, onError)
	{
		this.storage.unset(this.getStorageKey(), onSuccess, onError);
	},
	
	/**
	 * Saves the instance (as JSON) in the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	save : function(onSuccess, onError) 
	{
		this.write( this.toJSON(), onSuccess, onError );
	},
	
	/**
	 * Reads the corresponding data from the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	load : function(onSuccess, onError)
	{
		this.read(onSuccess, onError);
	}
};

