// @flow
import React from "react";
import { css, StyleSheet } from "aphrodite";

import Image from "./image";
import ScratchpadPlayer from "./scratchpad-player";

import type { ToolSet } from "./scratchpad-tools";

const toolSet = {
  pen: {
    compositeOperation: "source-over",
    brush: {
      brushType: "constant",
      brushWidth: 4,
    },
    subdivisionLength: 30,
  },
  eraser: {
    compositeOperation: "destination-out",
    brush: {
      brushType: "constant",
      brushWidth: 70,
    },
    subdivisionLength: 30,
  },
};

type Layout = "wide" | "narrow";

const scaleFactors = {
  wide: 0.385, // 3 up
  narrow: 0.34, // 2 up
};

// more wide scale factors:
// const scaleFactor = 0.594; // 2 up
// const scaleFactor = 0.385; // 3 up
// const scaleFactor = 0.285; // 4 up

export default class AnswerGrid extends React.Component {
  static defaultProps = {
    data: [],
    layout: "wide",
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
    const scaleFactor = scaleFactors[this.props.layout];
    return (
      <div
        className={css(
          styles.grid,
          this.props.layout === "wide" ? styles.wideGrid : styles.narrowGrid,
        )}
      >
        {this.props.responseData.map(({ key, data }) => (
          <div
            className={css(
              styles.gridItem,
              this.props.layout === "wide" ? styles.wideGridItem : undefined,
              this.props.data.indexOf(key) !== -1
                ? styles.selectedGridItem
                : undefined,
              this.state.highlightKey === key
                ? styles.highlightedGridItem
                : undefined,
            )}
            key={key}
            onMouseDown={
              this.props.editable
                ? e => {
                    this.setState({ highlightKey: key });
                    e.preventDefault();
                  }
                : null
            }
            onMouseUp={
              this.props.editable
                ? e => {
                    this.setState({ highlightKey: null });
                    e.preventDefault();
                  }
                : null
            }
            onClick={
              this.props.editable
                ? e => {
                    this.onToggleGridItem(key);
                    e.preventDefault();
                  }
                : null
            }
          >
            <div
              style={{
                width: this.props.width * scaleFactor,
                height: this.props.height * scaleFactor,
                transform: `scale(${scaleFactor}, ${scaleFactor})`,
                transformOrigin: "0 0",
              }}
            >
              <ScratchpadPlayer
                {...this.props}
                data={data}
                width={this.props.width}
                height={this.props.height}
                toolSet={toolSet}
                hideBorder={true}
                playing
              >
                {this.props.children}
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
    marginBottom: 32,
  },

  wideGrid: {
    width: 1000,
    position: "relative",
    marginLeft: "-50%",
  },

  narrowGrid: {
    justifyContent: "center",
  },

  gridItem: {
    padding: 10,
  },

  wideGridItem: {
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
});
