// markers
var comMarker0 = getMarker(256); //depth0
var comMarker1 = getMarker(336); //depth1
var comMarker2 = getMarker(272); //depth2
var comMarker3 = getMarker(0); //depth3
var ventMarker0 = getMarker(320); //vent0
var ventMarker1 = getMarker(64); //vent1
var ventMarker2 = getMarker(80); //vent2
var aedMarker0 = getMarker(512); //AED1
var aedMmarker1 = getMarker(768); //AED2

// timer vars
var click1 = 0;
var click2 = 0;

let timer = 120;
let miliTimer = 12000;
let timerId;

var countDetect = document.getElementById("countCom");
var countCpm = document.getElementById("countCpm");

//CPR sequence vars
var gradeState = "compress"
var studentScore = 0

// compression vars
var depth = 0;
var depth2 = 0;
var recoil = true;
var up = false;
var up2 = false;

var compressValue = 0;

// vent vars
var vol = 0;
var vol2 = 0;
var rise = false;
var rise2 = false;

var ventValue = 0;

// AED vars
var aed1 = false
var aed2 = false

//lists
var compressionDepthData = []; //detect 0,3, 5 or 7cm
var compressionCountData = [];
var cpmData = []; // 100-120cpm
var vpmData = []; // 60cpm
var ventVolData = []; // detect 0,5,7 state
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
  }else if (timer === 0) {
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
  if (comMarker0.present) {
    depth = 0;
    recoil = true;
    compressionMove();
  } else if (comMarker1.present && recoil) {
    depth = -3;
    recoil = false;
    compressionMove();
  } else if (comMarker1.present && !recoil) {
    depth = -3;
    recoil = false;
    compressionMove();
  } else if (comMarker2.present && recoil) {
    depth = -5;
    recoil = false;
    compressionMove();
  } else if (comMarker2.present && !recoil) {
    depth = -5;
    recoil = false;
    compressionMove();
  } else if (comMarker3.present) {
    depth = -7;
    recoil = false;
    compressionMove();
  }
}

function compressionMove() {
  switch(depth){
    case 0:
      document.getElementById("depthShallow").style.backgroundColor = "lightgrey";
      document.getElementById("depthRight").style.backgroundColor = "lightgrey";
      document.getElementById("depthDeep").style.backgroundColor = "lightgrey";
      document.getElementById("manikinDrawing").src= "img/manikin_orig.png";
      break;
    case -3:
      document.getElementById("depthShallow").style.backgroundColor = "lightblue";
      document.getElementById("depthRight").style.backgroundColor = "lightgrey";
      document.getElementById("depthDeep").style.backgroundColor = "lightgrey";
      document.getElementById("manikinDrawing").src= "img/manikin_com.png";
      break;
    case -5:
      document.getElementById("depthShallow").style.backgroundColor = "lightgrey";
      document.getElementById("depthRight").style.backgroundColor = " rgb(59, 241, 18)";
      document.getElementById("depthDeep").style.backgroundColor = "lightgrey";
      document.getElementById("manikinDrawing").src= "img/manikin_com.png";
      break;
     case -7:
      document.getElementById("depthShallow").style.backgroundColor = "lightgrey";
      document.getElementById("depthRight").style.backgroundColor = "lightgrey";
      document.getElementById("depthDeep").style.backgroundColor = "red";
      document.getElementById("manikinDrawing").src= "img/manikin_com.png";
      break;
  }
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
    document.getElementById("cprState").innerHTML= "Compressions";
    document.getElementById("volumeCol").style= "none";
    document.getElementById("depthCol").style= "block";
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
  console.log(Math.floor(click2));
  switch(true){
    case (click2 < 100):
      document.getElementById("Slow").style.backgroundColor = "lightblue";
      document.getElementById("Right").style.backgroundColor = "lightgrey";
      document.getElementById("Fast").style.backgroundColor = "lightgrey";
      break;
    case (click2 >= 100 && click2 <= 120):
      document.getElementById("Slow").style.backgroundColor = "lightgrey";
      document.getElementById("Right").style.backgroundColor = " rgb(59, 241, 18)";
      document.getElementById("Fast").style.backgroundColor = "lightgrey";
      break;
     case (click2 > 120):
      document.getElementById("Slow").style.backgroundColor = "lightgrey";
      document.getElementById("Right").style.backgroundColor = "lightgrey";
      document.getElementById("Fast").style.backgroundColor = "red";
      break;
  }
  // countCpm.innerHTML = Math.floor(click2);
}

