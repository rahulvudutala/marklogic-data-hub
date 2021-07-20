'use strict';
declareUpdate();

const assertLib = require("../../lib/dh-prov-assert-lib.xqy");
const jobService = require("../../lib/jobService.sjs");

const jobId = "verifyProvenanceRecordOnFinishJob-jobId";
const flowName = "verifyProvenanceRecordOnFinishJob-flow";
const jobStatus = "finished";
xdmp.invokeFunction(function () {
  jobService.startJob(jobId, flowName);
  jobService.finishJob(jobId, jobStatus);
});
const record = assertLib.queryProvenanceRecord(jobId);
assertLib.verifyNewProvenanceRecord(record, jobId);
assertLib.verifyEndTimeInProvenanceRecord(record);

