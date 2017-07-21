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
    <Heading>This is a trapezoid, find its area.</Heading>
    <Scratchpad
      dataKey="scratchpad"
      paddingHorizontal={150}
      paddingBottom={600}
    >
      <Image path="zoid/zoid_numbers.png" />
    </Scratchpad>
  </BasePrompt>,

  <BasePrompt>
    <Heading>Here's the playback of your picture.</Heading>
    <ScratchpadPlayer
      data={getData(0).scratchpad}
      paddingHorizontal={150}
      paddingBottom={600}
      playing
    >
      <Image path="zoid/zoid_numbers.png" />
    </ScratchpadPlayer>
  </BasePrompt>,
];
