function install3DSimulationConstraints(Sketchpad) {

    // This is a collection of simulation constraints that can be applied to
    // arbitrary properties of arbitrary objects. "References" are represented
    // as (object, propertyName) tuples, e.g., {obj: yourMom, prop: 'weight'}.

    Sketchpad.simulation3d = { g: 9.8, G: 6.7e-11 } // G: Nm2/kg2 

    var minus = Sketchpad.geom3d.minus
    var plus = Sketchpad.geom3d.plus
    var scaledBy = Sketchpad.geom3d.scaledBy
    var magnitude = Sketchpad.geom3d.magnitude
    var normalized = Sketchpad.geom3d.normalized
    var distance = Sketchpad.geom3d.distance
    var angle = Sketchpad.geom3d.angle

    // Classes

    Sketchpad.simulation3d.FreeBody = function Sketchpad__simulation3d__FreeBody(position, optRadius, optDrawnRadius, optMass, optColor) {
	this.position = position
	this.mass = optMass || 10
	this.velocity = new Vector3D(0, 0, 0)
	this.acceleration = new Vector3D(0, 0, 0)
	this.radius = optRadius || this.position.radius
	this.drawnRadius = optDrawnRadius || this.radius
	rc.add(new Sphere(position, optColor, this.drawnRadius))
    }

    sketchpad.addClass(Sketchpad.simulation3d.FreeBody)

    Sketchpad.simulation3d.FreeBody.prototype.propertyTypes = {position: 'Point3D', mass: 'Number', radius: 'Number'}

    Sketchpad.simulation3d.Spring = function Sketchpad__simulation3d__Spring(body1, body2, k, length, tearPointAmount, optColor) {
	this.body1 = body1
	this.body1 = body2
	this.line = rc.add(new Cylinder(body1.position, body2.position, optColor))
	this.k = k
	this.length = length    
	this.tearPointAmount = tearPointAmount
	this.torn = false
    }
    
    sketchpad.addClass(Sketchpad.simulation3d.Spring)
    
    Sketchpad.simulation3d.Spring.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', k: 'Number', length: 'Number', teatPointAmount: 'Number'}
    
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
		color.set('gray')
		color.r += stretch
	    }
	}
    }
	    
    // Motion Constraint
	
    Sketchpad.simulation3d.VelocityRelation = function Sketchpad__simulation3d__VelocityRelation(body) {
	this.body = body
	this.position = body.position
	this.velocity = body.velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityRelation, true)

    Sketchpad.simulation3d.VelocityRelation.prototype.propertyTypes = {body: 'FreeBody'}

    Sketchpad.simulation3d.VelocityRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity, dt)), this.position))
    }

    Sketchpad.simulation3d.VelocityRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity, dt))}
    }

    Sketchpad.simulation3d.VelocityRelation.description = function() { return  "Sketchpad.simulation3d.VelocityRelation(FreeBody Body) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityRelation.prototype.description = function() { return  "for Body " + this.body.__toString + " Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + "," +  this.velocity.z + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation3d.VelocityRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	this.lastPosition = scaledBy(this.position, 1)
    }
    
    // Body With Velocity Constraint

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation = function Sketchpad__simulation3d__VelocityAsLineSegmentRelation(body, velocity) {
	this.body = body
	this.position = body.position
	this.velocity = velocity
    }

    sketchpad.addClass(Sketchpad.simulation3d.VelocityAsLineSegmentRelation, true)

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Point'}
    
    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt)), this.position))
    }
    
    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {position: plus(this.lastPosition, scaledBy(this.velocity.magnitude(), dt))}
    }

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.description = function() { return  "Sketchpad.simulation3d.VelocityAsLineSegmentRelation(FreeBody Body, PointVector3D Velocity) states for Body: Pos = old(Pos) + Velocity * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Pos = old(Pos) + (" + this.velocity.x + "," +  this.velocity.y + "," +  this.velocity.z + ") * dt, where dt is the frame step time amount ." }
    
    Sketchpad.simulation3d.VelocityAsLineSegmentRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastPosition = scaledBy(this.position, 1)
    }

    // Acceleration Constraint

    Sketchpad.simulation3d.AccelerationRelation = function Sketchpad__simulation3d__AccelerationRelation(body, acceleration) {
	this.body = body
	this.velocity = body.velocity
	this.acceleration = acceleration
    }

    sketchpad.addClass(Sketchpad.simulation3d.AccelerationRelation, true)

    Sketchpad.simulation3d.AccelerationRelation.prototype.propertyTypes = {body: 'FreeBody', velocity: 'Vector3D'}

    Sketchpad.simulation3d.AccelerationRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return magnitude(minus(plus(this.lastVelocity, scaledBy(this.acceleration, dt)), this.velocity))
    }

    Sketchpad.simulation3d.AccelerationRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var dt = pseudoTime - prevPseudoTime
	return {velocity: plus(this.lastVelocity, scaledBy(this.acceleration, dt))}
    }

    Sketchpad.simulation3d.AccelerationRelation.description = function() { return  "Sketchpad.simulation3d.AccelerationRelation(FreeBody Body, Vector Acceleration) states for Body: Velocity = old(Velocity) + Acceleration * (pseudoTime - prevPseudoTime) ." }

    Sketchpad.simulation3d.AccelerationRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) + (" + this.acceleration.x + "," +  this.acceleration.y + "," +  this.acceleration.z + ") * dt, where dt is the frame step time amount ." }

    Sketchpad.simulation3d.AccelerationRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }

    // Air Resistance Constraint

    Sketchpad.simulation3d.FrictionRelation = function Sketchpad__simulation3d__FrictionRelation(body, scale) {
	this.body = body
	this.velocity = body.velocity
	this.scale = -scale
    }

    sketchpad.addClass(Sketchpad.simulation3d.FrictionRelation, true)

    Sketchpad.simulation3d.FrictionRelation.prototype.propertyTypes = {scale: 'Number', body: 'FreeBody'}

    Sketchpad.simulation3d.FrictionRelation.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(scaledBy(this.lastVelocity, this.scale), this.velocity))
    }

    Sketchpad.simulation3d.FrictionRelation.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {velocity: scaledBy(this.lastVelocity, this.scale)}
    }

    Sketchpad.simulation3d.FrictionRelation.description = function() { return  "Sketchpad.simulation3d.FrictionRelation(FreeBody Body, Number Scale) states for Body: Velocity = old(Velocity) * Scale ." }

    Sketchpad.simulation3d.FrictionRelation.prototype.description = function() { return  "for Body " + this.body.__toString + ": Velocity = old(Velocity) * " + this.scale +" ." }

    Sketchpad.simulation3d.FrictionRelation.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {	
	this.lastVelocity = scaledBy(this.velocity, 1)
    }


    //  Spring Constraint

    Sketchpad.simulation3d.Springiness = function Sketchpad__simulation3d__Springiness(body1, body2, spring) {
	this.body1 = body1
	this.body2 = body2
	this.position1 = body1.position
	this.velocity1 = body1.velocity
	this.acceleration1 = body1.acceleration
	this.mass1 = body1.mass
	this.position2 = body2.position
	this.velocity2 = body2.velocity
	this.acceleration2 = body2.acceleration
	this.mass2 = body2.mass
	this.spring = spring
	this._lastVelocities = [undefined, undefined]
    }

    sketchpad.addClass(Sketchpad.simulation3d.Springiness, true)

    Sketchpad.simulation3d.Springiness.prototype.propertyTypes = {body1: 'FreeBody', body2: 'FreeBody', spring: 'Spring'}

    Sketchpad.simulation3d.Springiness.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var spring = this.spring
	if (spring.torn) {
	    return 0
	}
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	var err = 0
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    if (mass > 0) { // if not anchored
		var currAcceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)		
		var stretchLen =  springCurrLen - spring.length
		var newAccelerationMag = spring.k * stretchLen / mass
		var acc = scaledBy(normalized(vector), -newAccelerationMag)
		err += magnitude(minus(acc, currAcceleration))
	    }
	}
	return err
    }

    Sketchpad.simulation3d.Springiness.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var soln = {}
	var spring = this.spring
	var positions = [this.position1, this.position2]
	var masses = [this.mass1, this.mass2]
	var velocities = [this.velocity1, this.velocity2]
	var accelerations = [this.acceleration1, this.acceleration2]
	for (var i = 0; i <= 1; i++) {
	    var j = (i + 1) % 2
	    var mass = masses[j]
	    var acc, torn = false
	    if (mass > 0) { // if not anchored		
		var acceleration = accelerations[j]
		var position1 = positions[i]
		var position2 = positions[j]
		var vector = minus(position2, position1)
		var springCurrLen = magnitude(vector)
		var stretchLen =  springCurrLen - spring.length
		// if not torn apart...
		torn = stretchLen > spring.tearPointAmount
		if (!torn) {
		    var newAccelerationMag = spring.k * stretchLen / mass
		    acc = scaledBy(normalized(vector), -newAccelerationMag)
		} 
	    }
	    if (torn)
		soln['spring'] = {torn: true}
	    if (acc)
		soln['acceleration' + (j+1)] = acc
	}	
	return soln
    }
    
    Sketchpad.simulation3d.Springiness.description = function() { return  "Sketchpad.simulation3d.Springiness(FreeBody Body1, FreeBody Body2, Spring S) states that spring S has been attached to two bodies Body1 and Body2." }

    Sketchpad.simulation3d.Springiness.prototype.description = function() { return  "spring " + this.spring.__toString + " has been attached to two bodies " + this.body1.__toString + " and " + this.body2.__toString + "." }


    //  OrbitalMotion Constraint

    Sketchpad.simulation3d.OrbitalMotion = function Sketchpad__simulation3d__OrbitalMotion(sun, moon, distanceDownscale) {
	this.sun = sun
	this.moon = moon
	this.acceleration = moon.acceleration
	this.distanceDownscale = (distanceDownscale || (1e9 / 2))
    }

    sketchpad.addClass(Sketchpad.simulation3d.OrbitalMotion, true)

    Sketchpad.simulation3d.OrbitalMotion.prototype.propertyTypes = {sun: 'FreeBody', moon: 'FreeBody'}

    Sketchpad.simulation3d.OrbitalMotion.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	this._targetAcceleration = this.currentGravityAcceleration()
	return magnitude(minus(this._targetAcceleration, this.acceleration))	
    }

    Sketchpad.simulation3d.OrbitalMotion.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {acceleration: this._targetAcceleration}
    }

    Sketchpad.simulation3d.OrbitalMotion.description = function() { return  "Sketchpad.simulation3d.OrbitalMotion(FreeBody Sun, FreeBody Moon) states that Moon body is orbiting around Sun body according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotion.prototype.description = function() { return  "Moon body " + this.moon.__toString + " is orbiting around Sun body " + this.sun.__toString + " according to simple orbital motion formula." }

    Sketchpad.simulation3d.OrbitalMotion.prototype.currentGravityAcceleration = function() {
	var p1 = this.moon.position, p2 = this.sun.position
	var dist0 = distance(p1, p2)
	var dist = dist0 * this.distanceDownscale	
	var aMag0 = (Sketchpad.simulation3d.G * this.sun.mass) / (dist * dist)
	var aMag = aMag0 / this.distanceDownscale
	var slopeV = Sketchpad.simulation.slopeVector({x: p1.x, y: p1.z}, {x: p2.x, y: p2.z}) //cheat to use 2D X-Z plane
	return {x: slopeV.x * aMag, y: 0, z: slopeV.y * aMag}
    }
    
}

module.exports.install = install3DSimulationConstraints
