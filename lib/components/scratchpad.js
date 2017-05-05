import Measure from "react-measure";
import React from "react";
import { css, StyleSheet } from "aphrodite/no-important";

import ScratchpadCanvas from "./scratchpad-canvas";
import ScratchpadToolbar from "./scratchpad-toolbar";
import sharedStyles from "../styles.js";

// TODO(andy): This and the other data-level stroke manipulation functions should get extracted to their own pure module.
const undoStroke = data => {};

const dataKind = "scratchpad";

const totalInkLengthForStrokes = strokes =>
  strokes.reduce((total, stroke) => total + stroke.inkLength, 0);

export default class Scratchpad extends React.Component {
  static defaultProps = {
    data: {
      kind: dataKind,
      strokes: JSON.stringify([]),
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
    const strokes = JSON.parse(this.props.data.strokes);
    if (strokes.length > 0) {
      this.onChange(strokes.slice(0, -1));
    }
  };

  onChange = newStrokes => {
    this.props.onChange({
      ...this.props.data,
      strokes: JSON.stringify(newStrokes),
      totalInkLength: totalInkLengthForStrokes(newStrokes),
    });
  };

  render = () => (
    <div
      className={css(styles.container)}
      style={{
        marginLeft: -(this.props.paddingLeft || this.props.paddingHorizontal),
        marginRight: -(this.props.paddingRight || this.props.paddingHorizontal),
      }}
    >
      {this.props.editable
        ? <div className={css(styles.toolbarContainer)}>
            <ScratchpadToolbar
              onChange={({ color, tool }) => this.setState({ color, tool })}
              onUndo={this.onUndo}
            />
          </div>
        : null}
      <div
        className={css(
          styles.canvasAndChildrenContainer,
          this.props.editable ? undefined : styles.canvasDisabled,
        )}
        style={{
          paddingBottom: this.props.paddingBottom,
        }}
      >
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
              editable={this.props.editable}
              onChange={this.onChange}
              strokes={JSON.parse(this.props.data.strokes)}
            />
          </div>
        </Measure>
        {this.props.children}
        {this.props.query.dotGrid
          ? <div className={css(styles.dotGrid)} />
          : null}
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

  canvasDisabled: {
    backgroundColor: null,
    border: "2px solid #f0f8f9",
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

  dotGrid: {
    position: "absolute",
    top: 24, // TODO(andy): DRY
    bottom: 24,
    left: 24,
    right: 24,
    backgroundImage: "url('static/dotgrid.png')",
    backgroundSize: 15,
    pointerEvents: "none",
  },
});
