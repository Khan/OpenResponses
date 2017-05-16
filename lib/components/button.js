// Mostly adapted from webapp.
/**
 * Button component.
 *
 * The goal of this component is to make a button which feels really good on
 * mobile and desktop.  Mobile browsers make a lot of assumptions as to what
 * makes a good button which we need to work around using JavaScript.  The one
 * drawback of this approach is that we need to wait for JavaScript to load
 * before we get a better button experience.
 */

const React = require("react");
const { StyleSheet, css } = require("aphrodite");
const { PropTypes } = React;

const globalStyles = require("../styles.js");
const { colors } = globalStyles;

const childrenType = React.PropTypes.oneOfType([
  React.PropTypes.arrayOf(React.PropTypes.node),
  React.PropTypes.node,
]);

class Button extends React.Component {
  static propTypes = {
    children: childrenType,

    disabled: PropTypes.bool,

    href: PropTypes.string,

    onClick: PropTypes.func,

    // used for constructing segmented buttons in which one side
    // of button may be flat and other may be rounded
    shape: PropTypes.oneOf(["STANDARD", "RIGHT", "LEFT", "CENTER"]),

    // Aphrodite style rule or array of rules.
    // Specifies the press style for the button.  Please use the
    // static helper functions:
    //  - createOutlineButtonStyle
    //  - createSolidButtonStyle
    //  - extendButtonStyle
    pressStyle: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.any),
      PropTypes.any,
    ]),

    // Aphrodite style rule or array of rules.
    // Specifies the hover style for the button.  Please use the
    // static helper functions:
    //  - createOutlineButtonStyle
    //  - createSolidButtonStyle
    //  - extendButtonStyle
    hoverStyle: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.any),
      PropTypes.any,
    ]),

    // Aphrodite style rule or array of rules.
    // For proper hover/press state handling across desktop and mobile
    // you must specify a separate style via the 'pressStyle' prop.  Do
    // not rely on ':hover'.
    style: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.any),
      PropTypes.any,
    ]),

    type: PropTypes.oneOf(["PRIMARY", "SECONDARY"]),

    width: PropTypes.number,
  };

  static defaultProps = {
    disabled: false,
    type: "PRIMARY",
    shape: "STANDARD",
  };

  // TODO(kevinb) change to Symbol() w/ React 15+
  static PRIMARY = "PRIMARY";
  static SECONDARY = "SECONDARY";

  state = {
    // This flag is used to hide focus when the user focuses the button
    // with a tap or mouse click.  This flag is set on touchstart and
    // mousedown and is disabled on blur.
    hideFocus: false,

    // This flag represents press state on mobile and press state on
    // desktop.
    pressed: false,

    // This flag represents hover state, which is only ever relevant on desktop.
    hover: false,
  };

  handleClick = e => {
    const { disabled, href, onClick } = this.props;

    if (!disabled && !href && onClick) {
      onClick(e);
    }

    // HACK(kevinb) Browser event handling (or rather simulation) is
    // ridiculous.  If a user on mobile taps one button and then taps
    // another button, the second tap results in the following events:
    //   - touchstart
    //   - touchend
    //   - mouseleave
    //   - mouseenter
    //   - click
    // TODO(kevinb) make this better by tracking which element we're
    // waiting for a click on.
    //
    // Why don't we just prevent the default browser behavior instead of
    // working around it?  Preventing default will stop the browser from
    // scrolling the page on mobile when the user drags on a button which
    // would be a bigger issue to deal with.
    this.waitingForClick = false;
  };

  handleTouchStart = e => {
    this.setState({ pressed: true });
    this.setState({ hideFocus: true });
  };

  handleTouchEnd = e => {
    // TODO(kevinb) trigger onClick handler on touchend, but only if the
    // touch hasn't moved a certain threshold in a certain amount of time.
    // Or just import fastclick.
    this.setState({ pressed: false });
    this.waitingForClick = true;
  };

  // The reason why we don't use :hover pseudo styles is that mobiles
  // browsers do the wrong thing.  They keep applying the :hover state to
  // the element even after the user has lifted their finger.  It's easier
  // to workaround this by not using :hover pseudo styles and instead use
  // event handlers to simulate hover state.
  handleMouseEnter = e => {
    // Prevent hover state on disabled elements.
    if (!this.waitingForClick && !this.props.disabled) {
      this.setState({ hover: true, pressed: e.buttons !== 0 });
    }
  };

  handleMouseLeave = e => {
    if (!this.waitingForClick) {
      this.setState({ hover: false, pressed: false });
    }
  };

  handleMouseDown = e => {
    this.setState({ pressed: !this.props.disabled, hideFocus: true });
  };

  handleBlur = e => {
    this.setState({ hideFocus: false });
  };

  render() {
    const {
      disabled,
      href,
      pressStyle,
      hoverStyle,
      shape,
      style,
      type,
      width,
      ...otherProps
    } = this.props;

    const {
      hideFocus,
      pressed,
      hover,
    } = this.state;

    const styleOverrides = pressed
      ? pressStyle || style
      : hover ? hoverStyle || style : style;

    const rules = [styles.common];

    if (disabled) {
      rules.push(styles[type].disabled);
    } else if (pressed) {
      rules.push(styles.press[type].default);
    } else if (hover) {
      rules.push(styles.hover[type].default);
    } else {
      rules.push(styles[type].default);
    }

    if (shape === "CENTER") {
      rules.push(styles.center);
    } else if (shape === "LEFT") {
      rules.push(styles.left);
    } else if (shape === "RIGHT") {
      rules.push(styles.right);
    }

    if (Array.isArray(styleOverrides)) {
      rules.push(...styleOverrides);
    } else {
      rules.push(styleOverrides);
    }

    // hideFocus must come last to override any custom focus style
    // defined by styleOverrides.
    if (hideFocus) {
      rules.push(styles.hideFocus);
    }

    const commonProps = {
      className: css(...rules),
      onBlur: this.handleBlur,
      onClick: this.handleClick,
      onMouseEnter: this.handleMouseEnter,
      onMouseLeave: this.handleMouseLeave,
      onMouseDown: this.handleMouseDown,
      onTouchStart: this.handleTouchStart,
      onTouchEnd: this.handleTouchEnd,
      style: { minWidth: width },
    };

    if (href) {
      // Use <a> for improved SEO.  Only useful when there's a real
      // href to navigate to.
      // TODO(kevinb) guard against fake hrefs, e.g. '#'
      return (
        <a href={disabled ? undefined : href} {...commonProps} {...otherProps}>
          {this.props.children}
        </a>
      );
    } else {
      // The reason why we don't use <a> for all buttons is that we want
      // to avoid users dragging on the button and seeing the browser
      // provide a draggable link to '#' or 'javascript:void(0);'.
      return (
        <button disabled={disabled} {...commonProps} {...otherProps}>
          {this.props.children}
        </button>
      );
    }
  }
}

