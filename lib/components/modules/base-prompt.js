// @flow
import { StyleSheet, css } from "aphrodite";
import React from "react";
import type { Children } from "react";

import sharedStyles from "../../styles.js";

// TODO(andy): Use some Flow fanciness to constrain data types by-component.
type Data = {
  [key: string]: any,
};

export default (
  props: {
    children: Children,
    ready: boolean,
    data: Data,
    onChange: (newData: Data) => void,
  },
) => {
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children];
  return (
    <div className={css(styles.promptContainer)}>
      {children.map((child, index) => {
        if (!child) return null;
        if (child.props.dataKey) {
          return React.cloneElement(child, {
            ...child.props,
            ready: props.ready,
            data: props.data[child.props.dataKey],
            key: index,
            onChange: newValue => {
              props.onChange({
                ...props.data,
                [child.props.dataKey]: newValue,
              });
            },
          });
        } else {
          return child;
        }
      })}
    </div>
  );
};

const styles = StyleSheet.create({
  promptContainer: {
    width: 507,
    marginTop: 32,
    marginLeft: "auto",
    marginRight: "auto",
  },
});
