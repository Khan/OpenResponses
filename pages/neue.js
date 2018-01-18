// @flow
import React from "react";
import Router from "next/router";

import { signIn } from "../lib/auth";
import PageContainer from "../lib/components/neue/page-container";
import Prompt from "../lib/components/neue/prompt";
import ResponseCard from "../lib/components/neue/response-card";

type State = {
  ready: boolean,
};

type Props = {};

export default class NeueFlowPage extends React.Component {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);

    this.state = {
      ready: false,
    };
  }

  render = () => {
    return (
      <PageContainer>
        <Prompt
          title="Testing testing 1 2 3"
          prompt={`Foo bar baz bat baz quux bar baz _Foo bar baz bat baz quux bar_ baz Foo bar baz bat baz quux bar baz Foo bar baz bat baz quux bar baz Foo bar baz bat baz quux bar baz
          
bat baz quux bar baz bat baz quux`}
        />
        <p />
        <ResponseCard studentName="Your Response" />
      </PageContainer>
    );
  };
}
