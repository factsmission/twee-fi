/* global SolidAuthClient, $rdf*/

//var SolidWebClient = require("solid").web; 
var SolidWebClient = new SolidWebClient()

SolidWebClient.solidRequest = function (url, method, options, data) {
    return SolidAuthClient.fetch(url, Object.assign(options, {
        'method': method,
        'body': data
    }));
};
function rdfFetch(uri, authIfNeeded = true) {
    return new Promise(function (resolve, reject) {
        var graph = $rdf.graph();
        var fetcher = new $rdf.Fetcher(graph, {fetch: SolidAuthClient.fetch});
        fetcher.fetch(uri).then(function (response) {
            if (response.status < 300) {
                response.graph = graph;
                resolve(response);
            } else {
                if (authIfNeeded && (response.status === 401)) {
                    console.log("Got 401 response, attempting to login");
                    return login().then(function () {
                        return rdfFetch(uri, false);
                    });
                } else {
                    reject(response);
                }
            }
        });
    })
}

var vocab = {
    schema: function (suffix) {
        return $rdf.sym("http://schema.org/" + suffix);
    },
    rdf: function (suffix) {
        return $rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#" + suffix);
    },
    solid: function (suffix) {
        return $rdf.sym("http://www.w3.org/ns/solid/terms#" + suffix);
    },
    space: function (suffix) {
        return $rdf.sym("http://www.w3.org/ns/pim/space#" + suffix);
    },
    foaf: function (suffix) {
        return $rdf.sym("http://xmlns.com/foaf/0.1/" + suffix);
    }
};
function absolutePath(href) {
    var link = document.createElement("a");
    link.href = href;
    return (link.protocol + "//" + link.host + link.pathname + link.search + link.hash);
}

function getBaseURI(uri) {
    var pathArray = uri.split('/');
    var protocol = pathArray[0];
    var host = pathArray[2];
    return protocol + '//' + host;
}

function login() {
    localStorage.clear();
    return SolidAuthClient.popupLogin({popupUri: absolutePath('popup.html')}); /*.then(
     function (auth) {
     updateLoginInfo();
     });*/
}

function updateLoginInfo() {
    SolidAuthClient.currentSession().then(function (session) {
        var user = $rdf.sym(session.webId);
        rdfFetch(session.webId).then(function (response) {
            var name = response.graph.any(user, vocab.foaf('name'));
            $("#loginInfo").html("Logged in as: <a class='nav-link' href='" + session.webId + "'>" + name + "</a>");
        });
    });
}

function getStorageRootContainer() {
    return SolidAuthClient.currentSession().then(function (session) {
        var user = $rdf.sym(session.webId);
        var graph = $rdf.graph();
        return rdfFetch(session.webId)
                .then(function (response) {
                    var storage = response.graph.any(user, vocab.space('storage'));
                    return storage;
                });
    });
}

function createLdpc(base, name) {
    var severBase = getBaseURI(base);
    var body = '@prefix dct: <http://purl.org/dc/terms/> . \n@prefix ldp: <http://www.w3.org/ns/ldp#>. \n\n<> a ldp:BasicContainer ; \n\x09 dct:title "Container title" .';
    return SolidWebClient.createContainer(base, name, undefined, body).then(function (response) {
        return severBase + response.headers.get("Location");
    });
}

function createPath(base, path) {
    var firstSlash = path.indexOf("/");
    if (firstSlash === -1) {
        return createLdpc(base, path);
    } else {
        var first = path.substring(0, firstSlash);
        var rest = path.substring(firstSlash + 1);
        if (rest.length === 0) {
            return createLdpc(base, first);
        } else {
            return createLdpc(base, first).then(function (ldc) {
                return createPath(ldc, rest);
            });
        }
    }
}

function createTest() {
    getStorageRootContainer().then(function (root) {
        return createPath(root.value + "public", "z/aa1/bb1/cc1/dd1");
    }).then(function (result) {
        alert(result);
    });
}

$(function () {
    SolidAuthClient.currentSession().then(function (session) {
        if (session === null) {
            login().then(function () {
                updateLoginInfo();
            });
        } else {
            updateLoginInfo();
        }
    });
});