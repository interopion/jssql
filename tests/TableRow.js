(function() {

	var DB;

	module("TableRow", {
		setup : function() {
			DB = JSDB.SERVER.createDatabase("unitTestingDB", true);
		},
		teardown : function() {
			JSDB.SERVER.dropDatabase("unitTestingDB", true);
			DB = null;
		}
	});

	test("Constructor", function() {
		var table = new JSDB.Table("testTable", DB),
			collA,
			collB,
			row;

		collA = table.addColumn({ name : "a", type : { name : "int" }, nullable : true });
		collB = table.addColumn({ name : "b", type : { name : "int" }, nullable : true });
		row   = new JSDB.TableRow(table);
		//console.dir(row);

		strictEqual(row.table, table);
		strictEqual(row._cells[0].column, collA);
		strictEqual(row._cells[1].column, collB);
		strictEqual(row.getCellAt(0).column, collA);
		strictEqual(row.getCellAt(1).column, collB);
		strictEqual(row.getCell("a").column, collA);
		strictEqual(row.getCell("b").column, collB);

		delete DB.tables.testTable;
	});

	test("setCellValue()", function() {
		var table = new JSDB.Table("testTable", DB),
			collA = table.addColumn({ name : "a", type : { name : "int" }, nullable : true }),
			collB = table.addColumn({ name : "b", type : { name : "int" }, nullable : true }),
			row   = new JSDB.TableRow(table),
			cellA = row.getCell("a"),
			cellB = row.getCell("b");

		strictEqual(cellA.value, null);
		strictEqual(cellB.value, null);

		row.setCellValue("a", 5);
		row.setCellValue("b", 6);

		strictEqual(cellA.value, 5);
		strictEqual(cellB.value, 6);

		row.setCellValue(0  , 7);
		row.setCellValue("1", 8);

		strictEqual(cellA.value, 7);
		strictEqual(cellB.value, 8);

		ok(cellA < cellB);
		equal(cellA - cellB, -1);

		strictEqual(row.getCellValue("0"), 7);
		strictEqual(row.getCellValue( 1 ), 8);
		strictEqual(row.getCellValue("a"), 7);
		strictEqual(row.getCellValue("b"), 8);

		deepEqual(row.toJSON(), {
			a : 7,
			b : 8
		});

		deepEqual(row.toArray(), [ 7, 8 ]);

		delete DB.tables.testTable;
	});
	
})();
