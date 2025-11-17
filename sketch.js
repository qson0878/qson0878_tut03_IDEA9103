// =======================================================================
// ======================== Global Variables =============================
// =======================================================================
//
// This section defines all shared state used across the sketch, including
// the global background colour, colour palettes for circles and patterns,
// and the arrays that store Circle objects and the subset of circles used
// as connection nodes. These variables are initialised in setup() and then
// read by the drawing functions in draw(), layout, and the Circle class.
//

let globalBgColor;       // Background colour
let circleBasePalette;   // Base colours for the circles (Deep Earth tones)
let patternPalette;          // Colours for patterns/details (High contrast/Bright)
let circles;        // Stores all circle objects, although this step is not neccessary, 
// it is useful for individual assignments as we may operate on individual circles.
let connectedNodes; // Stores the circles selected as connection nodes (key "VIP" nodes)
// --- NEW for Animation ---
// Total duration for one full loop (expand and contract) in milliseconds
let globalLoopDuration = 15000; // 15 seconds

// -----------------------------------------------------------------------
//                    Network line animation state
// -----------------------------------------------------------------------
//
// To animate the connecting “songlines” between circles, we pre-compute
// all valid line segments and then reveal them over time using lerp().
// Each line has a staggered start time, so the network appears to grow
// progressively rather than all at once.
//
let networkLines = [];      // Stores all eligible line segments
let lineDelay = 150;        // Delay between each line starting (ms)
let lineGrowDuration = 800;  // How long each line takes to grow (ms)

// =======================================================================
//                              WINDOW RESIZE
// =======================================================================
//
// p5.js automatically calls windowResized() when the canvas size should
// respond to a change of browser window dimensions. We keep the canvas
// square by taking the minimum of width/height, then recompute layout and
// pre-calculate all network line segments.
//
// Reference: https://p5js.org/reference/p5/resizeCanvas/
//
function windowResized() {
  let size = min(windowWidth, windowHeight);
  resizeCanvas(size, size);
  // Re-calculate layout and animation data for the new size
  createFixedLayout();
  prepareNetworkLines();
}

// =======================================================================
//                      Layout & Background Setup
// =======================================================================
//
// This section is responsible for the overall composition of the artwork.
// It generates the fixed layout of circle centres, selects some of them as
// “VIP” nodes for the network layer, prepares animated line segments, and
// draws the random dot background texture that sits underneath all circles.
//
// -----------------------------------------------------------------------
//                         Layout Generation
// -----------------------------------------------------------------------
function createFixedLayout() {
  circles = []; //initialise
  connectedNodes = [];
  // Base radius unit relative to canvas width
  let r = width / 8;
  // Add circles along specific diagonal coordinates
  // Parameters: count, startX, startY, stepX, stepY, radius
  addCirclesOnLine(5, width / 7.1, height / 7.1,  width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, width / 2,   (height * 2) / 20, width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, (width * 4) / 5, 0,          width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, width / 20,  height / 2.2,   width / 4.8, height / 4.8, r);
  addCirclesOnLine(5, 0,           (height * 8) / 10, width / 4.8, height / 4.8, r);
}
function addCirclesOnLine(count, startX, startY, stepX, stepY, r) {
  for (let i = 0; i < count; i++) {
    let x = startX + stepX * i;
    let y = startY + stepY * i;
    let c = new Circle(x, y, r);
    circles.push(c);
    // Randomly select 70% of circles to be "nodes" for connections
    if (random(1) < 0.7) {
      connectedNodes.push(c);
    }
  }
}

// -----------------------------------------------------------------------
//                      Prepare animated connecting lines
// -----------------------------------------------------------------------
//
// Instead of computing line segments each frame, we pre-generate a list
// of valid lines between nodes that are within a certain distance. This
// runs once in setup() and after windowResized().
//
// Reference for dist(): https://p5js.org/reference/p5/dist/
//
function prepareNetworkLines() {
  networkLines = [];
  for (let i = 0; i < connectedNodes.length; i++) {
    for (let j = i + 1; j < connectedNodes.length; j++) {
      let c1 = connectedNodes[i];
      let c2 = connectedNodes[j];
      // Compute Euclidean distance between two circle centres.
      // dist() is from the p5.js reference: https://p5js.org/reference/p5/dist/
      let d = dist(c1.x, c1.y, c2.x, c2.y); // Calculate distance between two nodes
      // Only connect nodes that are within a certain distance
      // so that circles next to each other are connected
      if (d < width / 2.8) {
        networkLines.push({
          x1: c1.x,
          y1: c1.y,
          x2: c2.x,
          y2: c2.y
        });
      }
    }
  }
}

