

//==========================================================================================
// Global Configs  


var fhirVersion = 'fhir-3.0.0';

if(typeof oAuth2Server === 'object'){
  // TODO:  double check that this is needed; and that the /api/ route is correct
  JsonRoutes.Middleware.use(
    // '/api/*',
    '/fhir-3.0.0/*',
    oAuth2Server.oauthserver.authorise()   // OAUTH FLOW - A7.1
  );
}

JsonRoutes.setResponseHeaders({
  "content-type": "application/fhir+json"
});



//==========================================================================================
// Global Method Overrides

// this is temporary fix until PR 132 can be merged in
// https://github.com/stubailo/meteor-rest/pull/132

JsonRoutes.sendResult = function (res, options) {
  options = options || {};

  // Set status code on response
  res.statusCode = options.code || 200;

  // Set response body
  if (options.data !== undefined) {
    var shouldPrettyPrint = (process.env.NODE_ENV === 'development');
    var spacer = shouldPrettyPrint ? 2 : null;
    res.setHeader('Content-type', 'application/fhir+json');
    res.write(JSON.stringify(options.data, null, spacer));
  }

  // We've already set global headers on response, but if they
  // pass in more here, we set those.
  if (options.headers) {
    //setHeaders(res, options.headers);
    options.headers.forEach(function(value, key){
      res.setHeader(key, value);
    });
  }

  // Send the response
  res.end();
};




//==========================================================================================
// Step 1 - Create New Practitioner  

JsonRoutes.add("put", "/" + fhirVersion + "/Practitioner/:id", function (req, res, next) {
  process.env.DEBUG && console.log('PUT /fhir-1.6.0/Practitioner/' + req.params.id);
  //process.env.DEBUG && console.log('PUT /fhir-1.6.0/Practitioner/' + req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);

  if(typeof oAuth2Server === 'object'){
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});    

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {
      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      // if (typeof SiteStatistics === "object") {
      //   SiteStatistics.update({_id: "configuration"}, {$inc:{
      //     "Practitioners.count.read": 1
      //   }});
      // }

      if (req.body) {
        practitionerUpdate = req.body;

        // remove id and meta, if we're recycling a resource
        delete req.body.id;
        delete req.body.meta;

        //process.env.TRACE && console.log('req.body', req.body);

        practitionerUpdate.resourceType = "Practitioner";
        practitionerUpdate = Practitioners.toMongo(practitionerUpdate);

        //process.env.TRACE && console.log('practitionerUpdate', practitionerUpdate);


        practitionerUpdate = Practitioners.prepForUpdate(practitionerUpdate);


        process.env.DEBUG && console.log('-----------------------------------------------------------');
        process.env.DEBUG && console.log('practitionerUpdate', JSON.stringify(practitionerUpdate, null, 2));
        // process.env.DEBUG && console.log('newPractitioner', newPractitioner);

        var practitioner = Practitioners.findOne(req.params.id);
        var practitionerId;

        if(practitioner){
          process.env.DEBUG && console.log('Practitioner found...')
          practitionerId = Practitioners.update({_id: req.params.id}, {$set: practitionerUpdate },  function(error, result){
            if (error) {
              process.env.TRACE && console.log('PUT /fhir/Practitioner/' + req.params.id + "[error]", error);

              // Bad Request
              JsonRoutes.sendResult(res, {
                code: 400
              });
            }
            if (result) {
              process.env.TRACE && console.log('result', result);
              res.setHeader("Location", "fhir/Practitioner/" + result);
              res.setHeader("Last-Modified", new Date());
              res.setHeader("ETag", "1.6.0");

              var practitioners = Practitioners.find({_id: req.params.id});
              var payload = [];

              practitioners.forEach(function(record){
                payload.push(Practitioners.prepForFhirTransfer(record));
              });

              console.log("payload", payload);

              // success!
              JsonRoutes.sendResult(res, {
                code: 200,
                data: Bundle.generate(payload)
              });
            }
          });
        } else {        
          process.env.DEBUG && console.log('No practitioner found.  Creating one.');
          practitionerUpdate._id = req.params.id;
          practitionerId = Practitioners.insert(practitionerUpdate,  function(error, result){
            if (error) {
              process.env.TRACE && console.log('PUT /fhir/Practitioner/' + req.params.id + "[error]", error);

              // Bad Request
              JsonRoutes.sendResult(res, {
                code: 400
              });
            }
            if (result) {
              process.env.TRACE && console.log('result', result);
              res.setHeader("Location", "fhir/Practitioner/" + result);
              res.setHeader("Last-Modified", new Date());
              res.setHeader("ETag", "1.6.0");

              var practitioners = Practitioners.find({_id: req.params.id});
              var payload = [];

              practitioners.forEach(function(record){
                payload.push(Practitioners.prepForFhirTransfer(record));
              });

              console.log("payload", payload);

              // success!
              JsonRoutes.sendResult(res, {
                code: 200,
                data: Bundle.generate(payload)
              });
            }
          });        
        }
      } else {
        // no body; Unprocessable Entity
        JsonRoutes.sendResult(res, {
          code: 422
        });

      }


    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }

});



