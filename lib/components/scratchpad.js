import React from "react";
import { css, StyleSheet } from "aphrodite";

import ScratchpadCanvas from "./scratchpad-canvas";
import ScratchpadToolbar from "./scratchpad-toolbar";
import sharedStyles from "../styles.js";

export default class Scratchpad extends React.Component {
  constructor(props) {
    super(props);
    this.state = { color: "black" };
  }
  render = () => (
    <div className={css(styles.container)}>
      <div className={css(styles.toolbarContainer)}>
        <ScratchpadToolbar
          onChangeColor={color => this.setState({ color: color })}
        />
      </div>
      <div className={css(styles.canvasContainer)}>
        <ScratchpadCanvas
          width={this.props.width}
          height={this.props.height}
          color={this.state.color}
        />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },

  canvasContainer: {
    borderRadius: sharedStyles.borderRadius,
    backgroundColor: "#f0f8f9",
    overflow: "hidden",
  },

  toolbarContainer: {
    position: "absolute",
    bottom: 0,
    left: -36,
  },
});
