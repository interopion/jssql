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

	test("Cross Join", function() {
		var t1 = {
			rows : {
				1 : { _data: [1, "a"] },
				2 : { _data: [2, "b"] },
				3 : { _data: [3, "c"] }
			}
		};

		var t2 = {
			rows : {
				1 : { _data: [1, "d"] },
				2 : { _data: [2, "e"] }
			}
		};

		var t3 = {
			rows : {
				1 : { _data: [1, "f"] },
				2 : { _data: [2, "g"] }
			}
		};

		var rows = JSDB.crossJoin([t1, t2]);console.dir(rows);
		deepEqual(rows, [
			[1, "a", 1, "d"],
			[1, "a", 2, "e"],

			[2, "b", 1, "d"],
			[2, "b", 2, "e"],
			
			[3, "c", 1, "d"],
			[3, "c", 2, "e"]
		]);
		//return;
		rows = JSDB.crossJoin([t1, t2, t3]);
		console.dir(rows);
		deepEqual(rows, [
			[1, "a", 1, "d", 1, "f"],
			[1, "a", 1, "d", 2, "g"],
			[1, "a", 2, "e", 1, "f"],
			[1, "a", 2, "e", 2, "g"],

			[2, "b", 1, "d", 1, "f"],
			[2, "b", 1, "d", 2, "g"],
			[2, "b", 2, "e", 1, "f"],
			[2, "b", 2, "e", 2, "g"],

			[3, "c", 1, "d", 1, "f"],
			[3, "c", 1, "d", 2, "g"],
			[3, "c", 2, "e", 1, "f"],
			[3, "c", 2, "e", 2, "g"]
		]);
	});
	
	test("Inner Join", function() {
		var t1 = {
			rows : {
				1 : { _data: [1, "a"] },
				2 : { _data: [2, "b"] },
				3 : { _data: [3, "c"] }
			}
		};

		var t2 = {
			rows : {
				1 : { _data: [1, "d"] },
				2 : { _data: [2, "e"] }
			}
		};

		var t3 = {
			rows : {
				1 : { _data: [1, "f"] },
				2 : { _data: [2, "g"] }
			}
		};

		var rows = JSDB.innerJoin([t1, t2], function(row) {
			return row[0] === row[2];
		});

		console.dir(rows);
		deepEqual(rows, [
			[1, "a", 1, "d"],
			[2, "b", 2, "e"]
		]);

		rows = JSDB.innerJoin([t1, t2, t3], function(row) {
			return row[0] === row[2] && row[0] === row[4];
		});
		console.dir(rows);
		deepEqual(rows, [
			[1, "a", 1, "d", 1, "f"],
			[2, "b", 2, "e", 2, "g"]
		]);
	});
	
})();
