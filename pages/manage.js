// @flow
import { default as KeyPather } from "keypather";
import NumericInput from "react-numeric-input";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import BasePrompt from "../lib/components/modules/base-prompt";
import flowLookupTable from "../lib/flows";
import { signIn } from "../lib/auth";
import {
  copyFallbackUsers,
  loadData,
  loadManagementData,
  saveManagementData,
} from "../lib/db";

const keypather = new KeyPather();

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
      const managementData =
        (await loadManagementData(flowID, classCode)) || {};

      const userData = await loadData(flowID, classCode, null);

      this.setState({
        userData: userData || {},
        ready: true,
        maximumPageNumber: managementData.maximumPageNumber || null,
      });
    })();
  };

  componentWillUpdate = (nextProps, nextState) => {
    if (!this.state.ready && nextState.ready) {
      // If our flow has any remote data requirements, we'll see if any of those requirements' data has changed. If so, we'll run the remote fetcher associated with that data requirement.
      (async nextState => {
        const flow = flowLookupTable[this.getFlowID()];
        const remoteData = {};
        for (let userID in nextState.userData) {
          remoteData[userID] = {};
          const userData = nextState.userData[userID];
          if (!userData.inputs) {
            continue;
          }
          remoteData[userID]["_inbox"] = userData.inbox;
          for (let remoteDataKey in flow.remoteDataRequirements || {}) {
            const { inputs, fetcher } = flow.remoteDataRequirements[
              remoteDataKey
            ];
            const fetcherInputs = inputs.map(keyPathString =>
              keypather.get(userData, keyPathString),
            );
            try {
              const fetcherResponse = await fetcher(
                fetcherInputs,
                userID,
                this.getClassCode(),
                userData,
              );
              if (fetcherResponse) {
                const studentRemoteData =
                  fetcherResponse.remoteData || fetcherResponse;
                remoteData[userID][remoteDataKey] = studentRemoteData;
              }
            } catch (err) {
              console.error("Remote fetcher failed for ", userID, err);
            }
          }
        }
        this.setState({ remoteData });
      })(nextState);
    }
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

  onClickPopulateFallbackUsers = () => {
    const sourceClassCode = window.prompt(
      "Enter the class code from which the fallback users should be copied:",
    );
    copyFallbackUsers(
      this.getFlowID(),
      sourceClassCode,
      this.props.url.query.classCode,
    );
  };

  renderModule = (
    getUserInput,
    getRemoteData,
    userState,
    module,
    moduleIndex,
  ) => {
    const currentModuleData = getUserInput(moduleIndex);

    const extraProps = {
      ...module.props,
      editable: false,
      inManagerInterface: true,
      data: currentModuleData,
      query: this.props.url.query,
    };

    const filteredChildren = React.Children
      .toArray(module.props.children)
      .filter(child => !child.props.hideInReport);

    if (module.props.passThroughInManagerUI) {
      return (
        <BasePrompt {...extraProps}>
          {filteredChildren}
        </BasePrompt>
      );
    } else {
      return React.cloneElement(module, extraProps, filteredChildren);
    }
  };

  renderAdmin = (flow, modules) => {
    return (
      <div className={css(styles.container)}>
        <p>
          <label>
            <input
              type="checkbox"
              checked={this.state.maximumPageNumber !== null}
              onChange={this.onCheckMaximumPageNumber}
            />{" "}
            limit students to pages up to and including page{" "}
          </label>
          <NumericInput
            min={0}
            value={this.state.maximumPageNumber}
            disabled={this.state.maximumPageNumber === null}
            onChange={this.onChangeMaximumPageNumber}
          />{" "}
          (0-indexed)
        </p>
        <p>
          <button onClick={this.onClickPopulateFallbackUsers}>
            Populate this class code with fallback users
          </button>
        </p>
        <hr />
        <div>
          {Object.keys(this.state.userData).map((userID, index) => {
            const userData = this.state.userData[userID].inputs;
            if (!userData) {
              return null;
            }
            const getUserInput = index => userData[index] || {};
            const getRemoteData = key =>
              this.state.remoteData && this.state.remoteData[userID][key];
            const children = modules(getUserInput, getRemoteData);
            const userState = this.state.userData[userID].userState;
            return (
              <div key={userID}>
                <h2>
                  Student {index + 1} ({userID})
                </h2>
                <p>
                  {JSON.stringify(userState, undefined, 1)}
                </p>
                {children.map((module, moduleIndex) =>
                  <div key={moduleIndex}>
                    <h3>
                      Student {index + 1}: Page {moduleIndex + 1}
                    </h3>
                    {this.renderModule(
                      getUserInput,
                      getRemoteData,
                      userState,
                      module,
                      moduleIndex,
                    )}
                    <hr />
                  </div>,
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  renderReport = (flow, modules) => {
    const { reportSpec } = flow;
    return (
      <div className={css(styles.container)}>
        {Object.keys(this.state.userData).map((userID, index) => {
          const userData = this.state.userData[userID].inputs;
          if (!userData) {
            return null;
          }
          const getUserInput = index => userData[index] || {};
          const getRemoteData = key =>
            this.state.remoteData && this.state.remoteData[userID][key];
          const children = modules(getUserInput, getRemoteData);
          const userState = this.state.userData[userID].userState;

          if (!userState) {
            return null;
          }

          const reviewingEmails =
            userState.reviewees &&
            userState.reviewees.map(r => {
              const reviewee = this.state.userData[r.userID];
              return (
                (reviewee && reviewee.userState && reviewee.userState.email) ||
                ""
              );
            });

          const inbox = this.state.userData[userID].inbox;
          const reviewedByEmails =
            inbox &&
            Object.keys(inbox).map(k => {
              const message = inbox[k];
              const userID = inbox[k].fromUserID;
              const reviewer = this.state.userData[userID];
              return (
                (reviewer && reviewer.userState && reviewer.userState.email) ||
                ""
              );
            });

          return (
            <div key={userID}>
              <h1>
                {userState.email}
              </h1>
              {reviewingEmails || reviewedByEmails
                ? <p>
                    {`${reviewingEmails
                      ? `Reviewing: ${reviewingEmails.join(", ")}. `
                      : ""}${reviewedByEmails
                      ? `Reviewed by: ${reviewedByEmails[0]}.`
                      : ""}`}
                  </p>
                : null}
              <div
                style={{
                  display: "flex",
                }}
              >
                {reportSpec.map(spec => {
                  return (
                    <div
                      style={{
                        width: `${1 / reportSpec.length * 100}%`,
                        minWidth: 400,
                        display: "inline-block",
                        marginRight: 24,
                      }}
                    >
                      {(Array.isArray(spec) ? spec : [spec]).map(moduleIndex =>
                        <div style={{ marginBottom: -64 }}>
                          {this.renderModule(
                            getUserInput,
                            getRemoteData,
                            userState,
                            children[moduleIndex],
                            moduleIndex,
                          )}
                        </div>,
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
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

    // This doesn't actually need to be secure at the moment, so we'll just go by URL. /report for teachers, /manage for us.
    const isAdmin = this.props.url.pathname === "/manage";

    if (isAdmin) {
      return this.renderAdmin(flow, modules);
    } else {
      return this.renderReport(flow, modules);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
});
