module("getQueries");

test('getQueries("SHOW DATABASES")', function(assert) {
	var out = JSDB.getQueries("SHOW DATABASES");
	assert.ok(out && typeof out == "object");
	assert.equal(out.length, 1);
	assert.deepEqual(out[0].sql, "SHOW DATABASES;");
});

test('getQueries("SHOW DATABASES;")', function(assert) {
	var out = JSDB.getQueries("SHOW DATABASES;");
	assert.ok(out && typeof out == "object");
	assert.equal(out.length, 1);
	assert.deepEqual(out[0].sql, "SHOW DATABASES;");
});

test('getQueries("show databases;source world_innodb.sql")', function(assert) {
	var out = JSDB.getQueries("show databases;source world_innodb.sql");
	assert.ok(out && typeof out == "object");
	assert.equal(out.length, 2);
	assert.deepEqual(out[0].sql, "show databases;");
	assert.deepEqual(out[1].sql, "source world_innodb.sql;");
});