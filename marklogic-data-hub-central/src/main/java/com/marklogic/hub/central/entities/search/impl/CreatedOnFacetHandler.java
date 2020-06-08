/*
 * Copyright 2012-2020 MarkLogic Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
package com.marklogic.hub.central.entities.search.impl;

import com.marklogic.client.query.StructuredQueryBuilder;
import com.marklogic.client.query.StructuredQueryDefinition;
import com.marklogic.hub.central.entities.search.Constants;
import com.marklogic.hub.central.entities.search.FacetHandler;
import com.marklogic.hub.central.entities.search.models.DocSearchQueryInfo;
import com.marklogic.hub.central.exceptions.DataHubException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.Map;

public class CreatedOnFacetHandler implements FacetHandler {

    public static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssZ");

    @Override
    public StructuredQueryDefinition buildQuery(DocSearchQueryInfo.FacetData data, StructuredQueryBuilder queryBuilder) {
        Map<String, String> dateRange = computeDateRange(data);
        return queryBuilder.and(
            queryBuilder.rangeConstraint(Constants.CREATED_ON_CONSTRAINT_NAME, StructuredQueryBuilder.Operator.GE, dateRange.get("startDateTime")),
            queryBuilder.rangeConstraint(Constants.CREATED_ON_CONSTRAINT_NAME, StructuredQueryBuilder.Operator.LT, dateRange.get("endDateTime"))
        );
    }

    public Map<String, String> computeDateRange(DocSearchQueryInfo.FacetData data) {
        Map<String, String> dateRange = new HashMap<>();
        String timeRange = "Custom";
        int zoneOffset = 0;

        if(data.getStringValues().size() > 0) {
            timeRange = data.getStringValues().get(0);
        }

        if(data.getStringValues().size() > 1) {
            zoneOffset = Integer.parseInt(data.getStringValues().get(1));
        }

        ZoneId zoneId = ZoneId.ofOffset("UTC", ZoneOffset.ofTotalSeconds(zoneOffset*60));
        ZonedDateTime startDate = LocalDate.now().atStartOfDay(zoneId);
        ZonedDateTime endDate = LocalDate.now().atStartOfDay(zoneId);
        String startDateTime;
        String endDateTime;

        switch (timeRange) {
            case "Today":
                startDateTime = startDate.toLocalDate().atStartOfDay(zoneId).format(DATE_TIME_FORMAT);
                dateRange.put("startDateTime", startDateTime);
                endDateTime = endDate.plusDays(1).toLocalDate().atStartOfDay(zoneId).format(DATE_TIME_FORMAT);
                dateRange.put("endDateTime", endDateTime);
                break;

            case "This Week":
                startDateTime = startDate.plusDays((-1) * (startDate.getDayOfWeek().getValue() % 7)).format(DATE_TIME_FORMAT);
                dateRange.put("startDateTime", startDateTime);
                endDateTime = endDate.plusDays(1).toLocalDate().atStartOfDay(zoneId).format(DATE_TIME_FORMAT);
                dateRange.put("endDateTime", endDateTime);
                break;

            case "This Month":
                startDate = startDate.with(TemporalAdjusters.firstDayOfMonth());
                startDateTime = startDate.toLocalDate().atStartOfDay(zoneId).format(DATE_TIME_FORMAT);
                dateRange.put("startDateTime", startDateTime);
                endDateTime = endDate.plusDays(1).toLocalDate().atStartOfDay(zoneId).format(DATE_TIME_FORMAT);
                dateRange.put("endDateTime", endDateTime);
                break;

            case "Custom":
                if(!data.getRangeValues().getLowerBound().isEmpty() && !data.getRangeValues().getUpperBound().isEmpty()) {
                    try {
                        startDateTime = ZonedDateTime.parse(data.getRangeValues().getLowerBound()).format(DATE_TIME_FORMAT);
                        endDateTime = ZonedDateTime.parse(data.getRangeValues().getUpperBound()).plusDays(1).format(DATE_TIME_FORMAT);
                    } catch (DateTimeParseException dtpe) {
                        startDate = LocalDate.parse(data.getRangeValues().getLowerBound()).atStartOfDay().atZone(ZoneOffset.UTC);
                        endDate = LocalDate.parse(data.getRangeValues().getUpperBound()).atStartOfDay().atZone(ZoneOffset.UTC);
                        startDateTime = startDate.format(DATE_TIME_FORMAT);
                        endDateTime = endDate.plusDays(1).format(DATE_TIME_FORMAT);
                    }
                    dateRange.put("startDateTime", startDateTime);
                    dateRange.put("endDateTime", endDateTime);
                } else {
                    throw new DataHubException("The date range is missing for createdOn in your request");
                }
                break;
        }
        return dateRange;
    }
}
