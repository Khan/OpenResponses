// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import Router from "next/router";
import throttle from "lodash.throttle";
import { resetKeyGenerator } from "slate";
import { default as KeyPather } from "keypather";
const keypather = new KeyPather();

import CardWorkspace from "../lib/components/neue/card-workspace";
import PageContainer from "../lib/components/neue/page-container";
import Prompt from "../lib/components/neue/prompt";
import reportError from "../lib/error";
import ResponseCard from "../lib/components/neue/response-card";
import findReviewees from "../lib/flows/utilities/reviewee-requirement";
import sharedStyles from "../lib/styles";
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

const getClassCodeFromURL = url => {
  return url.query.classCode;
};

const getFlowIDFromURL = url => {
  return url.query.flowID;
};

const databaseVersion = 2;
const numberOfEngagementPages = 1;
const nameForYou = "You"; // TODO: Needs to be student name.

type Stage = "compose" | "engage" | "reflect" | "conclusion";

type State = {
  currentPage: number,
  activeResponseCard: ?number,
  ready: boolean,

  userID: ?string,
  inputs: Object[], // TODO
  userState: Object, // TODO
  inbox: Object, // TODO

  hasConnectivity: boolean,
  nextSaveRequestID: number,
  pendingSaveRequestIDs: { [key: mixed]: number },
  saveRequestTimeoutTime: number,

  managementSubscriptionCancelFunction: ?(void) => void,
  inboxSubscriptionCancelFunction: ?(void) => void,
  connectivitySubscriptionCancelFunction: ?(void) => void,
};

type Props = {
  url: {
    query: any,
  },
};

export default class NeueFlowPage extends React.Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);

    this.state = {
      currentPage: 0,
      activeResponseCard: null,
      ready: false,

      userID: null,
      inputs: [],
      userState: {},
      inbox: {},

      hasConnectivity: true,
      nextSaveRequestID: 0,
      pendingSaveRequestIDs: {},
      saveRequestTimeoutTime: 0,

      managementSubscriptionCancelFunction: null,
      inboxSubscriptionCancelFunction: null,
      connectivitySubscriptionCancelFunction: null,
    };
  }

  getCurrentStage = (): Stage => {
    const currentPage = this.state.currentPage;
    if (currentPage === 0) {
      return "compose";
    } else if (currentPage < numberOfEngagementPages + 1) {
      return "engage";
    } else if (currentPage === numberOfEngagementPages + 1) {
      return "reflect";
    } else {
      return "conclusion";
    }
  };

  onSubmit = () => {
    (async () => {
      const newPageIndex = this.state.currentPage + 1;
      await this.recordPageLoad(newPageIndex);
      this.setState({ currentPage: newPageIndex, activeResponseCard: null });
    })();
  };

  onFocusResponseCard = (responseCardIndex: number) => {
    this.setState({ activeResponseCard: responseCardIndex });
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

    const managementSubscriptionCancelFunction = loadManagementData(
      flowID,
      classCode,
      newManagementData => {
        console.log("new management data", newManagementData);
      },
    );

    const initialPage =
      (userState &&
        userState.furthestPageLoaded &&
        Number.parseInt(userState.furthestPageLoaded)) ||
      0;
    this.setState({
      currentPage: initialPage,
      ready: true,
      inputs: inputs || [],
      userState: userState || {},
      userID: activeUserID,
      managementSubscriptionCancelFunction,
    });
    await this.updateReviewees(initialPage);

    let baseUserState = {};
    if (this.props.url.query.fallbackUser) {
      baseUserState.isFallbackUser = true;
    }
    this.setUserState(baseUserState);
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
    const revieweeFetcher = findReviewees({
      matchAtPageNumber: 1,
      extractResponse: inputs => inputs[0].pendingCardData,
      revieweePageNumberRequirement: 0,
      sortReviewees: () => 0,
      findReviewees: ({ inputs, userState }, fetcher) =>
        Array(numberOfEngagementPages)
          .fill(null)
          .map(() => fetcher(() => true)),
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
    }
  };

  recordPageLoad = async (newPageIndex: number) => {
    const commitSaveRequestString = `commit${newPageIndex}`;
    if (
      newPageIndex > (this.state.userState.furthestPageLoaded || -1) &&
      !this.state.pendingSaveRequestIDs[commitSaveRequestString]
    ) {
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
    let effectiveNewInputs = newInputs;
    if (this.getCurrentStage() === "engage") {
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
    const newInputs = {
      ...(this.state.inputs[this.state.currentPage] || {}),
      openPendingCardIndex: pendingCardIndex,
    };
    this.onChange(this.state.currentPage, newInputs);
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
    this.state.managementSubscriptionCancelFunction &&
      this.state.managementSubscriptionCancelFunction();

    this.state.inboxSubscriptionCancelFunction &&
      this.state.inboxSubscriptionCancelFunction();

    this.state.connectivitySubscriptionCancelFunction &&
      this.state.connectivitySubscriptionCancelFunction();
  };

  getReflectionSubmittedCards = () => {
    const { inbox } = this.state;
    const sortedKeys = Object.keys(inbox).sort();
    const messages = sortedKeys
      .reduce((accumulator, key) => {
        const message = inbox[key];
        return [...accumulator, message];
      }, [])
      .map(message => ({
        studentName: "Another Student", // TODO: Will need to grab student name, too (will have to modify cloud function to do that)
        data: message.submitted[message.fromModuleID].pendingCardData,
      }));

    const output = [
      {
        studentName: nameForYou,
        data: this.state.inputs[0].pendingCardData,
      },
      ...messages,
    ];
    if (this.getCurrentStage() === "conclusion") {
      output.push({
        studentName: nameForYou,
        data: this.state.inputs[this.state.currentPage - 1].pendingCardData,
      });
    }
    return output;
  };

  render = () => {
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
              data: pendingCardData,
            },
          ],
          openPendingCard: 0,
          submitButtonTitle: "Share with Class",
        };
        break;
      case "engage":
        workspaceContents = {
          submittedCards: [
            {
              studentName: "Another Student",
              data:
                this.state.reviewees && this.state.reviewees[currentPage - 1],
            },
          ],
          pendingCards: Array(3)
            .fill(null)
            .map((el, idx) => ({
              studentName: nameForYou,
              data: pendingCardData,
            })),
          submitButtonTitle: "Share Reply",
        };
        break;
      case "reflect":
        workspaceContents = {
          submittedCards: this.getReflectionSubmittedCards(),
          pendingCards: Array(3)
            .fill(null)
            .map((el, idx) => ({
              studentName: nameForYou,
              data: pendingCardData,
            })),
          submitButtonTitle: "Submit Reflection",
        };
        break;
      case "conclusion":
        workspaceContents = {
          submittedCards: this.getReflectionSubmittedCards(),
          pendingCards: [],
          submitButtonTitle: "Submit Reflection",
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
          {workspace}
        </PageContainer>
      </div>
    );
  };
}
