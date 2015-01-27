examples.chain = function() {
    var p1 = rc.add(new Point(200, 200));
    var p2 = rc.add(new Point(300, 200));
    var p3 = rc.add(new Point(400, 200));
    var p4 = rc.add(new Point(500, 200));
    var p5 = rc.add(new Point(600, 200));
    var p6 = rc.add(new Point(700, 200));
    var p7 = rc.add(new Point(800, 200));
    var p8 = rc.add(new Point(900, 200));
    var p9 = rc.add(new Point(1000, 200));

    rc.add(new Line(p1, p2));
    rc.add(new Line(p2, p3));
    rc.add(new Line(p3, p4));
    rc.add(new Line(p4, p5));
    rc.add(new Line(p5, p6));
    rc.add(new Line(p6, p7));
    rc.add(new Line(p7, p8));
    rc.add(new Line(p8, p9));

    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p1, p2, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p2, p3, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p3, p4, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p4, p5, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p5, p6, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p6, p7, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p7, p8, 100);
    rc.addConstraint(Sketchpad.geom.LengthConstraint, undefined, p8, p9, 100);
};

