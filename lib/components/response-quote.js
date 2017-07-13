import { StyleSheet, css } from "aphrodite";

import RichEditor from "./rich-editor";
import RejectResponseButton from "./reject-response-button";

const ResponseQuote = props => {
  const effectiveShowRejectionButton =
    props.showsRejectionButton && props.editable;
  return (
    <div className={css(styles.container)}>
      <div
        className={
          effectiveShowRejectionButton
            ? css(styles.collapseEditorMargin)
            : undefined
        }
      >
        <RichEditor
          quotedWork
          data={props.data}
          inManagerInterface={props.inManagerInterface}
        />
      </div>
      {effectiveShowRejectionButton
        ? <RejectResponseButton
            dispatcher={props.dispatcher}
            revieweeIndex={props.revieweeIndex}
          />
        : null}
    </div>
  );
};

export default ResponseQuote;

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 24,
  },

  collapseEditorMargin: {
    marginBottom: -16,
  },
});
