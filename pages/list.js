// @flow
import Head from "next/head";
import React, { Fragment } from "react";
import { css, StyleSheet } from "aphrodite";

import activities from "../lib/activities";
import Prompt from "../lib/components/prompt";
import sharedStyles from "../lib/styles";
import Thread from "../lib/components/thread";
import { signIn } from "../lib/auth";

import { _getDatabase } from "../lib/db";

type State = {
  ready: boolean,
  data: Object,
};

const lastPostTimestampFromClassData = classData => {
  if (classData.threads) {
    // >= v3
    const { threads } = classData;
    const threadTimestamps = Object.keys(threads).map(threadKey => {
      const posts = threads[threadKey].posts;
      const sortedPostKeys = Object.keys(posts).sort();
      return posts[sortedPostKeys[sortedPostKeys.length - 1]]
        .submissionTimestamp;
    });
    return Math.max(...threadTimestamps) || 0;
  } else {
    // v2
    const submissionTimestamps = Object.keys(classData).map(userID => {
      const log = classData[userID].log;
      if (!log) {
        return 0;
      }
      const submissionLogKeys = Object.keys(log).filter(
        logKey => log[logKey].type === "submission",
      );
      if (submissionLogKeys.length > 0) {
        return log[submissionLogKeys[submissionLogKeys.length - 1]].time;
      } else {
        return 0;
      }
    });
    return Math.max(...submissionTimestamps) || 0;
  }
};

const countOfStudents = data => {
  if (data.threads) {
    // >= v3
    return Object.keys(data.threads).length;
  } else {
    return Object.keys(data).filter(
      userID => data[userID].inputs && data[userID].inputs.submitted,
    ).length;
  }
};

const Class = ({ activityKey, classCode, data }) => {
  const lastTimestamp = lastPostTimestampFromClassData(data);
  if (!lastTimestamp) {
    return null;
  }
  return (
    <tr>
      <td
        className={css(styles.cell, styles.rightAlign)}
        style={{ width: 100 }}
      >
        {new Date(lastTimestamp).toLocaleDateString()}
      </td>
      <td className={css(styles.cell)} style={{ width: 150 }}>
        {classCode}
      </td>
      <td className={css(styles.cell)} style={{ width: 100 }}>
        {countOfStudents(data)} students
      </td>
      <td className={css(styles.cell)}>
        [<a href={`/report?flowID=${activityKey}&classCode=${classCode}`}>
          report
        </a>] [<a href={`/?flowID=${activityKey}&classCode=${classCode}`}>
          join
        </a>] [<a
          href={`https://console.firebase.google.com/u/0/project/${firebaseConfiguration.projectId}/database/${firebaseConfiguration.projectId}/data/${activityKey}/${classCode}`}
        >
          firebase
        </a>]
      </td>
    </tr>
  );
};

const sortedClassCodes = data =>
  Object.keys(data).sort(
    (a, b) =>
      lastPostTimestampFromClassData(data[b]) -
      lastPostTimestampFromClassData(data[a]),
  );

const Activity = ({ activity, activityKey, data }) => {
  const prompt =
    activity.prompt.type === "default"
      ? activity.prompt
      : activity.prompt.groups[0];
  return (
    <div className={css(styles.activityContainer)}>
      <div className={css(styles.promptContainer)}>
        <Prompt title={activity.title} {...prompt} forceSmallStimuli />
      </div>
      <div className={css(styles.classData)}>
        <h1 className={css(styles.activityKey)}>{activityKey}</h1>
        <table>
          {sortedClassCodes(data).map(classCode => (
            <Class
              key={classCode}
              activityKey={activityKey}
              classCode={classCode}
              data={data[classCode]}
            />
          ))}
        </table>
      </div>
    </div>
  );
};

export default class ReportPage extends React.Component<{}, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      ready: false,
      data: {},
    };
  }

  fetchInitialData = async () => {
    const activeUserID = await signIn();

    const data = {};
    for (let activityKey of Object.keys(activities)) {
      const dbSnapshot = await _getDatabase()
        .ref(activityKey)
        .once("value");
      data[activityKey] = dbSnapshot.val();
    }

    this.setState({
      ready: true,
      data,
    });
  };

  componentDidMount = () => {
    (async () => {
      await this.fetchInitialData();
    })();
  };

  render = () => {
    if (!this.state.ready) {
      return null;
    }

    const lastTimestampByActivityKey = {};
    for (let activityKey of Object.keys(activities)) {
      const activityData = this.state.data[activityKey];
      if (Object.keys(activityData).length === 0) {
        return 0;
      }
      const sortedActivityClassCodes = sortedClassCodes(activityData);
      lastTimestampByActivityKey[activityKey] = lastPostTimestampFromClassData(
        activityData[sortedActivityClassCodes[0]],
      );
    }

    const sortedActivityKeys = Object.keys(activities).sort(
      (a, b) => lastTimestampByActivityKey[b] - lastTimestampByActivityKey[a],
    );

    return sortedActivityKeys.map(activityKey => (
      <Activity
        activity={activities[activityKey]}
        activityKey={activityKey}
        data={this.state.data[activityKey]}
      />
    ));
  };
}

const styles = StyleSheet.create({
  activityContainer: {
    display: "flex",
    margin: 32,
  },

  promptContainer: {
    width: 400,
    marginRight: 32,
  },

  classData: {
    width: 600,
  },

  cell: {
    ...sharedStyles.wbTypography.body,
    textAlign: "left",
    paddingRight: 16,
  },

  rightAlign: {
    textAlign: "right",
    paddingRight: 16,
  },

  activityKey: {
    ...sharedStyles.wbTypography.headingLarge,
  },
});
