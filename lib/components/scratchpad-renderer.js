// @flow

import React from "react";

import scratchpadTools from "./scratchpad-tools";

export default class ScratchpadRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { displayScale: 1 };
  }

  clearCanvas = () => {
    const canvas = this.refs.canvas;
    const context = canvas.getContext("2d");
    context.clearRect(
      0,
      0,
      this.props.width * this.state.displayScale,
      this.props.height * this.state.displayScale,
    );

    context.setTransform(
      this.state.displayScale,
      0,
      0,
      this.state.displayScale,
      0,
      0,
    );
    context.lineCap = "round";
  };

  componentDidMount = () => {
    this.setState({
      displayScale: window.devicePixelRatio,
      context: this.refs.canvas.getContext("2d"),
    });
    this.clearCanvas();
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (
      this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height ||
      this.state.displayScale !== prevState.displayScale ||
      // If the number of strokes *hasn't* changed, we assume the only change is to the last stroke and that the change is safe to render incrementally. This is not a generally safe assumption, but it's safe in our context... so far.
      this.props.strokes.length !== prevProps.strokes.length
    ) {
      this.clearCanvas();
      for (const stroke of this.props.strokes) {
        this.drawStroke(stroke, null);
      }
    } else if (this.props.strokes.length > 0) {
      this.drawStroke(
        this.props.strokes[this.props.strokes.length - 1],
        prevProps.strokes[prevProps.length - 1],
      );
    }
  };

  drawStroke = (stroke, incrementalBaseStroke) => {
    const { context } = this.state;
    context.strokeStyle = stroke.color;
    context.globalCompositeOperation = scratchpadTools[
      stroke.tool
    ].compositeOperation;

    let initialOffset = 0;
    if (
      incrementalBaseStroke &&
      incrementalBaseStroke.samples.length < stroke.samples.length
    ) {
      // NOTE(andy): Assuming here that the prefix samples all match exactly, and that appends are the only legal update operation for a given stroke ID. This assumption will save us some extra checks and also code complexity here, but it may need to change later.
      initialOffset = incrementalBaseStroke.samples.length;
    }
    const samples = stroke.samples;
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

  render = () => (
    <canvas
      ref="canvas"
      width={this.props.width * this.state.displayScale}
      height={this.props.height * this.state.displayScale}
      style={{
        width: this.props.width,
        height: this.props.height,
      }}
    />
  );
}