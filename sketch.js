// =======================================================================
// ======================== Global Variables =============================
// =======================================================================
//
// This section defines all shared state used across the sketch, including
// the global background colour, colour palettes for circles and patterns,
// the master list of Circle objects, and the subset of those circles that
// serve as connection “nodes”. All variables are initialised in setup()
// and later accessed in draw(), layout functions, and within the Circle
// class itself.

let globalBgColor; // Background colour (deep earth tones)
let circleBasePalette; // Base fill colours for inner circles
let patternPalette; // High-contrast colours for patterns
let circles; // All Circle objects in the scene
let connectedNodes;  // Subset of circles that form network connections

// =======================================================================
//                           WINDOW RESIZE
// =======================================================================
// p5.js automatically calls windowResized() when the browser window changes.
// We recompute a square canvas and regenerate layout. The reference for
// resizeCanvas() is here:
// https://p5js.org/reference/p5/resizeCanvas/

function windowResized() {
  let size = min(windowWidth, windowHeight);
  resizeCanvas(size, size);
  createFixedLayout();
}

// =======================================================================
//                     LAYOUT + BACKGROUND + NETWORK
// =======================================================================
//
// This section handles global composition: placing circle centres along
// diagonal lines, randomly selecting some circles as “connection nodes”,
// drawing distance-based network lines between them, and rendering the
// random-dot background texture.
//

// --- Layout Generation --------------------------------------------------

function createFixedLayout() {
  circles = [];
  connectedNodes = [];

  let r = width / 8; // Base radius for all circles

  // Place circles along multiple angled lines.
  // Parameters: count, startX, startY, stepX, stepY, radius
  addCirclesOnLine(5, width / 7.1, height / 7.1, width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, width / 2, height / 10, width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, width * 0.8, 0, width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, width / 20, height / 2.2, width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, 0, (height * 8) / 10, width / 4.8, height / 4.8, r);
}

function addCirclesOnLine(count, startX, startY, stepX, stepY, r) {
  for (let i = 0; i < count; i++) {
    let x = startX + stepX * i;
    let y = startY + stepY * i;
    let c = new Circle(x, y, r);
    circles.push(c);

    // Randomly select ~70% of circles to act as network nodes
    if (random(1) < 0.7) connectedNodes.push(c);
  }
}

// --- Draw Network Lines -------------------------------------------------
//
// Draws semi-transparent links between selected “VIP” nodes. A connection
// is drawn only if the distance between two nodes is below a threshold.
// We use strokeCap(ROUND) to give the connectors a soft, organic finish.
//
// References:
// strokeCap(): https://p5js.org/reference/p5/strokeCap/
// dist():      https://p5js.org/reference/p5/dist/

function drawNetworkLines() {
  push();
  stroke(color(240, 230, 200, 180)); // Warm cream tone
  strokeWeight(10);
  strokeCap(ROUND);

  for (let i = 0; i < connectedNodes.length; i++) {
    for (let j = i + 1; j < connectedNodes.length; j++) {
      let c1 = connectedNodes[i];
      let c2 = connectedNodes[j];
      let d = dist(c1.x, c1.y, c2.x, c2.y);

     // Only connect circles within a certain radius threshold
      if (d < width / 2.8) {
        line(c1.x, c1.y, c2.x, c2.y);
      }
    }
  }
  pop();
}

// --- Background Dots ----------------------------------------------------
// A dense field of small semi-transparent white dots is drawn to create
// texture behind everything. The total dot count scales with canvas area.
// Useful references:
// ellipse(): https://p5js.org/reference/p5/ellipse/

function drawBackgroundDots() {
  push();
  noStroke();
  let numDots = floor(width * height * 0.004);

  for (let i = 0; i < numDots; i++) {
    fill(255, random(100, 200));
    ellipse(random(width), random(height), random(width * 0.002, width * 0.005));
  }
  pop();
}

// =======================================================================
//                           CIRCLE CLASS
// =======================================================================
//
// Each Circle consists of three pattern layers: inner, middle, and outer.
// They animate sequentially based on elapsed time. The shapes use
// beginShape() + curveVertex() to produce hand-drawn, organic outlines.
//
// References:
// beginShape():  https://p5js.org/reference/p5/beginShape/
// curveVertex(): https://p5js.org/reference/p5/curveVertex/
// millis():      https://p5js.org/reference/p5/millis/

