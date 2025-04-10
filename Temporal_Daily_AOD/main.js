// Define the time range for January 2014
var startDate = '2014-01-01'; // Start date
var endDate = '2014-02-01';   // End date

// Load MODIS MCD19A2 AOD dataset and filter by date and region
var dataset = ee.ImageCollection("MODIS/061/MCD19A2_GRANULES")
                .filterBounds(basin)
                .filterDate(startDate, endDate);

// Define AOD bands of interest (at 470nm and 550nm)
var bands = ['Optical_Depth_047', 'Optical_Depth_055'];

// Function to compute mean AOD values over the AOI for each image
var calculateMeanAOD = function(image) {
  var stats = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: basin.geometry(),
    scale: 1000,
    maxPixels: 1e13
  });

  var aod47 = ee.Number(stats.get('Optical_Depth_047'));
  var aod55 = ee.Number(stats.get('Optical_Depth_055'));

  return ee.Feature(null, {
    'date': image.date().format('YYYY-MM-dd'),
    'AOD_47': aod47,
    'AOD_55': aod55
  });
};

// Create a time series of daily mean AOD values for each image
var timeSeries = dataset.map(calculateMeanAOD);

// Retain only valid AOD entries and attach a 'day' property for grouping
var dailyTimeSeries = timeSeries
  .map(function(feature) {
    return feature.set('day', ee.Date(feature.get('date')).format('YYYY-MM-dd'));
  })
  .filter(ee.Filter.notNull(['AOD_47', 'AOD_55'])); // Remove entries with null AOD values

// Group features by date and compute daily mean AOD for each band
var groupByDay = dailyTimeSeries
  .distinct('day') // Get unique days
  .map(function(dayFeature) {
    var day = dayFeature.get('day');

    // Filter all features corresponding to the current day
    var dailyFeatures = dailyTimeSeries.filter(ee.Filter.eq('day', day));

    // Calculate mean AOD for both bands
    var meanAOD47 = dailyFeatures.aggregate_mean('AOD_47');
    var meanAOD55 = dailyFeatures.aggregate_mean('AOD_55');

    return ee.Feature(null, {
      'date': day,
      'AOD_47': meanAOD47,
      'AOD_55': meanAOD55
    });
  });

// Export the final daily AOD time series as a CSV file to Google Drive
Export.table.toDrive({
  collection: groupByDay,
  description: 'AOD_TimeSeries_2014_Aggregated',
  fileFormat: 'CSV'
});

// Optional: Print the daily AOD time series to the console
print('AOD Time Series for 2014 (aggregated by day):', groupByDay);

// Author: Armin Nakhjiri
// Contact: Nakhjiri.armin@gmail.com | LinkedIn: Armin Nakhjiri