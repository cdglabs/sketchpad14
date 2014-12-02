examples['pendulum'] = function() {

// --- Data ----------------------------------------------------------------

    var massCount = 2, springCount = 1, center = [700, 200]
    var masses = [], positions = [], velocities = [], accelerations = [], springKs = [], springs = []
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
	var position = rc.add(new Point(positionxy[0], positionxy[1], mass == 0 ? 'gray' : undefined))
	var velocity = new Vector(0, 0)
	var acceleration = new Vector(0, 0)
	positions.push(position)
	velocities.push(velocity)
	accelerations.push(acceleration)
    }

    // beams
    for (var i = 0; i < springCount; i++) {
	var springK = springKs[i]
	var springLen = springLens[i]
	var ends = springEnds[i]
	var end1 = ends[0]
	var end2 = ends[1]
	var position1 = positions[end1]
	var position2 = positions[end2]
	springs.push(rc.add(new Sketchpad.simulation.Spring(new Line(position1, position2), springK, springLen, springTearPointAmount)))
    }

// --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Sketchpad.simulation.Timer(.05)))
    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	if (mass > 0) {
	    var position = positions[i]
	    var velocity = velocities[i]
	    var acceleration = accelerations[i]
	    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, position, velocity)
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, velocity, new Vector(0, 0.8)) //gravity
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, velocity, acceleration) //spring force
	}
    }

    for (var i = 0; i < springCount; i++) {
	var spring = springs[i]
	var ends = springEnds[i]
	var end1 = ends[0]
	var end2 = ends[1]
	var mass1 = masses[end1]
	var mass2 = masses[end2]
	var position1 = positions[end1]
	var position2 = positions[end2]
	var velocity1 = velocities[end1]
	var velocity2 = velocities[end2]
	var acceleration1 = accelerations[end1]
	var acceleration2 = accelerations[end2]
	rc.addConstraint(Sketchpad.simulation.SpringConstraint, position1, velocity1, acceleration1, mass1, position2, velocity2, acceleration2, mass2, spring)
    }

    var rocket = rc.add(new Point(300, 100, 'brown'))
    var rocketLength = 16
    var velocity = new Vector(0, 0)
    var jetAcceleration = new Vector(0,-15.0)

    var groundP1 = rc.add(new Point(600, 700))
    var wallP3 = rc.add(new Point(200, 700))
    var wall2 = rc.add(new Line(wallP3, groundP1))

    var p1 = rc.add(new Point(200, 200))
    var p2 = rc.add(new Point(300, 200))    
    rc.add(new Line(p1, p2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, p1, p2, 100)
    rc.addConstraint(Sketchpad.geom.MotorConstraint, p1, p2, 1)

    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocketLength, rocket, velocity, wall2.p1, wall2.p2)
    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocketLength, positions[1], velocities[1], wall2.p1, wall2.p2)
    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, velocity, {x: 0, y: Sketchpad.simulation.g})
    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, rocket, velocity)

}
