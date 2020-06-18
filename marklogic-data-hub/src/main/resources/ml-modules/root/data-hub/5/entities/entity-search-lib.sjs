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

const ds = require("/data-hub/5/data-services/ds-utils.sjs");
// TODO Will move this to /data-hub/5/entities soon
const entityLib = require("/data-hub/5/impl/entity-lib.sjs");

/**
 * If the entity instance cannot be found for any search result, that fact is logged instead of an error being thrown or
 * trace logging being used. This ensures that the condition appears in logging, but it should not throw an error
 * because other entities in the search results may be able to have properties added for them.
 *
 * @param entityName
 * @param searchResponse
 */
function addPropertiesToSearchResponse(entityName, searchResponse, propertiesToDisplay) {
  const maxDefaultProperties = 5;
  const selectedProperties = typeof propertiesToDisplay === 'string' ? propertiesToDisplay.split(",") :  propertiesToDisplay;
  const entityModel = entityLib.findModelByEntityName(entityName);
  if (!entityModel) {
    ds.throwServerError(`Could not add entity properties to search response; could not find an entity model for entity name: ${entityName}`);
  }

  const allMetadata = buildPropertyMetadata("", entityModel, entityName);
  const propertyMetadata = allMetadata["allPropertyMetadata"];

  let selectedPropertyMetadata = [];
  if(selectedProperties) {
    selectedPropertyMetadata = buildSelectedPropertiesMetadata(allMetadata, selectedProperties);
  }
  selectedPropertyMetadata = selectedPropertyMetadata.length > 0 ? selectedPropertyMetadata : propertyMetadata.slice(0, maxDefaultProperties);

  // Add entityProperties to each search result
  searchResponse.results.forEach(result => {
    result.entityProperties = [];

    let instance = null;
    try {
      instance = cts.doc(result.uri).toObject().envelope.instance;
    } catch (error) {
      console.log(`Unable to obtain entity instance from document with URI '${result.uri}'; will not add entity properties to its search result`);
    }

    if (instance != null) {
      const entityInstance = instance[entityName];
      if (!entityInstance) {
        console.log(`Unable to obtain entity instance from document with URI '${result.uri}' and entity name '${entityName}'; will not add entity properties to its search result`);
      } else {
        selectedPropertyMetadata.forEach(parentProperty => {
          result.entityProperties.push(getPropertyValuesFromInstance(parentProperty, entityInstance));
        });
      }
    }
  });
  // Make it easy for the client to know which property names were used, and which ones exist
  // searchResponse.selectedPropertyDefinitions = selectedPropertyMetadata;
  searchResponse.selectedPropertyDefinitions = selectedPropertyMetadata;
  searchResponse.entityPropertyDefinitions = propertyMetadata;
}

// This function builds the logical entityType property metadata for all entityType properties from an entityModel.
// This also builds selected entityType property metadata provided by user during entity search
function buildPropertyMetadata(parentPropertyName, entityModel, entityName) {
  const entityType = entityModel.definitions[entityName];
  if (!entityType) {
    ds.throwServerError("Could not build property metadata; could not find entity type with name: " + entityName);
  }

  const allPropertyMetadata = [];
  let allKeyValuePairs = {};

  for (var propertyName of Object.keys(entityType.properties)) {
    const property = entityType.properties[propertyName];

    const isSimpleProperty = property.datatype != "array" && !property["$ref"];
    const isSimpleArrayProperty = property.datatype == "array" && (property["items"] && !property["items"]["$ref"]);
    const isStructuredProperty = property.datatype != "array" && property["$ref"];
    const isStructuredArrayProperty = property.datatype == "array" && (property["items"] && property["items"]["$ref"]);

    const propertyMetadata = {};
    const propertyMetadataObject = {};

    propertyMetadata["propertyPath"] = parentPropertyName ? parentPropertyName + "." + propertyName : propertyName;
    propertyMetadataObject["propertyPath"] = propertyMetadata["propertyPath"];

    propertyMetadata["propertyLabel"] = propertyName;
    propertyMetadataObject["propertyLabel"] = propertyName;

    propertyMetadata["datatype"] = (isSimpleProperty || isSimpleArrayProperty) ? (isSimpleProperty ? property.datatype : property["items"]["datatype"]) : "object";
    propertyMetadataObject["datatype"] = propertyMetadata["datatype"];

    propertyMetadata["multiple"] = (isSimpleArrayProperty || isStructuredArrayProperty) ? true : false;
    propertyMetadataObject["multiple"] = propertyMetadata["multiple"];

    // allKeyValuePairs[propertyMetadataObject["propertyPath"]] = propertyMetadataObject;

    if (isStructuredProperty || isStructuredArrayProperty) {
      let referenceInfo = isStructuredProperty ? property["$ref"].split("/") : property["items"]["$ref"].split("/");
      if (referenceInfo[0] !== "#") {
        // As of 5.3.0, relationship properties are ignored; we won't include data from them in search results
        continue;
      }
      entityName = referenceInfo.pop();
      const metaData = buildPropertyMetadata(propertyMetadata["propertyPath"], entityModel, entityName);
      propertyMetadata["properties"] = metaData["allPropertyMetadata"];
      propertyMetadataObject["properties"] = metaData["allPropertyMetadata"];

      allKeyValuePairs = {...allKeyValuePairs, ...metaData["allKeyValuePairs"]};
    }
    allKeyValuePairs[propertyMetadataObject["propertyPath"]] = propertyMetadataObject;
    allPropertyMetadata.push(propertyMetadata);
  }

  const allMetadata = {};
  allMetadata["allPropertyMetadata"] = allPropertyMetadata;
  allMetadata["allKeyValuePairs"] = allKeyValuePairs;

  return allMetadata;
}

