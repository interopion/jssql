function BinaryTree()
{
	this.root = null;
}

BinaryTree.prototype = {

	closestBefore : function(needle) 
	{
		var current = this.root;

		while ( current ) 
		{
			if (current.value > needle) {
				if (!current.left) 
					return null;
				current = current.left;
			}
			else if (current.value < needle) {
				if (!current.right || current.right.value >= needle) 
					return current;
				current = current.right;
			}
			else {
				return current;
			}
		}

		return current;
	},

	insert : function(node)
	{
		var closest = this.closestBefore(node.value);
		if (!closest) {
			node.right = this.root;
			node.left  = null;
			this.root  = node;

		} else {
			if (closest.right) {
				node.right = closest.right;
				closest.right.left = node;
			}
			closest.right = node;
			node.left = closest;
		}
	}
};

function BinaryTreeNode(value)
{
	this.value = value;
}

BinaryTreeNode.prototype = {
	left   : null,
	right  : null,
	parent : null,
	value  : null,

	setLeft : function(node) 
	{
		this.left = node;
	},
	setRight : function(node) 
	{
		if (this.right) {
			node.right = this.right;
			this.right.left = node;
		}
		node.left = this;
		this.right = node;

	},
	setParent : function(node) 
	{
		this.parent = node;
	},
	remove : function(node) 
	{
		this.parent = null;
	}
};