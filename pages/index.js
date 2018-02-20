// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import Router from "next/router";
import shuffle from "lodash.shuffle";
import throttle from "lodash.throttle";
import scrollToComponent from "react-scroll-to-component";
import { resetKeyGenerator } from "slate";
import { default as KeyPather } from "keypather";
const keypather = new KeyPather();

import activities from "../lib/activities";
import CardWorkspace from "../lib/components/neue/card-workspace";
import findReviewees from "../lib/flows/utilities/reviewee-requirement";
import PageContainer from "../lib/components/neue/page-container";
import Prompt from "../lib/components/neue/prompt";
import reportError from "../lib/error";
import ResponseCard from "../lib/components/neue/response-card";
import sharedStyles from "../lib/styles";
import Welcome from "../lib/components/neue/welcome";
import { signIn } from "../lib/auth";
import {
  setConnectivityHandler,
  loadData,
  saveData,
  commitData,
  saveUserState,
  loadManagementData,
  watchInbox,
} from "../lib/db";
import { initializeApp } from "firebase";

import type { PromptData, Activity } from "../lib/activities";

const getClassCodeFromURL = url => {
  return url.query.classCode;
};

const getFlowIDFromURL = url => {
  return url.query.flowID;
};

const getStageForPage = (page: number, revieweeCount: number): Stage => {
  if (page === 0) {
    return "compose";
  } else if (page < revieweeCount + 1) {
    return "engage";
  } else if (page === revieweeCount + 1) {
    return "reflect";
  } else {
    return "conclusion";
  }
};

const databaseVersion = 2;
const nameForYou = "You"; // TODO: Needs to be student name.

const engagementCardCount = 3;

type Stage = "compose" | "engage" | "reflect" | "conclusion";

type State = {
  activity: ?Activity,
  currentPage: number,
  activeResponseCard: ?number,
  ready: boolean,

  userID: ?string,
  inputs: Object[], // TODO
  userState: Object, // TODO
  inbox: Object, // TODO
  reviewees: Object[], // TODO

  hasConnectivity: boolean,
  nextSaveRequestID: number,
  pendingSaveRequestIDs: { [key: mixed]: number },
  saveRequestTimeoutTime: number,

  inboxSubscriptionCancelFunction: ?(void) => void,
  connectivitySubscriptionCancelFunction: ?(void) => void,
};

type Props = {
  url: {
    query: any,
  },
};

export default class NeueFlowPage extends React.Component<Props, State> {
  cardWorkspaceContainerRef: ?HTMLDivElement;

  constructor(props: Props) {
    super(props);

    this.state = {
      activity: activities[getFlowIDFromURL(props.url)],
      currentPage: 0,
      activeResponseCard: null,
      ready: false,

      userID: null,
      inputs: [],
      userState: {},
      inbox: {},
      reviewees: [],

      hasConnectivity: true,
      nextSaveRequestID: 0,
      pendingSaveRequestIDs: {},
      saveRequestTimeoutTime: 0,

      inboxSubscriptionCancelFunction: null,
      connectivitySubscriptionCancelFunction: null,
    };

    this.cardWorkspaceContainerRef = null;
  }

  getCurrentStage = (): Stage => {
    if (!this.state.activity) {
      throw "Can't get stage for null activity";
    }
    return getStageForPage(
      this.state.currentPage,
      this.state.activity.revieweeCount,
    );
  };

  onSubmitWelcome = (email: string, name: string, avatar: string) => {
    this.setUserState({ email, profile: { name, avatar } });
  };

  onSubmit = () => {
    (async () => {
      const newPageIndex = this.state.currentPage + 1;
      const commitSaveRequestString = `commit${newPageIndex}`; // such hacks, I'm sorry
      if (!this.state.pendingSaveRequestIDs[commitSaveRequestString]) {
        await this.recordPageLoad(newPageIndex);

        if (window.innerWidth < 800) {
          // Hacky scroll to keep cards visible on mobile. Need to figure out a better approach here.
          scrollToComponent(this.cardWorkspaceContainerRef, {
            align: "top",
            offset: -50,
          });
        }

        this.setState({ currentPage: newPageIndex, activeResponseCard: null });
      }
    })();
  };

