// markers
var marker0 = getMarker(0); //depth1
var marker1 = getMarker(1); //depth2
var marker2 = getMarker(2); //depth3
var marker3 = getMarker(3); //depth4
var marker4 = getMarker(4); //AED1
var marker5 = getMarker(5); //AED2
var marker6 = getMarker(6); //ventilation
var marker7 = getMarker(7); //headTilt

// timer vars
var click1 = 0;
var click2 = 0;

let timer = 10;
let miliTimer = 12000;
let timerId;

var countDetect = document.getElementById("count1");
var countCpm = document.getElementById("count2");

//CPR sequence vars
var gradeState = "compress"
var studentScore = 0

// compression vars
var depth = 0;
var recoil = true;

var depth2 = 0;
var up = false;
var up2 = false;

compressValue = 0;

// vent vars


//lists
var compressionDepthData = []; //detect 0,3, 5 or 7cm
var compressionCountData = [];
var cpmData = []; // 100-120cpm
var ventVolData = [];
var ventCountData = [];
var ventSpeedData = []; // 1sec rise
var timerData = [];


//login screen button
document.getElementById("loginBtn").onclick = function() {
  document.getElementById("loginScreen").style.display = "none";
}

//timer has to be global
decreaseTimer();

//functions
function setup() {
  // code written in here will be executed once when the page loads
  setupAppCanvas();
}

function setupAppCanvas() {
  canvas = document.querySelector("#app-canvas");
  dpr = window.devicePixelRatio || 1;

  appWidth = window.innerWidth * dpr;
  appHeight = window.innerHeight * dpr;
  console.log("appWidth =", appWidth, " appHeight =", appHeight);

  canvas.width = appWidth;
  canvas.height = appHeight;

  ctx = canvas.getContext("2d");
}

function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000);
    timer--;
    document.getElementById("timer").innerHTML = "Time:  " + timer;
  } else if (timer === 0) {
    const chartCtx = document.getElementById("app-canvas");
    const myChart = new Chart(chartCtx, {
      type: "line",
      data: {
        labels: timerData,
        datasets: [
          {
            label: "Compression Depth",
            data: compressionDepthData,
            backgroundColor: ["rgba(75, 192, 192, 0.2)"],
            borderColor: ["rgba(75, 192, 192, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}

// compression functions
function compressionDepth() {
  if (marker0.present) {
    depth = 0;
    recoil = true;
    compressionMove();
  } else if (marker1.present && recoil) {
    depth = -3;
    recoil = false;
    compressionMove();
  } else if (marker1.present && !recoil) {
    depth = -3;
    recoil = false;
    compressionMove();
  } else if (marker2.present && recoil) {
    depth = -5;
    recoil = false;
    compressionMove();
  } else if (marker2.present && !recoil) {
    depth = -5;
    recoil = false;
    compressionMove();
  } else if (!marker3.present) {
    depth = -7;
    recoil = false;
    compressionMove();
  }
}

function compressionMove() {
  compressionDepthData.push(depth);
  timerData.push(timer);
  console.log(depth);
  if (depth > depth2) {
    up = false;
    countCompressions();
    up2 = up;
  } else if (depth < depth2) {
    up = true;
    countCompressions();
    up2 = up;
  }
  depth2 = depth;
}

function countCompressions() {
  if (up && !up2) {
    compressValue++;
    countDetect.innerHTML = compressValue;
    calculateCpm();
  }
}

function calculateCpm() {
  var seconds = new Date().getTime();

  click2 = (1 / ((seconds - click1) / 1000)) * 60;
  click1 = seconds;
  compressionCountData.push(compressValue);
  cpmData.push(Math.floor(click2));
  timerData.push(timer);
  countCpm.innerHTML = Math.floor(click2);
}

// ventilation functions
function countVent(){
  if (marker6.present){
    print('ventCount')
  }
}

function headTilt(){
  if (marker7.present){
    print('headTilt')
  }
}

// AED functions
function runAed(){
  if (timer > 0){
    print('run AED')
  }
}


// grading functions
function grade() {}

function calculateScore() {}

// update function
function update() {
  compressionDepth();
}

// setupAppCanvas() function will initialize #app-canvas.
// if you intend to use #app-canvas, call this function in setup()

var canvas;
var ctx;
var dpr;
var appWidth;
var appHeight;
