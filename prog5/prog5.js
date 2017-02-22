//Henry Toups
//11-1-2016
//CSC 4356-36
//Project 5
// this project creates an object of a chest and binds a texture to it of a picture of treasure chest
// building on the rest of the projects it also has shaders to affect the lighting
// and sliders inside the html file to change the lighting position
// I also made the shader initialization a part of the Model object

	// declare global variables
	var canvas;
	var gl;
	
	var modelRotationX = 0;
	var modelRotationY = 0;
	var dragging = false;
	var lastClientX = 0;
	var lastClientY = 0;
	var dX = 0, dY = 0;
	var sliderX,sliderY,sliderZ;
	
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
		
	//define an method ShaderInit
Model.prototype.ShaderInit = function(vertexName, fragmentName){
		
		//initialize program object
		//configure renderer, vertex & fragment shaders
		this.vertexSource = document.getElementById(vertexName).text;
		this.fragmentSource = document.getElementById(fragmentName).text;
		this.program = createProgram(gl, this.vertexSource, this.fragmentSource);

		//make the program current
		gl.useProgram(this.program)
	
		//get the position of the attributes
		this.vertexPositionLocation = gl.getAttribLocation(this.program, 'vertexPosition');	
		this.vertexNormalLocation = gl.getAttribLocation(this.program, 'vertexNormal');
		this.vertexTexCoordLocation = gl.getAttribLocation(this.program,'vertexTexCoord');
		this.vertexTangentLocation = gl.getAttribLocation(this.program,'tangent');

		//enable the vertex attrib arrays
		gl.enableVertexAttribArray(this.vertexPositionLocation);
		gl.enableVertexAttribArray(this.vertexNormalLocation);
		gl.enableVertexAttribArray(this.vertexTangentLocation);
		gl.enableVertexAttribArray(this.vertexTexCoordLocation);

		//initialize vertex shader uniform objects
		this.projectionMatrixLocation = gl.getUniformLocation(this.program,'projectionMatrix');
		this.viewMatrixLocation = gl.getUniformLocation(this.program,'viewMatrix');
		this.modelMatrixLocation = gl.getUniformLocation(this.program,'modelMatrix');
		this.lightPositionLocation = gl.getUniformLocation(this.program,'lightPosition');

		//initialize fragment shader uniform objects
		this.modelColorLocation = gl.getUniformLocation(this.program,'modelColor');
		this.lightColorLocation = gl.getUniformLocation(this.program,'lightColor');
		this.alphaLocation = gl.getUniformLocation(this.program,'alpha');

		}

			

	//define an object Model
	function Model(obj, translation){
		
		// define instances of matrices to use later
		
		this.xRotMatrix = new Matrix4();
		this.yRotMatrix = new Matrix4();
		this.scaleMatrix = new Matrix4();		
		this.modelMatrix = new Matrix4();
		this.viewMatrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		this.modelViewMatrix = new Matrix4();

		
		// define vectors corresponding to uniform counterparts in html file
		this.lightPosition = new Float32Array();
		this.lightColor = new Float32Array();
		this.modelColor = new Float32Array();
		this.alpha = new Float32Array();

	

		//set the translation
		this.translation = translation;

		//create Buffers to store Array data
		this.positionBuffer = gl.createBuffer();
		this.triangleBuffer = gl.createBuffer();
		this.texCoordBuffer =   gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		this.tangentBuffer = gl.createBuffer();

		//flatten the arrays
		this.positionArray = new Float32Array(flatten(obj.positions));
		this.triangleArray = new Uint16Array(flatten(obj.triangles));
		this.normalArray =   new Float32Array(flatten(obj.normals));
		this.texCoordArray = new Float32Array(flatten(obj.texCoords));
		this.tangentArray = new Float32Array(flatten(obj.tangents));

		//bind/set the buffer data
		gl.bindBuffer(gl.ARRAY_BUFFER,this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,this.texCoordArray,gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER,this.tangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,this.tangentArray,gl.STATIC_DRAW);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.normalArray,gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);
	}		

