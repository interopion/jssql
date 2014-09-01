/**
 * @classdesc The Storage is a singleton storage manager
 */
var Storage = (function() {
	var engines = {},
		engineInstances = {};
	
	return {
		getEngine : function(name) {
			if (!engineInstances[name]) {
				engineInstances[name] = new engines[name]();
			}
			return engineInstances[name];
		},
		registerEngine : function(name, constructor) {
			if (engines[name])
				throw new Error(
					'Storage engine "' + name + '" is already registered.'
				);
			engines[name] = constructor;
		},
		getEnginePrototype : function() {
			return {
				set : function(key, value, next) 
				{
					next("Failed to save - not implemented.");
				},
				get : function(key, next) 
				{
					next("Failed to read - not implemented.");
				},
				unset : function(key, next) 
				{
					next("Failed to delete - not implemented.");
				},
				setMany : function(map, next)
				{
					next("Failed to save - not implemented.");
				},
				getMany : function(keys, next)
				{
					next("Failed to read - not implemented.");
				},
				unsetMany : function(keys, next)
				{
					next("Failed to delete - not implemented.");
				}
			};
		}
	};
})();
