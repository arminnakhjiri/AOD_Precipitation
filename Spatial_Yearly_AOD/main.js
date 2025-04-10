// Define the Area of Interest (AOI) for analysis
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Define the date range for analysis (2000 to 2023)
var startYear = 2000;
var endYear = 2023;

// Define scaling factor for MODIS MCD19A2 optical depth bands
var scaleFactor = 0.001;

// Function to calculate yearly average AOD for a given year
function calculateYearlyAverage(year) {
  var startDate = ee.Date.fromYMD(year, 1, 1); // Start of the year
  var endDate = startDate.advance(1, 'year'); // End of the year

  var yearCollection = OpticalDepth.filterDate(startDate, endDate) // Filter by year
                                   .filterBounds(AOI); // Restrict to AOI

  // Calculate the median for each band and apply the scaling factor
  var yearlyAverage = yearCollection.median() // Use median to reduce outliers
                                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands
                                    .multiply(scaleFactor) // Apply scaling factor
                                    .rename(['Optical_Depth_047', 'Optical_Depth_055']) // Retain band names
                                    .set('system:time_start', startDate.millis()) // Set timestamp in milliseconds
                                    .clip(AOI); // Clip to AOI

  return yearlyAverage;
}

// Load MODIS MCD19A2 Granules ImageCollection for AOD data
var OpticalDepth = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands (470nm and 550nm)
                    .filterBounds(AOI); // Restrict to AOI

// Generate yearly averages from 2000 to 2023
var years = ee.List.sequence(startYear, endYear); // List of years
var yearlyCollection = ee.ImageCollection.fromImages(
  years.map(function(year) {
    return calculateYearlyAverage(year); // Create image for each year
  })
);

// Log the resulting collection to the console
print(yearlyCollection);

// Visualize the first year's average AOD on the map
Map.addLayer(yearlyCollection.first(), {}, 'First Yearly Average'); // Display with default visualization

// Generate a time series chart of yearly AOD
var chart = ui.Chart.image.series(
  yearlyCollection, // Input collection
  AOI, // Region for analysis
  ee.Reducer.median(), // Median reducer for aggregation
  1500, // Scale in meters (adjusted for visualization)
  'system:time_start' // Use timestamp for x-axis
)
.setChartType('ScatterChart') // Set chart type
.setOptions({
  title: 'Yearly Optical Depth from 2000 to 2023', // Chart title
  hAxis: {title: 'Year'}, // Horizontal axis label
  vAxis: {title: 'Optical Depth'}, // Vertical axis label
  lineWidth: 1, // Line thickness
  pointSize: 3, // Point size
  series: {
    0: {color: 'ff0000'}, // Red for Optical_Depth_047
    1: {color: '0000FF'}  // Blue for Optical_Depth_055
  }
});

// Display the chart in the console
print(chart);

// Convert the yearly average collection to a single multi-band image
var multiBandImage = yearlyCollection.toBands();

// Export the multi-band image to Google Drive
Export.image.toDrive({
  image: multiBandImage, // Image to export
  description: 'YEARLY_OpticalDepth_2000_2023', // File description
  folder: 'GEE_Exports', // Destination folder
  fileNamePrefix: 'YEARLY_OpticalDepth_2000_2023', // File name prefix
  region: AOI, // Export region
  scale: 1000, // Resolution in meters
  maxPixels: 1e13 // Maximum pixel limit
});

// Log the multi-band image to the console for inspection
print(multiBandImage);

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri