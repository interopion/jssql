/**
 * Factory function for creating custom error classes
 */
function createErrorClass(name, defaultsMessage)
{
	var F = function()
	{
		this.name    = name;
		this.message = strf.apply(
			this, 
			arguments.length ? arguments : [defaultsMessage || "Unknown error"]
		);
	};

	F.prototype = new Error();
	F.prototype.constructor = F;
	return F;
}

/**
 * The base class for custom errors.
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Unknown error". 
 * The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var CustomError = createErrorClass("CustomError");

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Error while parsing
 * sql query". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var SQLParseError = createErrorClass("SQLParseError", "Error while parsing sql query");

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Error while parsing
 * sql query". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var SQLRuntimeError = createErrorClass("SQLRuntimeError", "Error while executing sql query");

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "SQL constraint 
 * violation". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var SQLConstraintError = createErrorClass("SQLConstraintError", "SQL constraint violation");

