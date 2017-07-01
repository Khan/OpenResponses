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
} from "../lib/db";

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
    const { inputs, userState } = (await loadData(
      this.getFlowID(),
      classCode,
      activeUserID,
    )) || {};

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
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
      this.recordPageLoad(this.state.currentPage);
    })().catch(reportError);
  };

  componentWillUnmount = () => {
    this.state.managementSubscriptionCancelFunction &&
      this.state.managementSubscriptionCancelFunction();
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

  onPageChange = newPageIndex => {
    this.recordPageLoad(newPageIndex);
    this.setState({ currentPage: newPageIndex });
    Router.push({
      ...this.props.url,
      query: { ...this.props.url.query, page: newPageIndex },
    });
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
        const newGenerationCount = 1 +
          (this.remoteDataGenerationCounts[remoteDataKey] || 0);
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
    const flow = flowLookupTable[this.getFlowID()];
    const modules = flow.modules || flow;
    return (
      <ModuleFlow
        ready={this.state.ready}
        onChange={this.onChange}
        data={this.state.inputs}
        query={this.props.url.query}
        remoteData={this.state.remoteData}
        moduleIndex={this.state.currentPage}
        furthestPageLoaded={this.state.userState.furthestPageLoaded || 0}
        maximumPageNumber={this.state.maximumPageNumber}
        onPageChange={this.onPageChange}
      >
        {modules}
      </ModuleFlow>
    );
  };
}
