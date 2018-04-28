import React from "react";
import Tooltip from "rc-tooltip";
import { css, StyleSheet } from "aphrodite";

import ImageButton from "./image-button";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

import "rc-tooltip/assets/bootstrap.css";

export default class ConfidencePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  render() {
    const { onSelectConfidence, children } = this.props;
    return (
      <React.Fragment>
        <Tooltip
          trigger="click"
          placement="topLeft"
          visible={this.state.visible}
          onVisibleChange={visible => this.setState({ visible })}
          overlay={
            <div className={css(styles.container)}>
              <p className={css(styles.prompt)}>
                How confident are you about your response?
              </p>
              <div className={css(styles.buttonRow)}>
                {Array(4)
                  .fill(0)
                  .map((dummy, index) => (
                    <ImageButton
                      imageURL={`/static/confidence-icons/${index}.png`}
                      imageWidth={48}
                      imageHeight={48}
                      onClick={() => {
                        this.setState({ visible: false });
                        onSelectConfidence(index);
                      }}
                    />
                  ))}
              </div>
              <p className={css(styles.subtitle)}>
                Only you and your teacher can see this answer.
              </p>
            </div>
          }
        >
          {children}
        </Tooltip>
        <style jsx>{`
          :global(.rc-tooltip) {
            opacity: 1;
          }

          :global(.rc-tooltip-inner) {
            background-color: ${sharedStyles.wbColors.offBlack};
          }

          :global(.rc-tooltip-arrow) {
            border-top-color: ${sharedStyles.wbColors.offBlack};
          }
        `}</style>
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },

  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  prompt: {
    ...sharedStyles.wbTypography.labelLarge,
    color: sharedStyles.wbColors.white,
    marginTop: 8,
  },

  subtitle: {
    ...sharedStyles.wbTypography.labelSmall,
    color: sharedStyles.wbColors.offWhite,
    marginBottom: 8,
    opacity: 0.8,
  },
});
