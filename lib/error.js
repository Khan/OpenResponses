const reportError = errorText => {
  console.error(errorText);
  Raven.captureException(errorText);
};

export default reportError;
