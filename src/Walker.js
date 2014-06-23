function Walker(tokens, input)
{
	this._pos = 0;
	this._tokens = tokens;
	this._input = input;
}

Walker.prototype = {
	
	back : function()
	{
		if (this._pos <= 0) {
			throw new Error("The parser is trying go before the first token");
		}
		this._pos--;
		return this;
	},

	prev : function()
	{
		if (this._pos <= 0) {
			throw new Error("The parser is trying go before the first token");
		}
		return this._tokens[this._pos - 1];
	},

	current : function()
	{
		return this._tokens[this._pos];
	},

	is : function(arg, caseSensitive)
	{
		var token = this.current(),
			str   = token[0],
			is    = false,
			subkeys, y;

		if (arg.indexOf("|") > 0) {
			subkeys = arg.split(/\s*\|\s*/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (this.is(subkeys[y], caseSensitive)) {
					return true;
				}
			}
			return false;
		}

		/*if (arg.indexOf(" ") > 0) {
			match = false;
			
			this.optional(key, onMatch);

			if (match) {
				options[key].call(this);
				return this;
			}
		}*/

		if (arg[0] == "@") {
			var type = intVal(arg.substr(1));
			return token[1] === type;
		}
		
		if (caseSensitive) {
			return arg === str;
		}

		return arg.toUpperCase() === str.toUpperCase();
	},

	some : function(options, caseSensitive) 
	{
		var token = this._tokens[this._pos], 
			key, 
			keys = [], 
			walker = this,
			subkeys, y, prev, match;

		function onMatch() {
			match = true;
		}
		
		if (token) {
			for ( key in options ) {
				if (key.indexOf("|") > 0) {
					subkeys = key.split(/\s*\|\s*/);
					for ( y = 0; y < subkeys.length; y++ ) {
						if ((caseSensitive && subkeys[y] === token[0] ) || 
							(!caseSensitive && subkeys[y].toUpperCase() === token[0].toUpperCase())) 
						{
							this._pos++;
							options[key].call(this);
							return this;
						}
					}
				}
				else if (key.indexOf(" ") > 0) {
					match = false;
					
					this.optional(key, onMatch);

					if (match) {
						options[key].call(this);
						return this;
					}
				}
				else if ( 
					(caseSensitive && key === token[0] ) || 
					(!caseSensitive && key.toUpperCase() === token[0].toUpperCase())
				) {
					this._pos++;
					options[key].call(this);
					return this;
				}

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
				'Expecting: %s after "%s"', 
				prettyList(keys),
				prev
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
		
		throw new SQLParseError( 'Expecting: %s', prettyList(options) );
	},
	
	pick : function(options) 
	{
		return this.some(options); 
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
						'Expecting "%s" after "%s".', search[i], ahead[i - 1]
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
				'Expecting: %s %s',
				prettyList(keys),
				expectation || ""
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
     * @param {String} value The value of the searched token
     * @param {Function} callback Optional function to be called with each
     *                            skipped token. Note that this will be 
     *                            called event if the searched token is 
     *                            not found.
     * @return {Walker} Returns the instance
     */
	nextUntil : function(value, callback) { 
		var pos   = this._pos, 
			token = this._tokens[pos];

		while ( token && token[0] !== value ) {
			if (callback) {
				callback(token);
			}
			token = this._tokens[++pos];
		}
		
		if (token && token[0] === value) {
			this._pos = pos;
		}
		
		return this; 
	},
	
	errorUntil : function(value) { 
		return this.nextUntil(value, function(token) {
			throw new SQLParseError(
				'Unexpected %s "%s".', 
				TOKEN_TYPE_MAP[token[1]],
				token[0]
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
			'Unexpected %s "%s". Expecting %s.',
			TOKEN_TYPE_MAP[token[1]],
			token[0],
			prettyList(expecting)
		);
	},

	commaSeparatedList : function(itemCallback)
	{
		var token  = this._tokens[this._pos],
			walker = this;
		
		if (token[0] == ",") {
			throw new SQLParseError('Unexpected ","');
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
					throw new SQLParseError('Unexpected ","');
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
						prev ? 'Expecting ")" after %s' : 'Expecting ")"',
						prev
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