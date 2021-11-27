getUTMZone <- function (longitude){
  return( (floor((longitude + 180)/6) %% 60) + 1)
}


epsgCodeFromUTMzone <- function(utmZone){
  if(utmZone < 10){
    x <- toString(utmZone)
    string = paste("0",x,sep = "")
    
  }else{
    string = toString(utmZone)
  }
  return(paste("EPSG:326",string, sep=""))
}


epsgCodeFromUTMzone(30)
