(function() {

	var connection = JSDB.connect();
	connection.loadSchema("schema.json").done(function() {
		this.loadDataInFile("data.json").done(function() {

			function setup() {
				
			}

			function teardown() {
				
			}

			// Module SELECT
			// =================================================================
			(function() {
				module("Single Table Select", {
					setup    : setup,
					teardown : teardown
				});

				test('select("*").from("TestDB.users")', function() {
					deepEqual(
						JSDB.select("*").from("TestDB.users").execute(),
						[
						  {
							"id"  : 1,
							"name": "Vladimir",
							"type": "author"
						  },
						  {
							"id"  : 2,
							"name": "Nikolai",
							"type": "boss"
						  },
						  {
							"id"  : 3,
							"name": "Vasil",
							"type": "co-worker"
						  },
						  {
							"id"  : 4,
							"name": "Iva",
							"type": "co-worker"
						  },
						  {
							"id"  : 5,
							"name": "Iliya",
							"type": "co-worker"
						  }
						]
					);
				});

				test('select("users.*").from("TestDB.users")', function() {
					deepEqual(
						JSDB.select("users.*").from("TestDB.users").execute(),
						[
						  {
							"id"  : 1,
							"name": "Vladimir",
							"type": "author"
						  },
						  {
							"id"  : 2,
							"name": "Nikolai",
							"type": "boss"
						  },
						  {
							"id"  : 3,
							"name": "Vasil",
							"type": "co-worker"
						  },
						  {
							"id"  : 4,
							"name": "Iva",
							"type": "co-worker"
						  },
						  {
							"id"  : 5,
							"name": "Iliya",
							"type": "co-worker"
						  }
						]
					);
				});
				
				test('select("name").from("TestDB.users")', function() {
					deepEqual(
						JSDB.select("name").from("TestDB.users").execute(),
						[
						  {
							"name": "Vladimir"
						  },
						  {
							"name": "Nikolai"
						  },
						  {
							"name": "Vasil"
						  },
						  {
							"name": "Iva"
						  },
						  {
							"name": "Iliya"
						  }
						]
					);
				});

				test('select("users.name").from("TestDB.users")', function() {
					deepEqual(
						JSDB.select("users.name").from("TestDB.users").execute(),
						[
						  {
							"name": "Vladimir"
						  },
						  {
							"name": "Nikolai"
						  },
						  {
							"name": "Vasil"
						  },
						  {
							"name": "Iva"
						  },
						  {
							"name": "Iliya"
						  }
						]
					);
				});

				test('select("users.name").from("TestDB.users as users")', function() {
					deepEqual(
						JSDB.select("users.name").from("TestDB.users as users").execute(),
						[
						  {
							"name": "Vladimir"
						  },
						  {
							"name": "Nikolai"
						  },
						  {
							"name": "Vasil"
						  },
						  {
							"name": "Iva"
						  },
						  {
							"name": "Iliya"
						  }
						]
					);
				});

				test('select("name").from("TestDB.users as U")', function() {
					deepEqual(
						JSDB.select("name").from("TestDB.users as U").execute(),
						[
						  {
							"name": "Vladimir"
						  },
						  {
							"name": "Nikolai"
						  },
						  {
							"name": "Vasil"
						  },
						  {
							"name": "Iva"
						  },
						  {
							"name": "Iliya"
						  }
						]
					);
				});

				test('select("U.name").from("TestDB.users as U")', function() {
					deepEqual(
						JSDB.select("U.name").from("TestDB.users as U").execute(),
						[
						  {
							"name": "Vladimir"
						  },
						  {
							"name": "Nikolai"
						  },
						  {
							"name": "Vasil"
						  },
						  {
							"name": "Iva"
						  },
						  {
							"name": "Iliya"
						  }
						]
					);
				});

				test('select("name", "type").from("TestDB.users")', function() {
					deepEqual(
						JSDB.select("name", "type").from("TestDB.users").execute(),
						[
						  {
							"name": "Vladimir",
							"type": "author"
						  },
						  {
							"name": "Nikolai",
							"type": "boss"
						  },
						  {
							"name": "Vasil",
							"type": "co-worker"
						  },
						  {
							"name": "Iva",
							"type": "co-worker"
						  },
						  {
							"name": "Iliya",
							"type": "co-worker"
						  }
						]
					);
				});

				test('select("name", "type").from("TestDB.users as U")', function() {
					deepEqual(
						JSDB.select("name", "type").from("TestDB.users as U").execute(),
						[
						  {
							"name": "Vladimir",
							"type": "author"
						  },
						  {
							"name": "Nikolai",
							"type": "boss"
						  },
						  {
							"name": "Vasil",
							"type": "co-worker"
						  },
						  {
							"name": "Iva",
							"type": "co-worker"
						  },
						  {
							"name": "Iliya",
							"type": "co-worker"
						  }
						]
					);
				});

				test('select("U.name as n", "type").from("TestDB.users as U")', function() {
					deepEqual(
						JSDB.select("U.name as n", "type").from("TestDB.users as U").execute(),
						[
						  {
							"n": "Vladimir",
							"type": "author"
						  },
						  {
							"n": "Nikolai",
							"type": "boss"
						  },
						  {
							"n": "Vasil",
							"type": "co-worker"
						  },
						  {
							"n": "Iva",
							"type": "co-worker"
						  },
						  {
							"n": "Iliya",
							"type": "co-worker"
						  }
						]
					);
				});

				test('select("U.name as n", "U.type as t").from("TestDB.users as U")', function() {
					deepEqual(
						JSDB.select("U.name as n", "U.type as t").from("TestDB.users as U").execute(),
						[
						  {
							"n": "Vladimir",
							"t": "author"
						  },
						  {
							"n": "Nikolai",
							"t": "boss"
						  },
						  {
							"n": "Vasil",
							"t": "co-worker"
						  },
						  {
							"n": "Iva",
							"t": "co-worker"
						  },
						  {
							"n": "Iliya",
							"t": "co-worker"
						  }
						]
					);
				});

				test('select("users.name as n", "users.type as t").from("TestDB.users")', function() {
					deepEqual(
						JSDB.select("users.name as n", "users.type as t").from("TestDB.users").execute(),
						[
						  {
							"n": "Vladimir",
							"t": "author"
						  },
						  {
							"n": "Nikolai",
							"t": "boss"
						  },
						  {
							"n": "Vasil",
							"t": "co-worker"
						  },
						  {
							"n": "Iva",
							"t": "co-worker"
						  },
						  {
							"n": "Iliya",
							"t": "co-worker"
						  }
						]
					);
				});

				test('select("U.name as n", "type as t").from("TestDB.users AS U")', function() {
					deepEqual(
						JSDB.select("U.name as n", "type as t").from("TestDB.users AS U").execute(),
						[
						  {
							"n": "Vladimir",
							"t": "author"
						  },
						  {
							"n": "Nikolai",
							"t": "boss"
						  },
						  {
							"n": "Vasil",
							"t": "co-worker"
						  },
						  {
							"n": "Iva",
							"t": "co-worker"
						  },
						  {
							"n": "Iliya",
							"t": "co-worker"
						  }
						]
					);
				});

				test('select("*").from("TestDB.users").where({ name : "Vladimir" })', function() {
					deepEqual(
						JSDB.select("*").from("TestDB.users").where({ name : "Vladimir" }).execute(),
						[
						  {
							"id"  : 1,
							"name": "Vladimir",
							"type": "author"
						  }
						]
					);
				});

				test('select("name").from("TestDB.users").where({ name : "Vladimir" })', function() {
					deepEqual(
						JSDB.select("name").from("TestDB.users").where({ name : "Vladimir" }).execute(),
						[
						  {
							"name": "Vladimir"
						  }
						]
					);
				});

				test('select("users.name").from("TestDB.users").where({ name : "Vladimir" })', function() {
					deepEqual(
						JSDB.select("users.name").from("TestDB.users").where({ name : "Vladimir" }).execute(),
						[
						  {
							"name": "Vladimir"
						  }
						]
					);
				});

				test('select("name").from("TestDB.users as USR").where({ name : "Vladimir" })', function() {
					deepEqual(
						JSDB.select("name").from("TestDB.users as USR").where({ name : "Vladimir" }).execute(),
						[
						  {
							"name": "Vladimir"
						  }
						]
					);
				});

				test('select("USR.name").from("TestDB.users as USR").where({ name : "Vladimir" })', function() {
					deepEqual(
						JSDB.select("USR.name").from("TestDB.users as USR").where({ name : "Vladimir" }).execute(),
						[
						  {
							"name": "Vladimir"
						  }
						]
					);
				});

				test('select("USR.name AS N").from("TestDB.users as USR").where({ name : "Vladimir" })', function() {
					deepEqual(
						JSDB.select("USR.name AS N").from("TestDB.users as USR").where({ name : "Vladimir" }).execute(),
						[
						  {
							"N": "Vladimir"
						  }
						]
					);
				});

				test('select("*").from("TestDB.users as USR").where({ name : "Vladimir", type : "author" })', function() {
					deepEqual(
						JSDB.select("*").from("TestDB.users as USR").where({ 
							name : "Vladimir",
							type : "author"
						}).execute(),
						[
						  {
							"id"  : 1,
							"name": "Vladimir",
							"type": "author"
						  }
						]
					);
				});

				test('select("id").from("TestDB.users").order(function(a,b) { return a.id - b.id; })', function() {
					deepEqual(
						JSDB.select("id").from("TestDB.users").order(function(a,b) {
							return a.id - b.id;
						}).execute(),
						[
						  {
							"id": 1
						  },
						  {
							"id": 2
						  },
						  {
							"id": 3
						  },
						  {
							"id": 4
						  },
						  {
							"id": 5
						  }
						]
					);
				});

				test('select("id").from("TestDB.users").order(function(a,b) { return b.id - a.id; })', function() {
					deepEqual(
						JSDB.select("id").from("TestDB.users").order(function(a,b) {
							return b.id - a.id;
						}).execute(),
						[
						  {
							"id": 5
						  },
						  {
							"id": 4
						  },
						  {
							"id": 3
						  },
						  {
							"id": 2
						  },
						  {
							"id": 1
						  }
						]
					);
				});

				// =============================================================
				// JOIN
				// =============================================================

				module("Multiple Table Select", {
					setup    : setup,
					teardown : teardown
				});

				test('CROSS JOIN: select("U.name", "N.id").from("TestDB.users AS U", "TestDB.notes as N")', function() {
					deepEqual(
						JSDB
						.select("U.name", "N.id")
						.from("TestDB.users AS U", "TestDB.notes as N")
						.execute()
						.length,
						40
					);
				});

				test(".select('U.name as author','U.type as user type','N.id as note id', 'N.txt as note').from('TestDB.users AS U', 'TestDB.notes as N').where(function(row) { return row['U.id'] === row['N.user_id']; })", function() {
					deepEqual(
						JSDB
						.select(
							"U.name as author", 
							"U.type as user type", 
							"N.id   as note id", 
							"N.txt  as note"
						)
						.from("TestDB.users AS U", "TestDB.notes as N")
						.where(function(row) {
							return row["U.id"] === row["N.user_id"];
						})
						.execute(),
						[
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 1",
								"note id": 1,
								"user type": "author"
							},
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 2",
								"note id": 2,
								"user type": "author"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 1",
								"note id": 3,
								"user type": "boss"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 2",
								"note id": 4,
								"user type": "boss"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 1",
								"note id": 5,
								"user type": "co-worker"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 2",
								"note id": 6,
								"user type": "co-worker"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 3",
								"note id": 7,
								"user type": "co-worker"
							}
						]
					);
				});
			
				test("INNER JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.innerJoin("TestDB.notes as N", "U.id", "N.user_id")
						.execute(),
						[
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 1"
							},
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 2"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 1"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 1"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 3"
							}
						]
					);
				});

				test("LEFT JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.leftJoin("TestDB.notes as N", "U.id", "N.user_id")
						.execute(),
						[
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 1"
							},
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 2"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 1"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 1"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 3"
							},
							{
								"author": "Iva",
								"note"  : null
							},
							{
								"author": "Iliya",
								"note"  : null
							}
						]
					);
				});

				test("RIGHT JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.rightJoin("TestDB.notes as N", "U.id", "N.user_id")
						.execute(),
						[
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 1"
							},
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 2"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 1"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 1"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 3"
							},
							{
								"author": null,
								"note": "This is a test note from Jonh Doe"
							}
						]
					);
				});

				test("Left Excluding JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.leftJoin("TestDB.notes as N", "U.id", "N.user_id")
						.where(function(row) {
							return row["N.user_id"] === null;
						})
						.execute(),
						[
							{
								"author": "Iva",
								"note"  : null
							},
							{
								"author": "Iliya",
								"note"  : null
							}
						]
					);
				});

				test("Right Excluding JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.rightJoin("TestDB.notes as N", "U.id", "N.user_id")
						.where(function(row) {
							return row["U.id"] === null;
						})
						.execute(),
						[
							{
								"author": null,
								"note"  : "This is a test note from Jonh Doe"
							}
						]
					);
				});

				test("OUTER JOIN | FULL JOIN | FULL OUTER JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.outerJoin("TestDB.notes as N", "U.id", "N.user_id")
						.execute(),
						[
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 1"
							},
							{
								"author": "Vladimir",
								"note": "This is a test note from Vladimir 2"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 1"
							},
							{
								"author": "Nikolai",
								"note": "This is a test note from Nikolai 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 1"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 2"
							},
							{
								"author": "Vasil",
								"note": "This is a test note from Vasil 3"
							},
							{
								"author": "Iva",
								"note"  : null
							},
							{
								"author": "Iliya",
								"note"  : null
							},
							{
								"author": null,
								"note"  : "This is a test note from Jonh Doe"
							}
						]
					);
				});

				test("Outer Excluding JOIN", function() {
					deepEqual(
						JSDB
						.select("U.name AS author", "N.txt AS note")
						.from("TestDB.users AS U")
						.outerJoin("TestDB.notes as N", "U.id", "N.user_id")
						.where(function(row) {
							return row["U.id"] === null || row["N.user_id"] === null;
						})
						.execute(),
						[
							{
								"author": "Iva",
								"note"  : null
							},
							{
								"author": "Iliya",
								"note"  : null
							},
							{
								"author": null,
								"note"  : "This is a test note from Jonh Doe"
							}
						]
					);
				});

			})();
		});
	});
})();