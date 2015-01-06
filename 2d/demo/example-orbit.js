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
    var center = {x: 700, y: 400}
    
    // --- Data ----------------------------------------------------------------
    var sun = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x, center.y, 'orange', radiuses.sun / sunRadiusDownscale), radiuses.sun, masses.sun))
    var earth = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x - (distances.sunEarth /  distanceDownscale), center.y, 'blue', radiuses.earth / radiusDownscale), radiuses.earth, masses.earth))
    var venus = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x - (distances.sunVenus /  distanceDownscale), center.y, 'green', radiuses.venus / radiusDownscale), radiuses.venus, masses.venus))
    var eMoon = rc.add(new Sketchpad.simulation.FreeBody(new Point(earth.position.x - (distances.earthEMoon / (distanceDownscale * distancesCheat.earthEMoon)), earth.position.y, 'purple', radiuses.eMoon / radiusDownscale), radiuses.eMoon, masses.eMoon))
    var vMoon = rc.add(new Sketchpad.simulation.FreeBody(new Point(venus.position.x - (distances.venusVMoon / (distanceDownscale * distancesCheat.venusVMoon)), venus.position.y, 'pink', radiuses.vMoon / radiusDownscale), radiuses.vMoon, masses.vMoon))
    var bodies = [sun, earth, eMoon, venus, vMoon]

    // --- Constraints ---------------------------------------------------------

    bodies.forEach(function (aSun) {
	if (aSun !== sun)
	    aSun.velocity.y = -1
	rc.addConstraint(Sketchpad.simulation.VelocityConstraint, aSun)
	rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, aSun, aSun.acceleration) 
	bodies.forEach(function (aMoon) {
	    if (aSun !== aMoon)
		rc.addConstraint(Sketchpad.simulation.OrbitalMotionConstraint, aSun, aMoon, distanceDownscale / distanceDownscaleCheat)
	})
    })
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(1)))
}
