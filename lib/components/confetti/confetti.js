// @flow
import React, { Component } from "react";

import {
  createCircle,
  createTriangle,
  createZigZag,
} from "./confetti-shapes.js";

import type { Particle, Shape } from "./types.js";

const random = (low: number, high: number) =>
  Math.random() * (high - low) + low;
const sample = (array: Array<Shape>): Shape =>
  array[Math.floor(random(0, array.length))];
const getDiameter = (width, height) =>
  Math.sqrt(width * width + height * height);

export type ConfettiProps = {
  // The width of the HTML canvas. No default value provided.
  width: number,
  // The height of the HTML canvas. No default value provided.
  height: number,

  // An array of shapes, used when generating particles
  // (each item provided has an equal chance of being selected as a
  // particle)
  shapes: Array<Shape>,

  // The number of particles to generate, spread over the
  // `emitDuration` length.
  numParticles: number,

  // The amount of downward acceleration to provide.
  // Range: 10 = very slow, 10,000 = very fast.
  gravity: number,
  // The amount of Z-axis (2D) rotation to provide to each particle.
  // Each particle has a random number specified, between 0 and n.
  // Range: 0 = no spin, 10 = reasonable spin, 100 = pukeville
  spin: number,
  // The amount of X-axis (3D) rotation to provide to each particle.
  // Each particle has a random number specified, between 0 and n.
  // Range: 0 = no twist, 10 = reasonable twist, 100 = hummingbird
  twist: number,

  // Each particle will have a random speed assigned, contained by
  // `minSpeed` and `maxSpeed`.
  // This is the base speed, which is affected by `gravity`.
  minSpeed: number,
  maxSpeed: number,
  // Each particle will have a random size applied, contained by
  // `minScale` and `maxScale`. If you'd like all particles to retain
  // their original size, simply provide `1` for both values.
  minScale: number,
  maxScale: number,

  // Amount of time to spread the release of particles, in milliseconds.
  emitDuration: number,
  // Whether or not to center the particles around the mouse location,
  // or to distribute them evenly horizontally.
  spreadHorizontally?: boolean,

  // Callback triggered when animation ends.
  // NOTE: Only fires when all particles are off-canvas. Retriggering
  // the confetti before it's completed will delay the handler.
  onComplete?: () => void,
};

class Confetti extends Component<ConfettiProps, {}> {
  props: ConfettiProps;

  /* eslint-disable react/sort-comp */
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Array<Particle> = [];
  _tickId: ?number;
  /* eslint-enable */

  static defaultProps = {
    shapes: [
      createZigZag({ fill: "#ca337c" }), // Pink
      createZigZag({ fill: "#01d1c1" }), // Turquoise
      createZigZag({ fill: "#f4d345" }), // Yellow
      createCircle({ fill: "#63d9ea" }), // Blue
      createCircle({ fill: "#ed5fa6" }), // Pink
      createCircle({ fill: "#aa87ff" }), // Purple
      createCircle({ fill: "#26edd5" }), // Turquoise
      createTriangle({ fill: "#ed5fa6" }), // Pink
      createTriangle({ fill: "#aa87ff" }), // Purple
      createTriangle({ fill: "#26edd5" }), // Turquoise
    ],
    numParticles: 80,
    gravity: 1600,
    spin: 20,
    twist: 0,
    minSpeed: 225,
    maxSpeed: 675,
    minScale: 0.4,
    maxScale: 1.0,
    // By default emit all particles at once.
    emitDuration: 0,
  };

  constructor(props) {
    super(props);
    if (typeof window !== "undefined") {
      this.pixelRatio = window.devicePixelRatio || 1;
    }
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext("2d");

    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  componentWillUnmount() {
    if (this._tickId) {
      window.cancelAnimationFrame(this._tickId);
    }
  }

  startConfetti = (clientX: number, clientY: number) => {
    this.start(clientX, clientY);
  };

  start = (clientX: number, clientY: number) => {
    if (this.props.shapes.length === 0) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    if (!this.particles.length) {
      this._tickId = window.requestAnimationFrame(this.tick);
    }

    for (let i = 0; i < this.props.numParticles; i++) {
      const speed = random(this.props.minSpeed, this.props.maxSpeed);

      // Select a random direction offset to be used.
      // Controls how far left/right a given piece will move from its
      // origin.
      const directionOffset = -Math.PI / 2 + 0.7 * random(-0.5, 0.5);

      const { front, back } = sample(this.props.shapes);

      this.particles.push({
        birth: Date.now() + random(0, this.props.emitDuration),
        x:
          cx +
          (this.props.spreadHorizontally ? random(-0.5, 0.5) * rect.width : 0),
        y: cy,
        spin: this.props.spin * random(-0.5, 0.5),
        twist: this.props.twist * random(-0.5, 0.5),
        angle: random(0, 2 * Math.PI),
        scale: random(this.props.minScale, this.props.maxScale),
        vx: Math.cos(directionOffset) * speed,
        vy: Math.sin(directionOffset) * speed,
        front,
        back,
        width: front.naturalWidth,
        height: front.naturalHeight,
      });
    }
  };

  tick = () => {
    const now = Date.now();
    const { height, width } = this.props;

    this.ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const age = (now - particle.birth) / 1000;
      // Skip a particle if it hasn't been born yet.
      if (age < 0) {
        continue;
      }

      const x = particle.x + particle.vx * age;
      const y =
        particle.y + particle.vy * age + this.props.gravity * age * age / 2;

      const diameter = getDiameter(
        particle.width * particle.scale,
        particle.height * particle.scale,
      );

      const isOffScreen =
        x + diameter < 0 || x - diameter > width || y - diameter > height;

      if (isOffScreen) {
        // Remove off-screen particles
        // TODO (josh): Mutating an array that is being iterated through
        // is risky business. Should be refactored.
        if (i === this.particles.length - 1) {
          this.particles.pop();
        } else {
          this.particles[i] = this.particles.pop();
          i--;
        }

        continue;
      }

      // Apply its new position, in terms of cartesian coordinates.
      this.ctx.translate(x, y);

      // Apply its new Z-axis (2D) rotation (how much spin is currently
      // applied?)
      const currentSpin = particle.angle + particle.spin * age;
      this.ctx.rotate(currentSpin);

      // Apply its new X-axis (3D rotation), and figure out whether it's
      // "backwards" right now.
      const twistAmount = particle.twist
        ? Math.cos(particle.angle + particle.twist * age)
        : 1;

      const imageElem = twistAmount >= 0 ? particle.front : particle.back;

      this.ctx.scale(twistAmount, 1);

      // Draw the image into the context, applying the right scale and
      // position so that it's in the right place.
      this.ctx.drawImage(
        imageElem,
        imageElem.naturalWidth * particle.scale * -0.5,
        imageElem.naturalHeight * particle.scale * -0.5,
        imageElem.naturalWidth * particle.scale,
        imageElem.naturalHeight * particle.scale,
      );

      // Undo all of our transformations, so that our context is restored.
      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }

    if (this.particles.length) {
      this._tickId = window.requestAnimationFrame(this.tick);
    } else {
      if (this.props.onComplete) {
        this.props.onComplete();
      }
    }
  };

  render() {
    const { height, width } = this.props;

    return (
      <canvas
        height={String(height * this.pixelRatio)}
        width={String(width * this.pixelRatio)}
        style={{ width, height }}
        ref={(node: HTMLCanvasElement) => (this.canvas = node)}
      />
    );
  }
}

export default Confetti;
