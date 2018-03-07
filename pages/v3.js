// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import Router from "next/router";
import shuffle from "lodash.shuffle";
import throttle from "lodash.throttle";
import scrollToComponent from "react-scroll-to-component";
import { resetKeyGenerator } from "slate";

import activities from "../lib/activities";
import findReviewees from "../lib/reviewee-requirement";
import PageContainer from "../lib/components/page-container";
import Prompt from "../lib/components/prompt";
import reportError from "../lib/error";
import sharedStyles from "../lib/styles";
import Thread from "../lib/components/thread";
import Welcome from "../lib/components/welcome";
import { signIn } from "../lib/auth";
import {
  setConnectivityHandler,
  loadData,
  saveData,
  commitData,
  saveUserState,
} from "../lib/db";
import { initializeApp } from "firebase";

import type { PromptData, Activity } from "../lib/activities";
import type { dataKind as QuillDataKind } from "../lib/components/quill-rich-editor"; // TODO move

const getClassCodeFromURL = url => {
  return url.query.classCode;
};

const getFlowIDFromURL = url => {
  return url.query.flowID;
};

const databaseVersion = 3;
const nameForYou = "You"; // TODO: Needs to be student name.

const engagementCardCount = 3;

type UserID = string;
type ThreadKey = UserID; // for now...

type RichEditorData = {
  kind: QuillDataKind,
  rawData: string,
};

type ThreadData = {
  posts: { [key: string]: PostData },
};

type PostData = {
  data: RichEditorData,
  submissionTimestamp: number,
  userID: UserID,
  userData: {
    avatar: string,
    pseudonym: string,
    name: string,
  },
};

type State = {
  ready: boolean,
  userID: ?string,

  activity: ?Activity,

  userData: Object, // TODO
  threads: { [key: ThreadKey]: ThreadData },
  expandedThreads: ThreadKey[],

  hasConnectivity: boolean,
  nextSaveRequestID: number,
  pendingSaveRequestIDs: { [key: mixed]: number },
  saveRequestTimeoutTime: number,

  connectivitySubscriptionCancelFunction: ?(void) => void,
};

type Props = {
  url: {
    query: any,
  },
};

