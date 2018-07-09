if(Package['clinical:autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
  console.log("Any protected health information (PHI) stored in this app should be audited."); 
  console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
  console.log("");  
  console.log("meteor remove clinical:autopublish");  
  console.log("");  
}
if(Package['autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
  console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
  console.log("");  
  console.log("meteor remove autopublish");  
  console.log("meteor add clinical:autopublish");  
  console.log("");  
}




// create the object using our BaseModel
PractitionerRole = BaseModel.extend();


//Assign a collection so the object knows how to perform CRUD operations
PractitionerRole.prototype._collection = PractitionerRoles;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.PractitionerRoles = new Mongo.Collection('HL7.Resources.PractitionerRoles');

if(typeof PractitionerRoles === 'undefined'){
  if(Package['clinical:autopublish']){
    PractitionerRoles = new Mongo.Collection('PractitionerRoles');
  } else {
    PractitionerRoles = new Mongo.Collection('PractitionerRoles', {connection: null});
  }
}


//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
PractitionerRoles._transform = function (document) {
  return new PractitionerRole(document);
};



PractitionerRoleSchema = new SimpleSchema([
  BaseSchema,
  DomainResourceSchema,
  {
    "resourceType" : {
      type: "Practitioner"
    },      
    "identifier" : {
      optional: true,
      type: [ IdentifierSchema ]
    }, 
    "active" : {
      optional: true,
      type: Boolean
    }, 
    "period" : {
      optional: true,
      type: PeriodSchema 
    }, 
    "practitioner" : {
      optional: true,
      type: ReferenceSchema
    }, 
    "organization" : {
      optional: true,
      type: ReferenceSchema 
    }, 
    "code" : {
      optional: true,
      type: [ CodeableConceptSchema ]
    }, 
    "specialty" : {
      optional: true,
      type: [ CodeableConceptSchema ]
    }, 
    "location" : {
      optional: true,
      type: [ ReferenceSchema ]
    }, 
    "healthcareService" : {
      optional: true,
      type: [ ReferenceSchema ]
    },
    "telecom" : {
      optional: true,
      type: [ ContactPointSchema ]
    }, 
    "availableTime.$.daysOfWeek" : {
      optional: true,
      type: [ String ]
    }, 
    "availableTime.$.allDay" : {
      optional: true,
      type: Boolean
    }, 
    "availableTime.$.availableStartTime" : {
      optional: true,
      type: Date
    }, 
    "availableTime.$.availableEndTime" : {
      optional: true,
      type: Date
    }, 
    "notAvailable.$.description" : {
      optional: true,
      type: String
    }, 
    "notAvailable.$.during" : {
      optional: true,
      type: PeriodSchema 
    }, 
    "availabilityExceptions" : {
      optional: true,
      type: String
    }, 
    "endpoint" : {
      optional: true,
      type: [ ReferenceSchema ]
    } 
  }
]);

PractitionerRoles.attachSchema(PractitionerRoleSchema);




//=================================================================


PractitionerRoles.fetchBundle = function (query, parameters, callback) {
  var practitionerRoleArray = PractitionerRoles.find(query, parameters, callback).map(function(practitionerRole){
    practitionerRole.id = practitionerRole._id;
    delete practitionerRole._document;
    return practitionerRole;
  });

  // console.log("practitionerRoleArray", practitionerRoleArray);

  var result = Bundle.generate(practitionerRoleArray);

  // console.log("result", result.entry[0]);

  return result;
};


/**
 * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
 * @memberOf PractitionerRoles
 * @name toMongo
 * @version 1.6.0
 * @returns { PractitionerRole }
 * @example
 * ```js
 *  let practitionerRoles = PractitionerRoles.toMongo('12345').fetch();
 * ```
 */

PractitionerRoles.toMongo = function (originalPractitionerRole) {
  var mongoRecord;
  process.env.TRACE && console.log('PractitionerRoles.toMongo', originalPractitionerRole);


  if (originalPractitionerRole.identifier) {
    originalPractitionerRole.identifier.forEach(function(identifier){
      if (identifier.period) {
        if (identifier.period.start) {
          var startArray = identifier.period.start.split('-');
          identifier.period.start = new Date(startArray[0], startArray[1] - 1, startArray[2]);
        }
        if (identifier.period.end) {
          var endArray = identifier.period.end.split('-');
          identifier.period.end = new Date(startArray[0], startArray[1] - 1, startArray[2]);
        }
      }
    });
  }

  if (originalPractitionerRole.birthDate) {
    var birthdateArray = originalPractitionerRole.birthDate.split('-');
    originalPractitionerRole.birthDate = new Date(birthdateArray[0], birthdateArray[1] - 1, birthdateArray[2]);
  }


  return originalPractitionerRole;
};


/**
 * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
 * @memberOf PractitionerRoles
 * @name prepForUpdate
 * @version 1.6.0
 * @returns { Object }
 * @example
 * ```js
 *  let practitionerRoles = PractitionerRoles.findMrn('12345').fetch();
 * ```
 */

PractitionerRoles.prepForUpdate = function (practitionerRole) {

  if (practitionerRole.name && practitionerRole.name[0]) {
    //console.log("practitionerRole.name", practitionerRole.name);

    practitionerRole.name.forEach(function(name){
      name.resourceType = "HumanName";
    });
  }

  if (practitionerRole.telecom && practitionerRole.telecom[0]) {
    //console.log("practitionerRole.telecom", practitionerRole.telecom);
    practitionerRole.telecom.forEach(function(telecom){
      telecom.resourceType = "ContactPoint";
    });
  }

  if (practitionerRole.address && practitionerRole.address[0]) {
    //console.log("practitionerRole.address", practitionerRole.address);
    practitionerRole.address.forEach(function(address){
      address.resourceType = "Address";
    });
  }

  if (practitionerRole.contact && practitionerRole.contact[0]) {
    //console.log("practitionerRole.contact", practitionerRole.contact);

    practitionerRole.contact.forEach(function(contact){
      if (contact.name) {
        contact.name.resourceType = "HumanName";
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          telecom.resourceType = "ContactPoint";
        });
      }

    });
  }

  return practitionerRole;
};


