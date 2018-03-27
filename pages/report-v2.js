// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import { resetKeyGenerator } from "slate";

import activities from "../lib/activities";
import CardWorkspace from "../lib/components/card-workspace";
import PageContainer from "../lib/components/page-container";
import Prompt from "../lib/components/prompt";
import reportError from "../lib/error";
import ResponseCard from "../lib/components/response-card";
import sharedStyles from "../lib/styles";
import { signIn } from "../lib/auth";
import { loadData } from "../lib/db";
import { initializeApp } from "firebase";

import type { Activity } from "../lib/activities";

const getClassCodeFromURL = url => {
  return url.query.classCode || url.query.classID;
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
  users: Object[], // TODO
  activity: Activity,
};

type Props = {
  url: {
    query: any,
  },
};

export default class ReportPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const flowID = getFlowIDFromURL(this.props.url);

    this.state = {
      ready: false,
      userID: null,
      users: [],
      activity: activities[flowID],
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

  getIdentityFromUserState = userState => {
    return userState.profile.realName || userState.email;
  };

  getCardList = (
    userID,
    highlightingUserID,
    hideRepliesFromNonHighlightedUsers,
    activity: Activity,
  ) => {
    const { userState, inputs, inbox, log } = this.state.users[userID];

    console.log(userID, userState);
    const response = {
      studentName: this.getIdentityFromUserState(userState),
      avatar: userState.profile.avatar,
      data: inputs[0].pendingCardData,
      placeholder: inputs[0].pendingCardData
        ? undefined
        : "[the student did not submit an answer]",
      key: "compose",
      highlight: userID === highlightingUserID,
      subheading:
        activity.prompt.type === "jigsaw"
          ? `${activity.prompt.groupNameHeadingPrefix} ${activity.prompt.groups[
              inputs[0]._jigsawGroup
            ].name}`
          : undefined,
    };

    let replies = [];
    if (inbox) {
      const sortedKeys = Object.keys(inbox).sort();
      replies = sortedKeys
        .reduce((accumulator, key) => {
          const message = inbox[key];
          return [...accumulator, message];
        }, [])
        .filter(
          message =>
            !hideRepliesFromNonHighlightedUsers ||
            (hideRepliesFromNonHighlightedUsers &&
              message.fromUserID === highlightingUserID),
        )
        .map((message, idx) => {
          const sender = this.state.users[message.fromUserID];
          const senderIdentity = sender
            ? this.getIdentityFromUserState(sender.userState)
            : "(unknown email)";
          return {
            studentName: senderIdentity,
            avatar: message.profile.avatar,
            data: message.submitted[message.fromModuleID].pendingCardData,
            key: `reflectionFeedback${idx}`,
            time: message.time,
            highlight: message.fromUserID === highlightingUserID,
          };
        });
    }

    if (inputs.length > 1 && !inputs[inputs.length - 1].feedback) {
      const timestampKey = Object.keys(log).find(logKey => {
        const logEntry = log[logKey];
        return (
          logEntry.type === "submission" &&
          Number.parseInt(logEntry.moduleID) === inputs.length - 1
        );
      });
      const time = timestampKey && log[timestampKey].time;
      replies.push({
        studentName: this.getIdentityFromUserState(userState),
        avatar: userState.profile.avatar,
        data: inputs[inputs.length - 1].pendingCardData,
        key: "reflection",
        highlight: userID === highlightingUserID,
        time: time,
      });
    }
    replies.sort((a, b) => a.time - b.time);

    return [response, ...replies];
  };

  render = () => {
    if (!this.state.ready) {
      // TODO(andy): Implement loading page.
      return null;
    }

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
            const { userState, inputs } = this.state.users[userID];
            if (
              !userState ||
              !inputs ||
              inputs.length === 0 ||
              userState.furthestPageLoaded === 0
            ) {
              return null;
            }
            if (userState.isFallbackUser) {
              return null;
            }

            const revieweeCards = (userState.reviewees || []).map(reviewee => {
              if (!this.state.users[reviewee.userID] || !reviewee.isSubmitted) {
                return null;
              }
              return (
                <div
                  style={{
                    marginTop: 48,
                  }}
                >
                  <h3
                    style={{
                      ...sharedStyles.wbTypography.labelLarge,
                    }}
                  >
                    {this.getIdentityFromUserState(userState)}'s reply to{" "}
                    {this.getIdentityFromUserState(
                      this.state.users[reviewee.userID].userState,
                    )}
                  </h3>
                  <CardWorkspace
                    key={reviewee.userID}
                    pendingCards={[]}
                    submittedCards={this.getCardList(
                      reviewee.userID,
                      userID,
                      true,
                      this.state.activity,
                    )}
                  />
                </div>
              );
            });

            return (
              <div
                style={{
                  width: 400,
                  flexShrink: 0,
                  margin: "0 14px",
                }}
                key={userID}
              >
                <h2
                  style={{
                    ...sharedStyles.wbTypography.headingMedium,
                    backgroundColor: sharedStyles.colors.gray90,
                    zIndex: 100,
                    padding: "24px 0px",
                    margin: 0,
                    width: "100%",
                  }}
                >
                  {this.getIdentityFromUserState(userState)}
                </h2>
                <CardWorkspace
                  pendingCards={[]}
                  submittedCards={this.getCardList(
                    userID,
                    userID,
                    false,
                    this.state.activity,
                  )}
                />
                {revieweeCards}
              </div>
            );
          })}
        </div>
      </Fragment>
    );
  };
}
