import firebase from "firebase";

let hasInitialized = false;

// TODO(andy): More substantial error handling here. Need something to show up in the UI.

const initialize = () => {
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

  return firebase.database().ref("v0");
};

const signIn = () => {
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // TODO(andy): Something more useful with this.
        console.log(`Signed in with UID: ${user.uid}`);
        resolve(user.uid);
      } else {
        // TODO(andy): Should probably have some better retry facility on failure.
        // TODO(andy): Also maybe you should be able to sign out without immediately causing another user to be generated?
        firebase.auth().signInAnonymously().catch(error => {
          reject(error);
        });
        console.log("Signed out. Trying to sign in...");
      }
    });
  });
};

const signOut = () => {
  return firebase.auth().signOut();
};

export { initialize, signIn, signOut };
