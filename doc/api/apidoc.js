const fileNotFoundError = {
  description: "The model was not found",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "error",
            description: "The status of the request"
          },
          message: {
            type: "string",
            example: "Model not found",
            description: "The message of the request"
          }
        }
      }
    }
  }
};

const getFile200 = {
  description: "The file which was uploaded",
  content: {
    "application/octet-stream": {
      schema: {
        type: "bytes"
      }
    }
  }

};
const geojsonSchema = {
  schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        example: "FeatureCollection",
      },
      features: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              example: "Feature",
            },
            geometry: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  example: "Point",
                },
                coordinates: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                  example: [0, 0],
                }
              }
            }
          }
        }
      }
    }

  }
};
const apiDocumentation = {
    openapi: "3.0.1",
    info: {
      version: "1.3.0",
      title: "Documentation for the intern API",
      description: "This is the documentation for the intern API. The API i not working independently, but is used by the frontend to get data from the API.",
      termsOfService: "https://google.com",
      contact: {
        name: "Jakob Danel",
        email: "jdanel@uni.com"
      },
      license: {
        name: "GPL-3.0-or-later",
        url: "https://www.gnu.org/licenses/"
      }
    },
    servers: [{
        url: "http://localhost:8781/",
        description: "Local Server"
      },
      {
        url: "http://35.80.3.64:8781/",
        description: "Production Server"
      }
    ],
    tags: [],
    paths: {
      "/start": {
        post: {
          tags: ["start"],
          summary: "The main route. Start the processing of the input data.",
          description: "This route is used to start the processing of the input data. It will calculate the Sentinel images for AOI and training data (if necessary) and apply the model to the data. Then it will save all the results into files. If all was successful, the files are available with the file download routes.",
          operationId: "start",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    whereareyoufrom: {
                      type: "string",
                      required: true,
                      example: 'map'
                    },
                    topleftlat: {
                      type: "number",
                      required: true,
                      example: 51.93
                    },
                    topleftlng: {
                      type: "number",
                      required: true,
                      example: 7.61
                    },
                    bottomleftlat: {
                      type: "number",
                      required: true,
                      example: 51.94
                    },
                    bottomleftlng: {
                      type: "number",
                      required: true,
                      example: 7.62
                    },
                    bottomrightlat: {
                      type: "number",
                      required: true,
                      example: 51.95
                    },
                    bottomrightlng: {
                      type: "number",
                      required: true,
                      example: 7.63
                    },
                    toprightlat: {
                      type: "number",
                      required: true,
                      example: 51.92
                    },
                    toprightlng: {
                      type: "number",
                      required: true,
                      example: 7.64
                    },
                    option: {
                      type: "string",
                      required: true,
                      example: 'data'
                    },
                    algorithm: {
                      type: "string",
                      example: 'rf'
                    },
                    startDate: {
                      type: "string",
                      required: true,
                      example: '2019-01-01T22:00:00.000Z'
                    },
                    endDate: {
                      type: "string",
                      required: true,
                      example: '2019-01-01T23:00:00.000Z'
                    },
                    filename: {
                      type: "string",
                      required: true,
                      example: 'trainingsdaten_koeln_25832.gpkg',
                    },
                    resolution: {
                      type: "string",
                      required: true,
                      example: '100'
                    },
                    channels: {
                      type: "array",
                      required: true,
                      items: {
                        type: "string",
                        example: 'B02'
                      }
                    },
                    coverage: {
                      type: "number",
                      required: true,
                      example: 20
                    },
                    mtry: {
                      type: "number",
                      example: 2
                    },
                    sigma: {
                      type: "number",
                      example: 3
                    },
                    cost: {
                      type: "number",
                      example: 1
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "The processing was successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      stac: {
                        type: "object",
                        properties: {
                          aoi: {
                            type: "object",
                            properties: {
                              status: {
                                type: "string",
                                example: "ok",
                              },
                              data: {
                                type: "string",
                                example: "AOI was successfully created"
                              }
                          }
                        },
                        trainingData: {
                          properties: {
                            status: {
                              type: "string",
                              example: "ok",
                            },
                            data: {
                              type: "string",
                              example: "Training data was successfully created"
                            }
                        }
                        },
                        status: {
                          type: "string",
                          example: "ok",
                        }
                      }
                    },
                    aoa:{
                      type: "object",
                      properties: {
                        message: {
                          type: "object",
                          properties: {
                            model: {
                              type: "string",
                              example: "Model was successfully created"
                            },
                            classifyAndAOA: {
                              type: "string",
                              example: "Classification and AOI was successfully created"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "402": {
            description: "For the input date period and cloud coverage where no items found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stac: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          example: "error",
                        },
                        aoi:{
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              example: "error",
                            },
                            error: {
                              type: "string",
                              example: "AOI: No stac citems found for the input date period and cloud coverage"
                            },
                            errorDetails: {
                              type: "number",
                              example: 1
                            }
                          }
                        },
                        trainingData:{
                          type: "object",
                          properties: {
                            status: {
                              type: "string",
                              example: "error",
                            },
                            error: {
                              type: "string",
                              example: "Training Data: No stac citems found for the input date period and cloud coverage"
                            },
                            errorDetails: {
                              type: "number",
                              example: 1
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }	
        }
      }
    },
    '/file/{name}': {
      get: {
        tags: ["file download"],
        summary: "Get the uploaded file from the server",
        description: "Returns the uploaded file",
        operationId: "getFile",
        parameters: [{
          name: "name",
          in: "path",
          description: "The name of the file",
          example: "trainingData_muenster.geojson",
          required: true,
          schema: {
            type: "string"
          }
        }],
        responses: {
          "200": {
            description: "The training data",
            content: {
              "application/geo+json": geojsonSchema,
              "application/octet-stream": {
                schema: {
                  type: "bytes"
                }
              }
            }
          },
          "404": fileNotFoundError,
        },
      },
    },
    '/model/{name}': {
      get: {
        tags: ["file download"],
        summary: "Get the model from the server",
        description: "Returns the model",
        operationId: "getModel",
        parameters: [{
          name: "name",
          in: "path",
          description: "The name of the model",
          example: "model.RDS",
          required: true,
          schema: {
            type: "string"
          }
        }],
        responses: {
          "200": getFile200,
          "404": fileNotFoundError,
        }
      }
    },
    "/predictionaoa/{name}": {
      get: {
        tags: ["file download"],
        summary: "Get the prediction/aoa from the server",
        description: "Returns the prediction/aoa",
        operationId: "getPredictionAoa",
        parameters: [{
          name: "name",
          in: "path",
          description: "The name of the prediction/aoa",
          example: "prediction.tif",
          required: true,
          schema: {
            type: "string",
          }
        }],
        responses: {
          "200": getFile200,
          "404": fileNotFoundError,
        }
      }
    },
    "/processedsentinelimages/{name}": {
      get: {
        tags: ["file download"],
        summary: "Get the processed sentinel images from the server",
        description: "Returns the processed sentinel images",
        operationId: "getProcessedSentinelImages",
        parameters: [{
          name: "name",
          in: "path",
          description: "The name of the processed sentinel images",
          example: "aoi.tif",
          required: true,
          schema: {
            type: "string",
          },

        }],
        responses: {
          "200": getFile200,
          "404": fileNotFoundError,
        }
      }
    },
    "/furthertrainareas/{name}": {
      get: {
        tags: ["file download"],
        summary: "Get the further train areas from the server",
        description: "Returns the further train areas",
        operationId: "getFurtherTrainAreas",
        parameters: [{
          name: "name",
          in: "path",
          description: "The name of the further train areas",
          example: "furtherTrainAreas.geojson",
          required: true,
          schema: {
            type: "string",
          },
        }],
        responses: {
          "200": {
            description: "The further train areas",
            content: {
              "application/geo+json": geojsonSchema,
            }

          },
          "404": fileNotFoundError,
        }
      }
    },
    "/trainingData/{name}": {
      get: {
        tags: ["file download"],
        summary: "Get the training data from the server",
        description: "Returns the training data",
        operationId: "getTrainingData",
        parameters: [{
          name: "name",
          in: "path",
          description: "The name of the training data",
          example: "traingsdaten_koeln.geojson",
          required: true,
          schema: {
            type: "string",
          }
        }],
        responses: {
          "200": {
            description: "The training data",
            content: {
              "application/geo+json": geojsonSchema,
              "application/octet-stream": {
                schema: {
                  type: "bytes"
                }
              }
            }
          },
          "404": fileNotFoundError,
        }
      }
    },
    "/marker": {
      get: {
        tags: ["file download"],
        summary: "Get the marker from the server",
        description: "Returns the marker",
        operationId: "getMarker",
        responses: {
          "304": {
            description: "The marker",
            content: {
              "image/png": {
                schema: {
                  type: "bytes",
                }
              },

            }
          },
          "200": {
            description: "The marker",
            content: {
              "image/png": {
                schema: {
                  type: "bytes",
                }
              },

            }
          }
        }
      }
    },
    "/upload": {
      post: {
        tags: ["file upload"],
        summary: "Upload a file",
        description: "Upload a file to the server",
        operationId: "uploadFile",
        requestBody: {
          content: {
            "application/octet-stream": {
              schema: {
                type: "bytes"
              },
              required: true,

            }
          }
        },
        responses: {
          "200": {
            description: "The post request was successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "The training data were invalid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status:{
                      type: "string",
                      example: "error",
                    },
                    message: {
                      type: "string",
                      example: "The training data were invalid"
                    },
                    error: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          example: "error",
                        },
                        error:{
                          type: "string",
                          example: "Training Data: A 'Label' can not be empty"
                        },
                        code: {
                          type: "number",
                          example: 1
                        }

                      }
                    }
                  }

                }
              }
            }
          },
        }
      }
    },
    "/deleteFiles": {
      post: {
        tags: ["file delete"],
        summary: "Delete files from the public/uploads folder. Ignore the .gitignore file and the file specified in req.body.file",
        description: "Delete files from the public/uploads folder. Ignore the .gitignore file and the file specified in req.body.file",
        operationId: "deleteFiles",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    example: "traingsdaten_koeln_4326.gpkg"
                  }
                },
                required: ["file"],

              }
            }
          }
        },
        responses: {
          "200": {
            description: "The files were deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      example: "The files were deleted successfully"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "An error occured",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      example: "Error while deleting files"
                    },
                    error: {
                      type: "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/getGeoJson': {
      post: {
        tags: ["convert file"],
        summary: "Convert a geopackage file from the public/uploads folder to a geojson file",
        description: "Convert a geopackage file from the public/uploads folder to a geojson file",
        operationId: "getGeoJson",
        requestBody: {
          content: {
            "text/plain": {
              schema: {
                type: "string",
                example: "traingsdaten_koeln_4326.gpkg",

              },
              required: true,
            }
          }
        },
        responses: {
          "200": {
            description: "The file was converted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "string",
                    example: "Successfully converted the training data from GeoPackage to GeoJSON"
                  }
                }
              }
            }
          },
          "500": {
            description: "An error occured",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          }
        }
      }
    },
    "/markdown": {
      get: {
        tags: ["markdown"],
        summary: "Get the markdown file from the main branch of the frontend repository",
        description: "Returns the markdown file",
        operationId: "getMarkdown",
        responses: {
          "200": {
            description: "The markdown file",
            content: {
              "text/markdown": {
                schema: {
                  type: "string",
                  required: true,
                }
              }
            } 
          },
          "304": {
            description: "The markdown file",
            content: {
              "text/markdown": {
                schema: {
                  type: "string",
                  required: true,
                }
              }
            }
          },
          "404": fileNotFoundError, 
        } 
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {}
  }
};

module.exports = {
  apiDocumentation
};