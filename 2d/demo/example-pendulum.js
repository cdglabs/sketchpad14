examples['pendulum'] = function() {

// --- Data ----------------------------------------------------------------

    var massCount = 2, springCount = 1, center = [700, 200]
    var bodies = [], masses = [], springKs = [], springs = []
    for (var i = 0; i < massCount; i++)
	masses.push(30)
    for (var i = 0; i <= 0; i++)
	masses[i] = 0
    for (var i = 0; i < springCount; i++)
	springKs.push(10)
    var centerX = center[0], centerY = center[1]    
    var positionsRaw = [[centerX - 80, centerY - 60], //0
			[centerX - 80, centerY] //1
			] 
    var springTearPointAmount = 350
    var springLens = [100]
    var springEnds = [[0, 1]]

    // nodes
    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	var positionxy = positionsRaw[i]
	bodies.push(new Sketchpad.simulation.FreeBody(new Point(positionxy[0], positionxy[1]), undefined, mass))
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

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(0.5)))
    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	if (mass > 0) {
	    var body = bodies[i]
	    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, body)
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, body, new Vector(0, 0.8)) //gravity
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, body, body.acceleration) //spring force
	}
    }

    for (var i = 0; i < springCount; i++) {
	var spring = springs[i]
	var ends = springEnds[i]
	var end1 = ends[0]
	var end2 = ends[1]
	var body1 = bodies[end1]
	var body2 = bodies[end2]
	rc.addConstraint(Sketchpad.simulation.SpringConstraint, body1, body2, spring)
    }

    var rocket = rc.add(new Sketchpad.simulation.FreeBody(new Point(300, 100, 'brown'), undefined, 10))
    var rocketLength = 16
    var jetAcceleration = new Vector(0,-15.0)

    var groundP1 = rc.add(new Point(600, 700))
    var wallP3 = rc.add(new Point(200, 700))
    var wall2 = rc.add(new Line(wallP3, groundP1))

    var p1 = rc.add(new Point(200, 200))
    var p2 = rc.add(new Point(300, 200))    
    rc.add(new Line(p1, p2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, p1, p2, 100)
    rc.addConstraint(Sketchpad.geom.MotorConstraint, p1, p2, 1)

    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocket, wall2.p1, wall2.p2)
    rc.addConstraint(Sketchpad.simulation.BounceConstraint, bodies[1], wall2.p1, wall2.p2)
    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, rocket, {x: 0, y: Sketchpad.simulation.g})
    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, rocket)

}
