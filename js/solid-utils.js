/* global SolidAuthClient, $rdf */

SolidUtils = {


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
    parseLinkHeader(link) {
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
    },

    fetch(uri, options) {
        return SolidAuthClient.fetch(uri, options).then(function (response) {
                if (!options.noLoginDialog && (response.status === 401)) {
                    console.log("Got 401 response, attempting to login");
                    return SolidUtils.login().then(function () {
                        options.noLoginDialog = true;
                        return SolidUtils.fetch(uri, options);
                    });
                } else {
                    return response;
                }
            });
    },
    /**
     * 
     * Fetches an RDF graph. If the server return 401 the login process will be 
     * started upon which the fetch will be retried.
     *
     * @param uri {string} The URI to be fetched
     * @param authIfNeeded {boolean} Set to false if it shall not attempt to log in
     *
     * @return {Promise<Response>} Response has a `graph`property with the rertived graph
     */
    rdfFetch(uri, authIfNeeded = true) {
        return new Promise(function (resolve, reject) {
            var graph = $rdf.graph();
            var fetcher = new $rdf.Fetcher(graph, SolidUtils.fetch);
            fetcher.fetch(uri, {
                "redirect": "follow"
            }).then(function (response) {
                if (response.status < 300) {
                    response.graph = graph;
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });
    },

    vocab : {
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
    },
    absolutePath(href) {
        var link = document.createElement("a");
        link.href = href;
        return (link.protocol + "//" + link.host + link.pathname + link.search + link.hash);
    },

    getBaseURI(uri) {
        var pathArray = uri.split('/');
        var protocol = pathArray[0];
        var host = pathArray[2];
        return protocol + '//' + host;
    },

    /**
     * Open a popup and allow the user to log in.
     * 
     * @return {Promise<session>}
     */
    login() {
        localStorage.clear();
        return SolidAuthClient.popupLogin(
                {popupUri: SolidUtils.absolutePath('popup.html')}
                ).then(SolidUtils.postLoginAction);
    },

    postLoginAction(result) {
        return result;
    },

    getStorageRootContainer() {
        return SolidAuthClient.currentSession().then(function (session) {
            if (session === null) return SolidUtils.login().then(SolidUtils.getStorageRootContainer)
            var user = $rdf.sym(session.webId);
            return SolidUtils.rdfFetch(session.webId)
                    .then(function (response) {
                        var storage = response.graph.any(user, SolidUtils.vocab.space('storage'));
                        return storage;
                    });
        });
    },

    /**
     * @param uri {string} The URI that should be an LDPC
     * 
     * @return a Promise that is fullfilled if uri is an LDPC and rejected otherwise
     */
    assertLdpc(uri) {
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        return new Promise(function (resolve, reject) {
            SolidUtils.rdfFetch(uri).then(function (result) {
                var links = SolidUtils.parseLinkHeader(result.headers.get("Link"));
                if ((links.type.indexOf("http://www.w3.org/ns/ldp#Container") > -1)) {
                    resolve(uri);
                } else {
                    reject();
                }
            }).catch(function (result) {
                if (result instanceof Error) {
                    throw result;
                }
                reject();
            });
        });
    },

    createLdpc(base, name) {
        var severBase = SolidUtils.getBaseURI(base);
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
    },

    /** 
     * Ensures that a specified LDPC hierarchy path exists, it creates those
     * LDPC that do not yet exist 
     *  
     * @param {type} base
     * @param {type} path
     * @return {Promise}
     */
    createPath(base, path) {
        function createLdpcIfNeeded(base, name) {
            if (base.charAt(base.length - 1) !== '/') {
                base = base + '/';
            }
            return SolidUtils.assertLdpc(base + name).catch(function (r) {
                return SolidUtils.createLdpc(base, name);
            });
        }
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
                    return SolidUtils.createPath(ldc, rest);
                });
            }
        }
    }

}


