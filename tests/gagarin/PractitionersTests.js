describe('clinical:hl7-resources-practitioners', function () {
  var server = meteor();
  var client = browser(server);

  it('Practitioners should exist on the client', function () {
    return client.execute(function () {
      expect(Practitioners).to.exist;
    });
  });

  it('Practitioners should exist on the server', function () {
    return server.execute(function () {
      expect(Practitioners).to.exist;
    });
  });

});
