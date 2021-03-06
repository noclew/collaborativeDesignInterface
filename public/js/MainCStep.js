﻿var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true});

var getImageData = false;
var imgData;
var strDownloadMime = "image/octet-stream";



var texture;
var backgroundMesh;
var backgroundScene; 
var backgroundCamera; 

var div3d;      //div that contains GL viewport
var central;
var drawCanvas;

var width=10;   //viewport width in pixels
var height=10;  //viewport height in pixels

var width3d = 10;
var height3d = 10;

//var controls;

//var mouse cube geometry
var cubegeometry = new THREE.BoxGeometry(0.2,0.2,0.2);
var cubematerial = new THREE.MeshBasicMaterial( { ambient: 0x030303, color: 0xdddddd, specular: 0xffffff, shininess: 30, shading: THREE.FlatShading } );
var cube;

//var click circle geometry
var circlegeometry = new THREE.CircleGeometry(0.06, 32);
var circlematerial = new THREE.MeshBasicMaterial({color: 0xF07061});
var circle;

//..........................................selection
var mouse = new THREE.Vector2();            //mouse coordinates in screen space
var mouse3d=new THREE.Vector3( 0, 0, 0 );   //mouse coordinates in XYZ / ambient space

//used in order to convert between screen and ambient coordinates
var projector = new THREE.Projector();

//intersection [drawing] plane
var planeXY;
//material to apply to new section segments
var sectionMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 });
var thickness0 = 0.1;
var thickness1 = 0.1;
var lineType = createShortLine;

//buttons for drawing
var btn1;
var btn2;
var graphics1;
var graphics2;

var submit;

function Main(){

    central = document.getElementById("central");

    //width=window.innerWidth;
    //height=window.innerHeight;

    width=$("#central").innerWidth();
    height=$("#central").innerHeight();

    $(window).resize(function () {
        width=$("#central").innerWidth();
        height=$("#central").innerHeight();
    });

    draw.addEventListener( 'click', onDrawMouseDown, false );

}

