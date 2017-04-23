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
Practitioner = BaseModel.extend();


//Assign a collection so the object knows how to perform CRUD operations
Practitioner.prototype._collection = Practitioners;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.Practitioners = new Mongo.Collection('HL7.Resources.Practitioners');
Practitioners = new Mongo.Collection('Practitioners');

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Practitioners._transform = function (document) {
  return new Practitioner(document);
};


if (Meteor.isClient){
  Meteor.subscribe("Practitioners");
}

if (Meteor.isServer){
  Meteor.publish("Practitioners", function (argument){

    if (!query) {
      query = {};
    }

    var options = {
      sort: {}
    };

    options.sort["meta.lastUpdated"] = -1;

    if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.defaults && Meteor.settings.public.defaults.subscriptionLimit) {
      options.limit = Meteor.settings.public.defaults.subscriptionLimit;
    }

    process.env.DEBUG && console.log("Practitioners.publication", query, options);

    // user is logged in
    if (this.userId) {
      return Practitioners.find(query, options);
    } else {
      return [];
    }

  });
}



PractitionerSchema = new SimpleSchema([
  BaseSchema,
  DomainResourceSchema,
  {
  "resourceType" : {
    type: String,
    defaultValue: "Practitioner"
  },
  "identifier" : {
    optional: true,
    type: [ IdentifierSchema ]
  },
  "active" : {
    optional: true,
    type: Boolean
  },
  "name" : {
    optional: true,
    type:  [ HumanNameSchema ]
  },
  "telecom" : {
    optional: true,
    type: [ ContactPointSchema ]
  },
  "address" : {
    optional: true,
    type: [ AddressSchema ]
  },
  "gender" : {
    optional: true,
    type: String
  },
  "birthDate" : {
    optional: true,
    type: Date
  },
  "photo" : {
    optional: true,
    type: [ AttachmentSchema ]
  },
  "role.$.organization" : {
    optional: true,
    type: ReferenceSchema //(Organization)
  },
  "role.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "role.$.period" : {
    optional: true,
    type: PeriodSchema
  },
  "role.$.specialty" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  },
  "role.$.location" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (Location) ],

  "role.$.identifier" : {
    optional: true,
    type: [ IdentifierSchema ]
  }, // (Location) ],
  "role.$.location" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (Location) ],
  "role.$.healthcareService" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, //(HealthcareService) }]
  "role.$.endpoint" : {
    optional: true,
    type: [ ReferenceSchema ]
  }, // (Endpoint) ],


  "qualification.$.identifier" : {
    optional: true,
    type: [ IdentifierSchema ]
  },
  "qualification.$.code" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "qualification.$.period" : {
    optional: true,
    type: PeriodSchema
  },
  "qualification.$.issuer" : {
    optional: true,
    type: ReferenceSchema
  }, // Organization)
  "communication" : {
    optional: true,
    type: [ CodeableConceptSchema ]
  },
  "role" : {
    optional: true,
    blackbox: true,
    type: [Object]
  }
}]);
Practitioners.attachSchema(PractitionerSchema);



/**
 * @summary The displayed name of the practitioner.
 * @memberOf Practitioner
 * @name displayName
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

Practitioner.prototype.displayName = function () {
  if (this.name) {
    return this.name.text;
  }
};



/**
 * @summary The displayed Meteor.userId() of the practitioner.
 * @memberOf Practitioner
 * @name userId
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

Practitioner.prototype.userId = function () {
  var result = null;
  if (this.extension) {
    this.extension.forEach(function(extension){
      if (extension.url === "Meteor.userId()") {
        result = extension.valueString;
      }
    });
  }
  return result;
};



//=================================================================


Practitioners.fetchBundle = function (query, parameters, callback) {
  var practitionerArray = Practitioners.find(query, parameters, callback).map(function(practitioner){
    practitioner.id = practitioner._id;
    delete practitioner._document;
    return practitioner;
  });

  // console.log("practitionerArray", practitionerArray);

  var result = Bundle.generate(practitionerArray);

  // console.log("result", result.entry[0]);

  return result;
};


/**
 * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
 * @memberOf Practitioners
 * @name toMongo
 * @version 1.6.0
 * @returns { Practitioner }
 * @example
 * ```js
 *  let practitioners = Practitioners.toMongo('12345').fetch();
 * ```
 */

