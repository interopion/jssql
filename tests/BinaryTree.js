(function() {

	var BinaryTreeNode = JSDB.BinaryTreeNode,
		BinaryTree     = JSDB.BinaryTree;

	module("Binary Trees");

	test("BinaryTreeNode - Constructor", function() {
		var tree = new BinaryTree();
		ok(tree.root === null);
	});

	test("BinaryTreeNode - insert", function() {
		var tree  = new BinaryTree();

		var node1 = new BinaryTreeNode(1);
		var node3 = new BinaryTreeNode(3);
		var node5 = new BinaryTreeNode(5);
		
		tree.insert(node1);
		ok(tree.root === node1);
		equal(tree.closestBefore(3), node1, "Closest");
		
		tree.insert(node3);
		equal(node3.left, node1);
		ok(node1.right === node3);

		tree.insert(node5);
		
		equal(tree.closestBefore(6), node5, "Closest");
		equal(tree.closestBefore(0), null, "Closest");
		equal(node5.left.left, node1);
		equal(node1.right.right, node5);

		var node2 = new BinaryTreeNode(2);
		tree.insert(node2);
		equal(node3.left, node2);
		equal(node1.right, node2);
		equal(node2.left, node1);
		equal(node2.right, node3);

		var node0 = new BinaryTreeNode(0);
		tree.insert(node0);
		equal(node0.left, null);
		equal(node0.right, node1);
	});
	
})();