function onDrawMouseDown(event){
  
    //...............draw btns
    var btnHolder = document.createElement('div');
    btn1 = document.createElement('canvas');
    btn2 = document.createElement('canvas');
    btn3 = document.createElement('canvas');
    
    central.appendChild(btnHolder);
    btnHolder.appendChild(btn1);
    btnHolder.appendChild(btn2);
    btnHolder.appendChild(btn3);
    btnHolder.id = 'btnHolder';
    btn1.className = 'btns';
    btn2.className = 'btns';
    btn3.className = 'btns';

    //calc size of draw frame
    width3d = width - 400;
    height3d = height - 150;

    btnHolder.style.left = ((width/2 - width3d/2)-40) + 'px';
    btnHolder.style.top = ((height/2 - height3d/2) + 22) + 'px';

    btn1.addEventListener( 'click', onBtn1MouseDown, false );
    btn2.addEventListener( 'click', onBtn2MouseDown, false );
    btn3.addEventListener( 'click', onBtn3MouseDown, false );

    graphics1 = btn1.getContext('2d');
    graphics2 = btn2.getContext('2d');
    graphics3 = btn3.getContext('2d');

    var btn1W = btn1.width;
    var btn1H = btn1.height;
    console.log(btn1W);

    graphics1.fillStyle = "#0378A7";
    graphics1.fillRect(0,0,btn1W, btn1H);

    graphics2.fillStyle = "#0378A7";
    graphics2.fillRect(0,0,btn1W, btn1H);

    graphics3.fillStyle = "#0378A7";
    graphics3.fillRect(0,0,btn1W, btn1H);

    graphics1.strokeStyle = "#000000"
    graphics1.lineWidth = 40;
    graphics1.beginPath();
    graphics1.moveTo(0,0);
    graphics1.lineTo(btn1W/2, 0);
    graphics1.lineTo(btn1W/2, btn1H);
    graphics1.lineTo(btn1W,btn1H  );
    graphics1.stroke();

    graphics2.strokeStyle = "#000000"
    graphics2.lineWidth = 25;
    graphics2.beginPath();
    graphics2.moveTo(0,0);
    graphics2.lineTo(btn1W,btn1H  );
    graphics2.stroke();

    graphics3.strokeStyle = "#000000"
    graphics3.lineWidth = 25;
    graphics3.beginPath();
    graphics3.moveTo(0,0);
    graphics3.quadraticCurveTo(0,100,200,btn1H);
    graphics3.stroke();


    submit = document.createElement('canvas');
    central.appendChild(submit);
    submit.id = 'submit';
    submit.className = 'submit';
    submit.style.left = ((width/2 + width3d/2)+ 20) + 'px';
    submit.style.top = ((height/2 + height3d/2)) + 'px';

    submitText = submit.getContext('2d');
    graphics1.fillStyle = "#000000";
    submitText.font = "70px  Monospace";
    submitText.fillText("SUBMIT!",10,70);

    submit.addEventListener( 'click', onSubmitMouseDown, false );

    //...........................................canvas to draw in

    drawCanvas = document.getElementById("canvasDraw");
    drawCanvas.style.width = width3d + 'px';
    drawCanvas.style.height = height3d + 'px';
    drawCanvas.style.left = (width/2 - width3d/2) + 'px';
    drawCanvas.style.top = ((height/2 - height3d/2) + 22) + 'px';
    renderer.canvas = drawCanvas;

    //on mouse down add 3D div to scene
    div3d = document.getElementById("div3d");
    div3d.appendChild( renderer.domElement );
    div3d.style.width = width3d + 'px';
    div3d.style.height = height3d + 'px';


    camera.aspect = width3d/height3d;
    camera.position.set( 0, 2, 5 );
    camera.updateProjectionMatrix(); //call this every time you change something in the camera
    

    renderer.setSize( width3d, height3d );

    /*$(window).resize(function () {
        width3d=$((("#central").innerWidth()) - 400);
        height3d=$((("#central").innerHeight()) - 150);

        camera.aspect = width3d/height3d;
        camera.updateProjectionMatrix();

        renderer.setSize( width3d, height3d );
    });*/

    //.......................mouse events
    drawCanvas.addEventListener( 'mousemove', onDocumentMouseMove, false );
    drawCanvas.addEventListener( 'mousedown', onDocumentMouseDown, false );
    drawCanvas.addEventListener( 'mouseup', onDocumentMouseUp, false );

    //...........background
    texture = new THREE.ImageUtils.loadTexture( 'background.jpg');
    backgroundMesh = new THREE.Mesh (
        new THREE.PlaneGeometry(2,2,0), 
        new THREE.MeshBasicMaterial({map: texture})
        );

    backgroundMesh.material.depthTest = false;
    backgroundMesh.material.depthWrite = false;

    backgroundScene = new THREE.Scene();
    backgroundCamera = new THREE.Camera();
    backgroundScene.add(backgroundCamera);
    backgroundScene.add(backgroundMesh);

    //..............................................planeXY [this is the dummy object we intersect to find the location of the mouse on the drawing plane]
    planeXYGeometry=new THREE.PlaneGeometry( 300, 300, 8, 8 );
    planeXY = new THREE.Mesh( planeXYGeometry, new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );

    planeXY.visible = false;
    scene.add( planeXY );
    //................................................
    //....................................................cube
   

    cube = new THREE.Mesh( cubegeometry, cubematerial );
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add( cube );


    render();

}

function render() {

    //controls.update();
    renderer.autoClear = false;
    renderer.clear();
    requestAnimationFrame(render);


    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;

    renderer.render(backgroundScene, backgroundCamera);
    renderer.render(scene, camera);

   /* if(getImageData == true){
            imgData = renderer.domElement.toDataURL("image/png");
            getImageData = false;
        }*/
}

