var epeek_theme_track_track_minimal = function() {

    var theme = function(gB, div) {
	gB(div);

	gB.right (1000);

	// Block Track1
	var block_track = epeek.track.track()
	    .height(30)
	    .background_color("#FFCFDD")
	    .data(epeek.track.data()
		  .update(
		      epeek.track.retriever.sync()
			  .retriever (function () {
			      return [
				  {
				      start : 20,
				      end   : 100
				  }
			      ]
			  })
		  )
		 )
	    .display(epeek.track.feature.block()
		     .foreground_color("blue")
		     .index(function (d) {
			 return d.start;
		     }));

	// Axis Track1
	var axis_track = epeek.track.track()
	    .height(30)
	    .background_color("white")
	    .display(epeek.track.feature.axis()
		     .orientation("top")
		    );

	// Location Track1
	var loc_track = epeek.track.track()
	    .height(30)
	    .background_color("white")
	    .display(epeek.track.feature.location());

	gB
	    .add_track(loc_track)
	    .add_track(axis_track)
	    .add_track(block_track);

	gB.start();
    };

    return theme;
};
