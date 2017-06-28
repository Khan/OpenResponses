// @flow
import { default as KeyPather } from "keypather";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import type { Children } from "react";

import sharedStyles from "../../styles.js";

const keypather = new KeyPather();

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
        let dataHandlingProps = {};
        if (child.props.dataKey) {
          dataHandlingProps = {
            data: keypather.get(props.data, child.props.dataKey),
            onChange: newValue => {
              const newData = { ...props.data };
              keypather.set(newData, child.props.dataKey, newValue);
              props.onChange(newData);
            },
          };
        }

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
    marginTop: 24,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: 92,
  },
});
