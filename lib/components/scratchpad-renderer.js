// @flow

import React from "react";

import type { ToolSet } from "./scratchpad-tools";

type Props = {
  strokes: any[], // TODO(andy): define stroke type
  width: number,
  height: number,
  toolSet: ToolSet,
};

type State = {
  displayScale: number,
};

export default class ScratchpadRenderer extends React.Component {
  context: ?CanvasRenderingContext2D = null;
  state: State = {
    displayScale: 1,
  };
  props: Props;

  redrawCanvas = (context: CanvasRenderingContext2D, displayScale: number) => {
    context.clearRect(
      0,
      0,
      this.props.width * displayScale,
      this.props.height * displayScale,
    );

    context.setTransform(displayScale, 0, 0, displayScale, 0, 0);
    context.lineCap = "round";

    for (const stroke of this.props.strokes) {
      this.drawStroke(context, stroke, null);
    }
  };

  componentWillMount = () => {
    if (typeof window === "object") {
      this.setState({ displayScale: window.devicePixelRatio });
    }
  };

  componentDidMount = () => {
    const context = this.refs.canvas.getContext("2d");
    this.context = context;
    this.redrawCanvas(context, this.state.displayScale);
  };

  componentDidUpdate = (prevProps: Props, prevState: State) => {
    if (!this.context) {
      throw "Reached componentDidUpdate before getting a context";
    }
    if (!(this.context instanceof CanvasRenderingContext2D)) {
      // The context becomes invalid during HMR.
      return;
    }

    if (
      this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height ||
      this.state.displayScale !== prevState.displayScale ||
      !this.props.strokes ||
      !prevProps.strokes ||
      // If the number of strokes *hasn't* changed, we assume the only change is to the last stroke and that the change is safe to render incrementally. This is not a generally safe assumption, but it's safe in our context... so far.
      (this.props.strokes.length !== prevProps.strokes.length &&
        this.props.strokes.length !== prevProps.strokes.length + 1) ||
      (this.props.strokes.length === prevProps.strokes.length &&
        this.props.strokes.length > 0 &&
        this.props.strokes[this.props.strokes.length - 1].samples.length <
          prevProps.strokes[prevProps.strokes.length - 1].samples.length)
    ) {
      if (this.props.strokes) {
        this.redrawCanvas(this.context, this.state.displayScale);
      }
    } else if (this.props.strokes.length > 0) {
      this.drawStroke(
        this.context,
        this.props.strokes[this.props.strokes.length - 1],
        prevProps.strokes[prevProps.strokes.length - 1],
      );
    }
  };

  drawStroke = (
    context: CanvasRenderingContext2D,
    stroke,
    incrementalBaseStroke,
  ) => {
    context.strokeStyle = stroke.color;
    context.globalCompositeOperation = this.props.toolSet[
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

    if (samples.length < 1) {
      return;
    }

    if (stroke.w) {
      // Constant width stroke
      context.beginPath();
      context.lineWidth = stroke.w;
      context.moveTo(samples[initialOffset].x, samples[initialOffset].y);
      for (
        let sampleIndex = initialOffset + 1;
        sampleIndex < samples.length - 1;
        sampleIndex++
      ) {
        context.lineTo(samples[sampleIndex].x, samples[sampleIndex].y);
      }
      context.stroke();
    } else {
      // Variable width stroke
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
    }
  };

  render = () => (
    <canvas
      ref="canvas"
      width={this.props.width * (this.state.displayScale || 1)}
      height={this.props.height * (this.state.displayScale || 1)}
      style={{
        width: this.props.width,
        height: this.props.height,
      }}
    />
  );
}
