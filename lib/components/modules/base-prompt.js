// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
import type { Children } from "react";

import sharedStyles from "../../styles.js";

// TODO(andy): Use some Flow fanciness to constrain data types by-component.
type Data = {
  [key: string]: any
};

export default (
  props: { children: Children, data: Data, onChange: (newData: Data) => void }
) => (
  <div className={css(styles.promptContainer)}>
    {props.children.map((child, index) => {
      return React.cloneElement(child, {
        ...child.props,
        data: props.data[child.props.dataKey],
        key: index,
        onChange: newValue => {
          props.onChange({ ...props.data, [child.props.dataKey]: newValue });
        }
      });
    })}
  </div>
);

const styles = StyleSheet.create({
  promptContainer: {
    width: 494,
    marginLeft: "auto",
    marginRight: "auto"
  }
});
