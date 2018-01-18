// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import Router from "next/router";
import { resetKeyGenerator } from "slate";

import PageContainer from "../lib/components/neue/page-container";
import Prompt from "../lib/components/neue/prompt";
import ResponseCard from "../lib/components/neue/response-card";
import sharedStyles from "../lib/styles";
import { signIn } from "../lib/auth";

type State = {
  stage: "compose" | "engage" | "reflect" | "conclusion",
};

type Props = {};

export default class NeueFlowPage extends React.Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);

    this.state = {
      stage: "engage",
    };
  }

  componentWillMount = () => {
    resetKeyGenerator();
  };

  render = () => {
    let contents;
    switch (this.state.stage) {
      case "compose":
        contents = <ResponseCard studentName="Your Response" />;
        break;
      case "engage":
        contents = (
          <Fragment>
            {Array(3)
              .fill(null)
              .map((el, idx) => (
                <ResponseCard
                  key={idx}
                  studentName="Your Response"
                  data={this.state.data && this.state.data[idx]}
                  onChange={newData => {
                    const dataCopy = [...(this.state.data || [])];
                    dataCopy[idx] = newData;
                    this.setState({ data: dataCopy });
                  }}
                />
              ))}
          </Fragment>
        );
        break;
    }
    return (
      <div>
        <Head>
          <style>
            {`
            body {
              background-color: ${sharedStyles.colors.gray90};
            }
          `}
          </style>
        </Head>
        <PageContainer>
          <Prompt
            title="Testing testing 1 2 3"
            prompt={`Foo bar baz bat baz quux bar baz _Foo bar baz bat baz quux bar_ baz Foo bar baz bat baz quux bar baz Foo bar baz bat baz quux bar baz Foo bar baz bat baz quux bar baz
          
bat baz quux bar baz bat baz quux`}
          />
          <p />
          {contents}
        </PageContainer>
      </div>
    );
  };
}
