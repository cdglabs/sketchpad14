examples['lazy tongs'] = function() {
    var p1  = rc.add(new Point(200, 100))
    var p2  = rc.add(new Point(400, 100))
    var p3  = rc.add(new Point(600, 100))
    var p4  = rc.add(new Point(800, 100))
    var p5  = rc.add(new Point(300, 200))
    var p6  = rc.add(new Point(500, 200))
    var p7  = rc.add(new Point(700, 200))
    var p8  = rc.add(new Point(200, 300))
    var p9  = rc.add(new Point(400, 300))
    var p10 = rc.add(new Point(600, 300))
    var p11 = rc.add(new Point(800, 300))

    rc.add(new Line(p1, p9))
    rc.add(new Line(p9, p3))
    rc.add(new Line(p3, p11))
    rc.add(new Line(p8, p2))
    rc.add(new Line(p2, p10))
    rc.add(new Line(p10, p4))

    rc.addConstraint(Sketchpad.geom.CoordinateConstraint, undefined, p1, p1.x, p1.y)

    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p1, p5, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p2, p6, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p3, p7, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p8, p5, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p9, p6, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p10, p7, 100 * Math.sqrt(2))

    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p5, p9, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p6, p10, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p7, p11, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p5, p2, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p6, p3, 100 * Math.sqrt(2))
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p7, p4, 100 * Math.sqrt(2))

    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p1, p5, p5, p9)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p2, p6, p6, p10)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p3, p7, p7, p11)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p8, p5, p5, p2)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p9, p6, p6, p3)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p10, p7, p7, p4)

    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p1, p2, p2, p3)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p2, p3, p3, p4)
    rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, undefined, p5, p6, p6, p7)
}

