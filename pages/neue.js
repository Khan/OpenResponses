// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import Router from "next/router";
import { resetKeyGenerator } from "slate";

import CardWorkspace from "../lib/components/neue/card-workspace";
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
          <CardWorkspace
            submittedCards={[]}
            pendingCards={[
              {
                studentName: "You",
                data: this.state.responseData,
              },
            ]}
            openPendingCard={0}
            submitButtonTitle="Share with Class"
            onOpenPendingCard={() => {}}
            onChangePendingCardData={newData =>
              this.setState({ responseData: newData })}
            onSubmitPendingCard={this.onSubmit}
          />
        );
        break;
      case "engage":
        contents = (
          <CardWorkspace
            submittedCards={[
              {
                studentName: "Another Student",
              },
            ]}
            pendingCards={Array(3)
              .fill(null)
              .map((el, idx) => ({
                studentName: "You",
                data: this.state.engagementData,
              }))}
            openPendingCard={this.state.activeResponseCard}
            submitButtonTitle="Share with Class"
            onOpenPendingCard={pendingCardIndex =>
              this.onFocusResponseCard(pendingCardIndex)}
            onChangePendingCardData={newData =>
              this.setState({ engagementData: newData })}
            onSubmitPendingCard={this.onSubmit}
          />
        );
        break;
      case "reflect":
        contents = (
          <CardWorkspace
            submittedCards={[
              {
                studentName: "You",
                data: this.state.responseData,
              },
            ]}
            pendingCards={Array(3)
              .fill(null)
              .map((el, idx) => ({
                studentName: "You",
                data: this.state.reflectionData,
              }))}
            openPendingCard={this.state.activeResponseCard}
            submitButtonTitle="Submit Reflection"
            onOpenPendingCard={pendingCardIndex =>
              this.onFocusResponseCard(pendingCardIndex)}
            onChangePendingCardData={newData =>
              this.setState({ reflectionData: newData })}
            onSubmitPendingCard={this.onSubmit}
          />
        );
        break;
      case "conclusion":
        contents = (
          <CardWorkspace
            submittedCards={[
              {
                studentName: "You",
                data: this.state.responseData,
              },
              {
                studentName: "You",
                data: this.state.reflectionData,
              },
            ]}
            pendingCards={[]}
            openPendingCard={null}
            submitButtonTitle=""
            onOpenPendingCard={() => {}}
            onChangePendingCardData={() => {}}
            onSubmitPendingCard={() => {}}
          />
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
