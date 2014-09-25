<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<?

// Count the visit, okay?
if($_GET['skip'] == null) {
  $connection = mysql_connect('localhost', 'jryankel_jryky', '$)AA39_-q!');
  if(!$connection) {
    // Can't connect?  Don't bail, we're only trying to log the users who hit the site.
  } else {
    mysql_select_db('jryankel_jryky');
    $result = mysql_query("INSERT into hits(ip, referer) VALUES ('". $_SERVER['REMOTE_ADDR'] ."', '". $_SERVER['HTTP_REFERER'] ."');");
    echo "<!-- INSERT into hits(ip, referer) VALUES ('". $_SERVER['REMOTE_ADDR'] ."', '". $_SERVER['HTTP_REFERER'] ."');-->";
    mysql_close($connection);
  }
}

?>
<html>
  <head>
    <title>J. Ryan Kelley</title>
    <meta name="description" content="Personal play space for J. Ryan Kelley, some guy who builds interent stuff." />
    <meta name="keywords" content="James Kelley, James Ryan Kelley, Ryan Kelley, web development, javascript, HTML5, rails, coconut water" />
    <script src="js/jquery.js"></script>
    <script src="js/kinetic.js"></script>
    <script src="js/jryky.js"></script>
    <link href="css/jryky.css" rel="stylesheet" type="text/css" />
  </head>
  <body>
    <div id="header"></div>
    <section id="social_links">
      <a href="http://twitter.com/arcele" target="_out" title="twitter"><div class="social twitter"></div></a>
      <a href="http://facebook.com/jryankelley" target="_out" title="facebook"><div class="social facebook"></div></a>
      <a href="http://linkedin.com/in/jryankelley" target="_out" title="LinkedIn"><div class="social linkedin"></div></a>
      <a href="mailto:ryan@jryky.com" title="e-mail"><div class="social email"></div></a>
    </section>

    <div id="content">
      <section class="blurb">
	<div class="profile_pic"></div>
        <p>I'm Ryan.  I like to build stuff. Not chairs, or tables, or bookshelves, I like to build the stuff that makes your phone do that cool thing, or that lets you get access to the data you need in a fun way.  I'm a web developer, currently based out of Seattle, originally from Delaware.  And I've been doing this kind of stuff for fun since 1998 and professionally since 2003.</p>
<p>I've worked with all sorts of technologies over the years on all different platforms.  PHP in Solaris?  Yup.  Rails in FreeBSD?  You know it.  HTML5 and CSS3 Development in Windows, OSX, and Ubuntu?  Of course.  I've even done some sysadmin work in Solaris, but, I really like creating tools with intuitive user interfaces.  Here's some highlights of the work that I've done</p>
      </section>      

      <section class="topic">Professional</section>
      <section class="blurb">
<p>Here are some highlights from my professional career.</p>
<ul>
        <li><img src="http://jryky.com/img/truck.png" />In January, 2006 I completed the design, development, and implementation of <a href="https://web.archive.org/web/20070209072409/http://www.trinitytransport.com/" target="_out">the corporate website</a> for Trinity Logistics, then Trinity Transport.  The site, developed in PHP, was used through 2010 as a the face of the company.  On top of standard content, and a custom cms, the site allowed customers to log in and view their payment information.  I integrated the operational system's FilePro database with the MySQL database which also allowed users to generate invoices on the fly with real time data.</li>
   <li><img src="http://jryky.com/img/ffl.png" />One of the most important peices of ESPN Fantasy Games is live scoring, a portion of the game that I've played a very heavy role in.  I built <a href="http://games.espn.go.com/ffl/fantasycast#leagueId=128&teamId=1" target="_out">Fantasy Football Fantasycast</a> and <a href="http://games.espn.go.com/fba/fantasycast#leagueId=115&teamId=16" target="_out">Fantasy Basketball Fantasycast</a>, two of our most used pages.  I also build the <a href="http://games.espn.go.com/flb/clubhouse?leagueId=123&teamId=1" target="_out">RotoLine module</a> for a different way to look at the standings of your rotisserie leagues.</li>
<li><img src="http://jryky.com/img/insider.png" />I've also built several insider tools for Fantasy Games.  Our lineup recommendation and free agency recommendations have been among the highest upsellers of insider subscriptions sitewide, and have also resulted in a software patent.</li>
   <li><img src="http://jryky.com/img/iphone.png" />In 2013, we released an all new iOS app which we then released in 2014 for Android.  My primary responsibility in the app was transaction implementation including roster management, trades, and free agency acquisitions.  The app won the <a href="http://www.webbyawards.com/winners/2013/mobile-apps/tablet-and-all-other-devices/games-tablet-all-other-devices/espn-fantasy-football-app">2013 Webby Award for Best Games Tablet App</a>.
</ul>

      </section>

      <section class="topic">Personal</section>
      <section class="blurb">
	<p>Here's some stuff that I'm building now to play with technologies and keep sharp.</p>
	<ul>
	  <li><a href="http://www.cochl.com" target="_cochl"><img src="../img/bass.jpg" />Tab Entry</a>.  Direct canvas manipulation using <a href="http://jquery.com/" target="_out">jQuery</a> to allow users to enter Guitar/Bass tabs.  Click on the strings to add notes, keep clicking the same note to increment the fret.  If you don't know anything about Tablature, <a href="http://en.wikipedia.org/wiki/Tablature" target="_out">learn more here</a>.</li>
	  <li><a href="http://www.nwbhf.com" target="nwbhf"><img src="../img/bubblehockey.jpg" />Bubble Hockey.</a> Bubble hockey game using <a href="http://kineticjs.com/" target="_out">KineticJS</a> to interact with the canvas object.</li> 
	  <li><img src="../img/logobuilder.PNG" /><a href="http://www.retirethe5.com" target="_retire5">Logo Displayer</a>. Displays an HTML5 team logo that can be used cross-platform to brand your team across all of your devices.  Written using <a href="http://kineticjs.com/" target="_out">KineticJS</a>.  Load it up and it will give you a random team logo, refresh for a new one, <a href="http://www.retirethe5.com/?&backStyle=habs&backColor=000088&foreColor=3333FF&logoLetter=W|V&fontColor=CFB53B&fontFamily=Calibri" target="_retire5">or, it will create logos with passed in parameters.</a></li>
	</ul>
      </section>

      <section class="blurb">
	<p>If you want to know more, or you just want to go grab a beer with me to catch a birds game, <a href="mailto:ryan@jryky.com">shoot me an e-mail</a>
      </section>
    </div>

    <div id="footer">
      &copy;2013 <a href="mailto:ryan@jryky.com">j. ryan kelley </a> | <a href="http://twitter.com/arcele">twitter</a> | <a href="http://facebook.com/jryankelley">facebook</a> | <a href="http://linkedin.com/in/jryankelley">LinkedIn</a>
    </div>
    <div id="subfooter"></div>

  </body>
</html>
