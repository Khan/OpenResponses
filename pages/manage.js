// @flow
import React from "react";
import NumericInput from "react-numeric-input";

import flowLookupTable from "../lib/flows";
import { signIn } from "../lib/auth";
import { loadData, loadManagementData, saveManagementData } from "../lib/db";

type State = {
  ready: boolean,
  maximumPageNumber: ?number,
  userData: { [key: string]: any },
  dataSubscriptionCancelFunction: ?() => void,
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

      const flowID = this.getFlowID();
      const classCode = this.getClassCode();
      const managementData = (await loadManagementData(flowID, classCode)) || {
      };

      const dataSubscriptionCancelFunction = loadData(
        flowID,
        classCode,
        null,
        userData => {
          this.setState({
            userData: userData || {},
            ready: true,
          });
        },
      );

      this.setState({
        maximumPageNumber: managementData.maximumPageNumber || null,
        dataSubscriptionCancelFunction,
      });
    })();
  };

  componentWillUnmount = () => {
    this.state.dataSubscriptionCancelFunction &&
      this.state.dataSubscriptionCancelFunction();
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

    const flow = flowLookupTable[this.getFlowID()];
    const modules = flow.modules || flow;

    return (
      <div>
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
        <hr />
        <div>
          {Object.keys(this.state.userData).map(userID => {
            const userData = this.state.userData[userID].inputs;
            if (!userData) {
              return null;
            }
            const getUserInput = index => userData[index] || {};
            const children = modules(getUserInput, key => {});
            const userState = this.state.userData[userID].userState;
            return (
              <div key={userID}>
                <h2>{userID}</h2>
                <p>
                  {JSON.stringify(userState, undefined, 1)}
                </p>
                {children.map((module, moduleIndex) => {
                  const currentModuleData = getUserInput(moduleIndex);
                  const dataMappedElement = React.cloneElement(module, {
                    ...module.props,
                    editable: false,
                    data: currentModuleData,
                    query: this.props.url.query,
                  });
                  return (
                    <div key={moduleIndex}>
                      {dataMappedElement}
                      <hr />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
}
