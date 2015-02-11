<?php 
$title = 'Manual';
$head = '<link href="google-code-prettify/prettify.css" type="text/css" rel="stylesheet" />
		<script type="text/javascript" src="google-code-prettify/prettify.js"></script>
';
require('header.php'); ?>
				<h1>JsSql API Reference</h1>
				<hr>

				<!-- TOK =================================================== -->
				<div>
					<ul>
						<li><a href="#connecting">Connecting to the database</a></li>
						<li><a href="#configuration">Configuration Options</a></li>
						<li><a href="#query">Making Queries</a></li>
						<li><a href="#transactions">Transactions</a></li>
						<li><a href="#events">Events</a></li>
						<li><a href="#sql">Supported SQL Syntax</a>
							<ul>
								<li><a href="#sql-use">USE</a></li>
								<li><a href="#sql-show">SHOW</a>
									<ul>
										<li><a href="#sql-show-databases">SHOW DATABASES</a></li>
										<li><a href="#sql-show-tables">SHOW TABLES</a></li>
										<li><a href="#sql-show-columns">SHOW COLUMNS</a></li>
									</ul>
								</li>
								<li><a href="#sql-create">CREATE</a>
									<ul>
										<li><a href="#sql-create-database">CREATE DATABASE</a></li>
										<li><a href="#sql-create-table">CREATE TABLE</a></li>
									</ul>
								</li>
								<li><a href="#sql-update">UPDATE</a></li>
								<li><a href="#sql-delete">DELETE</a></li>
								<li><a href="#sql-select">SELECT</a></li>
								<li><a href="#sql-insert">INSERT</a></li>
								<li><a href="#sql-source">SOURCE</a></li>
								<li><a href="#sql-drop">DROP</a>
									<ul>
										<li><a href="#sql-drop-database">DROP DATABASE</a></li>
										<li><a href="#sql-drop-table">DROP TABLE</a></li>
									</ul>
								</li>
								<li><a href="#sql-begin">BEGIN</a></li>
								<li><a href="#sql-commit">COMMIT</a></li>
								<li><a href="#sql-rollback">ROLLBACK</a></li>
							</ul>
						</li>
					</ul>
				</div>

				<!-- Connecting to the database ============================ -->
				<a name="connecting"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h2>Connecting to the database</h2>
				While your page loads, a connection to the database is automatically established.
				However, that process is asynchronous and you can't just start making queries
				before assuring that the connection is ready. There are several ways to do this 
				but here is the simplest (and the recommended) one:
				<pre class="prettyprint lang-js">
jsSQL(function() {
	// Your code here
});
</pre>
				<p>
				What happens is that the library will try to establish a connection to the 
				storage, then load the database structure into memory and call the callback
				when done. If all this has already happened, then the callback will be 
				called directly. If you prefer, you can think of it as similar to the 
				jQuery's jQuery function which will wait for the DOM to be ready if it's not
				and then call it's callback...
				</p>

				<h4>Namespacing the code</h4>
				<p>
				The only thing exported to the global namespace is the jsSQL function. When
				it calls it's callback however, it will pas a rich object to it which can be 
				used to used to run queries and everything else. You can call the argument 
				whatever you like and stick to that name later. Here is an example using the
				name "JSDB":
				</p>
				<pre class="prettyprint lang-js">
jsSQL(function(JSDB) {
	JSDB.query("SELECT * FROM world.City", function(result) {
		console.dir(result.rows);
	});
});
</pre>
				<p>
				Note that the object you get in the callback (JSDB in this example) is a 
				singleton, i.e. the same object is returned from each call to jsSQL(...).
				That's why we consider an uppercased name to be better as a hint for 
				something "global". Also, all of the examples in this manual are written
				using that "JSDB" name.
				</p>

				<h4>Configuration</h4>
				You can pass some configuration settings to the jsSQL function if you need
				to. Here is an example for turning the debug mode on:
				<pre class="prettyprint lang-js">
