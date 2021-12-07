calculateAOA <- function(data) {

data = 2 * data

rm(list=ls())
#major required packages:
needs(raster)
needs(caret)
needs(mapview)
needs(sf)
#needs(devtools)
#install_github("HannaMeyer/CAST")
needs(CAST)
#additional required packages:
needs(tmap)
needs(latticeExtra)
needs(doParallel)
needs(parallel)
needs(Orcs)

sen_ms <- stack("public/data/Sen_Muenster.grd")
#print(sen_ms)

#plot(sen_ms)

trainSites <- read_sf("public/data/trainingsites_muenster.gpkg")
#print(trainSites)

viewRGB(sen_ms, r = 3, g = 2, b = 1, map.types = "Esri.WorldImagery")+
  mapview(trainSites)

extr <- extract(sen_ms, trainSites, df=TRUE)
extr <- merge(extr, trainSites, by.x="ID", by.y="PolygonID")
head(extr)

set.seed(100)
trainids <- createDataPartition(extr$ID,list=FALSE,p=0.05)
trainDat <- extr[trainids,]

predictors <- names(sen_ms)
response <- "Label"

indices <- CreateSpacetimeFolds(trainDat,spacevar = "ID",k=3,class="Label")
ctrl <- trainControl(method="cv", 
                     index = indices$index,
                     savePredictions = TRUE)

# train the model
set.seed(100)
model <- ffs(trainDat[,predictors],
               trainDat[,response],
               method="rf",
               metric="Kappa",
               trControl=ctrl,
               importance=TRUE,
               ntree=75)

# get all cross-validated predictions:
cvPredictions <- model$pred[model$pred$mtry==model$bestTune$mtry,]
# calculate cross table:
table(cvPredictions$pred,cvPredictions$obs)

prediction <- predict(sen_ms,model)
cols <- c("sandybrown", "green", "darkred", "blue", "forestgreen", "lightgreen", "red")

tm_shape(deratify(prediction)) +
  tm_raster(palette = cols,title = "LUC")+
  tm_scale_bar(bg.color="white",bg.alpha=0.75)+
  tm_layout(legend.bg.color = "white",
            legend.bg.alpha = 0.75)

cl <- makeCluster(4)
registerDoParallel(cl)
AOA <- aoa(sen_ms,model,cl=cl)

print(typeof(AOA))

writeRaster(AOA, "./public/stack/AOA_MS.tif", overwrite=TRUE)

return('done')
}