function onSubmitMouseDown() {
        var imgData, imgNode;
        var click = 0;

        try {
            var strMime = "image/png";
            imgData = renderer.domElement.toDataURL(strMime);

            saveFile(imgData.replace(strMime, strDownloadMime), "test.png");

        } catch (e) {
            console.log(e);
            return;
        }

    for (var i = 0; i< lines.length; i++){
    scene.remove(lines[i]);  
    }
    for (var i = 0; i< points.length; i++){
        scene.remove(points[i]);
    }
    for (var i = 0; i< circles.length; i++){
        scene.remove(circles[i]);
    }

    lines = [];
    points = [];
    circles = [];
    document.body.removeChild(div3d);
    document.body.removeChild(drawCanvas);
    document.body.removeChild(btn1);
    document.body.removeChild(btn2);
    document.body.removeChild(btn3);
    document.body.removeChild(submit);
    

}

var saveFile = function (strData, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link); //Firefox requires the link to be in the body
            link.download = filename;
            link.href = strData;
            link.click();
            document.body.removeChild(link); //remove the link when done
        } else {
            location.replace(uri);
        }
}

function insertImage(img){
    var imageHolder = document.createElement('div');
    canvas.appendChild(imageHolder);
    imageHolder.width = width3d;
}
function onBtn1MouseDown(event){
    lineType = createStepLine;
    sectionMaterial = new THREE.MeshBasicMaterial({color: 0x000000 });
    thickness1 = 0.05;
}
function onBtn2MouseDown(event){
    lineType = createShortLine;
    sectionMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00 });
    thickness1 = 0.1;
}
function onBtn3MouseDown(event){
    lineType = createSpline;
    sectionMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00 });
    thickness1 = 0.1;
}
//these are utililty functions that create Vector3 objects from the sums and differences of 
//other vectors. they reduce the amount of count when building geometry
//create a vector from the difference of two vectors
function VDifference(p1, p0) {
    return new THREE.Vector3(p1.x-p0.x, p1.y-p0.y, p1.z-p0.z);
}
function Difference(p1, p0) {
    return Math.sqrt((p1.x-p0.x)*(p1.x-p0.x)) + ((p1.y - p0.y)*(p1.y - p0.y));
     
}
//create a vector from the sum of two vectors
function VSum(p0, p1) {
    return new THREE.Vector3(p1.x+p0.x, p1.y+p0.y, p1.z+p0.z);
}
//create a vector by adding two vectors one of which is scaled by a number m
function VSumScaled(p0, p1, m) {
    return new THREE.Vector3(p1.x*m+p0.x, p1.y*m+p0.y, p1.z*m+p0.z);
}

//create a copy of a vector
function VCopy(p) {
    return new THREE.Vector3(p.x, p.y, p.z);
}

//create a new vector [so you don't need to write new THREE.Vector3(x,y,z)]
function VNew(x,y,z) {
    return new THREE.Vector3(x, y, z);
}

function VHalf(p1,p0){
    var vec = VDifference(p1,p0);
    var scale = vec.divideScalar(0.5);
    return scale;
}
function VScale(p0, s){
    var scale = p0.multiplyScalar(s);
    return scale;
}
function VAngle(p1,p0){
    var vec = VHalf(p1,p0);
    var norm = VNew(VHalf.x, mouse.y, 0);
    return vec.angleTo(norm);
}

function VDisTo(p2,p0){
    var distance = p0.distanceTo(p2);
    return distance;
}


function addPoint(){
circle = new THREE.Mesh( circlegeometry, circlematerial);
scene.add(circle); 
return circle;  
}

function createLine(p0,p1){
    var line;
    
    var linematerial = new THREE.LineBasicMaterial({
    color: 0x000000, linewidth: 6, 
    });
    var start = p0;
    var middle1 = VNew(p0.x, p1.y, p1.z);
    var middle2 = VNew(p1.x, p0.y, p1.z);
    var selPt = [middle1, middle2];
    var pickPt = function(){
        var finPt = selPt[Math.floor(Math.random()*2)];
        return finPt;
    }
    var end = p1;

    var linegeometry = new THREE.Geometry();
    linegeometry.vertices.push(start, pickPt(), end);
  
    line = new THREE.Line( linegeometry, linematerial );

    scene.add(line);

    return line;
}

