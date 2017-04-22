import React from "react";
import { css, StyleSheet } from "aphrodite";

import ScratchpadCanvas from "./scratchpad-canvas";
import sharedStyles from "../styles.js";

export default class Scratchpad extends React.Component {
  render = () => (
    <div>
      <div className={css(styles.canvasContainer)}>
        <ScratchpadCanvas width={this.props.width} height={this.props.height} />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    borderRadius: sharedStyles.borderRadius,
    backgroundColor: "#f0f8f9",
  },
});