// -----------------------------------------------------------------------
//                         Animated connecting lines
// -----------------------------------------------------------------------
//
// This function is called every frame in draw(). It receives the masterP
// (0-1-0 loop) and calculates a "virtual" time to draw each line.
//
// References:
// lerp():  https://p5js.org/reference/p5/lerp/
//
function drawNetworkLines(masterP) { 
  let linkColor = color(240, 230, 200, 180); // Creamy colour, semi-transparent
  // Use push/pop to isolate style settings for lines
  push();
  stroke(linkColor);
  strokeWeight(10); // Fixed wide width
  
  // Calculate a "virtual" time based on masterP instead of millis()
  // This makes the animation reversible.
  let totalNetworkTime = (networkLines.length - 1) * lineDelay + lineGrowDuration;
  let now = masterP * totalNetworkTime; // 'now' will go 0 -> total -> 0
  for (let i = 0; i < networkLines.length; i++) {
    let L = networkLines[i];
    // Each line starts a bit later for a staggered effect
    let startT = i * lineDelay;
    let p = (now - startT) / lineGrowDuration;
    p = constrain(p, 0, 1);
    if (p > 0) {
      // Line grows from start to end using lerp()
      let x = lerp(L.x1, L.x2, p);
      let y = lerp(L.y1, L.y2, p);
      line(L.x1, L.y1, x, y);
    }
  }
  pop();
}

// -----------------------------------------------------------------------
//                 Background texture: scattered white dots
// -----------------------------------------------------------------------
/*
    This background texture uses probabilistic dot density to distribute thousands of 
    semi-transparent white dots across the canvas. 
*/
function drawBackgroundDots() {
  push();
  noStroke();
  let density = 0.004;                  // Controls how many dots per pixel area.
  let numDots = floor(width * height * density); // Calculate the total number of dots based on canvas area and desired density.
  for (let i = 0; i < numDots; i++) {
    let x = random(width); // Random x position within canvas
    let y = random(height); // Random y position within canvas
    let dotSize = random(width * 0.002, width * 0.005); // Set dot size relative to canvas width for responsiveness.
    let alpha   = random(100, 200); // We want the dots have different opacity, so they look like shining stars!
    fill(255, 255, 255, alpha);        // Pure white dots with varied opacity
    ellipse(x, y, dotSize);
  }
  pop();
}

// ======================================================================
// ========================= CIRCLE CLASS ===============================
// ======================================================================
//
// The Circle class encapsulates all logic for drawing a single circular
// motif. Each Circle instance stores its position, radius, randomly chosen
// pattern types for three layers (inner, middle, outer), and timing values
// that control the staged animation.
//
// The class provides:
// - display(): orchestrates time-based animation of inner → middle → outer
// - a set of helper methods to draw blobs, hand-drawn circles
//   and patterned rings using beginShape() + curveVertex().
//
class Circle {
  /*
    Each Circle object randomly selects pattern types for its outer, middle,
    and inner layers. This modular structure expands on OOP techniques,
    enabling controlled variation through generative rules.
  */
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    // Randomly assign pattern types (once at creation)
    this.outerPatternType  = floor(random(4));
    this.middlePatternType = floor(random(4));
    this.innerPatternType  = floor(random(2));
    this.irregularity = 0.02; // amount of jitter for hand-drawn feel
    // --- Time-based animation control ---
    this.innerDuration  = 800;   // ms
    this.middleDuration = 1200;  // ms
    this.outerDuration  = 1500;  // ms
    