function createShortLine(p0,p1){
    var linematerial = new THREE.LineBasicMaterial({
    color: 0x000000, linewidth: 6, 
    });
    var start = p0;

    var end = p1;

    var linegeometry = new THREE.Geometry();
    linegeometry.vertices.push(start, end);
  
    var line = new THREE.Line( linegeometry, linematerial );

    scene.add(line);
    return line;
}

function createStepLine(p0,p1){
    var line;
    
    var linematerial = new THREE.LineBasicMaterial({
    color: 0x000000, linewidth: 6, 
    });
    var offset = 0.25;
    var start = VNew(p0.x-offset, p0.y-offset, p0.z);
    var m1 = VNew(p0.x-offset, p1.y-offset, p1.z);
    var end = VNew(p1.x-offset, p1.y-offset, p1.z);

    var linegeometry = new THREE.Geometry();
    linegeometry.vertices.push(start, m1, end);
  
    line = new THREE.Line( linegeometry, linematerial );

    scene.add(line);

    return line;
}

function createSpline(p0,p1){
    var linematerial = new THREE.LineBasicMaterial({
    color: 0x000000, linewidth: 6, 
    });

    var start = p0;
    var middle = VNew(p0.x, p1.y, p1.z);
    var end = p1;
    var splinegeometry = new THREE.SplineCurve3([
        start, middle, end
        ]);
    
    var path = new THREE.Path( splinegeometry.getPoints(50));
    var spline = path.createPointsGeometry(50);
    spline.closePath = false;
    var object = new THREE.Line (spline, linematerial);
    scene.add(object);
    return object;
}

function onDocumentMouseMove( event ) {
    //prevent default mouse interactions from the web browser
    event.preventDefault();


    //get the normalized screen coordinates of the mouse location [-1,-1] to [1,1]
    mouse.x = ( (event.x - $(div3d).offset().left)/ width3d ) * 2 - 1;
    console.log(event);
    mouse.y = - ( (event.y - $(div3d).offset().top) / height3d ) * 2 + 1;

    //form a vector from the screen coordinates and transform it to find the mouse position in the actual XYZ space
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    projector.unprojectVector( vector, camera );

    //create a ray from the viewer eye to the mouse
    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    //intersect the ray with the drawing plane
    var intersects = raycaster.intersectObject( planeXY );
    if ( intersects.length > 0 ) {
            //if an intersection was found set the mouse3d location to that point 
            mouse3d=intersects[ 0 ].point;
            cube.position.copy( mouse3d );
    }

}
//points repository
var points=[];
var lines = [];
var circles = [];

//on mouse down just add a new SPoint at the mouse location [calculated each time the mouse moves]
function onDocumentMouseDown( event ) {
    event.preventDefault();
    event.stopPropagation();

    if (event.button==0) {
        var np=new SPoint(mouse3d);
    }
    else {
        points = [];
    }
}

function onDocumentMouseUp( event ) {
 
}


function SPoint(_p){
    this.p=new THREE.Vector3(_p.x, _p.y, _p.z);
    this.t=new Date();

    points.push(this);

    //if this point is added when there is at least one more point in the list
    //then a new segment mesh is created between this point and its previous neighbour
    //each points holds the segment tat connects it to its predecessor in the this.mesh variable
    //this is usefull so that later if you move points you can find out 
    //which meshes to update
    this.mesh=null;
    this.mesh2 = null;
    this.mesh3 = null;
    if (points.length>=1) {
        
        circles.push(addPoint().position.copy(mouse3d));
        console.log(circles.length);
        //addCircle(points[points.length-2].p, points[points.length-1].p).position.copy(mouse3d);
        //this.mesh2=createStepLine(points[points.length-2].p, points[points.length-1].p);
        this.mesh=lineType(points[points.length-2].p, points[points.length-1].p);
        //this.mesh2=createSpline(points[points.length-2].p, points[points.length-1].p);
        lines.push(this.mesh);
        }
}

