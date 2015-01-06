// --- Constraint Defs -------------------------------------------------------

Sketchpad.simulation.JetEngineConstraint = function Sketchpad__simulation__JetEngineConstraint(body, jetAcceleration) {
    this.body = body
    this.velocity = body.velocity
    this.acceleration = jetAcceleration
    this.accelerationC = new Sketchpad.simulation.AccelerationConstraint(body, jetAcceleration)
}

sketchpad.addClass(Sketchpad.simulation.JetEngineConstraint)

Sketchpad.simulation.JetEngineConstraint.prototype.description = function() { return "Sketchpad.simulation.JetEngineConstrain(FreeBody Body, Vector Acceleration) applies for Body Acceleration to its Velocity only when flag scratch.spaceStillDown is true." }

Sketchpad.simulation.JetEngineConstraint.prototype.propertyTypes = {body: 'FreeBody', acceleration: 'Vector', accelerationC: 'AccelerationConstraintC'}

Sketchpad.simulation.JetEngineConstraint.dummy = function(x, y) {
    return new Sketchpad.simulation.JetEngineConstraint(Sketchpad.simulation.FreeBody.dummy(x, y), Vector.dummy(x, y))
}

Sketchpad.simulation.JetEngineConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
    if (scratch.spaceStillDown)
	this.accelerationC.onEachTimeStep(pseudoTime, prevPseudoTime)
}

Sketchpad.simulation.JetEngineConstraint.prototype.onEachTimeStepDescription = function() {
    return "If scratch.spaceStillDown is true it applies the on each tick function of Sketchpad.simulation.AccelerationConstraint."
}

Sketchpad.simulation.JetEngineConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {	
    return scratch.spaceStillDown ? this.accelerationC.computeError(pseudoTime, prevPseudoTime) : 0
}

Sketchpad.simulation.JetEngineConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {	
    return this.accelerationC.solve(pseudoTime, prevPseudoTime)
}

examples['bounce'] = function() {

    rc.setOption('renderStateTrace', true)

// --- Time / Event Handling ---------------------------------------------

    rc.sketchpad.registerEvent('keydown', function(e) { if (32 == e.which)  scratch.spaceStillDown = true }, "When spacebar is pressed set flag scratch.spaceStillDown to true.") 
    rc.sketchpad.registerEvent('keyup', function(e) { if (32 == e.which)  scratch.spaceStillDown = false }, "When spacebar is released set flag scratch.spaceStillDown to false.")

    scratch = rc.sketchpad.scratch
    scratch.spaceStillDown = false

// --- Data ----------------------------------------------------------------

    rc.add(new TextBox(new Point(600, 50), "-- ( hold 'space' to accelerate up ) --", false, 20))
    var rocket = rc.add(new Sketchpad.simulation.FreeBody(new Point(800, 100, 'brown')))
    rocket.velocity = new Vector(-1, -5)
    var jetAcceleration = new Vector(0,-2.0)

    var groundP1 = rc.add(new Point(300, 700))
    var groundP2 = rc.add(new Point(1100, 700))
    var ground1 = rc.add(new Line(groundP1, groundP2))

    var groundP3 = rc.add(new Point(600, 300))
    var groundP4 = rc.add(new Point(900, 300))
    var ground2 = rc.add(new Line(groundP3, groundP4))

    var wallP1 = rc.add(new Point(1150, 100))
    var wall1 = rc.add(new Line(wallP1, groundP2))

    var wallP3 = rc.add(new Point(200, 100))
    var wall2 = rc.add(new Line(wallP3, groundP1))
    
// --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(1)))
    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocket, ground1.p1, ground1.p2)
    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocket, ground2.p1, ground2.p2)
    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocket, wall1.p1, wall1.p2)
    rc.addConstraint(Sketchpad.simulation.BounceConstraint, rocket, wall2.p1, wall2.p2)
    rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, rocket, {x: 0, y: Sketchpad.simulation.g / 10})
    rc.addConstraint(Sketchpad.simulation.VelocityConstraint, rocket)
    rc.addConstraint(Sketchpad.simulation.JetEngineConstraint, rocket, jetAcceleration)
}
