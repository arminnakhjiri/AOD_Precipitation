// Define the Area of Interest (AOI) for analysis
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Define the date range for analysis (2000 to 2019)
var startYear = 2000;
var endYear = 2019;

// Function to calculate yearly average precipitation for a given year
function calculateYearlyAverage(year) {
  var startDate = ee.Date.fromYMD(year, 1, 1); // Start of the year
  var endDate = startDate.advance(1, 'year'); // End of the year

  var yearCollection = Precipitation.filterDate(startDate, endDate) // Filter by year
                                   .filterBounds(AOI); // Restrict to AOI

  // Calculate the mean for the precipitation band
  var yearlyAverage = yearCollection.mean() // Use mean to average precipitation
                                    .select(['precipitation']) // Select precipitation band
                                    .set('system:time_start', startDate.millis()) // Set timestamp in milliseconds
                                    .clip(AOI); // Clip to AOI

  return yearlyAverage;
}

// Load TRMM 3B42 ImageCollection for precipitation data
var Precipitation = ee.ImageCollection('TRMM/3B42')
                    .select(['precipitation']) // Select precipitation band (mm/day)
                    .filterBounds(AOI); // Restrict to AOI

// Generate yearly averages from 2000 to 2019
var years = ee.List.sequence(startYear, endYear); // List of years
var yearlyCollection = ee.ImageCollection.fromImages(
  years.map(function(year) {
    return calculateYearlyAverage(year); // Create image for each year
  })
);

// Log the resulting collection to the console
print(yearlyCollection);

// Visualize the first year's average precipitation on the map
Map.addLayer(yearlyCollection.first(), {}, 'First Yearly Average'); // Display with default visualization

// Generate a time series chart of yearly precipitation
var chart = ui.Chart.image.series(
  yearlyCollection, // Input collection
  AOI, // Region for analysis
  ee.Reducer.median(), // Median reducer for aggregation
  27830, // TRMM resolution in meters
  'system:time_start' // Use timestamp for x-axis
)
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Yearly Precipitation from 2000 to 2019', // Chart title
  hAxis: {title: 'Year'}, // Horizontal axis label
  vAxis: {title: 'Precipitation (mm)'}, // Vertical axis label
  lineWidth: 1, // Line thickness
  pointSize: 3, // Point size
  series: {
    0: {color: 'ff0000'} // Red for precipitation
  }
});

// Display the chart in the console
print(chart);

// Convert the yearly average collection to a single multi-band image
var multiBandImage = yearlyCollection.toBands();

// Export the multi-band image to Google Drive
Export.image.toDrive({
  image: multiBandImage, // Image to export
  description: 'YEARLY_Precipitation_2000_2019', // File description
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'YEARLYPrecipitation_2000_2019', // File name prefix
  region: AOI, // Export region
  scale: 27830, // TRMM resolution in meters
  maxPixels: 1e13 // Maximum pixel limit
});

// Log the multi-band image to the console for inspection
print(multiBandImage);

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri