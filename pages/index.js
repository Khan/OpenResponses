import React from "react";
import KeyPath from "key-path";

import flowLookupTable from "../lib/flows";
import ModuleFlow from "../lib/components/modules/module-flow";
import { signIn } from "../lib/auth";
import { loadData, saveData } from "../lib/db";

const getFlowIDFromQuery = query => {
  const defaultFlowID = "test";
  return query.flowID || defaultFlowID;
};

// TODO(andy): Extract cohort constants.
const cohort = "default";

export default class FlowPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ready: false, data: [], remoteData: {} };
    this.remoteDataGenerationCounts = {};
  }

  // TODO(andy): Maybe have the server do the anonymous login to avoid the double round trip.
  fetchInitialData = async () => {
    const userID = await signIn();
    const data = await loadData(this.getFlowID(), cohort, userID);
    this.setState({
      ready: true,
      data: data || [],
      userID,
    });
  };

  componentDidMount = () => {
    this.fetchInitialData();
  };

  getFlowID = () => getFlowIDFromQuery(this.props.url.query);

  onChange = (index, newData) => {
    const saveToServer = async () => {
      await signIn();
      saveData(this.getFlowID(), cohort, this.state.userID, index, newData);
    };
    saveToServer();

    const { data } = this.state;
    this.setState({
      data: [...data.slice(0, index), newData, ...data.slice(index + 1)],
    });
  };

  componentWillUpdate = (nextProps, nextState) => {
    // If our flow has any remote data requirements, we'll see if any of those requirements' data has changed. If so, we'll run the remote fetcher associated with that data requirement.
    const flow = flowLookupTable[this.getFlowID()];
    for (let remoteDataKey in flow.remoteDataRequirements || {}) {
      const { inputs, fetcher } = flow.remoteDataRequirements[remoteDataKey];
      const oldAndNewData = inputs.map(keyPathString => {
        const keyPath = KeyPath.get(keyPathString);
        const oldState = keyPath.getValueFrom(this.state.data);
        const newState = keyPath.getValueFrom(nextState.data);
        return [oldState, newState];
      });
      if (oldAndNewData.some(([oldState, newState]) => oldState !== newState)) {
        const newData = oldAndNewData.map(([oldState, newState]) => newState);
        const newGenerationCount = 1 +
          (this.remoteDataGenerationCounts[remoteDataKey] || 0);
        this.remoteDataGenerationCounts[remoteDataKey] = newGenerationCount;
        const updateRemoteData = async () => {
          const remoteData = await fetcher(newData);
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
        data={this.state.data}
        remoteData={this.state.remoteData}
      >
        {modules}
      </ModuleFlow>
    );
  };
}
