import { Raw, Plain } from "slate";

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

const flowName = "zoid_03";

const modules = (getUserInput, getRemoteData, dispatcher) => [
  //////////////////////////////////////////////////////////////////////
  // start of flow                                                    //
  //////////////////////////////////////////////////////////////////////

  //////////////////////////f//////////////////////////////////////////// 0
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
      Here is a video about trapezoid area methods. Watch it, then tap Next.
    </Heading>
    <iframe
      width="560"
      height="315"
      src="https://www.youtube.com/embed/Hn5pOIrEqUQ"
      frameborder="0"
      allowfullscreen
    />
  </BasePrompt>,

  ////////////////////////////////////////////////////////////////////// 3
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Paragraph>
          Try these three area problems, thinking about the methods from the
          video.
        </Paragraph>
        <Heading>Practice 1</Heading>
        <Image path="zoid/zoid_problem1.png" />
      </div>
    }
  >
    <Heading>Find the area.</Heading>
    <NumericInput dataKey="practice" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 4
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Heading>Practice 2</Heading>
        <Image path="zoid/zoid_problem2.png" />
      </div>
    }
  >
    <Heading>Find the area.</Heading>
    <NumericInput dataKey="practice" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 5
  <TwoUpPrompt
    passThroughInManagerUI
    referenceComponent={
      <div>
        <Heading>Practice 3</Heading>
        <Image path="zoid/zoid_problem3.png" />
      </div>
    }
  >
    <Heading>Find the area.</Heading>
    <NumericInput dataKey="practice" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 6
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

  ////////////////////////////////////////////////////////////////////// 7
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
      {`Explain why $\\frac{1}{2}(d_1 \\cdot d_2)$ works to find the area of this trapezoid.`}
    </Heading>
    <RichEditor dataKey="post_kite_compute" />
  </TwoUpPrompt>,

  ////////////////////////////////////////////////////////////////////// 8
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
  reportSpec: [0, 1, 3, 4, 5, 6, 7],
};