    // Total duration for this circle's animation cascade
    this.totalDuration = this.innerDuration + this.middleDuration + this.outerDuration;
    // Stable colours per circle (sampled once, reused every frame for animation)
    this.innerBaseColor = random(circleBasePalette);
    this.innerCol       = random(patternPalette);
    this.middleCol      = random(patternPalette);
    this.outerCol       = random(patternPalette);
  }
  // -------------------------------------------------------------------
  //                         Main Display Method
  // -------------------------------------------------------------------
  //
  // Uses push/pop/translate to simplify drawing coordinates (relative to center 0,0)
  // Now driven by masterP. The logic calculates the progress of all 
  // three layers based on a "virtual time" derived from masterP.
  // 'p' (progress) is a "normalized" value between 0 and 1.
  // It will drive animations at all levels.
  //
  display(masterP) { 
    push();
    
    // 1. Move origin to the circle's center
    translate(this.x, this.y);
    // 2. Draw Buffer Circle (Mask)
    // Cleans up the background and network lines behind the circle
    this.drawHandDrawnCircle(this.r * 1.05, globalBgColor, null, 0);
    // 3. --- NEW LOGIC for Animation ---
    // Calculate a "virtual" time 't' for this circle based on masterP
    // 't' will go from 0 -> totalDuration and back to 0.
    let t = masterP * this.totalDuration;
    // Calculate progress (0-1) for all three layers based on 't'.
    // The constrain() function is key. As 't' decreases (during rewind), pOuter
    // will go from 1 to 0 first, then pMiddle, then pInner.
    
    // Detailed description:
    // When t increases from 0 to innerDuration (for example, 800ms), pInner will gradually change from 0 to 1
    let pInner = constrain(t / this.innerDuration, 0, 1);
    
    // Only when t > innerDuration does pMiddle start changing from 0 to 1
    let pMiddle = constrain(
      (t - this.innerDuration) / this.middleDuration,
      0, 1
    );
    
    // pOuter will only start to change from 0 to 1 when t > (innerDuration + middleDuration)
    let pOuter = constrain(
      (t - (this.innerDuration + this.middleDuration)) / this.outerDuration,
      0, 1
    );
    // 4. Draw all animated layers. 
    // The functions will draw nothing if their 'p' value is 0.
    this.displayInnerAnimated(pInner);
    this.displayMiddleAnimated(pMiddle);
    this.displayOuterAnimated(pOuter);
    pop(); // Restore coordinate system
  }

  // -------------------------------------------------------------------
  //                    Drawing Utilities (Helper Shapes)
  // -------------------------------------------------------------------
  /*
        Many of the custom shapes in this sketch use beginShape() together with
        curveVertex() to build smooth, organic outlines instead of perfect geometric primitives. 
        This technique was not fully covered in class and is adapted from the official p5.js reference:
            - beginShape(): https://p5js.org/reference/p5/beginShape/
            - curveVertex(): https://p5js.org/reference/p5/curveVertex/
        By adding small random jitter to the radii of points before calling
        curveVertex(), we simulate hand-drawn contours and irregular blobs.
    */
  drawIrregularBlob(rOffset, angle, size, col) {
    //beginShape() + curveVertex()： draw a small, irregular dot shape at a given radial offset and angle.
    // Calculate position based on polar coordinates
    let x = cos(angle) * rOffset;
    let y = sin(angle) * rOffset;
    fill(col);
    noStroke();
    push();
    translate(x, y);
    rotate(random(TWO_PI));  // Random rotation for variety
    beginShape();
    let points = 8;
    for (let i = 0; i < points; i++) {
      let a = (TWO_PI / points) * i;
      // Jitter the radius of the dot itself
      let r = size * 0.5 * random(0.85, 1.15);
      curveVertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE);
    pop();
  }
    // larger version of drawIrregularBlob() used to draw big circular motifs
  drawHandDrawnCircle(r, fillCol, strokeCol, strokeW) {
    // draws a large base circle with a slightly jittered radius, 
    // beginShape() + curveVertex(): described above to create an organic, hand-drawn outline.
    //This function can be used to draw circles both with fill and without fill.
    if (fillCol)  fill(fillCol);  else noFill();
    if (strokeCol) stroke(strokeCol); else noStroke();
    if (strokeW)  strokeWeight(strokeW);
    beginShape();
    let points = 50;  // if the number of points is too small, the circle will look like a polygon.
    // if the number of points is too big, the circle will look like too perfect!
    for (let i = 0; i <= points; i++) {
      let angle  = (TWO_PI / points) * i;
      // Jitter the main radius
      let jitter = random(-r * 0.01, r * 0.01);
      let radius = r + jitter;
      curveVertex(cos(angle) * radius, sin(angle) * radius);
    }
    endShape(CLOSE);
  }
  
