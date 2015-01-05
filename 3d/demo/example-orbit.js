examples['orbit'] = function() {

    rc.setOption('renderMode', 1)

    // facts
    var masses = {sun: 2e30, earth: 6e24, moon: 7.3e22, venus: 4.9e24} // kg
    var distances = {earthMoon: 4e8, sunEarth: 1.5e11, sunVenus: 1e11} // m
    var radiuses = {sun: 7e8, earth: 6e6, moon: 1.7e6, venus: 6e6} //m

    // fictions
    var distanceDownscale = 5e8, radiusDownscale = 5e5, sunRadiusDownscale = 2e7
    var distancesCheat = {earthMoon: .05, sunEarth: 1, sunVenus: 1} 
    var distanceDownscaleCheat = 1e3
    var center = {x: 0, y: 0, z: 0}
    
    // --- Data ----------------------------------------------------------------

    var sun = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x, center.y, center.z), radiuses.sun, radiuses.sun / sunRadiusDownscale, masses.sun, 'orange'))
    var earth = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x - (distances.sunEarth /  distanceDownscale), center.y, center.z), radiuses.earth, radiuses.earth / radiusDownscale, masses.earth, 'blue'))
    var venus = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x - (distances.sunVenus /  distanceDownscale), center.y, center.z), radiuses.venus, radiuses.venus / radiusDownscale, masses.venus, 'green'))
    var moon = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(earth.position.x - (distances.earthMoon / (distanceDownscale * distancesCheat.earthMoon)), earth.position.y, earth.position.z), radiuses.moon, radiuses.moon / radiusDownscale, masses.moon, 'purple'))
    var bodies = [sun, earth, moon, venus]

    // --- Constraints ---------------------------------------------------------

    bodies.forEach(function (aSun) {
	bodies.forEach(function (aMoon) {
	    if (aSun !== aMoon)
		rc.addConstraint(Sketchpad.simulation3d.OrbitalMotionConstraint, aSun, aMoon, distanceDownscale / distanceDownscaleCheat)
	})
    })
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(.5)))

}
