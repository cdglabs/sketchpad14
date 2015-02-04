examples['bridge'] = function() {
    //sketchpad.solveEvenWithoutError = true
// --- Data ----------------------------------------------------------------    
    var massCount = 13, springCount = 22, center = [700, 200]
    var masses = [], bodies = [], springKs = [], springs = []
    for (var i = 0; i < massCount; i++)
	masses.push(10)
    for (var i = 9; i <= 12; i++)
	masses[i] = 0
    for (var i = 0; i < springCount; i++)
	springKs.push(3)
    var centerX = center[0], centerY = center[1]    
    var positionsRaw = [[centerX - 80, centerY - 60], //0
			[centerX - 80, centerY], //1
			[centerX + 80, centerY - 60], //2
			[centerX + 80, centerY], //3
			[centerX, centerY], //4
			[centerX - 160, centerY - 60], //5
			[centerX - 160, centerY + 20], //6
			[centerX + 160, centerY - 60], //7
			[centerX + 160, centerY + 20], //8
			[centerX - 220, centerY + 20], //9
			[centerX - 220, centerY + 120], //10
			[centerX + 230, centerY + 20], //11
			[centerX + 230, centerY + 120], //12
			[centerX - 280, centerY + 20], //13
			[centerX - 280, centerY + 140], //14
			[centerX + 290, centerY + 20], //15
			[centerX + 290, centerY + 140]] //16
    var springTearPointAmount = 150
    var springLens = [60, 60, 100, 100, 80, 80, 80, 80, 100, 100, 20 * Math.sqrt(17), 20 * Math.sqrt(17), 80, 80, 60, 60, 100, 100, 20 * Math.sqrt(10), 20 * Math.sqrt(10), 100, 100, 60, 60, 20 * Math.sqrt(34), 20 * Math.sqrt(34), 20 * Math.sqrt(10), 20 * Math.sqrt(10)]
    var springEnds = [[0, 1], [2, 3], [0, 4], [2, 4], [1, 4], [3, 4], [0, 5], [2, 7], [1, 5], [3, 7], [1, 6], [3, 8], [5, 6], [7, 8], [5, 9], [7, 11], [9, 6], [11, 8], [10, 6], [12, 8], [9, 10], [11, 12], [9, 13], [11, 15], [13, 10], [15, 12], [13, 14], [15, 16], [10, 14], [16, 12]]

    var solveButton = rc.add(new TextBox(new Point(700, 50), ('Turn wind off'), false, 20, 250, 40, '#f6ceec'))

    // wind
    var windOrigin = new Point(700, 100)
    var windEnd = rc.add(new Point(650, 100, 'green'))
    var wind = rc.add(new PointVector(windOrigin, windEnd, 0.1, 'wind'))

    // nodes
    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	var positionxy = positionsRaw[i]
	var body = rc.add(new Sketchpad.simulation.FreeBody(new Point(positionxy[0], positionxy[1], mass == 0 ? 'gray' : undefined), undefined, mass))
	bodies.push(body)
    }

    // beams
    for (var i = 0; i < springCount; i++) {
	var springK = springKs[i]
	var springLen = springLens[i]
	var ends = springEnds[i]
	var end1 = ends[0]
	var end2 = ends[1]
	var body1 = bodies[end1]
	var body2 = bodies[end2]
	springs.push(rc.add(new Sketchpad.simulation.Spring(body1, body2, springK, springLen, springTearPointAmount)))
    }

// --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, undefined, rc.add(new Timer(1)))

    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	if (mass > 0) {
	    var body = bodies[i]
	    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, undefined, body)
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, undefined, body, new Vector(0, 1)) //gravity
	    //rc.addConstraint(Sketchpad.simulation.AirResistanceConstraint, undefined, body, 0.0000001)
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, undefined, body, body.acceleration) //spring force
	    rc.addConstraint(Sketchpad.simulation.VelocityConstraint2, undefined, body, wind) //wind 
	}
    }

    for (var i = 0; i < springCount; i++) {
	var spring = springs[i]
	var ends = springEnds[i]
	var end1 = ends[0]
	var end2 = ends[1]
	var body1 = bodies[end1]
	var body2 = bodies[end2]
	rc.addConstraint(Sketchpad.simulation.SpringConstraint, undefined, body1, body2, spring)
    }

    // Events

    var windOn = true
    
    sketchpad.setOnEachTimeStep(function(pseudoTime, prevPseudoTime) {
	if (windOn) {
	    var d = Math.random() * 2 * (Math.random() > 0.5 ? 1 : -1)
	    wind.end.x += d
	    wind.end.y += d
	}
    }, "randomize intendity of wind")

    sketchpad.registerEvent('pointerup', function(e) {
	if (rc.selection == solveButton) {
	    windOn = !windOn
	    if (!windOn) 
		wind.end.set(wind.origin)
	    solveButton.text = 'Turn wind ' + (windOn ? 'off' : 'on')
	    rc.redraw()
	}}, "button toggles wind")
    

}
