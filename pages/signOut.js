import firebase from "firebase";
import React from "react";

import { initialize, signOut } from "../lib/db/db";

export default class SignOutPage extends React.Component {
  static async getInitialProps({ req }) {
    initialize();
    await signOut();
    return {};
  }

  render = () => {
    return <h1>Signed out</h1>;
  };
}
