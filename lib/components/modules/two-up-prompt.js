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
    data: any, // TODO(andy): better data types
    onChange: (newData: any) => void,
  },
) => (
  <div className={css(styles.twoUpPromptContainer)}>
    <div className={css(styles.referenceContainer)}>
      {props.referenceComponent}
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
    flex: 1,
    backgroundColor: sharedStyles.colors.gray90,
    overflow: "scroll",
    padding: 24,
  },
  basePromptContainer: {
    flex: 1,
    overflow: "scroll",
    padding: 24,
  },
});
