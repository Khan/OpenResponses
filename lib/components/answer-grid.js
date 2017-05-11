// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Image from "./image";
import ScratchpadPlayer from "./scratchpad-player";

import type { ToolSet } from "./scratchpad-tools";

const canvasSize = { w: 807, h: 612 };
const scaleFactor = 0.385; // 3 up
// const scaleFactor = 0.594; // 2 up
// const scaleFactor = 0.385; // 3 up
// const scaleFactor = 0.285; // 4 up

const toolSet = {
  pen: {
    compositeOperation: "source-over",
    brush: {
      brushType: "constant",
      brushWidth: 4,
    },
  },
  eraser: {
    compositeOperation: "destination-out",
    brush: {
      brushType: "constant",
      brushWidth: 70,
    },
  },
};

export default class AnswerGrid extends React.Component {
  render() {
    if (!this.props.data) {
      return null;
    }
    return (
      <div className={css(styles.grid)}>
        {this.props.data.map((response, i) => (
          <div className={css(styles.gridItem)} key={i}>
            <div className={css(styles.scratchpadWrapper)}>
              <ScratchpadPlayer
                data={response}
                query={this.props.query}
                width={canvasSize.w}
                height={canvasSize.h}
                toolSet={toolSet}
              >
                {" "}<Image path="cheerios/cheerios_cropped.jpg" />
              </ScratchpadPlayer>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  grid: {
    // backgroundColor: "rgba(0, 0, 0, 0.02)",
    display: "flex",
    flexWrap: "wrap",
    position: "absolute",
    left: 0,
    right: 0,
    margin: "0 auto",
    width: 1000,
    marginBottom: 32,
  },

  gridItem: {
    marginRight: 18,
    marginBottom: 18,
    borderRadius: 4,
    border: "1px solid #f0f8f9",
  },

  scratchpadWrapper: {
    width: canvasSize.w * scaleFactor,
    height: canvasSize.h * scaleFactor,
    transform: `scale(${scaleFactor}, ${scaleFactor})`,
    transformOrigin: "0 0",
  },
});
