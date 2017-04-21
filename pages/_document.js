import Document, { Head, Main, NextScript } from "next/document";
import { StyleSheetServer } from "aphrodite";

if (
  !!(typeof window !== "undefined" &&
    window.document &&
    window.document.createElement)
) {
  require("pepjs");
}

export default class AphroditeDocument extends Document {
  static async getInitialProps({ renderPage }) {
    const { html, css } = StyleSheetServer.renderStatic(() => renderPage());
    return { ...html, css };
  }

  render() {
    return (
      <html>
        <Head>
          <title>Open-ended Responses</title>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css"
          />
          <style dangerouslySetInnerHTML={{ __html: this.props.css.content }} />
          <style>
            {
              `
              body {
                margin: 0;
              }
              * {
                font-family: Proxima Nova, Helvetica, sans-serif;
              }
              `
            }
          </style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
