import { dataKind as slateDataKind } from "./components/slate-rich-editor";
import { dataKind as quillDataKind } from "./components/quill-rich-editor";

export default data => {
  if (data && data.kind === slateDataKind) {
    return Plain.serialize(Value.fromJSON(JSON.parse(data.rawData))).length > 0;
  } else if (data && data.kind === quillDataKind) {
    return data.rawData && data.rawData.length > 50;
  } else {
    return false;
  }
};
