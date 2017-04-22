// @flow

import Pointable from "react-pointable";
import React from "react";

const drawnStrokeFromTouchStroke = stroke => {
  const maxBrushWidth = 5;
  const minBrushWidth = 2;
  const minBrushWidthVelocity = 30;
  let runningVelocity = 30;
  const velocitySmoothing = 0.2;
  const drawnSamples = [];
  for (
    let sampleIndex = 0;
    sampleIndex < stroke.samples.length;
    sampleIndex++
  ) {
    const sample = stroke.samples[sampleIndex];
    let currentVelocity;
    if (sampleIndex == 0) {
      currentVelocity = runningVelocity;
    } else {
      const lastSample = stroke.samples[sampleIndex - 1];
      const dx = sample.x - lastSample.x;
      const dy = sample.y - lastSample.y;
      currentVelocity = Math.sqrt(dx * dx + dy * dy);
    }
    runningVelocity = velocitySmoothing * runningVelocity +
      (1 - velocitySmoothing) * currentVelocity;

    drawnSamples.push({
      x: sample.x,
      y: sample.y,
      w: Math.min(
        maxBrushWidth,
        Math.max(
          minBrushWidth,
          (minBrushWidthVelocity - runningVelocity) /
            minBrushWidthVelocity *
            (maxBrushWidth - minBrushWidth) +
            minBrushWidth,
        ),
      ),
    });
  }

  return {
    color: stroke.color,
    strokeID: stroke.strokeID,
    samples: drawnSamples,
  };
};

const smoothedStrokeFromDrawnStroke = stroke => {
  // Quadratically interpolate between the samples.
  const smoothedSamples = stroke.samples.slice(0, 1);
  for (
    let sampleIndex = 2;
    sampleIndex < stroke.samples.length;
    sampleIndex++
  ) {
    const lastLastSample = stroke.samples[sampleIndex - 2];
    const lastSample = stroke.samples[sampleIndex - 1];
    const sample = stroke.samples[sampleIndex];

    const lastMidpointX = (lastSample.x + lastLastSample.x) / 2;
    const lastMidpointY = (lastSample.y + lastLastSample.y) / 2;
    const midpointX = (sample.x + lastSample.x) / 2;
    const midpointY = (sample.y + lastSample.y) / 2;

    const segmentPixelLength = 2;
    const midpointDistance = Math.sqrt(
      (midpointX - lastMidpointX) * (midpointX - lastMidpointX) +
        (midpointY - lastMidpointY) * (midpointY - lastMidpointY),
    );
    const interpolatedSegmentCount = Math.min(
      64,
      Math.max(Math.floor(midpointDistance / segmentPixelLength), 8),
    );
    let t = 0.0;
    const step = 1.0 / interpolatedSegmentCount;
    for (
      let segmentIndex = 0;
      segmentIndex < interpolatedSegmentCount;
      segmentIndex++
    ) {
      smoothedSamples.push({
        x: lastMidpointX * Math.pow(1 - t, 2) +
          lastSample.x * 2.0 * (1 - t) * t +
          midpointX * t * t,
        y: lastMidpointY * Math.pow(1 - t, 2) +
          lastSample.y * 2.0 * (1 - t) * t +
          midpointY * t * t,
        w: Math.pow(1 - t, 2) * ((lastSample.w + lastLastSample.w) / 2.0) +
          2.0 * (1 - t) * t * lastSample.w +
          t * t * ((sample.w + lastSample.w) / 2.0),
      });

      t += step;
    }
  }

  return { ...stroke, samples: smoothedSamples };
};

// TODO(andy): Define state and prop types

