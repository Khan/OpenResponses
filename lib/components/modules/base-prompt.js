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
    editable: boolean,
    data: Data,
    query: any,
    onChange: (newData: Data) => void,
  },
) => {
  const children = Array.isArray(props.children)
    ? props.children
    : [props.children];
  return (
    <div className={css(styles.promptContainer)}>
      {children.map((child, index) => {
        const dataHandlingProps = child.props.dataKey
          ? {
              data: props.data[child.props.dataKey],
              onChange: newValue => {
                props.onChange({
                  ...props.data,
                  [child.props.dataKey]: newValue,
                });
              },
            }
          : {};

        if (!child) return null;
        return React.cloneElement(child, {
          ...props,
          children: undefined,
          ...child.props,
          key: index,
          ...dataHandlingProps,
        });
      })}
    </div>
  );
};

const styles = StyleSheet.create({
  promptContainer: {
    width: 464,
    marginTop: 32,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: 92,
  },
});
