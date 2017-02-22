//Henry Toups
//10-3-2016
//CSC 4356
//Project 3
//This assignment displays a rotatable bunny that is shaded based on a light source that can be altered
//
	// declare global variables
	var canvas;
	var gl;
	
	var modelRotationX = 0;
	var modelRotationY = 0;
	var dragging = false;
	var lastClientX = 0;
	var lastClientY = 0;
	var dX = 0, dY = 0;

	
	var event = new MouseEvent("click");
	

	//define function for dot product of 3 dimensional array
	function dot(a, b) {
		return [a[0]*b[0] + a[1]*b[1] + a[2]*b[2]];
	}

	//define function for cross product of 3 dimensional array
	function cross(a, b) {
		return [a[1]*b[2] - a[2]*b[1] , a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
	}
	
	//define function for the addition of 3 dimensional array
	function add(a, b) {	
		return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
	}
	
	//define function for the subtraction of 3 dimensional array
	function sub(a, b) {
		return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
	}

	//define function for normalizing a vector
	function normalize(a) {
		var len = Math.sqrt(dot(a,a));
		return [ a[0]/len, a[1]/len, a[2]/len ];
	}

	
	//define function tracking mouse movement when mouse is clicked
	function onMouseDown(event){
		dragging = true;
		lastClientX = event.clientX;
		lastClientY = event.clientY;
		}
	//define function to stop tracking when released
	function onMouseUp(event){
		dragging = false;
		}	
	//define function for mouse movement
	function onMouseMove(event){
		if (dragging){
			dX = event.clientX - lastClientX;
			dY = event.clientY - lastClientY;

			modelRotationX += dY;
			modelRotationY += dX;

			if (modelRotationX > 90.0)
				modelRotationX = 90.0;
			if (modelRotationX < -90.0)
			        modelRotationX = -90.0;	
			
			requestAnimationFrame(draw);
		}

		lastClientX = event.clientX;
		lastClientY = event.clientY;
	}
		

	//define flatten function for array management
	function flatten(a){
		return a.reduce(function(b,v) { b.push.apply(b,v); return b}, [])
		} 
		

	function init(){

		var normals = [];
		var a, b = [0,0,0];


		// define instances of matrices to use later
		modelMatrix = new Matrix4();
		viewMatrix = new Matrix4();
		projectionMatrix = new Matrix4();
		modelViewMatrix = new Matrix4();
		xRotMatrix = new Matrix4();
		yRotMatrix = new Matrix4();
		scaleMatrix = new Matrix4();
		
		// define vectors to be used later
		lightPosition = new Float32Array();
		lightColor = new Float32Array();
		modelColor = new Float32Array();
		alpha = new Float32Array();
		

		//initialize GL context
		canvas = document.getElementById('webgl');
		gl = getWebGLContext(canvas,false);

		aspect = canvas.width / canvas.height;
		
		//initialize program object
		//configure renderer, vertex & fragment shaders
		var vertexSource = document.getElementById('vertexShader').text;
		var fragmentSource = document.getElementById('fragmentShader').text;
		program = createProgram(gl, vertexSource, fragmentSource);

		//make the program current
		gl.useProgram(program);

		
		//initialize vertex shader uniform objects
		projectionMatrixLocation = gl.getUniformLocation(program,'projectionMatrix');
		viewMatrixLocation = gl.getUniformLocation(program,'viewMatrix');
		modelMatrixLocation = gl.getUniformLocation(program,'modelMatrix');
		lightPositionLocation = gl.getUniformLocation(program,'lightPosition');


		//initialize fragment shader uniform objects
		modelColorLocation = gl.getUniformLocation(program,'modelColor');
		lightColorLocation = gl.getUniformLocation(program,'lightColor');
		alphaLocation = gl.getUniformLocation(program,'alpha');


		//create Buffers to store Array data
		positionBuffer = gl.createBuffer();
		triangleBuffer = gl.createBuffer();

		
		//flatten the arrays
		positionArray = new Float32Array(flatten(bunny.positions));
		triangleArray = new Uint16Array(flatten(bunny.triangles));



		//initialize and define normals array
		for (i=0; i<positionArray.length; i++){
			normals[i] = [0,0,0];
		}
		for (i=0; i<triangleArray.length;i++){

			a = normalize(positionArray[1][i] - positionArray[0][i]);
			b = normalize(positionArray[2][i] - positionArray[0][i]);
			n = normalize(cross(a,b));

			normals[positionArray[0][i]]+= n;
			normals[positionArray[1][i]]+= n;
			normals[positionArray[2][i]]+= n;
		}
		for (i=0; i<normals.length;i++){
			normals[i] = normalize(normals[i]);
		}


		
		//set up the position data
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
		vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition');	
		gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionLocation);

		//set up normal data attribute
		vertexNormalLocation = gl.getAttribLocation(program, 'vertexNormal');
		gl.vertexAttribPointer(vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexNormalLocation);

		//bind the triangle buffer, copy the data from triangleArray
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);
		 

		//define mouse click functions
		canvas.onmousedown = onMouseDown;
		canvas.onmouseup = onMouseUp;
		canvas.onmousemove = onMouseMove;
	
		//request animation frame with draw function as callback
		requestAnimationFrame(draw);

		}

	function draw(){
		
		//clear color (set the background purple for easy viewing)
		gl.clearColor(.55,.33,.65,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		

		// Set the camera location and orientation
		viewMatrix.setLookAt(0,0,5,0,0,-1,0,1,0);
		
		//set alpha value to change how it is smoothed
		alpha = [20.0];

		// Set the projection matrix with perspective information
		projectionMatrix.setPerspective(10, aspect, 1, 10);
	
		//set the light position
		lightPosition = [0,0,0,0];	

		//set the light color (white, so it shows the color of the model)
		lightColor = [1,1,1];

		//set the model color
		modelColor = [201/255,192/255,192/255];
		

		// Set the X and Y rotation matrices
		xRotMatrix.setRotate(modelRotationX,1,0,0);
		yRotMatrix.setRotate(modelRotationY,0,1,0);


		// Scale Matrices
		scaleMatrix.setScale(.3,.3,.3);

		//Make the model
		modelMatrix.set( xRotMatrix.multiply( yRotMatrix.multiply( scaleMatrix )));
	       
		//deliver to vertex shader
		gl.uniformMatrix4fv(projectionMatrixLocation,false,projectionMatrix.elements);
		gl.uniformMatrix4fv(viewMatrixLocation,false,viewMatrix.elements);
		gl.uniformMatrix4fv(modelMatrixLocation,false,modelMatrix.elements);
		gl.uniform4fv(lightPositionLocation,lightPosition);
	

		//deliver to fragment shader
		gl.uniform3fv(modelColorLocation, modelColor);
		gl.uniform3fv(lightColorLocation, lightColor);
		gl.uniform1fv(alphaLocation,alpha);
		

		//draws the elements
		gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);

		}
