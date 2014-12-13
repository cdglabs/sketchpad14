examples['chain']= function() {
    rc.setOption('renderMode', 1)    
    var x = 50
    var p1 = rc.add(new Point3D(x, 0, 0)), p2 = undefined
    for (var i = 0; i < 9; i++) {
	x += 50
	p2 = rc.add(new Point3D(x, 0, 0))
	//var l1 = rc.add(new Line3D(p1, p2))
	rc.addConstraint(Sketchpad.geom3d.LengthConstraint, p1._sceneObj.position, p2._sceneObj.position, 50)
	if (i < 8) p1 = p2
    }
    rc.addConstraint(Sketchpad.geom3d.MotorConstraint, p1._sceneObj.position, p2._sceneObj.position, 1)
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer3D(10)))

};