function buildAllPropertiesMetadata(parentPropertyName, entityModel, entityName) {
  let metaData = buildPropertyMetadata(parentPropertyName, entityModel, entityName);
  return metaData["allPropertyMetadata"];
}

function buildSelectedPropertiesMetadata(allMetadata, selectedProperties) {
  const allKeyValuePairs = JSON.parse(JSON.stringify(allMetadata["allKeyValuePairs"]));
  const selectedPropertyDefinitions = {};
  const selectedPropertyDefinitionsArray = [];

  selectedProperties.forEach((selectedPropertyName) => {
    const selectedPropertyNameArray = selectedPropertyName.split(".");
    const actualSelectedPropertyName = selectedPropertyNameArray.pop();
    let selectedPropertyMetadataBuilder = [];
    if(selectedPropertyNameArray.length > 0) {
      const parentPropertyName = selectedPropertyNameArray[0];
      let structuredPropertyPath = "";
      if(selectedPropertyDefinitions[parentPropertyName]) {
        let dummyObject = JSON.parse(JSON.stringify(selectedPropertyDefinitions[parentPropertyName]));
        let metadataObject = dummyObject;
        selectedPropertyNameArray.forEach((propertyName) => {
          propertyName = structuredPropertyPath ? structuredPropertyPath + "." + propertyName : propertyName;
          console.log("propertyName: " + propertyName);
          structuredPropertyPath = propertyName;

          if(Array.isArray(metadataObject)) {
            if(metadataObject.map(property => property.propertyPath).includes(propertyName)) {
              metadataObject = metadataObject.find(property => property.propertyPath === propertyName)["properties"];
            } else {
              let missingProperty = allKeyValuePairs[structuredPropertyPath];
              missingProperty['properties'] = [];
              metadataObject.push(missingProperty);
              metadataObject = metadataObject.find(property => property.propertyPath === propertyName)["properties"];
            }
          } else {
            metadataObject = metadataObject["properties"];
          }
        });
        metadataObject.push(JSON.parse(JSON.stringify(allKeyValuePairs[structuredPropertyPath + "." + actualSelectedPropertyName])));
        selectedPropertyDefinitions[parentPropertyName] = dummyObject;
      } else {
        selectedPropertyNameArray.forEach((propertyName) => {
          propertyName = structuredPropertyPath ? structuredPropertyPath + "." + propertyName : propertyName;
          structuredPropertyPath = propertyName;
          let metadataObject = allKeyValuePairs[propertyName] ? JSON.parse(JSON.stringify(allKeyValuePairs[propertyName])) : {};
          delete metadataObject["properties"];
          selectedPropertyMetadataBuilder.push(metadataObject);
        });
        selectedPropertyMetadataBuilder.push(JSON.parse(JSON.stringify(allKeyValuePairs[structuredPropertyPath + "." + actualSelectedPropertyName])));
        selectedPropertyMetadataBuilder.reverse();

        let currentProperties = [];
        let finalMetadataProperty = {};
        selectedPropertyMetadataBuilder.forEach((metadataProperty) => {
          if(currentProperties.length > 0) {
            metadataProperty["properties"] = currentProperties;
          }
          currentProperties = [].concat(JSON.parse(JSON.stringify(metadataProperty)));
          finalMetadataProperty = currentProperties.length > 0 ? metadataProperty : {};
        });
        if(Object.keys(finalMetadataProperty).length > 0) {
          selectedPropertyDefinitions[parentPropertyName] = finalMetadataProperty;
        }
      }
    } else {
      if(allKeyValuePairs[actualSelectedPropertyName]) {
        selectedPropertyDefinitionsArray.push(allKeyValuePairs[actualSelectedPropertyName]);
      }
    }
  });
  Object.keys(selectedPropertyDefinitions).forEach(key => selectedPropertyDefinitionsArray.push(selectedPropertyDefinitions[key]));
  return selectedPropertyDefinitionsArray;
}

