table redirects {
  // Global redirects.
  "/cv": "https://docs.google.com/document/d/1SlrbctqUQlhBtODC8c12Qft66b8j69jV1CSVcrYqdq0/",
  "/book-a-time": "https://fantastical.app/alexwilson/30m",

  // All pictures come from media.alexwilson.tech.
  "/pictures/**": "https://media.alexwilson.tech/**",

  // Old blog slugs: Probably can be removed soon.
  "/blog/2015/01/17/getting-past-cloudflare/": "/content/09b2a1eb-4a1f-4087-b261-79ceee6e2bc6",
  "/blog/2016/07/01/ten-deploys-per-day/": "/content/d7bb0bc3-5bab-4ce7-97ee-602052d007aa",
  "/blog/2016/01/31/scaling-irc-tech/": "/content/97b4f995-231d-4d15-86ed-91d1e0921d7b",
  "/blog/2015/07/12/rebuilding/": "/content/4b52df62-90d5-4d31-8cf0-72a6f6e8a14c",
  "/blog/2018/11/03/weeknotes/": "/content/44499e4f-fc44-44a4-9aa2-9d59c5dffe85",
  "/blog/2018/11/10/democratising-and-automating-dns/": "/content/4828db22-33da-4554-8651-696128c17e17",
  "/blog/2018/11/24/weeknotes/": "/content/09d7fcde-61c6-48f7-b68e-1c1be442698f",
  "/blog/2018/12/01/weeknotes-jetlag-city/": "/content/0e7b04bc-2ff0-489b-a9de-a608e76672d7",
  "/blog/2017/01/01/using-ipv6-in-aws/": "/content/a9c36f43-57cb-4e17-b284-43546c834b1c",
  "/blog/2018/11/10/weeknotes/": "/content/8739b291-45f5-4f98-89b0-f6881d940ca2",
  "/blog/2018/10/27/weeknotes/": "/content/aa7c9618-5652-4e7d-b7b9-284f157e1332",
  "/blog/2019/01/26/weeknotes-first-of-the-year/": "/content/5e8ed0cb-cf94-4634-b5c4-7ef561c5e7bc",
  "/blog/2018/12/08/weeknotes-reinvent/": "/content/96878838-1ca9-4165-a36b-2373cf39c33a",
  "/blog/2019/04/14/taking-a-look-through-a-johari-window/": "/content/cdf6575f-d01f-43bb-8a26-eb1530ca9952",
  "/blog/2019/08/24/immutable-infratructure/": "/content/3e8ea4c7-60db-496a-9ffb-1d8d3ec23f46",
  "/blog/2019/02/16/weeknotes/": "/content/437f6d7b-3a32-4901-8546-d7bb69f77efb",
  "/blog/2017/11/30/updating-permissions-in-large-s3-buckets/": "/content/4fa644e5-2101-4788-abfe-d2d28d9ef0a0",
  "/blog/2019/03/30/weeknotes-adventures/": "/content/dc39b27d-b4f4-401c-83c2-c43d16a10a0d",
  "/blog/2019/04/13/weeknotes-journalism-raves/": "/content/2fd603e9-9d95-4518-9b61-b572437865e2",
  "/blog/2020/01/19/graphql-for-extraction/": "/content/d1a4a7bb-fc4d-41f2-8482-8a7afe1af0e6",
  "/blog/2020/01/15/deploying-static-sites-with-github-actions/": "/content/717e6a35-1cb5-4a28-9321-592d05ddd9dc",
  "/talks/2019-03-19-qa-is-not-quality-brumjs/": "/content/770c26b5-f551-4795-90fa-0f24627ec510"
}

sub vcl_recv {
    declare local var.path STRING;
    declare local var.querystring STRING;
    declare local var.destination STRING;
    declare local var.pathpattern STRING;
    declare local var.destinationpattern STRING;

    set var.path = req.url.path;
    set var.querystring = req.url.qs;
    set var.destination = "-";

    // Look-up in the redirects dictionary
    set var.destination = table.lookup(redirects, var.path, "-");

    // Test for a one-segment path prefix
    if (var.destination == "-" && var.path ~ "(/\w+)(/.*)?$") {
        set var.pathpattern = re.group.1 "/**";
        set var.destinationpattern = table.lookup(redirects, var.pathpattern, "");
        if (var.destinationpattern != "") {
            set var.destination = regsub(var.destinationpattern, "\/\*\*", re.group.2);
        }
    }

    // If we've found a redirect, go to the error subroutine to deliver it
    if (var.destination != "-") {

        // Preserve its querystring
        if (var.querystring != "") {
          set var.destination = var.destination if(var.destination ~ "\?", "&", "?") var.querystring;
        }

        error 601 var.destination;
    }
}

sub vcl_error {
    // A 601 error should include the destination in its response.
    if (obj.status == 601 && obj.response) {
        set obj.status = 301;
        set obj.http.Location = obj.response;
        set obj.response = "Moved permanently";
    }

    // A 602 error should include the destination in its response.
    if (obj.status == 602 && obj.response) {
        set obj.status = 302;
        set obj.http.Location = obj.response;
        set obj.response = "Found";
    }
}
