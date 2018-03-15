// yanked from webapp

import { StyleSheet } from "aphrodite";

const borderRadius = 4;

const domainColors = {
  math: {
    domain1: "#11accd",
    domain2: "#63d9ea",
    domain3: "#007d96",
    domain4: "#085566",
  },
  "partner-content": {
    domain1: "#01a995",
    domain2: "#01d1c1",
    domain3: "#208170",
    domain4: "#144f44",
  },
  computing: {
    domain1: "#1fab54",
    domain2: "#74cf70",
    domain3: "#0d923f",
    domain4: "#085e29",
  },
  "economics-finance-domain": {
    domain1: "#e07d10",
    domain2: "#ffbe26",
    domain3: "#a75a05",
    domain4: "#953c02",
  },
  // TODO(kimerie): Once we have guidance from design, these stylings should
  // be changed.
  gtp: {
    domain1: "#4c00ff", //header
    domain2: "#4c00ff", //accent/button
    domain3: "#4c00ff", //accent/button
    domain4: "#4c00ff", //link
  },
  humanities: {
    domain1: "#e84d39",
    domain2: "#ff8482",
    domain3: "#be2612",
    domain4: "#8c1c0d",
  },
  science: {
    domain1: "#ca337c",
    domain2: "#ff92c6",
    domain3: "#9e034e",
    domain4: "#6b0235",
  },
  "test-prep": {
    domain1: "#7853ab",
    domain2: "#aa87ff",
    domain3: "#543b78",
    domain4: "#302245",
  },
  // TODO(aasmund): Need a separate design for this domain
  "college-careers-more": {
    domain1: "#e07d10",
    domain2: "#ffbe26",
    domain3: "#a75a05",
    domain4: "#953c02",
  },

  "open-responses": {
    domain1: "#ffbe26",
    domain2: "#f5aa1f",
    domain3: "#e07d10",
    domain4: "#e07d10",
  },

  default: {
    domain1: "#134ea3",
    domain2: "#66afe9",
    domain3: "#00457c",
    domain4: "#002a4b",
  },
};

const colors = {
  white: "#FFFFFF",
  gray98: "#FAFAFA",
  gray97: "#F6F7F7",
  gray95: "#F0F1F2",
  gray90: "#E3E5E6",
  gray85: "#D6D8DA",
  gray76: "#BABEC2",
  gray68: "#888D93",
  gray41: "#626569",
  gray25: "#3B3E40",
  gray17: "#21242C",
  black: "#000000",

  adminGreen: "#78C008",
  kaBlueHover: "#0c7f99",
  kaGreen: "#71B307",
  kaGreenHover: "#518005",

  ...domainColors,
};

const wbColors = {
  brandDarkBlue: "#044760",
  brandLightBlue: "#37C5FD",
  brandPink: "#FA50AE",
  brandSalmon: "#FD6C6E",

  productBlue: "#1865F2",
  productGold: "#FFB100",
  productGreen: "#4CD091",
  productRed: "#F14632",

  offBlack: "#21242C",
  offBlack50: "#21242C7F",
  offBlack20: "#21242C33",
  offBlack10: "#21242C19",
  offWhite: "#F7F8FA",
  white: "#FFFFFF",

  hairline: "rgba(33, 36, 44, 0.16)",
  secondaryBlack: "rgba(33, 36, 44, 0.64)",
  offBlack10Opaque: "rgba(233, 233, 234, 1.0)",
};

const fonts = {
  // The body of the page is setup to use 'Helvetica' by default and 'Proxima
  // Nova' if/once it's ready. For your elements to follow this pattern, all
  // you need is to make the text in your element inherit from the body using
  // the fonts.regular value.
  regular: "Proxima Nova, Helvetica, sans-serif",
};

// Generate Aphrodite objects for this template in every domain color
const makeDomainStylesForTemplate = func => {
  return StyleSheet.create(
    Object.keys(domainColors).reduce(
      (result, domain) => {
        result[domain] = func(domain);
        return result;
      },
      {
        disabled: createPrimaryButtonStyles({
          initial: { color: colors.gray76 },
          hover: { color: colors.gray76 },
        }),
      },
    ),
  );
};

