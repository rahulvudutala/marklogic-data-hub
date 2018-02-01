# Data Integration Tests

This folder contains data that is used for developing user stories for data integration.

The data are located in 'input'
```
|-- input  
```

#TLDR; How do I run it?



## Loading the Sample Data
1. Click on the **Flows** Tab at the top.
1. Click on the Order entity on the left.
1. Click on the "Load Orders" input flow.
1. Browse to the input/orders folder.
1. Expand the "General Options" section.
1. Change the Input File Type to "Delimited Text".
1. Type .json for the Output URI Suffix.  
1. Scroll down and press the "RUN IMPORT" button.
1. Click on the Product entity on the left.
1. Click on the "Load Products" input flow.
1. Browse to the input/products folder.
1. Expand the "General Options" section.
1. Change the Input File Type to "Delimited Text".
1. Type .json for the Output URI Suffix.  
1. Scroll down and press the "RUN IMPORT" button.

## Harmonizing the Sample Data
1. Click on the Order entity on the **Flows** Tab.
1. Click on the "Harmonize Orders" harmonize flow.
1. Click on the "RUN HARMONIZE" button.
1. Click on the Product entity.
1. Click on the "Harmonize Products" harmonize flow.
1. Click on the "RUN HARMONIZE" button.

## View the Data
1. Click on the **Browse Data** tab.
1. Click on the facet to select just Orders or just Products data. Click on a document to view an example.
1. Change from the STAGING database to the FINAL database. 
1. Click on the facet to select just harmonized Orders or just harmonized Products. Click on a document to view an example. 

