/**
 Copyright (c) 2020 MarkLogic Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';

// TODO Will move this to /data-hub/5/entities soon
const entityLib = require("/data-hub/5/impl/entity-lib.sjs");
const DataHub = require("/data-hub/5/datahub.sjs");
const datahub = new DataHub();


function addPropertiesToSearchResponse(entityName, searchResponse) {
  const maxDefaultProperties = 5;
  const allProperties = generateEntityProperties("", entityName, entityName);
  const defaultProperties = allProperties.slice(0, maxDefaultProperties);

  // Add entityProperties to each search result
  searchResponse.results.forEach(result => {
    let instance = {};
    try {
      instance = cts.doc(result.uri).toObject().envelope.instance;
    } catch (error) {
      datahub.debug.log({message: error, type: 'error'});
      return;
    }

    const entityInstance = instance[entityName];
    result.entityProperties = [];
    defaultProperties.forEach(parentProperty => {
      result.entityProperties.push(getPropertyValues(parentProperty, entityInstance));
    });
  });

  // Make it easy for the client to know which property names were used, and which ones exist
  searchResponse.selectedPropertyDefinitions = defaultProperties;
  searchResponse.entityPropertyDefinitions = allProperties;
}

function generateEntityProperties(parentPropertyName, entityName, entityTypeName) {
  const allProperties = [];
  const entityType = entityLib.findEntityTypeFromModelByEntityName(entityName, entityTypeName);
  if(!entityType) {
    return allProperties;
  }

  for (var propertyName of Object.keys(entityType.properties)) {
    const property = entityType.properties[propertyName];

    const isSimpleProperty = property.datatype != "array" && !property["$ref"];
    const isSimpleArrayProperty = property.datatype == "array" && (property["items"] && !property["items"]["$ref"]);
    const isStructuredProperty = property.datatype != "array" && property["$ref"];
    const isStructuredArrayProperty = property.datatype == "array" && (property["items"] && property["items"]["$ref"]);

    const propertyMetadata = {};
    propertyMetadata["propertyPath"] = parentPropertyName ? parentPropertyName + "." + propertyName : propertyName;
    propertyMetadata["propertyLabel"] = propertyName;
    propertyMetadata["datatype"] = (isSimpleProperty || isSimpleArrayProperty) ? (isSimpleProperty ? property.datatype : property["items"]["datatype"]) : "object";
    propertyMetadata["multiple"] = (isSimpleArrayProperty || isStructuredArrayProperty) ? true : false;

    if(isStructuredProperty || isStructuredArrayProperty) {
      let referenceInfo = isStructuredProperty ? property["$ref"].split("/") : property["items"]["$ref"].split("/");
      entityTypeName =  referenceInfo.pop();
      entityName = referenceInfo[0] === "#" ? entityName : referenceInfo.pop().toString().split("-")[0];
      propertyMetadata["properties"] = generateEntityProperties(propertyMetadata["propertyPath"], entityName, entityTypeName);
    }
    allProperties.push(propertyMetadata);
  }
  return allProperties;
}

function getPropertyValues(currentProperty, entityInstance) {
  let resultObject = {};
  resultObject.propertyPath = currentProperty.propertyPath;
  if(currentProperty.datatype === "object") {
    resultObject.propertyValue = [];

    let propertyName = currentProperty.propertyPath.split(".").pop();
    if(!entityInstance[propertyName] || Object.keys(entityInstance[propertyName]).length == 0) {
      return resultObject;
    }

    if(currentProperty.multiple) {
      entityInstance = entityInstance[propertyName];
      entityInstance.forEach((instance) => {
        let currentPropertyValueArray = [];
        let childPropertyName = Object.keys(instance)[0];
        instance = instance[childPropertyName];
        currentProperty.properties.forEach((property) => {
          currentPropertyValueArray.push(getPropertyValues(property, instance));
        });
        resultObject.propertyValue.push(currentPropertyValueArray);
      });
    } else {
      let currentPropertyValueArray = [];
      let childPropertyName = Object.keys(entityInstance[propertyName])[0];
      entityInstance = entityInstance[propertyName][childPropertyName];
      currentProperty.properties.forEach((property) => {
        currentPropertyValueArray.push(getPropertyValues(property, entityInstance));
      });
      resultObject.propertyValue.push(currentPropertyValueArray);
    }
  } else {
    let propertyName = currentProperty.propertyPath.split(".").pop();
    resultObject.propertyValue = entityInstance[propertyName] ? entityInstance[propertyName] :
        (currentProperty.multiple ? [] : "");
  }
  return resultObject;
}

module.exports = {
  addPropertiesToSearchResponse
};
