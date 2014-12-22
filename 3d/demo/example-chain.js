examples['chain']= function() {

    rc.setOption('renderMode', 1)    

    var points = [], count = 9
    var x = -200, y = 100, z = 50
    var p1 = new Point3D(x, 0, 0)
    var s1 = rc.add(new Sphere(p1)), p2 = undefined, s2 = undefined
    for (var i = 0; i < count; i++) {
	x += 50
	z -= 5
	y -= 15
	p2 = new Point3D(x, y, z)
	s2 = rc.add(new Sphere(p2))
	var l1 = rc.add(new Cylinder(p1, p2))
	rc.addConstraint(Sketchpad.geom3d.LengthConstraint, p1, p2, 50)
	points.push(p1)
	if (i < 8)
	    p1 = p2
    }
    rc.addConstraint(Sketchpad.geom3d.MotorConstraint, points[0], points[1], 1)
    rc.addConstraint(Sketchpad.geom3d.MotorConstraint, points[count-2], points[count-1], 1)
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer3D(10)))
};

