import React from 'react';
import Widget from 'laboratory/widget';
import Container from 'gadgets/container/widget';
import Label from 'gadgets/label/widget';
import Button from 'gadgets/button/widget';

class Hinter extends Widget {
  constructor (props, context) {
    super (props, context);
  }

  render () {
    const {isDisplayed, hinter} = this.props;
    if (!isDisplayed) {
      return null;
    }
    return (
      <Container kind="view-short">
        <Container kind="pane-navigator" navigation-for="hinter">
          <Button text={hinter} width="0px" grow="1" kind="pane-navigator" />
        </Container>
        <Container kind="panes-short">
          <Container kind="pane">
            <Container kind="row-pane">
              <Label glyph="stars" text="Hits" kind="title" />
            </Container>
          </Container>
        </Container>
      </Container>
    );
  }
}

export default Hinter;
