// Bookmarklet for use in basically baseball.  Loops through all pro game play by play data to attempt to find grounded into double plays, which count for -3 points but are not scored live.  If it's loaded on the current
// matchup, then it will append the adjustment for GIDPs to the score cell
javascript:(function() {
	function findGidps(interval) {
		if(fantasycast.liveScoring.league.leagueId != 168167) { 
			// Not Basically Baseball, stop checking
			return false;
		}
		if(console) console.log('bookmarklet -- finding gidps')
		$("#pointTotals .total .points .gidp").remove()
		for(i in fantasycast.liveScoring._proGames) {
			var proGame = fantasycast.liveScoring._proGames[i];	
			if(proGame && proGame.gameLog && proGame.gameLog.logs) {
				var logs = proGame.gameLog.logs;
				for(var j = 0; j < logs.length; j++) {
					if(logs[j].playResult.indexOf('grounded into double play') > 0) {
						var matchupPlayer = $("#starters #h2hplayer_" + logs[j].batterId)
						if(matchupPlayer.length > 0) {
							// Which team is the player on?
							var totalsSpan = (matchupPlayer.closest('.slot').children()[0] == matchupPlayer[0]) ? $("#pointTotals .total .points span[id^=team_totpts_]")[0] : $("#pointTotals .total .points span[id^=team_totpts_]")[1];
							var subtraction = $(totalsSpan).parent().find('.gidp')
							if(subtraction.length > 0) {  // Already have some gidps
								var gidpEl = $(subtraction[0]);
								var newCount = gidpEl.data("count") + 1;
								var adjPoints = parseInt(totalsSpan.innerHTML) - (3 * newCount); // -3 points per gidp
								gidpEl.data("count", newCount);
								subtraction[0].innerHTML = '(-' + (3 * newCount) + '&#8776; ' + adjPoints + ')</span>';
								gidpEl.attr('title', gidpEl.attr('title') + ', ' + logs[j].playResult.split(',')[0]);
							} else { // First team gidp
								var adjPoints = parseInt(totalsSpan.innerHTML) - 3;
								subtraction = $('<span class="gidp" data-count="1" style="font-size:9pt; color:red; margin-left:5px" title="' + logs[j].playResult.split(',')[0] + '">(-3 &#8776; ' + adjPoints + ')</span>');
								$(totalsSpan).parent().append(subtraction);
							}
						}
					}
				}
			}
		}
		if(interval > 0) {
			setTimeout(function() { findGidps(interval) }, interval);
		}
	}
	findGidps(5000);
})();