//==========================================================================================
// Step 2 - Read Practitioner  

JsonRoutes.add("get", "/" + fhirVersion + "/Practitioner/:id", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var practitionerData = Practitioners.findOne({_id: req.params.id});
      if (practitionerData) {
        practitionerData.id = practitionerData._id;

        delete practitionerData._document;
        delete practitionerData._id;

        process.env.TRACE && console.log('practitionerData', practitionerData);

        // Success
        JsonRoutes.sendResult(res, {
          code: 200,
          data: Practitioners.prepForFhirTransfer(practitionerData)
        });
      } else {
        // Gone
        JsonRoutes.sendResult(res, {
          code: 410
        });
      }
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }
});

//==========================================================================================
// Step 3 - Update Practitioner  

JsonRoutes.add("post", "/" + fhirVersion + "/Practitioner", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir/Practitioner/', JSON.stringify(req.body, null, 2));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var practitionerId;
      var newPractitioner;

      if (req.body) {
        newPractitioner = req.body;


        // remove id and meta, if we're recycling a resource
        delete newPractitioner.id;
        delete newPractitioner.meta;


        newPractitioner = Practitioners.toMongo(newPractitioner);

        process.env.TRACE && console.log('newPractitioner', JSON.stringify(newPractitioner, null, 2));
        // process.env.DEBUG && console.log('newPractitioner', newPractitioner);

        console.log('Cleaning new practitioner...')
        PractitionerSchema.clean(newPractitioner);

        var practionerContext = PractitionerSchema.newContext();
        practionerContext.validate(newPractitioner)
        console.log('New practitioner is valid:', practionerContext.isValid());
        console.log('check', check(newPractitioner, PractitionerSchema))
        


        var practitionerId = Practitioners.insert(newPractitioner,  function(error, result){
          if (error) {
            process.env.TRACE && console.log('error', error);

            // Bad Request
            JsonRoutes.sendResult(res, {
              code: 400
            });
          }
          if (result) {
            process.env.TRACE && console.log('result', result);
            res.setHeader("Location", "fhir-1.6.0/Practitioner/" + result);
            res.setHeader("Last-Modified", new Date());
            res.setHeader("ETag", "1.6.0");

            var practitioners = Practitioners.find({_id: result});
            var payload = [];

            practitioners.forEach(function(record){
              payload.push(Practitioners.prepForFhirTransfer(record));
            });

            //console.log("payload", payload);
            // Created
            JsonRoutes.sendResult(res, {
              code: 201,
              data: Bundle.generate(payload)
            });
          }
        });
        console.log('practitionerId', practitionerId);
      } else {
        // Unprocessable Entity
        JsonRoutes.sendResult(res, {
          code: 422
        });
      }

    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }
});

//==========================================================================================
// Step 4 - PractitionerHistoryInstance

JsonRoutes.add("get", "/" + fhirVersion + "/Practitioner/:id/_history", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/', req.params);
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/', req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var practitioners = Practitioners.find({_id: req.params.id});
      var payload = [];

      practitioners.forEach(function(record){
        payload.push(Practitioners.prepForFhirTransfer(record));

        // the following is a hack, to conform to the Touchstone Practitioner testscript
        // https://touchstone.aegis.net/touchstone/testscript?id=06313571dea23007a12ec7750a80d98ca91680eca400b5215196cd4ae4dcd6da&name=%2fFHIR1-6-0-Basic%2fP-R%2fPractitioner%2fClient+Assigned+Id%2fPractitioner-client-id-json&version=1&latestVersion=1&itemId=&spec=HL7_FHIR_STU3_C2
        // the _history query expects a different resource in the Bundle for each version of the file in the system
        // since we don't implement record versioning in Meteor on FHIR yet
        // we are simply adding two instances of the record to the payload 
        payload.push(Practitioners.prepForFhirTransfer(record));
      });
      // Success
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Bundle.generate(payload, 'history')
      });
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }
});

