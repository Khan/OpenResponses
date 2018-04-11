import { css, StyleSheet } from "aphrodite";
import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import Modal from "react-modal";

import Button from "./button";
import Confetti from "./confetti/confetti";
import mediaQueries from "../media-queries";
import sharedStyles from "../styles";
import { createRectangle } from "./confetti/confetti-shapes";

class ConfettiRain extends React.Component {
  confetti = null;

  render() {
    return (
      <div className={css(styles.confettiRainContainer)}>
        <Confetti
          height={window.innerHeight}
          width={window.innerWidth}
          gravity={1100}
          spin={4}
          twist={20}
          emitDuration={3000}
          numParticles={window.innerWidth * window.innerHeight / 2500}
          spreadHorizontally={true}
          minSpeed={200}
          maxSpeed={600}
          minScale={1}
          maxScale={1}
          ref={node => {
            if (!node || this.confetti) {
              return;
            }

            this.confetti = node;
            this.confetti.startConfetti(window.innerWidth / 2, -50);
          }}
        />
      </div>
    );
  }
}

export default ({ isOpen, onRequestClose }) => (
  <Fragment>
    {isOpen && <ConfettiRain />}
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Congratulations Modal"
      className={css(styles.modal)}
      overlayClassName={css(styles.overlay)}
    >
      <div className={css(styles.topSection)}>
        <div className={css(styles.title)}>
          <span style={{ marginRight: 16 }}>🎉</span>You've finished the
          activity!
        </div>
        <p className={css(styles.body)}>
          That's all for the officially assigned portion of the activity.
        </p>
        <p className={css(styles.body)}>
          But if you'd like, you can continue to explore the rest of your
          class's responses.
        </p>
      </div>
      <div className={css(styles.bottomBar)}>
        <Button style={styles.button} onClick={onRequestClose}>
          Explore
        </Button>
      </div>
    </Modal>
  </Fragment>
);

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    width: 662,
    height: 360,
    marginLeft: -661 / 2,
    marginTop: -360 / 2,
    top: "50%",
    left: "50%",
    zIndex: 202,
    borderRadius: sharedStyles.borderRadius,
    backgroundColor: sharedStyles.wbColors.white,
    outline: "none",

    [mediaQueries.smOrSmaller]: {
      width: "100%",
      marginLeft: 0,
      marginTop: 0,
      left: 0,
      top: 0,
      height: "100%",
      bottom: 0,
      borderRadius: 0,
    },
  },

  overlay: {
    backgroundColor: sharedStyles.wbColors.secondaryBlack,
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
  },

  topSection: {
    paddingTop: 64,
    paddingLeft: 64,
    paddingRight: 64,
    paddingBottom: 32,

    [mediaQueries.smOrSmaller]: {
      padding: 16,
      paddingTop: 32,
    },
  },

  title: {
    ...sharedStyles.wbTypography.title,
    [mediaQueries.smOrSmaller]: {
      ...sharedStyles.wbTypography.titleMobile,
    },
  },

  body: {
    ...sharedStyles.wbTypography.body,
    marginTop: 16,
  },

  bottomBar: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    height: 72,
    borderTop: `1px solid ${sharedStyles.wbColors.hairline}`,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 16,
    boxSizing: "border-box",
  },

  button: {
    width: 138,
    [mediaQueries.smOrSmaller]: {
      width: "100%",
    },
  },

  confettiRainContainer: {
    position: "fixed",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 201,
  },
});
