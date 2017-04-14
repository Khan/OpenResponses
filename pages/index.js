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
  static async getInitialProps({ query }) {
    const userID = await signIn();
    const data = await loadData(getFlowIDFromQuery(query), cohort, userID);
    return { userID, data };
  }

  constructor(props: { data: any, userID: string }) {
    super(props);
    this.state = { data: props.data || [] };
  }

  getFlowID = () => getFlowIDFromQuery(this.props.url.query);

  onChange = (index, newData) => {
    saveData(this.getFlowID(), cohort, this.props.userID, index, newData);

    const { data } = this.state;
    this.setState({
      data: [...data.slice(0, index), newData, ...data.slice(index + 1)],
    });
  };

  render = () => (
    <ModuleFlow onChange={this.onChange} data={this.state.data}>
      {flowLookupTable[this.getFlowID()]}
    </ModuleFlow>
  );
}
