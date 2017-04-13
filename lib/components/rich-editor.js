// @flow
import { StyleSheet, css } from "aphrodite/no-important"; // Gotta dynamically override Aphrodite styles.
import Portal from "react-portal";
import React from "react";
import Slate, { Editor, Plain, Raw } from "slate";

import sharedStyles from "../styles.js";

const schema = {
  marks: {
    bold: props => <strong>{props.children}</strong>,
    code: props => <code>{props.children}</code>,
    italic: props => <em>{props.children}</em>,
    underlined: props => <u>{props.children}</u>,
  },
};

type Props = {
  data: any, // TODO(andy): wrap Slate's types, I guess
  dataKey: string,
};

export default class RichEditor extends React.Component {
  static defaultProps = {
    data: Raw.serialize(Plain.deserialize(""), { terse: true }),
  };

  constructor(props) {
    super(props);
    Slate.resetKeyGenerator();
    this.state = { state: Raw.deserialize(props.data, { terse: true }) };
  }

  componentDidUpdate = () => {
    this.updateMenu();
  };

  hasMark = type => {
    const { state } = this.state;
    return state.marks.some(mark => mark.type == type);
  };

  onChange = state => {
    this.setState({ state });
    // TODO(andy): Throttle.
    this.props.onChange(Raw.serialize(state));
  };

  onClickMark = (event, type) => {
    event.preventDefault();
    let { state } = this.state;

    state = state.transform().toggleMark(type).apply();

    this.setState({ state });
  };

  onOpen = portal => {
    this.setState({ menu: portal.firstChild });
  };

  render = () => {
    return (
      <div>
        {this.renderMenu()}
        {this.renderEditor()}
      </div>
    );
  };

  onKeyDown = (event, data, state) => {
    if (!data.isMod) return;
    let mark;

    switch (data.key) {
      case "b":
        mark = "bold";
        break;
      case "i":
        mark = "italic";
        break;
      case "u":
        mark = "underlined";
        break;
      case "`":
        mark = "code";
        break;
      default:
        return;
    }

    state = state.transform().toggleMark(mark).apply();

    event.preventDefault();
    return state;
  };

  renderMenu = () => {
    return (
      <Portal isOpened onOpen={this.onOpen}>
        <div className={css(styles.menu)}>
          {this.renderMarkButton("bold", "B")}
          {this.renderMarkButton("italic", "I")}
          {this.renderMarkButton("underlined", "U")}
          {this.renderMarkButton("code", "</>")}
        </div>
      </Portal>
    );
  };

  renderMarkButton = (type, label) => {
    const isActive = this.hasMark(type);
    const onMouseDown = e => this.onClickMark(e, type);

    return (
      <span
        className={css(styles.menuButton)}
        onMouseDown={onMouseDown}
        data-active={isActive}
      >
        <span>{label}</span>
      </span>
    );
  };

  renderEditor = () => {
    const editorState = this.state.isBlurred
      ? this.props.data
      : this.state.state;
    return (
      <div className={css(styles.editor)}>
        <Editor
          schema={schema}
          state={editorState}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
        />
      </div>
    );
  };

  /**
   * Update the menu's absolute position.
   */
  updateMenu = () => {
    const { menu, state } = this.state;
    if (!menu) return;

    if (state.isBlurred || state.isCollapsed) {
      menu.removeAttribute("style");
      return;
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    menu.style.opacity = 1;
    menu.style.top = `${rect.top + window.scrollY - menu.offsetHeight}px`;
    menu.style.left = `${rect.left + window.scrollX - menu.offsetWidth / 2 + rect.width / 2}px`;
  };
}

const styles = StyleSheet.create({
  editor: {
    ...sharedStyles.typography.bodySmall,
    borderColor: sharedStyles.colors.gray85,
    borderWidth: 1,
    borderRadius: 4,
    borderStyle: "solid",
    padding: 10,
  },

  menu: {
    paddingBottom: 6,
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 8,
    position: "absolute",
    zIndex: 1,
    top: -10000,
    left: -10000,
    marginTop: -6,
    opacity: 0,
    backgroundColor: sharedStyles.colors.gray17,
    borderRadius: 4,
    transition: "opacity 0.75s",
  },

  menuButton: {
    color: sharedStyles.colors.gray76,
    display: "inline-block",

    ":not(:first-child)": {
      marginLeft: 15,
    },

    "[data-active='true']": {
      color: sharedStyles.colors.white,
    },
  },
});
