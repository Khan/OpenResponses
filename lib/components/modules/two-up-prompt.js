// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
import type { Component, Children } from "react";

import BasePrompt from "./base-prompt";
import sharedStyles from "../../styles.js";

export default (
  props: {
    referenceComponent: Component<any, any, any>,
    children: Children,
    editable: boolean,
    data: any, // TODO(andy): better data types
    onChange: (newData: any) => void,
  },
) => (
  <div className={css(styles.twoUpPromptContainer)}>
    <div className={css(styles.referenceContainer)}>
      <div className={css(styles.referenceInnerContainer)}>
        {props.referenceComponent}
      </div>
    </div>
    <div className={css(styles.basePromptContainer)}>
      <BasePrompt {...props} />
    </div>
  </div>
);

const styles = StyleSheet.create({
  twoUpPromptContainer: {
    display: "flex",
    width: "100%",
    height: "100vh",
  },
  referenceContainer: {
    backgroundColor: sharedStyles.colors.gray90,
    flex: 1,
    overflow: "scroll",
    padding: 24,
  },
  referenceInnerContainer: {
    maxWidth: 464,
    margin: "auto",
  },
  basePromptContainer: {
    flex: 1,
    overflow: "scroll",
    padding: 24,
  },
});
