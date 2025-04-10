// Define the Area of Interest (AOI) and center the map on it
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Define scaling factor for MODIS MCD19A2 optical depth bands
var scaleFactor = 0.001;

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

// Function to create a multi-band image for each season
function createCombinedImage(year, seasonDict) {
  var season = ee.Dictionary(seasonDict); // Convert season object to dictionary
  var startMonth = season.get('startMonth'); // Extract start month
  var endMonth = season.get('endMonth'); // Extract end month
  
  var Optical_Depth_047_avg = calculateSeasonalAverage(OpticalDepth, 'Optical_Depth_047', year, startMonth, endMonth); // 470nm band
  var Optical_Depth_055_avg = calculateSeasonalAverage(OpticalDepth, 'Optical_Depth_055', year, startMonth, endMonth); // 550nm band

  var combinedImage = Optical_Depth_047_avg.addBands([Optical_Depth_055_avg]) // Combine bands
                                           .set('system:time_start', ee.Date.fromYMD(year, startMonth, 1)) // Set timestamp
                                           .set('season', season.get('name')) // Label with season name
                                           .set('year', year); // Label with year

  return combinedImage;
}

// Load MODIS MCD19A2 Granules ImageCollection for AOD data
var OpticalDepth = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands (470nm and 550nm)
                    .filterBounds(AOI); // Restrict to AOI

// Define the year range for analysis (2000 to 2023)
var startYear = 2000;
var endYear = 2023;

// Loop through each year to process and export seasonal AOD data
for (var year = startYear; year <= endYear; year++) {
  // Create a collection of combined seasonal images for the current year
  var combinedCollection = ee.ImageCollection.fromImages(
    ee.List(seasons).map(function(s) {
      return createCombinedImage(year, s); // Create image for each season
    })
  );

  // Convert the collection to a single multi-band image
  var multiBandImage = combinedCollection.toBands();

  // Export the multi-band image to Google Drive
  Export.image.toDrive({
    image: multiBandImage, // Image to export
    description: 'SEASONAL_' + year, // File description with year
    folder: 'GEE_Exports', // Destination folder
    fileNamePrefix: 'SEASONAL_' + year, // File name prefix with year
    region: AOI, // Export region
    scale: 1000, // Resolution in meters
    maxPixels: 1e13 // Maximum pixel limit
  });
}

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri