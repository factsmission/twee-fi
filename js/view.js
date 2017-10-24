/* global SolidUtils, TweeFiUtils, $rdf, GraphNode */

$(function () {
    function drawReview (review) {
        var reviewObject = {};
        reviewObject.tweet = review.out(SolidUtils.vocab.schema("itemReviewed")).value;
        reviewObject.claim = review.out(SolidUtils.vocab.schema("claimReviewed")).value;
        reviewObject.review = review.out(SolidUtils.vocab.schema("reviewBody")).value;
        reviewObject.rating = review.out(SolidUtils.vocab.schema("reviewRating")).out(SolidUtils.vocab.schema("ratingValue")).value;
        //console.log(reviewObject);

        reviewObject.stars = "";
        for (var r = 0; r < reviewObject.rating; r++) {
            reviewObject.stars += '<i class="fa fa-star"></i>';
        }
        for (r; r < 5; r++) {
            reviewObject.stars += '<i class="fa fa-star-o"></i>';
        }

        $.ajax({
            url: "https://publish.twitter.com/oembed?url=" + reviewObject.tweet,
            dataType: 'jsonp',
            success: function (tweet) {
                reviewObject.tweetBlockquote = tweet.html;

                $("#muTemp").load("./template/view.html", function(res, status, xhr) {
                    var template = document.getElementById('reviewTemplates').innerHTML;
                    var output = Mustache.render(template, reviewObject);
                    $("#tweets").append(output).fadeIn(2000);
                });
            }
        });


    }
    
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
                                    //console.log(twitterUser.value, tweet.value, review.value);
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
        console.log("Couldn't get storage root: " + error);
    });

});
