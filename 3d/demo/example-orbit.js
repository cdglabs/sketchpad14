examples['orbit'] = function() {

    rc.setOption('renderMode', 1)
    //rc.setOption('renderStateTrace', true)
 
    // facts
    var masses = {sun: 2e30, earth: 6e24, eMoon: 7.3e22, venus: 4.9e24, vMoon: 7.3e22} // kg
    var distances = {earthEMoon: 4e8, sunEarth: 1.5e11, sunVenus: 1e11, venusVMoon: 4e8} // m
    var radiuses = {sun: 7e8, earth: 6e6, eMoon: 1.7e6, venus: 6e6, vMoon: 1.7e6} //m

    // fictions
    var distanceDownscale = 5e8, radiusDownscale = 5e5, sunRadiusDownscale = 2e7
    var distancesCheat = {earthEMoon: .05, sunEarth: 1, sunVenus: 1, venusVMoon: .05} 
    var distanceDownscaleCheat = 1e3
    var center = {x: 0, y: 0, z: 0}
    
    // --- Data ----------------------------------------------------------------

    var sun = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x, center.y, center.z), radiuses.sun, radiuses.sun / sunRadiusDownscale, masses.sun, 'orange'))
    var earth = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x - (distances.sunEarth /  distanceDownscale), center.y, center.z), radiuses.earth, radiuses.earth / radiusDownscale, masses.earth, 'blue'))
    var venus = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x - (distances.sunVenus /  distanceDownscale), center.y, center.z), radiuses.venus, radiuses.venus / radiusDownscale, masses.venus, 'green'))
    var eMoon = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(earth.position.x - (distances.earthEMoon / (distanceDownscale * distancesCheat.earthEMoon)), earth.position.y, earth.position.z), radiuses.eMoon, radiuses.eMoon / radiusDownscale, masses.eMoon, 'purple'))
    var vMoon = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(venus.position.x - (distances.venusVmoon / (distanceDownscale * distancesCheat.venusVmoon)), venus.position.y, venus.position.z), radiuses.vMoon, radiuses.vMoon / radiusDownscale, masses.vMoon, 'pink'))
    var bodies = [sun, earth, eMoon, venus, vMoon]
    // --- Constraints ---------------------------------------------------------

    
    bodies.forEach(function (aSun) {
	if (aSun !== sun)
	    aSun.velocity.z = -1
	rc.addConstraint(Sketchpad.simulation3d.VelocityConstraint, aSun)
	rc.addConstraint(Sketchpad.simulation3d.AccelerationConstraint, aSun, aSun.acceleration)
	bodies.forEach(function (aMoon) {
	    if (aSun !== aMoon)
		rc.addConstraint(Sketchpad.simulation3d.OrbitalMotionConstraint, aSun, aMoon, distanceDownscale / distanceDownscaleCheat)
	})
    })
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(1)))
}
