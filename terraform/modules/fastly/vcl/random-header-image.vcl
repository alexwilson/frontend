table potential_header_images {
  "0": "https://images.unsplash.com/photo-1603186744434-c3884b484291",
  "1": "https://images.unsplash.com/photo-1603186568789-159c2c62ade1",
  "2": "https://images.unsplash.com/photo-1603187430252-10c169c59608",
  "3": "https://images.unsplash.com/photo-1599511971355-6489fdbbfcc0",
  "4": "https://images.unsplash.com/photo-1599511971455-cc69549b09e8",
  "5": "https://images.unsplash.com/photo-1599512011173-da8b4bf85101"
}

sub vcl_recv {
    declare local var.key STRING;
    declare local var.table_length INTEGER;

    # Maximum key in potential_header_images.
    set var.table_length = 5;

    if (req.url.path ~ "^/__service/random-header-image$") {
        set var.key = std.itoa(randomint(0, var.table_length));
        error 602 table.lookup(potential_header_images, var.key);
    }
}
