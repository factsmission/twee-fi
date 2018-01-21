/* global SolidUtils, TweeFiUtils, $rdf, GraphNode */

$(function () {
    function drawReview (review) {
        var reviewObject = {};

        try {
            reviewObject.review = review.out(SolidUtils.vocab.schema("reviewBody")).value;
        } catch (error) {
            console.error("Coluld not load review of " + review.value + " : " + error);
        }

        try {
            reviewObject.claim = review.out(SolidUtils.vocab.schema("claimReviewed")).value;
        } catch (error) {
            console.error("Coluld not load claim of " + review.value + " : " + error);
        }

        try {
            reviewObject.tweet = review.out(SolidUtils.vocab.schema("itemReviewed")).value;
        } catch (error) {
            console.error("Coluld not load reviewed item of " + review.value + " : " + error);
        }

        try {
            reviewObject.rating = review.out(SolidUtils.vocab.schema("reviewRating")).out(SolidUtils.vocab.schema("ratingValue")).value;
        } catch (error) {
            console.error("Coluld not load rating of " + review.value + " : " + error);
        }

        reviewObject.uri = review.value;

        reviewObject.stars = "";
        for (var r = 0; r < reviewObject.rating; r++) {
            reviewObject.stars += '<i class="fa fa-star"></i>';
        }
        for (r; r < 5; r++) {
            reviewObject.stars += '<i class="fa fa-star-o"></i>';
        }

        return $.ajax({
            url: "https://publish.twitter.com/oembed?url=" + reviewObject.tweet,
            dataType: 'jsonp'
        }).catch((e) => {
            console.log("ERORR EST: " + e);
        }).then((tweet) => {
            if (typeof tweet === "undefined") {
                console.log("ERROR EST: tweet is undefined");
            } else {
                reviewObject.tweetBlockquote = tweet.html;
                return $.ajax("./template/view.html").catch(() => {
                    console.log("ERORREM EST: " + e);
                }).then(function (template) {
                    //var template = document.getElementById('reviewTemplates').innerHTML;
                    if (Object.keys(reviewObject).length > 0) {
                        var output = Mustache.render(template, reviewObject);
                        $("#tweets").append(output).fadeIn(2000);
                    }
                });
            }
        });


    }
    
    TweeFiUtils.updateLoginInfo();
    var reviewCount = 0;
    SolidUtils.getStorageRootContainer().catch(function (error) {
        console.error("Couldn't get storage root: " + error);
    }).then(function (root) {
        var rootURI = root.value + "public/twee-fi/";
        var tweefiRoot = $rdf.sym(rootURI);
        return GraphNode(tweefiRoot).fetch().catch(function (error) {
            console.error("Couldn't fetch " + tweefiRoot +": " + error);
        }).then(folder =>
        {
            return folder.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(twitterUser =>
            {
                return twitterUser.fetch().catch(function (error) {
                    console.error("Couldn't fetch /" + twitterUser + ": " + error);
                }).then(twitterUser => {
                    return twitterUser.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(tweet => {
                        return tweet.fetch().catch(function (error) {
                            console.error("Couldn't fetch /" + tweet + ": " + error);
                        }).then(tweet => {
                            return tweet.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(review => {
                                return review.fetch().catch(function (error) {
                                    console.error("Couldn't fetch /" + review + ": " + error);
                                }).then(review => {
                                    //console.log(twitterUser.value, tweet.value, review.value);
                                    reviewCount++;
                                    return drawReview(review);
                                });
                            });
                        });
                    });
                });
            });
        });
    }).then(() => {
        if (reviewCount === 0) {
            $("#tweets").append("No reviews! Go review some tweets.");
        }
    });
});

function deleteReview(e) {
    var review = $(e).closest(".review");
    var origBG = review.css("background-color");
    review.addClass("bg-danger text-white");
    setTimeout(() => {
    if (confirm("Delete " + review.find(".permalink").attr("href") + " ?")) {
        return SolidUtils.fetch(review.find(".permalink").attr("href"), {
            method: 'delete'
        }).then(response => {
            console.log(response);
            if (response.ok) {
                review.remove();
            } else {
                response.text().then(msg => alert(msg));
            }
        });
    } else {
        review.removeClass("bg-danger text-white");
    }
    }, 2);
}