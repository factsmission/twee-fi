/*global $rdf, SolidAuthClient, SolidUtils*/

"use strict"


var solid = require('solid');


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
            $("#loginName").html("<a class='nav-link text-light' href='" + session.webId + "'>" + name + "</a>");
        });
    });
}

$(function () {
    SolidAuthClient.currentSession().then(function (session) {
        if (session === null) {
            SolidUtils.login().then(function () {
                updateLoginInfo();
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
    $('#tweet_url').on('change keyup paste', function () {
        $("#tweet-valid").removeClass("show").addClass("hide");
        $("#tweet-invalid").removeClass("show").addClass("hide");
        CheckData();
    });
    $('#claim_reviewed, #ldp-uri, #review_body').on('change keyup paste', function () {
        CheckData();
    });
    $('#rating-in-stars').on('change', function () {
        CheckData();
    });


    class TweetUri {
        constructor(value) {
            // Regex-pattern to check URLs against: 
            // https://twitter.com/<twitteruser>/status/<long number>
            var urlRegex = /^https:\/\/twitter.com\/([a-zA-Z _.,!"'/$]+)\/status\/([0-9]*$)/;
            this.match = urlRegex.exec(value);
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
    }

    $('#check_tweet').on('click', function () {
        // Regex-pattern to check URLs against: 
        // https://twitter.com/<twitteruser>/status/<long number>
        var urlRegex = /^https:\/\/twitter.com\/[a-zA-Z _.,!"'/$]+\/status\/[0-9]*$/;
        var tweet_url = $('#tweet_url').val();
        if (check_tweet(tweet_url)) {
            $("#tweet-valid").removeClass("hide").addClass("show");
        } else {
            $("#tweet-invalid").removeClass("hide").addClass("show");
        }
    });

    function CheckData() {
        const LDP_neg_msg = "Missing LDP-URI.";
        const Tweet_url_neg_msg = "Missing Valid Tweet URL.";
        const Claim_neg_msg = "Missing Claim made in Tweet.";
        const Review_body_neg_msg = "Missing the body of your Review.";
        const Rating_neg_msg = "Missing Rating.";
        const LDP_msg = "LDP-URI appears valid";
        const Tweet_url_msg = "Tweet URL appears valid";
        const Claim_msg = "Claim in Tweet described.";
        const Rating_msg = "Claim Rated.";
        const Review_body_msg = "Review of Tweet described.";
        if ($('#ldp-uri').val() == false) {
            $('#valcheck_1_msg').text(LDP_neg_msg);
            $('#valcheck_1_ck').prop('checked', false);
        } else {
            $('#valcheck_1_msg').text(LDP_msg);
            $('#valcheck_1_ck').prop('checked', true);
        }
        if (!(new TweetUri($('#tweet_url').val())).isValid()) {
            $('#valcheck_2_msg').text(Tweet_url_neg_msg);
            $('#valcheck_2_ck').prop('checked', false);
        } else {
            $('#valcheck_2_msg').text(Tweet_url_msg);
            $('#valcheck_2_ck').prop('checked', true);
        }
        if ($('#claim_reviewed').val() == false) {
            $('#valcheck_3_msg').text(Review_body_neg_msg);
            $('#valcheck_3_ck').prop('checked', false);
        } else {
            $('#valcheck_3_msg').text(Review_body_msg);
            $('#valcheck_3_ck').prop('checked', true);
        }
        if ($('#review_body').val() == false) {
            $('#valcheck_4_msg').text(Claim_neg_msg);
            $('#valcheck_4_ck').prop('checked', false);
        } else {
            $('#valcheck_4_msg').text(Claim_msg);
            $('#valcheck_4_ck').prop('checked', true);
        }
        if ($('#rating-in-stars').val() == 0) {
            $('#valcheck_5_msg').text(Rating_neg_msg);
            $('#valcheck_5_ck').prop('checked', false);
        } else {
            $('#valcheck_5_msg').text(Rating_msg);
            $('#valcheck_5_ck').prop('checked', true);
        }
    }
    ;

    $('#pop_claim').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $('#ldp-uri').val("https://farewellutopia.com:8443/");
        $('#tweet_url').val("https://twitter.com/wesbos/status/912736261630251008");
        $('#claim_reviewed').val("That Facebook has decided to relicense React & Friends to MIT.");
        $('#review_body').val("Wes Bos is a reliable developer and has no reason to lie.");
        $('#rating-in-stars').val(5);
    });

    $('#update_tweet').on('click', function (event) {
        var twitframe = document.getElementById("twitframe");
        var tweetURI = $('#tweet_url').val();
        twitframe.src = "https://twitframe.com/show?url=" + encodeURIComponent(tweetURI);
    });

    $('#submit_claim').on('click', function (event) {
        // setup for this submit.
        event.preventDefault();
        event.stopPropagation();
        $('#claimreview_text').val("");
        $('#claimreview_text').addClass('hide').removeClass('show');
        $("#cr-valid").removeClass("show").addClass("hide");
        $("#cr-invalid").removeClass("show").addClass("hide");
        var tweetURI = $('#tweet_url').val();
        var today = new Date();
        var today_iso = today.toISOString().slice(0, 10);
        var rating_int = $('#rating-in-stars').val();
        var rating_alt = "";
        var claim_reviewed = $('#claim_reviewed').val();
        var review_body = $('#review_body').val();
        var form = document.getElementById("needs-validation");
        if (rating_int == 0) {
            $('#invalid').html("Please rate the truthfulness of the Tweet");
            form.classList.add("was-validated");
        } else {
            if (!form.checkValidity()) {
                //event.preventDefault();
                //event.stopPropagation();
                form.classList.add("was-validated");
            } else {
                form.classList.add("was-validated");
                switch (rating_int) {
                    case '1':
                        rating_alt = "Flat out lie";
                        break;
                    case '2':
                        rating_alt = "Quicksand";
                        break;
                    case '3':
                        rating_alt = "Somewhat true";
                        break;
                    case '4':
                        rating_alt = "Mostly true";
                        break;
                    case '5':
                        rating_alt = "Rock solid truth";
                        break;
                    default:
                        rating_alt = "May or may not be true";
                }

                // if all is good: create claimreview and save.
                function schema(suffix) {
                    return $rdf.sym("http://schema.org/" + suffix);
                }
                function rdf(suffix) {
                    return $rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#" + suffix);
                }
                var graph = $rdf.graph();

                var claimReview = $rdf.sym("http://review.local/");
                graph.add(claimReview, rdf("type"), schema("ClaimReview"));
                graph.add(claimReview, schema("claimedReviewed"), claim_reviewed);
                graph.add(claimReview, schema("reviewBody"), review_body);
                var itemReviewed = $rdf.sym(tweetURI);
                graph.add(claimReview, schema("itemReviewed"), itemReviewed);
                graph.add(claimReview, schema("datePublished"), $rdf.literal(today_iso, schema("Date")));
                var reviewRating = $rdf.blankNode();
                graph.add(reviewRating, rdf("type"), schema("Rating"));
                graph.add(reviewRating, schema("ratingValue"), rating_int);
                graph.add(reviewRating, schema("alternateName"), rating_alt);
                graph.add(claimReview, schema("reviewRating"), reviewRating);
                graph.add(claimReview, schema("url"), claimReview);
                var data = new $rdf.Serializer(graph, $rdf.sym("https://twitter.com/")).setBase("http://review.local/").toN3(graph);
                $('#claimreview_text').val(data);
                $('#claimreview_text').addClass('show').removeClass('hide');
                if (($('#claimreview_filename').length > 0) && ($('#claimreview_filename').val().length > 0)) {
                    var slug = $('#claimreview_filename').val();
                } else {
                    var slug = default_timestamp();
                }
                var tweetUri = new TweetUri(tweetURI);
                SolidUtils.getStorageRootContainer().then(function (root) {
                    return SolidUtils.createPath(root.value + "public", "twee-fi/"+tweetUri.getUser()+"/"+tweetUri.getStatus()).then(
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
        }
    });

    // Display a particular ClaimReview

    // list contents of the LDP
    $('#list-ldp').on('click', function (event) {
        var defaultContainer = $('#ldp-uri').val();
        if (defaultContainer.length == 0) {
            alert("You need to set the value of LDP-URI on the Select LDP-URI tab first.");
            return;
        }
        $('#spinner').addClass('show').removeClass('hide');
        $('#content_listing').empty();
        var start_row = "<tr><td>";
        var end_row = "</td><td><button class='btn-listing-show btn btn-sm btn-info mr-2'>show</button><button class='btn-listing-delete btn btn-sm btn-danger mr-2'>delete</button>"
        var container = solid.web.get(defaultContainer)
                .then(function (container) {
                    for (i = 0; i < container.contentsUris.length; i++) {
                        var new_row = start_row + container.contentsUris[i] + end_row;
                        $('#content_listing').append(new_row);
                    }
                    $('#spinner').addClass('hide').removeClass('show');

                    $('.btn-listing-show').on('click', function (event) {
                        // prep
                        $('#claim_review_listing_heading').text("");
                        $('#claim_review_listing').text("");
                        var targ = $(this).parent().parent().children('td:eq(0)');
                        var targ_text = targ.text();
                        solid.web.get(targ_text)
                                .then(function (response) {
                                    if (response.isContainer()) {
                                        // ignore...
                                    } else {
                                        // Regular resource
                                        // console.log('Raw resource: %s', response.raw())
                                        the_response = response.raw()
                                        // You can access the parsed graph (parsed by RDFLib.js):
                                        // var parsedGraph = response.parsedGraph()
                                        $('#claim_review_listing_heading').text(targ_text);
                                        $('#claim_review_listing').text(the_response);
                                        $('#show_claim_review').modal('show');
                                    }
                                })
                                .catch(function (err) {
                                    console.log(err) // error object
                                })
                    });
                    $('.btn-listing-delete').on('click', function (event) {
                        var targ = $(this).parent().parent().children('td:eq(0)');
                        var targ_text = targ.text();
                        console.log(targ_text);
                        if (window.confirm("Delete ClaimReview?")) {
                            solid.web.del(targ_text)
                                    .then(function (response) {
                                        console.log(response);
                                        targ.parent().remove();
                                    }).catch(function (err) {
                                console.log(err); // error object
                            });
                        }
                        ;
                    });
                });
    });




});
