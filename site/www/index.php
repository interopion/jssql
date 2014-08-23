<?php require('header.php'); ?>
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
										<li><a href="#sql-show-databses">SHOW DATABASES</a></li>
										<li><a href="#sql-show-tables">SHOW TABLES</a></li>
										<li><a href="#sql-columns">SHOW COLUMNS</a></li>
									</ul>
								</li>
								<li><a href="#sql-create">CREATE</a>
									<ul>
										<li><a href="#sql-create-database">CREATE DATABASE</a></li>
										<li><a href="#sql-create-table">CREATE TABLE</a></li>
									</ul>
								</li>
								<li><a href="#sql-select">UPDATE</a></li>
								<li><a href="#sql-select">DELETE</a></li>
								<li><a href="#sql-select">SELECT</a></li>
								<li><a href="#sql-select">INSERT</a></li>
								<li><a href="#sql-select">SOURCE</a></li>
								<li><a href="#sql-select">DROP</a>
									<ul>
										<li><a href="#sql-select">DROP DATABASE</a></li>
										<li><a href="#sql-select">DROP TABLE</a></li>
									</ul>
								</li>
								<li><a href="#sql-select">BEGIN</a></li>
								<li><a href="#sql-select">COMMIT</a></li>
								<li><a href="#sql-select">ROLLBACK</a></li>
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
				<h2>List of all the supported events</h2>
				<table>
					<col style="width:10em"></col>
					<col style="width:7em" align="center"></col>
					<col></col>
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
							<td><strong>loadstart:server</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">JSDB.SERVER</code></td>
							<td>Fired when the database server starts loading it's data from the storage</td>
						</tr>
						<tr>
							<td><strong>load:server</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">JSDB.SERVER</code></td>
							<td>Fired when the database server has completed loading it's data from the storage (even if nothing new has been loaded)</td>
						</tr>
						<tr>
							<td><strong>beforeupdate:table</strong></td>
							<td align="center">Yes</td>
							<td>
								<code class="prettyprint lang-js">event</code>,
								<code class="prettyprint lang-js">Table</code>
							</td>
							<td></td>
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
							<td><strong>beforeupdate:row</strong></td>
							<td align="center">Yes</td>
							<td>
								<code class="prettyprint lang-js">event</code>,
								<code class="prettyprint lang-js">TableRow</code>
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
						<tr>
							<td><strong>loadstart:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>When a row starts loading itself from the storage</td>
						</tr>
						<tr>
							<td><strong>load:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>When a row has been loaded from the storage</td>
						</tr>
						<tr>
							<td><strong>savestart:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>When a row starts saving itself</td>
						</tr>
						<tr>
							<td><strong>save:row</strong></td>
							<td align="center">No</td>
							<td><code class="prettyprint lang-js">event</code>, <code class="prettyprint lang-js">row</code></td>
							<td>When a row has been saved</td>
						</tr>
						<tr>
							<td><strong>loadstart:table</strong></td>
							<td align="center"></td>
							<td><code class="prettyprint lang-js">event</code></td>
							<td></td>
						</tr>
						<tr>
							<td><strong>load:table</strong></td>
							<td align="center"></td>
							<td><code class="prettyprint lang-js">event</code></td>
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
				the name of the database. Not that the named database MUST exist
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
				<a name="sql-show-databses"></a>
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

<?php require('footer.php'); ?>
			