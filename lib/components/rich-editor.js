import QuillRichEditor, {
  dataKind as quillDataKind,
} from "./quill-rich-editor";

import SlateRichEditor, {
  dataKind as slateDataKind,
} from "./slate-rich-editor";

export type RichEditorData = {
  kind: quillDataKind | slateDataKind,
  rawData: string,
  diffBaseData?: string,
};

export default props => {
  const { data } = props;
  if (data && data.kind === slateDataKind) {
    return <SlateRichEditor {...props} />;
  } else {
    return <QuillRichEditor {...props} />;
  }
};
