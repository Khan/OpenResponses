import Document, { Head, Main, NextScript } from "next/document";
import { StyleSheetServer } from "aphrodite";

export default class AphroditeDocument extends Document {
  static async getInitialProps({ renderPage }) {
    const { html, css } = StyleSheetServer.renderStatic(() => renderPage());
    return { ...html, css };
  }

  render() {
    const shouldEnableRaven = nodeEnvironment === "production";
    return (
      <html>
        <Head>
          <title>Open-ended Responses</title>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css"
          />
          <link rel="stylesheet" href="/_next/static/style.css" />
          <script src="https://code.jquery.com/pep/0.4.2/pep.js" />
          <script
            src="https://cdn.ravenjs.com/3.15.0/raven.min.js"
            crossorigin="anonymous"
          />
          {shouldEnableRaven ? (
            <script
              dangerouslySetInnerHTML={{
                __html: `Raven.config("${sentryDSN}").install(); window.onunhandledrejection = function(evt) { Raven.captureException(evt.reason); };`,
              }}
            />
          ) : null}
          <style dangerouslySetInnerHTML={{ __html: this.props.css.content }} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
          />
          <style>
            {`
              html, body {
                margin: 0;
              }
              * {
                // font-family: Proxima Nova, Helvetica, sans-serif;
              }
              `}
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
