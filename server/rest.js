

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
// Step 1 - Create New PractitionerRole  

JsonRoutes.add("put", "/" + fhirVersion + "/PractitionerRole/:id", function (req, res, next) {
  process.env.DEBUG && console.log('PUT /fhir-3.0.0/PractitionerRole/' + req.params.id);
  //process.env.DEBUG && console.log('PUT /fhir-3.0.0/PractitionerRole/' + req.query._count);

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
      //     "PractitionerRoles.count.read": 1
      //   }});
      // }

      if (req.body) {
        practitionerRoleUpdate = req.body;

        // remove id and meta, if we're recycling a resource
        delete req.body.id;
        delete req.body.meta;

        //process.env.TRACE && console.log('req.body', req.body);

        practitionerRoleUpdate.resourceType = "PractitionerRole";
        practitionerRoleUpdate = PractitionerRoles.toMongo(practitionerRoleUpdate);

        //process.env.TRACE && console.log('practitionerRoleUpdate', practitionerRoleUpdate);


        practitionerRoleUpdate = PractitionerRoles.prepForUpdate(practitionerRoleUpdate);


        process.env.DEBUG && console.log('-----------------------------------------------------------');
        process.env.DEBUG && console.log('practitionerRoleUpdate', JSON.stringify(practitionerRoleUpdate, null, 2));
        // process.env.DEBUG && console.log('newPractitionerRole', newPractitionerRole);

        var practitionerRole = PractitionerRoles.findOne(req.params.id);
        var practitionerRoleId;

        if(practitionerRole){
          process.env.DEBUG && console.log('PractitionerRole found...')
          practitionerRoleId = PractitionerRoles.update({_id: req.params.id}, {$set: practitionerRoleUpdate },  function(error, result){
            if (error) {
              process.env.TRACE && console.log('PUT /fhir/PractitionerRole/' + req.params.id + "[error]", error);

              // Bad Request
              JsonRoutes.sendResult(res, {
                code: 400
              });
            }
            if (result) {
              process.env.TRACE && console.log('result', result);
              res.setHeader("Location", "fhir/PractitionerRole/" + result);
              res.setHeader("Last-Modified", new Date());
              res.setHeader("ETag", "3.0.0");

              var practitionerRoles = PractitionerRoles.find({_id: req.params.id});
              var payload = [];

              practitionerRoles.forEach(function(record){
                payload.push(PractitionerRoles.prepForFhirTransfer(record));
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
          process.env.DEBUG && console.log('No practitionerRole found.  Creating one.');
          practitionerRoleUpdate._id = req.params.id;
          practitionerRoleId = PractitionerRoles.insert(practitionerRoleUpdate,  function(error, result){
            if (error) {
              process.env.TRACE && console.log('PUT /fhir/PractitionerRole/' + req.params.id + "[error]", error);

              // Bad Request
              JsonRoutes.sendResult(res, {
                code: 400
              });
            }
            if (result) {
              process.env.TRACE && console.log('result', result);
              res.setHeader("Location", "fhir/PractitionerRole/" + result);
              res.setHeader("Last-Modified", new Date());
              res.setHeader("ETag", "3.0.0");

              var practitionerRoles = PractitionerRoles.find({_id: req.params.id});
              var payload = [];

              practitionerRoles.forEach(function(record){
                payload.push(PractitionerRoles.prepForFhirTransfer(record));
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
// Step 2 - Read PractitionerRole  

JsonRoutes.add("get", "/" + fhirVersion + "/PractitionerRole/:id", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-3.0.0/PractitionerRole/' + req.params.id);

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

      var practitionerRoleData = PractitionerRoles.findOne({_id: req.params.id});
      if (practitionerRoleData) {
        practitionerRoleData.id = practitionerRoleData._id;

        delete practitionerRoleData._document;
        delete practitionerRoleData._id;

        process.env.TRACE && console.log('practitionerRoleData', practitionerRoleData);

        // Success
        JsonRoutes.sendResult(res, {
          code: 200,
          data: PractitionerRoles.prepForFhirTransfer(practitionerRoleData)
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
// Step 3 - Update PractitionerRole  

JsonRoutes.add("post", "/" + fhirVersion + "/PractitionerRole", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir/PractitionerRole/', JSON.stringify(req.body, null, 2));

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

      var practitionerRoleId;
      var newPractitionerRole;

      if (req.body) {
        newPractitionerRole = req.body;


        // remove id and meta, if we're recycling a resource
        delete newPractitionerRole.id;
        delete newPractitionerRole.meta;


        newPractitionerRole = PractitionerRoles.toMongo(newPractitionerRole);

        process.env.TRACE && console.log('newPractitionerRole', JSON.stringify(newPractitionerRole, null, 2));
        // process.env.DEBUG && console.log('newPractitionerRole', newPractitionerRole);

        console.log('Cleaning new practitionerRole...')
        PractitionerRoleSchema.clean(newPractitionerRole);

        var practionerContext = PractitionerRoleSchema.newContext();
        practionerContext.validate(newPractitionerRole)
        console.log('New practitionerRole is valid:', practionerContext.isValid());
        console.log('check', check(newPractitionerRole, PractitionerRoleSchema))
        


        var practitionerRoleId = PractitionerRoles.insert(newPractitionerRole,  function(error, result){
          if (error) {
            process.env.TRACE && console.log('error', error);

            // Bad Request
            JsonRoutes.sendResult(res, {
              code: 400
            });
          }
          if (result) {
            process.env.TRACE && console.log('result', result);
            res.setHeader("Location", "fhir-3.0.0/PractitionerRole/" + result);
            res.setHeader("Last-Modified", new Date());
            res.setHeader("ETag", "3.0.0");

            var practitionerRoles = PractitionerRoles.find({_id: result});
            var payload = [];

            practitionerRoles.forEach(function(record){
              payload.push(PractitionerRoles.prepForFhirTransfer(record));
            });

            //console.log("payload", payload);
            // Created
            JsonRoutes.sendResult(res, {
              code: 201,
              data: Bundle.generate(payload)
            });
          }
        });
        console.log('practitionerRoleId', practitionerRoleId);
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
// Step 4 - PractitionerRoleHistoryInstance

JsonRoutes.add("get", "/" + fhirVersion + "/PractitionerRole/:id/_history", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-3.0.0/PractitionerRole/', req.params);
  process.env.DEBUG && console.log('GET /fhir-3.0.0/PractitionerRole/', req.query._count);

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

      var practitionerRoles = PractitionerRoles.find({_id: req.params.id});
      var payload = [];

      practitionerRoles.forEach(function(record){
        payload.push(PractitionerRoles.prepForFhirTransfer(record));

        // the following is a hack, to conform to the Touchstone PractitionerRole testscript
        // https://touchstone.aegis.net/touchstone/testscript?id=06313571dea23007a12ec7750a80d98ca91680eca400b5215196cd4ae4dcd6da&name=%2fFHIR1-6-0-Basic%2fP-R%2fPractitionerRole%2fClient+Assigned+Id%2fPractitionerRole-client-id-json&version=1&latestVersion=1&itemId=&spec=HL7_FHIR_STU3_C2
        // the _history query expects a different resource in the Bundle for each version of the file in the system
        // since we don't implement record versioning in Meteor on FHIR yet
        // we are simply adding two instances of the record to the payload 
        payload.push(PractitionerRoles.prepForFhirTransfer(record));
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
// Step 5 - PractitionerRole Version Read

// NOTE:  We've not implemented _history functionality yet; so this endpoint is mostly a duplicate of Step 2.

JsonRoutes.add("get", "/" + fhirVersion + "/PractitionerRole/:id/_history/:versionId", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-3.0.0/PractitionerRole/:id/_history/:versionId', req.params);
  //process.env.DEBUG && console.log('GET /fhir-3.0.0/PractitionerRole/:id/_history/:versionId', req.query._count);

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

    var practitionerRoleData = PractitionerRoles.findOne({_id: req.params.id});
    if (practitionerRoleData) {
      
      practitionerRoleData.id = practitionerRoleData._id;

      delete practitionerRoleData._document;
      delete practitionerRoleData._id;

      process.env.TRACE && console.log('practitionerRoleData', practitionerRoleData);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: PractitionerRoles.prepForFhirTransfer(practitionerRoleData)
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





//==========================================================================================
// Step 6 - PractitionerRole Search Type  

generateDatabaseQuery = function(query){




  console.log("generateDatabaseQuery", query);

  var practitionerRoles = [];
  var databaseQuery = {};

  // GET http://meteor-on-fhir.meteorapp.com/fhir-3.0.0/PractitionerRole?practitioner.identifier=http://hl7.org/fhir/sid/us-npi|1265437362
  if (query['practitioner.identifier']) {
    var paramsArray = query['practitioner.identifier'].split('|');
    process.env.TRACE && console.log('paramsArray', paramsArray);

    //databaseQuery['practitioner.reference'] = query['practitioner.identifier'];
    databaseQuery['qualification.identifier.value'] = paramsArray[1];
  }

  // GET http://meteor-on-fhir.meteorapp.com/fhir-3.0.0/PractitionerRole?practitioner.name=MULA
  if (query['practitioner.name']) {
    databaseQuery['name'] = {
      $elemMatch: {
        'text': {
          $regex: query['practitioner.name'],
          $options: 'i'
        }
      }
    };
  }

  // GET http://meteor-on-fhir.meteorapp.com/fhir-3.0.0/PractitionerRole?practitioner.family=MULA&practitioner.given=GREGORY
  if (query['practitioner.family'] && query['practitioner.given']) {
    databaseQuery['name.family'] = query['practitioner.family'];
    databaseQuery['name.given'] = query['practitioner.given'];
  }

  // GET http://meteor-on-fhir.meteorapp.com/fhir-3.0.0/PractitionerRole?specialty=http://hl7.org/fhir/practitioner-specialty|cardio 
  if (query['specialty']) {
    var paramsArray = query['specialty'].split('|');
    process.env.TRACE && console.log('paramsArray', paramsArray);

    //databaseQuery['practitioner.reference'] = query['practitioner.identifier'];
    databaseQuery['specialty.coding.code'] = paramsArray[1];

    practitionerRoles = PractitionerRoles.find(databaseQuery).fetch();
  }


  process.env.DEBUG && console.log('databaseQuery', databaseQuery);

  var practitioner = Practitioners.findOne(databaseQuery);
  process.env.TRACE && console.log('practitioner', practitioner);

  if(practitioner){
    var searchString = practitioner.qualification[0].identifier[0].system + '|' + practitioner.qualification[0].identifier[0].value;
    practitionerRoles = PractitionerRoles.find({'practitioner.reference': searchString}).fetch();
    process.env.TRACE && console.log('practitionerRoles', practitionerRoles);
  }

  return practitionerRoles;

}

JsonRoutes.add("get", "/" + fhirVersion + "/PractitionerRole", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-3.0.0/PractitionerRole', req.query);

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

      var practitionerRoles = generateDatabaseQuery(req.query);

      var payload = [];
      //var practitionerRoles = PractitionerRoles.find(databaseQuery).fetch();

      process.env.DEBUG && console.log('practitionerRoles', practitionerRoles);

      practitionerRoles.forEach(function(record){
        payload.push(PractitionerRoles.prepForFhirTransfer(record));
      });

      process.env.TRACE && console.log('payload', payload);

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

JsonRoutes.add("post", "/" + fhirVersion + "/PractitionerRole/:param", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir-3.0.0/PractitionerRole/' + JSON.stringify(req.query));

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

      var practitionerRoles = [];

      if (req.params.param.includes('_search')) {
        var searchLimit = 1;
        if (req && req.query && req.query._count) {
          searchLimit = parseInt(req.query._count);
        }

        var databaseQuery = generateDatabaseQuery(req.query);
        process.env.DEBUG && console.log('databaseQuery', databaseQuery);

        practitionerRoles = PractitionerRoles.find(databaseQuery, {limit: searchLimit});

        var payload = [];

        practitionerRoles.forEach(function(record){
          payload.push(PractitionerRoles.prepForFhirTransfer(record));
        });
      }

      //process.env.TRACE && console.log('practitionerRoles', practitionerRoles);

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
// Step 7 - PractitionerRole Delete    

JsonRoutes.add("delete", "/" + fhirVersion + "/PractitionerRole/:id", function (req, res, next) {
  process.env.DEBUG && console.log('DELETE /fhir-3.0.0/PractitionerRole/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  if(typeof oAuth2Server === 'object'){

    var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      if (PractitionerRoles.find({_id: req.params.id}).count() === 0) {
        // Gone
        JsonRoutes.sendResult(res, {
          code: 410
        });
      } else {
        PractitionerRoles.remove({_id: req.params.id}, function(error, result){
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





// WebApp.connectHandlers.use("/fhir/PractitionerRole", function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   return next();
// });
