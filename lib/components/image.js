// @flow
import { StyleSheet, css } from "aphrodite";

// Path expressed relative to /static
export default (props: { path: string, centered: ?boolean }) =>
  <img
    className={css(styles.image, props.centered ? styles.centered : undefined)}
    src={`static/${props.path}`}
  />;

const styles = StyleSheet.create({
  image: {
    display: "block",
    maxWidth: "100%",
    margin: "24px 0px",
  },

  centered: {
    margin: "0 auto",
  },
});
