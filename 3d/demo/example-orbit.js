examples['orbit']= function() {
    rc.setOption('renderMode', 1)
    
    var p1 = new Point3D(100, 0, 0)
    var p2 = new Point3D(0, 100, 0)
    rc.add(p1)
    rc.add(p2)

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer3D(1)))
    rc.addConstraint(Sketchpad.geom3d.MotorConstraint, p1._sceneObj.position, p2._sceneObj.position, 1)
};

