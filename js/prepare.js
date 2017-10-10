/* global SolidAuthClient, $rdf*/


/**
 * 
 * Copied from solid-web-client
 * 
 * Parses a Link header.
 * @method parseLinkHeader
 *
 * @param link {string} Contents of the Link response header
 *
 * @return {Object}
 */
function parseLinkHeader(link) {
    if (!link) {
        return {};
    }

    var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
    var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;
    var matches = link.match(linkexp);
    var rels = {};

    for (var i = 0; i < matches.length; i++) {
        var split = matches[i].split('>');
        var href = split[0].substring(1);
        var ps = split[1];
        var s = ps.match(paramexp);

        for (var j = 0; j < s.length; j++) {
            var p = s[j];
            var paramsplit = p.split('=');
            // var name = paramsplit[0]
            var rel = paramsplit[1].replace(/["']/g, '');

            if (!rels[rel]) {
                rels[rel] = [];
            }

            rels[rel].push(href);

            if (rels[rel].length > 1) {
                rels[rel].sort();
            }
        }
    }

    return rels;
}

function rdfFetch(uri, authIfNeeded = true) {
    return new Promise(function (resolve, reject) {
        var graph = $rdf.graph();
        var fetcher = new $rdf.Fetcher(graph, {fetch: SolidAuthClient.fetch});
        fetcher.fetch(uri, {
            "redirect": "follow"
        }).then(function (response) {
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

/**
 * 
 * @return a Promise that is fullfilled if uri is an LDPC and rejected otherwise
 */
function assertLdpc(uri) {
    if (uri.charAt(uri.length-1) != '/') {
        uri = uri+'/';
    }
    return new Promise(function (resolve, reject) {
        rdfFetch(uri).then(function (result) {
            var links  = parseLinkHeader(result.headers.get("Link"));
            if ((links.type.indexOf("http://www.w3.org/ns/ldp#Container") > -1)) {
                resolve(uri);
            } else {
                reject();
            }
        }).catch(function(result) {
            reject();
        });
    });
}

function createLdpc(base, name) {
    var severBase = getBaseURI(base);
    var body = '@prefix dct: <http://purl.org/dc/terms/> . \n@prefix ldp: <http://www.w3.org/ns/ldp#>. \n\n<> a ldp:BasicContainer ; \n\x09 dct:title "Containainer created by Twee-Fi" .';
    return SolidAuthClient.fetch(base, {
        'method': 'POST',
        'body': body,
        'headers': {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            'Slug': name
        }
    }).then(function (response) {
        return severBase + response.headers.get("Location");
    });
}

function createLdpcIfNeeded(base, name) {
    if (base.charAt(base.length-1) != '/') {
        base = base+'/';
    }
    return assertLdpc(base+name).catch(function() {
        return createLdpc(base, name);
    });
}

function createPath(base, path) {
    var firstSlash = path.indexOf("/");
    if (firstSlash === -1) {
        return createLdpcIfNeeded(base, path);
    } else {
        var first = path.substring(0, firstSlash);
        var rest = path.substring(firstSlash + 1);
        if (rest.length === 0) {
            return createLdpcIfNeeded(base, first);
        } else {
            return createLdpcIfNeeded(base, first).then(function (ldc) {
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