// member function for initializing the textures
Model.prototype.initTextures = function(gl){
	var that = this;


	//internal function for loading and binding the image, that will be called when
	//an image is loaded
	function load(image, texture){
		
		
		gl.bindTexture (gl.TEXTURE_2D, texture);
		gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		gl.uniform1i(gl.getUniformLocation(that.program, 'modelSampler'), 0);
		requestAnimationFrame(function() {that.draw()});
	
		}

	//flip the pixels vertically when a picture is unpacked
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);

	//initialize a new texture and a picture
	var texture = that.modelTexture = gl.createTexture();
	var modelImage = new Image();
	
	//when image is initalized, call previous function to map the pic to the texture
	modelImage.onload = function() { load(modelImage, texture);}

	modelImage.crossOrigin = "anonymous";
	modelImage.src = "http://i.imgur.com/7thU1gD.jpg";

	}
Model.prototype.draw = function (){

			//clear color (set the background purple for easy viewing)
			gl.clearColor(.55,.33,.65,1.0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.enable(gl.DEPTH_TEST);

			// Set the camera location and orientation
			this.viewMatrix.setLookAt(0,0,5,0,0,-1,0,1,0);
		
			//set alpha value to change how it is smoothed
			this.alpha = [20.0];

			// Set the projection matrix with perspective information
			this.projectionMatrix.setPerspective(45, aspect, 1, 15);
	
			//set the light position
			
			this.lightPosition = [sliderX.value,sliderY.value,sliderZ.value,1];	

			//set the light color (white, so it shows the color of the model)
			this.lightColor = [1,1,1];

		

			// Set the X and Y rotation matrices
			this.xRotMatrix.setRotate(modelRotationX,1,0,0);
			this.yRotMatrix.setRotate(modelRotationY,0,1,0);


			// Scale Matrices
			this.scaleMatrix.setScale(1,1,1);
			
			
			//Make the model(scaled)
			this.modelMatrix.set( this.xRotMatrix.multiply( this.yRotMatrix.multiply( this.scaleMatrix )));
			
			//translate the model
			this.modelMatrix.translate(this.translation[0],this.translation[1],this.translation[2]);	       
			gl.useProgram(this.program);

			//deliver to vertex shader
			gl.uniformMatrix4fv(this.projectionMatrixLocation,false,this.projectionMatrix.elements);
			gl.uniformMatrix4fv(this.viewMatrixLocation,false,this.viewMatrix.elements);
			gl.uniformMatrix4fv(this.modelMatrixLocation,false,this.modelMatrix.elements);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.modelTexture);	

			gl.uniform4fv(this.lightPositionLocation,this.lightPosition);

			//deliver to fragment shader
			gl.uniform3fv(this.modelColorLocation, this.modelColor);
			gl.uniform3fv(this.lightColorLocation, this.lightColor);
			gl.uniform1fv(this.alphaLocation,this.alpha);
		
			

			gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
			gl.vertexAttribPointer(this.vertexTexCoordLocation,2,gl.FLOAT, false, 0,0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
			gl.vertexAttribPointer(this.vertexPositionLocation,3,gl.FLOAT,false,0,0);
		
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.vertexAttribPointer(this.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
	
			gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
			gl.vertexAttribPointer(this.vertexTangentLocation,3,gl.FLOAT,false,0,0);
			//draws the elements
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
			gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0);
		
		
		};
		
	



	function init(){
		//initialize GL context

		canvas = document.getElementById('webgl');
		gl = getWebGLContext(canvas,false);

		aspect = canvas.width / canvas.height;
		
		//define mouse click functions
		canvas.onmousedown = onMouseDown;
		canvas.onmouseup = onMouseUp;
		canvas.onmousemove = onMouseMove;

		//connect sliders to html sliders
		sliderX = document.getElementById("xslider");
		sliderZ = document.getElementById("zslider");
		sliderY = document.getElementById("yslider");

		//create and initialize new chest model
		chestModel = new Model(chest, [0.0,0.0,0.0]);
		chestModel.initTextures(gl);
		chestModel.ShaderInit("texVertexShader","texFragmentShader");
		

		requestAnimationFrame(draw);

		}

	function draw(){
		
		
		
		chestModel.draw();
				

		
		}
	
	//callback function that changes the picture when the sliders are adjusted
	function slideEvent(){
		requestAnimationFrame(draw);
	}