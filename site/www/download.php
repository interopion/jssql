<?php 

function human_filesize($bytes, $decimals = 2) {
  $sz = 'BKMGTP';
  $factor = floor((strlen($bytes) - 1) / 3);
  return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}

function download($file_url) {
	header('Content-Type: text/javascript');
	header("Content-Transfer-Encoding: Binary"); 
	header("Content-disposition: attachment; filename=\"" . basename($file_url) . "\""); 
	readfile($file_url); // do the double-download-dance (dirty but worky)
}



$json = file_get_contents('../../package.json');
$json = json_decode($json);

$f_normal     = '../../' . $json->name . '.js';
$f_compressed = '../../' . $json->name . '.min.js';


if (isset($_GET['file'])) {
	if ($_GET['file'] == 'normal') {
		download($f_normal);
		exit();
	}
	elseif ($_GET['file'] == 'compressed') {
		download($f_compressed);
		exit();
	}
}

elseif (isset($_GET['view'])) {
	if ($_GET['view'] == 'normal') {
		header('Content-Type: text/javascript; charset=UTF-8');
		readfile($f_normal);
		exit();
	}
	elseif ($_GET['view'] == 'compressed') {
		header('Content-Type: text/javascript; charset=UTF-8');
		readfile($f_compressed);
		exit();
	}
}

$title = 'Download';
require('header.php');
?>

<h3>Current Version: <?php echo $json->version; ?></h3>
	
<table>
	<tr>
		<td>version <b><?php echo $json->version; ?> uncompressed</b></td>
		<td><?php echo human_filesize(filesize($f_normal), 1)?></td>
		<td><a href="/download.php?file=normal">Download</a></td>
		<td><a href="/download.php?view=normal">View</a></td>
	</tr>
	<tr>
		<td>version <b><?php echo $json->version; ?> minified</b></td>
		<td><?php echo human_filesize(filesize($f_compressed), 1)?></td>
		<td><a href="/download.php?file=compressed">Download</a></td>
		<td><a href="/download.php?view=compressed">View</a></td>
	</tr>
</table>

<p>Or browse the code on <a href="https://github.com/medapptech/jssql" target="_blank">GitHub</a></p>

<?php require('footer.php');