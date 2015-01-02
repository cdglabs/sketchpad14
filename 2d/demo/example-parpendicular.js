var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus

// --- Constraint Defs -------------------------------------------------------

Sketchpad.geom.ParPendicularConstraint = function Sketchpad__geom__ParPendicularConstraint(p1, p2, p3, p4) {
    this.p1 = p1
    this.p2 = p2
    this.p3 = p3
    this.p4 = p4
    this.parC = new Sketchpad.geom.OrientationConstraint(p1, p2, p3, p4, 0)
    this.perC = new Sketchpad.geom.OrientationConstraint(p1, p2, p3, p4, Math.PI / 2)
}

sketchpad.addClass(Sketchpad.geom.ParPendicularConstraint, true)

Sketchpad.geom.ParPendicularConstraint.prototype.description = function() {
    return "Sketchpad.geom.ParPendicularConstraint(Point P1, Point P2, Point P3, Point P4) says line sections P1-2 & P3-4 should be either parallel or perpendicular. If in 'auto' mode, the switch happens on every 100 ticks. Else, if 'space' has been pressed ('manual' mode) the toggle happens with each hit of the 'space.'"
}

Sketchpad.geom.ParPendicularConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point', parC: 'OrientationConstraint', perC: 'OrientationConstraint'}

Sketchpad.geom.ParPendicularConstraint.dummy = function(x, y) {
    return new Sketchpad.geom.ParPendicularConstraint(Point.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y), Point.dummy(x, y)) 
}

Sketchpad.geom.ParPendicularConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {	
    return (scratch.toggle ? this.parC : this.perC).computeError(pseudoTime, prevPseudoTime) 
}

Sketchpad.geom.ParPendicularConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {	
    return (scratch.toggle ? this.parC : this.perC).solve(pseudoTime, prevPseudoTime) 
}

Sketchpad.geom.ParPendicularConstraint.prototype.draw = function(canvas, origin) {
    return (scratch.toggle ? this.parC : this.perC).draw(canvas, origin) 
}

examples['parpendicular'] = function() {

// --- Time / Event Handling ---------------------------------------------

    scratch = sketchpad.scratch
    scratch.auto = true
    scratch.toggle = false
    scratch.tickTime = 100
    scratch.nextTick = scratch.tickTime

    sketchpad.registerEvent('keyup', function(e) { 
	if (32 == e.which) { scratch.auto = false; scratch.toggle = !scratch.toggle } },
			       "When 'space' bar is pressed, the program is toggled between 'manual' and 'auto' mode.")
    
    sketchpad.setOnEachTimeStep(function(pseudoTime, prevPseudoTime) {
	if (scratch.auto && pseudoTime > scratch.nextTick) {
	    scratch.nextTick += scratch.tickTime
	    scratch.toggle = !scratch.toggle
	}
    }, "If in 'auto' mode and 100 ticks have passed, we toggle the constraint choice.")

// --- Data ----------------------------------------------------------------

    rc.add(new TextBox(new Point(550, 50), "-- ( press 'space' to manually flip ) --", false, 20))
    var p1 = rc.add(new Point(500, 200))
    var p2 = rc.add(new Point(1000, 700))
    var l1 = rc.add(new Line(p1, p2))
    var p3 = rc.add(new Point(1100, 300))
    var p4 = rc.add(new Point(600, 800))
    var l2 = rc.add(new Line(p3, p4))    

// --- Constraints ---------------------------------------------------------
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(1)))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, p1, p2, 300)
    rc.addConstraint(Sketchpad.geom.LengthConstraint, p3, p4, 300)	
    rc.addConstraint(Sketchpad.geom.ParPendicularConstraint, p1, p2, p3, p4)
}
