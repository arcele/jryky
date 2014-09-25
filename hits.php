<?
$connection = mysql_connect('localhost', 'jryankel_jryky', '$)AA39_-q!');
if(!$connection) {
  die("Can't connect to db. ". mysql_error());
}
mysql_select_db('jryankel_jryky');
$query = mysql_query("SELECT * FROM hits ORDER BY id desc limit 0,25;");

echo '<table border="1" cellpadding="1">';
echo '<tr><th>id</th><th>ip</th><th>host</th><th>referer</th><th>when</th></tr>';

while($row = mysql_fetch_assoc($query)) {
  $host = gethostbyaddr($row['ip']);
  echo '<tr><td>'. $row['id'] .'</td><td>'. $row['ip'] .'</td><td>' . $host . '</td><td>' . $row['referer'] .'</td><td>'. $row['ts_created'] .'</td></tr>';
}
mysql_close($connection);
echo '</table>';

?>


