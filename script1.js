
// Variables
var pageIsLoaded = false;
var isFullScreen = false;
var ctx;
var fullscreenEnterTimestamp;
var mouseX = 0;
var mouseY = 0;
var canvas;
var gameManager;
var leftIsPressed = false;
var leftIsPressedInstant = false;
var rightIsPressed = false;
var rightIsPressedInstant = false;

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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gameManager.resize(resizeDifferenceX, resizeDifferenceY);
}


ctx.fillStyle = "blue";
ctx.fillRect(0, 0, canvas.width, canvas.height);

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
document.addEventListener('mousedown', function(evt) {
  mouseButton = evt.button || evt.which;
  if (mouseButton === 1) {
    leftIsPressed = true;
    leftIsPressedInstant = true;
  } else {
    rightIsPressed = true;
    rightIsPressedInstant = true;
  }

});
document.addEventListener('mouseup', function(evt) {
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
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousedown", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchend", function (e) {
  var mouseEvent = new MouseEvent("mouseup", {});
  canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchmove", function (e) {
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousemove", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
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
  return {
    x: (touchEvent.touches[0].clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (touchEvent.touches[0].clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}
function draw(e) {
  var pos = getMousePos(canvas, e);
  mouseX = pos.x;
  mouseY = pos.y;
}

/** Game "objects" **/

var Bullet = function(x, y, rot) {
  this.isDead = false;
  gameManager.objs.push(this);
  this.x = x;
  this.y = y;
  this.chX = Math.cos(rot);
  this.chY = Math.sin(rot);
  this.length = 11;
  this.x2 = this.x + this.chX * this.length;
  this.y2 = this.y + this.chY * this.length;
  this.speed = 1;
  this.timeLeft = 1000;

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

    for (var i = 0; i < gameManager.bads.length; i++) {
      var bad = gameManager.bads[i];
      var chX = bad.x-this.x;
      var chY = bad.y-this.y;
      var dist = Math.sqrt(chX*chX+chY*chY);
      if (dist < 10) {
        bad.hp --;
        if (bad.redness < 0.5) {
          bad.redness = 3;
        }
        this.isDead = true;
        break;
      }
    }

    this.timeLeft -= d;
    if (this.timeLeft <= 0) {
      this.isDead = true;
    }
  }
  this.draw = function() {
    ctx.strokeStyle = 'rgb(255, 255, 255)';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x2, this.y2);
    ctx.closePath();
    ctx.stroke();
  }
};

var Missile = function() {};

var Triangle = function(x, y) {
  this.isDead = false;
  gameManager.objs.push(this);
  gameManager.bads.push(this);
  this.x = x;
  this.y = y;
  this.rot1 = Math.random();
  this.rot2 = this.rot1+Math.PI/1.5;
  this.rot3 = this.rot2+Math.PI/1.5;
  this.speed = 0.01;
  this.size = 10;
  this.hp = 5;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed / dist;
  this.velY *= this.speed / dist;
  this.redness = 0;

  this.resize = function(diffX, diffY) {
    this.x += diffX;
    this.y += diffY;
  }
  this.update = function(d) {
    this.x += this.velX*d;
    this.y += this.velY*d;
    var rotDiff = d*0.002;
    this.rot1 += rotDiff;
    this.rot2 += rotDiff;
    this.rot3 += rotDiff;

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
    ctx.strokeStyle = 'rgb('+actualRedness+', '+greenAndBlueness+', '+greenAndBlueness+')';
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

var Player = function() {
  this.rot = 0;
  gameManager.objs.push(this);

  this.resize = function() {
    this.x = canvas.width/2;
    this.y = canvas.height/2;
  }
  this.resize();

  this.update = function(d) {
    this.rot = Math.atan2(mouseY-this.y, mouseX-this.x);
    if (leftIsPressed) {// Left mouse button
      new Bullet(this.x, this.y, this.rot);
    }
    if (rightIsPressedInstant) {
      console.log('oh yeah');
    }
  }

  this.draw = function() {
    // Stroked triangle
    ctx.strokeStyle = 'rgba(10, 255, 0, 0.8)';
    ctx.beginPath();
    var chX = Math.cos(this.rot);
    var chY = Math.sin(this.rot);
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+chX*20, this.y+chY*20);
    ctx.lineTo(this.x-chX*15+chY*20, this.y-chY*15-chX*20);
    ctx.closePath();

    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x+chX*20, this.y+chY*20);
    ctx.lineTo(this.x-chX*15-chY*20, this.y-chY*15+chX*20);
    ctx.closePath();
  }
};

var GameManager = function() {
  this.frameCount = 0;
  this._lastTimestamp = Date.now();
  this.objs = [];
  this.bads = [];
  this.init = function() {
    this.player = new Player();
  };
  this.resize = function(diffX, diffY) {
    /* Resize game objects */
    for (var i = this.objs.length-1; i >= 0; i--) {
      this.objs[i].resize(diffX, diffY);
    }
  }
  this.onKeyDown = function(evt) {
    console.log(evt);
  };
  this.update = function() {

    /* Clock */
    var timestamp = Date.now();
    var delta = timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;



    /* Create more game objects
    if (Math.random() < 0.01) {
    console.log('hey');
    new Triangle(1, Math.random()*100);
  }
  */
  if (rightIsPressedInstant) new Triangle(mouseX, mouseY);

  /* Background */
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* Update game objects */
  for (var i = this.objs.length-1; i >= 0; i--) {
    var obj = this.objs[i];
    obj.update(delta);
    if (obj.isDead) {
      this.objs.splice(i, 1);
    }
  }

  /* Draw game objects */
  for (var i = this.objs.length-1; i >= 0; i--) {
    this.objs[i].draw();
  }
  ctx.stroke();





  /* Remove enemies */
  for (var i = this.bads.length-1; i >= 0; i--) {
    if (this.bads[i].isDead) {
      this.bads.splice(i, 1);
    }
  }

  /* Reset mouse press */
  leftIsPressedInstant = false;
  rightIsPressedInstant = false;

  /* Increase frame number */
  this.frameCount ++;


  /*
  ctx.fillStyle = "blue";
  ctx.font = "bold 16px Arial";
  ctx.fillText("Lava", (canvas.width / 2) - 17, (canvas.height / 2) + 8);
  */



};

};
