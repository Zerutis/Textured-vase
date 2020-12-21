// once everything is loaded, we run our Three.js stuff.
$(function () {
    var stats;
    var scene;
    var webGLRenderer;
    // var axesHelper;
    var camera1, camera2, camera3;
    var camera1Group, camera2Group, camera3Group;
    var helper;
    var ambientLight;
    var spotLight;
    var trackballControls;

    // kings params
    var kingFigure;
    var kingX = 12;
    var kingY = 12;
    var lastKey = 0;
    var speed = 0.1;   
    var reached = false;
    var dest = kingMove();
    var forward = false;

    // board params
    var middle = 10.5;
    var epsilon = 1;

    // cameras params
    // first
    var camPos1 = new THREE.Vector3(10.5,60,-45);
    // second
    var zoom = -15 / ( 2.0*Math.tan(0.5 * 60 * Math.PI/180) );


    function init(){
        stats = initStats();

        // create a scene, that will hold all our elements such as objects, cameras and lights.
        scene = new THREE.Scene();

        // create a render and set the size
        webGLRenderer = new THREE.WebGLRenderer(); 
        webGLRenderer.setClearColor(0xbebebe, 1.0);
        webGLRenderer.setSize(window.innerWidth, window.innerHeight);
        webGLRenderer.shadowMapEnabled = true;

        // create axes helper to see the lines of each axis
        // axesHelper = new THREE.AxisHelper(50);
        // scene.add( axesHelper );

        // create a camera, which defines where we're looking at.
        camera1 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera1.position.set(10.5,60,-45);
        camera1.lookAt(new THREE.Vector3(10.5, 5, 10.5));
        scene.add(camera1);

        camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera2.position.set(zoom ,5,12);
        camera2.lookAt(new THREE.Vector3(21, 5, 12));
        scene.add(camera2);

        // pyramid lines
        helper = new THREE.CameraHelper( camera2, {visible: true});
        scene.add( helper );

        // add subtle ambient lighting
        ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        spotLight = new THREE.SpotLight( 0xffffff );
        spotLight.position.set( -40, 60, -10 );
        spotLight.castShadow = true;
        scene.add(spotLight);

        // add the output of the renderer to the html element
        $("#WebGL-output").append(webGLRenderer.domElement);
        trackballControls = new THREE.TrackballControls( camera1, webGLRenderer.domElement ); 
        
        createBoard(3,8,8);
        createCamC1();
        createCamC2();
        createCamC3();
        initControlls();
        render();
        king(12, kingX, kingY, 0xdc9456);
    };
    
    var controls = new function() {
        this.animateRandom = false;
        this.animate = false;
        this.camera = 3;
        this.helper = true;
        this.fovC1 = 60;
        this.fovC2 = 60;

        this.OffAnimation = function() {
            if(this.animateRandom){
                gui.children[1].hide();
            }
        }

        this.OffRandomAnimation = function(){
        }

        this.updateFOV = function(){
            camera1.fov = controls.fovC1;
            camera1.updateProjectionMatrix();
            camera2.fov = controls.fovC2;
            camera2.updateProjectionMatrix();
            controls.updateDollyZoom();
            helper.update();
        }
        
        this.updateHelper = function(){
            helper.visible = controls.helper;
            helper.update();
        }
        
        this.updateDollyZoom = function(){
            zoom = -15 / ( 2.0*Math.tan(0.5 * controls.fovC2 * Math.PI/180));
            camera2.position.x = zoom;
            camera2Group.position.x = zoom; 
        }
    }

    var gui = new dat.GUI();
    //gui.add(controls, 'animate').name('Animacija').onChange(controls.OffRandomAnimation);
    gui.add(controls, 'animateRandom').name('Atsitiktinė animacija').onChange(controls.OffAnimation);
    gui.add(controls, 'camera',1,3).name('Kamera').step(1);
    var folderC1 = gui.addFolder('C1-aplankas');
    folderC1.open()
    folderC1.add(controls, 'fovC1',30,150).onChange(controls.updateFOV);
    var folderC2 = gui.addFolder('C2-aplankas');
    folderC2.open();
    folderC2.add(controls, 'helper').name('Kameros pagalba').onChange(controls.updateHelper);
    folderC2.add(controls, 'fovC2',30,150).onChange(controls.updateFOV);

    function createBoard(edge, length, width) {   
        var boardObj = new THREE.Object3D(); 
        var colorSwitch = true;
        for(let i = 0; i < length; i++){
            for(let j = 0; j < width; j++){
                var tile;
                if(colorSwitch){
                    tile = createMesh(edge, 0xffffff);
                    colorSwitch = false;
                }
                else {
                    tile = createMesh(edge, 0x000000);
                    colorSwitch = true;;
                }
                tile.position.x = i*edge;
                tile.position.z = j*edge;
                boardObj.add(tile);
                if(j == width-1) {
                    colorSwitch = !colorSwitch;
                }
            }
        }
        
        const geometry = new THREE.BoxGeometry( edge*length*1.1, 0.5 , edge*width*1.1 );
        const wooden = new THREE.MeshLambertMaterial( {color: 0x46230a} );
        const board = new THREE.Mesh( geometry, wooden );
        board.position.x = edge*length/2-1.5;
        board.position.y = -0.4;
        board.position.z = edge*width/2-1.5;
        boardObj.add(board);

        scene.add(boardObj);
    }

    function king(segments, m_x, m_y, color) {
        var pointsX = [
            25, 26, 27.5, 27, 28.5,
              28.5, 27, 28, 31.5, 31.5,
              30, 30.5, 29.5, 30, 31,
              31.5, 32.5, 32.5, 31.5, 29.5,
              29, 29, 29.5, 30, 31,
              31.5, 34, 34.5, 34, 34,
              25];

        var pointsY = [
            1, 1.5, 2.5, 3.5, 3.5,
            6, 6.1, 7.6, 8.6, 9.6,
            16.6, 17.1, 17.6, 18.6, 19.1,
            20.1, 20.6, 22.1, 23.1, 23.6,
            24.6, 30.6, 35.1, 37.6, 38.6,
            40.6, 42.1, 43.6, 45.6, 48.6,
            49.1];

        var points = [];
        for (var i = 0; i < pointsX.length; i++)
            points.push(new THREE.Vector3(2.5-pointsX[i]/10, 0, (0.1-pointsY[i])/10));

        var latheGeometry = new THREE.LatheGeometry(points, Math.ceil(segments), 0, 2 * Math.PI);
        var meshMaterial = new THREE.MeshLambertMaterial({color: color, transparent:false, side: THREE.DoubleSide});
        kingFigure = new THREE.Mesh(latheGeometry, meshMaterial, {castShadow: true});
        kingFigure.position.x = m_x;
        kingFigure.position.y = 5;
        kingFigure.position.z = m_y;
        var axisY = new THREE.Vector3(-1,0,0);
        kingFigure.rotateOnAxis(axisY,Math.PI/2);
        scene.add(kingFigure);
    }

    function createMesh(edge, color) {
        const geometry = new THREE.BoxGeometry( edge, 0.3, edge );
        const material = new THREE.MeshPhongMaterial( {color: color} );
        const mesh = new THREE.Mesh( geometry, material );
        return mesh;
    }
    function kingMove(){
        var x = kingX;
        var y = kingY;
        var step = 3;
        if(forward && ifReachable(x+step, y+step)){
            if(!ifReachable(x+2*step, y+2*step))
                forward = !forward;
            return [x+step, y+step];
        }
        else
            if(!ifReachable(x-2*step, y-2*step))
                forward = !forward;
            return [x-step, y-step];
    }

    function kingMoves(lastKey){
        var x = kingX;
        var y = kingY;
        var step = 3;
        
        while(true){
            var key =  Math.floor(Math.random()*9+1);
            if(lastKey == key)
                continue;
            switch (key) {
                case 1:
                    if(ifReachable(x+step, y-step))
                        return [x+step, y-step,key];
                    break;
                case 2:
                    if(ifReachable(x, y-step))
                        return [x, y-step,key];
                    break;
                case 3:
                    if(ifReachable(x-step, y-step))
                        return [x-step, y-step,key];
                    break;
                case 4:
                    if(ifReachable(x+step, y))
                        return [x+step, y];
                    break;
                case 6:
                    if(ifReachable(x-step, y))
                        return [x-step, y,key];
                    break;
                case 7:
                    if(ifReachable(x+step, y+step))
                        return [x+step, y+step,key];  
                    break; 
                case 8:
                    if(ifReachable(x, y+step))
                        return [x, y+step,key];
                    break;
                case 9:
                    if(ifReachable(x-step, y+step))
                        return [x-step, y+step,key];
                    break;
            }
        }
    }
    
    function ifReachable(x,y){
        return (x >=0 && x <= 21 && y >= 0 && y <= 21);
    }

    /////////////////////////////////////////////
    function createCamC1(){
        camera1Group = new THREE.Object3D();
        camera1Box = new THREE.Mesh(new THREE.CubeGeometry(1, 2, 4), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera1Group.add(camera1Box);
        camera1Box.position.set(0, 0.5, -2.5);
        
        camera1Cylinder1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera1Group.add(camera1Cylinder1);
        camera1Cylinder1.rotation.z = Math.PI/2;
        camera1Cylinder1.position.set(0, 1.5, -1.5);
        
        camera1Cylinder2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera1Group.add(camera1Cylinder2);
        camera1Cylinder2.rotation.z = Math.PI/2;
        camera1Cylinder2.position.set(0, 1.5, -3.5);
        
        camera1Cylinder3 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 1), new THREE.MeshLambertMaterial({color: 0x777777}));
        camera1Group.add(camera1Cylinder3);
        camera1Cylinder3.rotation.x = Math.PI/2;
        camera1Cylinder3.position.set(0, 0, 0);
        
        camera1Group.position.set(10.5,60,-45);
        camera1Group.lookAt(new THREE.Vector3(10.5, 5, 10.5));
        scene.add(camera1Group);
    }

    /////////////////////////////////////////////
    function createCamC2() {
        camera2Group = new THREE.Object3D();
        camera2Box = new THREE.Mesh(new THREE.CubeGeometry(1, 2, 4), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera2Group.add(camera2Box);
        camera2Box.position.set(0, 0.5, -2.5);
        
        camera2Cylinder1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera2Group.add(camera2Cylinder1);
        camera2Cylinder1.rotation.z = Math.PI/2;
        camera2Cylinder1.position.set(0, 1.5, -1.5);
        
        camera2Cylinder2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera2Group.add(camera2Cylinder2);
        camera2Cylinder2.rotation.z = Math.PI/2;
        camera2Cylinder2.position.set(0, 1.5, -3.5);
        
        camera2Cylinder3 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 1), new THREE.MeshLambertMaterial({color: 0x777777}));
        camera2Group.add(camera2Cylinder3);
        camera2Cylinder3.rotation.x = Math.PI/2;
        camera2Cylinder3.position.set(0, 0, 0);
        
        camera2Group.position.set(zoom, 5, 12);
        camera2Group.lookAt(new THREE.Vector3(21,5,12));
        scene.add(camera2Group);
    }
    
    ////////////////////////////////////////////
    function createCamC3() {
        camera3 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
        camera3.position.set(10.5,30,10.5);
        if(kingFigure === undefined)
            camera3.lookAt(new THREE.Vector3(kingX, 5, kingY));
		camera3.rotation.z = -Math.PI;
        scene.add(camera3);
        
        camera3Group = new THREE.Object3D();
        camera3Box = new THREE.Mesh(new THREE.CubeGeometry(1, 2, 4), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera3Group.add(camera3Box);
        camera3Box.position.set(0, 0.5, -2.5);
        
        camera3Cylinder1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera3Group.add(camera3Cylinder1);
        camera3Cylinder1.rotation.z = Math.PI/2;
        camera3Cylinder1.position.set(0, 1.5, -1.5);
        
        camera3Cylinder2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1), new THREE.MeshLambertMaterial({color: 0x666666}));
        camera3Group.add(camera3Cylinder2);
        camera3Cylinder2.rotation.z = Math.PI/2;
        camera3Cylinder2.position.set(0, 1.5, -3.5);
        
        camera3Cylinder3 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 1), new THREE.MeshLambertMaterial({color: 0x777777}));
        camera3Group.add(camera3Cylinder3);
        camera3Cylinder3.rotation.x = Math.PI/2;
        camera3Cylinder3.position.set(0, 0, 0);

        camera3Group.position.set(10.5,30,10.5);
        if(kingFigure === undefined)
            camera3Group.lookAt(new THREE.Vector3(kingX,5,kingY));
        scene.add(camera3Group);
    }
    /////////////////////////////////////////////
    function move(){
        if ( kingX < dest[0]) {
            kingX += speed;
        }
        else if ( kingX > dest[0]) {
            kingX -= speed;
        }
        if (kingY < dest[1]){
            kingY += speed;
        }
        else if (kingY > dest[1]) {
            kingY -= speed;
        }
    }
    
    function updateKingPos(){
        scene.remove(scene.children[scene.children.length-1]);
        king(12, kingX, kingY, 0xdc9456);
    }

    function render() {
        stats.update();

        if (controls.animate){
            
            if(reached) {
                dest = kingMoves(lastKey);
                reached = false;
            }
            if(kingX > dest[0]-0.001 &&  kingX < dest[0]+0.001 && kingY > dest[1]-0.001 &&  kingY < dest[1]+0.001) {
                reached = true;
                lastKey = dest[2];
            }
            updateKingPos();
        }

        if(controls.animateRandom){
            if(reached) {
                dest = kingMoves(lastKey);
                reached = false;
            }
            move();
            if(kingX >= 0 && kingY >= 0 && kingX <= 21 && kingY <= 21  && dest[0] >= 0 && dest[1] >= 0 && dest[0] <= 21 && dest[1] <= 21){
                 camera3.lookAt(new THREE.Vector3(kingX + epsilon,5,kingY));
                 camera3Group.lookAt(new THREE.Vector3(kingX + epsilon,5,kingY));
            }
            else {
                camera3.lookAt(new THREE.Vector3(kingX,5,kingY));
                camera3Group.lookAt(new THREE.Vector3(kingX,5,kingY));
            }
            
            if(kingX > dest[0]-0.001 &&  kingX < dest[0]+0.001 && kingY > dest[1]-0.001 &&  kingY < dest[1]+0.001) {
                reached = true;
                lastKey = dest[2];
            }
            updateKingPos();
        }
        requestAnimationFrame(render);
        if(controls.camera == 1)
            webGLRenderer.render(scene, camera1);
        else if(controls.camera == 2)
            webGLRenderer.render(scene, camera2);
        else if(controls.camera == 3) {
            webGLRenderer.render(scene, camera3);
        }
        trackballControls.update();
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

        $("#Stats-output").append(stats.domElement);

        return stats;
    }

    init();
});