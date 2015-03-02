Examples.midpoint = { }

// --- Classes -------------------------------------------------------------

// constructor

Examples.midpoint.Midpoint = function Examples__midpoint__Midpoint(p1, p2, p3) {
    this.p1 = p1
    this.p2 = p2
    this.p3 = p3
}

sketchpad.addClass(Examples.midpoint.Midpoint)

Examples.midpoint.Midpoint.prototype.propertyTypes = {p1: 'Point', p2: 'Point', p3: 'Point'}

Examples.midpoint.Midpoint.dummy = function(x, y, noAdd) {
    var p1 = Point.dummy(x, y)
    var p2 = Point.dummy(x + 50, y + 50, 'red')
    var p3 = Point.dummy(x + 100, y + 200)
    var res = new Examples.midpoint.Midpoint(p1, p2, p3)
    if (!noAdd) {
	[p1, p2, p3].forEach(function(t) { rc.add(t) })    
	res.init()
    }
    return res
}

Examples.midpoint.Midpoint.prototype.init = function() { 
    rc.addConstraint(Sketchpad.arith.SumRelation, undefined, {obj: this.p1, prop: 'x'}, {obj: this.p3, prop: 'x'}, {obj: this.p2, prop: 'x'}, undefined, 1, 1, 2, 0)
    rc.addConstraint(Sketchpad.arith.SumRelation, undefined, {obj: this.p1, prop: 'y'}, {obj: this.p3, prop: 'y'}, {obj: this.p2, prop: 'y'}, undefined, 1, 1, 2, 0)
    return this
}

Examples.midpoint.Midpoint.prototype.draw = function(canvas, origin) { 
    new Line(this.p1, this.p2).draw(canvas, origin)
    new Line(this.p2, this.p3).draw(canvas, origin)
}

Examples.midpoint.Midpoint.prototype.border = function() { 
    return new Box(this.p1, this.p3.x - this.p1.x, this.p3.y - this.p1.y)
}
    
Examples.midpoint.Midpoint.prototype.center = function() { 
    return this.p3 
}

Examples.midpoint.Midpoint.prototype.containsPoint = function(x, y) { 
    return new Box(this.p1, 50, 50).containsPoint(x, y)
}

examples['mid point'] = function() {
    var p1 = rc.add(new Point(150, 150))
    var p2 = rc.add(new Point(200, 200, 'red'))
    var p3 = rc.add(new Point(400, 400))
    var mp = rc.add(new Examples.midpoint.Midpoint(p1, p2, p3)).init()
}
