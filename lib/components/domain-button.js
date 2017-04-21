// @flow
// Mostly adapted from webapp.

import React, { Children, Component } from "react";

import Button from "./button";
import { colors } from "../styles";

export type ButtonSize = "xsmall" | "small" | "default" | "large";

export type ButtonCorners =
  | "top"
  | "left"
  | "bottom"
  | "right"
  | "topLeft"
  | "topRight"
  | "bottomRight"
  | "bottomLeft"
  | "all"
  | "none";

export default class DomainButton extends Component {
  static defaultProps = {
    domain: "default",
    juicy: false,
  };

  props: {
    children?: Children,

    width?: number | string,
    size?: ButtonSize,
    corners?: ButtonCorners,

    type?: "primary" | "secondary",
    disabled?: boolean,
    domain: string,
    juicy: boolean,

    href?: string,
    onClick?: (e: SyntheticEvent) => void,
  };

  render() {
    const { children, domain, juicy, ...rest } = this.props;
    const domainColors = colors[domain] || colors.default;

    const props = {
      ...rest,
      color: juicy ? domainColors.domain1 : domainColors.domain3,
      hoverColor: juicy ? domainColors.domain3 : domainColors.domain4,
    };

    return (
      <Button {...props}>
        {children}
      </Button>
    );
  }
}
