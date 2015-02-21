examples['orbit'] = function() {

    // facts
    var masses = {sun: 2e30, earth: 6e24, emoon: 7.3e22, venus: 4.9e24, vmoon: 7.3e22} // kg
    var distances = {earth_emoon: 4e8, sun_earth: 1.5e11, sun_emoon: 1.5e11, sun_venus: 1e11, sun_vmoon: 1e11, venus_vmoon: 4e8} // m
    var radiuses = {sun: 7e8, earth: 6e6, emoon: 1.7e6, venus: 6e6, vmoon: 1.7e6} //m

    // fictions
    var distanceDownscale = 5e8, radiusDownscale = 5e5, sunRadiusDownscale = 2e7
    var distancesCheat = {earth_emoon: 20, sun_earth: .76, sun_emoon: 1, sun_venus: 1, venus_vmoon: 20} 
    var initVelocityScale = {earth: 30, emoon: 30, venus: 30, vmoon: 30} //m
    var distanceDownscaleCheat = 1e3
    var center = {x: 0, y: 0, z: 0}
    
    // --- Data ----------------------------------------------------------------
    var sun = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x, center.y, center.z), radiuses.sun, radiuses.sun / sunRadiusDownscale, masses.sun, 'orange'))
    var earth = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x - (distances.sun_earth /  distanceDownscale * distancesCheat.sun_earth), center.y, center.z), radiuses.earth, radiuses.earth / radiusDownscale, masses.earth, 'blue'))
    var venus = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(center.x - (distances.sun_venus /  distanceDownscale), center.y, center.z), radiuses.venus, radiuses.venus / radiusDownscale, masses.venus, 'green'))
    var emoon = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(earth.position.x - (distances.earth_emoon / distanceDownscale  * distancesCheat.earth_emoon), earth.position.y, earth.position.z), radiuses.emoon, radiuses.emoon / radiusDownscale, masses.emoon, 'purple'))
    var vmoon = rc.add(new Sketchpad.simulation3d.FreeBody(new Point3D(venus.position.x + (distances.venus_vmoon / distanceDownscale * distancesCheat.venus_vmoon), venus.position.y, venus.position.z), radiuses.vmoon, radiuses.vmoon / radiusDownscale, masses.vmoon, 'pink'))
    sun.name = 'sun'
    earth.name = 'earth'
    venus.name = 'venus'
    emoon.name = 'emoon'
    vmoon.name = 'vmoon'
    var bodies = [sun, earth, emoon, venus, vmoon]
    // --- Constraints ---------------------------------------------------------

    
    bodies.forEach(function (aSun) {
	if (aSun !== sun)
	    aSun.velocity.z = -1 * Math.sqrt(Sketchpad.simulation3d.G * masses.sun / distances['sun_' + aSun.name]) / radiusDownscale * initVelocityScale[aSun.name]
	rc.addConstraint(Sketchpad.simulation3d.VelocityConstraint, undefined, aSun)
	rc.addConstraint(Sketchpad.simulation3d.AccelerationConstraint, undefined, aSun, aSun.acceleration)
	bodies.forEach(function (aMoon) {
	    if (aSun !== aMoon)
		rc.addConstraint(Sketchpad.simulation3d.OrbitalMotionConstraint, undefined, aSun, aMoon, distanceDownscale / distanceDownscaleCheat)
	})
    })
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, undefined, rc.add(new Timer(1)))
}
