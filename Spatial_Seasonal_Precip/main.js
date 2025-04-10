// Define the Area of Interest (AOI) and center the map on it
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Set the year for analysis (2014)
var year = 2014;

// Define seasons with their start and end months
var seasons = [
  {name: 'Winter', startMonth: 1, endMonth: 3},
  {name: 'Spring', startMonth: 4, endMonth: 6},
  {name: 'Summer', startMonth: 7, endMonth: 9},
  {name: 'Fall', startMonth: 10, endMonth: 12}
];

// Function to calculate seasonal average precipitation for a given band
function calculateSeasonalAverage(collection, bandName, year, startMonth, endMonth) {
  var startDate = ee.Date.fromYMD(year, startMonth, 1); // Start of the season
  var endDate = ee.Date.fromYMD(year, endMonth, 1).advance(1, 'month').advance(-1, 'day'); // Last day of end month
  var seasonalCollection = collection.filterDate(startDate, endDate); // Filter by date range
  
  var seasonalAverage = seasonalCollection.mean() // Compute mean for the season
                      .select(bandName) // Select specified band
                      .rename(bandName) // Retain band name
                      .set('system:time_start', startDate) // Set timestamp
                      .clip(AOI); // Clip to AOI
  
  return seasonalAverage;
}

// Function to create a single-band image for each season
function createCombinedImage(seasonDict) {
  var season = ee.Dictionary(seasonDict); // Convert season object to dictionary
  var startMonth = season.get('startMonth'); // Extract start month
  var endMonth = season.get('endMonth'); // Extract end month
  
  var precipitation_avg = calculateSeasonalAverage(TRMM, 'precipitation', year, startMonth, endMonth); // Seasonal precipitation average

  var combinedImage = precipitation_avg
                      .set('system:time_start', ee.Date.fromYMD(year, startMonth, 1)) // Set timestamp
                      .set('season', season.get('name')); // Label with season name

  return combinedImage;
}

// Load TRMM 3B42 ImageCollection for precipitation data
var TRMM = ee.ImageCollection('TRMM/3B42')
                    .select(['precipitation']) // Select precipitation band (mm/day)
                    .filterBounds(AOI); // Restrict to AOI

// Create a collection of combined seasonal images for 2014
var combinedCollection = ee.ImageCollection.fromImages(
  ee.List(seasons).map(function(s) {
    return createCombinedImage(s); // Create image for each season
  })
);

// Log the resulting collection to the console
print(combinedCollection);

// Generate a time series chart of seasonal precipitation
var chart = ui.Chart.image.series({
  imageCollection: combinedCollection, // Input collection
  region: AOI, // Region for analysis
  reducer: ee.Reducer.median(), // Median reducer for aggregation
  scale: 27830, // TRMM resolution in meters
  xProperty: 'system:time_start' // Use timestamp for x-axis
})
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Seasonal Precipitation Temporal Pattern (2014)', // Chart title
  hAxis: {title: 'Time Series'}, // Horizontal axis label
  vAxis: {title: 'Precipitation (mm/day)'}, // Vertical axis label
  lineWidth: 1, // Line thickness
  pointSize: 2, // Point size
  series: {0: {color: '00ff00'}} // Green color for precipitation
});

// Display the chart in the console
print(chart);

// Convert the collection to a single multi-band image
var multiBandImage = combinedCollection.toBands();

// Export the multi-band image to Google Drive
Export.image.toDrive({
  image: multiBandImage, // Image to export
  description: 'SEASONAL_Precipitation', // File description
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'SEASONALPrecipitation', // File name prefix
  region: AOI, // Export region
  scale: 27830, // TRMM resolution in meters
  maxPixels: 1e13 // Maximum pixel limit
});

// Log the multi-band image to the console for inspection
print(multiBandImage);

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri