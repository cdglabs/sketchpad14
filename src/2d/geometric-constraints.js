function installGeometricConstraints(Sketchpad) {

    // This is a collection of geometric constraints that can be applied to
    // objects that have x and y properties. Other properties are ignored.

    Sketchpad.geom = {}

    // Helpers

    function square(n) {
	return n * n
    }

    function plus(p1, p2) {
	return {x: p1.x + p2.x, y: p1.y + p2.y}
    }

    function minus(p1, p2) {
	return {x: p1.x - p2.x, y: p1.y - p2.y}
    }

    function scaledBy(p, m) {
	return {x: p.x * m, y: p.y * m}
    }

    function copy(p) {
	return scaledBy(p, 1)
    }

    function midpoint(p1, p2) {
	return scaledBy(plus(p1, p2), 0.5)
    }

    function magnitude(p) {
	return Math.sqrt(square(p.x) + square(p.y))
    }

    function normalized(p) {
	var m = magnitude(p)
	return m > 0 ? scaledBy(p, 1 / m) : p
    }

    function distance(p1, p2) {
	return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y))
    }

    function rotatedBy(p, dTheta) {
	var c = Math.cos(dTheta)
	var s = Math.sin(dTheta)
	return {x: c*p.x - s*p.y, y: s*p.x + c*p.y}
    }

    function rotatedAround(p, dTheta, axis) {
	return plus(axis, rotatedBy(minus(p, axis), dTheta))
    }

    function setDelta(d, p, scale) {
	d.x = p.x * scale
	d.y = p.y * scale
    }

    Sketchpad.geom.square = square
    Sketchpad.geom.plus = plus
    Sketchpad.geom.minus = minus
    Sketchpad.geom.scaledBy = scaledBy
    Sketchpad.geom.copy = copy
    Sketchpad.geom.midpoint = midpoint
    Sketchpad.geom.magnitude = magnitude
    Sketchpad.geom.normalized = normalized
    Sketchpad.geom.distance = distance
    Sketchpad.geom.rotatedBy = rotatedBy
    Sketchpad.geom.rotatedAround = rotatedAround
    Sketchpad.geom.setDelta = setDelta

    Sketchpad.geom.drawVisualizationLine = function(canvas, origin, p1, p2, l) {
	var ctxt = canvas.ctxt
	ctxt.lineWidth = 1
	ctxt.strokeStyle = 'yellow'
	ctxt.beginPath()

	var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
	var dist = 25
	var p1x = origin.x + p1.x - dist * Math.cos(angle + Math.PI / 2)
	var p1y = origin.y + p1.y - dist * Math.sin(angle + Math.PI / 2)
	var p2x = origin.x + p2.x - dist * Math.cos(angle + Math.PI / 2)
	var p2y = origin.y + p2.y - dist * Math.sin(angle + Math.PI / 2)

	var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2)
	var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2)

	ctxt.moveTo(
	    p1x + 5 * Math.cos(angle + Math.PI / 2),
	    p1y + 5 * Math.sin(angle + Math.PI / 2)
	)
	ctxt.lineTo(
	    p1x - 5 * Math.cos(angle + Math.PI / 2),
	    p1y - 5 * Math.sin(angle + Math.PI / 2)
	)

	ctxt.moveTo(p1x, p1y)
	ctxt.lineTo(p2x, p2y)

	ctxt.moveTo(
	    p2x + 5 * Math.cos(angle + Math.PI / 2),
	    p2y + 5 * Math.sin(angle + Math.PI / 2)
	)
	ctxt.lineTo(
	    p2x - 5 * Math.cos(angle + Math.PI / 2),
	    p2y - 5 * Math.sin(angle + Math.PI / 2)
	)
	ctxt.closePath()
	ctxt.stroke()

	ctxt.textAlign = 'center'
	ctxt.textBaseline = 'middle'
	ctxt.strokeText(Math.round(l), textCenterX, textCenterY)
	ctxt.stroke()
    }

    Sketchpad.geom.calculateAngle = function(p1, p2, p3, p4) {
	var v12 = {x: p2.x - p1.x, y: p2.y - p1.y}
	var a12 = Math.atan2(v12.y, v12.x)
	var v34 = {x: p4.x - p3.x, y: p4.y - p3.y}
	var a34 = Math.atan2(v34.y, v34.x)
	return (a12 - a34 + 2 * Math.PI) % (2 * Math.PI)
    }

    // Coordinate Constraint, i.e., "I want this point to be here".

    Sketchpad.geom.CoordinateConstraint = function Sketchpad__geom__CoordinateConstraint(p, x, y) {
	this.p = p
	this.c = new Point(x, y)
    }

    sketchpad.addClass(Sketchpad.geom.CoordinateConstraint, true)

    Sketchpad.geom.CoordinateConstraint.description = function() { return  "Sketchpad.geom.CoordinateConstraint(Point P, Number X, Number Y) states that point P should stay at coordinate (X, Y)." }

    Sketchpad.geom.CoordinateConstraint.prototype.description = function() { return  "point p (" + this.p.__toString + ") should stay at coordinate (" + this.c.x + ", " + this.c.y + ")." }

    Sketchpad.geom.CoordinateConstraint.prototype.propertyTypes = {p: 'Point', c: 'Point'}

    Sketchpad.geom.CoordinateConstraint.prototype.effects = function() {
	return [{obj: this.p, props: ['x', 'y']}]
    }

    Sketchpad.geom.CoordinateConstraint.dummy = function(x, y) {
	var p1 = Point.dummy(x, y)
	var p2 = Point.dummy(y, x)
	return new Sketchpad.geom.CoordinateConstraint(p1, p2.x, p2.y)
    }

    Sketchpad.geom.CoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.c, this.p))
    }

    Sketchpad.geom.CoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p: {x: this.c.x, y: this.c.y}}
    }

    Sketchpad.geom.CoordinateConstraint.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	if (this.p.isSelected) return // don't draw over the selection highlight
	ctxt.fillStyle = 'black'
	ctxt.beginPath()
	ctxt.arc(this.c.x + origin.x, this.c.y + origin.y, canvas.pointRadius * 0.666, 0, 2 * Math.PI)
	ctxt.closePath()
	ctxt.fill()
    }

    // XCoordinateConstraint Constraint

    Sketchpad.geom.XCoordinateConstraint = function Sketchpad__geom__XCoordinateConstraint(p1, p2) {
        this.p1 = p1
        this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.XCoordinateConstraint, true)

    Sketchpad.geom.XCoordinateConstraint.description = function() { return  "Sketchpad.geom.XCoordinateConstraint(Point P1, Point P2) states that point P1's x-coordinate should be at P2's x-coordinate." }

    Sketchpad.geom.XCoordinateConstraint.prototype.description = function() { return  "point p1 (" + this.p1.__toString + ") 's x-coordinate should be at p2 (" + this.p2.__toString + ") 's x-coordinate." }

    Sketchpad.geom.XCoordinateConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point'}

    Sketchpad.geom.XCoordinateConstraint.dummy = function(x, y) {
	var p1 = Point.dummy(x, y)
	var p2 = Point.dummy(y, x)
	return new Sketchpad.geom.XCoordinateConstraint(p1, p2.x, p2.y)
    }

    Sketchpad.geom.XCoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.p2.x - this.p1.x
    }

    Sketchpad.geom.XCoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p1: {x: this.p2.x}}
    }

    // YCoordinateConstraint Constraint

    Sketchpad.geom.YCoordinateConstraint = function Sketchpad__geom__YCoordinateConstraint(p1, p2) {
        this.p1 = p1
        this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.YCoordinateConstraint, true)

    Sketchpad.geom.YCoordinateConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return this.p2.y - this.p1.y
    }

    Sketchpad.geom.YCoordinateConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	return {p1: {y: this.p2.y}}
    }

    // Coincidence Constraint, i.e., I want these two points to be at the same place.

    Sketchpad.geom.CoincidenceConstraint = function Sketchpad__geom__CoincidenceConstraint(p1, p2) {
	this.p1 = p1
	this.p2 = p2
    }

    sketchpad.addClass(Sketchpad.geom.CoincidenceConstraint, true)

    Sketchpad.geom.CoincidenceConstraint.description = function() { return  "Sketchpad.geom.CoincidenceConstraint(Point P1, Poiont P2) states that points P1 & P2 should be at the same place." }

    Sketchpad.geom.CoincidenceConstraint.prototype.description = function() { return  "points p1 (" + this.p1.__toString + ") & p2 (" + this.p2.__toString + ") should be at the same place." }
    
    Sketchpad.geom.CoincidenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point'}

    Sketchpad.geom.CoincidenceConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.CoincidenceConstraint(l.p1, l.p2)
    }

    Sketchpad.geom.CoincidenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(this.p2, this.p1))
    }

    Sketchpad.geom.CoincidenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(this.p2, this.p1), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    // Equivalence Constraint, i.e., I want the vectors p1->p2 and p3->p4 to be the same.

    Sketchpad.geom.EquivalenceConstraint = function Sketchpad__geom__EquivalenceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EquivalenceConstraint, true)

    Sketchpad.geom.EquivalenceConstraint.description = function() { return  "Sketchpad.geom.EquivalenceConstraint(Point P1, Point P2, Point P3, Point P4) says line sections P1-2 and P3-4 are parallel and of the same lengths." }

    Sketchpad.geom.EquivalenceConstraint.prototype.description = function() { return  "line sections  p1 (" + this.p1.__toString + ") -p2 (" + this.p2.__toString + ") and  p3 (" + this.p3.__toString + ") -p4 (" + this.p4.__toString + ") are parallel and of the same lengths." }

    Sketchpad.geom.EquivalenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EquivalenceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EquivalenceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.25)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1)), p3: plus(this.p3, scaledBy(splitDiff, -1)), p4: plus(this.p4, splitDiff)}
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.draw = function(canvas, origin) {
	var l = distance(this.p1, this.p2)
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p1, this.p2, l)
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p3, this.p4, l)
    }

    Sketchpad.geom.EquivalenceConstraint.prototype.containsPoint = function(x, y) {
	var p1 = this.p1, p2 = this.p2, p3 = this.p3, p4 = this.p4
	var x1 = Math.min(p1.x, p2.x, p3.x, p4.x), x2 = Math.max(p1.x, p2.x, p3.x, p4.x)
	var y1 = Math.min(p1.y, p2.y, p3.y, p4.y), y2 = Math.max(p1.y, p2.y, p3.y, p4.y)
	this.__border = new Box(new Point(x1, y1), x2 - x1, y2 - y1) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.EquivalenceConstraint.prototype.border = function() {
	var p1 = this.p1, p2 = this.p2, p3 = this.p3, p4 = this.p4
	var x1 = Math.min(p1.x, p2.x, p3.x, p4.x), x2 = Math.max(p1.x, p2.x, p3.x, p4.x)
	var y1 = Math.min(p1.y, p2.y, p3.y, p4.y), y2 = Math.max(p1.y, p2.y, p3.y, p4.y)
	this.__border = new Box(new Point(x1, y1), x2 - x1, y2 - y1) 
	return this.__border
    } 

    // One Way Equivalence Constraint, i.e., I want the vectors p1->p2 to always match with p3->p4

    Sketchpad.geom.OneWayEquivalenceConstraint = function Sketchpad__geom__OneWayEquivalenceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.OneWayEquivalenceConstraint, true)

    Sketchpad.geom.OneWayEquivalenceConstraint.description = function() { return  "Sketchpad.geom.OneWayEquivalenceConstraint(Point P1, Point P2, Point P3, Point P4) says the vectors P1->P2 always matches with P3->P4" }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.description = function() { return  "vectors p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") always matches with p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") ." }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.OneWayEquivalenceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OneWayEquivalenceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return magnitude(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)))
    }

    Sketchpad.geom.OneWayEquivalenceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var splitDiff = scaledBy(minus(plus(this.p2, this.p3), plus(this.p1, this.p4)), 0.5)
	return {p1: plus(this.p1, splitDiff), p2: plus(this.p2, scaledBy(splitDiff, -1))}
    }

    // Equal Distance constraint - keeps distances P1-->P2, P3-->P4 equal

    Sketchpad.geom.EqualDistanceConstraint = function Sketchpad__geom__EqualDistanceConstraint(p1, p2, p3, p4) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
    }

    sketchpad.addClass(Sketchpad.geom.EqualDistanceConstraint, true)

    Sketchpad.geom.EqualDistanceConstraint.description = function() { return  "Sketchpad.geom.EqualDistanceConstraint(Point P1, Point P2, Point P3, Point P4) keeps distances P1->P2, P3->P4 equal." }

    Sketchpad.geom.EqualDistanceConstraint.prototype.description = function() { return  "distances p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") & p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") are equal." }

    Sketchpad.geom.EqualDistanceConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point'}

    Sketchpad.geom.EqualDistanceConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.EqualDistanceConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.EqualDistanceConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	var l34 = magnitude(minus(this.p3, this.p4))
	return l12 - l34
    }
    
    Sketchpad.geom.EqualDistanceConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	var l34 = magnitude(minus(this.p3, this.p4))
	var delta = (l12 - l34) / 4
	var e12 = scaledBy(Sketchpad.geom.normalized(minus(this.p2, this.p1)), delta)
	var e34 = scaledBy(Sketchpad.geom.normalized(minus(this.p4, this.p3)), delta)
	return {p1: plus(this.p1, e12), p2: plus(this.p2, scaledBy(e12, -1)), p3: plus(this.p3, scaledBy(e34, -1)), p4: plus(this.p4, e34)}
    }

    // Length constraint - maintains distance between P1 and P2 at L.

    Sketchpad.geom.LengthConstraint = function Sketchpad__geom__LengthConstraint(p1, p2, l, onlyOneWritable) {
	this.p1 = p1
	this.p2 = p2
	this.l = l
	this._onlyOneWritable = onlyOneWritable
    }

    sketchpad.addClass(Sketchpad.geom.LengthConstraint, true)

    Sketchpad.geom.LengthConstraint.description = function() { return  "Sketchpad.geom.LengthConstraint(Point P1, Point P2, Number L) says points P1 and P2 always maintain a distance of L." }

    Sketchpad.geom.LengthConstraint.prototype.description = function() { return  "points p1 (" + this.p1.__toString + ") and p2 (" + this.p2.__toString + ") always maintain a distance of " + this.l + "." }

    Sketchpad.geom.LengthConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', l: 'Number'}

    Sketchpad.geom.LengthConstraint.prototype.effects = function() {
	return [{obj: this.p1, props: ['x', 'y']}, {obj: this.p2, props: ['x', 'y']}]
    }

    Sketchpad.geom.LengthConstraint.dummy = function(x, y) {
	return new Sketchpad.geom.LengthConstraint(new Point(x - 50, y - 50), new Point(x + 50, y + 50), 100)
    }

    Sketchpad.geom.LengthConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var l12 = magnitude(minus(this.p1, this.p2))
	return l12 - this.l
    }

    Sketchpad.geom.LengthConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var p1 = this.p1, p2 = this.p2
	var l12 = magnitude(minus(p1, p2))
	if (l12 == 0) {
	    p1 = plus(p1, {x: 0.1, y: 0})
	    p2 = plus(p2, {x: -0.1, y: 0})
	}	
	var delta = (l12 - this.l) / (this._onlyOneWritable ? 1 : 2)
	var e12 = scaledBy(Sketchpad.geom.normalized(minus(p2, p1)), delta)
	var res = {p2: plus(this.p2, scaledBy(e12, -1))}
	if (!this._onlyOneWritable)
	    res['p1'] = plus(this.p1, e12)
	return res
    }

    Sketchpad.geom.LengthConstraint.prototype.draw = function(canvas, origin) {
	Sketchpad.geom.drawVisualizationLine(canvas, origin, this.p1, this.p2, this.l)
    }

    Sketchpad.geom.LengthConstraint.prototype.containsPoint = function(x, y) {
	var p1 = this.p1, p2 = this.p2
	var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
	var dist = 25
	var p1x = p1.x - dist * Math.cos(angle + Math.PI / 2)
	var p1y = p1.y - dist * Math.sin(angle + Math.PI / 2)
	var p2x = p2.x - dist * Math.cos(angle + Math.PI / 2)
	var p2y = p2.y - dist * Math.sin(angle + Math.PI / 2)
	var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2)
	var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2)
	this.__border = new Box(new Point(textCenterX - 50, textCenterY - 50), 100, 100) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.LengthConstraint.prototype.border = function() {
	var p1 = this.p1, p2 = this.p2
	var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
	var dist = 25
	var p1x = p1.x - dist * Math.cos(angle + Math.PI / 2)
	var p1y = p1.y - dist * Math.sin(angle + Math.PI / 2)
	var p2x = p2.x - dist * Math.cos(angle + Math.PI / 2)
	var p2y = p2.y - dist * Math.sin(angle + Math.PI / 2)
	var textCenterX = (p1x + p2x) / 2 - dist / 2 * Math.cos(angle + Math.PI / 2)
	var textCenterY = (p1y + p2y) / 2 - dist / 2 * Math.sin(angle + Math.PI / 2)
	this.__border = new Box(new Point(textCenterX - 50, textCenterY - 50), 100, 100) 
	return this.__border
    } 

    // Orientation constraint - maintains angle between P1->P2 and P3->P4 at Theta

    Sketchpad.geom.OrientationConstraint = function Sketchpad__geom__OrientationConstraint(p1, p2, p3, p4, theta) {
	this.p1 = p1
	this.p2 = p2
	this.p3 = p3
	this.p4 = p4
	this.theta = theta === undefined ? Sketchpad.geom.calculateAngle(p1, p2, p3, p4) : theta
    }

    sketchpad.addClass(Sketchpad.geom.OrientationConstraint, true)

    Sketchpad.geom.OrientationConstraint.description = function() { return  "Sketchpad.geom.OrientationConstraint(Point P1, Point P2, Point P3, Point P4, Number Theta) maintains angle between P1->P2 and P3->P4 at Theta." }

    Sketchpad.geom.OrientationConstraint.prototype.description = function() { return  "angle is maintained between p1 (" + this.p1.__toString + ") ->p2 (" + this.p2.__toString + ") and p3 (" + this.p3.__toString + ") ->p4 (" + this.p4.__toString + ") at " + this.theta + " radians." }

    Sketchpad.geom.OrientationConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point', p4: 'Point', theta: 'Number'}

    Sketchpad.geom.OrientationConstraint.dummy = function(x, y) {
	var l1 = Line.dummy(x, y)
	var l2 = Line.dummy(y, x)
	return new Sketchpad.geom.OrientationConstraint(l1.p1, l1.p2, l2.p1, l2.p2)
    }

    Sketchpad.geom.OrientationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var v12 = minus(this.p2, this.p1)
	var a12 = Math.atan2(v12.y, v12.x)
	var m12 = midpoint(this.p1, this.p2)
	
	var v34 = minus(this.p4, this.p3)
	var a34 = Math.atan2(v34.y, v34.x)
	var m34 = midpoint(this.p3, this.p4)
	
	var currTheta = a12 - a34
	var dTheta = this.theta - currTheta
	return dTheta
    }
    
    Sketchpad.geom.OrientationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var v12 = minus(this.p2, this.p1)
	var a12 = Math.atan2(v12.y, v12.x)
	var m12 = midpoint(this.p1, this.p2)

	var v34 = minus(this.p4, this.p3)
	var a34 = Math.atan2(v34.y, v34.x)
	var m34 = midpoint(this.p3, this.p4)

	var currTheta = a12 - a34
	var dTheta = this.theta - currTheta
	// TODO: figure out why setting dTheta to 1/2 times this value (as shown in the paper
	// and seems to make sense) results in jumpy/unstable behavior.
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12),
		p3: rotatedAround(this.p3, -dTheta, m34),
		p4: rotatedAround(this.p4, -dTheta, m34)}
    }

    Sketchpad.geom.OrientationConstraint.prototype.draw = function(canvas, origin) {
	var ctxt = canvas.ctxt
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	canvas.drawArrow(m1, m2, origin)
	ctxt.fillStyle = 'red'
	ctxt.fillText('theta = ' + Math.floor(this.theta / Math.PI * 180), m.x + origin.x, m.y + origin.y)
    }

    Sketchpad.geom.OrientationConstraint.prototype.containsPoint = function(x, y) {
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	this.__border = new Box(new Point(m.x - 50, m.y - 50), 100, 100) 
	return this.__border.containsPoint(x, y) 
    }
   
    Sketchpad.geom.OrientationConstraint.prototype.border = function() {
	var m1 = scaledBy(plus(this.p1, this.p2), 0.5)
	var m2 = scaledBy(plus(this.p3, this.p4), 0.5)
	var m = scaledBy(plus(m1, m2), 0.5)
	this.__border = new Box(new Point(m.x - 50, m.y - 50), 100, 100) 
	return this.__border
    } 

    // Motor constraint - causes P1 and P2 to orbit their midpoint at the given rate.
    // w is in units of Hz - whole rotations per second.

    Sketchpad.geom.MotorConstraint = function Sketchpad__geom__MotorConstraint(p1, p2, w) {
	this.p1 = p1
	this.p2 = p2
	this.w = w
    }

    sketchpad.addClass(Sketchpad.geom.MotorConstraint, true)

    Sketchpad.geom.MotorConstraint.description = function() { return  "Sketchpad.geom.MotorConstraint(Point P1, Point P2, Number W) causes P1 and P2 to orbit their midpoint at the given rate of w, in units of Hz: whole rotations per second." } 

    Sketchpad.geom.MotorConstraint.prototype.description = function() { return  "p1 (" + this.p1.__toString + ") and p2 (" + this.p2.__toString + ") to orbit their midpoint at the given rate of " + this.w + ", in units of Hz: whole rotations per second." } 
    Sketchpad.geom.MotorConstraint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', w: 'Number'}
    
    Sketchpad.geom.MotorConstraint.dummy = function(x, y) {
	var l = Line.dummy(x, y)
	return new Sketchpad.geom.MotorConstraint(l.p1, l.p2, 1)
    }

    Sketchpad.geom.MotorConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	return 1
    }

    Sketchpad.geom.MotorConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var t = (pseudoTime - prevPseudoTime) / 1000.0
	var dTheta = t * this.w * (2 * Math.PI)
	var m12 = midpoint(this.p1, this.p2)
	return {p1: rotatedAround(this.p1, dTheta, m12),
		p2: rotatedAround(this.p2, dTheta, m12)}
    }
    
    Sketchpad.geom.CartesianPointConstraint = function  Sketchpad__geom__CartesianPointConstraint(position, vector, origin, unit) {
	this.position = position
	this.vector = vector
	this.origin = origin
	this.unit = unit
    }
    
    sketchpad.addClass(Sketchpad.geom.CartesianPointConstraint, true)
    
    Sketchpad.geom.CartesianPointConstraint.description = function() {
	return "Sketchpad.geom.CartesianPointConstraint(Point P, Vector V, Point O, Number U) states that P should be positioned based on vector V's X and Y discrete coordinate values, and on origin O and each unit on axis having a vertical and horizontal length of U"
    }

    Sketchpad.geom.CartesianPointConstraint.prototype.description = function() {
	return "" + this.position.__toString + " should be positioned based on vector " + this.vector.__toString + "'s X and Y discrete coordinate values, and on origin " + this.origin.__toString + " and each unit on axis having a vertical and horizontal length of " + this.unit
    }

    Sketchpad.geom.CartesianPointConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
	var origin = this.origin, vector = this.vector, position = this.position, unit = this.unit
	var diffX = Math.abs(origin.x + unit * vector.x - position.x)
	var diffY = Math.abs(origin.y - unit * vector.y - position.y)
	return diffX + diffY
    }

    Sketchpad.geom.CartesianPointConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
	var origin = this.origin, vector = this.vector, position = this.position, unit = this.unit
	var x = origin.x + unit * vector.x
	var y = origin.y - unit * vector.y
	return {position: {x: x, y: y}}
    }
    
}

///////////////////////////////////////////////////////////////////////////

module.exports.install = installGeometricConstraints
