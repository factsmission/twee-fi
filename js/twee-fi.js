$(function(){
  $('input').on('change keyup paste', function(){
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
});