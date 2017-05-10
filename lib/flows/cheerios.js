import BasePrompt from "../components/modules/base-prompt";
import Heading from "../components/heading";
import Image from "../components/image";
import LikertChoice from "../components/likert-choice";
import MultipleChoice from "../components/multiple-choice";
import Paragraph from "../components/paragraph";
import RichEditor from "../components/rich-editor";
import Scratchpad from "../components/scratchpad";
import ScratchpadPlayer from "../components/scratchpad-player";
import TwoUpPrompt from "../components/modules/two-up-prompt";

export default getData => [
  <BasePrompt>
    <Image path="cheerios/cheerios_full.jpg" />
  </BasePrompt>,

  <BasePrompt>
    <Heading>How many O's fit on the bottom of the square plate?</Heading>
    <Scratchpad
      dataKey="scratchpad"
      paddingHorizontal={150}
      paddingBottom={200}
    >
      <Image path="cheerios/cheerios_cropped.jpg" />
    </Scratchpad>
  </BasePrompt>,

  <BasePrompt>
    <Heading>Here's the playback of your answer.</Heading>
    <Paragraph>Cool, huh?</Paragraph>
    <ScratchpadPlayer
      data={getData(1).scratchpad}
      paddingHorizontal={150}
      paddingBottom={200}
      playing
    >
      <Image path="cheerios/cheerios_cropped.jpg" />
    </ScratchpadPlayer>
  </BasePrompt>,
];
