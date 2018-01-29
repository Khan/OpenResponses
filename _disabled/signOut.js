import firebase from "firebase";
import React from "react";

import { signOut } from "../lib/auth";

export default class SignOutPage extends React.Component {
  static async getInitialProps({ req }) {
    await signOut();
    return {};
  }

  render = () => {
    return <h1>Signed out</h1>;
  };
}
