// Define geometry (AOI) and time interval
var AOI = basin;
Map.centerObject(basin); // Center the map on basin

Map.addLayer(subBasin, {color: 'black'}, 'Basin'); // Display subBasin with black outline

// Log the subBasin geometry to the console for verification
print(subBasin);

// Select a specific polygon from subBasin as the AOI
var AOI = ee.Feature(subBasin.toList(9).get(8)).geometry();
Map.addLayer(AOI, {color: 'red'}, 'Selected Polygon'); // Display selected AOI with red outline

var timeInterval = 10; // Set time interval to 10 days

// Define date range for analysis
var startDate = ee.Date('2019-01-01'); // Start date
var endDate = ee.Date('2020-01-01'); // End date

// Function to calculate 10-day interval average for a given band
function calculateIntervalAverage(collection, bandName, startDate) {
  var endDate = ee.Date(startDate).advance(timeInterval, 'day'); // End of 10-day interval
  var intervalCollection = collection.filterDate(startDate, endDate); // Filter by date range
  
  var intervalAverage = intervalCollection.mean() // Compute mean for the interval
                   .select(bandName) // Select specified band
                   .rename(bandName) // Retain band name
                   .set('system:time_start', startDate) // Set timestamp
                   .clip(AOI); // Clip to AOI
  
  return intervalAverage;
}

// Function to create a single-band image for a given 10-day interval
function createCombinedImage(dateMillis) {
  var date = ee.Date(dateMillis); // Convert milliseconds to date
  var precipitation_avg = calculateIntervalAverage(TRMM, 'precipitation', date); // Calculate precipitation average
  
  var combinedImage = precipitation_avg.set('system:time_start', date); // Set timestamp
  return combinedImage;
}

// Load TRMM 3B42 ImageCollection for precipitation data
var TRMM = ee.ImageCollection('TRMM/3B42')
                    .select(['precipitation']) // Select precipitation band (mm/hr)
                    .filterBounds(AOI); // Restrict to AOI

// Generate list of 10-day intervals between start and end date
var dateList = ee.List.sequence(startDate.millis(), endDate.millis(), 1000 * 60 * 60 * 24 * timeInterval);

// Create a collection of combined 10-day interval images
var combinedCollection = ee.ImageCollection.fromImages(
  dateList.map(createCombinedImage) // Create image for each interval
);

// Visualize the first 10-day interval average on the map
Map.addLayer(combinedCollection.first(), {}, 'First Interval Average'); // Display with default visualization

// Generate a time series chart of 10-day precipitation intervals
var chart = ui.Chart.image.series(
  combinedCollection, // Input collection
  AOI, // Region for analysis
  ee.Reducer.median(), // Median reducer for aggregation
  27830, // TRMM resolution in meters
  'system:time_start' // Use timestamp for x-axis
)
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Temporal pattern of Precipitation', // Chart title
  hAxis: {title: 'Time Series'}, // Horizontal axis label
  vAxis: {title: 'Precipitation (mm/hr)'}, // Vertical axis label
  lineWidth: 1, // Line thickness
  pointSize: 2, // Point size
  series: {
    0: {color: '00A6FF'} // Blue for precipitation
  }
});

// Display the chart in the console
print(chart);

// Function to create a feature from each image for export
function imageToFeature(image) {
  var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd'); // Format date as string
  var stats = image.reduceRegion({
    reducer: ee.Reducer.median(), // Calculate median stats
    geometry: AOI, // Region for reduction
    scale: 27830, // Resolution in meters
    bestEffort: true // Adjust scale if needed
  });
  
  return ee.Feature(null, stats.set('date', date)); // Create feature with stats and date
}

// Convert ImageCollection to FeatureCollection for export
var featureCollection = combinedCollection.map(imageToFeature);

// Export the time series data to Google Drive as a CSV
Export.table.toDrive({
  collection: featureCollection, // Feature collection to export
  description: 'TRMM_Precipitation_198', // File description
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'TRMM_Precipitation_198', // File name prefix
  fileFormat: 'CSV' // Export format
});

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri