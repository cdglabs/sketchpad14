examples.test = function() {
    rc.setOption('renderMode', 2)
    var center = {x: 700, y: 500}
    var py = new Point(center.x, center.y - 500)
    var px = new Point(center.x + 500, center.y)
    var po = new Point(center.x, center.y)
    var p1 = rc.add(new Point(center.x + 100, center.y - 100))
    var p2 = rc.add(new Point(center.x + 200, center.y - 200))
    rc.add(new Line(po, py))
    rc.add(new Line(po, px))
    var c1 = new Sketchpad.geom.LengthConstraint(p1, p2, 100)
    var c2 = new Sketchpad.geom.CoordinateConstraint(p1, center.x, center.y)
    rc.addNewConstraint(c1)
    rc.addNewConstraint(c2)

};

