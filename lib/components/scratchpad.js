import Measure from "react-measure";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import ScratchpadCanvas from "./scratchpad-canvas";
import ScratchpadToolbar from "./scratchpad-toolbar";
import sharedStyles from "../styles.js";

export default class Scratchpad extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      color: "black",
      dimensions: {
        width: -1,
        height: -1,
      },
    };
  }
  render = () => (
    <div className={css(styles.container)}>
      <div className={css(styles.toolbarContainer)}>
        <ScratchpadToolbar
          onChangeColor={color => this.setState({ color: color })}
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
