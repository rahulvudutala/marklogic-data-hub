package com.marklogic.hub.central.entities.search.impl;

import com.marklogic.client.query.StructuredQueryBuilder;
import com.marklogic.client.query.StructuredQueryDefinition;
import com.marklogic.hub.central.entities.search.Constants;
import com.marklogic.hub.central.entities.search.models.DocSearchQueryInfo;
import com.marklogic.rest.util.Fragment;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CreatedOnFacetHandlerTest extends AbstractFacetHandlerTest {

    @Test
    public void testCreatedOnDateRangeFacet() {
        String constraintName = Constants.CREATED_ON_CONSTRAINT_NAME;
        String lowerBound = "2020-06-01T00:00:00-07:00";
        String upperBound = "2020-06-05T00:00:00-07:00";
        String expectedLowerBound = "2020-06-01T00:00:00-0700";
        String expectedUpperBound = "2020-06-06T00:00:00-0700";
        DocSearchQueryInfo.FacetData facetData = new DocSearchQueryInfo.FacetData();
        DocSearchQueryInfo.RangeValues rangeValues = new DocSearchQueryInfo.RangeValues();
        facetData.setStringValues(Arrays.asList("Custom"));
        rangeValues.setLowerBound(lowerBound);
        rangeValues.setUpperBound(upperBound);
        facetData.setRangeValues(rangeValues);
        CreatedOnFacetHandler createdOnFacetHandler = new CreatedOnFacetHandler();
        StructuredQueryBuilder queryBuilder = new StructuredQueryBuilder();

        StructuredQueryDefinition queryDefinition = createdOnFacetHandler.buildQuery(facetData, queryBuilder);
        Fragment fragment = toFragment(queryDefinition);

        assertEquals(Arrays.asList(constraintName, constraintName), fragment.getElementValues("//search:constraint-name"));
        assertTrue(fragment.getElementValue("//search:value[../search:range-operator='GE']").contains(expectedLowerBound),
                "Expected lower bound to include: " + expectedLowerBound);
        assertTrue(fragment.getElementValue("//search:value[../search:range-operator='LT']").contains(expectedUpperBound),
                "Upper bound is one day more than what was passed in order to include the passed in date as well" +
                        " for comparison. Expected upper bound to include: " + expectedUpperBound);
    }

    @Test
    public void testComputeDateRangeTimeWindows() {
        String zoneOffset = "-420";
        ZoneId zoneId = ZoneId.ofOffset("UTC", ZoneOffset.ofTotalSeconds(Integer.parseInt(zoneOffset)*60));
        DocSearchQueryInfo.FacetData facetData = new DocSearchQueryInfo.FacetData();
        DocSearchQueryInfo.RangeValues rangeValues = new DocSearchQueryInfo.RangeValues();

        // For time window Today.
        List<String> stringValues = Arrays.asList("Today", zoneOffset);
        facetData.setStringValues(stringValues);
        facetData.setRangeValues(rangeValues);

        CreatedOnFacetHandler createdOnFacetHandler = new CreatedOnFacetHandler();
        ZonedDateTime startDateTime = ZonedDateTime.parse(createdOnFacetHandler.computeDateRange(facetData).get("startDateTime"),
                CreatedOnFacetHandler.DATE_TIME_FORMAT);
        ZonedDateTime endDateTime = ZonedDateTime.parse(createdOnFacetHandler.computeDateRange(facetData).get("endDateTime"),
                CreatedOnFacetHandler.DATE_TIME_FORMAT);
        assertEquals(startDateTime.getOffset().getTotalSeconds()/60, Integer.parseInt(stringValues.get(1)));
        assertEquals(endDateTime.getOffset().getTotalSeconds()/60, Integer.parseInt(stringValues.get(1)));
        assertEquals(Duration.between(startDateTime, endDateTime).dividedBy(Duration.ofDays(1)), 1);

        // For time window This Week
        stringValues = Arrays.asList("This Week", zoneOffset);
        facetData.setStringValues(stringValues);
        Map<String, String> dateRange = createdOnFacetHandler.computeDateRange(facetData);
        startDateTime = ZonedDateTime.parse(dateRange.get("startDateTime"), CreatedOnFacetHandler.DATE_TIME_FORMAT);
        endDateTime = ZonedDateTime.parse(dateRange.get("endDateTime"), CreatedOnFacetHandler.DATE_TIME_FORMAT);
        ZonedDateTime currentDateTime = LocalDate.now().atStartOfDay().atZone(zoneId);

        assertEquals(startDateTime.getOffset().getTotalSeconds()/60, Integer.parseInt(stringValues.get(1)));
        assertEquals(endDateTime.getOffset().getTotalSeconds()/60, Integer.parseInt(stringValues.get(1)));
        assertEquals(Duration.between(startDateTime, endDateTime).dividedBy(Duration.ofDays(1)),
                Duration.between(startDateTime, currentDateTime).dividedBy(Duration.ofDays(1)) + 1);

        // For time window This Month
        stringValues = Arrays.asList("This Month", zoneOffset);
        facetData.setStringValues(stringValues);
        dateRange = createdOnFacetHandler.computeDateRange(facetData);
        startDateTime = ZonedDateTime.parse(dateRange.get("startDateTime"), CreatedOnFacetHandler.DATE_TIME_FORMAT);
        endDateTime = ZonedDateTime.parse(dateRange.get("endDateTime"), CreatedOnFacetHandler.DATE_TIME_FORMAT);
        currentDateTime = LocalDate.now().atStartOfDay().atZone(zoneId);

        assertEquals(startDateTime.getOffset().getTotalSeconds()/60, Integer.parseInt(stringValues.get(1)));
        assertEquals(endDateTime.getOffset().getTotalSeconds()/60, Integer.parseInt(stringValues.get(1)));
        assertEquals(Duration.between(startDateTime, endDateTime).dividedBy(Duration.ofDays(1)),
                Duration.between(startDateTime, currentDateTime).dividedBy(Duration.ofDays(1)) + 1);
        assertEquals(Duration.between(startDateTime, endDateTime).dividedBy(Duration.ofDays(1)), currentDateTime.getDayOfMonth());

        // Testing Custom time range
        String lowerBound = "2020-06-01T00:00:00-07:00";
        String upperBound = "2020-06-05T00:00:00-07:00";
        String expectedUpperBound = "2020-06-06T00:00:00-0700";
        facetData = new DocSearchQueryInfo.FacetData();
        rangeValues = new DocSearchQueryInfo.RangeValues();
        stringValues = Arrays.asList("Custom", zoneOffset);
        rangeValues.setLowerBound(lowerBound);
        rangeValues.setUpperBound(upperBound);
        facetData.setStringValues(stringValues);
        facetData.setRangeValues(rangeValues);
        dateRange = createdOnFacetHandler.computeDateRange(facetData);
        assertTrue(dateRange.get("endDateTime").equals(expectedUpperBound));
    }
}