const typography = {
  // For subject names
  subjectHeadingDesktop: {
    fontFamily: fonts.regular,
    fontSize: 50,
    fontWeight: "bold",
    lineHeight: "61px",
  },
  subjectHeadingMobile: {
    fontFamily: fonts.regular,
    fontSize: 35,
    fontWeight: "bold",
    lineHeight: "37px",
  },

  // For the most important thing on the page
  conceptHeadingDesktop: {
    fontFamily: fonts.regular,
    fontSize: 35,
    fontWeight: "bold",
    lineHeight: "37px",
  },
  conceptHeadingMobile: {
    fontFamily: fonts.regular,
    fontSize: 23,
    fontWeight: "bold",
    lineHeight: "27px",
  },

  // For sections or modules
  subheadingDesktop: {
    fontFamily: fonts.regular,
    fontSize: 23,
    fontWeight: "bold",
    lineHeight: "27px",
  },
  subheadingMobile: {
    fontFamily: fonts.regular,
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: "24px",
  },

  // For callouts
  smallHeading: {
    color: colors.gray25,
    fontFamily: fonts.regular,
    fontSize: 17,
    fontWeight: "bold",
    lineHeight: "23px",
  },
  smallHeadingMobile: {
    color: colors.gray25,
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: "18px",
  },

  // Accent headings
  accentHeading: {
    color: colors.gray68,
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.8,
    lineHeight: "19px",
    textTransform: "uppercase",
  },

  bodyLarge: {
    // For articles with multiple paragraphs
    fontFamily: fonts.regular,
    fontSize: 20,
    lineHeight: "30px",
  },
  bodySmall: {
    // For small blocks of copy
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: "23px",
  },
  bodySmallBold: {
    // For small blocks of copy
    fontFamily: fonts.regular,
    fontSize: 17,
    fontWeight: "bold",
    lineHeight: "23px",
  },
  bodyXsmall: {
    // For metadata, descriptions, etc
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: "22px",
  },
  bodyXsmallBold: {
    // For emphasized metadata, descriptions, etc
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: "22px",
  },
  breadcrumb: {
    // For in-page tabs, breadcrumbs
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.8,
    lineHeight: "19px",
  },
  breadcrumbSmall: {
    // For in-page tabs and leaf page breadcrumbs
    fontFamily: fonts.regular,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.8,
    lineHeight: "13px",
  },
  labelLarge: {
    // For chiclets and thumbnail titles
    fontFamily: fonts.regular,
    fontSize: 23,
    fontWeight: "bold",
    lineHeight: "27px",
  },
  labelMedium: {
    // For chiclets and thumbnail titles
    fontFamily: fonts.regular,
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: "18px",
  },
  labelSmall: {
    // Generally used with labelLarge, for breadcrumbs in thumbnails
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: "14px",
  },
  caption: {
    // For image captions
    fontFamily: fonts.regular,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: "17px",
  },
  desktopScalingOnMobile: {
    // For when you need Mobile Safari and friends to stick to desktop
    // sizes
    MozTextSizeAdjust: "100%",
    MsTextSizeAdjust: "100%",
    WebkitTextSizeAdjust: "100%",
  },
};

/*
Can't use Aphrodite's font feature because of the flashing bug
const latoRegular = {
  fontFamily: "Lato",
  fontStyle: "normal",
  fontWeight: "normal",
  src: "url('/static/fonts/Lato/Lato-Regular.ttf')",
};

const latoBold = {
  fontFamily: "Lato",
  fontStyle: "normal",
  fontWeight: "bold",
  src: "url('/static/fonts/Lato/Lato-Bold.ttf')",
};

const latoBlack = {
  fontFamily: "Lato",
  fontStyle: "normal",
  fontWeight: 900,
  src: "url('/static/fonts/Lato/Lato-Black.ttf')",
};
*/

const wbTypography = {
  title: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: 900,
    fontSize: 36,
    lineHeight: 1.11,
    color: "#3a3d3f",
  },

  titleMobile: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: 900,
    fontSize: 28,
    lineHeight: 1.11,
    color: "#3a3d3f",
  },

  headingLarge: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: "bold",
    fontSize: 28,
    lineHeight: 1.14,
    color: "#3a3d3f",
  },

  headingMedium: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: "bold",
    fontSize: 24,
    lineHeight: 1.17,
    color: "#3a3d3f",
  },

  headingSmall: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 1.2,
    color: "#3a3d3f",
  },

  headingXSmall: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: "bold",
    fontSize: 12,
    lineHeight: 1.33,
    letterSpacing: 0.6,
    color: "#21242c",
  },

  body: {
    fontFamily: ["Lato", "sans-serif"],
    fontSize: 16,
    lineHeight: 1.38,
    color: "#29292a",
  },

  labelLarge: {
    fontFamily: ["Lato", "sans-serif"],
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 1.25,
    color: "#29292a",
  },

  labelMedium: {
    fontFamily: ["Lato", "sans-serif"],
    fontSize: 16,
    lineHeight: 1.25,
    color: "#29292a",
  },

  labelSmall: {
    fontFamily: ["Lato", "sans-serif"],
    fontSize: 14,
    lineHeight: 1.29,
    color: "#29292a",
  },

  caption: {
    fontFamily: ["Lato", "sans-serif"],
    fontSize: 14,
    lineHight: 1.43,
    color: "#3a3d3f",
  },
};

const commonButtonStyle = {
  // common
  WebkitAppearance: "none",
  MozAppearance: "none",
  borderRadius: borderRadius,
  cursor: "pointer",
  display: "block",
  fontFamily: fonts.regular,
  fontWeight: "bold",
  textAlign: "center",

  // size
  // Note: We define the fontSize/lineHeight here instead of in typography
  // below so that it's easier to see how we get an overall button height
  // of 40px.
  // lineHeight + paddingTop + paddingBottom + 2 * borderWidth =
  // 18 + 10 + 10 + 2 * 1 = 40.
  fontSize: 15,
  lineHeight: "18px",
  padding: "10px 16px",
  borderWidth: 1,
  borderStyle: "solid",

  ":hover": {
    textDecoration: "none",
  },
};

function createButtonStyles({ initial, hover }) {
  return {
    ...commonButtonStyle,

    // maintain existing behavior for buttons.create users
    background: initial.backgroundColor || "transparent",

    borderColor: initial.color,
    color: initial.color,

    ":hover": {
      ...commonButtonStyle[":hover"],

      // maintain existing behavior for buttons.create users
      background: hover.backgroundColor || undefined,

      border: `1px solid ${hover.color}`,
      color: hover.color,
    },
  };
}

function createPrimaryButtonStyles({ initial, hover }) {
  return {
    ...commonButtonStyle,

    // color
    borderColor: initial.color,
    backgroundColor: initial.color,
    color: "white",

    ":hover": {
      ...commonButtonStyle[":hover"],

      // color
      background: hover.color || undefined,
      border: `1px solid ${hover.color}`,
      color: "white",
    },
  };
}

// e.g. const domainButton = globalStyles.buttons[domain]
const buttons = makeDomainStylesForTemplate(domain =>
  createButtonStyles({
    initial: { color: colors[domain].domain3 },
    hover: { color: colors[domain].domain4 },
  }),
);
buttons.create = createButtonStyles;

const primaryButtons = makeDomainStylesForTemplate(domain =>
  createPrimaryButtonStyles({
    initial: { color: colors[domain].domain3 },
    hover: { color: colors[domain].domain4 },
  }),
);

const hairlineBorderStyle = {
  borderColor: wbColors.hairline,
  borderWidth: 1,
  borderStyle: "solid",

  "@media (-webkit-min-device-pixel-ratio: 2.0)": {
    // Unfortunately, only Safari respects fractional border
    // widths. Chrome is still working on it.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=623495
    borderWidth: 0.5,
    borderColor: wbColors.hairline,
  },
};

const editorStyles = StyleSheet.create({
  base: {
    ...typography.bodySmall,
    borderRadius,
    padding: 12,
    marginBottom: 24,
    ["::-webkit-outer-spin-button"]: {
      "-webkit-appearance": "none",
      margin: 0,
    },
    ["::-webkit-inner-spin-button"]: {
      "-webkit-appearance": "none",
      margin: 0,
    },
  },

  editable: {
    ...hairlineBorderStyle,
  },

  uneditable: {
    backgroundColor: colors.gray95,
    color: colors.gray41,
    padding: "19px 23px",
    borderStyle: "none",
  },

  focused: {
    borderColor: colors["open-responses"].domain1,
    borderWidth: 1,
    boxShadow: "inset 0px 1px 3px rgba(0, 0, 0, 0.25)",
    padding: 11.5,
    outlineStyle: "none",
  },
});

export default {
  borderRadius,
  buttons,
  colors,
  wbColors,
  editorStyles,
  hairlineBorderStyle,
  fonts,
  primaryButtons,
  typography,
  wbTypography,
};
