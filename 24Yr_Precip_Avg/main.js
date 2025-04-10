// Define Area of Interest (AOI) and center the map on it
var AOI = basin;
Map.centerObject(basin);

// Define time interval
var startDate = ee.Date('2000-01-01');
var endDate = ee.Date('2020-01-01');

// Load TRMM ImageCollection and filter by date range
var TRMM = ee.ImageCollection('TRMM/3B42')
              .select(['precipitation'])
              .filterDate(startDate, endDate);
print(TRMM);

// Calculate mean precipitation over the period and clip to AOI
var TRMM = TRMM
            .mean()
            .clip(AOI);

// Display the averaged TRMM layer on the map
Map.addLayer(TRMM, {}, 'TRMM');

// Export the averaged precipitation image to Google Drive
Export.image.toDrive({
  image: TRMM,
  description: 'TRMM_Precipitation_avg00-19',
  folder: 'GEE_Exports',
  fileNamePrefix: 'TRMM_Precipitation_Avg00-19',
  region: AOI,
  scale: 27830,
  maxPixels: 1e13
});
