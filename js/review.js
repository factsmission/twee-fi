/*global $rdf, SolidAuthClient, SolidUtils, TweeFiUtils*/

"use strict";



$(function () {
    SolidAuthClient.currentSession().then(function (session) {
        if (session === null) {
            SolidUtils.login();
        } else {
            TweeFiUtils.updateLoginInfo();
        }
    }).catch(function (error) {
        SolidUtils.login();
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
            submitReview(data, tweetUri).then(function (submitResult) {
                $("#cr-valid").removeClass("hide").addClass("show");
                function showFirstReviewInfo() {
                    return new Promise((accept, reject) => {
                        $("#reviewURI").html(submitResult.rootValue + "publictwee-fi/" + tweetUri.getUser() + "/" + tweetUri.getStatus());
                        $("#repoURI").html(submitResult.rootValue);
                        $("#reviewURI").attr("href", submitResult.rootValue + "publictwee-fi/" + tweetUri.getUser() + "/" + tweetUri.getStatus());
                        $("#repoURI").attr("href", submitResult.rootValue);
                        $("#firsttime").removeClass("invisible").addClass("visible");

                        $("#dismissFirsttime").on("click", () => {
                            $("#firsttime").removeClass("visible").addClass("visible");
                            $("#cr-valid").removeClass("alert-success").addClass("alert-danger");
                            $("#cr-valid").html("Redirecting...");
                            setTimeout(accept, 1000);
                        });
                    });
                }
                function showSuccesConfirmation() {
                    return new Promise((accept, reject) => {
                        $("#cr-valid").html("ClaimReview successfully created. Redirecting...");
                        setTimeout(accept, 5000);
                    });
                }
                
                let firstReview = submitResult.firstReview;
                (firstReview ? showFirstReviewInfo() : showSuccesConfirmation()).then(() => {
                    var searchParams = new URLSearchParams(window.location.search);
                    var target = searchParams.get("target");
                    if(target) {
                        console.log("Forwarding to: " + target);
                        window.location.href = target;
                    } else {
                        function fixedEncodeURIComponent(str) {
                            return encodeURIComponent(str).replace(/[!'()*.]/g, function (c) {
                                return '%' + c.charCodeAt(0).toString(16);
                            });
                        }
                        var revUri = submitResult.reviewUri.substr(13, submitResult.reviewUri.indexOf(".ttl"));
                        console.log("Forwarding to: /view.html?review=" + fixedEncodeURIComponent((revUri) + 2));
                        window.location.href = "/view.html?review=" + fixedEncodeURIComponent((revUri) + 2);
                    }
                });

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
            var firstReview = false;
            return SolidUtils.assertLdpc(root.value + "public/twee-fi/").catch(() => {
                firstReview = true;
            }).then(() => {
                return SolidUtils.createPath(root.value + "public",
                    "twee-fi/" + tweetUri.getUser() + "/" + tweetUri.getStatus()).then(
                    function (defaultContainer) {
                        var slug = default_timestamp();
                        return SolidUtils.fetch(defaultContainer, {
                            'method': 'POST',
                            'body': data,
                            'headers': {
                                'Content-Type': 'text/turtle',
                                'slug': slug
                            }
                    }).then(function (result) {
                        console.log("Success! Sent payload to designated LDP-URI!");
                        console.log("Location: " + result.headers.get("Location"));
                        console.log("Response code: " + result.status);
                        var reviewUri = SolidUtils.getBaseURI(defaultContainer) + result.headers.get("Location");
                        return {
                            "reviewUri": SolidUtils.getBaseURI(defaultContainer) + result.headers.get("Location"),
                            "rootValue": root.value,
                            "firstReview": firstReview
                        };
                    }).catch(function (err) {
                        // do something with the error
                        console.log(err);
                    }).then((postResult) => {
                        return SolidUtils.fetch(root.value + "public/twee-fi/latestReview.txt", {
                            'method': 'PUT',
                            'body': postResult.reviewUri,
                            'headers': {
                                'Content-Type': 'text/plain'
                            }
                        }).then((putResponse) =>{
                            if (putResponse.status < 300) {
                                return postResult;
                            } else {
                                console.error("Not able to PUT:" + putResponse.status);
                            }
                        });
                    });
            });
        });
    });
}})
