import React from "react";
import Router from "next/router";
import { default as KeyPather } from "keypather";
import throttle from "lodash.throttle";
const keypather = new KeyPather();

import cohortName from "../lib/cohort";
import flowLookupTable from "../lib/flows";
import ModuleFlow from "../lib/components/modules/module-flow";
import reportError from "../lib/error";
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
import Welcome from "../lib/components/modules/welcome";

const getFlowIDFromQuery = query => {
  const defaultFlowID = "test";
  return query.flowID || defaultFlowID;
};

const getPageNumberFromURL = url => {
  return Number.parseInt(url.query.page || "0");
};

const getCohortFromURL = url => {
  return url.query.classCode || cohortName;
};

export default class FlowPage extends React.Component {
  constructor(props) {
    super(props);
    const initialPage = getPageNumberFromURL(props.url);
    this.state = {
      ready: false,
      inputs: [],
      userState: {},
      remoteData: {},
      maximumPageNumber: -1,
      currentPage: initialPage,
      inbox: {},
      hasConnectivity: true,
      pendingSaveRequestIDs: {},
      nextSaveRequestID: 0,
      saveRequestTimeoutTime: 0,
    };

    this.dispatcher = (action, parameters) => {
      switch (action) {
        case "rejectResponse":
          if (this.state.userState.rejectionCount >= 3) {
            // TODO: Obviously, this isn't secure at all, but whatever.
            return;
          }

          const { revieweeIndex } = parameters;
          this.setUserState({
            rejectionCount: (this.state.userState.rejectionCount || 0) + 1,
            pendingRejections: [
              ...(this.state.userState.pendingRejections || []),
              this.state.userState.reviewees[revieweeIndex].userID,
            ],
          });
          break;
        default:
          throw new Error(
            `Unknown dispatcher action ${action} with parameters ${parameters}`,
          );
      }
    };
    this.remoteDataGenerationCounts = {};
  }

  // TODO(andy): Maybe have the server do the anonymous login to avoid the double round trip.
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
    const classCode = getCohortFromURL(this.props.url);
    const { inputs, userState } =
      (await loadData(this.getFlowID(), classCode, activeUserID)) || {};

    if (
      userState &&
      userState.furthestPageLoaded &&
      this.props.url.query.page === undefined
    ) {
      this.setCurrentPage(Number.parseInt(userState.furthestPageLoaded));
    }

    const managementSubscriptionCancelFunction = loadManagementData(
      this.getFlowID(),
      classCode,
      newManagementData => {
        const data = newManagementData || {};
        const maximumPageNumber = Number.parseInt(data.maximumPageNumber); // It's a text field in the management UI, so stray spaces or whatever can get in there, making this a string sometimes...
        this.setState({
          maximumPageNumber: Number.isNaN(maximumPageNumber)
            ? Number.MAX_VALUE
            : maximumPageNumber,
        });
      },
    );

    this.setState({
      ready: true,
      inputs: inputs || [],
      userState: userState || {},
      userID: activeUserID,
      managementSubscriptionCancelFunction,
    });

    let baseUserState = {};

    if (this.props.url.query.fallbackUser) {
      baseUserState.isFallbackUser = true;
    }

    if (this.props.url.query.email) {
      baseUserState.email = this.props.url.query.email;
      baseUserState.prepopulatedEmail = true;
      baseUserState.needsWelcome = true;
    }

    if (this.props.url.query.kaid) {
      baseUserState.kaid = this.props.url.query.kaid;
    }

    if (this.props.url.query.forceAssignReviewee) {
      baseUserState.forceAssignReviewee = this.props.url.query.forceAssignReviewee;
      baseUserState.furthestPageLoaded =
        (this.getFlow().submissionThreshold || 0) + 1;
      setTimeout(() => {
        this.setCurrentPage(baseUserState.furthestPageLoaded);
      }, 0); // TODO oh jeez hack.
      const newQuery = { ...this.props.url.query };
      delete newQuery.forceAssignReviewee;
      Router.replace({
        ...this.props.url,
        query: { ...newQuery },
      });
    }

