import firebase from "firebase";

let hasInitialized = false;

const managementUserID = "management";

// TODO(andy): More substantial error handling here. Need something to show up in the UI.

const initializeFirebaseIfNecessary = () => {
  if (!hasInitialized) {
    try {
      firebase.initializeApp(firebaseConfiguration);
    } catch (error) {
      // we skip the "already exists" message which is
      // not an actual error when we're hot-reloading
      if (!/already exists/.test(error.message)) {
        console.error("Firebase initialization error", error.stack);
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

const loadData = (flowID, cohortID, userID, callback) => {
  const flattenInputs = value => {
    if (value) {
      const inputs = value.inputs;
      if (inputs && (inputs.submitted || inputs.pending)) {
        const newInputs = [];
        const extractInputs = structure => {
          if (Array.isArray(structure)) {
            structure.forEach((value, index) => newInputs[index] = value);
          } else {
            for (const [key, value] of Object.entries(structure)) {
              newInputs[key] = value;
            }
          }
        };
        extractInputs(inputs.submitted || []);
        extractInputs(inputs.pending || []);
        return {
          ...value,
          inputs: newInputs,
        };
      } else {
        return value;
      }
    } else {
      return value;
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
  const path = `${flowID}/${cohortID}/${userID}/inputs/${databaseVersion < 2 ? "" : "pending/"}${moduleID}`;
  getDatabase().ref(path).set(data);
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
    return;
  }
  getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}/inputs/submitted/${moduleID}`)
    .set(data, error => {
      getDatabase()
        .ref(`${flowID}/${cohortID}/${userID}/inputs/pending/${moduleID}`)
        .remove();
    });
};

const saveUserState = async (flowID, cohortID, userID, newPartialUserState) => {
  const { committed, snapshot } = await getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}/userState`)
    .transaction(oldUserState => {
      return { ...oldUserState, ...newPartialUserState };
    });
  if (committed) {
    return snapshot.val();
  } else {
    console.error("Failed to save new partial user state", newPartialUserState);
  }
};

const loadManagementData = (flowID, cohortID, callback) => {
  return loadData(flowID, cohortID, managementUserID, callback);
};

const saveManagementData = (flowID, cohortID, data) => {
  getDatabase().ref(`${flowID}/${cohortID}/${managementUserID}`).set(data);
};

export {
  initializeFirebaseIfNecessary as _initializeFirebaseIfNecessary,
  loadData,
  saveData,
  commitData,
  saveUserState,
  loadManagementData,
  saveManagementData,
  // TODO(andy): Remove by creating common abstractions.
  getDatabase as _getDatabase,
};
