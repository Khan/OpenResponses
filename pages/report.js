// @flow
import Head from "next/head";
import React, { Fragment } from "react";

import activities from "../lib/activities";
import PageContainer from "../lib/components/page-container";
import Prompt from "../lib/components/prompt";
import reportError from "../lib/error";
import sharedStyles from "../lib/styles";
import Thread from "../lib/components/thread";
import { signIn } from "../lib/auth";
import { loadData } from "../lib/db";

import type { Activity } from "../lib/activities";

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
  users: Object,
  threads: Object,
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
      users: {},
      threads: {},
      activity: activities[flowID],
    };
  }

  fetchInitialData = async () => {
    const activeUserID = await signIn();

    const flowID = getFlowIDFromURL(this.props.url);
    const classCode = getClassCodeFromURL(this.props.url);
    const data = (await loadData(flowID, classCode)) || {};
    const { users, threads } = data;
    if (Object.keys(data).length > 1 && !users && !threads) {
      window.location.pathname = window.location.pathname.replace(
        "report",
        "report-v2",
      );
      return;
    }

    this.setState({
      ready: true,
      users,
      threads,
      userID: activeUserID,
    });
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
    })().catch(reportError);
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

  getThreadDataProps = (threadKey: ThreadKey) => {
    const threadData = this.state.threads[threadKey] || {};
    const posts = Object.keys(threadData.posts || {})
      .sort()
      .filter(postKey => threadData.posts[postKey].userID)
      .map(postKey => {
        const post = threadData.posts[postKey];
        return {
          data: post.data,
          avatar: post.userProfile.avatar,
          displayName: post.userProfile.realName,
          userID: post.userID,
        };
      });
    return { posts };
  };

  render = () => {
    if (!this.state.ready) {
      // TODO(andy): Implement loading page.
      return null;
    }

    const activity = this.state.activity;

    return (
      <Fragment>
        <div
          style={{
            display: "flex",
          }}
        >
          {Object.keys(this.state.users)
            .sort((a, b) => {
              const profileA = this.state.users[a].profile || {};
              const profileB = this.state.users[b].profile || {};
              const realNameA = (profileA.realName || "").toUpperCase();
              const realNameB = (profileB.realName || "").toUpperCase();
              if (realNameA < realNameB) {
                return -1;
              } else if (realNameB < realNameA) {
                return 1;
              } else {
                return 0;
              }
            })
            .map(userID => {
              const {
                profile,
                hasPostedThread,
                isFallbackUser,
                partners,
              } = this.state.users[userID];
              if (!profile || !hasPostedThread || isFallbackUser) {
                return null;
              }

              const effectivePartners = Object.keys(partners)
                .sort()
                .slice(0, activity.revieweeCount)
                .map(partnerKey => partners[partnerKey].userID);
              const partnerElements = effectivePartners
                .filter(partnerUserID => {
                  const partnerThreadPosts = this.state.threads[partnerUserID]
                    .posts;
                  return Object.keys(partnerThreadPosts).some(
                    postKey => partnerThreadPosts[postKey].userID === userID,
                  );
                })
                .map((partnerUserID, partnerIndex) => {
                  const partnerThreadPosts = this.getThreadDataProps(
                    partnerUserID,
                  ).posts;
                  const replyIndex = partnerThreadPosts.findIndex(
                    post => post.userID === userID,
                  );
                  if (replyIndex === -1) {
                    return null;
                  }

                  const displayPosts = [
                    partnerThreadPosts[0],
                    partnerThreadPosts[replyIndex],
                  ];
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
                        {profile.realName}'s reply to{" "}
                        {this.state.users[partnerUserID].profile.realName}{" "}
                        (partner #{partnerIndex + 1})
                      </h3>
                      <Thread
                        key={partnerUserID}
                        posts={displayPosts}
                        isExpanded
                        prompts={[]}
                        canAddReply={false}
                        shouldDisplayLookingForFeedbackMessage={false}
                        shouldAutofocus={false}
                      />
                    </div>
                  );
                });

              const participatingThreads = Object.keys(
                this.state.threads,
              ).filter(threadKey => {
                const posts = this.state.threads[threadKey].posts;
                return (
                  threadKey !== userID &&
                  !effectivePartners.includes(threadKey) &&
                  Object.keys(posts).some(
                    postKey => posts[postKey].userID === userID,
                  )
                );
              });
              console.log(participatingThreads);
              const bonusThreadElements = participatingThreads.map(
                partnerUserID => {
                  const partnerThreadPosts = this.getThreadDataProps(
                    partnerUserID,
                  ).posts;
                  const replyIndex = partnerThreadPosts.findIndex(
                    post => post.userID === userID,
                  );
                  if (replyIndex === -1) {
                    return null;
                  }

                  const displayPosts = partnerThreadPosts.slice(
                    0,
                    replyIndex + 1,
                  );
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
                        {profile.realName}'s reply to{" "}
                        {this.state.users[partnerUserID].profile.realName}{" "}
                        (extra)
                      </h3>
                      <Thread
                        key={partnerUserID}
                        posts={displayPosts}
                        isExpanded
                        prompts={[]}
                        canAddReply={false}
                        shouldDisplayLookingForFeedbackMessage={false}
                        shouldAutofocus={false}
                      />
                    </div>
                  );
                },
              );

              const threadKey = userID;

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
                      backgroundColor: sharedStyles.wbColors.offWhite,
                      zIndex: 100,
                      padding: "24px 0px",
                      margin: 0,
                      width: "100%",
                    }}
                  >
                    {profile.realName}
                  </h2>
                  <div>
                    <Thread
                      key={threadKey}
                      {...this.getThreadDataProps(threadKey)}
                      isExpanded
                      prompts={[]}
                      canAddReply={false}
                      shouldDisplayLookingForFeedbackMessage={false}
                      shouldAutofocus={false}
                    />
                  </div>
                  {partnerElements}
                  {bonusThreadElements}
                </div>
              );
            })}
        </div>
      </Fragment>
    );
  };
}