Practitioners.toMongo = function (originalPractitioner) {
  var mongoRecord;
  process.env.TRACE && console.log('Practitioners.toMongo', originalPractitioner);


  if (originalPractitioner.identifier) {
    originalPractitioner.identifier.forEach(function(identifier){
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

  if (originalPractitioner.birthDate) {
    var birthdateArray = originalPractitioner.birthDate.split('-');
    originalPractitioner.birthDate = new Date(birthdateArray[0], birthdateArray[1] - 1, birthdateArray[2]);
  }


  return originalPractitioner;
};


/**
 * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
 * @memberOf Practitioners
 * @name prepForUpdate
 * @version 1.6.0
 * @returns { Object }
 * @example
 * ```js
 *  let practitioners = Practitioners.findMrn('12345').fetch();
 * ```
 */

Practitioners.prepForUpdate = function (practitioner) {

  if (practitioner.name && practitioner.name[0]) {
    //console.log("practitioner.name", practitioner.name);

    practitioner.name.forEach(function(name){
      name.resourceType = "HumanName";
    });
  }

  if (practitioner.telecom && practitioner.telecom[0]) {
    //console.log("practitioner.telecom", practitioner.telecom);
    practitioner.telecom.forEach(function(telecom){
      telecom.resourceType = "ContactPoint";
    });
  }

  if (practitioner.address && practitioner.address[0]) {
    //console.log("practitioner.address", practitioner.address);
    practitioner.address.forEach(function(address){
      address.resourceType = "Address";
    });
  }

  if (practitioner.contact && practitioner.contact[0]) {
    //console.log("practitioner.contact", practitioner.contact);

    practitioner.contact.forEach(function(contact){
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

  return practitioner;
};


/**
 * @summary Scrubbing the practitioner; make sure it conforms to v1.6.0
 * @memberOf Practitioners
 * @name scrub
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let practitioners = Practitioners.findMrn('12345').fetch();
 * ```
 */

Practitioners.prepForFhirTransfer = function (practitioner) {
  //console.log("Practitioners.prepForBundle()");


  // FHIR has complicated and unusual rules about dates in order
  // to support situations where a family member might report on a practitioner's
  // date of birth, but not know the year of birth; and the other way around
  if (practitioner.birthDate) {
    practitioner.birthDate = moment(practitioner.birthDate).format("YYYY-MM-DD");
  }


  if (practitioner.name && practitioner.name[0]) {
    //console.log("practitioner.name", practitioner.name);

    practitioner.name.forEach(function(name){
      delete name.resourceType;
    });
  }

  if (practitioner.telecom && practitioner.telecom[0]) {
    //console.log("practitioner.telecom", practitioner.telecom);
    practitioner.telecom.forEach(function(telecom){
      delete telecom.resourceType;
    });
  }

  if (practitioner.address && practitioner.address[0]) {
    //console.log("practitioner.address", practitioner.address);
    practitioner.address.forEach(function(address){
      delete address.resourceType;
    });
  }

  if (practitioner.contact && practitioner.contact[0]) {
    //console.log("practitioner.contact", practitioner.contact);

    practitioner.contact.forEach(function(contact){

      console.log("contact", contact);


      if (contact.name && contact.name.resourceType) {
        //console.log("practitioner.contact.name", contact.name);
        delete contact.name.resourceType;
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }

    });
  }

  //console.log("Practitioners.prepForBundle()", practitioner);

  return practitioner;
};

/**
 * @summary The displayed name of the practitioner.
 * @memberOf Practitioner
 * @name displayName
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 * ```
 */

Practitioner.prototype.displayName = function () {
  if (this.name && this.name[0]) {
    return this.name[0].text;
  }
};
