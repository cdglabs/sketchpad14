Examples.hello = { }

var scaledBy = Sketchpad.geom.scaledBy

// --- Classes -------------------------------------------------------------

// constructor

Examples.hello.Box = function Examples__hello__Box(position, width, height, timestamped) {
     this.position = position    
     this.width = width
     this.height = height
     this.timestamped = timestamped
     if (!timestamped && rc.sketchpad.scratch.objs)
	 rc.sketchpad.scratch.objs.push(this)
}

sketchpad.addClass(Examples.hello.Box)

Examples.hello.Box.prototype.propertyTypes = {position: 'Point', width: 'Number', height: 'Number'}

Examples.hello.Box.dummy = function(x, y) {
    return new Examples.hello.Box(Point.dummy(x, y), 100, 100)
}

// draw

Examples.hello.Box.prototype.draw = function(canvas, origin, options) {
    var ctxt = canvas.ctxt
    var color = (options && options['color']) ? options['color'] : (this.timestamped ? 'gray' : 'black')
    var x = this.position.x + origin.x
    var y = this.position.y + origin.y
    ctxt.beginPath()
    ctxt.rect(x, y, this.width, this.height)
    ctxt.lineWidth = 2
    ctxt.strokeStyle = color
    ctxt.stroke()
    ctxt.fillStyle = color
    ctxt.fillText('time: ' + (this.timestamped || scratch.pseudoTime), x - 20, y - 20)
    if (!this.timestamped) {
	var old = this.__scratch.snapshot
	if (old)
	    old.draw(canvas, origin)
    }
}

Examples.hello.Box.prototype.containsPoint = function(x, y) {
    var p = this.position
    var res = x >= p.x && x <= p.x + this.width && y >= p.y && y <= p.y + this.height
    return res
}

Examples.hello.Box.prototype.border = function() {
    return this
}

Examples.hello.Box.prototype.center = function() {
    return this.position.midPoint(new Point(this.position.x + this.width, this.position.y + this.height))
}

// grab point (optional)
Examples.hello.Box.prototype.grabPoint = function() {
    return this.position
}

Examples.hello.Box.prototype.snapshot = function() {
    return new Examples.hello.Box(new Point(this.position.x, this.position.y, 'gray'), this.width, this.height, scratch.pseudoTime)
}

// --- Constraint Defs -------------------------------------------------------

// constructor

Examples.hello.StackedBoxesConstraint = function Examples__hello__StackedBoxesConstraint(b1, b2) {
    this.b1 = b1
    this.b2 = b2
    this.p1 = b1.position
    this.p2 = b2.position
}

sketchpad.addClass(Examples.hello.StackedBoxesConstraint, true)

Examples.hello.StackedBoxesConstraint.prototype.description = function() { return "Examples.hello.StackedBoxesConstraint(Box b1, Box b2) states b2 should be just below b1 and aligned along X-axis." }

Examples.hello.StackedBoxesConstraint.prototype.propertyTypes = {b1: 'Box', b2: 'Box', p1: 'Point', p2: 'Point'}

Examples.hello.StackedBoxesConstraint.dummy = function(x, y) {
    return new Examples.hello.StackedBoxesConstraint(Examples.hello.Box.dummy(x, y), Examples.hello.Box(x + 100, y + 100))
}

// specification: compute error

Examples.hello.StackedBoxesConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var b1 = this.b1, b2 = this.b2, p1 = this.p1, p2 = this.p2
    return (p1.x - p2.x) + (p1.y + b1.height - p2.y)
}

// solver

Examples.hello.StackedBoxesConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {	
    var b1 = this.b1, b2 = this.b2, p1 = this.p1, p2 = this.p2
    var soln1 = {x: (p2.x + p1.x) / 2, y: (p2.y + (p1.y - b1.height)) / 2}
    var soln2 = {x: soln1.x, y: (p2.y + (p1.y + b1.height)) / 2}
    return {p1: soln1, p2: soln2}
}

// solution join function (optional: this is the default join, so unnecessary...)
/*
Point.prototype.solutionJoins = function() {
    return {x: rc.sketchpad.sumJoinSolutions,
	    y: rc.sketchpad.sumJoinSolutions}
}
*/

examples['hello world'] = function() {

// --- Time / Event Handling ---------------------------------------------
    
    // scratch data

    scratch = rc.sketchpad.scratch
    scratch.pseudoTime = 0
    scratch.objs = []
    
    // runs at start of every time tick (frame render)

    rc.sketchpad.setOnEachTimeStep(function(pseudoTime, prevPseudoTime) { scratch.pseudoTime += 1 },
				   "On each time tick we increment scratch.pseudoTime by 1.")

    // runs at end of every time tick (after solving done)

    rc.sketchpad.onSolvingDone = function(pseudoTime, prevPseudoTime) {
	// ...
    }
    
    // runs at start of every time tick (per object)

    Examples.hello.Box.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
	// ...
    }
    
    // register an event handler

    rc.sketchpad.registerEvent('keyup', function(e) { 
	if (32 == e.which) { 
	    scratch.objs.forEach(function(o) { o.__scratch.snapshot = rc.add(o.snapshot(), undefined, true) }) }}, "When spacebar is pressed we take a snaphot of the two boxes.")
    
// --- Data ----------------------------------------------------------------
    
    rc.add(new TextBox(new Point(550, 50), "-- ( press 'space' to take snapshot ) --", 20))
    var b1 = rc.add(new Examples.hello.Box(new Point(500, 200), 100, 200))
    var b2 = rc.add(new Examples.hello.Box(new Point(800, 500), 300, 200))

// --- Constraints ---------------------------------------------------------
    
    rc.addConstraint(Examples.hello.StackedBoxesConstraint, b1, b2)
}
