'use strict';
declareUpdate();

const assertLib = require("../../lib/dh-prov-assert-lib.xqy");
const jobService = require("../../lib/jobService.sjs");

const jobId = "verifyProvenanceRecordOnStartJob-jobId";
const flowName = "verifyProvenanceRecordOnStartJob-flow";
xdmp.invokeFunction(function () {
  jobService.startJob(jobId, flowName);
});
const record = assertLib.queryProvenanceRecord(jobId);
assertLib.verifyNewProvenanceRecord(record, jobId);

