// --- 3D User Classes -------------------------------------------------------------

function Point3D(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
}

sketchpad.addClass(Point3D)

function Vector3D(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
}

sketchpad.addClass(Vector3D)

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
	p1,//._sceneObj.position,
	p2//._sceneObj.position
    )
    this._sceneObj = new THREE.Line( geometry, new THREE.LineBasicMaterial({color: this.color}))
}

function Sphere(position, optColor, optRadius, optUnfilled, optOpacity) {
    this.position = position
    this.color = optColor || 0x8888ff
    this.radius = (optRadius || 10)
    this.unfilled = optUnfilled
    this.opacity = optOpacity
    var sphereMaterial = 
	this._sceneObj = new THREE.Mesh(new THREE.SphereGeometry(this.radius), new THREE.MeshLambertMaterial( {color: this.color}))
    this._sceneObj.position.set(position.x, position.y, position.z)
}

sketchpad.addClass(Sphere)

Sphere.prototype.afterEachTimeStep = function() {
    var position = this.position
    this._sceneObj.position.set(position.x, position.y, position.z)    
}

function Cylinder(p1, p2, optColor, optWidth, optLineDash, optOpacity) {
    this.p1 = p1 
    this.p2 = p2
    this.color = optColor || 'gray'
    this.width = optWidth || 2
    this.lineDash = optLineDash
    this.opacity = optOpacity
    var mid = Sketchpad.geom3d.midpoint(p1, p2)
    this._sceneObj = new THREE.Mesh(new THREE.CylinderGeometry(this.width, this.width, 0), 
				    new THREE.MeshLambertMaterial({color: this.color}))
    this._sceneObj.position.set(mid.x, mid.y, mid.z)
    this.updateBasedOnEndPoints()
}

Cylinder.prototype.updateBasedOnEndPoints = function() {
    var p1 = this.p1, p2 = this.p2
    var height = Sketchpad.geom3d.distance(p1, p2)
    this._sceneObj.geometry = new THREE.CylinderGeometry(this.width, this.width, height)
    var vector = Sketchpad.geom3d.minus(p2, p1)
    //HACK FIXME??
    //this._sceneObj.rotation.x = Sketchpad.geom3d.angle(vector, new Point3D(0, 0, 1)) 
    //this._sceneObj.rotation.y = Sketchpad.geom3d.angle(vector, new Point3D(0, 1, 0))
    this._sceneObj.rotation.z = Sketchpad.geom3d.angle(vector, new Point3D(1, 0, 0))
}

Cylinder.prototype.afterEachTimeStep = function() {
    var p1 = this.p1, p2 = this.p2
    var mid = Sketchpad.geom3d.midpoint(p1, p2)
    this._sceneObj.position.set(mid.x, mid.y, mid.z)
    this.updateBasedOnEndPoints()
}

function Timer3D(stepSize) {
    this.stepSize = stepSize
}

sketchpad.addClass(Timer3D)
    
Timer3D.prototype.propertyTypes = {stepSize: 'Number'}
