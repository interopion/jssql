/**
 * @constructor
 * @abstract
 * @classdesc The base class for persistable objects. Provides the basic 
 * methods for key-value based async. persistance and some base methods for
 * composite operations
 */
var Persistable = Class.extend({

	/**
	 * @constructor
	 */
	construct : function(label, parent) {
		
		this.label = label || "persistable";

		/**
		 * The storage engine instance used by this object.
		 */
		this.storage = parent ? parent.storage : null;

		/**
		 * This flag is managed internally and shows if the instance has unsaved
		 * changes
		 * @type {Boolean}
		 */
		this._isDirty = false;

		this.children = {};

		this.parent = parent || null;

		this.bubbleTarget = this.parent;

		// Make it observable
		Observer.call(this);
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

	getPatch : function() 
	{
		var hasChanges = false, out = {}, name, child, patch;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = this.toJSON();//JSON.stringify(this.toJSON());
		}

		for ( name in this.children) {
			child = this.children[name];
			patch = child.getPatch();
			if (patch) {
				hasChanges = true;
				mixin(out, patch);
			}
		}

		return hasChanges ? out : null;
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
		this.storage.get(this.getStorageKey(), function(err, data) {
			next(err, err ? null : data);
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
		this.storage.set(this.getStorageKey(), data, next);
	},
	
	/**
	 * Deletes the corresponding data from the storage.
	 * @param {Function} onSuccess An "error-first" style callback
	 * @return {void}
	 */
	drop : function(next)
	{
		this.storage.unset(this.getStorageKey(), next);
	},
	
	/**
	 * Saves the instance (as JSON) in the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	save : function(next) 
	{
		var self  = this, 
			cb    = createNextHandler(next),
			patch = self.getPatch();

		if (!patch)
			return cb(null, self);

		self.emit("savestart:" + self.label, self);

		if (self.parent) {
			self.parent.save(self.onSave(cb));
		} else {
			self.storage.setMany(patch, self.onSave(cb));
		}
		//this.write( this.toJSON(), cb );
	},

	onSave : function(cb) 
	{
		var self = this;
		return function(err) {
			if (err) 
				return cb(err, self);
			self._isDirty = false;
			self.emit("save:" + self.label, self);
			cb(null, self);
		};
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
});

