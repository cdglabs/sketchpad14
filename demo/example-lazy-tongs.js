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

  rc.addConstraint(Sketchpad.geom.CoordinateConstraint, p1, p1.x, p1.y)

  rc.addConstraint(Sketchpad.geom.LengthConstraint, p1, p5, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p2, p6, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p3, p7, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p8, p5, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p9, p6, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p10, p7, 100 * Math.sqrt(2))

  rc.addConstraint(Sketchpad.geom.LengthConstraint, p5, p9, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p6, p10, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p7, p11, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p5, p2, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p6, p3, 100 * Math.sqrt(2))
  rc.addConstraint(Sketchpad.geom.LengthConstraint, p7, p4, 100 * Math.sqrt(2))

  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p1, p5, p5, p9)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p2, p6, p6, p10)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p3, p7, p7, p11)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p8, p5, p5, p2)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p9, p6, p6, p3)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p10, p7, p7, p4)

  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p1, p2, p2, p3)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p2, p3, p3, p4)
  rc.addConstraint(Sketchpad.geom.EquivalenceConstraint, p5, p6, p6, p7)
}

