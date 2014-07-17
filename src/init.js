/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Error while parsing
 * sql query". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
function SQLParseError(message)
{
	this.name    = "SQLParseError";
	this.message = strf.apply(
		this, 
		arguments.length ? arguments : ["Error while parsing sql query"]
	);
}

SQLParseError.prototype = new Error();
SQLParseError.prototype.constructor = SQLParseError;

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Error while parsing
 * sql query". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
function SQLRuntimeError(message)
{
	this.name    = "SQLRuntimeError";
	this.message = strf.apply(
		this, 
		arguments.length ? arguments : ["Error while executing sql query"]
	);
}

SQLParseError.prototype = new Error();
SQLParseError.prototype.constructor = SQLParseError;

(function() {
	JSDB.events = events;
	JSDB.SERVER = SERVER = new Server();
	//console.log("Server loading...");
	SERVER.load(function() {
		//console.log("Server loaded:", SERVER);
	}, function(error) {
		console.error(error);
	});
	//console.dir(SERVER);
})();
