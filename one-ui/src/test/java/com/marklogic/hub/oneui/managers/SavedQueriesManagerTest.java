package com.marklogic.hub.oneui.managers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.marklogic.hub.oneui.Application;
import com.marklogic.hub.oneui.TestHelper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest(classes = {Application.class})
public class SavedQueriesManagerTest {

    @Autowired
    private SavedQueriesManager savedQueriesManager;
    @Autowired
    private TestHelper testHelper;

    private static JsonNode queryDoc;

    @BeforeEach
    void before() throws JsonProcessingException {
        testHelper.authenticateSession();
        String jsonString = "{\n" +
                "  \"savedQuery\": {\n" +
                "    \"id\": \"\",\n" +
                "    \"name\": \"some-query\",\n" +
                "    \"description\": \"some-query-description\",\n" +
                "    \"query\": {\n" +
                "      \"searchText\": \"some-string\",\n" +
                "      \"entityTypeIds\": [\n" +
                "        \"Entity1\"\n" +
                "      ],\n" +
                "      \"selectedFacets\": {\n" +
                "        \"Collection\": {\n" +
                "          \"dataType\": \"string\",\n" +
                "          \"stringValues\": [\n" +
                "            \"Entity1\",\n" +
                "            \"Collection1\"\n" +
                "          ]\n" +
                "        },\n" +
                "        \"facet1\": {\n" +
                "          \"dataType\": \"decimal\",\n" +
                "          \"rangeValues\": {\n" +
                "            \"lowerBound\": \"2.5\",\n" +
                "            \"upperBound\": \"15\"\n" +
                "          }\n" +
                "        },\n" +
                "        \"facet2\": {\n" +
                "          \"dataType\": \"dateTime\",\n" +
                "          \"rangeValues\": {\n" +
                "            \"lowerBound\": \"2020-01-01T13:06:17\",\n" +
                "            \"upperBound\": \"2020-01-22T13:06:17\"\n" +
                "          }\n" +
                "        }\n" +
                "      }\n" +
                "    },\n" +
                "    \"propertiesToDisplay\": [\"facet1\", \"EntityTypeProperty1\"]\n" +
                "  }\n" +
                "}";
        ObjectMapper mapper = new ObjectMapper();
        queryDoc = mapper.readTree(jsonString);
    }

    @Test
    void testSaveNewQuery() {
        JsonNode response = savedQueriesManager.saveOrUpdateQueryDocument(queryDoc);
        Assertions.assertNotNull(response);
        Assertions.assertNotNull(response.get("savedQuery"));
        Assertions.assertNotNull(response.get("savedQuery").get("id"));
        Assertions.assertNotNull(response.get("savedQuery").get("systemMetadata"));
        Assertions.assertEquals("some-query", response.get("savedQuery").get("name").asText());
        Assertions.assertEquals(4, response.get("savedQuery").get("systemMetadata").size());
        Assertions.assertEquals("data-hub-developer-user", response.get("savedQuery").get("owner").asText());
        Assertions.assertEquals("data-hub-developer-user", response.get("savedQuery").get("systemMetadata").get("createdBy").asText());
    }

    @Test
    void testModifyExistingQuery() {
        JsonNode firstResponse = savedQueriesManager.saveOrUpdateQueryDocument(queryDoc);
        ObjectNode savedQueryNode = (ObjectNode) firstResponse.get("savedQuery");
        String id = savedQueryNode.get("id").asText();
        savedQueryNode.put("name", "modified-name");
        JsonNode modifiedResponse = savedQueriesManager.saveOrUpdateQueryDocument(firstResponse);
        Assertions.assertNotNull(modifiedResponse);
        Assertions.assertEquals(id, modifiedResponse.get("savedQuery").get("id").asText());
        Assertions.assertEquals("data-hub-developer-user", modifiedResponse.get("savedQuery").get("owner").asText());
        Assertions.assertEquals("modified-name", modifiedResponse.get("savedQuery").get("name").asText());
    }
}
