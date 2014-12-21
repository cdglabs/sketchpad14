function install3DSimulationConstraints(Sketchpad) {

    // This is a collection of simulation constraints that can be applied to
    // arbitrary properties of arbitrary objects. "References" are represented
    // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

    Sketchpad.simulation3d = { g: 9.8 }

    var minus = Sketchpad.geom3d.minus
    var plus = Sketchpad.geom3d.plus
    var scaledBy = Sketchpad.geom3d.scaledBy
    var magnitude = Sketchpad.geom3d.magnitude
    var normalized = Sketchpad.geom3d.normalized
    var distance = Sketchpad.geom3d.distance
    var angle = Sketchpad.geom3d.angle

    // Classes
    
    Sketchpad.simulation3d.Spring = function Sketchpad__simulation3d__Spring(line, k, length, tearPointAmount) {
	this.line = rc.add(line)
	this.k = k
	this.length = length    
	this.tearPointAmount = tearPointAmount
	this.torn = false
    }
    
    sketchpad.addClass(Sketchpad.simulation3d.Spring)
    
    Sketchpad.simulation3d.Spring.prototype.propertyTypes = {line: 'Cylinder', k: 'Number', length: 'Number', teatPointAmount: 'Number'}
    
    Sketchpad.simulation3d.Spring.prototype.solutionJoins = function() {
	return {torn: rc.sketchpad.lastOneWinsJoinSolutions}
    }

    Sketchpad.simulation3d.Spring.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	if (this.line) {
	    if (this.torn) {
		rc.remove(this.line)
		this.line = undefined
	    } else {
		var height = this.line.getHeight(), length = this.length
		var stretch = Math.abs(height - length) / length
		var color = this.line._sceneObj.material.color
		color.set('blue')
		color.r += stretch
	    }
	}
    }
	    
    // Motion Constraint

    Sketchpad.simulation3d.VelocityConstraint = function Sketchpad__simulation3d__VelocityConstraint(position, velocity) {
	this.position = position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint, true)

    Sketchpad.simulation3d.VelocityConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint(Point3D Pos, Vector3D Velocity) states Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint.prototype.propertyTypes = {position: 'Point3D', velocity: 'Vector3D'}

    Sketchpad.simulation3d.VelocityConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    Sketchpad.simulation3d.VelocityConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }

    Sketchpad.simulation3d.VelocityConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }

    // Body With Velocity Constraint

    Sketchpad.simulation3d.VelocityConstraint2 = function Sketchpad__simulation3d__VelocityConstraint2(position, velocity) {
	this.position = position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityConstraint2, true)

    Sketchpad.simulation3d.VelocityConstraint2.prototype.description = function() { return  "Sketchpad.simulation3d.VelocityConstraint2(Point Pos, PointVector3D Velocity) states Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityConstraint2.prototype.propertyTypes = {position: 'Point', velocity: 'Point'}
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }

    Sketchpad.simulation3d.VelocityConstraint2.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation3d.VelocityConstraint2.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    // Acceleration Constraint

    Sketchpad.simulation3d.AccelerationConstraint = function Sketchpad__simulation3d__AccelerationConstraint(velocity, acceleration) {
	this.velocity = velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation3d.AccelerationConstraint, true)

    Sketchpad.simulation3d.AccelerationConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.AccelerationConstraint(Vector Velocity, Vector Acceleration) states Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.propertyTypes = {position: 'Point3D', velocity: 'Vector3D'}

    Sketchpad.simulation3d.AccelerationConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation3d.AccelerationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

        // Air Resistance Constraint

    Sketchpad.simulation3d.AirResistanceConstraint = function Sketchpad__simulation3d__AirResistanceConstraint(velocity, scale) {
	this.velocity = velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation3d.AirResistanceConstraint, true)

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.AirResistanceConstraint(Vector3D Velocity, Number Scale) states Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.propertyTypes = {scale: 'Number', velocity: 'Vector'}

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation3d.AirResistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    //  Spring Constraint

    Sketchpad.simulation3d.SpringConstraint = function Sketchpad__simulation3d__SpringConstraint(position1, velocity1, acceleration1, mass1, position2, velocity2, acceleration2, mass2, spring) {
	this.position1 = position1
	this.velocity1 = velocity1
	this.acceleration1 = acceleration1
	this.mass1 = mass1
	this.position2 = position2
	this.velocity2 = velocity2
	this.acceleration2 = acceleration2
	this.mass2 = mass2
	this.spring = spring
	this._lastVelocities = [undefined, undefined]
    }

    sketchpad.addClass(Sketchpad.simulation3d.SpringConstraint, true)

    Sketchpad.simulation3d.SpringConstraint.prototype.description = function() { return  "Sketchpad.simulation3d.SpringConstraint(Point Pos1, Vector Vel1, Vector Acc1, Number Mass1, Point Pos2, Vector Vel2, Vector Acc2, Number Mass2, Spring S) states that spring S has been attached to two bodies with positions, velocities, accelerations, and masses of respectively Pos1, Pos2, Vel1, Vel2, Acc1, Acc2, Mass1, Mass2. " }

    Sketchpad.simulation3d.SpringConstraint.prototype.propertyTypes = {position1: 'Point', velocity1: 'Vector', acceleration1: 'Vector', mass1: 'Number', position2: 'Point', velocity2: 'Vector', acceleration2: 'Vector', mass2: 'Number', spring: 'Spring'}

    Sketchpad.simulation3d.SpringConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this._lastVelocities[0] = scaledBy(this.velocity1, 1)
	this._lastVelocities[1] = scaledBy(this.velocity2, 1)
    }

    Sketchpad.simulation3d.SpringConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var spring = this.spring
	if (spring.torn) {
	    return 0
	}
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var dt = pseudoTime - prevPseudoTime
	var err = 0
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)		
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag = spring.k * stretchLen / mass
		var acc = scaledBy(normalized(vector), -newAccelerationMag)
		err += magnitude(minus(plus(this._lastVelocities[j], scaledBy(acc, dt)), velocities[j]))
	    }
	}
	return err
    }

    Sketchpad.simulation3d.SpringConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var soln = {}
	var spring = this.spring
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var dt = pseudoTime - prevPseudoTime
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var d = {x: 0, y: 0, z: 0}
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		if (stretchLen < spring.tearPointAmount) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    var acc = scaledBy(normalized(vector), -newAccelerationMag)
		    d = plus(this._lastVelocities[j], scaledBy(acc, dt))
		} else {
		    soln['spring'] = {torn: true}
		}
	    }
	    soln['velocity' + (j+1)] = d
	}	
	return soln
    }

}

module.exports.install = install3DSimulationConstraints
