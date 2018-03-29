/* global SolidAuthClient, SolidUtils, $rdf */

TweeFiUtils = {

    TweetUri: class {
        constructor(value) {
            // Regex-pattern to check URLs against: 
            // https://twitter.com/<twitteruser>/status/<long number>
            var urlRegex = /^https:\/\/twitter.com\/([a-zA-Z0-9_.,!"'/$]+)\/status\/([0-9]*$)/;
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
                    $("#not-logged-in").hide();
                    $("#no-reviews").show();
                });
            } else {
                $("#loginInfo").html("Not logged in");
                $("#loginName").hide();
                $("#logoutButton").hide();
                $("#loginButton").show();
                $("#not-logged-in").show();
                $("#no-reviews").hide();
            }
        });
    }
};

SolidUtils.postLoginAction = TweeFiUtils.updateLoginInfo; 

$(function () {
    TweeFiUtils.updateLoginInfo();
    
    $('#logoutButton').on('click', function () {
        localStorage.clear();
        TweeFiUtils.updateLoginInfo();
    });

    $('#loginButton').on('click', function () {
        SolidUtils.login().catch(function (error) {
            console.log("Couldn't log in: " + error);
        });
    });
});
