import answerGridTest from "./answerGridTest";
import cheerios from "./cheerios";
import dataCycleTest from "./dataCycleTest";
import freedraw from "./freedraw";
import humanities_ham from "./humanities_ham";
import humanities_ham_async from "./humanities_ham_async";
import humanities_KLS_05_11 from "./humanities_KLS_05_11";
import humanities_KLS_05_18 from "./humanities_KLS_05_18";
import humanities_resistance from "./humanities_resistance";
import humanitiesA from "./humanitiesA";
import humanitiesB from "./humanitiesB";
import humanitiesC from "./humanitiesC";
import KAexpeq from "./KAexpeq";
import tiltedSquare_Desmos_06_14 from "./tiltedSquare_Desmos_06_14";
import tiltedSquare_OH_05_12 from "./tiltedSquare_OH_05_12";
import tiltedSquare_KLS_06_01 from "./tiltedSquare_KLS_06_01";

//****************************************************************************
// Hey! Adding a flow with an email component? Make sure you add a human-
// readable name for it in /functions/index.js.
//****************************************************************************

const flowLookupTable = {
  answerGridTest,
  cheerios,
  dataCycleTest,
  freedraw,
  humanities_ham,
  humanities_ham_async,
  humanities_KLS_05_11,
  humanities_KLS_05_18,
  humanities_resistance,
  humanitiesA,
  humanitiesB,
  humanitiesC,
  KAexpeq,
  tiltedSquare_Desmos_06_14,
  tiltedSquare_OH_05_12,
  tiltedSquare_KLS_06_01,
};

export default flowLookupTable;
