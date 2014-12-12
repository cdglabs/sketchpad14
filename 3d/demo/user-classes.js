// --- 3D User Classes -------------------------------------------------------------

function Point3D(x, y, z, optColor, optRadius, optUnfilled, optOpacity) {
    this.x = x
    this.y = y
    this.z = z
    this.color = optColor || 'blue'
    this.radius = (optRadius || 10)
    this.unfilled = optUnfilled
    this.opacity = optOpacity
    this._sceneObj = new THREE.Mesh(new THREE.SphereGeometry(this.radius), new THREE.MeshBasicMaterial( {color: this.color}))
    this._sceneObj.position.set(x, y, z)
}

sketchpad.addClass(Point3D)

function Line3D(p1, p2, optColor, optWidth, optLineDash, optOpacity) {
    this.p1 = p1
    this.p2 = p2
    this.color = optColor || 'white'
    if (optWidth)
	this.width = optWidth
    this.lineDash = optLineDash
    this.opacity = optOpacity
    var geometry = new THREE.Geometry()
    geometry.vertices.push(
	new THREE.Vector3( p1.x, p1.y, p1.z ),
	new THREE.Vector3( p2.x, p2.y, p2.z )
    )
    this._sceneObj = new THREE.Line( geometry, new THREE.LineBasicMaterial({color: this.color}))
}

function Timer3D(stepSize, optPos) {
    this.stepSize = stepSize
    this._sceneObj = (optPos || new Point3D(100, 100, 100, 'white'))._sceneObj
}

sketchpad.addClass(Timer3D)
    
Timer3D.prototype.propertyTypes = {stepSize: 'Number', position: 'Point3D'}
