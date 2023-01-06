let appMode = false;

const MARKER_COUNT = 1000;
const MARKER_TIMEOUT_DEFAULT = 75;
const MARKER = [];

class Marker {
  constructor(ID) {
    this.timeout = MARKER_TIMEOUT_DEFAULT;
    this.timestamp = 0;
    this.present = false;
    this.past = false;
    this.presentFlag = false;
    this.center = { x: 0, y: 0 };
    this.corners = [];
    this.rotation = 0;

    this.id = ID;
  }

  updateMarker(m, timenow) {
    this.past = this.present;
    this.present = true;
    this.timestamp = timenow;
    this.center = m.center;
    this.corners = m.corners.map(c => c);
    this.rotation = vecAngleBetween(vecSub(this.corners[0], this.corners[1]), {
      x: 1,
      y: 0
    });
    this.presentFlag = true;
  }

  updatePresence(time) {
    if (!this.presentFlag) {
      this.past = this.present;
      this.present =
        time - this.timestamp > this.timeout ? false : this.present;
    }
    this.presentFlag = false;
  }
}

class MarkerPair {
  constructor(idA, idB, markerArr) {
    this.markerA = idA < markerArr.length ? markerArr[idA] : undefined;
    this.markerB = idB < markerArr.length ? markerArr[idB] : undefined;
  }

  get angleBetween() {
    if (this.markerA && this.markerB) {
      if (this.markerA.corners.length > 0 && this.markerB.corners.length > 0) {
        return vecAngleBetween(
          vecSub(this.markerA.corners[0], this.markerA.corners[1]),
          vecSub(this.markerB.corners[0], this.markerB.corners[1])
        );
      }
    }
    return undefined;
  }

  get distance() {
    if (this.markerA && this.markerB) {
      return vecMag(vecSub(this.markerA.center, this.markerB.center));
    }
    return undefined;
  }

  getRelativePosition(markerSize) {
    //actual physical width of markerA
    if (this.markerA.present && this.markerB.present) {
      const physCorners = [
        { x: -markerSize / 2, y: -markerSize / 2 },
        { x: markerSize / 2, y: -markerSize / 2 },
        { x: markerSize / 2, y: markerSize / 2 },
        { x: -markerSize / 2, y: markerSize / 2 }
      ];

      const matrixRect2Quad = calDistortionMatrices(
        this.markerA.corners[0],
        this.markerA.corners[1],
        this.markerA.corners[2],
        this.markerA.corners[3],
        physCorners[0],
        physCorners[1],
        physCorners[2],
        physCorners[3]
      );

      const matrixQuad2Rect = math.inv(matrixRect2Quad);
      const q2r = v => matrixTransform(matrixQuad2Rect, v);

      const centerA = q2r(this.markerA.center);
      const centerB = q2r(this.markerB.center);
      const cornerA0 = q2r(this.markerA.corners[0]);
      const cornerA1 = q2r(this.markerA.corners[1]);
      const cornerB0 = q2r(this.markerB.corners[0]);
      const cornerB1 = q2r(this.markerB.corners[1]);

      const vecAB = vecSub(centerA, centerB);
      const vecA01 = vecSub(cornerA0, cornerA1);
      const d = vecMag(vecAB);
      const head = vecAngleBetween(vecA01, vecAB);
      const angle = vecAngleBetween(vecA01, vecSub(cornerB0, cornerB1));

      return { distance: d, heading: head, rotation: angle };
    }

    return { distance: undefined, heading: undefined, rotation: undefined };
  }
}

const getMarker = id => {
  if (id > MARKER.length) {
    return undefined;
  }
  return MARKER[id];
};

const getMarkerPair = (idA, idB) => {
  return new MarkerPair(idA, idB, MARKER);
};

for (let i = 0; i < MARKER_COUNT; i++) {
  MARKER.push(new Marker(i));
}

