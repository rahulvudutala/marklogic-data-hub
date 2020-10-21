function ingest(endpointConstants, endpointState, input) {
  return fn.head(xdmp.invoke(
    "/marklogic-data-hub-spark-connector/bulkIngester.sjs",
    {endpointConstants, endpointState, input}
  ));
}

module.exports = {
  ingest
};
