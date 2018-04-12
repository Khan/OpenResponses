import { diffWordsWithSpace } from "diff";
import { css, StyleSheet } from "aphrodite";

import sharedStyles from "./styles";
import { share } from "rxjs/operator/share";

const stripTags = input => {
  return input.replace(/<\/p>/g, "\n\n").replace(/<[^>]*>/g, "");
};

export default (baseHTML, updatedHTML) => {
  const strippedBase = stripTags(baseHTML);
  const strippedUpdated = stripTags(updatedHTML);

  let output = "";
  let updatedHTMLIndex = 0;
  const diffs = diffWordsWithSpace(strippedBase, strippedUpdated);
  for (let diff of diffs) {
    if (diff.removed) {
      continue;
    }
    let hasAddedSpan = false;
    // iterate over diff length (not counting tags), copying
    let diffLength = diff.value.replace(/\n\n/g, "").length;
    while (diffLength > 0) {
      let newOutput;
      if (updatedHTML.charAt(updatedHTMLIndex) === "<") {
        // Skip ahead to matching >.
        const matchingIndex = updatedHTML.indexOf(">", updatedHTMLIndex);
        if (matchingIndex === -1) {
          throw `Invalid HTML: ${updatedHTML}`;
        }
        newOutput = updatedHTML.slice(updatedHTMLIndex, matchingIndex + 1);
      } else {
        if (!hasAddedSpan) {
          if (diff.added) {
            // insert <span>
            output += `<span class='${css(styles.highlight)}'>`;
          }
          hasAddedSpan = true;
        }
        newOutput = updatedHTML.charAt(updatedHTMLIndex);
        diffLength--;
      }
      output += newOutput;
      updatedHTMLIndex += newOutput.length;
    }
    // skip
    if (diff.added) {
      output += "</span>";
    }
  }
  return output;
};

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: `${sharedStyles.wbColors.productGold}40`,
  },
});
