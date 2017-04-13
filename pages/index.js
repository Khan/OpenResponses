import { StyleSheet, css } from "aphrodite";

import sharedStyles from "../lib/styles.js";
import { signIn } from "../lib/auth";

const IndexPage = props => {
  return <h1 className={css(styles.header)}>Hello, {props.uid}</h1>;
};

IndexPage.getInitialProps = async () => {
  const uid = await signIn();
  return { uid };
};

const styles = StyleSheet.create({
  header: {
    ...sharedStyles.typography.subjectHeadingDesktop,
  },
});

export default IndexPage;
