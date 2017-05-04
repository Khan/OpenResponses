import React from "react";
import Router from "next/router";
import KeyPath from "key-path";

import cohortName from "../lib/cohort";
import flowLookupTable from "../lib/flows";
import ModuleFlow from "../lib/components/modules/module-flow";
import { signIn } from "../lib/auth";
import {
  loadData,
  saveData,
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
    const userID = await signIn();
    const classCode = getCohortFromURL(this.props.url);
    const { inputs, userState } = (await loadData(
      this.getFlowID(),
      classCode,
      userID,
    )) || {};

    const managementSubscriptionCancelFunction = loadManagementData(
      this.getFlowID(),
      classCode,
      newManagementData => {
        const data = newManagementData || {};
        this.setState({
          maximumPageNumber: typeof data.maximumPageNumber === "number"
            ? data.maximumPageNumber
            : Number.MAX_VALUE,
        });
      },
    );

    this.setState({
      ready: true,
      inputs: inputs || [],
      userState: userState || {},
      userID,
      managementSubscriptionCancelFunction,
    });
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
      this.recordPageLoad(this.state.currentPage);
    })();
  };

  componentWillUnmount = () => {
    this.state.managementSubscriptionCancelFunction &&
      this.state.managementSubscriptionCancelFunction();
  };

  getFlowID = () => getFlowIDFromQuery(this.props.url.query);

  onChange = (index, newInputs) => {
    const saveToServer = async () => {
      await signIn();
      saveData(
        this.getFlowID(),
        getCohortFromURL(this.props.url),
        this.state.userID,
        index,
        newInputs,
      );
    };
    saveToServer();

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
      const newUserState = {
        ...this.state.userState,
        furthestPageLoaded: newPageIndex,
      };
      this.setState({ userState: newUserState });
      (async () => {
        await signIn();
        saveUserState(
          this.getFlowID(),
          getCohortFromURL(this.props.url),
          this.state.userID,
          newUserState,
        );
      })();
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
        const keyPath = KeyPath.get(keyPathString);
        const oldState = keyPath.getValueFrom(this.state.inputs);
        const newState = keyPath.getValueFrom(nextState.inputs);
        return [oldState, newState];
      });
      if (oldAndNewData.some(([oldState, newState]) => oldState !== newState)) {
        const newData = oldAndNewData.map(([oldState, newState]) => newState);
        const newGenerationCount = 1 +
          (this.remoteDataGenerationCounts[remoteDataKey] || 0);
        this.remoteDataGenerationCounts[remoteDataKey] = newGenerationCount;
        const updateRemoteData = async () => {
          const remoteData = await fetcher(
            newData,
            this.state.userID,
            getCohortFromURL(this.props.url),
          );
          if (
            this.remoteDataGenerationCounts[remoteDataKey] == newGenerationCount
          ) {
            this.setState({
              remoteData: {
                ...this.state.remoteData,
                [remoteDataKey]: remoteData,
              },
            });
          }
        };
        updateRemoteData();
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
