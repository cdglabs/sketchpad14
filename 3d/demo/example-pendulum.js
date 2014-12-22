examples['pendulum']= function() {

    // --- Data ----------------------------------------------------------------

    
    var p1 = new Point3D(0, 0, 0) 
    var b1 = rc.add(new Sphere(p1))
    var p2 = new Point3D(100, -100, 100)
    var b2 = rc.add(new Sphere(p2))
    var spring = rc.add(new Sketchpad.simulation3d.Spring(new Cylinder(p1, p2, 'blue'), 10, 100, 300))
    var zero = new Vector3D(0, 0, 0)
    var velocity2 = new Vector3D(0, 0, 0)
    var acceleration2 = new Vector3D(0, 0, 0)
    
    // --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation3d.VelocityConstraint, p2, velocity2)
    rc.addConstraint(Sketchpad.simulation3d.AccelerationConstraint, velocity2, acceleration2)
    rc.addConstraint(Sketchpad.simulation3d.AccelerationConstraint, velocity2, new Vector3D(0, -Sketchpad.simulation.g,0))
    rc.addConstraint(Sketchpad.simulation3d.SpringConstraint, p1, zero, zero, 0, p2, velocity2, acceleration2, 30, spring)
     rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(0.5)))

   
};

