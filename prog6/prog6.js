//Henry Toups
//11-15-2016
//CSC 4356-36
//Project 6
// this project builds upon project 5
// some aspects of project 5 have been updated:
// 1) the perspective is further and easier to look at
// 2) changing a misplaced value in the html allows for the lighting to be accurate
// 
// The purpose of this project was to learn to use FrameBuffer objects to allow for postProcessing of scene
// we implement 3 postprocessing techniques- blur, edge detection, and threshold filtering



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
	
	var blurShader = ["squareVertexShader", "blurShader"];
	var edgeShader = ["squareVertexShader", "edgeShader"];
	var thresholdShader = ["squareVertexShader", "thresholdShader"];
	var doNothingShader = ["squareVertexShader", "squareFragmentShader"];

	var event = new MouseEvent("click");

	//FrameBuffer Constructor for creating framebuffer
	function FrameBuffer(colorTexture, depthTexture, width, height)
	{

		//set frame buffer width and height
		this.frameBufferWidth = width;
		this.frameBufferHeight = height;

		//bind the colorTexture
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height,0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		//set the texture parameters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		//bind the depth texture
		gl.bindTexture(gl.TEXTURE_2D, depthTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

		//set the depth texture paramters
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		//create a Framebuffer object
		this.frameBuffer = gl.createFramebuffer();
		//bind the object to the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

		//attach the colorTexture and depthTexture to the framebuffer
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT , gl.TEXTURE_2D, depthTexture, 0);
		//finish by binding Null to the framebuffer for the next frame
		gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	}
	//function to return the framebuffer object in a FrameBuffer object
	FrameBuffer.prototype.get = function(){
		return this.frameBuffer;
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
		if(obj.tangents)
		this.tangentArray = new Float32Array(flatten(obj.tangents));

		//bind/set the buffer data
		gl.bindBuffer(gl.ARRAY_BUFFER,this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,this.texCoordArray,gl.STATIC_DRAW);
		if(obj.tangents){
		gl.bindBuffer(gl.ARRAY_BUFFER,this.tangentBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,this.tangentArray,gl.STATIC_DRAW);
		}
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

		gl.uniform1i(gl.getUniformLocation(that.program, 'textureSampler0'), 0);
		requestAnimationFrame(function() {that.draw()});
	
		}

	//flip the pixels vertically when a picture is unpacked
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);

	//initialize a new texture and a picture
	var texture = this.texture = gl.createTexture();
	var modelImage = new Image();
	
	//when image is initalized, call previous function to map the pic to the texture
	modelImage.onload = function() { load(modelImage, texture);}

	modelImage.crossOrigin = "anonymous";
	modelImage.src = "http://i.imgur.com/7thU1gD.jpg";

	}
Model.prototype.draw = function (){

			//clear color (set the background purple for easy viewing)
			gl.clearColor(.75,.33,.65,1.0);
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

			//enable shader attributes
			gl.enableVertexAttribArray(this.vertexPositionLocation);
		
			if(this.vertexNormalLocation != -1)
			gl.enableVertexAttribArray(this.vertexNormalLocation);
			if(this.vertexTangentLocation != -1)
			gl.enableVertexAttribArray(this.vertexTangentLocation);
			gl.enableVertexAttribArray(this.vertexTexCoordLocation);

			//deliver to vertex shader


			gl.uniformMatrix4fv(this.projectionMatrixLocation,false,this.projectionMatrix.elements);
			gl.uniformMatrix4fv(this.viewMatrixLocation,false,this.viewMatrix.elements);
			gl.uniformMatrix4fv(this.modelMatrixLocation,false,this.modelMatrix.elements);
			
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);	

			gl.uniform4fv(this.lightPositionLocation,this.lightPosition);

			//deliver to fragment shader
			gl.uniform3fv(this.modelColorLocation, this.modelColor);
			gl.uniform3fv(this.lightColorLocation, this.lightColor);
			gl.uniform1fv(this.alphaLocation,this.alpha);
		
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
			if(this.vertexTexCoordLocation != -1)
			gl.vertexAttribPointer(this.vertexTexCoordLocation,2,gl.FLOAT, false, 0,0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
			if(this.vertexPositionLocation != -1)
			gl.vertexAttribPointer(this.vertexPositionLocation,3,gl.FLOAT,false,0,0);
		
		    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			if(this.vertexNormalLocation != -1)
			gl.vertexAttribPointer(this.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
	
			gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
			if(this.vertexTangentLocation != -1)
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

		//get Extension for depth texture and enable depth test
		gl.enable(gl.DEPTH_TEST);
		gl.getExtension("webgl_depth_texture");

		//create textures for color and depth
		colorTexture =gl.createTexture();
		depthTexture =gl.createTexture();

		//create and initialize new chest model
		chestModel = new Model(chest, [0.0,0.0,0.0]);
		chestModel.initTextures(gl);
		chestModel.ShaderInit("texVertexShader","texFragmentShader");
		
		//squareModel initialization, setting texture to the colorTexture value 
		//and the initial Shader to the do nothing Shader
		squareModel = new  Model(square, [0.0,0.0,0.0]);
		squareModel.texture = colorTexture;
		squareModel.ShaderInit(doNothingShader[0],doNothingShader[1]);


		//create instance of FrameBuffer with the textures and canvas size
		buffer = new FrameBuffer(colorTexture,depthTexture, canvas.width, canvas.height);
		requestAnimationFrame(draw);

		}

	function draw(){		
		

		//bind the framebuffer witht he object we created
		// and create the off screen buffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.get());
		gl.viewport(0, 0, buffer.frameBufferWidth, buffer.frameBufferHeight);

		//clear the buffer and draw the chest
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
		chestModel.draw();
		
		//set the on screen buffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);


		//draw the square over the original image, allowing for post processing
		squareModel.draw();
		gl.bindTexture(gl.TEXTURE_2D, null);
		}
	
	//callback function that changes the picture when the sliders are adjusted
	function slideEvent(){
		requestAnimationFrame(draw);
	}

	
	//callback function for changing shaders when radio buttons are clicked
	function updateShader(){
		if(document.getElementById("radio1").checked)
			squareModel.ShaderInit(thresholdShader[0],thresholdShader[1]);
		else if(document.getElementById("radio2").checked)
			squareModel.ShaderInit(blurShader[0],blurShader[1]);
		else if(document.getElementById("radio3").checked)
			squareModel.ShaderInit(edgeShader[0],edgeShader[1]);
		else if(document.getElementById("radio4").checked)
			squareModel.ShaderInit(doNothingShader[0],doNothingShader[1]);
		requestAnimationFrame(draw);

	}


	