// -- How do animated patterns work --
//
// Below displayOuterAnimated, displayMiddleAnimated, and displayInnerAnimated
// All functions take a 'p' (progress) argument, which ranges from 0 to 1.
//
// Inside each drawPattern function, this 'p' value controls the animation in several ways:
// 1.Radius size: this.r * 0.25 * p → The circle expands from smallest to largest
// 2. Quantity: like floor(50 * p) → The number of points or lines will gradually increase
// 3. range/length: e.g. < this.r * 0.5 * p → The radius of a ring or the length of a helix grows
//
// When masterP rewinds, the 'p' value changes from 1 back to 0, automatically "rewinding" these effects.
//
  // =====================================================================
  //                      OUTER PATTERNS (Animated)
  // =====================================================================
  displayOuterAnimated(p) {
    if (p <= 0) return; // Still return if progress is 0
    let col = this.outerCol; // Use stable color from constructor
    // draw the outer pattern based on the pattern type
    switch (this.outerPatternType) {
      case 0:
        this.drawOuterDotsPattern(col, p);
        break;
      case 1:
        this.drawOuterRadiatingLinesPattern(col, p);
        break;
      case 2:
        this.drawOuterStripedRingPattern(col, p);
        break;
      case 3:
        this.drawOuterRadialDashPattern(col, p);
        break;
    }
  }
  // Pattern 0: Irregular dots ring
  drawOuterDotsPattern(col, p) {
    let dotSize    = this.r * 0.07;
    let dotSpacing = this.r * 0.09;
  
    // the dots ring starts from a radius of 0.65 times the radius of the circle
    // and will end at 0.95 times the radius of the circle
    // you can adjust all the parameters to achieve the effect you want
    for (let radius = this.r * 0.65;
         radius < this.r * 0.95 * p; // 'p' controls max radius (Scope)
         radius += dotSpacing) {
      let count = floor((TWO_PI * radius) / dotSpacing); // calculate the number of dots in this radius
      //so the density of dots on each circle is identical
      for (let i = 0; i < count; i++) { // draw dots ring
        let angle = (TWO_PI / count) * i;
        this.drawIrregularBlob(radius, angle, dotSize, col);
      }
    }
  }
  // Pattern 1: Radiating lines (sunburst)
  // Uses rotate() to simplify drawing lines radiating from center
  drawOuterRadiatingLinesPattern(col, p) {
    let numLines = 40;
    stroke(col);
    strokeWeight(this.r * 0.015);
    strokeCap(ROUND);
    let maxLines = numLines * p; // 'p' controls how many lines (Number)
    for (let i = 0; i < maxLines; i++) {
      let angle = (TWO_PI / numLines) * i + random(-0.05, 0.05); // add random jitter to each line
      push();
      rotate(angle); // Rotate context
      // Draw line along the X-axis
      line(this.r * 0.6, 0, this.r * 0.95, 0);
      // Draw dot at the tip
      this.drawIrregularBlob(this.r * 0.95, 0, this.r * 0.03, col);
      pop();
    }
  }
  // Pattern 2: Striped ring
  drawOuterStripedRingPattern(col, p) {
    noFill();
    stroke(col);
    let baseStrokeWeight = this.r * 0.025;
    let numRings = 2; // we only want 2 rings to make the pattern look more brief
    // You can increase the number to get a more dense ring pattern
    for (let i = 0; i < numRings; i++) {
      // The map() function scales a value from one range to another.
      // Here, it takes the loop counter 'i' (which goes from 0 to numRings - 1)
      // and converts it to a corresponding radius value
      let radius = map(i, 0, numRings - 1,
                       this.r * 0.65,
                       this.r * 0.9);
      if (p < 1) radius *= p; // 'p' controls the radius (Radius size)
      
      strokeWeight(baseStrokeWeight * random(0.8, 1.2));
      // Because we don't want a circle with fill, we pass 'null' for fillCol.
      this.drawHandDrawnCircle(radius, null, col, null);
    }
  }
  // Pattern 3: Radial dash (sine wave “spring”)
  // Uses sin() to create a continuous wavy circumference
  // This pattern also relies on beginShape() + curveVertex() to render the wavy outer contour as a continuous organic loop.
  drawOuterRadialDashPattern(col, p) {
    noFill();
    stroke(col);
    strokeWeight(this.r * 0.025);
    let baseRadius   = this.r * 0.73;
    let waveHeight   = baseRadius * 0.30;
    // waveHeight is the amplitude: how far the wave goes "in" and "out" from the baseRadius.
    let waveFrequency = 60;
    // waveFrequency controls how many full oscillations (bounces) happen around the circle.
    let totalPoints   = floor(240 * p); // 'p' controls how much of the ring is drawn (Range/Length)
    // totalPoints determines the smoothness (resolution) of the shape. More points = smoother.
    // we use sin to create a wavy effect, it looks like a spring
    beginShape();
    for (let j = 0; j <= totalPoints; j++) {
      let angle  = (TWO_PI / 240) * j;
      let offset = sin(angle * waveFrequency) * waveHeight;
      let finalRadius = baseRadius + offset;
      finalRadius += random(-this.r * 0.005, this.r * 0.005);
      curveVertex(cos(angle) * finalRadius,
                  sin(angle) * finalRadius);
    }
    // Don't close if p < 1, let it be an open line
    if (p < 1) {
      endShape();
    } else {
      endShape(CLOSE);
    }
  }

  // =====================================================================
  //                      MIDDLE PATTERNS (Animated)
  // =====================================================================
  displayMiddleAnimated(p) {
    if (p <= 0) return;

    let patCol = this.middleCol; // Use stable color

    switch (this.middlePatternType) {
      case 0:
        this.drawMiddleConcentricDotsPattern(patCol, p);
        break;
      case 1:
        this.drawMiddleUshapePattern(patCol, p);
        break;
      case 2:
        this.drawMiddleSolidRings(patCol, p);
        break;
      case 3:
        this.drawMiddleConcentricRings(patCol, p);
        break;
    }
  }

  // Pattern 0: Concentric dots
  // small version of drawOuterDotsPattern
  drawMiddleConcentricDotsPattern(col, p) {
    let dotSize = this.r * 0.04;
    for (let r = this.r * 0.2;
         r < this.r * 0.5 * p; // 'p' controls max radius (Range)
         r += dotSize * 1.5) {

      let count = floor((TWO_PI * r) / (dotSize * 1.5));
      for (let i = 0; i < count; i++) {
        let angle = (TWO_PI / count) * i;
        this.drawIrregularBlob(r, angle, dotSize, col);
      }
    }
  }

  // Pattern 1: U-shape symbols
  // Represents a person sitting in Indigenous art
  drawMiddleUshapePattern(col, p) {
    noFill();
    stroke(col);
    strokeWeight(this.r * 0.02);
    let count = 8; // The total number of U-shapes to draw.
    let r     = this.r * 0.35; // The radius of the orbit (the circle) on which the U-shapes will be placed.
    let maxCount = count * p; // 'p' controls how many (Number)
    for (let i = 0; i < maxCount; i++) {
      let angle = (TWO_PI / count) * i;
      // Calculate the angle for this specific shape's position around the circle.
      // (e.g., 0, 45, 90, 135 degrees...)
      push();
      rotate(angle);
      translate(r, 0);
      rotate(PI / 2);
      // arc() draws a semicircle from angle 0 to PI (180 degrees), creating a U-shape.
      arc(0, 0, this.r * 0.15, this.r * 0.15, 0, PI);
      pop();
    }
  }

  // Pattern 2: Solid rings
  drawMiddleSolidRings(col, p) {
    noFill();
    stroke(col);
    strokeWeight(this.r * 0.01);
    
    // This pattern uses color from the constructor, not a new random one
    this.drawHandDrawnCircle(this.r * 0.45 * p, null, col, null); // 'p' controls radius (Radius size)

    let col2 = this.middleCol; // Use stable color
    this.drawHandDrawnCircle(this.r * 0.3 * p, null, col2, null); // 'p' controls radius (Radius size)
  }

  // Pattern 3: Concentric rings
  drawMiddleConcentricRings(col, p) {
    noFill();
    stroke(col);

    let baseStrokeWeight = this.r * 0.01;
    let numRings = 5; // The total number of concentric rings to draw.

    for (let j = 0; j < numRings; j++) {
      let currentRadius = map(
        j,
        0, numRings - 1,
        this.r * 0.3,
        this.r * 0.5
      );
      currentRadius *= p; // 'p' controls radius (Radius size)
      strokeWeight(baseStrokeWeight * random(0.8, 1.2));
      beginShape();
      let points = 25;
      for (let i = 0; i <= points; i++) {
        let angle  = (TWO_PI / points) * i;
        let jitter = random(-this.r * 0.025, this.r * 0.025);
        let radius = currentRadius + jitter;
        curveVertex(cos(angle) * radius,
                    sin(angle) * radius);
      }
      endShape(CLOSE);
    }
  }

  // =====================================================================
  //                      INNER PATTERNS (Animated)
  // =====================================================================
  displayInnerAnimated(p) {
    if (p <= 0) return;

    // Inner background circle is always drawn first
    this.drawHandDrawnCircle(this.r * 0.25 * p, // 'p' controls radius (Radius size)
                             this.innerBaseColor,
                             null, 0);

    let patCol = this.innerCol;

    if (this.innerPatternType === 0) {
      // Simple large blob (central “eye” or core)
      this.drawIrregularBlob(0, 0, this.r * 0.15 * p, patCol); // 'p' controls size (Radius size)
    } else {
      // Spiral line pattern
      noFill();
      stroke(patCol);
      strokeWeight(this.r * 0.015);
  
      // Here we again use beginShape() + curveVertex() to build a spiral-like
      // path, applying the same hand-drawn curve technique to the inner core.
      beginShape();
      let total = floor(50 * p); // 'p' controls length of spiral (Number/Range)
      for (let i = 0; i < total; i++) {
        let r = map(i, 0, 50, 0, this.r * 0.2);
        let angle = i * 0.4;
        curveVertex(cos(angle) * r, sin(angle) * r);
      }
      endShape();
    }
  }
}

