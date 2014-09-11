/**
 * @constructor
 * @param {Array} tokens
 * @param {String} input
 */
function Walker(tokens, input, server)
{
	/**
	 * The tokens array
	 * @type {Array}
	 * @private
	 */
	this._tokens = [];

	this.init(tokens, input, server);
}

Walker.prototype = {
	
	/**
	 * The current position in the tokens array
	 * @type {Number}
	 * @private
	 */
	_pos : 0,

	/**
	 * The input string that has been used to produce the tokens array
	 * @type {String}
	 * @private
	 */
	_input : "",

	/**
	 * (Re)sets the instance to it's initial state. This allows single instance
	 * to be reused for different inputs.
	 * @param {Array} tokens
 	 * @param {String} input
 	 * @return {Walker} Returns the instance
	 */
	init : function(tokens, input, server)
	{
		this._pos = 0;
		this._tokens = tokens || [];
		this._input = input || "";
		this.server = server;
	},

	/**
	 * Moves the position pointer n steps back.
	 * @param {Number} n Optional, defaults to 1.
	 * @throws {Error} on invalid argument
	 * @return {Walker} Returns the instance
	 */
	back : function(n)
	{
		n = intVal(n || 1, 1);
		if (n < 1) {
			throw new Error("Invalid argument (expecting positive integer)");
		}
		if (this._pos - n < 0) {
			throw new Error("The parser is trying go before the first token");
		}
		this._pos -= n;
		return this;
	},

	/**
	 * Moves the position pointer n steps forward.
	 * @param {Number} n Optional, defaults to 1.
	 * @throws {Error} on invalid argument
	 * @return {Walker} Returns the instance
	 */
	forward : function(n)
	{
		n = intVal(n || 1, 1);
		if (n < 1) {
			throw new Error("Invalid argument (expecting positive integer)");
		}
		if (!this._tokens[this._pos + n]) {
			throw new Error("The parser is trying go after the last token");
		}
		this._pos += n;
		return this;
	},

	/**
	 * Returns the next token. If the next token is found , the position pointer 
	 * is incremented. 
	 * @throws {Error} on invalid argument
	 * @return {Array|false} Returns the token or false past the end of the stream
	 */
	next : function()
	{
		if (!this._tokens[this._pos + 1]) {
			return false;
		}
		this._pos++;
		return this.current();
	},

	/**
	 * Returns the previous token. If the next token is found , the position 
	 * pointer is incremented. 
	 * @throws {Error} on invalid argument
	 * @return {Array|false} Returns the token or false past the end of the stream
	 */
	prev : function()
	{
		if (!this._tokens[this._pos - 1]) {
			return false;
		}
		this._pos--;
		return this.current();
	},

	/**
	 * Returns the previous token if any (undefined otherwise).
	 * @return {Array|undefined}
	 */
	current : function()
	{
		return this._tokens[this._pos];
	},

	get : function()
	{
		return this._tokens[this._pos] ? this._tokens[this._pos][0] : "";
	},

	is : function(arg, caseSensitive, move)
	{
		var token = this.current(),
			str   = token ? token[0] : "",
			is    = false,
			subkeys, match, start, y;


		// OR ------------------------------------------------------------------
		if (arg.indexOf("|") > 0) {
			subkeys = arg.split(/\s*\|\s*/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (this.is(subkeys[y], caseSensitive)) {
					if (move) this._pos++;
					return true;
				}
			}
			return false;
		}

		// AND -----------------------------------------------------------------
		if (arg.indexOf("&") > 0) {
			match = false;
			subkeys = arg.split(/&+/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (!this.is(subkeys[y], caseSensitive)) {
					return false;
				}
			}
			if (move) this._pos++;
			return true;
		}

		// Sequence ------------------------------------------------------------
		if (arg.indexOf(" ") > 0) {
			match = false;
			start = this._pos; 
			subkeys = arg.split(/\s+/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (!this.is(subkeys[y], caseSensitive)) {
					this._pos = start;
					return false;
				}
				this._pos++;
			}
			if (!move) this._pos = start;
			return true;
		}

		// Negation ------------------------------------------------------------
		if (arg[0] == "!") {
			if (!this.is(arg.substr(1), caseSensitive)) {
				if (move) this._pos++;
				return true;
			}
			return false;
		}

		// Token type matching -------------------------------------------------
		if (arg[0] == "@") {
			var type = intVal(arg.substr(1));
			if (token && token[1] === type) {
				if (move) this._pos++;
				return true;
			}
			return false;
		}
		
		// Case sensitive string match -----------------------------------------
		if (caseSensitive) {
			if (arg === str) {
				if (move) this._pos++;
				return true;
			}
			return false;
		}

		// Case insensitive string match ---------------------------------------
		if (arg.toUpperCase() === str.toUpperCase()) {
			if (move) this._pos++;
			return true;
		}
		return false;
	},

	require : function(arg, caseSensitive) 
	{
		if ( !this.is(arg, caseSensitive) ) {
			var prev = "the start of the query";
			if (this._pos > 0) {
				prev = this._input.substring(0, this._tokens[this._pos][2]);
				prev = prev.substring(prev.lastIndexOf(this.lookBack(5)[0]));
				prev = prev.replace(/[\r\n]/, "").replace(/\t/, " ");
				prev = prev.replace(/\s+$/, "");
				prev = "..." + prev;
			}
			
			throw new SQLParseError(
				'You have an error after %s. Expecting %s. The query was %s', 
				prev,
				arg,
				this._input
			);
		}
	},

	some : function(options, caseSensitive, params) 
	{
		var token = this._tokens[this._pos], 
			key, 
			keys = [], 
			walker = this,
			args = makeArray(params),
			subkeys, y, prev, match;

		function onMatch() {
			match = true;
		}
		
		if (token) {
			for ( key in options ) {
				if (this.is(key, caseSensitive, true)) {
					//this._pos++;
					options[key].apply(this, args);
					return this;
				}
				/*
				if (key.indexOf("|") > 0) {
					subkeys = key.split(/\s*\|\s*//*);
					for ( y = 0; y < subkeys.length; y++ ) {
						if ((caseSensitive && subkeys[y] === token[0] ) || 
							(!caseSensitive && subkeys[y].toUpperCase() === token[0].toUpperCase())) 
						{
							this._pos++;
							options[key].apply(this, args);
							return this;
						}
					}
				}
				else if (key.indexOf(" ") > 0) {
					match = false;
					
					this.optional(key, onMatch);

					if (match) {
						options[key].apply(this, args);
						return this;
					}
				}
				else if ( 
					(caseSensitive && key === token[0] ) || 
					(!caseSensitive && key.toUpperCase() === token[0].toUpperCase())
				) {
					this._pos++;
					options[key].apply(this, args);
					return this;
				}*/

				keys.push(key);
			}
			
			prev = "the start of the query";
			if (this._pos > 0) {
				prev = this._input.substring(0, this._tokens[this._pos][2]);
				prev = prev.substring(prev.lastIndexOf(this.lookBack(5)[0]));
				prev = prev.replace(/[\r\n]/, "").replace(/\t/, " ");
				prev = prev.replace(/\s+$/, "");
				prev = "..." + prev;
			}
			
			throw new SQLParseError(
				'Expecting: %s after "%s". The query was %s', 
				prettyList(keys),
				prev,
				this._input
			);
		}
		return this;
	},

	any : function(options, callback, onError) 
	{
		var token = this._tokens[this._pos], len, val, i;
		if (token) {
			options = Object.prototype.toString.call(options) == "[object Array]" ? 
				options : 
				[options];
			len = options.length;
			
			for ( i = 0; i < len; i++ ) {
				val = options[i];
				if ( val.toUpperCase() === token[0].toUpperCase() ) {
					this._pos++;
					callback(token);
					return this;
				}
			}
		}
		
		if (onError)
			onError(token);
		
		throw new SQLParseError( 'Expecting: %s. The query was %s', prettyList(options), this._input );
	},
	
	pick : function(options, caseSensitive, params) 
	{
		return this.some(options, caseSensitive, params); 
	},

	optional : function(options, callback) 
	{
		var args = arguments, start, buffer, pos, inst = this;
		
		if ( !options ) {
			return this;
		}
		
		if ( typeof options == "string" ) {
			var search = trim(options).toUpperCase().split(/\s+/), 
				ahead  = this.lookAhead(search.length), 
				i;
			
			if ( search.join(" ") === ahead.join(" ").toUpperCase() ) 
			{
				this._pos += search.length;
				callback.call(this);
			}

			// Test for partial match 
			else 
			{
				for (i = 0; i < search.length && i < ahead.length; i++) {
					if (search[i] !== ahead[i].toUpperCase()) {
						break;
					}	
				}
				if (i > 0) {
					throw new SQLParseError(
						'Expecting "%s" after "%s". The query was %s', search[i], ahead[i - 1], inst._input
					);
				}
			}
		}
		
		else if (typeof options == "object") {
			
			// Array - Look for any option in any order
			if (Object.prototype.toString.call(options) == "[object Array]") {
				
				//start  = this._pos;
				every(options, function(obj, key) {
					var found = false;//console.log(obj);
					every(obj, function(fn, label) {//console.log("visited: ", label);
						start = inst._pos;
						inst.optional(label, function(tok) {
							found = true;
							inst._tokens.splice(start, inst._pos - start);
							inst._pos = start;//console.log("found: ", label);
							fn();//console.log(inst._tokens.slice(inst._pos));
							inst.optional(options);
						});
						return !found;
					});
					return !found;
				});
			} 
			
			// Object - Look for the first match
			else {
				every(options, function(fn, key) {//console.log(fn, key);
					var found = false;
					this.optional(key, function(tok) {
						found = true;
						fn();
					});
					return !found;
				}, this);
			}
		}
		
		return this;
	},
	
	someType : function(options, callback, expectation) 
	{
		var token = this._tokens[this._pos], key, type, keys = [];
		if (token) {
			for ( key in options ) {
				if ( options[key] === token[1] ) {
					this._pos++;
					callback(token);
					return this;
				}
				type = TOKEN_TYPE_MAP[options[key]];
				if (keys.indexOf(type) == -1) {
					keys.push(TOKEN_TYPE_MAP[options[key]]);
				}
			}
			throw new SQLParseError(
				'Expecting: %s %s. The query was %s',
				prettyList(keys),
				expectation || "",
				this._input
			);
		}
		return this;
	},

	/**
	 * @param {Number} offset
	 * @return {Array}
	 */
	lookAhead : function(offset)
	{
		var out = [], 
			pos = this._pos,
			to  = pos + offset,
			token;
			
		for ( pos = this._pos; pos < to; pos++ ) {
			token = this._tokens[pos];
			if ( token ) {
				out.push( token[0] );
			}
		}

		return out;
	},

	/**
	 * Goes back the specified number of tokens, collects them and returns them
	 * in array. If the offset is greather than the current position just 
	 * returns all the tokens before the current one.
	 * @param {Number} offset
	 * @return {Array}
	 */
	lookBack : function( offset ) 
	{
		var out = [], 
			to  = this._pos - Math.abs(offset),
			pos,
			token;
		
		for ( pos = this._pos - 1; pos >= to && pos >= 0; pos-- ) {
			token = this._tokens[pos];
			if ( token ) {
				out.unshift( token[0] );
			}
		}
		
		return out;
	},
	
    /**
     * Looks forward to find a token that has value mathing the "value" 
     * parameter. If such token is found, moves the pointer right before 
     * that position. Otherwise the pointer remains the same.
     * @param {String} value The value of the token or an "is" expression
     * @param {Function} callback Optional function to be called with each
     *                            skipped token. Note that this will be 
     *                            called event if the searched token is 
     *                            not found.
     * @return {Walker} Returns the instance
     */
	nextUntil : function(value, callback) 
	{ 
		while ( !this.is(value) ) 
		{
			if ( callback )
				callback.call( this, this.current() );
			if ( !this.next() )
				break;
		}
		
		return this; 
	},
	
	errorUntil : function(value) { 
		return this.nextUntil(value, function(token) {
			throw new SQLParseError(
				'Unexpected %s "%s". The query was %s', 
				TOKEN_TYPE_MAP[token[1]],
				token[0],
				this._input
			);
		}); 
	},
	
	/**
	 * If the next token is ";" moves the pointer to the next position and
	 * calls the callback.
	 * @param {Function} callback The function to call if we have reached
	 *                            the ";" character.
	 * @return {Walker} Returns the instance
	 */
	commit : function(callback) { 
		var token = this._tokens[this._pos];
		if (token && token[0] == ";") {
			this._pos++;
			callback();
		}
		return this; 
	},
	
	literalValue : function(callback)
	{
		var token = this._tokens[this._pos],
			types = NUMBER_OR_STRING,
			values = [
				"NULL",
				"CURRENT_TIME",
				"CURRENT_DATE",
				"CURRENT_TIMESTAMP"
			],
			expecting = [
				"number", 
				"string", 
				"NULL",
				"CURRENT_TIME",
				"CURRENT_DATE",
				"CURRENT_TIMESTAMP"
			];
		
		if (values.indexOf(token[0]) > -1) {
			this._pos++;
			if (callback) {
				callback.call(this, token);
			}
			return this;
		}
		
		if (types.indexOf(token[1]) > -1) {
			this._pos++;
			if (callback) {
				callback.call(this, token);
			}
			return this;
		}
		
		throw new SQLParseError(
			'Unexpected %s "%s". Expecting %s. The query was %s',
			TOKEN_TYPE_MAP[token[1]],
			token[0],
			prettyList(expecting),
			this._input
		);
	},

	commaSeparatedList : function(itemCallback)
	{
		var token  = this._tokens[this._pos],
			walker = this;
		
		if (token[0] == ",") {
			throw new SQLParseError('Unexpected ",". The query was %s', this._input);
		}
		
		this._pos++;
		itemCallback.call(this, token);
		
		this.optional({ 
			"," : function(tok) {
				walker.commaSeparatedList(itemCallback);
			}
		});

		return this;
	},

	commaSeparatedBlock : function(onItem, onComplete)
	{
		var walker   = this,
			startPos = this._pos;

		this.pick({
			"(" : function() {
				var token = walker._tokens[walker._pos];
				if (token[0] == ",") {
					throw new SQLParseError('Unexpected ",". The query was %s', walker._input);
				}

				walker.commaSeparatedList(onItem);
				
				token = walker._tokens[walker._pos++];//console.log(token[0]);

				if (token[0] != ")") {
					var prev = "";
					if (startPos > 0) {
						prev = walker._input.substring(
							walker._tokens[startPos][2], 
							walker._tokens[walker._pos][2]
						);
						prev = prev.replace(/\n/, "");
					}
					throw new SQLParseError(
						'Expecting ")" after %s. The query was %s',
						prev || "the start of the query",
						walker._input
					);
				}

				//walker.pick({
			//		")" : function() {
						if (onComplete) onComplete.call(walker);
			//		}
			//	});
			}
		});
		
		return this;
	}
};