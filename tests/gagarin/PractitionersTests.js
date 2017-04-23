describe('clinical:hl7-resources-practitioner-role', function () {
  var server = meteor();
  var client = browser(server);

  it('PractitionerRoles should exist on the client', function () {
    return client.execute(function () {
      expect(PractitionerRoles).to.exist;
    });
  });

  it('PractitionerRoles should exist on the server', function () {
    return server.execute(function () {
      expect(PractitionerRoles).to.exist;
    });
  });

});
