// once everything is loaded, we run our Three.js stuff.
$(function () {

    var stats = initStats();

    // create a scene, that will hold all our elements such as objects, cameras and lights.
    var scene = new THREE.Scene();



    // create a render and set the size
    var webGLRenderer = new THREE.WebGLRenderer();
    webGLRenderer.setClearColor(0xEEEEEE, 1.0);
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    webGLRenderer.shadowMapEnabled = true;


    // create a camera, which defines where we're looking at.
    var camera1 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // position and point the camera to the center of the scene
    camera1.position.set(-15,60,-15);
    scene.add(camera1);


    var camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera2.position.x = -40;
    camera2.position.y = 15;
    camera2.position.z = 10;
    camera2.lookAt(new THREE.Vector3(10, 5, 10));
    scene.add(camera2);
    var helper = new THREE.CameraHelper( camera2 );
    helper.visible = false;
    scene.add( helper );

    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( -40, 60, -10 );
    spotLight.castShadow = true;
    scene.add(spotLight);

    var controls = new function() {
        this.animate = false;
        this.camera = 1;
        this.helper = false;
        this.fovC2 = 60;
        this.fovC3 = 60;

        this.updateC1 = function(){
            camera.fov = controls.fieldOfView;
            camera.updateProjectionMatrix();
            helper.update();
        }
        
        this.updateC2 = function(){
            if ( controls.helper == false ){
                helper.visible = false;
            } else if ( controls.helper == true ){
                helper.visible = true;
            }
            
            helper2.update();
        }
        
        this.updateDollyZoom = function(){
            camera3.fov = controls.fov;
            camera3.updateProjectionMatrix();
            zoom = 40 / ( 2.0*Math.tan(0.5 * controls.fov * Math.PI/180) );
            helper.update();
        }
    }

    // add the output of the renderer to the html element
    $("#WebGL-output").append(webGLRenderer.domElement);
    var trackballControls = new THREE.TrackballControls( camera1, webGLRenderer.domElement ); 

    var kingX = 12;
    var kingY = 0;
    var lastKey = 0;

    createBoard(3,8,8);
    speed = 0.1;
    var reached = false;
    var dest = kingMoves();

    initControlls();
    render();


    var gui = new dat.GUI();
    gui.add(controls, 'animate').name('Animacija');
    gui.add(controls, 'camera',1,3).name('Kamera').step(1);
    var folderC2 = gui.addFolder('C2-aplankas');
    folderC2.add(controls, 'fovC2',30,150).onChange(controls.updateC2);
    var folderC3 = gui.addFolder('C3-aplankas');
    folderC3.add(controls, 'helper').onChange(controls.updateC3);
    folderC3.add(controls, 'fovC3',30,150).onChange(controls.updateDollyZoom);

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
        var kingFigure = new THREE.Mesh(latheGeometry, meshMaterial, {castShadow: true});
        kingFigure.position.x = m_x;
        kingFigure.position.y = 5;
        kingFigure.position.z = m_y;
        var axisY = new THREE.Vector3(-1,0,0);
        kingFigure.rotateOnAxis(axisY,Math.PI/2);
        scene.add(kingFigure);
    }

    function createMesh(edge, color) {
        const geometry = new THREE.BoxGeometry( edge, 0.3, edge );
        const material = new THREE.MeshBasicMaterial( {color: color} );
        const mesh = new THREE.Mesh( geometry, material );
        return mesh;
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
    
    function render() {
        stats.update();
        if(controls.animate){
            if(reached) {
                dest = kingMoves(lastKey);
                reached = false;
            }
            if ( kingX < dest[0])
                kingX += speed;
            else if ( kingX > dest[0])
                kingX -= speed;
            if (kingY < dest[1])
                kingY += speed;
            else if (kingY > dest[1])
                kingY -= speed;
            if(kingX > dest[0]-0.001 &&  kingX < dest[0]+0.001 && kingY > dest[1]-0.001 &&  kingY < dest[1]+0.001) {
                reached = true;
                lastKey = dest[2];
            }
                
            scene.remove(scene.children[scene.children.length-1]);
            king(12, kingX, kingY, 0xdc9456);
        }
        requestAnimationFrame(render);
        if(controls.camera == 1)
            webGLRenderer.render(scene, camera1);
        else if(controls.camera == 2)
            webGLRenderer.render(scene, camera2);
        else if(controls.camera == 3)
            webGLRenderer.render(scene, camera3);
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

});