// ======================================================================
// =========================== SETUP / DRAW =============================
// ======================================================================
//
// The core p5.js lifecycle: setup() runs once, draw() runs every frame.
// We initialise canvas size, colour palettes, layout and network data in
// setup(), then animate background, lines and circles in draw().
//
function setup() {
  // Use minimum dimension to ensure a square aspect ratio
  let size = min(windowWidth, windowHeight);
  createCanvas(size, size);


  // --- 1. Colour palette system (Aboriginal-inspired style) ---
  globalBgColor = color(30, 20, 15); // Deep, dark earth background

  circleBasePalette = [
    color(90, 40, 20),   // (Red Ochre)
    color(60, 30, 15),   // (Deep Earth)
    color(40, 45, 35),   // (Bush Green)
    color(110, 60, 30),  // (Burnt Orange)
    color(20, 20, 20)    // (Charcoal)
  ];

  patternPalette = [
    color(255, 255, 255), // (Ceremony White)
    color(255, 240, 200), // (Cream)
    color(255, 215, 0),   // (Sun Yellow)
    color(255, 140, 80),  // (Bright Ochre)
    color(160, 180, 140), // (Sage)
    color(200, 200, 210)  // (Ash)
  ];
  // 2. Initial Layout and Animation Setup
  // Runs once to create all circles and pre-calculate line segments
  createFixedLayout();
  prepareNetworkLines();
}