export default class NeueFlowPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      ready: false,
      userID: null,

      activity: activities[getFlowIDFromURL(props.url)],

      userData: {},
      threads: {},
      expandedThreads: [],

      hasConnectivity: true,
      nextSaveRequestID: 0,
      pendingSaveRequestIDs: {},
      saveRequestTimeoutTime: 0,

      connectivitySubscriptionCancelFunction: null,
    };
  }

  onSubmitWelcome = ({
    email,
    name,
    avatar,
    realName,
  }: {
    email: string,
    name: string,
    avatar: string,
    realName: ?string,
  }) => {
    this.setUserState({ email, profile: { name, avatar, realName } });
  };

  onSubmit = () => {
    // TODO
    /*(async () => {
      const newPageIndex = this.state.currentPage + 1;
      const commitSaveRequestString = `commit${newPageIndex}`; // such hacks, I'm sorry
      if (!this.state.pendingSaveRequestIDs[commitSaveRequestString]) {
        await this.recordPageLoad(newPageIndex);

        this.setState({ currentPage: newPageIndex, activeResponseCard: null });
      }
    })();*/
  };

  setUserState = (newUserState: Object) => {
    /*
    this.setState({ userState: { ...this.state.userState, ...newUserState } });

    return (async () => {
      const latestUserState = await saveUserState(
        getFlowIDFromURL(this.props.url),
        getClassCodeFromURL(this.props.url),
        this.state.userID,
        newUserState,
      );
      if (latestUserState) {
        this.setState({ userState: latestUserState });
      }
    })().catch(reportError);
    */
  };

  fetchInitialData = async () => {
    const activity = this.state.activity;
    if (!activity) {
      throw "Can't fetch initial data for null activity";
    }

    // TODO(andy): So... we really don't have any semblance of security, but this sure does make the lack of security more easily manipulated. At some point we'll want to think about actually restraining what users are able to modify in the database, but that's not appropriate in this prototyping stage.
    let activeUserID = this.props.url.query.userID;
    if (activeUserID) {
      // Sign in anonymously anyway. This will be a throwaway user; we'll still write to the UID in the query string.
      await signIn();
    } else {
      activeUserID = await signIn();
      Router.replace({
        ...this.props.url,
        query: { ...this.props.url.query, userID: activeUserID },
      });
    }

    this.setState({
      ready: true,
      userID: activeUserID,
    });

    // TODO
    /*
    const flowID = getFlowIDFromURL(this.props.url);
    const classCode = getClassCodeFromURL(this.props.url);
    const { inputs, userState } =
      (await loadData(flowID, classCode, activeUserID)) || {};

    this.setState(
      {
        ready: true,
        inputs: inputs || [],
        userState: userState || {},
        userID: activeUserID,
      },
      () => {
        if (
          activity.prompt.type === "jigsaw" &&
          (!inputs || !inputs[0] || inputs[0]._jigsawGroup === undefined)
        ) {
          const jigsawPromptData = activity.prompt;

          const jigsawGroupRandomData = new Uint8Array(1);
          window.crypto.getRandomValues(jigsawGroupRandomData);
          const jigsawGroup = Math.floor(
            jigsawGroupRandomData[0] / 255.0 * jigsawPromptData.groups.length,
          );

          this.onChange(0, {
            _jigsawGroup: jigsawGroup,
          });
        }
      },
    );
    await this.updateReviewees(initialPage);

    if (this.props.url.query.fallbackUser) {
      console.log("Creating fallback user");
      this.setUserState({ isFallbackUser: true });
    }*/
  };

  throttledSaveToServer = throttle(
    (index, newInputs) => {
      const saveDataAsync = async () => {
        const currentSaveRequestID = this.state.nextSaveRequestID;
        this.state.pendingSaveRequestIDs[currentSaveRequestID] =
          Date.now() + 1000;
        this.setState({
          nextSaveRequestID: currentSaveRequestID + 1,
          pendingSaveRequestIDs: this.state.pendingSaveRequestIDs,
        });
        return saveData(
          databaseVersion,
          getFlowIDFromURL(this.props.url),
          getClassCodeFromURL(this.props.url),
          this.state.userID,
          index,
          newInputs,
        )
          .then(() => {
            delete this.state.pendingSaveRequestIDs[currentSaveRequestID];
            this.setState({
              pendingSaveRequestIDs: this.state.pendingSaveRequestIDs,
            });
          })
          .catch(error => {
            console.error("Error on iteration ", currentSaveRequestID, error);
          });
      };

      setTimeout(() => {
        this.setState({
          saveRequestTimeoutTime: Date.now(),
        });
      }, 1100);

      saveDataAsync().catch(reportError);
    },
    1000,
    { trailing: false, leading: true },
  );

  updateReviewees = async (currentPage: number) => {
    if (!this.state.activity) {
      throw "Can't update reviewees for null activity";
    }
    const activity = this.state.activity;

    if (
      this.state.reviewees &&
      this.state.reviewees.length === activity.revieweeCount
    ) {
      return;
    }

    // TODO
    /*
    const thisUserJigsawGroup =
      this.state.inputs[0] && this.state.inputs[0]._jigsawGroup;
    const revieweeFetcher = findReviewees({
      matchAtPageNumber: 1,
      extractResponse: inputs =>
        inputs[0]._jigsawGroup !== undefined
          ? {
              ...inputs[0].pendingCardData,
              _jigsawGroup: inputs[0]._jigsawGroup,
            }
          : inputs[0].pendingCardData,
      revieweePageNumberRequirement: 0,
      sortReviewees: () => 0,
      findReviewees: ({ inputs, userState }, fetcher) => {
        const reviewees = [];
        for (var i = 0; i < activity.revieweeCount; i++) {
          const reviewee = fetcher(otherUserData => {
            const revieweeIsNew =
              reviewees.findIndex(
                existingReviewee =>
                  existingReviewee.userID === otherUserData.userID,
              ) === -1;

            const revieweeJigsawGroup = otherUserData.inputs[0]._jigsawGroup;
            const revieweeIsDifferentEnough =
              activity.prompt.type !== "jigsaw" ||
              (thisUserJigsawGroup !== revieweeJigsawGroup &&
                // No other existing reviewee has this jigsaw group
                reviewees.findIndex(
                  existingReviewee =>
                    existingReviewee.submission._jigsawGroup ===
                    revieweeJigsawGroup,
                ) === -1);
            return revieweeIsNew && revieweeIsDifferentEnough;
          });
          if (reviewee) {
            reviewees.push(reviewee);
          }
        }
        return reviewees;
      },
      flowName: getFlowIDFromURL(this.props.url),
    }).fetcher;
    const fetcherResponse = await revieweeFetcher(
      [currentPage, [], undefined],
      this.state.userID,
      getClassCodeFromURL(this.props.url),
      { inputs: this.state.inputs, userState: this.state.userState },
      false,
    );
    if (fetcherResponse) {
      const remoteData = fetcherResponse.remoteData || fetcherResponse;
      const newUserState = fetcherResponse.newUserState;
      this.setState({
        reviewees: remoteData.responses,
      });
      if (newUserState) {
        await this.setUserState(newUserState);
      }

      if (remoteData.responses.length < activity.revieweeCount) {
        setTimeout(() => this.updateReviewees(this.state.currentPage), 1000);
      }
    }
    */
  };

  onChange = (index: number, newInputs: Object) => {
    if (!this.state.activity) {
      throw "Can't commit changes for a null activity";
    }

    this.throttledSaveToServer(index, newInputs);

    // TODO
    /*
    let { inputs } = this.state;
    if (inputs.length < index) {
      inputs = [...inputs, ...Array(index - inputs.length).fill({})];
    }
    this.setState({
      inputs: [
        ...inputs.slice(0, index),
        newInputs,
        ...inputs.slice(index + 1),
      ],
    });
    */
  };

  componentWillMount = () => {
    resetKeyGenerator();
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
      const connectivitySubscriptionCancelFunction = setConnectivityHandler(
        newConnectivityValue =>
          this.setState({ hasConnectivity: newConnectivityValue }),
      );

      this.setState({
        connectivitySubscriptionCancelFunction,
      });
    })().catch(reportError);
  };

  componentWillUnmount = () => {
    this.state.connectivitySubscriptionCancelFunction &&
      this.state.connectivitySubscriptionCancelFunction();
  };

  onEditPost = (postIndex: number) => {};

  onSetIsExpanded = (threadKey: ThreadKey, newIsExpanded: boolean) => {
    // TODO TODO
    this.setState({ expandedThreads: newIsExpanded ? [threadKey] : [] });
  };

  render = () => {
    if (!this.state.ready || !this.state.userID) {
      // TODO(andy): Implement loading page.
      return null;
    }
    const userID: string = this.state.userID;

    const flowID = getFlowIDFromURL(this.props.url);
    if (!flowID) {
      return (
        <p>
          You need to specify an activity! Your URL should look like
          /?flowID=your_flow_id
        </p>
      );
    }

    if (!this.state.activity) {
      return (
        <p>
          There's no activity called {flowID}! Your URL should look like
          /?flowID=your_flow_id
        </p>
      );
    }
    const activity: Activity = this.state.activity;

    let prompt: PromptData;
    if (activity.prompt.type === "jigsaw") {
      throw "Unimplemented"; // TODO
      // prompt = activity.prompt.groups[jigsawGroup];
    } else {
      prompt = activity.prompt;
    }

    /*
    // TODO REENABLE
    if (!this.state.userState.email) {
      return (
        <Fragment>
          <Head>
            <style>
              {`
          body {
            background-color: ${sharedStyles.wbColors.offWhite};
          }
        `}
            </style>
          </Head>
          <PageContainer>
            <Welcome
              onSubmit={this.onSubmitWelcome}
              collectEmail
              title={this.state.activity.title}
              requiresRealName
            />
          </PageContainer>
        </Fragment>
      );
    }
    */

    const yourThreadData = this.state.threads[userID];
    const yourThreadProps = {};

    return (
      <Fragment>
        <Head>
          <style>
            {`
            body {
              background-color: ${sharedStyles.wbColors.offWhite};
            }
            @font-face{font-family:Lato;font-style:normal;font-weight:900;src:url('/static/fonts/Lato/Lato-Black.ttf');}
            @font-face{font-family:Lato;font-style:normal;font-weight:bold;src:url('/static/fonts/Lato/Lato-Bold.ttf');}
            @font-face{font-family:Lato;font-style:normal;font-weight:normal;src:url('/static/fonts/Lato/Lato-Regular.ttf');}
          `}
          </style>
        </Head>
        <PageContainer>
          <Prompt
            title={activity.title}
            prompt={prompt.prompt}
            stimuli={prompt.stimuli}
            postStimuliPrompt={prompt.postStimuliPrompt}
          />

          <div style={{ marginTop: 8, position: "sticky", top: 0 }}>
            <Thread
              posts={[
                {
                  avatar: "aqualine-sapling",
                  studentName: "Your response",
                  data: {
                    kind: "quill-editor-1",
                    rawData: "<p>testing testing 1 2 <b>3</p>",
                  },
                },
              ]}
              onChange={this.onEditPost}
              isExpanded={this.state.expandedThreads.includes(userID)}
              onSetIsExpanded={newIsExpanded =>
                this.onSetIsExpanded(userID, newIsExpanded)}
            />
          </div>
        </PageContainer>
      </Fragment>
    );
  };
}
