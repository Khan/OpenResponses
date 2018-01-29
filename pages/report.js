// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import { resetKeyGenerator } from "slate";

import CardWorkspace from "../lib/components/neue/card-workspace";
import PageContainer from "../lib/components/neue/page-container";
import Prompt from "../lib/components/neue/prompt";
import reportError from "../lib/error";
import ResponseCard from "../lib/components/neue/response-card";
import sharedStyles from "../lib/styles";
import { signIn } from "../lib/auth";
import { loadData } from "../lib/db";
import { initializeApp } from "firebase";

const getClassCodeFromURL = url => {
  return url.query.classCode;
};

const getFlowIDFromURL = url => {
  return url.query.flowID;
};

const databaseVersion = 2;
const numberOfEngagementPages = 2;
const nameForYou = "You"; // TODO: Needs to be student name.

const title = "Reconstruction and life after the Civil War"; // TODO: Extract

type Stage = "compose" | "engage" | "reflect" | "conclusion";

type State = {
  ready: boolean,
  userID: ?string,
  users: Object, // TODO
};

type Props = {
  url: {
    query: any,
  },
};

export default class ReportPage extends React.Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);

    this.state = {
      ready: false,
      userID: null,
      users: [],
    };
  }

  fetchInitialData = async () => {
    const activeUserID = await signIn();

    const flowID = getFlowIDFromURL(this.props.url);
    const classCode = getClassCodeFromURL(this.props.url);
    const users = (await loadData(flowID, classCode)) || {};

    this.setState({
      ready: true,
      users,
      userID: activeUserID,
    });
  };

  componentWillMount = () => {
    resetKeyGenerator();
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
    })().catch(reportError);
  };

  getReflectionSubmittedCards = () => {
    const inbox = this.state.inbox || {};
    const sortedKeys = Object.keys(inbox).sort();
    const messages = sortedKeys
      .reduce((accumulator, key) => {
        const message = inbox[key];
        return [...accumulator, message];
      }, [])
      .map((message, idx) => ({
        studentName: message.profile.name,
        avatar: message.profile.avatar,
        data: message.submitted[message.fromModuleID].pendingCardData,
        key: `reflectionFeedback${idx}`,
      }));

    const output = [
      {
        studentName: nameForYou,
        avatar: this.state.userState.profile.avatar,
        data: this.state.inputs[0].pendingCardData,
        key: "reflectionBasis",
      },
      ...messages,
    ];
    // if (this.getCurrentStage() === "conclusion") {
    //   output.push({
    //     studentName: nameForYou,
    //     data: this.state.inputs[this.state.currentPage - 1].pendingCardData,
    //     key: "reflection",
    //   });
    // }
    return output;
  };

  render = () => {
    if (!this.state.ready) {
      // TODO(andy): Implement loading page.
      return null;
    }

    console.log(this.state.users);
    return (
      <Fragment>
        {" "}
        <Head>
          <style>
            {`
      body {
        background-color: ${sharedStyles.colors.gray90};
      }
      @font-face{font-family:Lato;font-style:normal;font-weight:900;src:url('/static/fonts/Lato/Lato-Black.ttf');}
      @font-face{font-family:Lato;font-style:normal;font-weight:bold;src:url('/static/fonts/Lato/Lato-Bold.ttf');}
      @font-face{font-family:Lato;font-style:normal;font-weight:normal;src:url('/static/fonts/Lato/Lato-Regular.ttf');}
    `}
          </style>
        </Head>
        <div
          style={{
            display: "flex",
          }}
        >
          {Object.keys(this.state.users).map(userID => {
            const { userState, inputs, inbox } = this.state.users[userID];
            if (!userState || !inputs) {
              return null;
            }

            const response = {
              studentName: `${userState.profile.name} (${userState.email})`,
              avatar: userState.profile.avatar,
              data: inputs[0].pendingCardData,
              key: "compose",
            };

            let replies = [];
            if (inbox) {
              const sortedKeys = Object.keys(inbox).sort();
              replies = sortedKeys
                .reduce((accumulator, key) => {
                  const message = inbox[key];
                  return [...accumulator, message];
                }, [])
                .map((message, idx) => {
                  const sender = this.state.users[message.fromUserID];
                  const senderEmail = sender
                    ? sender.userState.email
                    : "(unknown email)";
                  return {
                    studentName: `${message.profile.name} (${senderEmail})`,
                    avatar: message.profile.avatar,
                    data:
                      message.submitted[message.fromModuleID].pendingCardData,
                    key: `reflectionFeedback${idx}`,
                    time: message.time,
                  };
                });
            }

            if (inputs.length > 0 && !inputs[inputs.length - 1].feedback) {
              replies.push({
                studentName: `${userState.profile.name} (${userState.email})`,
                avatar: userState.profile.avatar,
                data: inputs[inputs.length - 1].pendingCardData,
                key: "reflection",
              });
            }

            const cards = [response, ...replies];

            return (
              <div
                style={{
                  width: 400,
                  flexShrink: 0,
                  margin: "0 14px",
                }}
              >
                <h2
                  style={{
                    ...sharedStyles.wbTypography.headingMedium,
                  }}
                >
                  {userState.email}
                </h2>
                <CardWorkspace
                  key={userID}
                  pendingCards={[]}
                  submittedCards={cards}
                />
              </div>
            );
          })}
        </div>
      </Fragment>
    );
  };
}
