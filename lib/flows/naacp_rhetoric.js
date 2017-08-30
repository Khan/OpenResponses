import { Raw, Plain } from "slate";

import BasePrompt from "../components/modules/base-prompt";
import { _getDatabase, loadData } from "../db";
import Heading from "../components/heading";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RejectResponseButton from "../components/reject-response-button"; // TODO remove
import ResponseQuote from "../components/response-quote";
import RichEditor from "../components/rich-editor";
import styles from "../styles";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "naacp_rhetoric";

const humanitiesPassage = (
  <div>
    <Heading>
      Letter A: First Lady of the United States to Walter White, Executive
      Secretary of the NAACP, addressing the lynching situation.
    </Heading>
    <Paragraph>
      “Before I received your letter today I had been in to the President… and
      he said the difficulty is that it is unconstitutional apparently for the
      Federal Government to step in in the lynching situation… The President
      feels that lynching is a question of education in the states, rallying
      good citizens, and creating public opinion so that the localities
      themselves will wipe it out. However, if it were done by a Northerner, it
      will have an antagonistic effect… I am deeply troubled about the whole
      situation as it seems to be a terrible thing to stand by and let it
      continue… I think your next step would be to talk to the more prominent
      members of the Senate.”
    </Paragraph>
    <Heading>
      Letter B: Daisy Bates to Roy Wilkins, Executive Secretary of the NAACP,
      describing the conditions of black children in a previously all-white
      school.
    </Heading>
    <Paragraph>
      “Conditions are yet pretty rough in the school for the children… The
      treatment of the children had been getting steadily worse for the last two
      weeks in the form of kicking, spitting, and general abuse. As a result of
      our visit, stronger measures are being taken against the white students
      who are guilty of committing these offenses… [The President of the United
      States] was very much concerned about the crisis… He has stated his
      willingness to come down and address the student body if invited by
      student leaders of the school… Last Friday, the 13th, I was asked to call
      Washington and see if we could get FBI men placed in the school.”
    </Paragraph>
  </div>
);

const twoUpPromptProps = {
  referenceComponent: humanitiesPassage,
  passThroughInManagerUI: true,
};

// I've extracted these so that I can display the same text on the first and third screens.
const choices = ["Letter A", "Letter B"];

