/* global SolidUtils, TweeFiUtils, $rdf, GraphNode */

$(function () {
    SolidUtils.login().then(function () {
        TweeFiUtils.updateLoginInfo();
        return SolidUtils.getStorageRootContainer().then(function (root) {
            var rootURI = root.value + "public/twee-fi/";
            var tweefiRoot = $rdf.sym(rootURI);
            GraphNode(tweefiRoot).fetch().then(folder =>
            {
                folder.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(twitterUser =>
                {
                    console.log(twitterUser.value);
                    twitterUser.fetch().then(twitterUser => {
                        twitterUser.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(tweet => {
                            console.log(tweet.value);
                            tweet.fetch().then(tweet => {
                                tweet.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(review => {
                                    console.log(review.value);
                                    review.fetch().then(review => {
                                        console.log(review.out(SolidUtils.vocab.schema("claimReviewed")).value);
                                    });
                                });
                            });
                        });
                    });
                    /*return SolidAuthClient.fetch(contained.value, {
                        method: 'delete'
                    }).then(response => console.log(response));*/
                });
            });
        }).catch(function (error) {
            console.log("Couldn't log in: " + error);
        });

    });
});