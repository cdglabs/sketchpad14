examples.rod = function() {
    var p1 = rc.add(new Point(200, 200))
    var p2 = rc.add(new Point(300, 200))
    var p3 = rc.add(new Point(600, 200))
    
    rc.add(new Line(p1, p2))
    rc.add(new Line(p2, p3))
    
    rc.addConstraint(Sketchpad.geom.EqualVectors, undefined, p1, p2, p2, p3)
    rc.addConstraint(Sketchpad.geom.FixedLength, undefined, p1, p3, 200)
};

