/* global SolidUtils, TweeFiUtils, $rdf, GraphNode */

$(function () {
    function drawReview (review) {
        var reviewObject = {};
        reviewObject.tweet = review.out(SolidUtils.vocab.schema("itemReviewed")).value;
        reviewObject.claim = review.out(SolidUtils.vocab.schema("claimReviewed")).value;
        reviewObject.review = review.out(SolidUtils.vocab.schema("reviewBody")).value;
        reviewObject.rating = review.out(SolidUtils.vocab.schema("reviewRating")).out(SolidUtils.vocab.schema("ratingValue")).value;
        console.log(reviewObject);

        $("#muTemp").load("/template/view.html", function(res, status, xhr) {
            var template = document.getElementById('reviewTemplate').innerHTML;
            var output = Mustache.render(template, reviewObject);
            $("#tweets").append(output).fadeIn(2000);
        });
    }

    SolidUtils.login().then(function () {
        TweeFiUtils.updateLoginInfo();
        return SolidUtils.getStorageRootContainer().then(function (root) {
            var rootURI = root.value + "public/twee-fi/";
            var tweefiRoot = $rdf.sym(rootURI);
            GraphNode(tweefiRoot).fetch().then(folder =>
            {
                folder.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(twitterUser =>
                {
                    twitterUser.fetch().then(twitterUser => {
                        twitterUser.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(tweet => {
                            tweet.fetch().then(tweet => {
                                tweet.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(review => {
                                    review.fetch().then(review => {
                                        console.log(twitterUser.value, tweet.value, review.value);
                                        drawReview(review);
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
