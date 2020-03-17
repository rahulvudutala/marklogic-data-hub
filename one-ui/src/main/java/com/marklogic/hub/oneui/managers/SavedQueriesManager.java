package com.marklogic.hub.oneui.managers;

import com.fasterxml.jackson.databind.JsonNode;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.MarkLogicServerException;
import com.marklogic.hub.HubConfig;
import com.marklogic.hub.dataservices.SavedQueriesService;
import com.marklogic.hub.oneui.exceptions.DataHubException;

public class SavedQueriesManager {

    private DatabaseClient finalDataServiceClient;

    public SavedQueriesManager(HubConfig hubConfig) {
        finalDataServiceClient = hubConfig.newFinalClient();
    }

    public JsonNode saveOrUpdateQueryDocument(JsonNode queryDoc) {
        try {
            return SavedQueriesService.on(finalDataServiceClient).saveSavedQuery(queryDoc);
        } catch (MarkLogicServerException mse) {
            throw new DataHubException(mse.getServerMessage(), mse);
        }
    }
}
