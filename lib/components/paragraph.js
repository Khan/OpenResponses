// @flow
import { StyleSheet, css } from "aphrodite";
import MarkdownIt from "markdown-it";
import MarkdownItKaTeX from "markdown-it-katex";
import { Raw, Plain } from "slate";

import sharedStyles from "../styles.js";

const markdownIt = MarkdownIt();
markdownIt.use(MarkdownItKaTeX);

export default (props: { children: string }) => {
  // A bit of a hack: we may be displaying data from a prior response, in which case it's going to be serialized Slate data. We'll go ahead and deserialize that here.
  let contents = props.children;
  if (contents === undefined || Object.keys(contents).length === 0) {
    return null;
  } else if (typeof contents === "object" && contents.kind === "rich-editor") {
    // TODO(andy): extract this to rich-editor or a helper module; duplicative.
    const slateData = Raw.deserialize(JSON.parse(contents.rawData), {
      terse: true,
    });
    contents = Plain.serialize(slateData);
    // TODO: serialize to Markdown or HTML instead to preserve rich formatting.
  }
  return (
    <p
      className={css(styles.paragraph)}
      dangerouslySetInnerHTML={{
        __html: markdownIt.render(contents),
      }}
    />
  );
};

const styles = StyleSheet.create({
  paragraph: {
    ...sharedStyles.typography.bodySmall,
  },
});
