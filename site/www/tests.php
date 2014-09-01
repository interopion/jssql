<?php 

$title = 'Unit Tests';
$head  = '<link rel="stylesheet" href="tests/qunit.css">';

require('header.php'); ?>

<div id="qunit"></div>
<div id="qunit-fixture"></div>

<script type="text/javascript">
var JSDB_EXPORT_FOR_TESTING = true;
</script>

<script type="text/javascript" src="tests/qunit.js"></script>
<script type="text/javascript" src="/js/jquery.min.js"></script>
<script type="text/javascript" src="/js/jssql.js"></script>

<script src="tests/unit-tests-2.js"></script>
<script src="tests/Walker.js"></script>
<script src="tests/Columns.js"></script>
<script src="tests/TableRow.js"></script>
<script src="tests/test.expressions.js"></script>
<script src="tests/transaction_api.js"></script>
<script src="tests/test.Storage.js"></script>

<script src="tests/statements/test.CREATE_DATABASE.js"></script>
<script src="tests/statements/test.CREATE_TABLE.js"></script>
<script src="tests/statements/test.USE.js"></script>
<script src="tests/statements/test.SHOW_TABLES.js"></script>
<script src="tests/statements/test.SHOW_COLUMNS.js"></script>
<script src="tests/statements/test.INSERT.js"></script>
<script src="tests/statements/test.UPDATE.js"></script>
<script src="tests/statements/test.SELECT.js"></script>

<?php require('footer.php');