    this.setUserState(baseUserState);
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
      const connectivitySubscriptionCancelFunction = setConnectivityHandler(
        this.connectivityHandler,
      );
      this.recordPageLoad(this.state.currentPage);
      const inboxSubscriptionCancelFunction = watchInbox(
        this.getFlowID(),
        getCohortFromURL(this.props.url),
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

  connectivityHandler = newConnectivityValue => {
    this.setState({ hasConnectivity: newConnectivityValue });
  };

  getFlowID = () => getFlowIDFromQuery(this.props.url.query);

  getFlow = () => flowLookupTable[this.getFlowID()];

  getDatabaseVersion = () =>
    flowLookupTable[this.getFlowID()].databaseVersion || 1;

  setUserState = newUserState => {
    this.setState({ userState: { ...this.state.userState, ...newUserState } });

    return (async () => {
      const latestUserState = await saveUserState(
        this.getFlowID(),
        getCohortFromURL(this.props.url),
        this.state.userID,
        newUserState,
      );
      if (latestUserState) {
        this.setState({ userState: latestUserState });
      }
    })().catch(reportError);
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
          this.getDatabaseVersion(),
          this.getFlowID(),
          getCohortFromURL(this.props.url),
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

  onChange = (index, newInputs) => {
    this.throttledSaveToServer(index, newInputs);

    let { inputs } = this.state;
    if (inputs.length < index) {
      inputs = [...inputs, Array(index - inputs.length).fill({})];
    }
    this.setState({
      inputs: [
        ...inputs.slice(0, index),
        newInputs,
        ...inputs.slice(index + 1),
      ],
    });
  };

  recordPageLoad = newPageIndex => {
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

        return commitData(
          this.getDatabaseVersion(),
          this.getFlowID(),
          getCohortFromURL(this.props.url),
          this.state.userID,
          newPageIndex - 1,
          this.state.inputs[newPageIndex - 1],
        ).then(() => {
          this.setUserState({
            furthestPageLoaded: newPageIndex,
          }).then(() => {
            delete this.state.pendingSaveRequestIDs[commitSaveRequestString];
            this.setState({
              pendingSaveRequestIDs: this.state.pendingSaveRequestIDs,
            });
          });
        });
      } else {
        this.setUserState({
          furthestPageLoaded: newPageIndex,
        });
      }
    }
    return Promise.resolve(null);
  };

  setCurrentPage = newPageIndex => {
    console.log("Setting current page to", newPageIndex);
    this.setState({ currentPage: newPageIndex });
    Router.push({
      ...this.props.url,
      query: { ...this.props.url.query, page: newPageIndex },
    });
  };

  onPageChange = newPageIndex => {
    this.recordPageLoad(newPageIndex).then(() => {
      this.setCurrentPage(newPageIndex);
    });
  };

  onSubmitEmail = email => {
    this.setUserState({ email });
  };

  componentWillUpdate = (nextProps, nextState) => {
    const nextPageNumber = getPageNumberFromURL(nextProps.url);
    if (nextPageNumber !== nextState.currentPage) {
      this.setState({ currentPage: nextPageNumber });
    }

    // If our flow has any remote data requirements, we'll see if any of those requirements' data has changed. If so, we'll run the remote fetcher associated with that data requirement.
    const flow = this.getFlow();
    for (let remoteDataKey in flow.remoteDataRequirements || {}) {
      const { inputs, fetcher } = flow.remoteDataRequirements[remoteDataKey];
      const oldAndNewData = inputs.map(keyPathString => {
        const oldState = keypather.get(this.state, keyPathString);
        const newState = keypather.get(nextState, keyPathString);
        return [oldState, newState];
      });
      if (oldAndNewData.some(([oldState, newState]) => oldState !== newState)) {
        const newData = oldAndNewData.map(([oldState, newState]) => newState);
        const newGenerationCount =
          1 + (this.remoteDataGenerationCounts[remoteDataKey] || 0);
        this.remoteDataGenerationCounts[remoteDataKey] = newGenerationCount;
        const updateRemoteData = async () => {
          const fetcherResponse = await fetcher(
            newData,
            nextState.userID,
            getCohortFromURL(this.props.url),
            { inputs: nextState.inputs, userState: nextState.userState },
          );
          if (
            fetcherResponse &&
            this.remoteDataGenerationCounts[remoteDataKey] == newGenerationCount
          ) {
            const remoteData = fetcherResponse.remoteData || fetcherResponse;
            const newUserState = fetcherResponse.newUserState;
            this.setState({
              remoteData: {
                ...this.state.remoteData,
                [remoteDataKey]: remoteData,
              },
            });
            if (newUserState) {
              this.setUserState(newUserState);
            }
          }
        };
        updateRemoteData().catch(reportError);
      }
    }
  };

  render = () => {
    if (!this.state.ready) {
      // TODO(andy): Implement loading page.
      return null;
    }

    const flow = this.getFlow();

    if (flow.requiresEmail && !this.state.userState.email) {
      return <Welcome onSubmit={this.onSubmitEmail} collectEmail />;
    } else if (this.state.userState.needsWelcome) {
      return (
        <Welcome onSubmit={() => this.setUserState({ needsWelcome: null })} />
      );
    }

    const isHighLatency = Object.keys(this.state.pendingSaveRequestIDs).find(
      saveRequestID =>
        this.state.pendingSaveRequestIDs[saveRequestID] < Date.now(),
    )
      ? true
      : false;

    const modules = flow.modules || flow;
    return (
      <ModuleFlow
        ready={this.state.ready}
        onChange={this.onChange}
        data={this.state.inputs}
        query={this.props.url.query}
        remoteData={{ ...this.state.remoteData, _inbox: this.state.inbox }}
        moduleIndex={this.state.currentPage}
        furthestPageLoaded={this.state.userState.furthestPageLoaded || 0}
        maximumPageNumber={this.state.maximumPageNumber}
        onPageChange={this.onPageChange}
        dispatcher={this.dispatcher}
        hasConnectivity={this.state.hasConnectivity && !isHighLatency}
      >
        {modules}
      </ModuleFlow>
    );
  };
}