// Helper function used by getPropertyValuesFromInstance to fetch property values from a propertyPath
function getPropertyPathValues(currentProperty, entityInstance) {
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
          currentPropertyValueArray.push(getPropertyPathValues(property, instance));
        });
        resultObject.propertyValue.push(currentPropertyValueArray);
      });
    } else {
      let currentPropertyValueArray = [];
      let childPropertyName = Object.keys(entityInstance[propertyName])[0];
      entityInstance = entityInstance[propertyName][childPropertyName];
      currentProperty.properties.forEach((property) => {
        currentPropertyValueArray.push(getPropertyPathValues(property, entityInstance));
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

// This function fetches the appropriate instance property values for first level simple, structured property paths and
// other levels of structured entity properties from the propertyPath.
function getPropertyValuesFromInstance(currentProperty, entityInstance) {
  let resultObject = {};
  resultObject.propertyPath = currentProperty.propertyPath;

  if(Array.isArray(entityInstance)) {
    let propertyValuesArray = [];
    entityInstance.forEach((instance) => {
      let propertyValue = getPropertyPathValues(currentProperty, instance).propertyValue;
      if(Array.isArray(propertyValue)) {
        propertyValue.forEach((propertyValue) => {
          propertyValuesArray.push(propertyValue);
        });
      } else {
        propertyValuesArray.push(propertyValue);
      }
    });
    resultObject.propertyValue = propertyValuesArray;
  } else {
    resultObject.propertyValue =  getPropertyPathValues(currentProperty, entityInstance).propertyValue;
  }
  return resultObject;
}

// This function fetches the appropriate instance for first level simple, structured property paths and other levels of
// structured entity properties from the propertyPath.
function getInstanceFromPropertyPath(currentProperty, entityInstance) {
  let splitPropertyNames = currentProperty.propertyPath.split(".");
  splitPropertyNames.pop();

  if(splitPropertyNames.length > 0) {
    splitPropertyNames.forEach((propertyName) => {
      let propertyInstanceArray = [];
      if(Array.isArray(entityInstance)) {
        entityInstance.forEach(instance => {
          if(!instance[propertyName]) {
            return;
          }
          const propertyInstance = getInstance(propertyName, instance[propertyName]);
          if(Array.isArray(propertyInstance)) {
            propertyInstanceArray.concat(propertyInstance);
          } else {
            propertyInstanceArray.push(propertyInstance);
          }
        });
        entityInstance = propertyInstanceArray;
      } else {
        if(!entityInstance[propertyName]) {
          return;
        }
        entityInstance = getInstance(propertyName, entityInstance[propertyName]);
      }
    });
  }
  return entityInstance;
}

// Helper function used by getInstanceFromPropertyPath
function getInstance(propertyName, entityInstance) {
  let childPropertyName = null;
  let instanceArray = [];
  if(Array.isArray(entityInstance)) {
    childPropertyName = Object.keys(entityInstance[0])[0];
    entityInstance.forEach((propertyInstance) => {
      instanceArray.push(propertyInstance[childPropertyName]);
    });
    entityInstance = instanceArray;
  } else {
    childPropertyName = Object.keys(entityInstance)[0];
    entityInstance = entityInstance[childPropertyName];
  }
  return entityInstance;
}

module.exports = {
  addPropertiesToSearchResponse,
  buildPropertyMetadata
};
