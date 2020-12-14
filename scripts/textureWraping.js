var center = new THREE.Vector3(15,0,15);
var startTime = (new Date()).getTime();
var clock = new THREE.Clock();

var stats = initStats();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 15;
camera.position.y = 10;
camera.position.z = 10;


var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xEEEEEE, 1.0);
renderer.setSize(window.innerWidth, window.innerHeight);

// add subtle ambient lighting
var ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
 // add the output of the renderer to the html element
$("#WebGL-output").append(renderer.domElement);
var trackballControls = new THREE.TrackballControls( camera, renderer.domElement );
initControlls();
render();

var controls = new function() {
    this.points = 500;
    this.height = 6;
    this.radiusB = 6;
    this.radiusT = 3;
    this.redraw = function (){
        scene.remove(scene.children[scene.children.length-1]);
        createCone(this.height, this.radiusB, this.radiusT);
    }
}

var coneRadius = 10;
createCone(controls.height, controls.radiusB, controls.radiusT);

var gui = new dat.GUI();
var listeners = []
listeners.push(gui.add(controls, 'points',500,5000).name('Taškų skaičius').step(10));
listeners.push(gui.add(controls, 'height',5,8).name('Aukštis').step(0.5));
listeners.push(gui.add(controls, 'radiusB',6,10).name('Apatinis spindulys').step(0.1));
listeners.push(gui.add(controls, 'radiusT',1,4).name('Viršutinis spindulys').step(0.1));
gui.add(controls, 'redraw').name('Perpiešti');
listeners.forEach(listener => listener.onFinishChange(reload));

function reload(){
    deleteScene();
    createCone(controls.height, controls.radiusB, controls.radiusT);
}

function deleteScene() {
    scene.remove(scene.children[scene.children.length-1]);
}

function render() {
    stats.update();
    var delta = (new Date()).getTime() - startTime;
    trackballControls.update(delta);
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

function createCone(height, radiusBottom, radiusTop) {
    var geometry = new THREE.ConvexGeometry(generateConePoints(height, radiusBottom, radiusTop));
    setUV(geometry,height);
    cone = createMesh(geometry, "textures/checkers.jpg");
    cone.position.set(center.x, center.y, center.z);
    scene.add(cone);
}

function createMesh(geom, imageFile) {
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    var texture = new loader.load(imageFile);
    texture.wrapS = THREE.RepeatWrapping;
    return new THREE.Mesh(geom, new THREE.MeshBasicMaterial({color:0xffffff, map:texture}));
}

function setUV(geometry,height) {
    for(var i=0; i<geometry.faces.length; i++)
    {
        var a = new THREE.Vector2(
            countU(geometry.vertices[geometry.faces[i].a].x, geometry.vertices[geometry.faces[i].a].z, coneRadius), 
            countV(geometry.vertices[geometry.faces[i].a].y, height)
        );        
        var b = new THREE.Vector2(
            countU(geometry.vertices[geometry.faces[i].b].x, geometry.vertices[geometry.faces[i].b].z, coneRadius), 
            countV(geometry.vertices[geometry.faces[i].b].y, height)
        );
        var c = new THREE.Vector2(
            countU(geometry.vertices[geometry.faces[i].c].x, geometry.vertices[geometry.faces[i].c].z, coneRadius),
            countV(geometry.vertices[geometry.faces[i].c].y, height)
        );
        if(a.x - b.x >= 0.5 && c.x - b.x >= 0.5) {
            b.x += 1;
        }
        else if(b.x - a.x >= 0.5 && c.x - a.x >= 0.5) {
            a.x += 1;
        }
        else if(b.x - c.x >= 0.5 && a.x - c.x >= 0.5) {
            c.x += 1;
        }
        else if(a.x - b.x >= 0.5 && a.x - c.x >= 0.5) {
            a.x -= 1;
        }
        else if(b.x - c.x >= 0.5 && b.x - a.x >= 0.5) {
            b.x -= 1;
        }
        else if(c.x - b.x >= 0.5 && c.x - b.x >= 0.5) {
            c.x -= 1;
        }
        geometry.faceVertexUvs[0].push([a, b, c]);  
    }
}

function countV(y, h) {
    return (y/h+0.5)
}

function countU(x, z, r) {
    var C = 2*Math.PI*r;
    var alpha = -Math.atan2(z, x);
    alpha = alpha * (180/Math.PI);
    if(alpha < 0) {
        alpha += 360;
    }

    var l = (Math.PI*r*alpha)/180;
    return l/C;
}

function generateConePoints(height, radiusB, radiusT) {
    var points = [];
    for(var i=0; i<controls.points; i++) {
        var y = ((Math.random() * height) - height/2);
        if (y <= 0.5 && y > 0)
            radius = radiusB;
        else if (y >=1.2)
            radius = radiusT;
        else
            continue;
        var halfRadius = radius/2;
        var sign = Math.random() >= 0.5 ? 1 : -1;   
        var x = (Math.random() * radius) - radius/2;
        
        var z = sign * (Math.sqrt(halfRadius*halfRadius - x * x));
        points.push(new THREE.Vector3(x, y, z));
    }
    return points;
}

function initControlls() {
    trackballControls.target.set( 15, 0, 15);
    trackballControls.rotateSpeed = 5.0;
    trackballControls.zoomSpeed = 1.0;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;
}

function initStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    $("#Stats-output").append( stats.domElement );

    return stats;
}