function updateDetection() {
  // console.log('num markers: ', markers.length, deltaTime);
  const markers = beholder.detect();

  // draw markers here
  const dctx = beholder.ctxOverlay;
  dctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  dctx.lineWidth = 3;

  const timenow = Date.now();

  markers.forEach(m => {
    if (m.id < MARKER.length) {
      MARKER[m.id].updateMarker(m, timenow);

      if (!appMode) {
        const center = m.center;
        const corners = m.corners;
        const angle = MARKER[m.id].rotation;

        dctx.strokeStyle = "#FF00AA";
        dctx.beginPath();

        corners.forEach((c, i) => {
          dctx.moveTo(c.x, c.y);
          var c2 = corners[(i + 1) % corners.length];
          dctx.lineTo(c2.x, c2.y);
        });

        dctx.stroke();
        dctx.closePath();

        // draw first corner
        dctx.strokeStyle = "blue";
        dctx.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);

        dctx.strokeStyle = "#FF00AA";
        dctx.strokeRect(center.x - 1, center.y - 1, 2, 2);

        dctx.font = "12px monospace";
        dctx.textAlign = "center";
        dctx.fillStyle = "#FF55AA";
        dctx.fillText(`ID=${m.id}`, center.x, center.y - 7);
        dctx.fillText(angle.toFixed(2), center.x, center.y + 15);
      }
    }
  });

  MARKER.forEach(m => m.updatePresence(timenow));

  update(); //defined in index.js

  requestAnimationFrame(updateDetection);
}

window.onload = function() {
  // initialize detection stuff and hack in to detection loop
  beholder.init("#detection-canvas", "#detection-canvas-overlay");

  // Detection param field changes
  document
    .querySelector("#MIN_MARKER_DISTANCE")
    .addEventListener("change", e => {
      beholder.setParam("MIN_MARKER_DISTANCE", e.target.value);
    });
  document
    .querySelector("#MIN_MARKER_PERIMETER")
    .addEventListener("change", e => {
      beholder.setParam("MIN_MARKER_PERIMETER", e.target.value);
    });
  document
    .querySelector("#MAX_MARKER_PERIMETER")
    .addEventListener("change", e => {
      beholder.setParam("MAX_MARKER_PERIMETER", e.target.value);
    });
  document
    .querySelector("#SIZE_AFTER_PERSPECTIVE_REMOVAL")
    .addEventListener("change", e => {
      beholder.setParam("SIZE_AFTER_PERSPECTIVE_REMOVAL", e.target.value);
    });
  document.querySelector("#IMAGE_BRIGHTNESS").addEventListener("change", e => {
    beholder.setParam("IMAGE_BRIGHTNESS", e.target.value);
    beholder.filterImage();
  });
  document.querySelector("#IMAGE_CONTRAST").addEventListener("change", e => {
    beholder.setParam("IMAGE_CONTRAST", e.target.value);
    beholder.filterImage();
  });
  document.querySelector("#IMAGE_GRAYSCALE").addEventListener("change", e => {
    beholder.setParam("IMAGE_GRAYSCALE", e.target.value);
    beholder.filterImage();
  });
  document.querySelector("#torchButton").addEventListener("click", e => {
    beholder.setParam("TORCH", !detectionParams.TORCH);
    beholder.startCameraFeed();
  });

  const cameraSelect = document.querySelector("#CAMERA_INDEX");
  beholder.getCameraFeeds().then(feeds => {
    cameraSelect.innerHTML = "";

    feeds.forEach((f, i) => {
      if (f.kind === "videoinput") {
        const opt = document.createElement("option");
        opt.value = f.deviceId;
        opt.label = f.label ? f.label : i;
        if (i === 0) opt.selected = true;
        cameraSelect.appendChild(opt);
      }
    });

    cameraSelect.addEventListener("change", e => {
      console.log(e.target.value);
      beholder.setCamera(e.target.value);
    });
  });

  document.querySelector("#VIDEO_SIZE_INDEX").addEventListener("change", e => {
    console.log(e.target.value);
    beholder.setVideoSize(e.target.value);
  });

  document.querySelector("#toggleScreen").addEventListener("click", e => {
    appMode = !appMode;
    document.querySelector("#toggleScreen").classList.toggle("active");
    document.querySelector("#detectionDiv").classList.toggle("active");
  });

  setup(); //defined in index.js

  updateDetection();
};

////////////////////
//
// Math methods
//
////////////////////