export default class ScratchpadCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tracking: false,
      smoothedStrokes: [],
      activeStroke: null,
      nextStrokeID: 0,
      strokeAnimations: {},
      displayScale: 1,
    };
    this.lastDrawnStroke = null;
  }

  onPointerDown = event => {
    event.target.setPointerCapture(event.pointerId);

    let newState = {
      tracking: true,
      activeStroke: {
        color: this.props.color,
        strokeID: this.state.nextStrokeID,
        samples: [],
      },
      nextStrokeID: this.state.nextStrokeID + 1,
    };
    newState.activeStroke = this.handleTouch(newState.activeStroke, event);
    this.setState(newState);
    // this.props.onStrokeStart(newState.activeStroke);
  };

  onPointerMove = event => {
    const newActiveStroke = this.handleTouch(this.state.activeStroke, event);
    // this.props.onStrokeMove({
    //   ...newActiveStroke,
    //   samples: [newActiveStroke.samples[newActiveStroke.samples.length - 1]],
    // });
    this.setState({ activeStroke: newActiveStroke });
  };

  onPointerUp = event => {
    const newActiveStroke = this.handleTouch(this.state.activeStroke, event);
    this.commitStroke(newActiveStroke);
    this.setState({ tracking: false });
    // this.props.onStrokeCommit({
    //   ...newActiveStroke,
    //   samples: [newActiveStroke.samples[newActiveStroke.samples.length - 1]],
    // });
  };

  handleTouch = (activeStroke, event) => {
    return {
      ...activeStroke,
      samples: [
        ...activeStroke.samples,
        {
          x: event.layerX,
          y: event.layerY,
          t: event.timeStamp,
        },
      ],
    };
  };

  commitStroke = stroke => {
    const drawnStroke = drawnStrokeFromTouchStroke(stroke);
    const smoothedStroke = smoothedStrokeFromDrawnStroke(drawnStroke);

    this.setState({
      activeStroke: null,
      smoothedStrokes: [...this.state.smoothedStrokes, smoothedStroke],
    });
  };

  clearCanvas = () => {
    const canvas = this.refs.canvas;
    const context = canvas.getContext("2d");
    context.clearRect(
      0,
      0,
      this.props.width * this.state.displayScale,
      this.props.height * this.state.displayScale,
    );
  };

  renderStrokes = () => {
    const canvas = this.refs.canvas;
    const context = canvas.getContext("2d");
    context.setTransform(
      this.state.displayScale,
      0,
      0,
      this.state.displayScale,
      0,
      0,
    );
    context.lineCap = "round";

    // TODO(andy): will eventually need facilities to do a full clear and rerender here.
    const drawStroke = (stroke, lastDrawnStroke) => {
      context.strokeStyle = stroke.color;

      let initialOffset = 0;
      if (
        lastDrawnStroke &&
        lastDrawnStroke.strokeID === stroke.strokeID &&
        lastDrawnStroke.samples.length < stroke.samples.length
      ) {
        // NOTE(andy): Assuming here that the prefix samples all match exactly, and that appends are the only legal update operation for a given stroke ID. This assumption will save us some extra checks and also code complexity here, but it may need to change later.
        initialOffset = lastDrawnStroke.samples.length;
      }
      const drawnStroke = drawnStrokeFromTouchStroke(stroke);
      const smoothedStroke = smoothedStrokeFromDrawnStroke(drawnStroke);
      const samples = smoothedStroke.samples;
      for (
        let segmentIndex = initialOffset;
        segmentIndex < samples.length - 1;
        segmentIndex++
      ) {
        const segmentA = samples[segmentIndex];
        const segmentB = samples[segmentIndex + 1];
        context.beginPath();
        context.moveTo(segmentA.x, segmentA.y);
        context.lineTo(segmentB.x, segmentB.y);
        context.lineWidth = (segmentA.w + segmentB.w) / 2.0;
        context.stroke();
      }
    };
    if (this.state.activeStroke) {
      drawStroke(this.state.activeStroke, this.lastDrawnStroke);
      this.lastDrawnStroke = this.state.activeStroke;
    }
  };

  componentDidMount = () => {
    this.setState({ displayScale: window.devicePixelRatio });
    this.clearCanvas();
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (
      this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height ||
      this.state.displayScale !== prevState.displayScale
    ) {
      this.clearCanvas();
    }

    // TODO(andy): Do some more conservative check here before re-rendering.
    this.renderStrokes();
  };

  render = () => (
    <Pointable
      onPointerDown={this.onPointerDown}
      onPointerMove={this.state.tracking ? this.onPointerMove : null}
      onPointerUp={this.state.tracking ? this.onPointerUp : null}
    >
      <canvas
        ref="canvas"
        width={this.props.width * this.state.displayScale}
        height={this.props.height * this.state.displayScale}
        style={{
          width: this.props.width,
          height: this.props.height,
        }}
      />
    </Pointable>
  );
}
