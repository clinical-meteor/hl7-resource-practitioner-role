Package.describe({
  name: 'clinical:hl7-resource-practitioner',
  version: '3.0.0',
  summary: 'HL7 FHIR Resource - Practitioner',
  git: 'https://github.com/clinical-meteor/hl7-resource-practitioner',
  documentation: 'README.md'
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.3');

  api.use('meteor-platform');
  api.use('mongo');
  api.use('aldeed:simple-schema@1.3.3');
  api.use('aldeed:collection2@2.5.0');

  api.use('simple:json-routes@2.1.0');
  api.use('clinical:fhir-vault-server@0.0.3', ['client', 'server'], {weak: true});

  api.use('clinical:extended-api@2.2.2');
  api.use('clinical:base-model@1.3.5');
  api.use('clinical:user-model@1.5.0');
  api.use('clinical:hl7-resource-datatypes@3.0.0');
  api.use('clinical:hl7-resource-bundle@1.3.10');

  api.imply('clinical:user-model');

  api.addFiles('lib/Practitioners.js');
  api.addFiles('server/rest.js', 'server');

  api.export('Practitioner');
  api.export('Practitioners');
  api.export('PractitionerSchema');
});
