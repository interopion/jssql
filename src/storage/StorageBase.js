/*

{ 
	databses : {
		db1 : {
			tables : {
				table1 {
					length : 5,
					ai : 6,
					cols : {
						id   : {},
						name : {}
					},
					keys : {
						_jsdb_col_sequence : ["col", "name"],
						_jsdb_row_sequence : [1, 2, 3, 4, 5],
						name_index         : [5, 2, 1, 4, 3]
					},
					rows : {
						1 : [1, "Vladimir"], // JSDB.db1.table1.1
						2 : [2, "Nikolai" ], // JSDB.db1.table1.2
						3 : [3, "Arjun"   ], // JSDB.db1.table1.3
						4 : [4, "Vasil"   ], // JSDB.db1.table1.4
						5 : [5, "Iva"     ], // JSDB.db1.table1.5
					}
				}
			}
		}
	}
}
 
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
				}
			};
		}
	};
})();
