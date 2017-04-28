import Measure from "react-measure";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import ScratchpadCanvas from "./scratchpad-canvas";
import ScratchpadToolbar from "./scratchpad-toolbar";
import sharedStyles from "../styles.js";

// TODO(andy): This and the other data-level stroke manipulation functions should get extracted to their own pure module.
const undoStroke = data => {};

export default class Scratchpad extends React.Component {
  static defaultProps = {
    // TODO: extract empty scratchpad instance
    data: {
      kind: "scratchpad",
      committedStrokes: JSON.stringify([]),
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      color: "black",
      tool: "pen",
      dimensions: {
        width: -1,
        height: -1,
      },
    };
  }

  onUndo = () => {
    // TODO(andy): This encoding/decoding stuff should not be spread across scratchpad and scratchpad-canvas. Probably the canvas should operate in terms of live objects, and this one in terms of strings.
    const committedStrokes = JSON.parse(this.props.data.committedStrokes);
    if (committedStrokes.length > 0) {
      // TODO(andy): Gotta recompute ink length. Oof.
      this.props.onChange({
        ...this.props.data,
        committedStrokes: JSON.stringify(committedStrokes.slice(0, -1)),
      });
    }
  };

  render = () => (
    <div className={css(styles.container)}>
      <div className={css(styles.toolbarContainer)}>
        <ScratchpadToolbar
          onChange={({ color, tool }) => this.setState({ color, tool })}
          onUndo={this.onUndo}
        />
      </div>
      <div className={css(styles.canvasAndChildrenContainer)}>
        <Measure
          onMeasure={dimensions => {
            this.setState({ dimensions });
          }}
        >
          <div className={css(styles.canvasContainer)}>
            <ScratchpadCanvas
              width={this.state.dimensions.width}
              height={this.state.dimensions.height}
              color={this.state.color}
              tool={this.state.tool}
              onChange={this.props.onChange}
              data={this.props.data}
            />
          </div>
        </Measure>
        {this.props.children}
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginBottom: 24,
  },

  canvasAndChildrenContainer: {
    borderRadius: sharedStyles.borderRadius,
    backgroundColor: "#f0f8f9",
    padding: 24,
  },

  canvasContainer: {
    position: "absolute",
    overflow: "hidden",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  toolbarContainer: {
    position: "absolute",
    bottom: 0,
    left: -36,
  },
});
