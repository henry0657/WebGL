//Henry Toups
//12-09-16
//CSC 4356-36
//Final Project


	// declare global variables
	var canvas;
	var canvas2;

/*
	var gl;
	var gl2;
*/

	var fov =1.5; 
	var aspect = 1.0;
	var imgCount=0;

	angle_x = 0;
	angle_y=0;
	var dragging = false;
	
	var mouseDown = false;
	var lastMouseX = null;
	var lastMouseY = null;
	var sliderX,sliderY,sliderZ;
	
	var keys = {};

function handleKeyDown(event)
{
	keys[event.keyCode] = true;
}

function handleKeyUp(event)
{
	keys[event.keyCode] = false;
}
//define function tracking mouse movement when mouse is clicked
function handleMouseDown(event)
{
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
}

function handleMouseUp(event)
{
	mouseDown = false;
}

function handleMouseMove(event)
{
	if (!mouseDown)
	{
		return;
	}
	var newX = event.clientX;
	var newY = event.clientY;

	angle_x += (newY - lastMouseY) * 0.005;
	angle_y -= (newX - lastMouseX) * 0.005;

	angle_x = Math.max(Math.min(angle_x, Math.PI / 2), -Math.PI / 2);

	lastMouseX = newX
	lastMouseY = newY;

	event.preventDefault();
	requestAnimationFrame(draw);
}
		
//define flatten function for array management
function flatten(a){
		return a.reduce(function(b,v) { b.push.apply(b,v); return b}, [])
		} 
		
function Cube(size){
	var s = (size || 1)/2;
	var coords = [];
	var normals = [];
	var texCoords = [];
	var indices = [];
	function face(xyz, nrm){
		var start = coords.length/3;
		var i;
		for(i=0; i < 12; i++)
			coords.push(xyz[i]);
		for(i=0; i < 4; i++)
			normals.push(nrm[0],nrm[1],nrm[2]);

		texCoords.push(0,0,1,0,1,1,0,1);
		indices.push(start, start+1, start+2, start, start+2, start+3);

	}
	face([ -s,-s,s,  s,-s,s,  s,s,s,  -s,s,s], [0, 0, 1]);
	face([ -s,-s,-s, -s,s,-s, s,s,-s,  s,-s,-s], [0, 0, -1]);
	face([ -s,s,-s,  -s,s,s,  s,s,s,   s,s,-s], [0, 1, 0]);
	face([ -s,-s,-s,  s,-s,-s,  s,-s,s,  -s,-s,s], [0, -1, 0]);
	face([  s,-s,-s,  s,s,-s,  s,s,s,  s,-s,s], [1, 0, 0]);
	face([ -s,-s,-s,  -s,-s,s,  -s,s,s,  -s,s,-s], [-1, 0, 0]);

	return {
		vertexPositions: new Float32Array(coords),
		vertexNormals: new Float32Array(normals),
		vertexTextureCoords: new Float32Array(texCoords),
		indices: new Uint16Array(indices)	
		}
		}	
function mul(a, b)
{
	var r = [];

	r[0] = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
	r[1] = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
	r[2] = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
	r[3] = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

	r[4] = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
	r[5] = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
	r[6] = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
	r[7] = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

	r[8] = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
	r[9] = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
	r[10] = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
	r[11] = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

	r[12] = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
	r[13] = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
	r[14] = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
	r[15] = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];

	return r;
}
function rotateXY(angle_x, angle_y)
{
	var cosX = Math.cos(angle_x);
	var sinX = Math.sin(angle_x);
	var cosY = Math.cos(angle_y);
	var sinY = Math.sin(angle_y);

	return [
		 cosY,        0,    -sinY,        0,
		-sinX * sinY, cosX, -sinX * cosY, 0,
		 cosX * sinY, sinX,  cosX * cosY, 0,
		 0,           0,     0,           1
	];
}

function perspectiveMatrixInverse(fov, aspect, near, far)
{
	var h = Math.tan(0.5 * fov);
	var w = h * aspect;
	var z0 = (far - near) / (-2 * far * near);
	var z1 = (far + near) / (-2 * far * near);

	return [
		w, 0, 0, 0,
		0, h, 0, 0,
		0, 0, 0, z0,
		0, 0, 1, z1
	];
}

