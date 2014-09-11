<?php 

$title = 'Unit Tests';
$head  = '<link rel="stylesheet" href="tests/qunit.css">';

require('header.php'); ?>

<div id="qunit"></div>
<div id="qunit-fixture"></div>

<script type="text/javascript" src="tests/qunit.js"></script>
<script type="text/javascript" src="/js/jquery.min.js"></script>

<script type="text/javascript">
window.JSDB_EXPORT_FOR_TESTING = true;
</script>

<script type="text/javascript" src="/js/jssql.js"></script>
<script type="text/javascript" src="/js/jssql.session.storage.js"></script>
<script type="text/javascript" src="/js/jssql.memory.storage.js"></script>
<script type="text/javascript" src="/js/jssql.socket.io.storage.js"></script>
<script type="text/javascript" src="/js/jssql.filesystem.storage.js"></script>

<script type="text/javascript">
QUnit.config.autostart = false;

QUnit.config.urlConfig.push({
	id     : "debug",
	label  : "Debug mode",
	value  : "true",
	tooltip: "Toggle debug mode for jsSQL"
});

var storageEngines = jsSQL.getRegisteredStorageEngines(), l = 0;
for (var id in storageEngines) {
	if (++l > 1) {
		QUnit.config.urlConfig.push({
		  id      : "store",
		  label   : "Storage Adapter",
		  value   : storageEngines,
		  tooltip : "What Storage Adapter to test against"
		});
		break;
	}
}


$(window).on("load", function() {
	var srageOptions = { 
		type  : QUnit.config.store || "SocketIOStorage",
		debug : !!QUnit.config.debug
	};
	
	if (srageOptions.type == "SocketIOStorage")
		srageOptions.url = "http://Vladimirs-MacBook-Pro.local:3001";
	
	jsSQL({ 
		debug         : !!QUnit.config.debug, 
		storageEngine : srageOptions
	}, function(api) {
		window.TEST_API = api;
		QUnit.start();
	});
})
</script>

<script src="tests/unit-tests-2.js"></script>
<script src="tests/test.getQueries.js"></script>
<script src="tests/Walker.js"></script>
<script src="tests/Columns.js"></script>
<script src="tests/TableRow.js"></script>
<script src="tests/test.expressions.js"></script>
<script src="tests/transaction_api.js"></script>
<script src="tests/test.Storage.js"></script>
<script src="tests/test.DateUtils.js"></script>
<script src="tests/statements/test.CREATE_DATABASE.js"></script>
<script src="tests/statements/test.CREATE_TABLE.js"></script>
<script src="tests/statements/test.USE.js"></script>
<script src="tests/statements/test.SHOW_TABLES.js"></script>
<script src="tests/statements/test.SHOW_COLUMNS.js"></script>
<script src="tests/statements/test.INSERT.js"></script>
<script src="tests/statements/test.UPDATE.js"></script>
<script src="tests/statements/test.SELECT.js"></script>

<?php require('footer.php');