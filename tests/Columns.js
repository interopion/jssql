(function() {

	module("Columns");

	function testSettingName(type)
	{
		test(type + " column - set name", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type
				}
			});

			equal(col.name, "columnName", "Column name");
			equal(col.toJSON().name, "columnName", "toJSON()");
			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + " NOT NULL", "toSQL()");
		});
	}

	function testSettingLengh(type, len)
	{
		test(type + " column - set length", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name   : type,
					params : [String(len)]
				}
			});

			equal(col.length, len, "length");
			deepEqual(col.typeParams, [len]);
			equal(col.typeToSQL(), type.toUpperCase() + "(" + len + ")", "typeToSQL()");
			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + "(" + len + ") NOT NULL", "toSQL()");
		});
	}

	function testStringColumn(type, len)
	{
		len = len || 1;
		testSettingName(type);
		testSettingLengh(type, len);
	}

	function testNumericColumn(type, len)
	{
		len = len || 1;

		testSettingName(type);
		testSettingLengh(type, len);

		test(type + " column - set nullable", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type
				},
				nullable : true
			});

			strictEqual(col.nullable, true, "NULL / NOT NULL");
			strictEqual(col.toJSON().nullable, true, "toJSON()");
			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + " NULL", "toSQL()");
		});

		test(type + " column - set zerofill", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type
				},
				zerofill : true
			});

			strictEqual(col.zerofill, true, "ZEROFILL");
			strictEqual(col.toJSON().zerofill, true, "toJSON()");
			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + " NOT NULL ZEROFILL", "toSQL()");
		});

		test(type + " column - set unsigned", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type
				},
				unsigned : true
			});

			strictEqual(col.unsigned, true, "UNSIGNED");
			strictEqual(col.toJSON().unsigned, true, "toJSON()");
			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + " NOT NULL UNSIGNED", "toSQL()");
		});

		test(type + " column - set autoIncrement", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : { name : type },
				autoIncrement : true
			});
			strictEqual(col.autoIncrement, true, "AUTO_INCREMENT");
			strictEqual(col.toJSON().autoIncrement, true, "toJSON()");
			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + " NOT NULL AUTO_INCREMENT", "toSQL()");
		});

		test(type + " column - toJSON()", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type,
					params : [len]
				}
			});

			deepEqual(col.toJSON(), {
				name         : "columnName",
				unsigned     : false,
				zerofill     : false,
				key          : undefined,
				defaultValue : undefined,
				autoIncrement: false,
				nullable     : false,
				type : {
					name   : type.toUpperCase(),
					params : [len]
				}
			});
			//debugger;
			var bitValue = Number(43).toString(2), l = bitValue.length;
			while (l++ < len) {
				bitValue = '0' + bitValue;
			}

			col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type,
					params : [len]
				},
				unsigned : true,
				key : "PRIMARY",
				zerofill : true,
				defaultValue : type == "BIT" ? bitValue : "43",
				autoIncrement : true,
				nullable : true
			});

			deepEqual(col.toJSON(), {
				name         : "columnName",
				unsigned     : true,
				zerofill     : true,
				key          : "PRIMARY",
				defaultValue : type == "BIT" ? bitValue : "43",
				autoIncrement: true,
				nullable     : true,
				type : {
					name   : type.toUpperCase(),
					params : [len]
				}
			});
		});

		test(type + " column - toSQL()", function() {
			var col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type,
					params : [len]
				}
			});

			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + "(" + len + 
				") NOT NULL");

			var bitValue = Number(43).toString(2), l = bitValue.length;
			while (l++ < len) {
				bitValue = '0' + bitValue;
			}

			col = JSDB.Column.create({
				name : "columnName",
				type : {
					name : type,
					params : [len]
				},
				unsigned : true,
				key : "PRIMARY",
				zerofill : true,
				defaultValue : type == "BIT" ? bitValue : 43,
				autoIncrement : true,
				nullable : true
			});

			equal(col.toSQL(), "\"columnName\" " + type.toUpperCase() + "(" + len + 
				") NULL UNSIGNED ZEROFILL AUTO_INCREMENT PRIMARY KEY DEFAULT '" + 
				(type == "BIT" ? bitValue : 43) + "'");
		});
	}

	testNumericColumn("INT", 10);
	testNumericColumn("int", 10);
	testNumericColumn("INTEGER", 10);
	testNumericColumn("integer", 10);
	testNumericColumn("TINYINT", 3);
	testNumericColumn("SMALLINT", 5);
	testNumericColumn("MEDIUMINT", 6);
	testNumericColumn("BIGINT", 15);
	testNumericColumn("DOUBLE", 3);
	testNumericColumn("FLOAT", 3);
	testNumericColumn("DECIMAL", 3);
	testNumericColumn("NUMERIC", 3);

	testNumericColumn("BIT", 8);
	
	testStringColumn("VARCHAR", 5);
	testStringColumn("CHAR", 5);
	testStringColumn("varchar", 5);
	testStringColumn("char", 5);
	
})();
