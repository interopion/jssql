
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
				set : function(key, value, onSuccess, onError) 
				{
					onError("Failed to save - not implemented.");
				},
				get : function(key, onSuccess, onError) 
				{
					onError("Failed to read - not implemented.");
				},
				unset : function(key, onSuccess, onError) 
				{
					onError("Failed to delete - not implemented.");
				},
				setMany : function(map, onSuccess, onError)
				{
					onError("Failed to save - not implemented.");
				},
				getMany : function(keys, onSuccess, onError)
				{
					onError("Failed to read - not implemented.");
				},
				unsetMany : function(keys, onSuccess, onError)
				{
					onError("Failed to delete - not implemented.");
				}
			};
		}
	};
})();
