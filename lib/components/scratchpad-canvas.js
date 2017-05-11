// @flow

import Pointable from "react-pointable";
import React from "react";

import scratchpadTools from "./scratchpad-tools";
import ScratchpadRenderer from "./scratchpad-renderer";
import { smoothedStrokeFromTouchStroke } from "./scratchpad-inking";

// TODO(andy): Define state and prop types

export default class ScratchpadCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      smoothedStrokes: (props.strokes || [])
        .map(touchStroke =>
          smoothedStrokeFromTouchStroke(touchStroke, scratchpadTools)),
      activeStroke: null,
    };
  }

  onPointerDown = event => {
    event.target.setPointerCapture(event.pointerId);

    let newState = {
      // TODO(andy): consider extracting this initial stroke instance
      activeStroke: {
        color: this.props.color,
        tool: this.props.tool,
        samples: [],
      },
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
      activeStroke: null,
      smoothedStrokes: [
        ...this.state.smoothedStrokes,
        smoothedStrokeFromTouchStroke(newActiveStroke, scratchpadTools),
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
          smoothedStrokeFromTouchStroke(touchStroke, scratchpadTools)),
      });
    }
  };

  render = () => {
    const effectiveStrokes = this.state.activeStroke
      ? [
          ...this.state.smoothedStrokes,
          smoothedStrokeFromTouchStroke(
            this.state.activeStroke,
            scratchpadTools,
          ),
        ]
      : this.state.smoothedStrokes;
    return (
      <Pointable
        onPointerDown={this.props.editable ? this.onPointerDown : null}
        onPointerMove={this.state.activeStroke ? this.onPointerMove : null}
        onPointerUp={this.state.activeStroke ? this.onPointerUp : null}
      >
        <ScratchpadRenderer
          width={this.props.width}
          height={this.props.height}
          strokes={effectiveStrokes}
          toolSet={scratchpadTools}
        />
      </Pointable>
    );
  };
}
