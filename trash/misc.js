function LinkedListNode(data)
{
	this.data = data;
}

LinkedListNode.prototype = {
	prev : null,
	next : null,
	before : function(data) {
		var node = new LinkedListNode(data);
		if (this.prev) {
			node.prev = this.prev;
			this.prev.next = node;
		}
		this.prev = node;
		node.next = this;
		return node;
	},
	after : function(data) {
		var node = new LinkedListNode(data);
		if (this.next) {
			node.next = this.next;
			this.next.prev = node;
		}
		this.next = node;
		node.prev = this;
		return node;
	}
};

function crossJoinUsingLinkedList(tables) 
{
	var tl = tables.length,
		rows = [],
		left, 
		right, 
		row, 
		row0,
		rowId,
		prev,
		next,
		first,
		cur,
		i = 0,
		l = 0,
		y;

	while ( i < tl )
	{
		right = tables[i++];

		if (i === 1) {
			for ( rowId in right.rows )
			{
				if (!first) {
					first = new LinkedListNode(right.rows[rowId]._data.slice());
					prev  = first;
				} else {
					prev  = prev.after(right.rows[rowId]._data.slice());
				}
			}
		} else {
			row = first;
			while ( row ) {
				y = 0;
				row0 = row.data;
				for ( rowId in right.rows )
				{
					if (++y === 1) {
						row.data = row0.concat( right.rows[rowId]._data );
					} else {
						row = row.after(row0.concat( right.rows[rowId]._data ));
					}
				}
				row = row.next;
			}
		}
	}

	row = first;
	while ( row ) {
		rows.push(row.data);
		row = row.next;
	}
	//console.dir(first);
	//console.dir(rows);
	return rows;
}