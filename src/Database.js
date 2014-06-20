////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                             Class Database                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function Database(name) 
{
	this.tables = {};
	this.name = name;
}

Database.prototype = new Persistable();
Database.prototype.constructor = Database;

Database.prototype.toJSON = function() 
{
	var out = { name : this.name, tables : {} }, t;
	for (t in this.tables) {
		out.tables[t] = [NS, this.name, t].join(".");
	}
	return out;
};

Database.prototype.getStorageKey = function() 
{
	return NS + "." + this.name;
};

Database.prototype.drop = function()
{
	for ( var tableName in this.tables ) {//debugger; 
		this.tables[tableName].drop();
	}
	Persistable.prototype.drop.call(this);
};

Database.prototype.load = function(onSuccess, onError) 
{
	var db = this;
	JSDB.events.dispatch("loadstart:database", db);
	db.read(function(json) {
		var table, 
			tables = [], 
			tableName,
			loaded = 0, 
			tableCount = 0, i;

		function onTableLoad(table)
		{
			return function()
			{
				db.tables[table.name] = table;
				if (++loaded === tableCount) {
					JSDB.events.dispatch("load:database", db);
					if (onSuccess) onSuccess(db);
				}
			};
		}

		db.tables = {};

		for ( var name in json.tables ) {
			table = new Table(name, db);
			tables[tableCount++] = table;
		}

		if (tableCount) {
			for ( i = 0; i < tableCount; i++ ) {
				table = tables[i];
				table.load(onTableLoad(table), onError);
			}
		} else {
			JSDB.events.dispatch("load:database", db);
			if (onSuccess) onSuccess(db);
		}

	}, onError);
	
	return db;
};

Database.prototype.save = function(onComplete, onError) 
{
	Persistable.prototype.save.call(this, function() {
		SERVER.save(onComplete, onError);
	}, onError);
	return this;
};

Database.prototype.createTable = function(name, fields, ifNotExists)
{
	if (this.tables.hasOwnProperty(name)) {
		if (!ifNotExists) {
			throw new SQLRuntimeError('Table "%s" already exists', name);
		}
	}

	var table = new Table(name, this), col;
	for (col = 0; col < fields.length; col++) {
		table.addColumn(fields[col]);
	}
	
	table.save();
	this.tables[name] = table;
	this.save();
	return table;
};
