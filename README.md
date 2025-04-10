# GEE Scripts for Spatiotemporal Analysis of AOD and Precipitation

This repository provides a comprehensive set of Google Earth Engine (GEE) scripts for retrieving, analyzing, and exporting **Aerosol Optical Depth (AOD)** and **precipitation** data across multiple spatial and temporal scales. These tools are intended for environmental monitoring, air quality research, and hydrological studies.

## 📦 Contents

The project includes scripts for:
- Temporal aggregation (daily, 10-day, monthly, seasonal, yearly)
- Spatial averaging (entire basin or sub-basins)
- Multi-band exports for satellite time-series data
- CSV exports for statistical analysis

### Folders Overview

| Folder Name                     | Description |
|-------------------------------|-------------|
| `24Yr_AOD_Avg`                | 24-year average of AOD data |
| `24Yr_Precip_Avg`             | 24-year average of precipitation data |
| `Spatial_Monthly_AOD`         | Monthly AOD images (spatial averages) |
| `Spatial_Monthly_AOD_Looped`  | Looped script for monthly AOD |
| `Spatial_Monthly_Precip`      | Monthly precipitation images |
| `Spatial_Seasonal_AOD`        | Seasonal AOD averages |
| `Spatial_Seasonal_AOD_Looped` | Looped script for seasonal AOD |
| `Spatial_Seasonal_Precip`     | Seasonal precipitation averages |
| `Spatial_Yearly_AOD`          | Yearly AOD averages |
| `Spatial_Yearly_Precip`       | Yearly precipitation averages |
| `Temporal_10Day_AOD`          | AOD time series with 10-day intervals |
| `Temporal_10Day_Precip`       | Precipitation time series (10-day) using TRMM |
| `Temporal_10Day_Precip(GPM)`  | Precipitation time series (10-day) using GPM |
| `Temporal_Daily_AOD`          | Daily AOD values as CSV |
| `Readme.md`                   | Project documentation (this file) |

## 🛰 Datasets Used

- **MODIS MCD19A2 (v061)**: Aerosol Optical Depth at 470nm and 550nm.
- **TRMM 3B42**: Tropical Rainfall Measuring Mission data (mm/hr).
- **GPM IMERG V07**: Global Precipitation Measurement (mm/hr).

## 🛠 How to Use

1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Load any script from this repository.
3. Define your `basin` or `basin2` geometry as required in each script.
4. Modify the time interval or other parameters if needed.
5. Run the script to generate visual outputs or export results to your Google Drive (`GEE_Exports` folder).

## 📈 Example Output

- Time series of 10-day average AOD values
- Seasonal precipitation maps
- CSV exports of daily optical depth statistics
- Multi-band MODIS composites

## 📬 Contact

For questions, collaboration, or feedback, feel free to get in touch:

- **Author**: Armin Nakhjiri  
- **Email**: [nakhjiri.armin@gmail.com](mailto:nakhjiri.armin@gmail.com)  
- **LinkedIn**: [Armin Nakhjiri](https://www.linkedin.com/in/arminnakhjiri/)