function CubeMap(gl){
		this.gl = gl;
		this.inv_mvp = new Matrix4();
		
		this.positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.positionBuffer );
		var vertices = new Float32Array([-1,-1,3,-1,-1,3]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
		}

CubeMap.prototype.initTextures = function(path){
		
	this.skyCubeTexture = this.gl.createTexture();
	this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skyCubeTexture);
	this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

	var faces = [["posx.png", this.gl.TEXTURE_CUBE_MAP_POSITIVE_X],
				 ["negx.png", this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
				 ["posy.png", this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
				 ["negy.png", this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
				 ["posz.png", this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
				 ["negz.png", this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
	for (var i = 0; i < faces.length; i++)
	{
		var face = faces[i][1];
		var image = new Image();
		image.onload = function (texture, face, image, gl) {
			return function () {
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
				gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				imgCount++;
				if (imgCount == 6)
				{
					gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
				}
				requestAnimationFrame(draw);
			}
		}(this.skyCubeTexture, face, image, this.gl);
		image.src =  faces[i][0];
	}
	
}
					
CubeMap.prototype.ShaderInit = function(vertexName, fragmentName){
		this.vertexSource = document.getElementById(vertexName).text;
		this.fragmentSource = document.getElementById(fragmentName).text;
		this.program = createProgram(this.gl, this.vertexSource, this.fragmentSource);


		this.gl.useProgram(this.program);
		this.vertexPositionLocation = this.gl.getAttribLocation(this.program, 'vertexPosition');

		this.inv_mvp = this.gl.getUniformLocation(this.program, 'inv_mvp');
		this.skybox_sampler = this.gl.getUniformLocation(this.program, 'skybox');
		
		this.gl.vertexAttribPointer(this.vertexPositionLocation, 2, this.gl.FLOAT, false,0 ,0);


		}

CubeMap.prototype.draw = function(){

	//gl.clearColor(.75, .33, .65, 1.0);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	
	
	this.gl.useProgram(this.program);

	//enable the vertex attrib array
	this.gl.enableVertexAttribArray(this.vertexPositionLocation);
	
	
	this.gl.activeTexture(this.gl.TEXTURE0);
	this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.skyCubeTexture);	
	this.gl.uniform1i(this.skybox_sampler,0);

	var p = perspectiveMatrixInverse(fov, aspect, 0.01, 100.0);
	var v = rotateXY(angle_x,angle_y);
	var mat = mul(p,v);

	this.gl.uniformMatrix4fv(this.inv_mvp,false,mat);	
	
		//draws the cube
	
	this.gl.drawArrays(this.gl.TRIANGLES,0 ,3);
		

	};

function init(){
	//initialize GL context

	canvas = document.getElementById('webgl');
	var gl = getWebGLContext(canvas,false);

	aspect = canvas.width / canvas.height;


	gl.viewport(0, 0, canvas.width, canvas.height);
	


	//get Extension for depth texture and enable depth test
	gl.enable(gl.DEPTH_TEST);
	gl.getExtension("webgl_depth_texture");



	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	


	//create a cubemap instance
	skyBoxMap = new CubeMap(gl);
	skyBoxMap.ShaderInit("cubeVertexShader","cubeFragmentShader");
	skyBoxMap.initTextures("");
	
	
	requestAnimationFrame(draw);
	
		}

function draw(){		
		if(imgCount < 6){
			skyBoxMap.gl.clearColor(0.0, imgCount/6.0, 0.0, 1.0);
			skyBoxMap2.gl.clearColor(0.0, imgCount/6.0, 0.0, 1.0);
			skyBoxMap.gl.clear(skyBoxMap.gl.COLOR_BUFFER_BIT);	
			skyBoxMap2.gl.clear(skyBoxMap2.gl.COLOR_BUFFER_BIT); 
		}
		else{
			skyBoxMap.draw();
				
      
        	}
        	
        
	}
	


	