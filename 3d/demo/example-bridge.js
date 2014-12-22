examples['bridge']= function() {
    
    // --- Data ----------------------------------------------------------------

    var massCount = 26, springCount = 52, center = [0, 0, 0]
    var masses = [], positions = [], velocities = [], accelerations = [], springKs = [], springs = []
    for (var i = 0; i < massCount; i++)
	masses.push(30)
    for (var i = 9; i <= 12; i++)
	masses[i] = 0
    for (var i = 22; i <= 25; i++)
	masses[i] = 0
    for (var i = 0; i < springCount; i++)
	springKs.push(30)
    var centerX = center[0], centerY = center[1], centerZ = center[2]    
    var positionsRaw = [
	[centerX - 80, centerY - 60, centerZ], //0
	[centerX - 80, centerY, centerZ], //1
	[centerX + 80, centerY - 60, centerZ], //2
	[centerX + 80, centerY, centerZ], //3
	[centerX, centerY, centerZ], //4
	[centerX - 160, centerY - 60, centerZ], //5
	[centerX - 160, centerY + 20, centerZ], //6
	[centerX + 160, centerY - 60, centerZ], //7
	[centerX + 160, centerY + 20, centerZ], //8
	[centerX - 220, centerY + 20, centerZ], //9
	[centerX - 220, centerY + 120, centerZ], //10
	[centerX + 230, centerY + 20, centerZ], //11
	[centerX + 230, centerY + 120, centerZ], //12
	[centerX - 80, centerY - 60, centerZ - 100], //0
	[centerX - 80, centerY, centerZ - 100], //1
	[centerX + 80, centerY - 60, centerZ - 100], //2
	[centerX + 80, centerY, centerZ - 100], //3
	[centerX, centerY, centerZ - 100], //4
	[centerX - 160, centerY - 60, centerZ - 100], //5
	[centerX - 160, centerY + 20, centerZ - 100], //6
	[centerX + 160, centerY - 60, centerZ - 100], //7
	[centerX + 160, centerY + 20, centerZ - 100], //8
	[centerX - 220, centerY + 20, centerZ - 100], //9
	[centerX - 220, centerY + 120, centerZ - 100], //10
	[centerX + 230, centerY + 20, centerZ - 100], //11
	[centerX + 230, centerY + 120, centerZ - 100], //12
    ] 
    var springTearPointAmount = 150
    var springLens = [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
		      80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
		      80, 80, 80, 80, 80, 80, 80, 80] 
    var springEnds = [[0, 1], [2, 3], [0, 4], [2, 4], [1, 4], [3, 4], [0, 5], [2, 7], [1, 5], [3, 7], [1, 6], [3, 8], [5, 6], [7, 8], [5, 9], [7, 11], [9, 6], [11, 8], [10, 6], [12, 8], [9, 10], [11, 12],
		      [13,14],[15,16],[13,17],[15,17],[14,17],[16,17],[13,18],[15,20],[14,18],[16,20],[14,19],[16,21],[18,19],[20,21],[18,22],[20,24],[22,19],[24,21],[23,19],[25,21],[22,23],[24,25],
		      [0, 13], [2, 15], [5, 18], [7, 20], [9, 22], [10, 23], [11, 24], [12, 25]
		     ]

    // wind
    var windOrigin = new Point3D(0, 0, -300)
    var windEnd = new Point3D(0, 0, -200)
    var wind = rc.add(new PointVector3D(windOrigin, windEnd, 0.05, 'brown', 'wind'))
    
    // nodes
    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	var positionxy = positionsRaw[i]
	var position = rc.add(new Point3D(positionxy[0], positionxy[1], positionxy[2]))
	var body = rc.add(new Sphere(position, mass == 0 ? 'gray' : undefined))
	var velocity = new Vector3D(0, 0, 0)
	var acceleration = new Vector3D(0, 0, 0)
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
	springs.push(rc.add(new Sketchpad.simulation3d.Spring(new Cylinder(position1, position2, 'blue'), springK, springLen, springTearPointAmount)))
    }

    // --- Constraints ---------------------------------------------------------
    for (var i = 0; i < massCount; i++) {
	var mass = masses[i]
	if (mass > 0) {
	    var position = positions[i]
	    var velocity = velocities[i]
	    var acceleration = accelerations[i]
	    rc.addConstraint(Sketchpad.simulation3d.VelocityConstraint, position, velocity)
	    rc.addConstraint(Sketchpad.simulation3d.AccelerationConstraint, velocity, new Vector3D(0, -Sketchpad.simulation.g, 0)) //gravity
	    rc.addConstraint(Sketchpad.simulation3d.AirResistanceConstraint, velocity, 0.05)
	    rc.addConstraint(Sketchpad.simulation3d.AccelerationConstraint, velocity, acceleration) //spring force
	    rc.addConstraint(Sketchpad.simulation3d.VelocityConstraint2, position, wind) //wind 
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
	rc.addConstraint(Sketchpad.simulation3d.SpringConstraint, position1, velocity1, acceleration1, mass1, position2, velocity2, acceleration2, mass2, spring)
    }
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(1)))

    // Events
    
    sketchpad.setOnEachTimeStep(function(pseudoTime, prevPseudoTime) {
	wind.end.x += Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1)
	wind.end.y += Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1)
	wind.end.z += Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1)
    }, "randomize intendity of wind")

};

