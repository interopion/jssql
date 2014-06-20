function Persistable() {}

Persistable.prototype = {
	
	storage : Storage.getEngine("LocalStorage"),
	
	toJSON : function() 
	{
		return {};
	},
	
	getStorageKey : function()
	{
		throw "Please implement the 'getStorageKey' method to return the " + 
			"storage key";
	},
	
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