const _createSolid = (color, textColor) => {
  return {
    backgroundColor: color,
    borderColor: color,
    color: textColor,
  };
};

const _createOutline = color => {
  return {
    backgroundColor: "transparent",
    borderColor: color,
    color: color,
  };
};

/**
 * @param {String} hexColor color sextet, leading '#' is permissible.
 * @param {Number} alpha value between 0.0 and 1.0.
 * @returns {String} HTML rgba color string.
 */
const hexToRGBA = (hexColor, alpha) => {
  const int = parseInt(hexColor.replace("#", ""), 16);
  const r = (int & 0xff0000) >> 16;
  const g = (int & 0x00ff00) >> 8;
  const b = (int & 0x0000ff) >> 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * @param {String} hexColor color sextet, leading '#' is permissible.
 * @param {Number?} alpha value between 0.0 and 1.0.  Default is 0.5.
 * @returns {Object} focus ring style fragment.
 */
const createFocus = (hexColor, alpha = 0.5) => {
  return {
    boxShadow: `0px 0px 4px 4px ${hexToRGBA(hexColor, alpha)}`,
    outline: "none",
  };
};

const createButtonStyle = (style, focus) => {
  return {
    ...style,
    ":hover": { ...style },
    ":focus": focus,
  };
};

/**
 * @param {String} color hex sextet
 * @param {Object?} focus style fragment to use when button is focused.
 *
 * focus is a separate arg so that we can specific a focus that is based ona
 * different color for the button's current color.  This is particularly useful
 * for press states.
 */
const createSolidStyle = (
  color,
  focus = createFocus(color),
  textColor = "white",
) => {
  return createButtonStyle(_createSolid(color, textColor), focus);
};

const createOutlineStyle = (color, focus = createFocus(color)) => {
  return createButtonStyle(_createOutline(color), focus);
};

const styles = StyleSheet.create({
  common: {
    // font/sizing
    fontFamily: "inherit",
    fontWeight: "bold",
    fontSize: 15,
    lineHeight: "18px",
    padding: "10px 16px", // 18 + 16 + 16 = 40 (height)
    height: 40,

    display: "inline-block",
    flexShrink: 0,
    whiteSpace: "nowrap", // don't allow multi-line butotns

    // border
    borderRadius: 4,
    borderStyle: "solid",
    borderWidth: 1,
    boxSizing: "border-box",

    MozAppearance: "none",
    WebkitAppearance: "none",
    WebkitTapHighlightColor: "transparent",

    cursor: "pointer",
    userSelect: "none",

    textAlign: "center",
    textDecoration: "none",
    ":hover": {
      textDecoration: "none",
    },
  },
  left: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  right: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  center: {
    borderRadius: 0,
  },
  hideFocus: {
    ":focus": {
      boxShadow: "none",
      outline: "none",
    },
  },
});

const disabledStyle = {
  cursor: "default",
};

styles.PRIMARY = StyleSheet.create({
  disabled: { ...createSolidStyle(colors.gray76), ...disabledStyle },
  default: createSolidStyle(colors["open-responses"].domain1),
});

styles.SECONDARY = StyleSheet.create({
  disabled: { ...createOutlineStyle(colors.gray76), ...disabledStyle },
  default: createSolidStyle(colors["open-responses"].domain1),
});

styles.press = {};

styles.press.PRIMARY = StyleSheet.create({
  default: createSolidStyle(colors["open-responses"].domain3),
});

styles.press.SECONDARY = StyleSheet.create({
  default: createSolidStyle(colors["open-responses"].domain3),
});

styles.hover = {};

styles.hover.PRIMARY = StyleSheet.create({
  default: createSolidStyle(colors["open-responses"].domain2),
});

styles.hover.SECONDARY = StyleSheet.create({
  default: createSolidStyle(colors["open-responses"].domain2),
});

Button.createFocus = createFocus;
Button.createSolidStyle = createSolidStyle;
Button.createOutlineStyle = createOutlineStyle;

/**
 * Extend an existing button style object with additional style properties.
 *
 * Notes:
 *  - When extending styles for buttons with press styles, both the basic style
 *    and the press/hover style should be extended.
 *  - Do not use aphrodite rules with this functions.
 *  - Do not include ':hover' or ':focus' pseudo classes in styles.
 *
 * @param {Object} buttonStyle
 * @param {Object} customStyle
 * @returns {Object}
 */
Button.extendButtonStyle = (buttonStyle, customStyle) => {
  const newStyle = {
    ...buttonStyle,
    ...customStyle,
  };
  // Since mobile browsers don't handle hover state correctly we use the same
  // custom style when the element is in :hover and we handle switching to
  // the press state on hover ourselves.
  Object.assign(newStyle[":hover"], customStyle);
  return newStyle;
};

module.exports = Button;
