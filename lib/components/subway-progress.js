import React from "react";
import Tooltip from "rc-tooltip";
import { css, StyleSheet } from "aphrodite";

import mediaQueries from "../media-queries";
import sharedStyles from "../styles";

import "rc-tooltip/assets/bootstrap.css";

const SubwaySegment = ({
  isLeftmost,
  isFilled,
  label,
  tooltip,
  onClick,
}: {
  isLeftmost: boolean,
  isFilled: boolean,
  label: string,
  tooltip: any,
  onClick: ?() => any,
}) => {
  const leftStyles = [];
  if (isLeftmost) {
    leftStyles.push(styles.leftCap);
    if (isFilled) {
      leftStyles.push(styles.leftCapFilled);
    } else {
      leftStyles.push(styles.leftCapUnfilled);
    }
  } else {
    leftStyles.push(styles.leftUnarrow);
    if (isFilled) {
      leftStyles.push(styles.leftUnarrowFilled);
    } else {
      leftStyles.push(styles.leftUnarrowUnfilled);
    }
  }
  return (
    <Tooltip
      placement="bottom"
      trigger={["hover"]}
      overlay={<div className={css(styles.tooltip)}>{tooltip}</div>}
      overlayClassName={css(styles.tooltipOverlay)}
    >
      <div
        className={css(styles.segment)}
        style={{ cursor: onClick ? "pointer" : "not-allowed" }}
        onClick={onClick}
      >
        <div className={css(...leftStyles)} />
        <div
          className={css(
            styles.segmentInterior,
            isFilled
              ? styles.segmentInteriorFilled
              : styles.segmentInteriorUnfilled,
          )}
        >
          {label}
        </div>
        <div
          className={css(
            styles.arrow,
            isFilled ? styles.arrowFilled : styles.arrowUnfilled,
          )}
        />
      </div>
    </Tooltip>
  );
};

const SubwayProgress = ({
  stage,
  partnerCount,
  onClickStage,
}: {
  stage: number,
  partnerCount: number,
  onClickStage: ("write" | "react" | "revise") => any,
}) => (
  <div className={css(styles.container)}>
    <SubwaySegment
      isLeftmost
      isFilled={stage > 0}
      label="Write"
      tooltip="First, write a response to the original prompt."
      onClick={() => onClickStage("write")}
    />
    <SubwaySegment
      label="React"
      isFilled={stage > 1}
      tooltip={`Second, write replies to ${partnerCount} classmates' responses.`}
      onClick={stage > 0 ? () => onClickStage("react") : null}
    />
    <SubwaySegment
      label="Revise"
      isFilled={stage > 2}
      tooltip={"Finally, use what youʼve learned to revise your own work."}
      onClick={stage > 1 ? () => onClickStage("revise") : null}
    />
  </div>
);

export default SubwayProgress;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    padding: 10,
  },

  segment: {
    display: "flex",
    flexGrow: 1,
    marginRight: -7,
    [":last-of-type"]: {
      marginRight: 0,
    },
  },

  segmentInterior: {
    flexGrow: 1,
    ...sharedStyles.wbTypography.labelLarge,
    textAlign: "center",
    userSelect: "none",
  },

  segmentInteriorFilled: {
    backgroundColor: sharedStyles.wbColors.productGreen,
    color: sharedStyles.wbColors.white,
    paddingTop: 9,
  },

  segmentInteriorUnfilled: {
    borderTop: `2px solid ${sharedStyles.wbColors.productGreen}`,
    borderBottom: `2px solid ${sharedStyles.wbColors.productGreen}`,
    color: sharedStyles.wbColors.productGreen,
    paddingTop: 7,
  },

  leftCap: {
    width: 4,
    height: 40,
    backgroundSize: "4px 40px",
    backgroundRepeat: "no-repeat",
  },

  leftCapFilled: {
    backgroundImage: "url('/static/subway/subway-left-cap-filled.png')",
  },

  leftCapUnfilled: {
    backgroundImage: "url('/static/subway/subway-left-cap-unfilled.png')",
  },

  leftUnarrow: {
    width: 16,
    height: 40,
    backgroundSize: "16px 40px",
    backgroundRepeat: "no-repeat",
  },

  leftUnarrowFilled: {
    backgroundImage: "url('/static/subway/subway-left-unarrow-filled.png')",
  },

  leftUnarrowUnfilled: {
    backgroundImage: "url('/static/subway/subway-left-unarrow-unfilled.png')",
  },

  arrow: {
    width: 17,
    height: 40,
    backgroundSize: "17px 40px",
    backgroundRepeat: "no-repeat",
  },

  arrowFilled: {
    backgroundImage: "url('/static/subway/subway-right-arrow-filled.png')",
  },

  arrowUnfilled: {
    backgroundImage: "url('/static/subway/subway-right-arrow-unfilled.png')",
  },

  tooltip: {
    ...sharedStyles.wbTypography.labelSmall,
    color: sharedStyles.wbColors.white,
    maxWidth: 150,
    textAlign: "center",
  },

  tooltipOverlay: {
    minHeight: "unset",
  },
});
