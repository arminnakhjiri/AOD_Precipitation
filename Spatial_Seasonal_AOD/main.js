// Define the Area of Interest (AOI) and center the map on it
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Define scaling factor for MODIS MCD19A2 optical depth bands
var scaleFactor = 0.001;

// Set the year for analysis (2023)
var year = 2023;

// Define seasons with their start and end months
var seasons = [
  {name: 'Winter', startMonth: 1, endMonth: 3},
  {name: 'Spring', startMonth: 4, endMonth: 6},
  {name: 'Summer', startMonth: 7, endMonth: 9},
  {name: 'Fall', startMonth: 10, endMonth: 12}
];

// Function to calculate seasonal average AOD for a given band
function calculateSeasonalAverage(collection, bandName, year, startMonth, endMonth) {
  var startDate = ee.Date.fromYMD(year, startMonth, 1); // Start of the season
  var endDate = ee.Date.fromYMD(year, endMonth, 1).advance(1, 'month').advance(-1, 'day'); // Last day of end month
  var seasonalCollection = collection.filterDate(startDate, endDate); // Filter by date range
  
  var seasonalAverage = seasonalCollection.median() // Use median to reduce outliers
                      .select(bandName) // Select specified AOD band
                      .multiply(scaleFactor) // Apply scaling factor
                      .rename(bandName) // Retain band name
                      .set('system:time_start', startDate) // Set timestamp
                      .clip(AOI); // Clip to AOI
  
  return seasonalAverage;
}

// Function to create a multi-band image for a specific season
function createCombinedImage(seasonDict) {
  var season = ee.Dictionary(seasonDict); // Convert season object to dictionary
  var startMonth = season.get('startMonth'); // Extract start month
  var endMonth = season.get('endMonth'); // Extract end month
  
  var Optical_Depth_047_avg = calculateSeasonalAverage(OpticalDepth, 'Optical_Depth_047', year, startMonth, endMonth); // 470nm band
  var Optical_Depth_055_avg = calculateSeasonalAverage(OpticalDepth, 'Optical_Depth_055', year, startMonth, endMonth); // 550nm band

  var combinedImage = Optical_Depth_047_avg.addBands([Optical_Depth_055_avg]) // Combine bands
                                           .set('system:time_start', ee.Date.fromYMD(year, startMonth, 1)) // Set timestamp
                                           .set('season', season.get('name')); // Label with season name

  return combinedImage;
}

// Load MODIS MCD19A2 Granules ImageCollection for AOD data
var OpticalDepth = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands (470nm and 550nm)
                    .filterBounds(AOI); // Restrict to AOI

// Create a collection of combined seasonal images for 2023
var combinedCollection = ee.ImageCollection.fromImages(
  ee.List(seasons).map(function(s) {
    return createCombinedImage(s); // Create image for each season
  })
);

// Log the resulting collection to the console
print(combinedCollection);

// Generate a time series chart of seasonal AOD
var chart = ui.Chart.image.series({
  imageCollection: combinedCollection, // Input collection
  region: AOI, // Region for analysis
  reducer: ee.Reducer.median(), // Median reducer for aggregation
  scale: 1000, // Resolution in meters
  xProperty: 'system:time_start' // Use timestamp for x-axis
})
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Seasonal Optical Depth Temporal Pattern (2014)', // Chart title (note: year should be 2023)
  hAxis: {title: 'Time Series'}, // Horizontal axis label
  vAxis: {title: 'Intensity'}, // Vertical axis label (consider 'AOD' for clarity)
  lineWidth: 1, // Line thickness
  pointSize: 2, // Point size
  series: {
    0: {color: 'ff0000'}, // Red for Optical_Depth_047
    1: {color: '0000FF'}  // Blue for Optical_Depth_055
  }
});

// Display the chart in the console
print(chart);

// Convert the collection to a single multi-band image
var multiBandImage = combinedCollection.toBands();

// Export the multi-band image to Google Drive
Export.image.toDrive({
  image: multiBandImage, // Image to export
  description: 'SEASONAL' + year, // File description with year
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'SEASONAL_OpticalDepth', // File name prefix
  region: AOI, // Export region
  scale: 1000, // Resolution in meters
  maxPixels: 1e13 // Maximum pixel limit
});

// Log the multi-band image to the console for inspection
print(multiBandImage);

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri