# Creative Coding Major Project
Qianqian's individual part
## How to Interact with the Work
My artwork is created **a time-based animated** in p5.js.
There is **no mouse or keyboard interaction required**. 
Each refresh will present different colors and patterns.
# My Individual Approach to Animation
I selected **time-based animation** for my individual project.
Based on my conceptual inspiration (see below), I hope to use code to present the process in which things grow slowly over time.
## Visual Inspiration
My animation inspiration comes from time-lapse videos of plant growth [Inspiration Video](https://youtu.be/5ahgRYIXUus?si=KsOHmxrZRTbmo4fS)

Seed germination ![Inspiration Picture](./assets/001.jpg) Seed growth![Inspiration Picture](./assets/002.jpg) Seed maturity![Inspiration Picture](./assets/003.jpg)
The video shows the process of a seed sprouting and unfolding its leaves in stages. I incorporated this natural growth rhythm into my animation production. The circles presented in sequence from the inside to the center and then to the outside symbolize the process of life sprouting from the soil to maturity. The extension of the connecting lines over time symbolizes the gradual growth of roots and stems during the plant's growth process. Meanwhile, I want to reproduce the process of the tribal culture's prosperity and development over time through this natural growth rhythm.
### Part1: The animation of the main circular pattern
Each circle in my artworks is composed of three generating layers: **Inner layer、Middle layer、Outer layer**.

In the original group code, these layers are static and are drawn immediately. In my personal version, I set the growth time and duration for each layer of the circle. To present an effect similar to **plant germination**: the circle grows from the seed (inside) into a fully developed shape (outside).
### Part2: Line animations connecting circles
In the original group code, the lines connecting the circles are static. I set them to start drawing from different times and extend from the starting point to the ending point as time changes.
## Technical Overview
I introduced a time-based system into the group code by giving each circle and each line its own animation schedule.

* Track animation time: millis() [Code Source](https://p5js.org/reference/p5/millis/)
* Gradually draw lines and shapes: lerp()
* Proportional growth variables (p = t/duration)
## Key Techniques
* Layered Time Control: Each layer of the circle has its own duration.
* Use Lerp to achieve the growth of connection lines
## External Code / Techniques:
I used these concepts commonly found in p5.js animations:
* Time-based animation using millis()
* Lerp-based line growth
These methods are general p5.js animation approaches.
# References & Acknowledgments
* Used p5.js documentation for millis() to support ripple fading and colour selection.
* The main code is derived from classroom materials. 