// Define the Area of Interest (AOI) geometry for analysis
var AOI = basin;
Map.centerObject(basin); // Center the map on the defined basin
Map.addLayer(basin, {color: 'black'}, 'Basin'); // Add basin layer to map with black outline

// Log the basin geometry to the console for verification
print(basin);

// Set the date range for the analysis (March 1, 2000 to January 1, 2024)
var startDate = "2000-03-01";
var endDate = "2024-01-01";

// Define scaling factor for MODIS MCD19A2 optical depth bands
var scaleFactor = 0.001;

// Calculate the 24-year average Aerosol Optical Depth (AOD)
// Using MODIS MCD19A2 Granules collection, selecting two optical depth bands
var OpticalDepth = ee.ImageCollection("MODIS/061/MCD19A2_GRANULES")
                    .filterDate(startDate, endDate) // Filter by date range
                    .select(['Optical_Depth_047', 'Optical_Depth_055']) // Select AOD bands (470nm and 550nm)
                    .filterBounds(AOI) // Restrict to the AOI
                    .mean() // Compute mean across the time period
                    .multiply(scaleFactor) // Apply scaling factor to convert values
                    .clip(AOI); // Clip result to the AOI boundaries

// Log the resulting average AOD image to the console
print(OpticalDepth);

// Visualize the 24-year average AOD on the map
Map.addLayer(OpticalDepth, {}, '2000-2023 Average');

// Export the multi-band average AOD image to Google Drive
Export.image.toDrive({
  image: OpticalDepth, // Image to export
  description: '2000_2023_Average', // File description
  folder: 'GEE_Exports', // Destination folder in Google Drive
  fileNamePrefix: '2000_2023_Average', // File name prefix
  region: AOI, // Export only the AOI region
  scale: 1000, // Resolution in meters
  maxPixels: 1e13 // Maximum pixel limit to avoid export errors
});

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri