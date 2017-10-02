import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import NumericInput from "../components/numeric-input";
import Paragraph from "../components/paragraph";
import ResponseQuote from "../components/response-quote";
import RichEditor from "../components/rich-editor";
import SelectAllThatApply from "../components/select-all-that-apply";
import styles from "../styles";
import TwoUpPrompt from "../components/modules/two-up-prompt";

const flowName = "zoid_02";

const modules = (getUserInput, getRemoteData, dispatcher) => [
  //////////////////////////////////////////////////////////////////////
  // start of flow                                                    //
  //////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////// 0
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Heading>Guiding Question</Heading>
        <Paragraph>Here is a trapezoid.</Paragraph>
        <Image path="zoid/zoid_assess_preNumbers.png" />
      </div>
    }
  >
    <Heading>Find the area.</Heading>
    <NumericInput dataKey="pre_trapezoid_compute" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 1
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Heading>Guiding Question</Heading>
        <Paragraph>Here is a trapezoid with more general labels.</Paragraph>
        <Image path="zoid/zoid_assess_preVariables.png" />
      </div>
    }
  >
    <Heading>
      {`Explain why $\\frac{1}{2}h(b_1 + b_2)$ works to find the area of this trapezoid.`}
    </Heading>
    <RichEditor dataKey="pre_trapezoid_explanation" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 2
  <BasePrompt>
    <Heading>
      You will see three different solutions to this problem: find the area of
      the trapezoid.
    </Heading>
    <Image path="zoid/zoid_numbers.png" />
  </BasePrompt>,

  ////////////////////////////////////////////////////////////////////// 3
  <TwoUpPrompt
    referenceComponent={
      <Image path="https://andymatuschak.org/ka/zoid/zoid_triangles.gif" />
    }
  >
    <Paragraph>{`Alma: "I cut the trapezoid into two triangles."`}</Paragraph>
    <Heading>Do you see how she did it?</Heading>
    <MultipleChoice
      dataKey="seeHowAlmaDidIt"
      choices={["I think I understand her method.", "I'm not sure yet."]}
    />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 4
  <TwoUpPrompt
    referenceComponent={
      <Image path="https://andymatuschak.org/ka/zoid/zoid_pgram.gif" />
    }
  >
    <Paragraph>
      {`Beth: "I rotated the top part around to make one long parallelogram."`}
    </Paragraph>
    <Heading>Do you see how Beth did it?</Heading>
    <MultipleChoice
      dataKey="seeHowBethDidIt"
      choices={["I think I understand her method.", "I'm not sure yet."]}
    />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 5
  <TwoUpPrompt
    referenceComponent={<Image path="zoid/zoid_solnsAB.png" />}
    passThroughInManagerUI
  >
    <Paragraph>
      {`Alma: "I cut the trapezoid into two triangles."
        Beth: "I rotated the top part around to make one long parallelogram."`}
    </Paragraph>
    <Heading>
      {`Brainstorm: How does the formula, $\\text{area} = \\frac{1}{2}h(b_1 + b_2)$, connect or
      relate to Alma's and Beth's methods?`}
    </Heading>
    <RichEditor
      dataKey="solnObservations"
      placeholder="One connection I notice is..."
    />
    <Heading>
      What questions do you have about these methods? Or, what questions might
      another student have?
    </Heading>
    <RichEditor dataKey="solnQuestions" placeholder="I still wonder why..." />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 6
  <TwoUpPrompt
    referenceComponent={
      <Image path="https://andymatuschak.org/ka/zoid/zoid_avg.gif" />
    }
  >
    <Heading>
      Now that you have talked about Alma's and Beth's ideas, consider one more
      solution:
    </Heading>
    <Paragraph>
      {`Coco: "I rotated little triangles around to make the trapezoid into a rectangle, and the rectangle width is the average of the top and bottom."`}
    </Paragraph>
    <Heading>How would you evaluate Coco's work and explanation?</Heading>
    <SelectAllThatApply
      choices={[
        "Interprets the given information appropriately.",
        "Chooses a good strategy.",
        "Makes connections between the diagram and calculations.",
        "Uses precise language and vocabulary.",
        "Gives a complete explanation such that another student could understand.",
      ]}
      dataKey="checklistCoco"
    />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 7
  <TwoUpPrompt
    referenceComponent={<Image path="zoid/zoid_solnsABC.png" />}
    passThroughInManagerUI
  >
    <Paragraph>
      The three students looked at each others methods and began to discuss the
      mathematics. Think about what they say:
    </Paragraph>
    <Paragraph>
      {`Alma: "I noticed we all used a 1/2 in different ways."
        Beth: "I noticed a connection between my parallelogram width and Coco's rectangle width."
        Coco: "I noticed our algebra is similar to the trapezoid area formula.`}
    </Paragraph>
    <Heading>Making Connections:</Heading>
    <Heading>
      {`How does Coco's solution connect to the formula, $\\text{area} = \\frac{1}{2}h(b_1 + b_2)$? How can the three methods help explain the trapezoid area formula?`}
    </Heading>
    <Paragraph>Write at least four sentences.</Paragraph>
    <RichEditor dataKey="explainAll" />
  </TwoUpPrompt>,

  // potential for self-reflection / evaluation for us:
  // Do you understand Alma's, Beth's, Coco's solutions better?

  ////////////////////////////////////////////////////////////////////// 8
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Heading>Mastery Quiz</Heading>
        <Paragraph>Here is a kite.</Paragraph>
        <Image path="zoid/postTestKite.png" />
      </div>
    }
  >
    <Heading>Find the area.</Heading>
    <NumericInput dataKey="post_kite_compute" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 9
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Heading>Mastery Quiz</Heading>
        <Paragraph>Here is a kite with more general labels.</Paragraph>
        <Image path="zoid/postTestKiteBlank.png" />
      </div>
    }
  >
    <Heading>
      {`Explain why $\\frac{1}{2}(d_1 \\cdot d_2)$ works to find the area of this kite.`}
    </Heading>
    <RichEditor dataKey="post_kite_compute" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 10
  <BasePrompt>
    <Heading>You're all done!</Heading>
    <Paragraph>
      This activity was an experiment in helping learners think and write about
      different but connected ideas. We're still improving these experiments!
      Please help us by answering a few questions below:
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
  </BasePrompt>,
];
//////////////////////////////////////////////////////////////////////
// end of flow                                                      //
//////////////////////////////////////////////////////////////////////

export default {
  modules,
  databaseVersion: 2,
  requiresEmail: true,
  reportSpec: [0, 1, 5, 6, 7, 8, 9],
};
