

// Akuisisi Citra Sebelum Kebakaran
var sebelumKebakaran = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(batas_wilayah)
  .filterDate('2024-10-01', '2024-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .mosaic()
  .clip(batas_wilayah)
  .multiply(0.0001);

// Akuisisi Citra Setelah Kebakaran
var sesudahKebakaran = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(batas_wilayah)
  .filterDate('2025-01-15', '2025-02-15')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .mosaic()
  .clip(batas_wilayah)
  .multiply(0.0001);

// Menghitung Index ATBI
var hitungATBI = function(img) {
  var nir  = img.select('B8');
  var swir = img.select('B12');
  var nbr  = nir.subtract(swir).divide(nir.add(swir));
  var rasio = swir.divide(nir);
  return nbr.multiply(rasio).rename('ATBI');
};

// Menghitung dATBI
var atbiSebelum = hitungATBI(sebelumKebakaran);
var atbiSesudah = hitungATBI(sesudahKebakaran);
var dATBI = atbiSebelum.subtract(atbiSesudah).rename('dATBI');

// Klasifikasi Tingkat Kebakaran Hutan
var areaKebakaran = dATBI
  .where(dATBI.lt(0.20),  0)
  .where(dATBI.gte(0.20).and(dATBI.lt(0.27)), 1)
  .where(dATBI.gte(0.27).and(dATBI.lt(0.66)), 2)
  .where(dATBI.gte(0.66), 3)
  .rename('Keparahan_Kebakaran');

// Visualisasi 
Map.centerObject(batas_wilayah, 13);

// RGB True Color Sebelum Kebakaran
Map.addLayer(sebelumKebakaran, 
  {bands:['B8','B4','B3'], min:0, max:0.3}, 
  'RGB Pre-fire');

// False Color Setelah Kebakaran
Map.addLayer(sesudahKebakaran, 
  {bands:['B8','B4','B3'], min:0, max:0.4}, 
  'False Color Post-fire (NIR-Red-Green)');

// Keparahan kebakaran
Map.addLayer(areaKebakaran.selfMask(),
  {min:1, max:3, palette:['yellow','orange','red']},
  'Keparahan (Low/Moderate/High)');

// Export 
Export.image.toDrive({
  image: dATBI,
  description: 'dATBI_LosAngeles_2025',
  folder: 'GEE_Kebakaran',
  scale: 10,
  region: batas_wilayah,
  fileFormat: 'GeoTIFF'
});

Export.image.toDrive({
  image: areaKebakaran,
  description: 'Keparahan_Kebakaran_LosAngeles_2025',
  folder: 'GEE_Kebakaran',
  scale: 10,
  region: batas_wilayah,
  fileFormat: 'GeoTIFF'
});