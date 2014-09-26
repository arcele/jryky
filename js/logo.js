(function() {

	Logo = {};
	Logo.stage = new Kinetic.Stage( { 
		container: 'header',
		width: window.innerWidth,
		height: 110
	} );
	Logo.layer = new Kinetic.Layer();

	// Circles
	Logo.dotGroupA = new Kinetic.Group({x: Logo.stage.getWidth() / 2, y:50, offset: {x:125, y:125}});
	Logo.dotGroupB = new Kinetic.Group({x: Logo.stage.getWidth() / 2, y:50, offset: {x:125, y:125}});
	for(var i = 0; i < 10; i++) {		
		for(var j = 0; j < 10; j++) {
			var circle = new Kinetic.Circle( {
				radius: 10,
				fill: Math.floor(Math.random() * 2) == 1 ? '#2F2669' : '#BF4799',
				strokeWidth: 0,
				opacity: .3 + Math.random() / 5,
				x: i * 25 + Math.random() * 10,
				y: j * 25 + Math.random() * 5
			} );
			Math.floor(Math.random() * 2)  == 1 ? Logo.dotGroupA.add(circle) : Logo.dotGroupB.add(circle);
		}
	}
	Logo.layer.add(Logo.dotGroupA);
	Logo.layer.add(Logo.dotGroupB);
	Logo.stage.add(Logo.layer);


	Logo.title = new Kinetic.Text( {
		x:Logo.stage.getWidth() /2 - 85,
		y:30,
		text: 'j.ryan kelley',
		fontSize:35,
		fontFamily: 'Calibri',
		fill: '#aeaeae',
		opacity: .8
	} );
	Logo.layer.add(Logo.title);
	
	// ANIMATIONS
	Logo.angularSpeed = 360 / 75;
	Logo.rotateDots = new Kinetic.Animation(
		function(frame,x) {
			var angleDiff = frame.timeDiff * Logo.angularSpeed / 1000;
			Logo.dotGroupA.rotate(.7 * angleDiff);
			Logo.dotGroupB.rotate(2 * angleDiff);
		}, Logo.layer
	);
	Logo.rotateDots.start();

	// EVENTS
	Logo.title.on( 'mouseover click', function() {
		Logo.angularSpeed = 360 / 10;
		Logo.title.fill('#dacada');
	} );
	Logo.title.on( 'mouseout', function() {
		Logo.angularSpeed = 360 / 75;
		Logo.title.fill('#aeaeae');
	})

})();