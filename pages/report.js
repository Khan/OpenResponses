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
  return url.query.classCode || url.query.classID;
};

const getFlowIDFromURL = url => {
  return url.query.flowID;
};

type State = {
  ready: boolean,
  userID: ?string,
  users: Object,
  threads: Object,
  activity: Activity,
  anonymizeStudents: boolean,
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
      anonymizeStudents: false,
    };
  }

  fetchInitialData = async () => {
    const activeUserID = await signIn();

    const flowID = getFlowIDFromURL(this.props.url);
    const classCode = getClassCodeFromURL(this.props.url);
    const data = (await loadData(flowID, classCode)) || {};
    const { users, threads } = data;

    this.setState({
      ready: true,
      users,
      threads,
      userID: activeUserID,
    });
  };

  componentDidMount = () => {
    (async () => {
      if (this.state.activity && this.state.activity.flowVersion === 2) {
        window.location.pathname = window.location.pathname.replace(
          "report",
          "report-v2",
        );
        return;
      }

      await this.fetchInitialData();
    })().catch(reportError);
  };

  displayNameFromProfile = profile => {
    return this.state.anonymizeStudents ? profile.pseudonym : profile.realName;
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
          timestamp: post.submissionTimestamp,
          displayName: this.displayNameFromProfile(post.userProfile),
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
            position: "fixed",
            background: sharedStyles.wbColors.white,
            borderBottom: `1px solid ${sharedStyles.wbColors.hairline}`,
            width: "100%",
            height: 80,
            top: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            paddingLeft: 14,
            paddingRight: 14,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{ ...sharedStyles.wbTypography.headingLarge, flexGrow: 1 }}
          >
            {activity.title}
          </div>
          <label
            style={{
              ...sharedStyles.wbTypography.labelMedium,
              flexGrow: 0,
              justifySelf: "end",
            }}
          >
            <input
              type="checkbox"
              style={{
                width: 13,
                height: 13,
                verticalAlign: "bottom",
                margin: 0,
                marginRight: 2,
                padding: 0,
                position: "relative",
                top: -2,
              }}
              checked={this.state.anonymizeStudents}
              onChange={event => {
                this.setState({ anonymizeStudents: event.target.checked });
              }}
            />{" "}
            Anonymize students
          </label>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 80,
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
                createdAt,
              } = this.state.users[userID];
              if (!profile || !hasPostedThread || isFallbackUser) {
                return null;
              }

              const effectivePartners = Object.keys(partners || {})
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
                        {this.displayNameFromProfile(profile)}'s reply to{" "}
                        {this.displayNameFromProfile(
                          this.state.users[partnerUserID].profile,
                        )}{" "}
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
                        waitingForFeedback={false}
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
                        {this.displayNameFromProfile(profile)}'s reply to{" "}
                        {this.displayNameFromProfile(
                          this.state.users[partnerUserID].profile,
                        )}{" "}
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
                        waitingForFeedback={false}
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
                    {this.displayNameFromProfile(profile)}
                    <span
                      style={{
                        ...sharedStyles.wbTypography.labelSmall,
                        color: sharedStyles.wbColors.offBlack50,
                        fontWeight: "normal",
                        marginLeft: 8,
                      }}
                    >
                      started at{" "}
                      {new Date(createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </span>
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
                      waitingForFeedback={false}
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
