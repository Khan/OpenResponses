import Head from "next/head";
import PageContainer from "../lib/components/neue/page-container";
import Prompt from "../lib/components/neue/prompt";
import React, { Fragment } from "react";

export default () => (
  <Fragment>
    <Head>
      <style>
        {`
            body {
              background-color: #fafafa;
            }
            @font-face{font-family:Lato;font-style:normal;font-weight:900;src:url('/static/fonts/Lato/Lato-Black.ttf');}
            @font-face{font-family:Lato;font-style:normal;font-weight:bold;src:url('/static/fonts/Lato/Lato-Bold.ttf');}
            @font-face{font-family:Lato;font-style:normal;font-weight:normal;src:url('/static/fonts/Lato/Lato-Regular.ttf');}
          `}
      </style>
    </Head>
    <PageContainer>
      <Prompt
        title={"Please upgrade your browser!"}
        prompt={
          "This activity works on the last two versions of Chrome, Firefox, Internet Explorer Edge, and Safari. [Click here to upgrade](http://outdatedbrowser.com). Sorry for the trouble!"
        }
        stimuli={undefined}
      />
    </PageContainer>
  </Fragment>
);