jsSQL({ debug : true }, function(JSDB) {
	// Your code here
});
</pre>
				<br>
				<a name="configuration"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h2>Configuration Options</h2>
				<p>TODO</p>
				<br>

				<!-- JSDB.query ============================================ -->
				<a name="query"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h2>JSDB.query</h2>
				<p>You can use the <strong>query</strong> function for direct SQL queries. It has the signature<br><code>JSDB.query(sql, callback)</code> and works asynchronously. The <code>callback</code> function is<br>called with three arguments <code>error</code>, <code>result</code> and <code>queryIndex</code>.</p>
				<ol>
					<li>The <code>error</code> argument is <code>null</code> if there are no errors or an instance of <code>Error</code> (or it's derivates) if something bad has happened.</li>
					<li>The <code>result</code> is a JSDB.Result instance or <code>null</code> in case of error.</li>
					<li>The <code>queryIndex</code> is an integer. It represents the index of the query that has produced this result or error.</li>
				</ol>
				<p>Example:</p>
				<pre class="prettyprint lang-js">
// jsSQL(function(JSDB) {
	JSDB.query("SELECT * FROM 'mydb'.'users' LIMIT 10", function(error, result) {
		if ( error ) {
			throw error;
		}
		console.dir(result);
	});
// });</pre>
				<h3>Runing Multiple Queries</h3>
				<pre class="prettyprint lang-js">
JSDB.query("USE mydb; SELECT * FROM users", function(error, result, qIndex) { 
	// ...
});

// or

JSDB.query(["USE mydb", "SELECT * FROM users"], function(error, result, qIndex) { 
	// ...
});</pre>
				<br>
				<a name="transactions"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h3>Using Transactions</h3>
				<pre class="prettyprint lang-js">
JSDB.query([
	"USE mydb;",
	"SELECT * FROM users;",
	"BEGIN;",
	"UPDATE users SET name = 'updated' WHERE id = 1;",
	"COMMIT;",
	"SELECT * FROM users;"
], function(error, result, qIndex) {
	if ( error ) {
		throw error;
	}

	if (qIndex === 1) {
		console.log("users: ", result);
	}
});</pre>
				<h3>Query Results Iteration</h3>
				<p>
				Since iteration over SELECT query results is probably the most
				commonly used routine, you get a dedecated method for that called "each".
				The callback function has the same signature as <code class="prettyprint lang-js">
				Array.prototype.forEach</code> and will be called once for each 
				result row. Example:
				</p>
				<pre class="prettyprint lang-js">
//jsSQL(function(JSDB) {
	JSDB.each("SELECT * FROM world.City", function(row, idx, allRows) {
		console.log(idx, row);
	});
//});</pre>
				<br>
				<a name="events"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h2>Events</h2>
				<p>
				There are some events dispatched by the jsSql library to allow
				you to trace what is going on and even to control the execution 
				flow in some cases. These event are following certain naming 
				convention:
				<ol>
					<li>
						The event type is expressed as <b>action[:target]</b>.
						The action part is the name of the action that has happened
						(or is about to happen). Additionally, if the same action
						can happen on different targets, the target is appended after
						a colon to namespace the event. For example "save:table"
						if fired after a table has been saved and "save:row" - 
						after a row has been saved.
					</li>
					<li>
						Since the events are usually dispatched to notify the 
						interested parties about some asynchronous procedure,
						most of them are in pairs - when something is about to 
						happen and after it has happened. Some of the "before events"
						can be canceled which will prevent the actual execution 
						of the action. Others cannot be canceled. The rule here
						is that the cancel-able "before" events are named as 
						"<b>before</b>action[:target]", while those that cannot be
						canceled are named as "action<b>start</b>[:target]".
					</li>
				</ol>
				</p>
				<h3>List of all the supported events</h3>
				<table>
					<col style="width:11em"></col>
					<col style="width:7em" align="center"></col>
					<col style="width:15em"></col>
					<col></col>
					<thead>
						<tr>
							<th>Event Type</th>
							<th>Cancellable</th>
							<th nowrap>Handler arguments</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th colspan="4" class="group-heading">loadstart</th>
						</tr>
						<tr>
							<td><strong>loadstart:server</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">server</code></td>
							<td>Fired when the database server starts loading it's data from the storage</td>
						</tr>
						<tr>
							<td><strong>loadstart:database</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">database</code></td>
							<td>Fired when a database starts loading it's data from the storage</td>
						</tr>
						<tr>
							<td><strong>loadstart:table</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">table</code></td>
							<td>Fired when a table starts loading it's data from the storage</td>
						</tr>
						<tr>
							<td><strong>loadstart:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>Fired when a row starts loading it's data from the storage</td>
						</tr>

						<tr>
							<th colspan="4" class="group-heading">load</th>
						</tr>
						<tr>
							<td><strong>load:server</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">server</code></td>
							<td>Fired when the database server has completed loading it's data from the storage (even if nothing new has been loaded)</td>
						</tr>
						<tr>
							<td><strong>load:database</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">database</code></td>
							<td>Fired when a database has completed loading it's data from the storage (even if nothing new has been loaded)</td>
						</tr>
						<tr>
							<td><strong>load:table</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">table</code></td>
							<td>Fired when a table has completed loading it's data from the storage (even if nothing new has been loaded)</td>
						</tr>
						<tr>
							<td><strong>load:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>Fired when a table row has completed loading it's data from the storage (even if nothing new has been loaded)</td>
						</tr>

						<tr>
							<th colspan="4" class="group-heading">savestart</th>
						</tr>
						<tr>
							<td><strong>savestart:server</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">server</code></td>
							<td>When the server starts saving itself</td>
						</tr>
						<tr>
							<td><strong>savestart:database</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">database</code></td>
							<td>When a database starts saving itself</td>
						</tr>
						<tr>
							<td><strong>savestart:table</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">table</code></td>
							<td>When a table starts saving itself</td>
						</tr>
						<tr>
							<td><strong>savestart:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>When a row starts saving itself</td>
						</tr>

						<tr>
							<th colspan="4" class="group-heading">save</th>
						</tr>
						<tr>
							<td><strong>save:server</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">server</code></td>
							<td>When the server has been saved</td>
						</tr>
						<tr>
							<td><strong>save:database</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">database</code></td>
							<td>When a database has been saved</td>
						</tr>
						<tr>
							<td><strong>save:table</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">table</code></td>
							<td>When a table has been saved</td>
						</tr>
						<tr>
							<td><strong>save:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>When a row has been saved</td>
						</tr>

						<tr>
							<th colspan="4" class="group-heading">beforeupdate</th>
						</tr>
						<tr>
							<td><strong>beforeupdate:table</strong></td>
							<td align="center">Yes</td>
							<td>
								<code class="prettyprint lang-js">event</code>,
								<code class="prettyprint lang-js">Table</code>
							</td>
							<td>
								When a table is about to be updated. If a handler
								function returns <code>false</code> (exactly) the
								update will be canceled!
							</td>
						</tr>
						<tr>
							<td><strong>beforeupdate:row</strong></td>
							<td align="center">Yes</td>
							<td>
								<code class="prettyprint lang-js">event</code>,
								<code class="prettyprint lang-js">TableRow</code>
							</td>
							<td></td>
						</tr>

						<tr>
							<th colspan="4" class="group-heading">update</th>
						</tr>
						<tr>
							<td><strong>update:table</strong></td>
							<td align="center">No</td>
							<td>
								<code class="prettyprint lang-js">event</code>,
								<code class="prettyprint lang-js">Table</code>
							</td>
							<td></td>
						</tr>
						<tr>
							<td><strong>update:row</strong></td>
							<td align="center">No</td>
							<td>
								<code class="prettyprint lang-js">event</code>,
								<code class="prettyprint lang-js">TableRow</code>
							</td>
							<td></td>
						</tr>
						
						
						
						
						
						
					</tbody>
				</table>
				<br>

				<a name="sql"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h2>Supported SQL Syntax</h2>
				<p>
				The jsSQL library is under active development. For now, it supports
				a limited subset of the most important sql queries.
				</p>

				<a name="sql-use"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>USE</h4>
				<p>
				It's a very simple statement - just the keyword <code>USE</code> followed by 
				the name of the database. Note that the named database MUST exist
				or an exception will be thrown. The database name can be specified 
				as a simple word, or if needed  it can be a string quoted in double
				quotes, single quotes or tick marks. Here is an example:
				</p>
				<pre class="prettyprint lang-sql">
USE mydatabase;
USE "mydatabase";
USE 'mydatabase';
USE `mydatabase`;
</pre>
				
				<br>
				<a name="sql-show"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>SHOW</h4>
				<p>
				The SHOW query has three use cases:
				</p>

				<br>
				<a name="sql-show-databases"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>SHOW DATABASES</h4>
				<p>
				This will give you a list of all the currently existing databases.
				The usage is:
				</p>
				<pre class="prettyprint lang-sql">
/* either */
SHOW DATABSES;

/* or the alias */
SHOW SCHEMAS;
</pre>
				
				<br>
				<a name="sql-show-tables"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>SHOW TABLES</h4>
				<p>
				This will give you a list of all the tables in the specified database.
				</p>
				The usage is:
				<pre><code>SHOW TABLES (FROM|IN) database</code></pre>
				And some examples are:
				<pre class="prettyprint lang-sql">
SHOW TABLES FROM database;
SHOW TABLES FROM "database";
SHOW TABLES IN `database`;
</pre>
				<br>
				<a name="sql-show-columns"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>SHOW COLUMNS</h4>
				<p>
				This will give you a list of all the columns in a table including
				some meta-data about them.
				</p>
				The usage is:
				<pre>
<code>SHOW TABLES (FROM|IN) table (FROM|IN) database</code>
</pre>
				And some examples are:
				<pre class="prettyprint lang-sql">
SHOW TABLES IN table FROM database;
SHOW TABLES FROM `table` IN "database";
SHOW TABLES IN 'table' IN database;
SHOW SCHEMAS IN 'table' IN database;
</pre>

				<br>
				<a name="sql-create"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>CREATE</h4>
				<p>
				The CREATE statement has two use cases:
				</p>

				<br>
				<a name="sql-create-database"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>CREATE DATABASE</h4>
				<p>
					This will create a new database with the specified name.<br>
					The "IF NOT EXISTS" part is optional - if omitted and a such a database already exists it will throw an error.
				</p>
				The usage is:
				<pre>
<code>CREATE DATABASE [IF NOT EXISTS] database</code>
</pre>
				And some examples are:
				<pre class="prettyprint lang-sql">
CREATE DATABASE IF NOT EXISTS database;
CREATE DATABASE IF NOT EXISTS "database";
CREATE DATABASE 'database';
CREATE DATABASE `database`;
</pre>

				<br>
				<a name="sql-create-table"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>CREATE TABLE</h4>
				<p>
					This will create a new table with the specified name.<br>
					The "IF NOT EXISTS" part is optional - if omitted and a such a database already exists it will throw an error.
				</p>
				The usage is:
				<pre>
<code>CREATE TABLE [IF NOT EXISTS] table [\(
	column type\(size\) (NULL|NOT NULL) [AUTO_INCREMENT] [KEY|INDEX|UNIQUE|PRIMARY KEY] [ZEROFILL] [UNSIGNED] [DEFAULT value],
	...,
	[CONSTRAINT name] (KEY|INDEX|UNIQUE|PRIMARY KEY|CHECK expression|FOREIGN KEY \(column\)),
	...
\)];</code>
</pre>
				And here is an example:
				<pre class="prettyprint lang-sql">
CREATE TABLE `employees` (
  `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lastName` VARCHAR(50) NOT NULL,
  `firstName` VARCHAR(50) NOT NULL,
  `workDone` INT(11) NOT NULL DEFAULT '1',
);
</pre>


				<br>
				<a name="sql-update"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>UPDATE</h4>
				<p>
					This will update the specified columns in a table for all rows which match the WHERE clause.
				</p>
				The usage is:
				<pre>
<code>UPDATE table [OR (ROLLBACK|ABORT|REPLACE|FAIL|IGNORE)]
SET column = expression [, SET column = expression]*
WHERE expression;</code>
</pre>
				And here is an example:
				<pre class="prettyprint lang-sql">
UPDATE employees
SET workDone = workDone + 1
WHERE id &lt; 5 ;
</pre>

				<br>
				<a name="sql-delete"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>DELETE</h4>
				<p>
					This will delete the rows in a table which match the WHERE clause.<br>
					If a database is not specified then the current one will be used (see USE statement).
				</p>
				The usage is:
				<pre>
<code>DELETE FROM [database.]table WHERE expression</code>
</pre>
				And here is an example:
				<pre class="prettyprint lang-sql">
DELETE FROM example.employees WHERE workDone &lt; 3;
</pre>

				<br>
				<a name="sql-select"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>SELECT</h4>
				<p>
					This will return the data matching the specified selection.
				</p>
				The usage is:
				<pre>
<code>SELECT (\*|columnOrExpression [AS name] [, columnOrExpression [AS name]]*)
FROM table [, table]*
[WHERE expression]
[GROUP BY column]
[ORDER BY column (ASC|DESC)]
[LIMIT number]
[OFFSET number]
</code>
</pre>
				And here is an example:
				<pre class="prettyprint lang-sql">
SELECT *
FROM employees
WHERE id > 3
ORDER BY workDone DESC
LIMIT 10;
</pre>

				<br>
				<a name="sql-insert"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>INSERT</h4>
				<p>
					This will insert new rows with the specified values in the specified table columns.
				</p>
				The usage is:
				<pre>
<code>INSERT [OR (ROLLBACK|ABORT|REPLACE|FAIL|IGNORE)] INTO table
[\(column [, column]*\)]
VALUES \(value [, value]*\) [, \(value [, value]*\)]*</code>
</pre>
				And here are some examples:
				<pre class="prettyprint lang-sql">
INSERT INTO employees VALUES (NULL, "A", "B", 6);
INSERT INTO employees (id, firstName, workDone) VALUES (NULL, "A", 6);
INSERT INTO employees (id, firstName, lastName)
VALUES (NULL, "A", "B"), (NULL, "C", "D");
</pre>

				<br>
				<a name="sql-source"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>SOURCE</h4>
				<p>
					This will execute the contents of the specified file.
				</p>
				The usage is:
				<pre>
<code>SOURCE filename;</code>
</pre>

				<br>
				<a name="sql-drop"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>DROP</h4>
				<p>
					The DROP statement has two use cases:
				</p>

				<br>
				<a name="sql-drop-database"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>DROP DATABASE</h4>
				<p>
					This will remove the specified database. <br>
					The "IF EXISTS" part is optional - if omitted and a such a database already exists it will throw an error.
				</p>
				The usage is:
				<pre>
<code>DROP DATABASE [IF EXISTS] database</code>
</pre>
				And some examples are:
				<pre class="prettyprint lang-sql">
DROP DATABASE IF EXISTS database;
DROP DATABASE database;
</pre>

				<br>
				<a name="sql-drop-table"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>DROP TABLE</h4>
				<p>
					This will remove the specified table. <br>
					The "IF EXISTS" part is optional - if omitted and a such a database already exists it will throw an error.<br>
					If a database is not specified then the current one will be used (see USE statement).
				</p>
				The usage is:
				<pre>
<code>DROP TABLE [IF EXISTS] [database.]table</code>
</pre>
				And some examples are:
				<pre class="prettyprint lang-sql">
DROP TABLE IF EXISTS database.table;
DROP TABLE IF EXISTS table;
DROP TABLE database.table;
DROP TABLE table;
</pre>


				<br>
				<a name="sql-begin"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>BEGIN</h4>
				<p>
					This will begin a new transaction.
				</p>
				The usage is:
				<pre>
<code>BEGIN; statements; (COMMIT|ROLLBACK);</code>
</pre>

				<br>
				<a name="sql-commit"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>COMMIT</h4>
				<p>
					This will commit the current transaction. <br>
					It will rollback all changes if it encounters an error.
				</p>
				The usage is:
				<pre>
<code>BEGIN; statements; COMMIT;</code>
</pre>

				<br>
				<a name="sql-rollback"></a>
				<a class="pull-right" href="#top">Back to top</a>
				<h4>ROLLBACK</h4>
				<p>
					This will rollback the effect of all statements in the transaction.
				</p>
				The usage is:
				<pre>
<code>BEGIN; statements; ROLLBACK;</code>
</pre>
<script type="text/javascript">
prettyPrint();
</script>
<?php require('footer.php'); ?>
			