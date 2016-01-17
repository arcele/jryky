<?php
include_once('config/database.php');  // Config file contains $database declaraion
$connection = mysql_connect($database['server'], $database['login'], $database['password']);
if(!$connection) {
  die("Can't connect to db. ". mysql_error());
}
mysql_select_db('jryankel_jryky');

$countQuery = mysql_query("SELECT count(*) as total from hits");
$count = mysql_fetch_array($countQuery);  // $count['total'] holds total number of hits.

$firstResult = 0;
$resultsPerPage = 25;
if(isset($_GET['f'])) {
	$firstResult = $_GET['f'];	
}
$query = mysql_query("SELECT * FROM hits ORDER BY id desc limit " . $firstResult . ", " . $resultsPerPage . ";");

echo '<table border="1" cellpadding="1">';
echo '<tr><th>id</th><th>ip</th><th>host</th><th>referer</th><th>when</th></tr>';

while($row = mysql_fetch_assoc($query)) {
  $host = gethostbyaddr($row['ip']);
  echo '<tr><td>'. $row['id'] .'</td><td>'. $row['ip'] .'</td><td>' . $host . '</td><td>' . $row['referer'] .'</td><td>'. $row['ts_created'] .'</td></tr>';
}
mysql_close($connection);
echo '</table>';

if($firstResult + $resultsPerPage < $count['total']) {
	echo '<a href="?f='. ($firstResult + $resultsPerPage) .'">&laquo; older</a>';
	echo '&nbsp;&nbsp;&nbsp;';
}
if($firstResult > 0) {
	echo '<a href="?f='. max($firstResult-25, 0).'">newer &raquo;</a>';
}
?>