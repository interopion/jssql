/**
 * Class Result - represents the result of any query
 * @constructor
 */
function Result()
{
	this.data = null;
	this.cols = null;
	this.rows = null;
	this._startTime = Date.now();
}

Result.prototype = {
	
	/**
	 * Sets the actual data that this result object represents. The data might 
	 * be in different formats:
	 * <ul>
	 *   <li>An object with @rows and @cols properties</li>
	 *   <li>An Array</li>
	 *   <li>A string</li>
	 *   <li>A boolean value</li>
	 * </ul>
	 * @param {*} data
	 */
	setData : function(data)
	{
		this._endTime   = Date.now();
		this.time       = this._endTime - this._startTime;
		this._startTime = this._endTime;
		this.data       = data || null;

		if ( data )
		{
			if ( typeof data == "object" )
			{
				this.cols = data.cols || null;
				this.rows = data.rows || null;
			}
			else if ( Object.prototype.toString.call(data) == "[object Array]" )
			{
				this.rows = data;
				this.cols = null;
			}
			else
			{
				this.cols = null;
				this.rows = null;
			}
		}
	},

	toHTML : function() 
	{
		var html   = [ '<table><thead><tr>' ],
			colLen = this.cols.length,
			rowLen = this.rows.length,
			row, i, j, v;

		for ( i = 0; i < colLen; i++ )
        {
			html.push('<th>', this.cols[i], '</th>');
		}

		html.push('</tr></thead><tbody>');

		for ( i = 0; i < rowLen; i++ )
		{
			row = this.rows[i];
			html.push('<tr>');
			for ( j = 0; j < colLen; j++ ) 
			{
				v = row[this.cols[j]] || row[j];
				html.push(
					'<td>', 
					v === undefined ? '' : String(v), 
					'</td>'
				);
			}
			html.push('</tr>');
		}

		html.push('</tbody></table>');
		html.push(rowLen + " rows in set. ");
		html.push("Query took " + this.time + "ms.");

		return html.join("");
	},

	toJSON : function() {},

	toString : function() {},

	toXML : function() {},

	toCSV : function() {},

	forEach : function() {}
};