import React from "react";
import Router from "next/router";
import { default as KeyPather } from "keypather";
const keypather = new KeyPather();

import cohortName from "../lib/cohort";
import flowLookupTable from "../lib/flows";
import ModuleFlow from "../lib/components/modules/module-flow";
import reportError from "../lib/error";
import { signIn } from "../lib/auth";
import {
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

    if (this.props.url.query.fallbackUser) {
      this.setUserState({ isFallbackUser: true });
    }

    if (this.props.url.query.forceAssignReviewee) {
      this.setUserState({
        forceAssignReviewee: this.props.url.query.forceAssignReviewee,
      });
    }
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
      this.recordPageLoad(this.state.currentPage);
      const inboxSubscriptionCancelFunction = watchInbox(
        this.getFlowID(),
        getCohortFromURL(this.props.url),
        this.state.userID,
        inbox => this.setState({ inbox }),
      );
      this.setState({ inboxSubscriptionCancelFunction });
    })().catch(reportError);
  };

  componentWillUnmount = () => {
    this.state.managementSubscriptionCancelFunction &&
      this.state.managementSubscriptionCancelFunction();

    this.state.inboxSubscriptionCancelFunction &&
      this.state.inboxSubscriptionCancelFunction();
  };

  getFlowID = () => getFlowIDFromQuery(this.props.url.query);

  getDatabaseVersion = () =>
    flowLookupTable[this.getFlowID()].databaseVersion || 1;

  setUserState = newUserState => {
    this.setState({ userState: { ...this.state.userState, ...newUserState } });

    (async () => {
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

  onChange = (index, newInputs) => {
    const saveToServer = async () => {
      saveData(
        this.getDatabaseVersion(),
        this.getFlowID(),
        getCohortFromURL(this.props.url),
        this.state.userID,
        index,
        newInputs,
      );
    };
    saveToServer().catch(reportError);

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
    if (newPageIndex > (this.state.userState.furthestPageLoaded || -1)) {
      if (newPageIndex > 0) {
        commitData(
          this.getDatabaseVersion(),
          this.getFlowID(),
          getCohortFromURL(this.props.url),
          this.state.userID,
          newPageIndex - 1,
          this.state.inputs[newPageIndex - 1],
        );
      }
      this.setUserState({
        furthestPageLoaded: newPageIndex,
      });
    }
  };

  setCurrentPage = newPageIndex => {
    this.setState({ currentPage: newPageIndex });
    Router.push({
      ...this.props.url,
      query: { ...this.props.url.query, page: newPageIndex },
    });
  };

  onPageChange = newPageIndex => {
    this.recordPageLoad(newPageIndex);
    this.setCurrentPage(newPageIndex);
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
    const flow = flowLookupTable[this.getFlowID()];
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

    const flow = flowLookupTable[this.getFlowID()];

    if (flow.requiresEmail && !this.state.userState.email) {
      return <Welcome onSubmit={this.onSubmitEmail} />;
    }

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
      >
        {modules}
      </ModuleFlow>
    );
  };
}