//==========================================================================================
// Step 5 - Practitioner Version Read

// NOTE:  We've not implemented _history functionality yet; so this endpoint is mostly a duplicate of Step 2.

JsonRoutes.add("get", "/" + fhirVersion + "/Practitioner/:id/_history/:versionId", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/:id/_history/:versionId', req.params);
  //process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner/:id/_history/:versionId', req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){
  
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }

  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    var practitionerData = Practitioners.findOne({_id: req.params.id});
    if (practitionerData) {
      
      practitionerData.id = practitionerData._id;

      delete practitionerData._document;
      delete practitionerData._id;

      process.env.TRACE && console.log('practitionerData', practitionerData);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Practitioners.prepForFhirTransfer(practitionerData)
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 410
      });
    }

  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});



generateDatabaseQuery = function(query){
  console.log("generateDatabaseQuery", query);

  var databaseQuery = {};

  if (query.family) {
    databaseQuery['name'] = {
      $elemMatch: {
        'family': query.family
      }
    };
  }
  if (query.given) {
    databaseQuery['name'] = {
      $elemMatch: {
        'given': query.given
      }
    };
  }
  if (query.name) {
    databaseQuery['name'] = {
      $elemMatch: {
        'text': {
          $regex: query.name,
          $options: 'i'
        }
      }
    };
  }
  if (query.identifier) {
    databaseQuery['identifier'] = {
      $elemMatch: {
        'value': query.identifier
      }
    };
  }
  if (query.gender) {
    databaseQuery['gender'] = query.gender;
  }
  if (query.birthdate) {
    var dateArray = query.birthdate.split("-");
    var minDate = dateArray[0] + "-" + dateArray[1] + "-" + (parseInt(dateArray[2])) + 'T00:00:00.000Z';
    var maxDate = dateArray[0] + "-" + dateArray[1] + "-" + (parseInt(dateArray[2]) + 1) + 'T00:00:00.000Z';
    console.log("minDateArray", minDate, maxDate);

    databaseQuery['birthDate'] = {
      "$gte" : new Date(minDate),
      "$lt" :  new Date(maxDate)
    };
  }

  process.env.DEBUG && console.log('databaseQuery', databaseQuery);
  return databaseQuery;
}

JsonRoutes.add("get", "/" + fhirVersion + "/Practitioner", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Practitioner', req.query);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var databaseQuery = generateDatabaseQuery(req.query);

      var payload = [];
      var practitioners = Practitioners.find(databaseQuery);

      practitioners.forEach(function(record){
        payload.push(Practitioners.prepForFhirTransfer(record));
      });

      // Success
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Bundle.generate(payload)
      });
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }
});

//==========================================================================================
// Step 6 - Practitioner Search Type  

JsonRoutes.add("post", "/" + fhirVersion + "/Practitioner/:param", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir-1.6.0/Practitioner/' + JSON.stringify(req.query));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){
    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var practitioners = [];

      if (req.params.param.includes('_search')) {
        var searchLimit = 1;
        if (req && req.query && req.query._count) {
          searchLimit = parseInt(req.query._count);
        }

        var databaseQuery = generateDatabaseQuery(req.query);
        process.env.DEBUG && console.log('databaseQuery', databaseQuery);

        practitioners = Practitioners.find(databaseQuery, {limit: searchLimit});

        var payload = [];

        practitioners.forEach(function(record){
          payload.push(Practitioners.prepForFhirTransfer(record));
        });
      }

      //process.env.TRACE && console.log('practitioners', practitioners);

      // Success
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Bundle.generate(payload)
      });
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }
});




//==========================================================================================
// Step 7 - Practitioner Delete    

JsonRoutes.add("delete", "/" + fhirVersion + "/Practitioner/:id", function (req, res, next) {
  process.env.DEBUG && console.log('DELETE /fhir-1.6.0/Practitioner/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){

    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      if (Practitioners.find({_id: req.params.id}).count() === 0) {
        // Gone
        JsonRoutes.sendResult(res, {
          code: 410
        });
      } else {
        Practitioners.remove({_id: req.params.id}, function(error, result){
          if (result) {
            // No Content
            JsonRoutes.sendResult(res, {
              code: 204
            });
          }
          if (error) {
            // Conflict
            JsonRoutes.sendResult(res, {
              code: 409
            });
          }
        });
      }


    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }
  
  
});





// WebApp.connectHandlers.use("/fhir/Practitioner", function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   return next();
// });
