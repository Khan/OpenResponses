// @flow

import Pointable from "react-pointable";
import React from "react";

import ScratchpadRenderer from "./scratchpad-renderer";
import scratchpadTools from "./scratchpad-tools";

// TODO(andy): extract to pure module
const drawnStrokeFromTouchStroke = stroke => {
  const {
    slowBrushWidth,
    fastBrushWidth,
    fastBrushWidthVelocity,
  } = scratchpadTools[stroke.tool];

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
        slowBrushWidth,
        Math.max(
          fastBrushWidth,
          (fastBrushWidthVelocity - runningVelocity) /
            fastBrushWidthVelocity *
            (slowBrushWidth - fastBrushWidth) +
            fastBrushWidth,
        ),
      ),
    });
  }

  return {
    color: stroke.color,
    tool: stroke.tool,
    strokeID: stroke.strokeID,
    samples: drawnSamples,
  };
};

// TODO(andy): extract to pure module
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

const smoothedStrokeFromTouchStroke = touchStroke => {
  const drawnStroke = drawnStrokeFromTouchStroke(touchStroke);
  const smoothedStroke = smoothedStrokeFromDrawnStroke(drawnStroke);
  return smoothedStroke;
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
    };
  }

  onPointerDown = event => {
    event.target.setPointerCapture(event.pointerId);

    let newState = {
      tracking: true,
      // TODO(andy): consider extracting this initial stroke instance
      activeStroke: {
        color: this.props.color,
        tool: this.props.tool,
        strokeID: this.state.nextStrokeID,
        samples: [],
      },
      nextStrokeID: this.state.nextStrokeID + 1,
    };
    newState.activeStroke = this.handleTouch(newState.activeStroke, event);
    this.setState(newState);
  };

  onPointerMove = event => {
    const newActiveStroke = this.handleTouch(this.state.activeStroke, event);
    this.setState({ activeStroke: newActiveStroke });
  };

  onPointerUp = event => {
    const newActiveStroke = this.handleTouch(this.state.activeStroke, event);
    const newStrokes = this.commitStroke(newActiveStroke);

    this.setState({
      tracking: false,
      activeStroke: null,
      smoothedStrokes: [
        ...this.state.smoothedStrokes,
        smoothedStrokeFromTouchStroke(newActiveStroke),
      ],
    });
    this.props.onChange(newStrokes);
  };

  handleTouch = (activeStroke, event) => {
    const layerRect = event.target.getBoundingClientRect();
    // TODO(andy): consider extracting this data manipulation
    return {
      ...activeStroke,
      samples: [
        ...activeStroke.samples,
        {
          x: event.clientX - layerRect.left,
          y: event.clientY - layerRect.top,
          t: event.timeStamp,
        },
      ],
    };
  };

  // TODO(andy): extract data manipulation to a pure module
  commitStroke = stroke => {
    let inkLength = 0;
    for (
      let sampleIndex = 1;
      sampleIndex < stroke.samples.length;
      sampleIndex++
    ) {
      const sampleA = stroke.samples[sampleIndex - 1];
      const sampleB = stroke.samples[sampleIndex];
      const dx = sampleB.x - sampleA.x;
      const dy = sampleB.y - sampleB.y;
      inkLength += Math.sqrt(dx * dx + dy * dy);
    }
    return [...this.props.strokes, { ...stroke, inkLength }];
  };

  componentWillReceiveProps = (nextProps: Props) => {
    // Here we assume that no in-place change is possible. This is a reasonable assumption... for now.
    if (nextProps.strokes.length !== this.props.strokes.length) {
      this.setState({
        smoothedStrokes: nextProps.strokes.map(touchStroke =>
          smoothedStrokeFromTouchStroke(touchStroke)),
      });
    }
  };

  render = () => {
    const effectiveStrokes = this.state.activeStroke
      ? [
          ...this.state.smoothedStrokes,
          smoothedStrokeFromTouchStroke(this.state.activeStroke),
        ]
      : this.state.smoothedStrokes;
    return (
      <Pointable
        onPointerDown={this.onPointerDown}
        onPointerMove={this.state.tracking ? this.onPointerMove : null}
        onPointerUp={this.state.tracking ? this.onPointerUp : null}
      >
        <ScratchpadRenderer
          width={this.props.width}
          height={this.props.height}
          strokes={effectiveStrokes}
        />
      </Pointable>
    );
  };
}