class Circle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;

    // Timing for the animated appearance
    this.startTime = millis();
    this.innerDuration = 800;
    this.middleDuration = 1200;
    this.outerDuration = 1500;

    // Base fill + pattern colours (randomly assigned)
    this.innerBaseColor = random(circleBasePalette);
    this.innerColor = random(patternPalette);
    this.middleColor = random(patternPalette);
    this.outerColor = random(patternPalette);

    // Random pattern type selections for each layer
    this.outerPatternType = floor(random(4));
    this.middlePatternType = floor(random(4));
    this.innerPatternType = floor(random(2));
  }

  // Compute how long this circle has been active
  getElapsed() {
    return millis() - this.startTime;
  }

  // --- Main Drawing Function -------------------------------------------
  // Uses push()/pop() and translate() to render all shapes relative to
  // the circle centre (0,0). A slightly oversized “mask circle” is drawn
  // first to hide network lines beneath the motif.

  display() {
    push();
    translate(this.x, this.y);

    //// Mask circle to cover network lines
    this.drawHandDrawnCircle(this.r * 1.05, globalBgColor, null, 0);

    let t = this.getElapsed();

    // Stage 1: inner layer animation
    if (t < this.innerDuration) {
      this.displayInnerAnimated(constrain(t / this.innerDuration, 0, 1));
      pop();
      return;
    }

    // Stage 2: add middle layer
    if (t < this.innerDuration + this.middleDuration) {
      this.displayInnerAnimated(1);
      this.displayMiddleAnimated(
        constrain((t - this.innerDuration) / this.middleDuration, 0, 1)
      );
      pop();
      return;
    }

    // Stage 3: fully reveal outer layer
    this.displayInnerAnimated(1);
    this.displayMiddleAnimated(1);
    this.displayOuterAnimated(
      constrain(
        (t - (this.innerDuration + this.middleDuration)) / this.outerDuration,
        0,
        1
      )
    );

    pop();
  }

  // ===================================================================
  //                        Shape Utilities
  // ===================================================================
  // A collection of helper functions that construct organic, hand-drawn
  // shapes using jittered radii and curveVertex() smoothing.

  drawIrregularBlob(rOffset, angle, size, col) {
    let x = cos(angle) * rOffset;
    let y = sin(angle) * rOffset;

    fill(col);
    noStroke();
    push();
    translate(x, y);
    beginShape();
    for (let i = 0; i < 8; i++) {
      let a = (TWO_PI / 8) * i;
      let rr = size * 0.5 * random(0.85, 1.15);
      curveVertex(cos(a) * rr, sin(a) * rr);
    }
    endShape(CLOSE);
    pop();
  }

  drawHandDrawnCircle(r, fillCol, strokeCol, strokeW) {
    if (fillCol) fill(fillCol); else noFill();
    if (strokeCol) stroke(strokeCol); else noStroke();
    if (strokeW) strokeWeight(strokeW);

    beginShape();
    for (let i = 0; i <= 50; i++) {
      let angle = TWO_PI * (i / 50);
      let jitter = random(-r * 0.01, r * 0.01);
      curveVertex(cos(angle) * (r + jitter), sin(angle) * (r + jitter));
    }
    endShape(CLOSE);
  }

  // ===================================================================
  //                        INNER LAYER
  // ===================================================================
  displayInnerAnimated(p) {
    // // inner base fill
    this.drawHandDrawnCircle(this.r * 0.25 * p, this.innerBaseColor, null, 0);

    // Either a blob or a spiral (two random options)
    if (this.innerPatternType === 0) {
    
      this.drawIrregularBlob(0, 0, this.r * 0.15 * p, this.innerColor);
    } else {
    
      noFill();
      stroke(this.innerColor);
      strokeWeight(this.r * 0.015);
      beginShape();
      for (let i = 0; i < 50 * p; i++) {
        let rr = map(i, 0, 50, 0, this.r * 0.22 * p);
        let ang = i * 0.4;
        curveVertex(cos(ang) * rr, sin(ang) * rr);
      }
      endShape();
    }
  }

  // ===================================================================
  //                        MIDDLE LAYER
  // ===================================================================
  displayMiddleAnimated(p) {
    let col = this.middleColor;

    switch (this.middlePatternType) {
      case 0: // concentric dots
        let dotSize = this.r * 0.04;
        for (let r = this.r * 0.2; r < this.r * 0.55 * p; r += dotSize * 1.5) {
          let count = floor((TWO_PI * r) / (dotSize * 1.5));
          for (let i = 0; i < count; i++) {
            let angle = TWO_PI * (i / count);
            this.drawIrregularBlob(r, angle, dotSize, col);
          }
        }
        break;

      case 1: // U shapes
        noFill();
        stroke(col);
        strokeWeight(this.r * 0.02);
        let count = 8;
        let rr = this.r * 0.35 * p;
        for (let i = 0; i < count * p; i++) {
          let angle = TWO_PI * (i / count);
          push();
          rotate(angle);
          translate(rr, 0);
          rotate(PI/2);
          arc(0,0,this.r*0.15,this.r*0.15,0,PI);
          pop();
        }
        break;

      case 2: // solid rings
        noStroke();
        fill(col);
        this.drawHandDrawnCircle(this.r * 0.45 * p, null, col, null);
        fill(random(patternPalette));
        this.drawHandDrawnCircle(this.r * 0.30 * p, null, col, null);
        break;

      case 3: // Hand-drawn concentric rings
        noFill();
        stroke(col);
        let numRings = 5;
        for (let j = 0; j < numRings; j++) {
          let radius = map(j, 0, numRings - 1, this.r * 0.30, this.r * 0.55 * p);
          strokeWeight(this.r * 0.01 * random(0.8, 1.2));
          beginShape();
          for (let i = 0; i <= 25; i++) {
            let ang = TWO_PI * (i / 25);
            let jitter = random(-this.r * 0.02, this.r * 0.02);
            curveVertex(cos(ang) * (radius + jitter), sin(ang) * (radius + jitter));
          }
          endShape(CLOSE);
        }
        break;
    }
  }

  // ===================================================================
  //                        OUTER LAYER
  // ===================================================================
  displayOuterAnimated(p) {
    let col = this.outerColor;

    switch (this.outerPatternType) {
      case 0: // dots ring
        let dotSize = this.r * 0.07;
        for (let rad = this.r * 0.65; rad < this.r * 0.95 * p; rad += dotSize * 0.9) {
          let count = floor((TWO_PI * rad) / (dotSize * 1.3));
          for (let i = 0; i < count; i++) {
            let ang = TWO_PI * (i / count);
            this.drawIrregularBlob(rad, ang, dotSize, col);
          }
        }
        break;

      case 1: // radiating lines
        stroke(col);
        strokeWeight(this.r * 0.015);
        let numLines = 40;
        for (let i = 0; i < numLines * p; i++) {
          let angle = (TWO_PI / numLines) * i + random(-0.05, 0.05);
          push();
          rotate(angle);
          line(this.r * 0.6, 0, this.r * 0.95 * p, 0);
          pop();
        }
        break;

      case 2: // striped ring
        noFill();
        stroke(col);
        strokeWeight(this.r * 0.025);
        for (let i = 0; i < 2; i++) {
          let radius = map(i, 0, 1, this.r * 0.65, this.r * 0.9 * p);
          beginShape();
          for (let k = 0; k <= 50; k++) {
            let ang = TWO_PI * (k / 50);
            let jitter = random(-this.r * 0.01, this.r * 0.01);
            curveVertex(cos(ang) * (radius + jitter), sin(ang) * (radius + jitter));
          }
          endShape(CLOSE);
        }
        break;

      case 3: // Wavy radial contour (sine wave)
        noFill();
        stroke(col);
        strokeWeight(this.r * 0.025);
        let baseR = this.r * 0.73;
        let waveHeight = baseR * 0.30;
        let freq = 60;
        beginShape();
        for (let j = 0; j <= 240 * p; j++) {
          let ang = TWO_PI * (j / 240);
          let offset = sin(ang * freq) * waveHeight;
          let finalR = baseR + offset + random(-this.r * 0.005, this.r * 0.005);
          curveVertex(cos(ang) * finalR, sin(ang) * finalR);
        }
        endShape(CLOSE);
        break;
    }
  }
}

// =======================================================================
//                         SETUP + DRAW
// =======================================================================
// The sketch is animated, so draw() runs continuously. We paint background,
// then the network lines (under the circles), then the circle layer.

function setup() {
  let size = min(windowWidth, windowHeight);
  createCanvas(size, size);
  pixelDensity(2); // sharper rendering on high-DPI displays

  globalBgColor = color(30, 20, 15); // Earth-tone background

  circleBasePalette = [
    color(90, 40, 20),
    color(60, 30, 15),
    color(40, 45, 35),
    color(110, 60, 30),
    color(20, 20, 20)
  ];

  patternPalette = [
    color(255),
    color(255, 240, 200),
    color(255, 215, 0),
    color(255, 140, 80),
    color(160, 180, 140),
    color(200, 200, 210)
  ];

  createFixedLayout();
}

function draw() {
  background(globalBgColor);
  drawBackgroundDots();
  drawNetworkLines();

  for (let c of circles) {
    c.display();
  }
}
