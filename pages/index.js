import React from "react";

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
    this.state = { signedIn: false };
  }

  // TODO(andy): Maybe have the server do the anonymous login to avoid the double round trip. Or at least have the server render the initial page, without data, and with disabled controls.
  fetchInitialData = async () => {
    const userID = await signIn();
    const data = await loadData(this.getFlowID(), cohort, userID);
    console.log(userID, data);
    this.setState({ signedIn: true, data: data || [], userID });
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

  render = () => {
    if (this.state.signedIn) {
      return (
        <ModuleFlow onChange={this.onChange} data={this.state.data}>
          {flowLookupTable[this.getFlowID()]}
        </ModuleFlow>
      );
    } else {
      return <p>Loading...</p>;
    }
  };
}
