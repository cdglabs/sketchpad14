examples['orbit'] = function() {
    //rc.setOption('renderStateTrace', true)
 
    // facts
    var masses = {sun: 2e30, earth: 6e24, emoon: 7.3e22, venus: 4.9e24, vmoon: 7.3e22} // kg
    var distances = {earth_emoon: 4e8, sun_earth: 1.5e11, sun_emoon: 1.5e11, sun_venus: 1e11, sun_vmoon: 1e11, venus_vmoon: 4e8} // m
    var radiuses = {sun: 7e8, earth: 6e6, emoon: 1.7e6, venus: 6e6, vmoon: 1.7e6} //m

    // fictions
    var distanceDownscale = 5e8, radiusDownscale = 5e5, sunRadiusDownscale = 2e7
    var distancesCheat = {earth_emoon: 20, sun_earth: .76, sun_emoon: 1, sun_venus: 1, venus_vmoon: 20} 
    var initVelocityScale = {earth: 30, emoon: 30, venus: 30, vmoon: 30} //m
    var distanceDownscaleCheat = 1e3
    var center = {x: 700, y: 400}
    
    // --- Data ----------------------------------------------------------------
    var sun = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x, center.y, 'orange', radiuses.sun / sunRadiusDownscale), radiuses.sun, masses.sun))
    var earth = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x - (distances.sun_earth /  distanceDownscale * distancesCheat.sun_earth), center.y, 'blue', radiuses.earth / radiusDownscale), radiuses.earth, masses.earth))
    var venus = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x - (distances.sun_venus /  distanceDownscale), center.y, 'green', radiuses.venus / radiusDownscale), radiuses.venus, masses.venus))
    var emoon = rc.add(new Sketchpad.simulation.FreeBody(new Point(earth.position.x - (distances.earth_emoon / distanceDownscale * distancesCheat.earth_emoon), earth.position.y, 'purple', radiuses.emoon / radiusDownscale), radiuses.emoon, masses.emoon))
    var vmoon = rc.add(new Sketchpad.simulation.FreeBody(new Point(venus.position.x + (distances.venus_vmoon / distanceDownscale * distancesCheat.venus_vmoon), venus.position.y, 'pink', radiuses.vmoon / radiusDownscale), radiuses.vmoon, masses.vmoon))
    sun.name = 'sun'
    earth.name = 'earth'
    venus.name = 'venus'
    emoon.name = 'emoon'
    vmoon.name = 'vmoon'
    var bodies = [sun, earth, emoon, venus, vmoon]

    // --- Constraints ---------------------------------------------------------

    bodies.forEach(function (aSun) {
	if (aSun !== sun)
	    aSun.velocity.y = -1 * Math.sqrt(Sketchpad.simulation.G * masses.sun / distances['sun_' + aSun.name]) / radiusDownscale * initVelocityScale[aSun.name]
	rc.addConstraint(Sketchpad.simulation.VelocityConstraint, undefined, aSun)
	rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, undefined, aSun, aSun.acceleration) 
	bodies.forEach(function (aMoon) {
	    if (aSun !== aMoon)
		rc.addConstraint(Sketchpad.simulation.OrbitalMotionConstraint, undefined, aSun, aMoon, distanceDownscale / distanceDownscaleCheat)
	})
    })
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, undefined, rc.add(new Timer(1)))
}
