/*global $rdf, SolidAuthClient, SolidUtils*/

"use strict";


function createTest() {
    SolidUtils.getStorageRootContainer().then(function (root) {
        return SolidUtils.createPath(root.value + "public", "z/aa1/bb1/cc1/dd1");
    }).then(function (result) {
        alert(result);
    });
}

function updateLoginInfo() {
    SolidAuthClient.currentSession().then(function (session) {
        var user = $rdf.sym(session.webId);
        SolidUtils.rdfFetch(session.webId).then(function (response) {
            var name = response.graph.any(user, vocab.foaf('name'));
            $("#loginInfo").html("Logged in as:");
            $("#loginName").html("<a class='nav-link' href='" + session.webId + "'>" + name + "</a>");
        });
    });
}

$(function () {
    SolidAuthClient.currentSession().then(function (session) {
        if (session === null) {
            SolidUtils.login().then(function () {
                updateLoginInfo();
            }).catch(function (error) {
                console.log("Couldn't log in: " + error);
            });
        } else {
            updateLoginInfo();
        }
    });
});

var vocab = {
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
};

$(function () {

    function default_timestamp() {
        var momentNow = moment();
        return "FactsMission--" + momentNow.format('YYYY-MM-DD') + '-'
                + momentNow.format('dddd').substring(0, 3).toUpperCase() + "-" + momentNow.format('Ahhmmss');
    }

    $('#default_timestamp').html(default_timestamp());
    $('[data-toggle="tooltip"]').tooltip();


    class TweetUri {
        constructor(value) {
            // Regex-pattern to check URLs against: 
            // https://twitter.com/<twitteruser>/status/<long number>
            var urlRegex = /^https:\/\/twitter.com\/([a-zA-Z _.,!"'/$]+)\/status\/([0-9]*$)/;
            this.match = urlRegex.exec(value);
            this.value = value;
        }

        isValid() {
            return this.match != null;
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
    }

    $('#url_form_button').on('click', function () {
        // Regex-pattern to check URLs against: 
        // https://twitter.com/<twitteruser>/status/<long number>
        var urlRegex = /^https:\/\/twitter.com\/[a-zA-Z _.,!"'/$]+\/status\/[0-9]*$/;
        var tweet_url = $('#tweet_url').val();
        if ((new TweetUri($('#tweet_url').val())).isValid()) {
            $("#url_form").submit();
        } else {
            $("#invalid_url").removeClass("invisible").addClass("visible");
        }
    });

    $('#tweet_url').on('change keyup paste', function () {
        $("#invalid_url").removeClass("visible").addClass("invisible");
    });

    //Only after the user tried to submit the input is validated
    var submissionAttempted = false;
    
    $('#claim_reviewed,#review_body').on('change keyup paste', function () {
        if (submissionAttempted) checkForm();
    });
    $('#rating-in-stars').on('change', function () {
        if (submissionAttempted) checkForm();
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
        form.addClass("was-validated");
        return formIsValid;
    }
    
    form.on('submit', function (event) {
        //preventin browser's default action also by returning false
        event.preventDefault();
        event.stopPropagation();
        submissionAttempted = true;
        $('#claimreview_text').val("");
        $('#claimreview_text').addClass('hide').removeClass('show');
        $("#cr-valid").removeClass("show").addClass("hide");
        $("#cr-invalid").removeClass("show").addClass("hide");
        var tweetUri = new TweetUri($('#tweet_url').val());
        var today = new Date();
        var today_iso = today.toISOString().slice(0, 10);
        var rating = Number($('#rating-in-stars').val());
        var claim_reviewed = $('#claim_reviewed').val();
        var review_body = $('#review_body').val();
        
        var formIsValid = checkForm();
        
        if (!formIsValid || (rating === 0)) {
            $('#invalid').html("Please rate the truthfulness of the Tweet");            
        } else {
            function ratingLabel(value) {
                switch (value) {
                    case 1: return "Flat out lie";
                    case 2: return "Quicksand";
                    case 3: return "Somewhat true";
                    case 4: return "Mostly true";
                    case 5: return "Rock solid truth";
                    default: return "May or may not be true";
                }
            }
            var rating_alt = ratingLabel(rating);

            // if all is good: create claimreview and save.

            var graph = $rdf.graph();

            var claimReview = $rdf.sym("http://review.local/");
            graph.add(claimReview, vocab.rdf("type"), vocab.schema("ClaimReview"));
            graph.add(claimReview, vocab.schema("claimedReviewed"), claim_reviewed);
            graph.add(claimReview, vocab.schema("reviewBody"), review_body);
            var itemReviewed = $rdf.sym(tweetUri.toString());
            graph.add(claimReview, vocab.schema("itemReviewed"), itemReviewed);
            graph.add(claimReview, vocab.schema("datePublished"), $rdf.literal(today_iso, vocab.schema("Date")));
            var reviewRating = $rdf.blankNode();
            graph.add(reviewRating, vocab.rdf("type"), vocab.schema("Rating"));
            graph.add(reviewRating, vocab.schema("ratingValue"), rating);
            graph.add(reviewRating, vocab.schema("alternateName"), rating_alt);
            graph.add(claimReview, vocab.schema("reviewRating"), reviewRating);
            graph.add(claimReview, vocab.schema("url"), claimReview);
            var data = new $rdf.Serializer(graph, $rdf.sym("https://twitter.com/")).setBase("http://review.local/").toN3(graph);
            $('#claimreview_text').val(data);
            $('#claimreview_text').addClass('show').removeClass('hide');
            if (($('#claimreview_filename').length > 0) && ($('#claimreview_filename').val().length > 0)) {
                var slug = $('#claimreview_filename').val();
            } else {
                var slug = default_timestamp();
            }
            SolidUtils.getStorageRootContainer().then(function (root) {
                return SolidUtils.createPath(root.value + "public", "twee-fi/" + tweetUri.getUser() + "/" + tweetUri.getStatus()).then(
                        function (defaultContainer) {
                            return SolidAuthClient.fetch(defaultContainer, {
                                'method': 'POST',
                                'body': data,
                                'headers': {
                                    'Content-Type': 'text/turtle',
                                    'slug': slug
                                }
                            }).then(function (meta) {
                                console.log("Success! Sent payload to designated LDP-URI!");
                                $("#cr-valid").removeClass("hide").addClass("show");
                                $("#cr-invalid").removeClass("show").addClass("hide");
                            }).catch(function (err) {
                                // do something with the error
                                console.log(err);
                                $('#cr_error_msg').text(err);
                                $("#cr-invalid").addClass("show").removeClass("hide");
                                $("#cr-valid").removeClass("show").addClass("hide");
                            });
                        });
            });

        }
        return false;
    });
});
