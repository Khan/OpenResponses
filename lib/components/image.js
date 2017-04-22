// @flow
import { StyleSheet, css } from "aphrodite";

// Path expressed relative to /static
export default (props: { path: string }) => (
  <img className={css(styles.image)} src={`static/${props.path}`} />
);

const styles = StyleSheet.create({
  image: {
    display: "block",
    margin: "0 auto",
    maxWidth: "100%",
  },
});
