import firebase from "firebase";

let hasInitialized = false;

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

const loadData = (flowID, cohortID, userID) => {
  return getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}`)
    .once("value")
    .then(snapshot => snapshot.val());
};

// TODO(andy): Remove userID from arguments and manage that internally? Not sure.
const saveData = (flowID, cohortID, userID, moduleID, data) => {
  getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}/inputs/${moduleID}`)
    .set(data);
};

const saveUserState = (flowID, cohortID, userID, newUserState) => {
  getDatabase()
    .ref(`${flowID}/${cohortID}/${userID}/userState`)
    .set(newUserState);
};

export {
  initializeFirebaseIfNecessary as _initializeFirebaseIfNecessary,
  loadData,
  saveData,
  saveUserState,
  // TODO(andy): Remove by creating common abstractions.
  getDatabase as _getDatabase,
};
