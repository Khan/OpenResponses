// @flow
import { StyleSheet, css } from "aphrodite/no-important"; // Gotta dynamically override Aphrodite styles.
import { diffWordsWithSpace } from "diff";
import Portal from "react-portal";
import React from "react";
import Slate, { Mark } from "slate";
import { Editor } from "slate-react";
import Plain from "slate-plain-serializer";

import sharedStyles from "../../styles.js";

type Props = {
  data: any, // TODO(andy): wrap Slate's types, I guess
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
    },
  };

  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      state: this.getEditorStateFromProps(props),
      menu: null,
      isFocused: false,
    };

    this.schema = {
      marks: {
        bold: props => <strong>{props.children}</strong>,
        code: props => <code>{props.children}</code>,
        italic: props => <em>{props.children}</em>,
        underlined: props => <u>{props.children}</u>,
        changed: props => (
          <span style={{ backgroundColor: "rgba(253, 178, 30, 0.5)" }}>
            {props.children}
          </span>
        ),
      },
    };

    this.plugins = [
      {
        decorateNode: (text, node) => {
          if (!this.props.diffBase) {
            return;
          }

          const baseDocument = Slate.Value.fromJSON(
            JSON.parse(this.props.diffBase.rawData),
          ).document;
          const currentDocument = this.state.state.document;
          const diffs = diffWordsWithSpace(
            baseDocument.text,
            currentDocument.text,
          );

          let characters = text.characters.asMutable();

          let index = 0;
          const document = this.state.state.document;
          for (let diff of diffs) {
            if (diff.removed) {
              continue;
            }
            if (diff.added) {
              for (
                let characterIndex = index;
                characterIndex < index + diff.value.length;
                characterIndex++
              ) {
                const characterText = currentDocument.getTextAtOffset(
                  characterIndex,
                );
                if (characterText === text) {
                  const textNodeOffset = document.getOffset(text.key);
                  const textCharacterIndex = characterIndex - textNodeOffset;
                  let character = characters.get(textCharacterIndex);
                  let { marks } = character;
                  let mark = Mark.create({ type: "changed" });
                  marks = marks.add(mark);
                  character = character.merge({ marks });
                  characters.set(textCharacterIndex, character);
                }
              }
            }
            index += diff.value.length;
          }

          return characters.asImmutable();
        },
      },
    ];
  }

  stringifiedCurrentState = () => {
    return JSON.stringify(this.state.state.toJSON());
  };

  rawEditorStateStringFromProps = (props: Props) => {
    let effectiveProps = props;
    if (props && !props.data.rawData && props.initialData) {
      effectiveProps = { ...props, data: props.initialData };
    } else if (props && !props.data.rawData) {
      effectiveProps = {
        ...props,
        data: {
          ...props.data,
          rawData: JSON.stringify(Plain.deserialize("").toJSON()),
        },
      };
    }

    const { kind, rawData } = effectiveProps.data;
    if (kind !== dataKind) {
      console.error(`Unexpected data kind in ${effectiveProps.data}`);
    }
    return rawData;
  };

  componentWillReceiveProps = (nextProps: Props) => {
    const rawEditorStateString = this.rawEditorStateStringFromProps(nextProps);
    if (
      !this.state.isFocused &&
      this.stringifiedCurrentState() !== rawEditorStateString
    ) {
      this.setState({ state: this.getEditorStateFromProps(nextProps) });
    }
  };

  getEditorStateFromProps = (props: Props) => {
    const rawEditorStateString = this.rawEditorStateStringFromProps(props);
    return Slate.Value.fromJSON(JSON.parse(rawEditorStateString));
  };

  componentDidUpdate = () => {
    this.updateMenu();
  };

  hasMark = (type: string) => {
    const { state } = this.state;
    return state.marks.some(mark => mark.type == type);
  };

  // TODO(andy): Wrap Slate's type.
  onChange = (change: any) => {
    const { value } = change;

    this.setState({ state: value });
    const serializedState = value.toJSON();
    const stringifiedState = JSON.stringify(serializedState);
    const stringifiedCurrentState = this.stringifiedCurrentState();
    // State changes when e.g. selection changes, but we don't want to bother passing that along.
    if (stringifiedState !== stringifiedCurrentState) {
      const data = {
        kind: dataKind,
        rawData: stringifiedState,
      };
      this.props.onChange(data);
    }
  };

  onClickMark = (event: Event, type: string) => {
    event.preventDefault();
    let { state } = this.state;

    state = state
      .transform()
      .toggleMark(type)
      .apply();

    this.setState({ state });
  };

  onFocus = () => {
    this.setState({ isFocused: true });
    this.props.onFocus && this.props.onFocus();
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

    state = state
      .transform()
      .toggleMark(mark)
      .apply();

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
        <span>{label}</span>
      </span>
    );
  };

  render = () => {
    const editorState = this.state.state;

    return (
      <div
        className={css(
          styles.editorContainer,
          (this.props.editable || this.props.inManagerInterface) &&
          !this.props.quotedWork
            ? styles.editorContainerEditable
            : styles.editorContainerUneditable,
          this.props.inManagerInterface && this.props.quotedWork
            ? styles.editorContainerManagerQuotedWork
            : undefined,
          this.state.isFocused ? styles.editorContainerFocused : undefined,
        )}
      >
        {this.renderMenu()}
        <Editor
          onChange={this.onChange}
          value={editorState}
          schema={this.schema}
          plugins={this.plugins}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onKeyDown={this.onKeyDown}
          readOnly={!this.props.editable || this.props.quotedWork}
          placeholder={
            this.props.inManagerInterface ? undefined : this.props.placeholder
          }
          className={css(
            this.props.editable && !this.props.quotedWork
              ? styles.editorEditable
              : undefined,
          )}
          style={{ minHeight: this.props.minHeight }}
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
    ...sharedStyles.typography.bodyLarge,
  },

  editorContainerEditable: {},

  editorContainerUneditable: {},

  editorContainerFocused: {},

  editorContainerManagerQuotedWork: {
    opacity: 0.4,
  },

  editorEditable: {
    minHeight: "4em",
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
