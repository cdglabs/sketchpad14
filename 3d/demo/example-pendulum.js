examples['pendulum']= function() {

    // --- Data ----------------------------------------------------------------
    
    var p1 = new Point3D(0, 0, 0) 
    var b1 = rc.add(new Sketchpad.simulation3d.FreeBody(p1, undefined, undefined, 0))
    var p2 = new Point3D(100, -100, 100)
    var b2 = rc.add(new Sketchpad.simulation3d.FreeBody(p2, undefined, undefined, 30))
    var spring = rc.add(new Sketchpad.simulation3d.Spring(b1, b2, 10, 100, 300))
    
    // --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation3d.VelocityRelation, undefined, b2)
    rc.addConstraint(Sketchpad.simulation3d.AccelerationRelation, undefined, b2, b2.acceleration)
    rc.addConstraint(Sketchpad.simulation3d.AccelerationRelation, undefined, b2, new Vector3D(0, -Sketchpad.simulation.g,0))
    rc.addConstraint(Sketchpad.simulation3d.Springiness, undefined, b1, b2, spring)
    rc.addConstraint(Sketchpad.simulation.TickingTimer, undefined, rc.add(new Timer(0.5)))   
};

