examples['bridge'] = function() {
    //sketchpad.solveEvenWithoutError = true
// --- Data ----------------------------------------------------------------

    var massCount = 13, springCount = 22, center = [700, 200]
    var masses = [], positions = [], velocities = [], accelerations = [], springKs = [], springs = []
    for (var i = 0; i < massCount; i++)
	masses.push(30)
    for (var i = 9; i <= 12; i++)
	masses[i] = 0
    for (var i = 0; i < springCount; i++)
	springKs.push(10)
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

    // wind
    var windOrigin = new Point(700, 100)
    var windEnd = new Point(650, 100, 'green')
    var wind = rc.add(new PointVector(windOrigin, windEnd, 0.1, 'wind'))

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

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Sketchpad.simulation.Timer(2)))

    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	if (mass > 0) {
	    var position = positions[i]
	    var velocity = velocities[i]
	    var acceleration = accelerations[i]
	    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, position, velocity)
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, velocity, new Vector(0, 4)) //gravity
	    rc.addConstraint(Sketchpad.simulation.AirResistanceConstraint, velocity, 0.05)
	    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, velocity, acceleration) //spring force
	    rc.addConstraint(Sketchpad.simulation.VelocityConstraint2, position, wind) //wind 
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


}
