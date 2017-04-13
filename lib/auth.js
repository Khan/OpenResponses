import firebase from "firebase";

import { _initializeFirebaseIfNecessary } from "./db";

const signIn = () => {
  _initializeFirebaseIfNecessary();
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
  _initializeFirebaseIfNecessary();
  return firebase.auth().signOut();
};

export { signIn, signOut };
