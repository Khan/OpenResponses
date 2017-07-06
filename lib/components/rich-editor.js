// @flow
import { StyleSheet, css } from "aphrodite/no-important"; // Gotta dynamically override Aphrodite styles.
import Portal from "react-portal";
import React from "react";
import Slate, { Editor, Plain, Raw } from "slate";

import sharedStyles from "../styles.js";

const schema = {
  marks: {
    bold: props =>
      <strong>
        {props.children}
      </strong>,
    code: props =>
      <code>
        {props.children}
      </code>,
    italic: props =>
      <em>
        {props.children}
      </em>,
    underlined: props =>
      <u>
        {props.children}
      </u>,
  },
};

type Props = {
  data: any, // TODO(andy): wrap Slate's types, I guess
  dataKey: string,
  placeholder: ?string,
  quotedWork: ?boolean,
  onChange: any => void,
};

type State = {
  menu: ?HTMLElement,
  isFocused: boolean,
  state: any, // TODO(andy): wrap Slate's types
};

const dataKind = "rich-editor";

export default class RichEditor extends React.Component {
  static defaultProps = {
    data: {
      kind: dataKind,
      rawData: JSON.stringify(
        Raw.serialize(Plain.deserialize(""), { terse: true }),
      ),
    },
  };

  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    Slate.resetKeyGenerator();
    this.state = {
      state: this.getEditorStateFromProps(props),
      menu: null,
      isFocused: false,
    };
  }

  componentWillReceiveProps = (nextProps: Props) => {
    if (!this.state.isFocused) {
      this.setState({ state: this.getEditorStateFromProps(nextProps) });
    }
  };

  getEditorStateFromProps = (props: Props) => {
    const { kind, rawData } = props.data;
    if (kind !== dataKind) {
      console.error(`Unexpected data kind in ${props.data}`);
    }
    return Raw.deserialize(JSON.parse(rawData), { terse: true });
  };

  componentDidUpdate = () => {
    this.updateMenu();
  };

  hasMark = (type: string) => {
    const { state } = this.state;
    return state.marks.some(mark => mark.type == type);
  };

  // TODO(andy): Wrap Slate's type.
  onChange = (state: any) => {
    this.setState({ state });
    // TODO(andy): Throttle.
    const serializedState = Raw.serialize(state);
    const data = {
      kind: dataKind,
      rawData: JSON.stringify(serializedState),
    };
    this.props.onChange(data);
  };

  onClickMark = (event: Event, type: string) => {
    event.preventDefault();
    let { state } = this.state;

    state = state.transform().toggleMark(type).apply();

    this.setState({ state });
  };

  onFocus = () => {
    this.setState({ isFocused: true });
  };

  onBlur = () => {
    this.setState({ isFocused: false });
  };

  onOpen = (portal: HTMLDivElement) => {
    const menu = portal.firstChild;
    this.setState({ menu: (portal.firstChild: any) });
  };

  onKeyDown = (even: KeyboardEvent, data: any, state: any) => {
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
        </div>
      </Portal>
    );
  };

  renderMarkButton = (type: string, label: string) => {
    const isActive = this.hasMark(type);
    const onMouseDown = e => this.onClickMark(e, type);

    return (
      <span
        className={css(styles.menuButton)}
        onMouseDown={onMouseDown}
        data-active={isActive}
      >
        <span>
          {label}
        </span>
      </span>
    );
  };

  render = () => {
    const editorState = this.state.isBlurred
      ? this.props.data
      : this.state.state;

    return (
      <div
        className={css(
          styles.editorContainer,
          (this.props.editable || this.props.inManagerInterface) &&
          !this.props.quotedWork
            ? styles.editorContainerEditable
            : styles.editorContainerUneditable,
          this.state.isFocused ? styles.editorContainerFocused : undefined,
        )}
      >
        {this.renderMenu()}
        <Editor
          schema={schema}
          state={editorState}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          readOnly={!this.props.editable || this.props.quotedWork}
          placeholder={this.props.placeholder}
          className={css(
            this.props.editable && !this.props.quotedWork
              ? styles.editorEditable
              : undefined,
          )}
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
    menu.style.opacity = "1";
    menu.style.top = `${rect.top + window.scrollY - menu.offsetHeight}px`;
    menu.style.left = `${rect.left +
      window.scrollX -
      menu.offsetWidth / 2 +
      rect.width / 2}px`;
  };
}

const styles = StyleSheet.create({
  editorContainer: {
    ...sharedStyles.typography.bodySmall,
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
  },

  editorContainerEditable: {
    ...sharedStyles.hairlineBorderStyle,
  },

  editorContainerUneditable: {
    backgroundColor: sharedStyles.colors.gray95,
    color: sharedStyles.colors.gray41,
    padding: "19px 23px",
  },

  editorContainerFocused: {
    borderColor: sharedStyles.colors["open-responses"].domain1,
    borderWidth: 1,
    boxShadow: "inset 0px 1px 3px rgba(0, 0, 0, 0.25)",
    padding: 11.5,
  },

  editorEditable: {
    minHeight: 170,
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

  placeholder: {
    color: sharedStyles.colors.gray68,
  },
});