function vecAdd(vec1, vec2) {
  return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

// vector vec1 ---> vec2
function vecSub(vec1, vec2) {
  return { x: -vec1.x + vec2.x, y: -vec1.y + vec2.y };
}

function vecScale(vec, scale) {
  return { x: vec.x * scale, y: vec.y * scale };
}

function vecDot(vec1, vec2) {
  return vec1.x * vec2.x + vec1.y * vec2.y;
}

function vecMag(vec) {
  return Math.pow(Math.pow(vec.x, 2) + Math.pow(vec.y, 2), 0.5);
}

function vecMag2(vec) {
  return Math.pow(vec.x, 2) + Math.pow(vec.y, 2);
}

function vecUnit(vec) {
  var m = vecMag(vec);
  return {
    x: vec.x / m,
    y: vec.y / m
  };
}

function vecRot90(vec) {
  return { x: vec.y, y: -vec.x };
}

function vecRot(vec, angle) {
  var x = vec.x * Math.cos(angle) - vec.y * Math.sin(angle);
  var y = vec.x * Math.sin(angle) + vec.y * Math.cos(angle);
  return { x: x, y: y };
}

function vecAngleBetween(vec1, vec2) {
  // return Math.atan2(vec1.y, vec1.x) - Math.atan2(vec2.y, vec2.x);
  return Math.atan2(
    vec1.x * vec2.y - vec1.y * vec2.x,
    vec1.x * vec2.x + vec1.y * vec2.y
  );
}

function vecEMA(vec1, vec2, weight) {
  return {
    x: vec1.x * (1 - weight) + vec2.x * weight,
    y: vec1.y * (1 - weight) + vec2.y * weight
  };
}

// Line closest point
// p0 is point of interest, p1: start of line, p2: end of line
function lineCP(p2, p0, p1) {
  var p10 = { x: p0.x - p1.x, y: p0.y - p1.y };
  var p12 = { x: p2.x - p1.x, y: p2.y - p1.y };
  var t = vecDot(p12, p10) / vecDot(p12, p12);
  var CPx = p1.x + t * p12.x;
  var CPy = p1.y + t * p12.y;

  return { x: CPx, y: CPy, t: t };
}

////////////////////
//
// Distortion methods
//
////////////////////

function calDistortionMatrices(q1, q2, q3, q4, r1, r2, r3, r4) {
  const matrixA = math.matrix([
    [r1.x, r1.y, 1, 0, 0, 0, -q1.x * r1.x, -q1.x * r1.y],
    [0, 0, 0, r1.x, r1.y, 1, -q1.y * r1.x, -q1.y * r1.y],
    [r2.x, r2.y, 1, 0, 0, 0, -q2.x * r2.x, -q2.x * r2.y],
    [0, 0, 0, r2.x, r2.y, 1, -q2.y * r2.x, -q2.y * r2.y],
    [r3.x, r3.y, 1, 0, 0, 0, -q3.x * r3.x, -q3.x * r3.y],
    [0, 0, 0, r3.x, r3.y, 1, -q3.y * r3.x, -q3.y * r3.y],
    [r4.x, r4.y, 1, 0, 0, 0, -q4.x * r4.x, -q4.x * r4.y],
    [0, 0, 0, r4.x, r4.y, 1, -q4.y * r4.x, -q4.y * r4.y]
  ]);

  const matrixB = math.matrix([
    [q1.x],
    [q1.y],
    [q2.x],
    [q2.y],
    [q3.x],
    [q3.y],
    [q4.x],
    [q4.y]
  ]);

  const s = math.lusolve(matrixA, matrixB);

  return math.matrix([
    [
      math.subset(s, math.index(0, 0)),
      math.subset(s, math.index(1, 0)),
      math.subset(s, math.index(2, 0))
    ],
    [
      math.subset(s, math.index(3, 0)),
      math.subset(s, math.index(4, 0)),
      math.subset(s, math.index(5, 0))
    ],
    [math.subset(s, math.index(6, 0)), math.subset(s, math.index(7, 0)), 1]
  ]);
}

// transformation of v using matrix m
// v = 2D vector of the format {x:X, y:Y}
function matrixTransform(m, v) {
  const matrixV = math.matrix([[v.x], [v.y], [1]]);

  const result = math.multiply(m, matrixV);

  return {
    x:
      math.subset(result, math.index(0, 0)) /
      math.subset(result, math.index(2, 0)),
    y:
      math.subset(result, math.index(1, 0)) /
      math.subset(result, math.index(2, 0))
  };
}