/**
 * @summary Scrubbing the practitionerRole; make sure it conforms to v1.6.0
 * @memberOf PractitionerRoles
 * @name scrub
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let practitionerRoles = PractitionerRoles.findMrn('12345').fetch();
 * ```
 */

PractitionerRoles.prepForFhirTransfer = function (practitionerRole) {
  //console.log("PractitionerRoles.prepForBundle()");


  // FHIR has complicated and unusual rules about dates in order
  // to support situations where a family member might report on a practitionerRole's
  // date of birth, but not know the year of birth; and the other way around
  if (practitionerRole.birthDate) {
    practitionerRole.birthDate = moment(practitionerRole.birthDate).format("YYYY-MM-DD");
  }


  if (practitionerRole.name && practitionerRole.name[0]) {
    //console.log("practitionerRole.name", practitionerRole.name);

    practitionerRole.name.forEach(function(name){
      delete name.resourceType;
    });
  }

  if (practitionerRole.telecom && practitionerRole.telecom[0]) {
    //console.log("practitionerRole.telecom", practitionerRole.telecom);
    practitionerRole.telecom.forEach(function(telecom){
      delete telecom.resourceType;
    });
  }

  if (practitionerRole.address && practitionerRole.address[0]) {
    //console.log("practitionerRole.address", practitionerRole.address);
    practitionerRole.address.forEach(function(address){
      delete address.resourceType;
    });
  }

  if (practitionerRole.contact && practitionerRole.contact[0]) {
    //console.log("practitionerRole.contact", practitionerRole.contact);

    practitionerRole.contact.forEach(function(contact){

      console.log("contact", contact);


      if (contact.name && contact.name.resourceType) {
        //console.log("practitionerRole.contact.name", contact.name);
        delete contact.name.resourceType;
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }

    });
  }

  //console.log("PractitionerRoles.prepForBundle()", practitionerRole);

  return practitionerRole;
};
