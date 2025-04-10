// Define the Area of Interest (AOI) and center the map on it
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Set the year for analysis (2014)
var startYear = 2014;

// Function to calculate monthly average for a given ImageCollection
function calculateMonthlyAverage(collection, bandName, year, month) {
  var startDate = ee.Date.fromYMD(year, month, 1); // Start of the month
  var endDate = startDate.advance(1, 'month'); // End of the month
  var monthlyCollection = collection.filterDate(startDate, endDate); // Filter by date range
  
  var monthlyAverage = monthlyCollection.mean() // Compute mean for the month
                      .select(bandName) // Select specified band
                      .rename(bandName) // Retain band name
                      .set('system:time_start', startDate) // Set timestamp
                      .clip(AOI); // Clip to AOI
  
  return monthlyAverage;
}

// Function to create a single-band image for a specific month
function createCombinedImage(year, month) {
  var precipitation_avg = calculateMonthlyAverage(Precipitation, 'precipitation', year, month); // Monthly precipitation average

  var combinedImage = precipitation_avg
                      .set('system:time_start', ee.Date.fromYMD(year, month, 1)); // Set timestamp

  return combinedImage;
}

// Load TRMM 3B42 ImageCollection for precipitation data
var Precipitation = ee.ImageCollection('TRMM/3B42')
                    .select(['precipitation']) // Select precipitation band (mm)
                    .filterBounds(AOI); // Restrict to AOI

// Generate a list of months (1 to 12) for 2014
var months = ee.List.sequence(1, 12);

// Create a collection of monthly precipitation images for 2014
var combinedCollection = ee.ImageCollection.fromImages(
  months.map(function(m) {
    return createCombinedImage(startYear, m); // Create image for each month
  })
);

// Log the resulting collection to the console
print(combinedCollection);

// Visualize the first monthly average image on the map
Map.addLayer(combinedCollection.first(), 
             {min: 0, max: 50, palette: ['blue', 'green', 'yellow', 'red']}, 
             'First Monthly Average'); // Color scale for precipitation

// Generate a time series chart of monthly precipitation
var chart = ui.Chart.image.series({
  imageCollection: combinedCollection, // Input collection
  region: AOI, // Region for analysis
  reducer: ee.Reducer.mean(), // Mean reducer for aggregation
  scale: 27830, // TRMM resolution in meters
  xProperty: 'system:time_start' // Use timestamp for x-axis
})
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Monthly Precipitation Temporal Pattern (2014)', // Age title
  hAxis: {title: 'Time Series'}, // Horizontal axis label
  vAxis: {title: 'Precipitation (mm)'}, // Vertical axis label
  lineWidth: 1, // Line thickness
  pointSize: 2, // Point size
  series: {0: {color: '00A1FF'}} // Blue color for series
});

// Display the chart in the console
print(chart);

// Convert the collection to a single multi-band image
var multiBandImage = combinedCollection.toBands();

// Export the multi-band image to Google Drive
Export.image.toDrive({
  image: multiBandImage, // Image to export
  description: 'MonthlyPrecipitation', // File description
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'TRMM_MonthlyPrecipitation', // File name prefix
  region: AOI, // Export region
  scale: 27830, // TRMM resolution in meters
  maxPixels: 1e13 // Maximum pixel limit
});

// Log the multi-band image to the console for inspection
print(multiBandImage);

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri