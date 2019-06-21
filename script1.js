//// TODO:
// Add missiles
// Spawn triangles/squares/shooters
// Remember, goals + explosions
// Add "weld" animation when you hit enemies
// Add decay animation from DecayLine objects generated by passing the object
//
//
//
//
//13



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
    this.phase = 0;
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

var Bullet = function(x, y, rot) {
  this.isDead = false;
  gameManager.objs.push(this);
  this.x = x;
  this.y = y;
  this.chX = Math.cos(rot);
  this.chY = Math.sin(rot);
  this.length = 11*diagonalCanvasSize*0.001;
  this.x2 = this.x + this.chX * this.length;
  this.y2 = this.y + this.chY * this.length;
  this.speed = 1*diagonalCanvasSize*0.001;

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
      if (dist < 0.015*diagonalCanvasSize) {
        bad.hp --;
        if (bad.redness < 0.5) {
          bad.redness = 3;
        }
        this.isDead = true;
        break;
      }
    }

    var ps = gameManager.player.size1;
    if (this.x2 < -ps || this.x2 > canvas.width+ps || this.y2 < -ps || this.y2 > canvas.height+ps) {
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
  this.speed = 0.00002;
  this.size = 0.01*diagonalCanvasSize;
  this.hp = this.maxHp = 5;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed * diagonalCanvasSize / dist;
  this.velY *= this.speed * diagonalCanvasSize / dist;
  this.redness = 0;

  this.resize = function(diffX, diffY) {
    this.size = 0.01*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = canvas.width/2-this.x;
    this.velY = canvas.height/2-this.y;
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

    var chX = this.x-canvas.width/2;
    var chY = this.y-canvas.height/2;
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
  this.speed = 0.00001;
  this.size = 0.01*diagonalCanvasSize;
  this.hp = this.maxHp = 25;
  this.velX = gameManager.player.x-this.x;
  this.velY = gameManager.player.y-this.y;
  var dist = Math.sqrt(this.velX*this.velX+this.velY*this.velY);
  this.velX *= this.speed * diagonalCanvasSize / dist;
  this.velY *= this.speed * diagonalCanvasSize / dist;
  this.redness = 0;

  this.resize = function(diffX, diffY) {
    this.size = 0.01*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = canvas.width/2-this.x;
    this.velY = canvas.height/2-this.y;
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

    var chX = this.x-canvas.width/2;
    var chY = this.y-canvas.height/2;
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

  this.resize = function(diffX, diffY) {
    this.size = 0.013*diagonalCanvasSize;
    this.x = canvas.width*this.x/(canvas.width-diffX*4);
    this.y = canvas.height*this.y/(canvas.height-diffY*4);
    this.velX = canvas.width/2-this.x;
    this.velY = canvas.height/2-this.y;
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

    var chX = this.x-canvas.width/2;
    var chY = this.y-canvas.height/2;
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

var Player = function() {
  this.rot = 0;
  this.multiTouchIteration = 0;
  this.hasShotBefore = false;
  this.hasShotMissileBefore = false;
  this.isLost = false;
  gameManager.objs.push(this);

  this.resize = function() {
    this.size1 = 20*diagonalCanvasSize*0.0005;
    this.size2 = this.size1*0.75;
    this.x = canvas.width/2;
    this.y = canvas.height/2;
  }
  this.resize();

  this.update = function(d) {

    if (isTouchMode) {
      if (touchPosXs.length > 0) {
        if (++this.multiTouchIteration >= touchPosXs.length) {
          this.multiTouchIteration = 0;
        }
        this.rot = Math.atan2(touchPosYs[this.multiTouchIteration]-this.y, touchPosXs[this.multiTouchIteration]-this.x);
        new Bullet(this.x, this.y, this.rot);
        this.hasShotBefore = true;
      }
    } else {
      this.rot = Math.atan2(mouseY-this.y, mouseX-this.x);
      if (leftIsPressed) {// Left mouse button
        new Bullet(this.x, this.y, this.rot);
        this.hasShotBefore = true;
      }
      if (rightIsPressedInstant && gameManager.factory.wave > 5) {
        this.hasShotMissileBefore = true;
        console.log('shoot missile');
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
        ctx.fillText("Click to shoot. Avoid Geometry.", canvas.width*0.05, canvas.height*0.97);
      } else if (!this.hasShotMissileBefore && gameManager.factory.wave > 5) {
        if (isTouchMode) {
          ctx.fillStyle = "rgb(255, 255, 255)";
          ctx.font = (canvas.width/50)+"px monospace";
          ctx.fillText("Nuke nearby Geometry with missile button.", canvas.width*0.05, canvas.height*0.97);
        } else {
          ctx.fillStyle = "rgb(255, 255, 255)";
          ctx.font = (canvas.width/50)+"px monospace";
          ctx.fillText("Right click to nuke nearby Geometry.", canvas.width*0.05, canvas.height*0.97);
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
    ["555555"]


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
            var newX = canvas.width/2+diagonalCanvasSize*Math.cos(randomAngle)/2;
            var newY = canvas.height/2+diagonalCanvasSize*Math.sin(randomAngle)/2;
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
      ctx.fillText("Goodbye.", canvas.width*0.025, canvas.height*0.59);
    } else {
      if (this.waveTextTimeout > 0) {
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = "Italic "+(canvas.width/10)+"px verdana";
        ctx.fillText("W a v e", (canvas.width / 2) - canvas.width*0.21, (canvas.height / 2) - canvas.width/24);
        ctx.fillText(this.waveNames[this.wave], (canvas.width / 2) - canvas.width*0.032, (canvas.height / 2) + canvas.width/11);
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
        ctx.font ="Bold "+(canvas.width/15)+"px monospace";
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.fillText("Defeat", canvas.width*0.4, canvas.height*0.05);
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
