
// Variables
var pageIsLoaded = false;
var isFullScreen = false;
var ctx;

// Make Math more useful
if (!("hypot" in Math)) {  // Polyfill
  Math.hypot = function(x, y) {
    return Math.sqrt(x * x + y * y);
  };
}

function pageLoaded() {
  /* Define canvas */
  canvas = document.getElementById("can");
  ctx = canvas.getContext("2d");

  /* Config resizable canvas */
  function resizeCanvas() {
    if (isFullScreen && canvas.height > window.innerHeight) {// if fullscreen and canvas is getting smaller
      isFullScreen = false;
      document.getElementById("fullscreen-button").style.display = "";
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log(canvas.height , window.innerHeight);

  }
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas();

  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- Set up gameManager
  var gameManager = new GameManager();
  gameManager.init();

  var metaUpdate = function () {
    gameManager.update();
    window.requestAnimationFrame(metaUpdate);
  }
  window.requestAnimationFrame(metaUpdate);

  // ---

  /* Update flag */
  pageIsLoaded = true;
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
}


//--- Game functions

document.addEventListener('keydown', function(event) {
    gameManager.onKeyDown(event);
});

var GameManager = function() {
  this._lastTimestamp = Date.now();
  this.init = function() {

  };
  this.onKeyDown = function(evt) {
    console.log(evt);
  };
  this.update = function() {

    // Clock
    var timestamp = Date.now();
    var delta = timestamp - (this._lastTimestamp || timestamp);

    // Check fullscreen status
    if (isFullScreen && (screen.height !== window.outerHeight)) {// if in fullscreen mode and not fullscreen
    ///  document.getElementById("fullscreen-button").style.display = "block";
    }



    /*
  for(var i = 0, len = this.elements.length; i < len; ++i) {
    this.elements[i].update(delta);
  }
  */
  var redCol = Math.floor(Math.random()*40);
  ctx.fillStyle = "rgb("+redCol+", 0, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "blue";
  ctx.font = "bold 16px Arial";
  ctx.fillText("Lava", (canvas.width / 2) - 17, (canvas.height / 2) + 8);

  this._lastTimestamp = timestamp;


};

}
