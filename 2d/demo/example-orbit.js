examples['orbit'] = function() {
 
    // facts
    var masses = {sun: 2e30, earth: 6e24, moon: 7.3e22, venus: 4.9e24} // kg
    var distances = {earthMoon: 4e8, sunEarth: 1.5e11, sunVenus: 1e11} // m
    var radiuses = {sun: 7e8, earth: 6e6, moon: 1.7e6, venus: 6e6} //m

    // fictions
    var distanceDownscale = 5e8, radiusDownscale = 5e5, sunRadiusDownscale = 2e7
    var distancesCheat = {earthMoon: .05, sunEarth: 1, sunVenus: 1} 
    var distanceDownscaleCheat = 1e3
    var center = {x: 700, y: 400}
    
    // --- Data ----------------------------------------------------------------

    var sun = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x, center.y, 'orange', radiuses.sun / sunRadiusDownscale), radiuses.sun, masses.sun))
    var earth = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x - (distances.sunEarth /  distanceDownscale), center.y, 'blue', radiuses.earth / radiusDownscale), radiuses.earth, masses.earth))
    var venus = rc.add(new Sketchpad.simulation.FreeBody(new Point(center.x - (distances.sunVenus /  distanceDownscale), center.y, 'green', radiuses.venus / radiusDownscale), radiuses.venus, masses.venus))
    var moon = rc.add(new Sketchpad.simulation.FreeBody(new Point(earth.position.x - (distances.earthMoon / (distanceDownscale * distancesCheat.earthMoon)), earth.position.y, 'purple', radiuses.moon / radiusDownscale), radiuses.moon, masses.moon))

    // --- Constraints ---------------------------------------------------------

    rc.addConstraint(Sketchpad.simulation.OrbitalMotionConstraint, sun, earth, distanceDownscale / distanceDownscaleCheat)
    rc.addConstraint(Sketchpad.simulation.OrbitalMotionConstraint, earth, moon, distanceDownscale / distanceDownscaleCheat)
    rc.addConstraint(Sketchpad.simulation.OrbitalMotionConstraint, sun, moon, distanceDownscale / distanceDownscaleCheat)
    rc.addConstraint(Sketchpad.simulation.OrbitalMotionConstraint, sun, venus, distanceDownscale / distanceDownscaleCheat)
    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(.25)))
}
