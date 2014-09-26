(function() {

	Logo = {};
	Logo.stage = new Kinetic.Stage( { 
		container: 'header',
		width: window.innerWidth,
		height: 60
	} );
	Logo.layer = new Kinetic.Layer();

	// Circles
	var i = 1;
	for(var i = 0; i < 15; i++) {		
		for(var j = 0; j < 5; j++) {
			var circle = new Kinetic.Circle( {
				radius: 10,
				fill: Math.floor(Math.random() * 2) == 1 ? '#2F2669' : '#BF4799',
				strokeWidth: 0,
				opacity: .4,
				x: (i * 25 + Math.random() * 10),
				y: j * 16 + Math.random() * 5
			} );
			Logo.layer.add(circle);
		}
	}

    Logo.stage.add(Logo.layer);


})();