const modules = (getUserInput, getRemoteData, dispatcher) => [
  // 0
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>
      The following two letters are both from the archives of the National
      Association for the Advancement of Colored People (NAACP) and were written
      over **twenty years apart**. Read the letters and determine which was
      written first. Then explain your answers using evidence from the letters
      and your knowledge of history.
    </Paragraph>
    <MultipleChoice
      dataKey="decision"
      choices={choices.map(c => `${c} was likely written first.`)}
    />
    <RichEditor
      dataKey="decisionExplanation"
      placeholder={
        getUserInput(0).decision !== undefined
          ? `${choices[
              getUserInput(0).decision
            ]} was likely written first because...`
          : undefined
      }
    />
  </TwoUpPrompt>,

  // 1
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      {`This student disagreed, arguing that ${choices[
        1 - getUserInput(0).decision
      ]} came first.`}
    </Heading>
    <ResponseQuote
      data={{
        kind: "rich-editor",
        rawData: JSON.stringify(
          Raw.serialize(
            Plain.deserialize(
              "The president at the time was obviously racist and accepted violence in the South as a way of life. Letter B was written after JFK was president and schools were actually starting to be desegregated in the South.",
            ),
          ),
        ),
      }}
      showsRejectionButton
      dispatcher={dispatcher}
      revieweeIndex={0}
    />
    <Heading>
      {`Read your peer's paragraph. Explain in one sentence why your peer believes ${choices[
        1 - getUserInput(0).decision
      ]} came first.`}
    </Heading>
    <RichEditor dataKey="summary" placeholder="This student argued that…" />
  </TwoUpPrompt>,

  // 2
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      {`This student disagreed, arguing that ${choices[
        1 - getUserInput(0).decision
      ]} came first.`}
    </Heading>
    <ResponseQuote
      data={{
        kind: "rich-editor",
        rawData: JSON.stringify(
          Raw.serialize(
            Plain.deserialize(
              "The president at the time was obviously racist and accepted violence in the South as a way of life. Letter B was written after JFK was president and schools were actually starting to be desegregated in the South.",
            ),
          ),
        ),
      }}
      showsRejectionButton
      dispatcher={dispatcher}
      revieweeIndex={0}
    />
    <Heading>
      How much were you persuaded by their response? What made it persuasive or
      unpersuasive?
    </Heading>
    <LikertChoice
      dataKey="reviewee1ChangeMind"
      leftLabel="Not at all"
      rightLabel="Completely"
    />
    <RichEditor
      dataKey="reviewee1ChangeMindExplanation"
      placeholder={
        getUserInput(2).reviewee1ChangeMind === undefined
          ? ""
          : `This student's answer ${getUserInput(2).reviewee1ChangeMind < 2
              ? "did not change my mind"
              : "changed my mind"} because…`
      }
    />
  </TwoUpPrompt>,

  // 3
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      {`This student disagreed, arguing that ${choices[
        1 - getUserInput(0).decision
      ]} came first.`}
    </Heading>
    <ResponseQuote
      data={{
        kind: "rich-editor",
        rawData: JSON.stringify(
          Raw.serialize(
            Plain.deserialize(
              "[Hi I'm a placeholder] The president at the time was obviously racist and accepted violence in the South as a way of life. Letter B was written after JFK was president and schools were actually starting to be desegregated in the South.",
            ),
          ),
        ),
      }}
      showsRejectionButton
      dispatcher={dispatcher}
      revieweeIndex={0}
    />
    <Heading>
      Without changing any of the evidence they cited, help this student make
      their argument more persuasive by editing or adding to their answer below.
    </Heading>
    <RichEditor
      dataKey="reviewee1Edits"
      initialData={{
        kind: "rich-editor",
        rawData: JSON.stringify(
          Raw.serialize(
            Plain.deserialize(
              "[Hi I'm a placeholder] The president at the time was obviously racist and accepted violence in the South as a way of life. Letter B was written after JFK was president and schools were actually starting to be desegregated in the South.",
            ),
          ),
        ),
      }}
    />
  </TwoUpPrompt>,

  // 4
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      {`${getUserInput(0).decision === 0
        ? "Just like you thought"
        : "Unlike as you suggested"}, letter A was written first.`}
    </Heading>
    <Heading>
      Based on what you've learned in the last few pages, revise your answer to
      make it more persuasive.
    </Heading>
    <RichEditor
      dataKey="reviewee1Edits"
      initialData={getUserInput(0).decisionExplanation}
    />
  </TwoUpPrompt>,

  // 5
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>
      A peer of yours who disagreed with you read your answer, but it did not
      change their mind:
    </Heading>
    <RichEditor
      data={{
        kind: "rich-editor",
        rawData: JSON.stringify(
          Raw.serialize(
            Plain.deserialize(
              "[Hi I'm a placeholder] I thought they made an interesting point about the president pushing responsibility down to the states in the first letter, but I don't see why that suggests letter A came first.",
            ),
          ),
        ),
      }}
      quotedWork
    />
    <Heading>
      This is how they summarized your argument. Read and reflect: is this what
      you intended?
    </Heading>
    <RichEditor
      data={{
        kind: "rich-editor",
        rawData: JSON.stringify(
          Raw.serialize(
            Plain.deserialize(
              "[Hi I'm a placeholder] They argued that the president abdicated responsibility for lynchings in the first letter, so it must have come first.",
            ),
          ),
        ),
      }}
      quotedWork
    />
  </TwoUpPrompt>,

  // 6
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>Here's your original response:</Heading>
    <RichEditor data={getUserInput(0).decisionExplanation} quotedWork />
    <Heading>
      Your peer edited your response to make it more persuasive:
    </Heading>
    <RichEditor data={getUserInput(0).decisionExplanation} quotedWork />
    <Heading>What did they change?</Heading>
    <RichEditor
      dataKey="changeAnalysis"
      placeholder="I noticed that they added…"
    />
    <Heading>
      Why do you think they changed it? What effect did it have on your work?
    </Heading>
    <RichEditor
      dataKey="changeAnalysis2"
      placeholder="I think they were trying to improve… which strengthens my argument's…"
    />
  </TwoUpPrompt>,

  // 7
  <TwoUpPrompt {...twoUpPromptProps}>
    <Heading>Here's your original response:</Heading>
    <RichEditor data={getUserInput(0).decisionExplanation} quotedWork />
    <Heading>Here are your peer's edits:</Heading>
    <RichEditor data={getUserInput(0).decisionExplanation} quotedWork />
    <Heading>
      Based on your peer's edits and what you've learned in this activity,
      revise your original response for a final submission:
    </Heading>
    <RichEditor initialData={getUserInput(0).decisionExplanation} />
  </TwoUpPrompt>,

  // 8
  <TwoUpPrompt {...twoUpPromptProps}>
    <Paragraph>[help, Brian! what should go on this screen?!]</Paragraph>
    <Paragraph>
      Think about what you learned in this activity. What skills might you want
      to focus on developing as you keep learning?
    </Paragraph>
    <Heading>Clarity of communication</Heading>
    <LikertChoice
      dataKey="clarity"
      leftLabel="Not a focus"
      rightLabel="Heavy focus"
    />
    <Heading>Persuasive writing</Heading>
    <LikertChoice
      dataKey="persuasiveWriting"
      leftLabel="Not a focus"
      rightLabel="Heavy focus"
    />
    <Heading>Historical thinking</Heading>
    <LikertChoice
      dataKey="historicalThinking"
      leftLabel="Not a focus"
      rightLabel="Heavy focus"
    />
    <Heading>Structuring an argument</Heading>
    <LikertChoice
      dataKey="structuring"
      leftLabel="Not a focus"
      rightLabel="Heavy focus"
    />

    <RichEditor
      dataKey="reflection"
      placeholder="I learned a lot about clarity through…"
    />
  </TwoUpPrompt>,

  // 9
  <BasePrompt>
    <Heading>You're all done!</Heading>
    <Paragraph>
      This activity was an experiment. We're trying to make them better! Please
      help us by answering a few questions below:
    </Paragraph>
    <iframe
      src={`https://khanacademy.typeform.com/to/KINOmf${document.location.search
        .replace("flowID", "flowid")
        .replace("classCode", "classcode")
        .replace("userID", "userid")}`}
      style={{
        width: "100%",
        height: "600px",
        borderRadius: styles.borderRadius,
        padding: styles.borderRadius / 2,
        ...styles.hairlineBorderStyle,
      }}
    />
    <div
      dangerouslySetInnerHTML={{
        __html: `<div class="typeform-widget" data-url="https://khanacademy.typeform.com/to/KINOmf" data-hide-headers=true data-hide-footer=true style="width: 100%; height: 1500px;" > </div> <script> (function() { var qs,js,q,s,d=document, gi=d.getElementById, ce=d.createElement, gt=d.getElementsByTagName, id="typef_orm", b="https://embed.typeform.com/"; if(!gi.call(d,id)) { js=ce.call(d,"script"); js.id=id; js.src=b+"embed.js"; q=gt.call(d,"script")[0]; q.parentNode.insertBefore(js,q) } })() </script>`,
      }}
    />
  </BasePrompt>,
];

export default {
  modules,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, [1, 2], [3, 4], 5],
};
