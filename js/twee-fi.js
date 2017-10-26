/* global SolidAuthClient, SolidUtils, $rdf */

TweeFiUtils = {

    TweetUri: class {
        constructor(value) {
            // Regex-pattern to check URLs against: 
            // https://twitter.com/<twitteruser>/status/<long number>
            var urlRegex = /^https:\/\/twitter.com\/([a-zA-Z _.,!"'/$]+)\/status\/([0-9]*$)/;
            this.match = urlRegex.exec(value);
            this.value = value;
        }

        isValid() {
            return this.match !== null;
        }

        getUser() {
            return this.match[1];
        }

        getStatus() {
            return this.match[2];
        }

        toString() {
            return this.value;
        }
    },
    updateLoginInfo() {
        SolidAuthClient.currentSession().then(function (session) {
            if (session) {
                var user = $rdf.sym(session.webId);
                SolidUtils.rdfFetch(session.webId).then(function (response) {
                    var name = response.graph.any(user, SolidUtils.vocab.foaf('name'));
                    $("#loginInfo").html("Logged in as:");
                    $("#loginName").show();
                    $("#loginName").html("<a class='nav-link' href='" + session.webId + "'>" + name + "</a>");
                    $("#logoutButton").show();
                    $("#loginButton").hide();
                });
            } else {
                $("#loginInfo").html("Not logged in");
                $("#loginName").hide();
                $("#logoutButton").hide();
                $("#loginButton").show();
            }
        });
    },
    login() {
        SolidAuthClient.currentSession().then(function (session) {
            if (session === null) {
                SolidUtils.login().then(function () {
                    TweeFiUtils.updateLoginInfo();
                }).catch(function (error) {
                    console.log("Couldn't log in: " + error);
                });
            } else {
                TweeFiUtils.updateLoginInfo();
            }
        });
    }

};