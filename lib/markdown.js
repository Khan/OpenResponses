// @flow
import MarkdownIt from "markdown-it";
import MarkdownItKaTeX from "markdown-it-katex";

const markdownIt = MarkdownIt({ breaks: true });
markdownIt.use(MarkdownItKaTeX);

markdownIt.renderer.rules["paragraph_open"] = (tokens, index, options, env) => {
  return `<p class="${env.paragraphClassName}">`;
};

export type Markdown = string;
export default (text: Markdown, paragraphClassName: string) =>
  markdownIt.render(text, { paragraphClassName });
