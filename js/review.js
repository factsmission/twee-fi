/*global $rdf, SolidAuthClient, SolidUtils, TweeFiUtils*/

"use strict";



$(function () {
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
});

$(function () {
    var searchParams = new URLSearchParams(window.location.search);
    var tweetURL = searchParams.get("tweet");
    if (!tweetURL) {
        window.location.replace(SolidUtils.absolutePath("./"));
    } else {
        var tweetInput = document.getElementById("tweet_url");
        $("#tweet_url").val(tweetURL);
        var twitframe = document.getElementById("twitframe");
        twitframe.src = "https://twitframe.com/show?url=" + encodeURIComponent(tweetURL);
    }
});

$(function () {

    function default_timestamp() {
        var momentNow = moment();
        return "FactsMission--" + momentNow.format('YYYY-MM-DD') + '-'
                + momentNow.format('dddd').substring(0, 3).toUpperCase() + "-" + momentNow.format('Ahhmmss');
    }

    $('#default_timestamp').html(default_timestamp());
    $('[data-toggle="tooltip"]').tooltip();




    //Only after the user tried to submit the input is validated
    var submissionAttempted = false;

    $('#claim_reviewed,#review_body').on('change keyup paste', function () {
        if (submissionAttempted)
            checkForm();
    });
    $('#rating-in-stars').on('change', function () {
        if (submissionAttempted)
            checkForm();
    });

    var form = $("#review-form");
    function checkForm() {
        var formIsValid = form[0].checkValidity();
        //the first two shuld actually be talen care of by bootstrap
        if (!$('#claim_reviewed').val()) {
            $("#no_claim").removeClass("invisible").addClass("visible");
        } else {
            $("#no_claim").removeClass("visible").addClass("invisible");
        }
        if (!$('#review_body').val()) {
            $("#no_body").removeClass("invisible").addClass("visible");
        } else {
            $("#no_body").removeClass("visible").addClass("invisible");
        }
        if (Number($('#rating-in-stars').val()) === 0) {
            formIsValid = false;
            $("#no_rating").show()
        } else {
            $("#no_rating").hide();
        }
        if (!formIsValid) {
            form.addClass("was-validated");
        }
        return formIsValid;
    }

    form.on('submit', function (event) {
        //preventin browser's default action also by returning false
        event.preventDefault();
        event.stopPropagation();
        submissionAttempted = true;
        $("#cr-valid").removeClass("show").addClass("hide");

        if (checkForm()) {
            var tweetUri = new TweeFiUtils.TweetUri($('#tweet_url').val());
            var data = createReview(tweetUri);
            submitReview(data, tweetUri).then(function (reviewURI) {
                $("#cr-valid").removeClass("hide").addClass("show");
                console.log("Forwarding to:  " + reviewURI);
                window.location.href = reviewURI;
            });
        }
        return false;
    });

    /**
     * 
     * @returns {string} The review as N3
     */
    function createReview(tweetUri) {
        function ratingLabel(value) {
            switch (value) {
                case 1:
                    return "Flat out lie";
                case 2:
                    return "Quicksand";
                case 3:
                    return "Somewhat true";
                case 4:
                    return "Mostly true";
                case 5:
                    return "Rock solid truth";
                default:
                    return "May or may not be true";
            }
        }

        var today = new Date();
        var today_iso = today.toISOString().slice(0, 10);
        var rating = Number($('#rating-in-stars').val());
        var rating_alt = ratingLabel(rating);
        var claim_reviewed = $('#claim_reviewed').val();
        var review_body = $('#review_body').val();
        var graph = $rdf.graph();
        var claimReview = $rdf.sym("http://review.local/");
        graph.add(claimReview, SolidUtils.vocab.rdf("type"), SolidUtils.vocab.schema("ClaimReview"));
        graph.add(claimReview, SolidUtils.vocab.schema("claimReviewed"), claim_reviewed);
        graph.add(claimReview, SolidUtils.vocab.schema("reviewBody"), review_body);
        var itemReviewed = $rdf.sym(tweetUri.toString());
        graph.add(claimReview, SolidUtils.vocab.schema("itemReviewed"), itemReviewed);
        graph.add(claimReview, SolidUtils.vocab.schema("datePublished"), $rdf.literal(today_iso, SolidUtils.vocab.schema("Date")));
        var reviewRating = $rdf.blankNode();
        graph.add(reviewRating, SolidUtils.vocab.rdf("type"), SolidUtils.vocab.schema("Rating"));
        graph.add(reviewRating, SolidUtils.vocab.schema("ratingValue"), rating);
        graph.add(reviewRating, SolidUtils.vocab.schema("alternateName"), rating_alt);
        graph.add(claimReview, SolidUtils.vocab.schema("reviewRating"), reviewRating);
        graph.add(claimReview, SolidUtils.vocab.schema("url"), claimReview);
        return new $rdf.Serializer(graph, $rdf.sym("https://twitter.com/")).setBase("http://review.local/").toN3(graph);
    }

    function submitReview(data, tweetUri) {
        return SolidUtils.getStorageRootContainer().then(function (root) {
            return SolidUtils.createPath(root.value + "public",
                    "twee-fi/" + tweetUri.getUser() + "/" + tweetUri.getStatus()).then(
                    function (defaultContainer) {
                        var slug = default_timestamp();
                        return SolidAuthClient.fetch(defaultContainer, {
                            'method': 'POST',
                            'body': data,
                            'headers': {
                                'Content-Type': 'text/turtle',
                                'slug': slug
                            }
                        }).then(function (result) {
                            console.log("Success! Sent payload to designated LDP-URI!");
                            return SolidUtils.getBaseURI(defaultContainer) + result.headers.get("Location");
                        }).catch(function (err) {
                            // do something with the error
                            console.log(err);
                        });
                    });
        });
    }

});
