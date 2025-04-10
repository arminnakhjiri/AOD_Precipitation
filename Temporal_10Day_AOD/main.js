// Define geometry (AOI) and time interval
var AOI = basin;
Map.centerObject(SubBasin); // Center the map on SubBasin
Map.addLayer(SubBasin, {color: 'black'}, 'Basin'); // Display SubBasin with black outline

// Log the SubBasin geometry to the console for verification
print(SubBasin);

// Select a specific polygon from SubBasin as the AOI
var AOI = ee.Feature(SubBasin.toList(9).get(8)).geometry();
Map.addLayer(AOI, {color: 'red'}, 'Selected Polygon'); // Display selected AOI with red outline

var timeInterval = 10; // Set time interval to 10 days

// Define date range for analysis
var startDate = ee.Date('2000-03-01'); // Start date
var endDate = ee.Date('2001-01-01'); // End date

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

// Function to create a multi-band image for a given 10-day interval
function createCombinedImage(dateMillis) {
  var date = ee.Date(dateMillis); // Convert milliseconds to date

  var Optical_Depth_047_avg = calculateIntervalAverage(OpticalDepth, 'Optical_Depth_047', date); // 470nm band
  var Optical_Depth_055_avg = calculateIntervalAverage(OpticalDepth, 'Optical_Depth_055', date); // 550nm band

  var combinedImage = Optical_Depth_047_avg.addBands([Optical_Depth_055_avg]) // Combine bands
                                           .set('system:time_start', date); // Set timestamp

  return combinedImage;
}

// Load MODIS MCD19A2 Granules ImageCollection for AOD data
var OpticalDepth = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands (470nm and 550nm)
                    .filterBounds(AOI); // Restrict to AOI

// Generate list of 10-day intervals between start and end date
var dateList = ee.List.sequence(startDate.millis(), endDate.millis(), 1000 * 60 * 60 * 24 * timeInterval);

// Create a collection of combined 10-day interval images
var combinedCollection = ee.ImageCollection.fromImages(
  dateList.map(createCombinedImage) // Create image for each interval
);

// Generate a time series chart of 10-day AOD intervals
var chart = ui.Chart.image.series(
  combinedCollection, // Input collection
  AOI, // Region for analysis
  ee.Reducer.median(), // Median reducer for aggregation
  1000, // Scale in meters
  'system:time_start' // Use timestamp for x-axis
)
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Temporal pattern of Optical Depth', // Chart title
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

// Function to create a feature from each image for export
function imageToFeature(image) {
  var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd'); // Format date as string
  var stats = image.reduceRegion({
    reducer: ee.Reducer.median(), // Calculate median stats
    geometry: AOI, // Region for reduction
    scale: 1000, // Resolution in meters
    bestEffort: true // Adjust scale if needed
  });
  
  return ee.Feature(null, stats.set('date', date)); // Create feature with stats and date
}

// Convert ImageCollection to FeatureCollection for export
var featureCollection = combinedCollection.map(imageToFeature);

// Export the time series data to Google Drive as a CSV
Export.table.toDrive({
  collection: featureCollection, // Feature collection to export
  description: 'OpticalDepth_08', // File description
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'OpticalDepth_08', // File name prefix
  fileFormat: 'CSV' // Export format
});

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri