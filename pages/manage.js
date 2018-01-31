// @flow
import { default as KeyPather } from "keypather";
import moment from "moment";
// import NumericInput from "react-numeric-input";
import React from "react";
import { css, StyleSheet } from "aphrodite";

import BasePrompt from "../lib/components/modules/base-prompt";
import flowLookupTable from "../lib/flows";
import PageButton from "../lib/components/page-button";
import { signIn } from "../lib/auth";
import {
  copyFallbackUsers,
  loadData,
  loadManagementData,
  saveManagementData,
} from "../lib/db";
import sharedStyles from "../lib/styles";

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
                true, // inManagerInterface
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

    if (
      module.props.passThroughInManagerUI ||
      module.props.passThroughInManagerUI === undefined
    ) {
      return <BasePrompt {...extraProps}>{filteredChildren}</BasePrompt>;
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
          {
            null /*<NumericInput
            min={0}
            value={this.state.maximumPageNumber}
            disabled={this.state.maximumPageNumber === null}
            onChange={this.onChangeMaximumPageNumber}
          />*/
          }{" "}
          (0-indexed)
        </p>
        <p>
          <button onClick={this.onClickPopulateFallbackUsers}>
            Populate this class code with fallback users
          </button>
        </p>
      </div>
    );
  };

  countOfUsers = (modules, withSubmissionAtPage, requireReview) => {
    if (!modules) {
      return 0;
    }
    return Object.keys(this.state.userData).filter((userID, index) => {
      const userInputs = this.state.userData[userID].inputs;
      if (!userInputs) {
        return false;
      }
      const getUserInput = index => userInputs[index] || {};
      const getRemoteData = key =>
        this.state.remoteData && this.state.remoteData[userID][key];
      const children = modules(getUserInput, getRemoteData);
      const userData = this.state.userData[userID];
      const userState = userData.userState;

      if (!userState) {
        return false;
      }

      if (userState.isFallbackUser || !userState.email) {
        return false;
      }

      if (requireReview && !userData.inbox) {
        return false;
      }

      if (
        withSubmissionAtPage !== undefined &&
        userState.furthestPageLoaded <= withSubmissionAtPage
      ) {
        return false;
      }
      return true;
    }).length;
  };

  renderReport = (flow, modules) => {
    const { reportSpec } = flow;
    let lastCount = this.countOfUsers(modules);
    let lastModuleIndex = 0;
    if (!modules) {
      return null;
    }

    return (
      <div className={css(styles.container)}>
        <div
          className={css(styles.pageNumberBar)}
          style={{ minWidth: reportSpec.length * (400 + 24) }}
        >
          {reportSpec.map(spec => {
            return (
              <div
                style={{
                  width: `${1 / reportSpec.length * 100}%`,
                  minWidth: 400,
                  display: "inline-block",
                  margin: "0 12px",
                  textAlign: "center",
                }}
              >
                {(Array.isArray(spec) ? spec : [spec]).map(moduleIndex => (
                  <PageButton isCompleted disabled>
                    {moduleIndex + 1}
                  </PageButton>
                ))}
              </div>
            );
          })}
        </div>

        <div
          className={css(styles.submissionRatesBar)}
          style={{ minWidth: reportSpec.length * (400 + 24) }}
        >
          {reportSpec.map(spec => {
            return (
              <div
                style={{
                  width: `${1 / reportSpec.length * 100}%`,
                  minWidth: 400,
                  display: "inline-block",
                  margin: "0 12px",
                  textAlign: "left",
                }}
              >
                {(Array.isArray(spec) ? spec : [spec]).map(moduleIndex => {
                  const totalUsers = this.countOfUsers(modules);
                  const reportRate = (currentCount, verb) => {
                    const delta = currentCount - lastCount;
                    const result = (
                      <p>
                        {currentCount} / {totalUsers} ({Number.parseFloat(
                          currentCount / totalUsers * 100,
                        ).toFixed(0)}%){" students "}
                        {verb}
                        {` page ${moduleIndex + 1} `}
                        {moduleIndex !== 0
                          ? ` (−${Number.parseFloat(
                              delta / lastCount * -100,
                            ).toFixed(0)}%)`
                          : ""}
                      </p>
                    );
                    lastCount = currentCount;
                    return result;
                  };

                  let reviewCount = null;
                  if (
                    flow.needsReviewModuleID !== undefined &&
                    moduleIndex === flow.needsReviewModuleID
                  ) {
                    const reviewedUsers = this.countOfUsers(
                      modules,
                      lastModuleIndex,
                      true,
                    );
                    reviewCount = reportRate(reviewedUsers, "reviewed");
                  }
                  const usersPastPage = this.countOfUsers(
                    modules,
                    moduleIndex,
                    moduleIndex >= flow.needsReviewModuleID,
                  );
                  const moduleCount = reportRate(usersPastPage, "submitted");
                  lastModuleIndex = moduleIndex;
                  return (
                    <div>
                      {reviewCount}
                      {moduleCount}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {modules(
            () => ({}),
            () => undefined,
          ).map((module, moduleIndex) => {})}
        </div>

        {Object.keys(this.state.userData).map((userID, index) => {
          const userInputs = this.state.userData[userID].inputs;
          if (!userInputs) {
            return null;
          }
          const getUserInput = index => userInputs[index] || {};
          const getRemoteData = key =>
            this.state.remoteData && this.state.remoteData[userID][key];
          const children = modules(getUserInput, getRemoteData);
          const userData = this.state.userData[userID];
          const userState = userData.userState;

          if (!userState) {
            return null;
          }

          if (userState.isFallbackUser) {
            return null;
          }

          if (
            !Object.keys(userData.log).find(
              logKey => userData.log[logKey].type === "submission",
            )
          ) {
            return null;
          }

          const reviewingEmails =
            userState.reviewees &&
            userState.reviewees.map(r => {
              const reviewee = this.state.userData[r.userID];
              if (!reviewee || !reviewee.userState) {
                return "";
              }
              if (reviewee.userState.isFallbackUser) {
                return "[KA-provided seed student]";
              }
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
                (reviewer &&
                  reviewer.userState &&
                  reviewer.userState.email &&
                  `${reviewer.userState.email} (${moment(inbox[k].time).format(
                    "MMMM Do, YYYY; h:mm A",
                  )})`) ||
                ""
              );
            });

          return (
            <div key={userID}>
              <h1>{userState.email}</h1>
              {reviewingEmails || reviewedByEmails ? (
                <p>
                  {reviewingEmails ? (
                    <span>
                      <strong>Reviewing:</strong> {reviewingEmails.join(", ")}.{" "}
                    </span>
                  ) : null}
                  {reviewedByEmails ? (
                    <span>
                      <strong>Reviewed by:</strong> {reviewedByEmails[0]}.
                    </span>
                  ) : null}
                </p>
              ) : null}
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
                        margin: "0 12px",
                      }}
                    >
                      {(Array.isArray(spec)
                        ? spec
                        : [spec]
                      ).map(moduleIndex => {
                        if (
                          moduleIndex > userState.furthestPageLoaded ||
                          (moduleIndex === userState.furthestPageLoaded &&
                            moduleIndex < children.length - 1)
                        ) {
                          return (
                            <BasePrompt>
                              <p className={css(styles.didNotReachNotice)}>
                                [This student did not submit this page.]
                              </p>
                            </BasePrompt>
                          );
                        } else {
                          const submissionLog =
                            userData.log[
                              Object.keys(userData.log).find(
                                logKey =>
                                  userData.log[logKey].type === "submission" &&
                                  Number.parseInt(
                                    userData.log[logKey].moduleID,
                                  ) === moduleIndex,
                              )
                            ];
                          const submissionMoment =
                            submissionLog && moment(submissionLog.time);

                          return (
                            <div style={{ marginBottom: -64 }}>
                              {submissionMoment ? (
                                <p className={css(styles.submissionTime)}>
                                  [Submitted on{" "}
                                  {submissionMoment.format("MMMM Do, YYYY")} at{" "}
                                  {submissionMoment.format("h:mm A")}]
                                </p>
                              ) : null}
                              {this.renderModule(
                                getUserInput,
                                getRemoteData,
                                userState,
                                children[moduleIndex],
                                moduleIndex,
                              )}
                            </div>
                          );
                        }
                      })}
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

    // This doesn't actually need to be secure at the moment, so we'll just go by URL. /report for teachers, /manage for us.
    const isAdmin = this.props.url.pathname === "/manage";

    if (isAdmin) {
      return this.renderAdmin(flow);
    } else {
      const modules = flow.modules || flow;

      return this.renderReport(flow, modules);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },

  pageNumberBar: {
    zIndex: 100,
    margin: -24,
    padding: "0 24px",
    position: "sticky",
    display: "flex",
    alignItems: "center",
    top: 0,
    left: 0,
    height: 60,
    backgroundColor: "white",
    borderBottom: `1px solid ${sharedStyles.colors.gray85}`,
    marginBottom: 24,
  },

  submissionRatesBar: {
    margin: -24,
    padding: "0 24px",
    backgroundColor: "white",
    marginBottom: 24,
    alignItems: "top",
    color: sharedStyles.colors.gray68,
    display: "flex",
  },

  didNotReachNotice: {
    color: sharedStyles.colors.gray68,
  },

  submissionTime: {
    color: sharedStyles.colors.gray68,
    marginTop: 24,
  },
});
