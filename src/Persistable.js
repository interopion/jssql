/**
 * @constructor
 * @abstract
 * @classdesc The base class for persistable objects. Provides the basic methods
 * for key-value based async. persistance
 */
function Persistable() {}

Persistable.prototype = {
	
	storage : Storage.getEngine("LocalStorage"),
	
	toJSON : function() 
	{
		return {};
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
	
	write : function(data, onSuccess, onError)
	{
		this.storage.set(
			this.getStorageKey(), 
			JSON.stringify(data), 
			onSuccess, 
			onError 
		);
	},
	
	drop : function(onSuccess, onError)
	{
		this.storage.unset(this.getStorageKey(), onSuccess, onError);
	},
	
	save : function(onSuccess, onError) 
	{
		this.write( this.toJSON(), onSuccess, onError );
	},
	
	load : function(onSuccess, onError)
	{
		this.read(onSuccess, onError);
	}
};

