// Define the Area of Interest (AOI) and center the map on it
var AOI = basin;
Map.centerObject(basin); // Center the map on the basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Display basin with black outline

// Log the basin geometry to the console for verification
print(basin);

// Define scaling factor for MODIS MCD19A2 optical depth bands
var scaleFactor = 0.001;

// Set the date range for analysis (2000 to 2023)
var startYear = 2000;
var endYear = 2023;

// Function to calculate monthly average AOD for a given band
function calculateMonthlyAverage(collection, bandName, year, month) {
  var startDate = ee.Date.fromYMD(year, month, 1); // Start of the month
  var endDate = startDate.advance(1, 'month'); // End of the month
  var monthlyCollection = collection.filterDate(startDate, endDate); // Filter by date range
  
  var monthlyAverage = monthlyCollection.median() // Use median to reduce outliers
                      .select(bandName) // Select specified AOD band
                      .multiply(scaleFactor) // Apply scaling factor
                      .rename(bandName) // Retain band name
                      .set('system:time_start', startDate) // Set timestamp
                      .clip(AOI); // Clip to AOI
  
  return monthlyAverage; 
}

// Function to create a multi-band image for a specific month
function createCombinedImage(year, month) {
  var Optical_Depth_047_avg = calculateMonthlyAverage(OpticalDepth, 'Optical_Depth_047', year, month); // 470nm band
  var Optical_Depth_055_avg = calculateMonthlyAverage(OpticalDepth, 'Optical_Depth_055', year, month); // 550nm band

  var combinedImage = Optical_Depth_047_avg.addBands([Optical_Depth_055_avg]) // Combine bands
                                           .set('system:time_start', ee.Date.fromYMD(year, month, 1)); // Set timestamp

  return combinedImage;
}

// Load MODIS MCD19A2 Granules ImageCollection for AOD data
var OpticalDepth = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands (470nm and 550nm)
                    .filterBounds(AOI); // Restrict to AOI

// Generate a list of months (1 to 12)
var months = ee.List.sequence(1, 12);

// Loop through each year to process and export monthly AOD data
for (var year = startYear; year <= endYear; year++) {
  (function(year) {
    var combinedCollection = ee.ImageCollection.fromImages(
      months.map(function(m) {
        return createCombinedImage(year, m); // Create monthly image for the year
      })
    );

    // Convert the collection to a single multi-band image
    var multiBandImage = combinedCollection.toBands();

    // Export the multi-band image to Google Drive
    Export.image.toDrive({
      image: multiBandImage, // Image to export
      description: 'MonthlyOpticalDepth_' + year, // File description with year
      folder: 'GEE_Exports', // Destination folder
      fileNamePrefix: 'MonthlyOpticalDepth_' + year, // File name prefix with year
      region: AOI, // Export region
      scale: 1000, // Resolution in meters
      maxPixels: 1e13 // Maximum pixel limit
    });
  })(year); // Use IIFE to capture year in closure
}

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri