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
  }));
buttons.create = createButtonStyles;

const primaryButtons = makeDomainStylesForTemplate(domain =>
  createPrimaryButtonStyles({
    initial: { color: colors[domain].domain3 },
    hover: { color: colors[domain].domain4 },
  }));

const hairlineBorderStyle = {
  borderColor: colors.gray41, // TODO: Maybe we want a lighter color here for non-retina users?
  borderWidth: 1,
  borderStyle: "solid",

  "@media (-webkit-min-device-pixel-ratio: 2.0)": {
    // Unfortunately, only Safari respects fractional border
    // widths. Chrome is still working on it.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=623495
    borderWidth: 0.5,
  },
};

module.exports = {
  borderRadius,
  buttons,
  colors,
  hairlineBorderStyle,
  fonts,
  primaryButtons,
  typography,
};
