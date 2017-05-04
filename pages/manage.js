// @flow
import React from "react";
import NumericInput from "react-numeric-input";

import { signIn } from "../lib/auth";
import { loadManagementData, saveManagementData } from "../lib/db";

type State = {
  ready: boolean,
  maximumPageNumber: ?number,
};

// TODO(andy): For now, no security around this whatsoever. If we deploy this in public, we'll want to change that.
export default class ManagePage extends React.Component {
  state: State = {
    ready: false,
    maximumPageNumber: null,
  };

  getFlowID = () => this.props.url.query.flowID;
  getClassCode = () => this.props.url.query.classCode;

  componentDidMount = () => {
    (async () => {
      await signIn();
      const managementData = (await loadManagementData(
        this.getFlowID(),
        this.getClassCode(),
      )) || {};
      this.setState({
        ready: true,
        maximumPageNumber: managementData.maximumPageNumber || null,
      });
    })();
  };

  setMaximumPageNumber = (newMaximumPageNumber: ?number) => {
    const newManagementData = { maximumPageNumber: newMaximumPageNumber };
    this.setState(newManagementData);
    saveManagementData(
      this.getFlowID(),
      this.getClassCode(),
      newManagementData,
    );
  };

  onCheckMaximumPageNumber = () => {
    this.setMaximumPageNumber(this.state.maximumPageNumber === null ? 0 : null);
  };

  onChangeMaximumPageNumber = (newValue: number) => {
    this.setMaximumPageNumber(newValue);
  };

  render = () => {
    const { flowID, classCode } = this.props.url.query;
    if (!this.getClassCode()) {
      return <h2>Add ?classCode=XYZ to the URL</h2>;
    }
    if (!this.getFlowID()) {
      return <h2>Add &flowID=XYZ to the URL</h2>;
    }
    if (!this.state.ready) {
      return null;
    }

    return (
      <p>
        <label>
          <input
            type="checkbox"
            checked={this.state.maximumPageNumber !== null}
            onChange={this.onCheckMaximumPageNumber}
          />
          {" "}
          limit students to pages up to and including page
          {" "}
        </label>
        <NumericInput
          min={0}
          value={this.state.maximumPageNumber}
          disabled={this.state.maximumPageNumber === null}
          onChange={this.onChangeMaximumPageNumber}
        />
        {" "}
        (0-indexed)
      </p>
    );
  };
}
