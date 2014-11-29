examples.test = function() {
    sketchpad.solveEvenWithoutErrorOnPriorityDifferences = true
    var p1 = rc.add(new Point(200, 200))
    var p2 = rc.add(new Point(300, 200))
    
    rc.add(new Line(p1, p2))
    var c1 = new Sketchpad.geom.LengthConstraint(p1, p2, 100)
    var c2 = new Sketchpad.geom.LengthConstraint(p1, p2, 200)
    c2.__priority = 1
    rc.addNewConstraint(c1)
    rc.addNewConstraint(c2)
};

