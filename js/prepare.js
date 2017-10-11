/* global SolidAuthClient, $rdf, SolidUtils*/

var vocab = SolidUtils.vocab;

function createTest() {
    SolidUtils.getStorageRootContainer().then(function (root) {
        return SolidUtils.createPath(root.value + "public", "z/aa1/bb1/cc1/dd1");
    }).then(function (result) {
        alert(result);
    });
}

function updateLoginInfo() {
    SolidAuthClient.currentSession().then(function (session) {
        var user = $rdf.sym(session.webId);
        SolidUtils.rdfFetch(session.webId).then(function (response) {
            var name = response.graph.any(user, vocab.foaf('name'));
            $("#loginInfo").html("Logged in as: <a class='nav-link' href='" + session.webId + "'>" + name + "</a>");
        });
    });
}

$(function () {
    SolidAuthClient.currentSession().then(function (session) {
        if (session === null) {
            SolidUtils.login().then(function () {
                updateLoginInfo();
            });
        } else {
            updateLoginInfo();
        }
    });
});