  setUserState = (newUserState: Object) => {
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
    const flowID = getFlowIDFromURL(this.props.url);
    const classCode = getClassCodeFromURL(this.props.url);
    const { inputs, userState } =
      (await loadData(flowID, classCode, activeUserID)) || {};

    const initialPage =
      (userState &&
        userState.furthestPageLoaded &&
        Number.parseInt(userState.furthestPageLoaded)) ||
      0;
    this.setState(
      {
        currentPage: initialPage,
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
    }
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
  };

  recordPageLoad = async (newPageIndex: number) => {
    const commitSaveRequestString = `commit${newPageIndex}`;
    if (newPageIndex > (this.state.userState.furthestPageLoaded || -1)) {
      if (newPageIndex > 0) {
        this.state.pendingSaveRequestIDs[commitSaveRequestString] =
          Date.now() + 750;
        setTimeout(() => {
          this.setState({
            saveRequestTimeoutTime: Date.now(),
          });
        }, 800);

        await commitData(
          databaseVersion,
          getFlowIDFromURL(this.props.url),
          getClassCodeFromURL(this.props.url),
          this.state.userID,
          newPageIndex - 1,
          this.state.inputs[newPageIndex - 1],
        );
        await this.setUserState({
          furthestPageLoaded: newPageIndex,
        });

        await this.updateReviewees(newPageIndex);

        if (!this.state.activity) {
          throw "Can't shuffle engagement cards for a null activity";
        }
        const activity = this.state.activity;
        const newStage = getStageForPage(newPageIndex, activity.revieweeCount);
        if (newStage === "engage" || newStage === "reflect") {
          const deck =
            newStage === "engage"
              ? activity.engagementPrompts
              : activity.reflectionPrompts;
          const cardIndices = shuffle(deck.map((d, idx) => idx)).slice(
            0,
            engagementCardCount,
          );
          this.onChange(newPageIndex, {
            _cardIndices: cardIndices,
          });
        }

        delete this.state.pendingSaveRequestIDs[commitSaveRequestString];
        this.setState({
          pendingSaveRequestIDs: this.state.pendingSaveRequestIDs,
        });
      } else {
        this.setUserState({
          furthestPageLoaded: newPageIndex,
        });
      }
    }
  };

  onChange = (index: number, newInputs: Object) => {
    if (!this.state.activity) {
      throw "Can't commit changes for a null activity";
    }

    let effectiveNewInputs = newInputs;
    if (
      getStageForPage(index, this.state.activity.revieweeCount) === "engage"
    ) {
      // This is really quite a hack to cause the server-side feedback exchange machinery (built for the previous flow architecture) to send this work to the reviewee.
      effectiveNewInputs.feedback = true;
    }
    this.throttledSaveToServer(index, newInputs);

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
  };

  onOpenPendingCard = (pendingCardIndex: number) => {
    if (
      !this.state.inputs[this.state.currentPage] ||
      this.state.inputs[this.state.currentPage].openPendingCardIndex ===
        undefined
    ) {
      const newInputs = {
        ...(this.state.inputs[this.state.currentPage] || {}),
        openPendingCardIndex: pendingCardIndex,
      };
      this.onChange(this.state.currentPage, newInputs);
    }
  };

  onChangePendingCardData = (newData: Object) => {
    const newInputs = {
      ...(this.state.inputs[this.state.currentPage] || {}),
      pendingCardData: newData,
    };
    this.onChange(this.state.currentPage, newInputs);
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
      this.recordPageLoad(this.state.currentPage);

      const inboxSubscriptionCancelFunction = watchInbox(
        getFlowIDFromURL(this.props.url),
        getClassCodeFromURL(this.props.url),
        this.state.userID,
        inbox => this.setState({ inbox }),
      );
      this.setState({
        inboxSubscriptionCancelFunction,
        connectivitySubscriptionCancelFunction,
      });
    })().catch(reportError);
  };

  componentWillUnmount = () => {
    this.state.inboxSubscriptionCancelFunction &&
      this.state.inboxSubscriptionCancelFunction();

    this.state.connectivitySubscriptionCancelFunction &&
      this.state.connectivitySubscriptionCancelFunction();
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
      const jigsawGroup =
        this.state.inputs[0] && this.state.inputs[0]._jigsawGroup;
      if (jigsawGroup === undefined) {
        return null; // Wait for jigsaw group to be assigned.
      } else {
        prompt = activity.prompt.groups[jigsawGroup];
      }
    } else {
      prompt = activity.prompt;
    }

    if (!this.state.userState.email) {
      return (
        <Fragment>
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
            <Welcome
              onSubmit={this.onSubmitWelcome}
              collectEmail
              title={this.state.activity.title}
            />
          </PageContainer>
        </Fragment>
      );
    }

    const { currentPage } = this.state;
    const stage = this.getCurrentStage();

    const currentInputs = this.state.inputs[currentPage] || {};
    const pendingCardData = currentInputs.pendingCardData;

    let workspaceContents = {};
    switch (stage) {
      case "compose":
        workspaceContents = {
          submittedCards: [],
          pendingCards: [
            {
              studentName: nameForYou,
              avatar: this.state.userState.profile.avatar,
              data: pendingCardData,
              key: "compose",
            },
          ],
          openPendingCard: 0,
          submitButtonTitle: "Share with class",
        };
        break;
      case "engage":
        const reviewee =
          this.state.reviewees && this.state.reviewees[currentPage - 1];
        if (reviewee) {
          workspaceContents = {
            submittedCards: [
              {
                studentName: reviewee && reviewee._profile.name,
                avatar: reviewee && reviewee._profile.avatar,
                data: reviewee,
                key: `engage${currentPage}Peer`,
                subheading:
                  activity.prompt.type === "jigsaw"
                    ? `${activity.prompt.groupNameHeadingPrefix} ${activity
                        .prompt.groups[reviewee._jigsawGroup].name}`
                    : undefined,
              },
            ],
            pendingCards: currentInputs._cardIndices
              .map(i => activity.engagementPrompts[i])
              .map((el, idx) => ({
                studentName: nameForYou,
                avatar: this.state.userState.profile.avatar,
                data: pendingCardData,
                key: `engage${currentPage}Response${idx}`,
                placeholder: el,
              })),
            submitButtonTitle: "Share reply",
          };
        } else {
          workspaceContents = {
            submittedCards: [],
            pendingCards: [],
          };
        }
        break;
      case "reflect":
        workspaceContents = {
          submittedCards: this.getReflectionSubmittedCards(),
          pendingCards: currentInputs._cardIndices
            .map(i => activity.reflectionPrompts[i])
            .map((el, idx) => ({
              studentName: nameForYou,
              avatar: this.state.userState.profile.avatar,
              data: pendingCardData,
              key: `reflect${currentPage}Response${idx}`,
              placeholder: el,
            })),
          submitButtonTitle: "Share reflection",
        };
        break;
      case "conclusion":
        const reflectionInputs = this.state.inputs[currentPage - 1];
        workspaceContents = {
          submittedCards: this.getReflectionSubmittedCards().concat({
            studentName: nameForYou,
            avatar: this.state.userState.profile.avatar,
            data: reflectionInputs.pendingCardData,
            key: `reflect${currentPage - 1}Response${reflectionInputs
              ._cardIndices[reflectionInputs.openPendingCardIndex]}`,
          }),
          pendingCards: [
            {
              key: "conclusion",
            },
          ],
          submitButtonTitle: "Share reflection",
          onSubmitPendingCard: null,
          openPendingCard: null,
        };
        break;
    }

    const workspace = (
      <CardWorkspace
        onOpenPendingCard={this.onOpenPendingCard}
        onChangePendingCardData={this.onChangePendingCardData}
        onSubmitPendingCard={this.onSubmit}
        openPendingCard={
          currentInputs.openPendingCardIndex === undefined
            ? null
            : currentInputs.openPendingCardIndex
        }
        {...workspaceContents}
      />
    );

    const shouldShowWaitingNotice =
      currentPage > 0 &&
      this.state.reviewees.length < currentPage &&
      currentPage <= activity.revieweeCount;

    return (
      <Fragment>
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
        <PageContainer>
          <Prompt
            title={activity.title}
            prompt={prompt.prompt}
            stimuli={prompt.stimuli}
            postStimuliPrompt={prompt.postStimuliPrompt}
          />
          <p />
          {shouldShowWaitingNotice ? (
            <div
              style={{
                position: "absolute",
                ...sharedStyles.wbTypography.headingMedium,
                textAlign: "center",
                width: "100%",
                marginTop: 16,
              }}
            >
              Waiting for a classmate to submit their work…
            </div>
          ) : null}
          <div
            ref={ref => (this.cardWorkspaceContainerRef = ref)}
            style={{
              paddingBottom: "70vh",
            }}
          >
            {workspace}
          </div>
        </PageContainer>
      </Fragment>
    );
  };
}
