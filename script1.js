//// TODO:
// goals + explosions
// mobile friendly missiles
// finish levels 6-17
// favicon.ico



// Variables
var pageIsLoaded = false;
var isFullScreen = false;
var ctx;
var fullscreenEnterTimestamp;
var mouseX = 0;
var mouseY = 0;
var canvas;
var diagonalCanvasSize = null;
var gameManager;
var leftIsPressed = false;
var leftIsPressedInstant = false;
var rightIsPressed = false;
var rightIsPressedInstant = false;
var isTouchMode = false;
var touchPosXs = [];
var touchPosYs = [];
var isPaused = false;
var halfWidth = 100;
var halfHeight = 100;

// Make Math more useful
if (!("hypot" in Math)) {  // Polyfill
  Math.hypot = function(x, y) {
    return Math.sqrt(x * x + y * y);
  };
}

function pageLoaded() {
  /* Define canvas */
  canvas = document.getElementById("can");
  window.oncontextmenu = function (e) {// Disable right click popup
    e.preventDefault();
  };
  ctx = canvas.getContext("2d");


  /* Config resizable canvas */
  function resizeCanvas() {
    if (isFullScreen && Date.now()-fullscreenEnterTimestamp > 500 && canvas.height > window.innerHeight) {// if fullscreen and screen size didn't change imediately after you entered fullscreen (mobile-friendly) and canvas is getting smaller
    isFullScreen = false;
    document.getElementById("fullscreen-button").style.display = "";
  }
  var resizeDifferenceX = (window.innerWidth-canvas.width)/2;
  var resizeDifferenceY = (window.innerHeight-canvas.height)/2;
  diagonalCanvasSize = Math.sqrt(window.innerWidth*window.innerWidth+window.innerHeight*window.innerHeight);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  halfWidth = canvas.width/2;
  halfHeight = canvas.height/2;
  gameManager.resize(resizeDifferenceX/2, resizeDifferenceY/2);
  ctx.lineWidth = diagonalCanvasSize*0.001;
}

// --- Set up gameManager
gameManager = new GameManager();
gameManager.init();

/* Listeners for PC */
document.addEventListener('mousemove', draw, false);
document.addEventListener('keydown', function(event) {
  gameManager.onKeyDown(event);
});
window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();
canvas.addEventListener('mousedown', function(evt) {
  isTouchMode = false;
  mouseButton = evt.button || evt.which;
  if (mouseButton === 1) {
    leftIsPressed = true;
    leftIsPressedInstant = true;
  } else {
    rightIsPressed = true;
    rightIsPressedInstant = true;
  }

});
canvas.addEventListener('mouseup', function(evt) {
  mouseButton = evt.button || evt.which;
  if (mouseButton === 1) {
    leftIsPressed = false;
  } else {
    rightIsPressed = false;
  }
});

/* Listners for mobile */
canvas.addEventListener("touchstart", function (e) {
  mousePos = getTouchPos(canvas, e);
  mouseX = mousePos.x;
  mouseY = mousePos.y;
  isTouchMode = true;
  leftIsPressed = true;
  leftIsPressedInstant = true;
}, false);
canvas.addEventListener("touchend", function (e) {
  mousePos = getTouchPos(canvas, e);
  mouseX = mousePos.x;
  mouseY = mousePos.y;
  leftIsPressed = false;
}, false);
canvas.addEventListener("touchmove", function (e) {
  mousePos = getTouchPos(canvas, e);
  mouseX = mousePos.x;
  mouseY = mousePos.y;

}, false);




var metaUpdate = function () {///todo check for cross platform and debug here: http://bencentra.com/code/2014/12/05/html5-canvas-touch-events.html
  gameManager.update();
  window.requestAnimationFrame(metaUpdate);
}
window.requestAnimationFrame(metaUpdate);

// ---

/* Update flag */
pageIsLoaded = true;
}

/** Helper functions **/
function overlayOptions(option) {
  if (option === 1) {
    isPaused = false;
    gameManager.factory.phase = 0;
    gameManager.factory.wave --;
    gameManager.bads = [];// Clear enemies
    gameManager.objs = [gameManager.player];// Clear enemies/bullets
    gameManager.factory.waveTextTimeout = gameManager.factory.waveTextReset;
    gameManager.player.isLost = false;
    leftIsPressed = false;// Reset mouse status
    rightIsPressed = false;

    canvas.style.webkitFilter = "blur(0px)";// Remove blur
    document.getElementById("overlay-content").style.display = "none";
    document.getElementById("fullscreen-button").style.display = "";// Show fullscreen button

  } else if (option === 2) {
    window.location.href = "https://githubium.github.io";
  } else {
    console.log("invalid option");
  }
}

