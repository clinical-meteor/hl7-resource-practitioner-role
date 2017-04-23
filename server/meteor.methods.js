

Meteor.methods({
  createPractitionerRole:function(practitionerRoleObject){
    check(practitionerRoleObject, Object);

    if (process.env.NODE_ENV === 'test') {
      console.log('Creating PractitionerRole...');
      PractitionerRoles.insert(practitionerRoleObject, function(error, result){
        if (error) {
          console.log(error);
        }
        if (result) {
          console.log('PractitionerRole created: ' + result);
        }
      });
    } else {
      console.log('This command can only be run in a test environment.');
      console.log('Try setting NODE_ENV=test');
    }
  },
  // initializePractitionerRole:function(){
  //   if (PractitionerRoles.find().count() === 0) {
  //     console.log("No records found in PractitionerRoles collection.  Lets create some...");

  //     var defaultPractitionerRole = {
  //       name: {
  //         given: ["Gregory"],
  //         family: ["House"],
  //         text: "Dr. Gregory House, M.D."
  //       },
  //       telecom: [{
  //         system: 'phone',
  //         value: '212-555-2345',
  //         use: 'work',
  //         rank: '1'
  //       }]
  //     };

  //     Meteor.call('createPractitionerRole', defaultPractitionerRole);
  //   } else {
  //     console.log('PractitionerRoles already exist.  Skipping.');
  //   }
  // },
  dropPractitionerRoles: function(){
    if (process.env.NODE_ENV === 'test') {
      console.log('-----------------------------------------');
      console.log('Dropping practitionerRoles... ');
      PractitionerRoles.find().forEach(function(practitionerRole){
        PractitionerRoles.remove({_id: practitionerRole._id});
      });
    } else {
      console.log('This command can only be run in a test environment.');
      console.log('Try setting NODE_ENV=test');
    }
  }
});
