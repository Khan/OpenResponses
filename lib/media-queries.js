// @flow
// yanked from webapp
/**
 * A default set of media queries to use for different screen sizes. Based on
 * the breakpoints from purecss.
 *
 * Use like:
 *   StyleSheet.create({
 *       blah: {
 *           [mediaQueries.xs]: {
 *
 *           },
 *       },
 *   });
 */

const {
  pureXsMax,
  pureSmMin,
  pureSmMax,
  pureMdMin,
  pureMdMax,
  pureLgMin,
  pureLgMax,
  pureXlMin,
} = require("./constants.js");

const unlabeledQueries = {
  xs: `@media screen and (max-width: ${pureXsMax})`,
  sm: `@media screen and (min-width: ${pureSmMin}) and ` +
    `(max-width: ${pureSmMax})`,
  md: `@media screen and (min-width: ${pureMdMin}) and ` +
    `(max-width: ${pureMdMax})`,
  lg: `@media screen and (min-width: ${pureLgMin}) and ` +
    `(max-width: ${pureLgMax})`,
  xl: `@media screen and (min-width: ${pureXlMin})`,

  xsOrSmaller: `@media screen and (max-width: ${pureXsMax})`,
  smOrSmaller: `@media screen and (max-width: ${pureSmMax})`,
  mdOrSmaller: `@media screen and (max-width: ${pureMdMax})`,
  lgOrSmaller: `@media screen and (max-width: ${pureLgMax})`,

  smOrLarger: `@media screen and (min-width: ${pureSmMin})`,
  mdOrLarger: `@media screen and (min-width: ${pureMdMin})`,
  lgOrLarger: `@media screen and (min-width: ${pureLgMin})`,
  xlOrLarger: `@media screen and (min-width: ${pureXlMin})`,
};

// HACK(mdr): Attach an inline comment to each media query to make it unique.
//
// Aphrodite accepts an object that maps keys (like media queries) to values
// (like the set of rules that we should apply under that media query). But the
// keys of a JS object are, by definition, unique. So, if we compute two media
// queries dynamically, and they happen to evaluate to the same string, they'll
// conflict. JS resolves key conflicts in object literals by discarding all but
// the last key-value pair, so some rules are thrown out before Aphrodite even
// gets the chance to see them - which means that those rules will never be
// applied! D: (This happened in the content library's FloatingSidebar.)
//
// We _could_ solve this problem by building a higher-level API to help us
// merge those two rule sets before passing them to Aphrodite. That'd be pretty
// sweet, but also nontrivial, so we're not going to do that right now.
//
// Instead, we just attach a unique comment string to each of the media queries
// in this file. That way, if another media query has the same constraints as
// one of these queries, their strings won't be identical, and they therefore
// won't conflict.
//
// It's legal to put inline comments just about anywhere in CSS, so just about
// any CSS parser should be satisfied - but we tested in all major supported
// browsers, just to be sure :)
const labeledQueries = {};
for (const name of Object.keys(unlabeledQueries)) {
  const unlabeledQuery = unlabeledQueries[name];
  const labeledQuery = `${unlabeledQuery} /* mediaQueries.${name} */`;
  labeledQueries[name] = labeledQuery;
}

module.exports = labeledQueries;
