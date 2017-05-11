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
  static defaultProps = {
    data: [],
  };

  constructor(props) {
    super(props);
    this.state = { selectedItems: [] };
  }

  onToggleGridItem = (id: number) => {
    const existingIndex = this.props.data.indexOf(id);
    let newSelectedItems = null;
    if (existingIndex !== -1) {
      newSelectedItems = [
        ...this.props.data.slice(0, existingIndex),
        ...this.props.data.slice(existingIndex + 1),
      ];
    } else {
      newSelectedItems = [...this.props.data, id];
    }
    this.props.onChange(newSelectedItems);
  };

  render() {
    if (!this.props.responseData) {
      return null;
    }
    return (
      <div className={css(styles.grid)}>
        {this.props.responseData.map(({ key, data }) => (
          <div
            className={css(
              styles.gridItem,
              this.props.data.indexOf(key) !== -1
                ? styles.selectedGridItem
                : undefined,
              this.state.highlightKey === key
                ? styles.highlightedGridItem
                : undefined,
            )}
            key={key}
            onMouseDown={e => {
              this.setState({ highlightKey: key });
              e.preventDefault();
            }}
            onMouseUp={e => {
              this.setState({ highlightKey: null });
              e.preventDefault();
            }}
            onClick={e => {
              this.onToggleGridItem(key);
              e.preventDefault();
            }}
          >
            <div className={css(styles.scratchpadWrapper)}>
              <ScratchpadPlayer
                data={data}
                query={this.props.query}
                width={canvasSize.w}
                height={canvasSize.h}
                toolSet={toolSet}
                hideBorder={true}
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

const elementsPerRow = 3;

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
    padding: 10,
    borderRight: "1px solid rgba(0,0,0,0.1)",
    borderBottom: "1px solid rgba(0,0,0,0.1)",

    [`:nth-child(-n+${elementsPerRow})`]: {
      paddingTop: 0,
    },
    [`:nth-child(${elementsPerRow}n-2)`]: {
      paddingLeft: 0,
    },
    [`:nth-child(${elementsPerRow}n)`]: {
      borderRight: "none",
    },
    [`:nth-last-child(-n+${elementsPerRow})`]: {
      borderBottom: "none",
    },
  },

  selectedGridItem: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },

  highlightedGridItem: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },

  scratchpadWrapper: {
    width: canvasSize.w * scaleFactor,
    height: canvasSize.h * scaleFactor,
    transform: `scale(${scaleFactor}, ${scaleFactor})`,
    transformOrigin: "0 0",
  },
});
