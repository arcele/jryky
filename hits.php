<?php
include_once('config/database.php');  // Config file contains $database declaraion
$connection = mysql_connect($database['server'], $database['login'], $database['password']);
if(!$connection) {
  die("Can't connect to db. ". mysql_error());
}
mysql_select_db('jryankel_jryky');

$countQueryString = "SELECT count(*) as total from hits";

$firstResult = 0;
$resultsPerPage = 25;
$additionalParams = '';
if(isset($_GET['f'])) {
	$firstResult = $_GET['f'];	
}

$queryString = "SELECT * FROM hits";
if(isset($_GET['r'])) {
	// Select results only for specified referer
	$queryString .= " WHERE referer = '". urldecode($_GET['r']) ."'";
	$countQueryString .= " WHERE referer = '". urldecode($_GET['r']) ."'";
	echo '<p>Showing results for referer: <a href="' . $_GET['r'] . '">' . $_GET['r'] . '</a></p>';
	echo '<p><a href="hits.php">Show All Results</a></p>';
	$additionalParams = "&r=" . urlencode($_GET['r']);
}
$queryString .= " ORDER BY id desc limit " . $firstResult . ", " . $resultsPerPage;
$query = mysql_query($queryString . ";");
$countQuery = mysql_query($countQueryString);
$count = mysql_fetch_array($countQuery);  // $count['total'] holds total number of hits.


echo '<table border="1" cellpadding="1">';
echo '<tr><th>id</th><th>ip</th><th>host</th><th>referer</th><th>when</th></tr>';
while($row = mysql_fetch_assoc($query)) {
  $host = gethostbyaddr($row['ip']);
  echo '<tr><td>'. $row['id'] .'</td>';
  echo '<td>'. $row['ip'] .'</td>';
  echo '<td>' . $host . '</td>';
  echo '<td>';
  if($row['referer'] != '') {
  	echo '<a href="?r=' . urlencode($row['referer']) . '">' . $row['referer'] . '</a>';
  } else {
  	'-';
  }
  echo '<td>'. $row['ts_created'] .'</td></tr>';
}
mysql_close($connection);
echo '</table>';

if($firstResult + $resultsPerPage < $count['total']) {
	echo '<a href="?f='. ($firstResult + $resultsPerPage) . $additionalParams .'">&laquo; older</a>';
	echo '&nbsp;&nbsp;&nbsp;';
}
if($firstResult > 0) {
	echo '<a href="?f='. max($firstResult-25, 0). $additionalParams .'">newer &raquo;</a>';
}
?>