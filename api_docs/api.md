#JsSql API Reference
---

##JSDB.query

You can use the **query** function for direct SQL queries. It has the signature 
`JSDB.query(sql, callback)` and works asynchronously. The `callback` function is
called with three arguments `error`, `result` and `queryIndex`.

1. The `error` argument is `null` if there are no errors or an instance of `Error` (or it's derivates) if something bad has happened.
2. The `result` is a JSDB.Result instance or `null` in case of error.
3. The `queryIndex` is an integer. It represents the index of the query that has produced this result or error.

Example:

``` js
JSDB.query("SELECT * FROM 'mydb'.'users' LIMIT 10", function(error, result, qIndex) {
    if ( error ) {
        throw error;
    }
    console.dir(result);
});
```

###Runing Multiple Queries

``` js
JSDB.query("USE mydb; SELECT * FROM users", function(error, result, qIndex) { 
    // ...
});

// or

JSDB.query(["USE mydb", "SELECT * FROM users"], function(error, result, qIndex) { 
    // ...
});

```

###Using Transactions

``` js
JSDB.query([
        "USE mydb;",
        "SELECT * FROM users;"
        "BEGIN;"
        "UPDATE users SET name = 'updated' WHERE id = 1;"
        "COMMIT;"
        "SELECT * FROM users;"
    ].join(""), 
    function(error, result, qIndex) {
        if ( error ) {
            throw error;
        }

        if (qIndex === 1) {
            console.log("users: ", result);
        }
});
```

##List of all the supported events

| Event Type               | Cancellable |  Handler arguments |  Description   |
|--------------------------|:-----------:|--------------------|----------------|
|**loadstart:server**      |No           |`event, JSDB.SERVER`|Fired when the database server starts loading it's data from the storage|
|**load:server**           |No           |`event, JSDB.SERVER`|Fired when the database server has completed loading it's data from the storage (even if nothing new has been loaded)|
|**before_update:table**   |Yes          |`event`             ||
|**before_update:row**     |Yes          |`event`             ||
|**loadstart:row**         |No           |`event, row`        |When a row starts loading itself from the storage|
|**load:row**              |No           |`event, row`        |When a row has been loaded from the storage|
|**savestart:row**         |No           |`event, row`        |When a row starts saving itself|
|**save:row**              |No           |`event, row`        |When a row has been saved|
|**loadstart:table**       |             |`event`             ||
|**load:table**            |             |`event`             ||
