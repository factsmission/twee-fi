/* global SolidUtils, TweeFiUtils, $rdf, GraphNode */

$(function () {
    function drawReview (review) {
        var reviewObject = {};
        reviewObject.tweet = review.out(SolidUtils.vocab.schema("itemReviewed")).value;
        reviewObject.claim = review.out(SolidUtils.vocab.schema("claimReviewed")).value;
        reviewObject.review = review.out(SolidUtils.vocab.schema("reviewBody")).value;
        reviewObject.rating = review.out(SolidUtils.vocab.schema("reviewRating")).out(SolidUtils.vocab.schema("ratingValue")).value;
        reviewObject.uri = review.value;
        //console.log(reviewObject);

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
        }).then(
            function (tweet) {
                reviewObject.tweetBlockquote = tweet.html;

                return $.ajax("./template/view.html").then(function(template) {
                    //var template = document.getElementById('reviewTemplates').innerHTML;
                    var output = Mustache.render(template, reviewObject);
                    $("#tweets").append(output).fadeIn(2000);
                });
            });


    }
    
    TweeFiUtils.updateLoginInfo();
    var reviewCount = 0;
    SolidUtils.getStorageRootContainer().then(function (root) {
        var rootURI = root.value + "public/twee-fi/";
        var tweefiRoot = $rdf.sym(rootURI);
        return GraphNode(tweefiRoot).fetch().then(folder =>
        {
            return folder.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(twitterUser =>
            {
                return twitterUser.fetch().then(twitterUser => {
                    return twitterUser.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(tweet => {
                        return tweet.fetch().then(tweet => {
                            return tweet.out($rdf.sym("http://www.w3.org/ns/ldp#contains")).each(review => {
                                return review.fetch().then(review => {
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
    }).catch(function (error) {
        console.log("Couldn't get storage root: " + error);
    }).then(() => {
        if (reviewCount === 0) {
            $("#tweets").append("No reviews! Go review some tweets.");
        }
        console.log("adding event listner to "+$(".delete").length+" elements");
        $(".delete").click(e => {
            var review = $(e.target).closest(".review");
            var origBG = review.css("background-color");
            review.css( "background-color", "red" )
            setTimeout(() => { 
                    if (confirm("Delete "+ e.target.value+"?")) {
                        return SolidAuthClient.fetch(e.target.value, {
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
                        review.css( "background-color", origBG)
                    }
                }, 1);
        });
    });
    
    
    
});
