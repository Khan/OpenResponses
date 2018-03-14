// @flow
import firebase from "firebase";

import type { RichEditorData } from "./components/rich-editor";

let hasInitialized = false;

const managementUserID = "management";

// TODO(andy): More substantial error handling here. Need something to show up in the UI.

const initializeFirebaseIfNecessary = () => {
  if (!hasInitialized) {
    try {
      firebase.initializeApp(firebaseConfiguration);
      firebase.database.enableLogging(true);
    } catch (error) {
      // we skip the "already exists" message which is
      // not an actual error when we're hot-reloading
      if (!/already exists/.test(error.message)) {
        console.error(
          "Firebase initialization error",
          error.message,
          error.stack,
        );
      }
    }

    hasInitialized = true;
  }
};

const getDatabase = () => {
  initializeFirebaseIfNecessary();
  return firebase.database();
};

const getRef = (flowID, cohortID, userID) => {
  const refString = userID
    ? `${flowID}/${cohortID}/${userID}`
    : `${flowID}/${cohortID}`;
  return getDatabase().ref(refString);
};

const watchInbox = (flowID, cohortID, userID, callback) => {
  const ref = getRef(flowID, cohortID, userID).child("inbox");
  const dispatch = snapshot => {
    callback(snapshot.val());
  };
  ref.on("value", dispatch);
  return () => ref.off("value", dispatch);
};

const loadData = (flowID, cohortID, userID, callback) => {
  const flattenUser = user => {
    if (user) {
      const inputs = user.inputs;
      if (inputs && (inputs.submitted || inputs.pending)) {
        const newInputs = [];
        const extractInputs = structure => {
          if (Array.isArray(structure)) {
            structure.forEach((value, index) => (newInputs[index] = value));
          } else {
            for (const [key, value] of Object.entries(structure)) {
              newInputs[key] = value;
            }
          }
        };
        extractInputs(inputs.submitted || []);
        extractInputs(inputs.pending || []);
        return {
          ...user,
          inputs: newInputs,
        };
      } else {
        return user;
      }
    } else {
      return user;
    }
  };

  const flattenInputs = value => {
    // If no user ID was specified, we'll be fetching the data for all users. Maybe this should be a different API.
    if (userID) {
      return flattenUser(value);
    } else if (value) {
      const output = { ...value };
      Object.keys(value).forEach(userID => {
        output[userID] = flattenUser(value[userID]);
      });
      return output;
    } else {
      return {};
    }
  };

  const ref = getRef(flowID, cohortID, userID);
  if (callback) {
    const dispatch = snapshot => {
      callback(flattenInputs(snapshot.val()));
    };
    ref.on("value", dispatch);
    return () => ref.off("value", dispatch);
  } else {
    return ref.once("value").then(snapshot => flattenInputs(snapshot.val()));
  }
};

// TODO(andy): Remove userID from arguments and manage that internally? Not sure.
const saveData = (
  databaseVersion,
  flowID,
  cohortID,
  userID,
  moduleID,
  data,
) => {
  const path = `${flowID}/${cohortID}/${userID}/inputs/${databaseVersion < 2
    ? ""
    : "pending/"}${moduleID}`;
  return getDatabase()
    .ref(path)
    .set(data);
};

const commitData = (
  databaseVersion,
  flowID,
  cohortID,
  userID,
  moduleID,
  data,
) => {
  if (!data || databaseVersion < 2) {
    return Promise.resolve(null);
  }
  return getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}/inputs/submitted/${moduleID}`)
    .set(data)
    .then(() =>
      getDatabase()
        .ref(`${flowID}/${cohortID}/${userID}/inputs/pending/${moduleID}`)
        .remove(),
    );
};

const saveUserState = async (flowID, cohortID, userID, newPartialUserState) => {
  await getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}/userState`)
    .update(newPartialUserState);
};

const loadManagementData = (flowID, cohortID, callback) => {
  return loadData(flowID, cohortID, managementUserID, callback);
};

const saveManagementData = (flowID, cohortID, data) => {
  getDatabase()
    .ref(`${flowID}/${cohortID}/${managementUserID}`)
    .set(data);
};

const copyFallbackUsers = async (flowID, fromCohortID, toCohortID) => {
  const sourceUsers = await loadData(flowID, fromCohortID);
  const fallbackUserKeys = Object.keys(sourceUsers).filter(userID => {
    const user = sourceUsers[userID];
    return user.userState && user.userState.isFallbackUser;
  });
  for (let fallbackUserID of fallbackUserKeys) {
    const fallbackUser = sourceUsers[fallbackUserID];
    await getRef(flowID, toCohortID, fallbackUserID).set({
      ...fallbackUser,
      inputs: { submitted: fallbackUser.inputs },
    });
  }
};

const setConnectivityHandler = connectivityHandler => {
  var connectedRef = getDatabase().ref(".info/connected");
  const changeHandler = function(snap) {
    connectivityHandler(snap.val() ? true : false);
  };
  connectedRef.on("value", changeHandler);
  return () => connectedRef.off("value", changeHandler);
};

// v3 implementations
export type UserID = string;
export type ThreadKey = UserID; // for now...

export type UserProfile = {
  email: string,
  pseudonym: string,
  avatar: string,
  realName: string,
};

export type PostData = {
  data: RichEditorData,
  userID: UserID,
  userProfile: {
    avatar: string,
    pseudonym: string,
    realName: string,
  },
};

const createUser = async (
  flowID: string,
  classCode: string,
  userID: UserID,
  userProfile: UserProfile,
) =>
  getRef(flowID, classCode)
    .child("users")
    .child(userID)
    .child("profile")
    .set(userProfile);

const fetchUserProfile = async (
  flowID: string,
  classCode: string,
  userID: UserID,
): Promise<UserProfile> =>
  getRef(flowID, classCode)
    .child("users")
    .child(userID)
    .child("profile")
    .once("value")
    .then(snapshot => snapshot.val());

const submitPost = (
  flowID: string,
  classCode: string,
  userID: UserID,
  userProfile: UserProfile,
  threadKey: ThreadKey,
  contents: RichEditorData,
): { postKey: string, postData: PostData, promise: Promise<any> } => {
  const { avatar, pseudonym, realName } = userProfile;
  const postData: PostData = {
    data: contents,
    userID,
    userProfile: { avatar, pseudonym, realName },
  };
  const postRef = getRef(flowID, classCode)
    .child("threads")
    .child(threadKey)
    .child("posts")
    .push({
      ...postData,
      submissionTimestamp: firebase.database.ServerValue.TIMESTAMP,
    });
  return { postKey: postRef.key, postData, promise: postRef };
};

export {
  initializeFirebaseIfNecessary as _initializeFirebaseIfNecessary,
  setConnectivityHandler,
  loadData,
  saveData,
  commitData,
  saveUserState,
  loadManagementData,
  saveManagementData,
  watchInbox,
  copyFallbackUsers,
  // TODO(andy): Remove by creating common abstractions.
  getDatabase as _getDatabase,
  // v3 implementations:
  createUser,
  fetchUserProfile,
  submitPost,
};
