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
  activeResponseCard: ?number,
};

type Props = {};

export default class NeueFlowPage extends React.Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);

    this.state = {
      stage: "compose",
      activeResponseCard: null,
    };
  }

  onSubmit = () => {
    switch (this.state.stage) {
      case "compose":
        this.setState({
          stage: "engage",
        });
        break;
      case "engage":
        this.setState({
          stage: "reflect",
          activeResponseCard: null,
        });
        break;
      case "reflect":
        this.setState({
          stage: "conclusion",
          activeResponseCard: null,
        });
        break;
    }
  };

  onFocusResponseCard = (responseCardIndex: number) => {
    this.setState({ activeResponseCard: responseCardIndex });
  };

  componentWillMount = () => {
    resetKeyGenerator();
  };

  render = () => {
    let contents;
    switch (this.state.stage) {
      case "compose":
        contents = (
          <ResponseCard
            studentName="Your Response"
            data={this.state.responseData}
            onChange={newData => this.setState({ responseData: newData })}
            onSubmit={this.onSubmit}
            submitTitle="Share with Class"
          />
        );
        break;
      case "engage":
        contents = (
          <Fragment>
            <ResponseCard studentName="Anna Applebaum" />
            {Array(3)
              .fill(null)
              .map((el, idx) => (
                <div
                  style={{
                    position:
                      this.state.activeResponseCard === idx
                        ? "relative"
                        : "fixed",
                    bottom:
                      this.state.activeResponseCard !== null ? 3 * -60 : 0,
                    width: "100%",
                    height: 0,
                  }}
                  key={idx}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: (3 - idx) * -60,
                      width: "100%",
                    }}
                  >
                    <ResponseCard
                      studentName="You"
                      data={this.state.engagementData}
                      onChange={newData =>
                        this.setState({ engagementData: newData })}
                      onSubmit={this.onSubmit}
                      onFocus={() => this.onFocusResponseCard(idx)}
                      submitTitle="Share Reply"
                    />
                  </div>
                </div>
              ))}
          </Fragment>
        );
        break;
      case "reflect":
        contents = (
          <Fragment>
            <ResponseCard
              studentName="Your Response"
              data={this.state.responseData}
            />
            {Array(3)
              .fill(null)
              .map((el, idx) => (
                <div
                  style={{
                    position:
                      this.state.activeResponseCard === idx
                        ? "relative"
                        : "fixed",
                    bottom:
                      this.state.activeResponseCard !== null ? 3 * -60 : 0,
                    width: "100%",
                    height: 0,
                  }}
                  key={idx}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: (3 - idx) * -60,
                      width: "100%",
                    }}
                  >
                    <ResponseCard
                      studentName="You"
                      data={this.state.reflectionData}
                      onChange={newData =>
                        this.setState({ reflectionData: newData })}
                      onSubmit={this.onSubmit}
                      onFocus={() => this.onFocusResponseCard(idx)}
                      submitTitle="Submit Reflection"
                    />
                  </div>
                </div>
              ))}
          </Fragment>
        );
        break;
      case "conclusion":
        contents = (
          <Fragment>
            <ResponseCard studentName="You" data={this.state.responseData} />
            <ResponseCard studentName="You" data={this.state.reflectionData} />
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
