package com.marklogic.hub.oneui.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.marklogic.hub.oneui.exceptions.BadRequestException;
import com.marklogic.hub.oneui.managers.SavedQueriesManager;
import com.marklogic.hub.oneui.models.HubConfigSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping(value = "/api/savedQueries")
public class SavedQueriesController {

    @Autowired
    private SavedQueriesManager savedQueriesManager;

    @Autowired
    private HubConfigSession hubConfig;

    @Bean
    @Scope(proxyMode = ScopedProxyMode.TARGET_CLASS, value = "request")
    SavedQueriesManager savedQueriesManager() {
        return new SavedQueriesManager(hubConfig);
    }

    @RequestMapping(method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<JsonNode> saveQueryDoc(@RequestBody JsonNode queryDoc) {
        if (queryDoc.isNull() || queryDoc.get("savedQuery").isNull()) {
            throw new BadRequestException("The request is empty or malformed");
        }

        if (queryDoc.get("savedQuery").get("name").isNull() || queryDoc.get("savedQuery").get("name").isEmpty()) {
            throw new BadRequestException("Query name is missing");
        }

        if (queryDoc.get("savedQuery").get("query").isNull() || queryDoc.get("savedQuery").get("query").isEmpty()) {
            throw new BadRequestException("Query to be saved cannot be empty");
        }

        if (queryDoc.get("savedQuery").get("propertiesToDisplay").isNull() || queryDoc.get("savedQuery")
                .get("propertiesToDisplay").isEmpty()) {
            throw new BadRequestException("Entity type properties to be displayed cannot be empty");
        }

        JsonNode savedQuery = savedQueriesManager.saveOrUpdateQueryDocument(queryDoc);
        if (queryDoc.get("savedQuery").get("id").isEmpty()) {
            return new ResponseEntity<>(savedQuery, HttpStatus.CREATED);
        }
        return new ResponseEntity<>(savedQuery, HttpStatus.OK);
    }
}