// ventilation functions
function ventVol() {
  if (ventMarker0.present) {
    vol = 0;
    ventMove();
  } else if (ventMarker1.present) {
    vol = 5;
    ventMove();
  } else if (ventMarker2.present) {
    vol = 7;
    ventMove();
  }
}

function ventMove() {
  switch(vol){
    case 0:
      document.getElementById("volLittle").style.backgroundColor = "lightgrey";
      document.getElementById("volRight").style.backgroundColor = "lightgrey";
      document.getElementById("volMuch").style.backgroundColor = "lightgrey";
      document.getElementById("manikinDrawing").src= "img/manikin_orig.png";
      break;
    case 5:
      document.getElementById("volLittle").style.backgroundColor = "lightblue";
      document.getElementById("volRight").style.backgroundColor = "lightgrey";
      document.getElementById("volMuch").style.backgroundColor = "lightgrey";
      document.getElementById("manikinDrawing").src= "img/manikin_com.png";
      break;
    case 7:
      document.getElementById("volLittle").style.backgroundColor = "lightgrey";
      document.getElementById("volRight").style.backgroundColor = " rgb(59, 241, 18)";
      document.getElementById("volMuch").style.backgroundColor = "lightgrey";
      document.getElementById("manikinDrawing").src= "img/manikin_com.png";
      break;
  }
  ventVolData.push(vol);
  timerData.push(timer);
  console.log(vol);
  if (vol > vol2) {
    rise = false;
    countVent();
    rise2 = rise;
  } else if (vol < vol2) {
    rise = true;
    countVent();
    rise2 = rise;
  }
  vol2 = vol;
}

function countVent() {
  if (rise && !rise2) {
    ventValue++;

    countDetect.innerHTML = ventValue;
    document.getElementById("cprState").innerHTML= "Ventilations";
    document.getElementById("depthCol").style.display= "none";
    document.getElementById("volumeCol").style.display= "block";
    calculateVpm();
  }
}

function calculateVpm() {
  var seconds = new Date().getTime();
  click2 = (1 / ((seconds - click1) / 1000)) * 60;
  click1 = seconds;
  ventVolData.push(ventValue);
  vpmData.push(Math.floor(click2));
  timerData.push(timer); 
  console.log(Math.floor(click2));
  switch(true){
    case (click2 < 40):
      document.getElementById("Slow").style.backgroundColor = "lightblue";
      document.getElementById("Right").style.backgroundColor = "lightgrey";
      document.getElementById("Fast").style.backgroundColor = "lightgrey";
      break;
    case (click2 >= 40 && click2 <= 80):
      document.getElementById("Slow").style.backgroundColor = "lightgrey";
      document.getElementById("Right").style.backgroundColor = " rgb(59, 241, 18)";
      document.getElementById("Fast").style.backgroundColor = "lightgrey";
      break;
     case (click2 > 80):
      document.getElementById("Slow").style.backgroundColor = "lightgrey";
      document.getElementById("Right").style.backgroundColor = "lightgrey";
      document.getElementById("Fast").style.backgroundColor = "red";
      break;
  }
}

// AED functions
function runAed(){
  if (aedMarker0.present){
    aed1 = true
  }
  else if (aedMmarker1.present){
    aed2 = true
  }
  else if (!aedMarker0.present && timer % 5 == 0){
    aed1 = false
  }
  else if (!aedMmarker1.present && timer % 5 == 0){
    aed2 = false
  }
  switch(true){
    case (aed1 && aed2):
      document.getElementById("aedScreen").innerHTML= "PAD_1 PAD_2 DETECTED";
      break;
    case (aed1):
      document.getElementById("aedScreen").innerHTML= "PAD_1 DETECTED";
      break;
    case (aed2):
      document.getElementById("aedScreen").innerHTML= "PAD_2 DETECTED";
      break;
  } 
  console.log(aed1,aed2)
}


// grading functions
function grade() {}

function calculateScore() {}

// update function
function update() {
  compressionDepth();
  ventVol();
  runAed();
}

// setupAppCanvas() function will initialize #app-canvas.
// if you intend to use #app-canvas, call this function in setup()

var canvas;
var ctx;
var dpr;
var appWidth;
var appHeight;
