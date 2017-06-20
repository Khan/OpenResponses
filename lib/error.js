const reportError = errorText => {
  console.error(errorText);
  if (nodeEnvironment === "production") {
    Raven.captureException(errorText);
  }
};

export default reportError;
