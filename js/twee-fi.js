$(function(){
  $('#tweet_url').on('change keyup paste', function(){
    $("#tweet-valid").removeClass("show").addClass("hide");
    $("#tweet-invalid").removeClass("show").addClass("hide");
  });

  $('#check_tweet').on('click',function(){
    // Regex-pattern to check URLs against. 
    // https://twitter.com/<twitteruser>/status/<long number>
    var urlRegex = /^https:\/\/twitter.com\/[a-zA-Z]+\/status\/[0-9]*$/;
    var tweet_url = $('#tweet_url').val();
    if (urlRegex.test(tweet_url)) {
      $("#tweet-valid").removeClass("hide").addClass("show");
    } else {
      $("#tweet-invalid").removeClass("hide").addClass("show");
    }
  });


  $('#submit_claim').on('click',function(event){
    // do validations
    var thetweet = $('#tweet_url').val();
    var today = new Date();
    var today_iso = today.toISOString().slice(0,10);
    var rating_int = $('#rating-in-stars').val();
    var rating_alt = "";
    var claim_reviewed = $('#claim_reviewed').val();
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
    console.log(rating_alt);

    
    // if all is good: 1.create claimreview and 2.save.
    function schema(suffix) {
      return $rdf.sym("http://schema.org/"+suffix);
    }
    function rdf(suffix) {
        return $rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#"+suffix);
    }
    var graph = $rdf.graph();
    
    var claimReview = $rdf.sym("http://review.local/");
    graph.add(claimReview, rdf("type"), schema("ClaimReview"));
    graph.add(claimReview, schema("claimedReviewed"), claim_reviewed);
    var itemReviewed = $rdf.sym(thetweet);
    graph.add(claimReview, schema("itemReviewed"), itemReviewed);
    graph.add(claimReview, schema("datePublished"), $rdf.literal(today_iso, schema("Date")));
    var reviewRating = $rdf.blankNode();
    graph.add(reviewRating, rdf("type"), schema("Rating"));
    graph.add(reviewRating, schema("ratingValue"), rating_int);
    graph.add(reviewRating, schema("alternateName"), rating_alt);
    graph.add(claimReview, schema("reviewRating"), reviewRating);
    graph.add(claimReview, schema("url"), $rdf.sym(thetweet));
    var data = new $rdf.Serializer(graph, $rdf.sym("https://twitter.com/")).setBase("http://review.local/").toN3(graph);
    console.log(data);
    $('claimreview_text').val(data);
    $('claimreview_text').addClass('show').removeClass('hide');
  });

});