function requestFullScreen() {
  var el = document.body;

  // Supports most browsers and their versions.
  var requestMethod = el.requestFullScreen || el.webkitRequestFullScreen
  || el.mozRequestFullScreen || el.msRequestFullScreen;


  if (requestMethod) {

    // Native full screen.
    requestMethod.call(el);

  } else if (typeof window.ActiveXObject !== "undefined") {

    // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");

    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
  document.getElementById("fullscreen-button").style.display = "none";
  isFullScreen = true;
  fullscreenEnterTimestamp = Date.now();
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}
// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
  var rect = canvasDom.getBoundingClientRect();
  touchy = touchEvent.touches;
  touchPosXs = [];
  touchPosYs = [];
  for (var i = 0; i < touchy.length; i ++) {
    touchPosXs.push(touchy[i].clientX);
    touchPosYs.push(touchy[i].clientY);
  }
  return {
    x: (touchPosXs[0] - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (touchPosYs[0] - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

function draw(e) {
  var pos = getMousePos(canvas, e);
  mouseX = pos.x;
  mouseY = pos.y;
}

/** Game "objects" **/
var Sparks = function(x, y, obj) {
  gameManager.objs.push(this);
  this.speed = diagonalCanvasSize*0.005;
  this.points = [];
  this.lifeLeft = 1000;
  this.size = diagonalCanvasSize*0.0015;

  // Calculate bias direction
  var chX = obj.x-halfWidth;
  var chY = obj.y-halfHeight;
  var dist = Math.sqrt(chX*chX+chY*chY)*4;
  this.biasX = chX/dist;
  this.biasY = chY/dist;

  for (var i = 0; i < obj.sides; i ++) {
    this.points.push({x: x+Math.random()*4-2, y: y+Math.random()*4-2});
  }

  this.resize = function() {///

  };

  this.update = function(d) {

    for (var i = 0; i < this.points.length; i ++) {
      var dot = this.points[i];
      dot.x += (Math.random()-0.5+this.biasX)*this.speed;
      dot.y += (Math.random()-0.5+this.biasY)*this.speed;
    }

    this.lifeLeft -= d;

    if (this.lifeLeft <= 0) {
      this.isDead = true;
    }
  }

  this.draw = function() {
    ctx.fillStyle = "rgb(255, 255, 255, "+this.lifeLeft*0.0008+")";
    for (var i = 0; i < this.points.length; i ++) {
      var dot = this.points[i];
      ctx.fillRect(dot.x, dot.y, this.size, this.size);
    }
  }
};

var DecayLines = function(obj) {
  gameManager.objs.push(this);
  this.isDead = false;
  this.lifeLeft = 1000;
  this.speed = diagonalCanvasSize*0.0006;

  switch (obj.sides) {
    case 3:
      var chX1 = Math.cos(obj.rot1)*obj.size;
      var chY1 = Math.sin(obj.rot1)*obj.size;
      var chX2 = Math.cos(obj.rot2)*obj.size;
      var chY2 = Math.sin(obj.rot2)*obj.size;
      var chX3 = Math.cos(obj.rot3)*obj.size;
      var chY3 = Math.sin(obj.rot3)*obj.size;
      this.points = [
        {x:obj.x+chX1+chY1, y:obj.y+chY1-chX1},
        {x:obj.x+chX2+chY2, y:obj.y+chY2-chX2},
        {x:obj.x+chX3+chY3, y:obj.y+chY3-chX3}
      ];
      break;

    case 4:
      var chX1 = Math.cos(obj.rot1)*obj.size;
      var chY1 = Math.sin(obj.rot1)*obj.size;
      var chX2 = Math.cos(obj.rot2)*obj.size;
      var chY2 = Math.sin(obj.rot2)*obj.size;
      this.points = [
        {x:obj.x+chX1+chY1, y:obj.y+chY1-chX1},
        {x:obj.x+chX1-chY1, y:obj.y+chY1+chX1},
        {x:obj.x+chX2+chY2, y:obj.y+chY2-chX2},
        {x:obj.x+chX2-chY2, y:obj.y+chY2+chX2}
      ];
      break;

    case 5:
      var chX1 = Math.cos(obj.rot1)*obj.size;
      var chY1 = Math.sin(obj.rot1)*obj.size;
      var chX2 = Math.cos(obj.rot2)*obj.size;
      var chY2 = Math.sin(obj.rot2)*obj.size;
      var chX3 = Math.cos(obj.rot3)*obj.size;
      var chY3 = Math.sin(obj.rot3)*obj.size;
      var chX4 = Math.cos(obj.rot4)*obj.size;
      var chY4 = Math.sin(obj.rot4)*obj.size;
      var chX5 = Math.cos(obj.rot5)*obj.size;
      var chY5 = Math.sin(obj.rot5)*obj.size;
      this.points = [
        {x:obj.x+chX1+chY1, y:obj.y+chY1-chX1},
        {x:obj.x+chX2+chY2, y:obj.y+chY2-chX2},
        {x:obj.x+chX3+chY3, y:obj.y+chY3-chX3},
        {x:obj.x+chX4+chY4, y:obj.y+chY4-chX4},
        {x:obj.x+chX5+chY5, y:obj.y+chY5-chX5}
      ];
      break;

      case 6:
      var chX1 = Math.cos(this.rot1)*this.size;
      var chY1 = Math.sin(this.rot1)*this.size;
      var chX2 = Math.cos(this.rot2)*this.size;
      var chY2 = Math.sin(this.rot2)*this.size;
      var chX3 = Math.cos(this.rot3)*this.size;
      var chY3 = Math.sin(this.rot3)*this.size;
      this.points = [
        {x:this.x+chX1+chY1, y:this.y+chY1-chX1},
        {x:this.x-chX3-chY3, y:this.y-chY3+chX3},
        {x:this.x+chX2+chY2, y:this.y+chY2-chX2},
        {x:this.x-chX1-chY1, y:this.y-chY1+chX1},
        {x:this.x+chX3+chY3, y:this.y+chY3-chX3},
        {x:this.x-chX2-chY2, y:this.y-chY2+chX2}
      ];
        break;
    }

    // Split into lines
    var beforeI;
    for (var i = 0; i < this.points.length; i++) {
      if (i === 0) {
        beforeI = this.points.length-1;
      } else {
        beforeI = i-1;
      }
      this.points[i].x2 = this.points[beforeI].x;
      this.points[i].y2 = this.points[beforeI].y;
    }

    // Calculate bias direction
    var chX = obj.x-halfWidth;
    var chY = obj.y-halfHeight;
    var dist = Math.sqrt(chX*chX+chY*chY);
    this.biasX = chX/dist;
    this.biasY = chY/dist;

    this.resize = function() {///
    };


  this.update = function(d) {
    for (var i = 0; i < this.points.length; i ++) {
      var point = this.points[i];
      point.x += (2*Math.random()-1+this.biasX)*this.speed;
      point.x2 += (2*Math.random()-1+this.biasX)*this.speed;
      point.y += (2*Math.random()-1+this.biasY)*this.speed;
      point.y2 += (2*Math.random()-1+this.biasY)*this.speed;
    }

    this.lifeLeft -= d;

    if (this.lifeLeft <= 0) {
      this.isDead = true;
    }
  };

  this.draw = function() {
    ctx.strokeStyle = "rgba(255, 0, 0, "+this.lifeLeft*0.0008+")"

    for (var i = 0; i < this.points.length; i ++) {
      var point = this.points[i];
      ctx.beginPath();
      ctx.lineTo(point.x, point.y);
      ctx.lineTo(point.x2, point.y2);
      ctx.closePath();
      ctx.stroke();
    }
  };
}

var Bullet = function(x, y, rot, isGreen) {
  this.isDead = false;
  gameManager.objs.push(this);
  this.x = x;
  this.y = y;
  if (isGreen) {
    this.greenness = 0.3;
  } else {
    this.greenness = 0;
  }
  this.chX = Math.cos(rot);
  this.chY = Math.sin(rot);
  this.length = 11*diagonalCanvasSize*0.0008;
  this.x2 = this.x + this.chX * this.length;
  this.y2 = this.y + this.chY * this.length;
  this.speed = 1*diagonalCanvasSize*0.0008;

  this.resize = function(diffX, diffY) {
    this.x += diffX;
    this.y += diffY;
    this.x2 += diffX;
    this.y2 += diffY;
  }
  this.update = function(d) {
    var adjChX = this.chX*d*this.speed;
    var adjChY = this.chY*d*this.speed;
    this.x += adjChX;
    this.y += adjChY;
    this.x2 += adjChX;
    this.y2 += adjChY;

    if (this.greenness > 0 && this.greenness < 1) {
      if (this.greenness !== 1) {
        this.greenness *= 2;
        if (this.greenness > 1) {
          this.greenness = 1;
        }
      }
    } else {
    for (var i = 0; i < gameManager.bads.length; i++) {
      var bad = gameManager.bads[i];
      var chX = bad.x-this.x;
      var chY = bad.y-this.y;
      var dist = Math.sqrt(chX*chX+chY*chY);
      if (dist < bad.size*1.25) {
        if (bad.sides === 6 && this.greenness === 0) {// If a hexagon
          bad.greenness = 1;
          var sixth = Math.PI/3;
          var initRot = bad.rot1-Math.PI/12;
          new Bullet(bad.x, bad.y, initRot, true);
          new Bullet(bad.x, bad.y, initRot+sixth, true);
          new Bullet(bad.x, bad.y, initRot+sixth*2, true);
          new Bullet(bad.x, bad.y, initRot+sixth*3, true);
          new Bullet(bad.x, bad.y, initRot+sixth*4, true);
          new Bullet(bad.x, bad.y, initRot+sixth*5, true);

        } else {
          bad.hp --;
          if (bad.redness < 0.5) {
            bad.redness = 3;
            new Sparks(this.x, this.y, bad);


          }
        }
        this.isDead = true;
        break;
      }
    }
  }

    var ps = gameManager.player.size1;
    if (this.x2 < -ps || this.x2 > canvas.width+ps || this.y2 < -ps || this.y2 > canvas.height+ps) {
      this.isDead = true;
    }

  }
  this.draw = function() {
    var nonGreen = 255*(1-this.greenness);
    ctx.strokeStyle = 'rgb('+nonGreen+', 255, '+nonGreen+')';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x2, this.y2);
    ctx.closePath();
    ctx.stroke();
  }
};

var Missile = function(x, y, rot) {
  gameManager.objs.push(this);
  this.x = x;
  this.y = y;
  this.rot1 = rot;
  this.rot2 = rot+Math.PI/5;
  this.acceleration = 0.0002;
  this.speed = 0.000035*diagonalCanvasSize;
  this.size = 0.0055*diagonalCanvasSize;

  this.resize = function() {};

  this.update = function(d) {
    for (var i = 0; i < gameManager.bads.length; i++) {
      var bad = gameManager.bads[i];
      var chX = bad.x-this.x;
      var chY = bad.y-this.y;
      var dist = Math.sqrt(chX*chX+chY*chY);
      if (dist < bad.size*1.25) {
        bad.hp -= 100;
        this.isDead = true;
        bad.redness = 3;
        new Sparks(this.x, this.y, bad);
        break;
      }
    }

    var bestDist = 999999;
    var bestIndex = null;
    var bestChX;
    var bestChY;
    for (var i = 0; i < gameManager.bads.length; i++) {
      var bad = gameManager.bads[i];
      var chX = bad.x-this.x;
      var chY = bad.y-this.y;
      var newDist = Math.sqrt(chX*chX+chY*chY);
      if (newDist < bestDist) {
        bestDist = newDist;
        bestIndex = i;
        bestChX = chX;
        bestChY = chY;
      }
    }
    if (bestDist !== null) {
      var targetX = gameManager.bads[bestIndex];
      var targetY = gameManager.bads[bestIndex];
      var gotoAngle = Math.atan2(bestChY, bestChX);
      if (gotoAngle - this.rot1 < -Math.PI) {
        gotoAngle += Math.PI*2;
      } else if (gotoAngle - this.rot1 > Math.PI) {
        gotoAngle -= Math.PI*2;
      }
      if (gotoAngle > this.rot1) {
        diffAngle = d*0.005;
      } else {
        diffAngle = -d*0.005;
      }
      this.rot1 += diffAngle;
      this.rot2 += diffAngle;
    }
    this.x += d*this.speed*Math.cos(this.rot1);
    this.y += d*this.speed*Math.sin(this.rot1);
    this.speed += this.acceleration*d;

    var ps = gameManager.player.size1;
    if (this.x < -ps || this.x > canvas.width+ps || this.y < -ps || this.y > canvas.height+ps) {
      this.isDead = true;
    }
  }

  this.draw = function() {
    ctx.strokeStyle = "rgb(0, 255, 0)";

    ctx.beginPath();
    var chX1 = Math.cos(this.rot1)*this.size;
    var chY1 = Math.sin(this.rot1)*this.size;
    var chX2 = Math.cos(this.rot2)*this.size;
    var chY2 = Math.sin(this.rot2)*this.size;
    ctx.lineTo(this.x-chX1+chY1, this.y-chY1-chX1);
    ctx.lineTo(this.x+chX2+chY2, this.y+chY2-chX2);
    ctx.lineTo(this.x-chX1-chY1, this.y-chY1+chX1);
    ctx.closePath();
    ctx.stroke();
  }

};

var Triangle = function(x, y) {
  this.isDead = false;
  gameManager.objs.push(this);
  gameManager.bads.push(this);
  this.x = x;
  this.y = y;
  this.rot1 = Math.random();
  this.rot2 = this.rot1+Math.PI/1.5;
  this.rot3 = this.rot2+Math.PI/1.5;
  this.speed = 0.00002;
  this.size = 0.01*diagonalCanvasSize;
  this.hp = this.maxHp = 5;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed * diagonalCanvasSize / dist;
  this.velY *= this.speed * diagonalCanvasSize / dist;
  this.redness = 0;
  this.sides = 3;

  this.resize = function(diffX, diffY) {
    this.size = 0.01*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = halfWidth-this.x;
    this.velY = halfHeight-this.y;
    var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
    this.velX *= this.speed * diagonalCanvasSize / dist;
    this.velY *= this.speed * diagonalCanvasSize / dist;
  }
  this.update = function(d) {
    var ps = -2*gameManager.player.size1;
    if (this.x < -ps || this.x > canvas.width+ps || this.y < -ps || this.y > canvas.height+ps) {
      this.x += this.velX*d*10;
      this.y += this.velY*d*10;
    } else {
      this.x += this.velX*d;
      this.y += this.velY*d;
    }
    var rotDiff = d*0.002;
    this.rot1 += rotDiff;
    this.rot2 += rotDiff;
    this.rot3 += rotDiff;

    this.redness *= 0.5;

    var chX = this.x-halfWidth;
    var chY = this.y-halfHeight;
    if (Math.sqrt(chX*chX+chY*chY) < this.size+gameManager.player.size2) {
      gameManager.player.isLost = true;
    }

    if (this.hp <= 0) {
      this.isDead = true;
    }
  }
  this.draw = function() {
    var actualRedness;
    var greenAndBlueness = 255*(1-this.redness);
    if (greenAndBlueness < 0) {
      actualRedness = 255+greenAndBlueness;
      greenAndBlueness = 0;
    } else {
      actualRedness = 255;
    }
    var yellowness = 255*(this.hp/this.maxHp);
    ctx.strokeStyle = 'rgb('+actualRedness+', '+Math.min(yellowness*2 ,greenAndBlueness)+', '+Math.min(yellowness, greenAndBlueness)+')';

    ctx.beginPath();
    var chX1 = Math.cos(this.rot1)*this.size;
    var chY1 = Math.sin(this.rot1)*this.size;
    var chX2 = Math.cos(this.rot2)*this.size;
    var chY2 = Math.sin(this.rot2)*this.size;
    var chX3 = Math.cos(this.rot3)*this.size;
    var chY3 = Math.sin(this.rot3)*this.size;
    ctx.lineTo(this.x+chX1+chY1, this.y+chY1-chX1);
    ctx.lineTo(this.x+chX2+chY2, this.y+chY2-chX2);
    ctx.lineTo(this.x+chX3+chY3, this.y+chY3-chX3);
    ctx.closePath();
    ctx.stroke();
  }
};

var Square = function(x, y) {
  this.isDead = false;
  gameManager.objs.push(this);
  gameManager.bads.push(this);
  this.x = x;
  this.y = y;
  this.rot1 = Math.random();
  this.rot2 = this.rot1+Math.PI;
  this.speed = 0.00001;////////////////
  this.size = 0.01*diagonalCanvasSize;
  this.hp = this.maxHp = 25;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed * diagonalCanvasSize / dist;
  this.velY *= this.speed * diagonalCanvasSize / dist;
  this.redness = 0;
  this.sides = 4;

  this.resize = function(diffX, diffY) {
    this.size = 0.01*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = halfWidth-this.x;
    this.velY = halfHeight-this.y;
    var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
    this.velX *= this.speed * diagonalCanvasSize / dist;
    this.velY *= this.speed * diagonalCanvasSize / dist;
  }
  this.update = function(d) {
    var ps = -2*gameManager.player.size1;
    if (this.x < -ps || this.x > canvas.width+ps || this.y < -ps || this.y > canvas.height+ps) {
      this.x += this.velX*d*10;
      this.y += this.velY*d*10;
    } else {
      this.x += this.velX*d;
      this.y += this.velY*d;
    }
    var rotDiff = d*0.0015;
    this.rot1 += rotDiff;
    this.rot2 += rotDiff;

    var chX = this.x-halfWidth;
    var chY = this.y-halfHeight;
    if (Math.sqrt(chX*chX+chY*chY) < this.size+gameManager.player.size2) {
      gameManager.player.isLost = true;
    }

    this.redness *= 0.5;

    if (this.hp <= 0) {
      this.isDead = true;
    }
  }
  this.draw = function() {
    var actualRedness;
    var greenAndBlueness = 255*(1-this.redness);
    if (greenAndBlueness < 0) {
      actualRedness = 255+greenAndBlueness;
      greenAndBlueness = 0;
    } else {
      actualRedness = 255;
    }
    var yellowness = 255*(this.hp/this.maxHp);
    ctx.strokeStyle = 'rgb('+actualRedness+', '+Math.min(yellowness*2 ,greenAndBlueness)+', '+Math.min(yellowness, greenAndBlueness)+')';

    ctx.beginPath();
    var chX1 = Math.cos(this.rot1)*this.size;
    var chY1 = Math.sin(this.rot1)*this.size;
    var chX2 = Math.cos(this.rot2)*this.size;
    var chY2 = Math.sin(this.rot2)*this.size;
    ctx.lineTo(this.x+chX1+chY1, this.y+chY1-chX1);
    ctx.lineTo(this.x+chX1-chY1, this.y+chY1+chX1);
    ctx.lineTo(this.x+chX2+chY2, this.y+chY2-chX2);
    ctx.lineTo(this.x+chX2-chY2, this.y+chY2+chX2);
    ctx.closePath();
    ctx.stroke();
  }
};

var Pentagon = function(x, y) {
  this.isDead = false;
  gameManager.objs.push(this);
  gameManager.bads.push(this);
  this.x = x;
  this.y = y;
  this.rot1 = Math.random();
  this.rot2 = this.rot1+Math.PI*0.4;
  this.rot3 = this.rot2+Math.PI*0.4;
  this.rot4 = this.rot3+Math.PI*0.4;
  this.rot5 = this.rot4+Math.PI*0.4;
  this.speed = 0.000005;
  this.size = 0.013*diagonalCanvasSize;
  this.hp = this.maxHp = 125;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed * diagonalCanvasSize / dist;
  this.velY *= this.speed * diagonalCanvasSize / dist;
  this.redness = 0;
  this.sides = 5;

  this.resize = function(diffX, diffY) {
    this.size = 0.013*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = halfWidth-this.x;
    this.velY = halfHeight-this.y;
    var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
    this.velX *= this.speed * diagonalCanvasSize / dist;
    this.velY *= this.speed * diagonalCanvasSize / dist;
  }
  this.update = function(d) {
    var ps = -2*gameManager.player.size1;
    if (this.x < -ps || this.x > canvas.width+ps || this.y < -ps || this.y > canvas.height+ps) {
      this.x += this.velX*d*10;
      this.y += this.velY*d*10;
    } else {
      this.x += this.velX*d;
      this.y += this.velY*d;
    }
    var rotDiff = d*0.0005;
    this.rot1 += rotDiff;
    this.rot2 += rotDiff;
    this.rot3 += rotDiff;
    this.rot4 += rotDiff;
    this.rot5 += rotDiff;

    if (this.redness > 1) {
      this.redness = 1;
    } else if (this.redness === 1) {
      this.redness = 0.9;
    } else if (this.redness === 0.9) {
      this.redness = 0;
    }

    var chX = this.x-halfWidth;
    var chY = this.y-halfHeight;
    if (Math.sqrt(chX*chX+chY*chY) < this.size+gameManager.player.size2) {
      gameManager.player.isLost = true;
    }

    if (this.hp <= 0) {
      this.isDead = true;
    }
  }
  this.draw = function() {
    var actualRedness;
    var greenAndBlueness = 255*(1-this.redness);
    if (greenAndBlueness < 0) {
      actualRedness = 255+greenAndBlueness;
      greenAndBlueness = 0;
    } else {
      actualRedness = 255;
    }
    var yellowness = 255*(this.hp/this.maxHp);
    ctx.strokeStyle = 'rgb('+actualRedness+', '+Math.min(yellowness*2 ,greenAndBlueness)+', '+Math.min(yellowness, greenAndBlueness)+')';

    ctx.beginPath();
    var chX1 = Math.cos(this.rot1)*this.size;
    var chY1 = Math.sin(this.rot1)*this.size;
    var chX2 = Math.cos(this.rot2)*this.size;
    var chY2 = Math.sin(this.rot2)*this.size;
    var chX3 = Math.cos(this.rot3)*this.size;
    var chY3 = Math.sin(this.rot3)*this.size;
    var chX4 = Math.cos(this.rot4)*this.size;
    var chY4 = Math.sin(this.rot4)*this.size;
    var chX5 = Math.cos(this.rot5)*this.size;
    var chY5 = Math.sin(this.rot5)*this.size;
    ctx.lineTo(this.x+chX1+chY1, this.y+chY1-chX1);
    ctx.lineTo(this.x+chX2+chY2, this.y+chY2-chX2);
    ctx.lineTo(this.x+chX3+chY3, this.y+chY3-chX3);
    ctx.lineTo(this.x+chX4+chY4, this.y+chY4-chX4);
    ctx.lineTo(this.x+chX5+chY5, this.y+chY5-chX5);
    ctx.closePath();
    ctx.stroke();
  }
};

var Hexagon = function(x, y) {
  this.isDead = false;
  gameManager.objs.push(this);
  gameManager.bads.push(this);
  this.x = x;
  this.y = y;
  this.rot1 = Math.random();
  this.rot2 = this.rot1+Math.PI*2/3;
  this.rot3 = this.rot2+Math.PI*2/3;
  this.speed = 0.000005;
  this.size = 0.015*diagonalCanvasSize;
  this.hp = this.maxHp = 625;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed * diagonalCanvasSize / dist;
  this.velY *= this.speed * diagonalCanvasSize / dist;
  this.greenness = 0;
  this.redness = 0;
  this.sides = 6;
  this.uniqueRotSpeed = 0.0004+Math.random()*0.0001;

  this.resize = function(diffX, diffY) {
    this.size = 0.015*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = halfWidth-this.x;
    this.velY = halfHeight-this.y;
    var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
    this.velX *= this.speed * diagonalCanvasSize / dist;
    this.velY *= this.speed * diagonalCanvasSize / dist;
  }
  this.update = function(d) {
    var ps = -2*gameManager.player.size1;
    if (this.x < -ps || this.x > canvas.width+ps || this.y < -ps || this.y > canvas.height+ps) {
      this.x += this.velX*d*10;
      this.y += this.velY*d*10;
    } else {
      this.x += this.velX*d;
      this.y += this.velY*d;
    }
    var rotDiff = d*this.uniqueRotSpeed;
    this.rot1 += rotDiff;
    this.rot2 += rotDiff;
    this.rot3 += rotDiff;

    var chX = this.x-halfWidth;
    var chY = this.y-halfHeight;
    if (Math.sqrt(chX*chX+chY*chY) < this.size+gameManager.player.size2) {
      gameManager.player.isLost = true;
    }

    this.greenness *= 0.9;
    this.redness *= 0.5;

    if (this.hp <= 0) {
      this.isDead = true;
    }
  }
  this.draw = function() {
    if (this.greenness < 0.01 || this.redness > this.greenness) {
      var actualRedness;
      var greenAndBlueness = 255*(1-this.redness);
      if (greenAndBlueness < 0) {
        actualRedness = 255+greenAndBlueness;
        greenAndBlueness = 0;
      } else {
        actualRedness = 255;
      }
      var yellowness = 255*(this.hp/this.maxHp);
      ctx.strokeStyle = 'rgb('+actualRedness+', '+Math.min(yellowness*2, greenAndBlueness)+', '+Math.min(yellowness, greenAndBlueness)+')';
    } else {
      var nonGreen = 255*(1-this.greenness);
      ctx.strokeStyle = 'rgb('+nonGreen+', 255, '+nonGreen+')';

    }


    ctx.beginPath();
    var chX1 = Math.cos(this.rot1)*this.size;
    var chY1 = Math.sin(this.rot1)*this.size;
    var chX2 = Math.cos(this.rot2)*this.size;
    var chY2 = Math.sin(this.rot2)*this.size;
    var chX3 = Math.cos(this.rot3)*this.size;
    var chY3 = Math.sin(this.rot3)*this.size;
    ctx.lineTo(this.x+chX1+chY1, this.y+chY1-chX1);//1a
    ctx.lineTo(this.x-chX3-chY3, this.y-chY3+chX3);//3b
    ctx.lineTo(this.x+chX2+chY2, this.y+chY2-chX2);//2a
    ctx.lineTo(this.x-chX1-chY1, this.y-chY1+chX1);//1b
    ctx.lineTo(this.x+chX3+chY3, this.y+chY3-chX3);//3a
    ctx.lineTo(this.x-chX2-chY2, this.y-chY2+chX2);//2b
    ctx.closePath();
    ctx.stroke();
  }
};

var Player = function() {
  this.rot = 0;
  this.multiTouchIteration = 0;
  this.hasShotBefore = false;
  this.hasShotMissileBefore = false;
  this.isLost = false;
  this.bulletTimeout = this.bulletTimeoutReset = 20;
  this.missileTimeout = this.missileTimeoutReset = 2000;
  this.invalidTouchIndex = null;
  this.showMissileBox = false;
  this.showMissileRing = false;
  gameManager.objs.push(this);

  this.resize = function() {
    this.size1 = 20*diagonalCanvasSize*0.0005;
    this.size2 = this.size1*0.75;
    this.x = halfWidth;
    this.y = halfHeight;
  }
  this.resize();

  this.update = function(d) {

    if (this.bulletTimeout > 0) {
      this.bulletTimeout -= d;
    }
    if (this.missileTimeout > 0) {
      this.missileTimeout -= d;
    }

    this.showMissileBox = false;

    if (isTouchMode) {
      if (touchPosXs.length > 0) {
        if (this.bulletTimeout <= 0) {

          this.bulletTimeout += this.bulletTimeoutReset;
          if (++this.multiTouchIteration >= touchPosXs.length) {
            this.multiTouchIteration = 0;
          }
          if (this.multiTouchIteration === this.invalidTouchIndex) {
            if (++this.multiTouchIteration >= touchPosXs.length) {
              this.multiTouchIteration = 0;
            }
          }
          this.invalidTouchIndex = null;

          this.rot = Math.atan2(touchPosYs[this.multiTouchIteration]-this.y, touchPosXs[this.multiTouchIteration]-this.x);
          new Bullet(this.x, this.y, this.rot, false);
          this.hasShotBefore = true;
        }

        if (gameManager.factory.wave > 4) {
          this.showMissileBox = true;

          // Check if touch is inside box
          for (var i = 0; i < touchPosXs.length; i ++) {
            if (touchPosXs[i] >= canvas.width*0.69 && touchPosYs[i] > canvas.height*0.79) {
              this.invalidTouchIndex = i;
              if (this.missileTimeout <= 0) {
                this.hasShotMissileBefore = true;
                this.missileTimeout += this.missileTimeoutReset;
                new Missile(this.x, this.y, this.rot);
              }
              break;
            }
          }
        }
      }
    } else {
      this.rot = Math.atan2(mouseY-this.y, mouseX-this.x);
      if (leftIsPressed) {// Left mouse button
        if (this.bulletTimeout <= 0) {
          this.bulletTimeout += this.bulletTimeoutReset;
          new Bullet(this.x, this.y, this.rot, false);
          this.hasShotBefore = true;
        }
      }
      if (gameManager.factory.wave > 4) {
        var endAngle = 2*Math.PI*(1-this.missileTimeout/this.missileTimeoutReset);
        ctx.beginPath();
        ctx.strokeStyle = "rgb(0, 100, 0)"
        ctx.arc(this.x, this.y, this.size2*2, 0, endAngle);// Draw arc thingy under enemies
        ctx.stroke();
        if (rightIsPressedInstant && this.missileTimeout <= 0) {
          this.hasShotMissileBefore = true;
          this.missileTimeout += this.missileTimeoutReset;
          new Missile(this.x, this.y, this.rot);
        }
      }
    }


  }

  this.draw = function() {
    // Stroked triangle
    ctx.strokeStyle = 'rgba(10, 255, 0, 0.8)';
    ctx.beginPath();
    var chX = Math.cos(this.rot);
    var chY = Math.sin(this.rot);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+chX*this.size1, this.y+chY*this.size1);
    ctx.lineTo(this.x-chX*this.size2+chY*this.size1, this.y-chY*this.size2-chX*this.size1);
    ctx.closePath();

    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+chX*this.size1, this.y+chY*this.size1);
    ctx.lineTo(this.x-chX*this.size2-chY*this.size1, this.y-chY*this.size2+chX*this.size1);
    ctx.closePath();
    ctx.stroke();

    if (this.showMissileBox) {
      // Draw missile box
      ctx.strokeStyle = "rgb(0, 255, 0)";
      ctx.beginPath();
      ctx.lineTo(canvas.width*0.99, canvas.height*0.99);
      ctx.lineTo(canvas.width*0.69, canvas.height*0.99);
      ctx.lineTo(canvas.width*0.69, canvas.height*0.79);
      ctx.lineTo(canvas.width*0.99, canvas.height*0.79);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = "rgba(0, 255, 0, 0.25)";
      ctx.fillRect(canvas.width*0.69, canvas.height*0.79, canvas.width*0.3*(1-this.missileTimeout/this.missileTimeoutReset), canvas.height*0.2);

      // Draw missile box label
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.font = "Bold "+(canvas.width*0.065)+"px monospace";
      ctx.fillText("Missile", canvas.width*0.72, canvas.height*0.924);
    }
  }

  this.overlay = function() {

    if (this.isLost) {
      if (!isPaused) {
        isPaused = true;
        document.getElementById("overlay-content").style.display = "block";
        document.getElementById('wave-number').innerHTML = "Retry Wave "+gameManager.factory.waveNames[gameManager.factory.wave]+"."
        document.getElementById("fullscreen-button").style.display = "none";// Hide fullscreen button
      }
      canvas.style.webkitFilter = "blur(5px)";// Blur canvas
    } else {
      if (!this.hasShotBefore) {
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = (canvas.width/50)+"px monospace";
        ctx.fillText("Click / tap to shoot. Avoid Geometry.", canvas.width*0.05, canvas.height*0.97);
      } else if (!this.hasShotMissileBefore && gameManager.factory.wave > 4) {
        if (isTouchMode) {
          ctx.fillStyle = "rgb(255, 255, 255)";
          ctx.font = (canvas.width/50)+"px monospace";
          ctx.fillText("Fire missiles by tapping the Missile box.", canvas.width*0.05, canvas.height*0.97);
        } else {
          ctx.fillStyle = "rgb(255, 255, 255)";
          ctx.font = (canvas.width/50)+"px monospace";
          ctx.fillText("Right click to fire missiles.", canvas.width*0.05, canvas.height*0.97);
        }
      }
    }
  }
};

var Factory = function(d) {
  this.waveNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "Final", "{̴̧̡̣̭͈̥͖̙̝̀͌}̴̨̡̨̛̩̖̺͉̠͈̝̭̫͚̭̭̰̱͇͚͔̥̦̟̝̝͇̗̥͓͎͙̠͍̖͙̗̰̈́̅̈́̂̑́̾͗̏̅̂͆̑̽̃̌͋̆͝ͅͅ{̴̡̨̢̧̨̨̧̫̲̲͖̖̰̰̳̫͇̗͇͚̖̬̱̙͙̙̠̙̱̩̙͉͔͚̌͌̂̔̋̓͆̔̓̚͘̚͜ȩ̵̢͇̭̦̈́̾́͋͗͂̀̓̍̉͛͌̀͋̋̚̕͝m̷̢̡̧̛̛̠͚̪̖̦̮̹̖̩̝̹̹͓̖̝̪͑́̀̈́̐̂͆͆̾̓̑̊̿̂͊̐̎̿͋̂͂̍̏̂́̈̕̚͘̚͜͜͜͝p̶̛͎̥̠̟͖͒̿̐̒̔̐̄͑̆͋̅̂̎͌̒̅̓̽̾̀͒̅̓̃̂́͋̆͆̓̔́͝t̸̛̲̖͇͙͓͔̰̰̫͎̳̞̼̮͔͔͇̩̞̻̮̩̠̫̤̣͓̓̾̌̊̒̂̒̚ͅy̴̢̞̘͕̙̱̘̝̻̫̜̋̆͂̀̇͊͜}̸̡̨̺̼̙̰͍̼̺̟͎̲̣̲͓̠̝̻͈̟̣̰̯̻̈́̿͌̃͐̓̽̆́̾̔̐͗̄̈́̊̓̎̈͗̈̾̿̍̏̈́̊͗͗̓̚͘̚͘͜͝͝ͅ{̷̧̢̧͓͚̜͎͇̮͓̪͕̠̮̝̺͙̭̃͑̐͌̓̐̑}̵̛̥̙̹̥̼͖̝̭̱̬̫͎͔̰̳͍͔̲̹̽̿̀̂̿̌̊́͊̈́̑̀̃͊̒͌̋͆͋̑͒̀̑̇̾̄͛͛̉̕͝͝͝"];




  this.waves = [
    ["4"],
    ["4",1,"44",3,"44444"],
    ["444",6,"33333",5,"333333", 5, "444", 4, "343433333"],
    ["4",1,"4",1,"4",1,"4",1,"4",1,"4",1,"4",0.5,"4",0.5,"4",0.5,"4",0.5,"4",0.5,"4",0.5,"4",0.5,"4",0.5,"4",0.5,"4",3,"5"],
    ["3333333333",5,"3333333333",2.5,"4",2,"3333333333",4,"3333333333",4,"333333333",2,"333333333"],
    ["5555",4,"3333"],
    ["6"],
    ["33333", 0.5, "333333", 4, "66", 6, "33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"33333",0.5,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333",0.2,"3333333333"],

  ]


  this.wave = 0;
  this.phase = 0;
  this.waveTextTimeout = this.waveTextReset = 1000;
  this.phaseTimeout = 1;
  this.isWon = false;
  this.isReadyForNextPhase = false;

  this.update = function(d) {

    if (!this.isWon) {
      var myWave = this.waves[this.wave];

      this.phaseTimeout -= d/1000;
      if (this.phaseTimeout < 0) {// If the next phase should go

        // Decide to switch to next wave
        if (this.isReadyForNextPhase) {// If run out of phases
          if (gameManager.bads.length === 0) {
            this.isReadyForNextPhase = false;
            this.wave ++;
            if (this.wave >= this.waves.length) {
              this.isWon = true;
            } else {
              this.phase = 0;
              this.waveTextTimeout = this.waveTextReset;
            }
          }

        } else {

          for (var i = 0; i < myWave[this.phase].length; i ++) {

            var randomAngle = Math.random()*Math.PI*2;
            var newX = halfWidth+diagonalCanvasSize*Math.cos(randomAngle)/2;
            var newY = halfHeight+diagonalCanvasSize*Math.sin(randomAngle)/2;
            switch (myWave[this.phase].charAt(i)) {

              case "3":
              new Triangle(newX, newY);
              break;
              case "4":
              new Square(newX, newY);
              break;
              case "5":
              new Pentagon(newX, newY);
              break;
              case "6":
              new Hexagon(newX, newY);
              break;

            }
          }
          this.phaseTimeout = myWave[this.phase+1];// Set next phase timeout
          this.phase += 2;
          if (this.phase > myWave.length) {
            this.phaseTimeout = -1;
            this.isReadyForNextPhase = true;
          }
        }
      }

      if (this.waveTextTimeout > 0) {
        // Wave text logic
        this.waveTextTimeout -= d;
      }
    }

  }
  this.draw = function() {
    // Wave text

    if (this.isWon) {
      ctx.font = (canvas.width/5)+"px Verdana";
      // Create gradient
      var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop("0", "magenta");
      gradient.addColorStop("0.54", "blue");
      gradient.addColorStop("1.0", "red");
      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fillText("Winner.", canvas.width*0.028, canvas.height*0.59);
    } else {
      if (this.waveTextTimeout > 0) {
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = "Italic "+(canvas.width/10)+"px verdana";
        ctx.fillText("W a v e", (halfWidth) - canvas.width*0.21, (halfHeight) - canvas.width/24);
        ctx.fillText(this.waveNames[this.wave], (halfWidth) - canvas.width*0.032, (halfHeight) + canvas.width/11);
      }
    }
  }
};