function draw() {
  // --- Animation Loop Control ---
  // Calculate a master progress value 'masterP' that loops.
  // It goes 0 -> 1 (expand) and then 1 -> 0 (contract).
  let now = millis();
  let halfLoop = globalLoopDuration / 2;
  let timeInLoop = now % globalLoopDuration;
  
  let masterP;
  if (timeInLoop < halfLoop) {
    // Phase 1: Expanding (0 -> 1)
    masterP = map(timeInLoop, 0, halfLoop, 0, 1);
  } else {
    // Phase 2: Contracting (1 -> 0)
    masterP = map(timeInLoop, halfLoop, globalLoopDuration, 1, 0);
  }
  
  // Apply easing for a smoother, more organic motion
  masterP = easeInOutCubic(masterP);

  background(globalBgColor);

  // 1. Background texture
  // Draw random white dots that fill the canvas to create atmosphere
  drawBackgroundDots();

  // 2. Connection layer (animated “songlines”)
  // Pass masterP to animate them (grow and shrink)
  drawNetworkLines(masterP); 

  // 3. Main circle layer – animated inner → middle → outer
  // Iterate through all circle objects and call their display method
  for (let c of circles) {
    c.display(masterP); // Pass masterP to animate each circle
  }
}

// Easing function for smooth 0 -> 1 -> 0 transition.
// This function makes the animation start and end slowly,
// which feels more natural than a linear (constant speed) change.
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}