'use strict';
declareUpdate();

var saveQuery;
var userCollections = ["http://marklogic.com/data-hub/saved-query"];
var queryDoc = JSON.parse(saveQuery);

try {
  if(queryDoc.savedQuery.id) {
    queryDoc.savedQuery.systemMetadata.lastUpdatedBy = xdmp.getCurrentUser();
    queryDoc.savedQuery.systemMetadata.lastUpdatedDateTime = fn.currentDateTime();
  } else {
    queryDoc.savedQuery.id = sem.uuidString();
    queryDoc.savedQuery.owner = xdmp.getCurrentUser();
    queryDoc.savedQuery.systemMetadata = {
      "createdBy": xdmp.getCurrentUser(),
      "createdDateTime": fn.currentDateTime(),
      "lastUpdatedBy": xdmp.getCurrentUser(),
      "lastUpdatedDateTime": fn.currentDateTime()
    }
  }

  let docUri = "/saved-queries/"+queryDoc.savedQuery.id;
  let permissions = [xdmp.permission('data-hub-saved-query-reader', 'read'),
    xdmp.permission('data-hub-saved-query-writer', 'update')];
  xdmp.documentInsert(docUri, queryDoc,
      { permissions : permissions,
        collections : userCollections
      });
}
 catch (error) {
  throw Error("The query could not be saved with the following error:" + error);
}

queryDoc;