var GameManager = function() {
  this.frameCount = 0;
  this._lastTimestamp = Date.now();
  this.objs = [];
  this.bads = [];
  this.init = function() {
    this.player = new Player();
    this.factory = new Factory();
  };
  this.resize = function(diffX, diffY) {
    /* Resize game objects */
    for (var i = this.objs.length-1; i >= 0; i--) {
      this.objs[i].resize(diffX, diffY);
    }
  }
  this.onKeyDown = function(evt) {
    if (evt.key === "p") {
      if (!this.player.isLost) {
        isPaused = !isPaused;
      }
    }



    if (evt.key === "n"){
      gameManager.factory.phase = 0;
      gameManager.factory.wave ++;
      gameManager.bads = [];// Clear enemies
      gameManager.objs = [gameManager.player];// Clear enemies/bullets
      gameManager.factory.waveTextTimeout = gameManager.factory.waveTextReset;
    }
  };
  this.update = function() {

    /* Clock */
    var timestamp = Date.now();
    var delta = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;

    /* Background */
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isPaused) {
      if (this.player.isLost) {// If overlay buttons are displaying
        // Defeat text is now in HTML
      } else {// Normal pause mode
        ctx.font ="Bold "+(canvas.width/15)+"px monospace";
        var value = 66+66*Math.sin(timestamp/500);
        ctx.fillStyle = "rgb("+value+", "+value+", "+value+")";
        ctx.fillText("Paused", canvas.width*0.4, canvas.height*0.48);
      }
    } else {

      /* Factory */
      this.factory.update(delta);

      /* Update game objects */
      for (var i = this.objs.length-1; i >= 0; i--) {
        var obj = this.objs[i];
        obj.update(delta);
        if (obj.isDead) {
          this.objs.splice(i, 1);
        }
      }

      /* Remove enemies */
      for (var i = this.bads.length-1; i >= 0; i--) {
        if (this.bads[i].isDead) {
          new DecayLines(this.bads[i]);
          this.bads.splice(i, 1);
        }
      }
    }

    /* Draw game objects */
    for (var i = this.objs.length-1; i >= 0; i--) {
      this.objs[i].draw();
    }
    ctx.stroke();

    this.player.overlay();

    this.factory.draw();

    /* Reset mouse press */
    leftIsPressedInstant = false;
    rightIsPressedInstant = false;

    /* Increase frame number */
    this.frameCount ++;
  };
};
