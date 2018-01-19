// @flow
import React, { Fragment } from "react";

import ResponseCard from "./response-card";
import sharedStyles from "../../styles";

type Card = {
  studentName: string,
  data: any, // TODO
};

type Props = {
  submittedCards: Card[],
  pendingCards: Card[],
  openPendingCard: ?number,

  submitButtonTitle: string,

  onOpenPendingCard: number => void,
  onChangePendingCardData: any => void, // TODO
  onSubmitPendingCard: void => void,
};

const cardPeekHeight = 60;

export default class CardWorkspace extends React.Component {
  render = () => {
    return (
      <Fragment>
        {this.props.submittedCards.map(card => (
          <ResponseCard studentName={card.studentName} data={card.data} />
        ))}
        {this.props.pendingCards.map((card, idx) => (
          <div
            style={{
              position:
                this.props.openPendingCard === idx ? "relative" : "fixed",
              bottom:
                this.props.openPendingCard !== null
                  ? this.props.pendingCards.length * -cardPeekHeight
                  : 0,
              width: "100%",
              height: 0,
            }}
            key={idx}
          >
            <div
              style={{
                position: "absolute",
                top: (this.props.pendingCards.length - idx) * -cardPeekHeight,
                width: "100%",
              }}
            >
              <ResponseCard
                studentName={card.studentName}
                data={card.data}
                onChange={this.props.onChangePendingCardData}
                onSubmit={this.props.onSubmitPendingCard}
                onFocus={() => this.props.onOpenPendingCard(idx)}
                submitTitle={this.props.submitButtonTitle}
              />
            </div>
          </div>
        ))}
      </Fragment>
    );
  };
}
