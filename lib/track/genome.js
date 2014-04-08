"use strict"

epeek.track.genome = function() {

    // Private vars
    var ens_re = /^ENS\w+\d+$/;
    var eRest = epeek.eRest();
    var chr_length;

    // Vars exposed in the API
    var gene;
    var xref_search_cbak = function () {};
    var ensgene_search_cbak = function () {};
    var limits = {
        left : 0,
	right : undefined,
	zoom_out : eRest.limits.region,
	zoom_in  : 200
    };


    // We "inherit" from track
    var genome_browser = epeek.track();

    // The location and axis track
    var location_track = epeek.track.track()
	.height(20)
	.foreground_color("black")
	.background_color("white")
	.data(epeek.track.data.empty())
	.display(epeek.track.feature.location());

    var axis_track = epeek.track.track()
	.height(20)
	.foreground_color("black")
	.background_color("white")
	.data(epeek.track.data.empty())
	.display(epeek.track.feature.axis());

    genome_browser
	.add_track(location_track)
	.add_track(axis_track);

    // Default location:
    genome_browser.species("human");
    genome_browser.chr(7);
    genome_browser.from(139424940);
    genome_browser.to(141784100);

    // We save the start method of the 'parent' object
    genome_browser._start = genome_browser.start;

    // We hijack parent's start method
    genome_browser.start = function (where) {
	if (where !== undefined) {
	    if (where.gene !== undefined) {
		get_gene(where);
		return;
	    } else {
		if (where.species === undefined) {
		    where.species = genome_browser.species();
		} else {
		    genome_browser.species(where.species);
		}
		if (where.chr === undefined) {
		    where.chr = genome_browser.chr();
		} else {
		    genome_browser.chr(where.chr);
		}
		if (where.from === undefined) {
		    where.from = genome_browser.from();
		} else {
		    genome_browser.from(where.from)
		}
		if (where.to === undefined) {
		    where.to = genome_browser.to();
		} else {
		    genome_browser.to(where.to);
		}
	    }
	} else { // "where" is undef so look for gene or loc
	    if (genome_browser.gene() !== undefined) {
		get_gene({ species : genome_browser.species(),
			   gene    : genome_browser.gene()
			 });
		return;
	    } else {
		where = {};
		where.species = genome_browser.species(),
		where.chr     = genome_browser.chr(),
		where.from    = genome_browser.from(),
		where.to      = genome_browser.to()
	    }
	}

	genome_browser.limits(function (done) {
	    // Get the chromosome length and use it as the 'right' limit
	    eRest.call({url : eRest.url.chr_info ({species : where.species,
						   chr     : where.chr
						  }),
			success : function (resp) {
			    done({
				right : resp.length,
				left  : 0,
				zoom_in : 200,
				zoom_out : eRest.limits.region
			    });
			}
		       });
	});
	genome_browser._start();
    };

    genome_browser.homologues = function (ensGene, callback)  {
	eRest.call({url : eRest.url.homologues ({id : ensGene}),
		    success : function(resp) {
			var homologues = resp.data[0].homologies;
			if (callback !== undefined) {
			    var homologues_obj = split_homologues(homologues)
			    callback(homologues_obj);
			}
		    }
		   });
    }

    var isEnsemblGene = function(term) {
	if (term.match(ens_re)) {
            return true;
        } else {
            return false;
        }
    };

    var get_gene = function (where) {
	if (isEnsemblGene(where.gene)) {
	    get_ensGene(where.gene)
	} else {
	    eRest.call({url : eRest.url.xref ({ species : where.species,
						name    : where.gene 
					      }
					     ),
			success : function(resp) {
			    resp = resp.filter(function(d) {
				return !d.id.indexOf("ENS");
			    });
			    if (resp[0] !== undefined) {
				xref_search_cbak(resp);
				get_ensGene(resp[0].id)
			    } else {
				genome_browser.start();
			    }
			}
		       }
		      );
	}
    };

    var get_ensGene = function (id) {
	eRest.call({url     : eRest.url.gene ({id : id}),
		    success : function(resp) {
			ensgene_search_cbak(resp);

			genome_browser
			    .species(resp.species)
			    .chr(resp.seq_region_name)
			    .from(resp.start)
			    .to(resp.end);

			genome_browser.start( { species : resp.species,
					  chr     : resp.seq_region_name,
					  from    : resp.start,
					  to      : resp.end
					} );
		    }
		   });
    };

    var split_homologues = function (homologues) {
	var orthoPatt = /ortholog/;
	var paraPatt = /paralog/;

	var orthologues = homologues.filter(function(d){return d.type.match(orthoPatt)});
	var paralogues  = homologues.filter(function(d){return d.type.match(paraPatt)});

	return {'orthologues' : orthologues,
		'paralogues'  : paralogues};
    };

    genome_browser.gene = function(g) {
	if (!arguments.length) {
	    return gene;
	}
	gene = g;
	return genome_browser;
    };

    genome_browser.xref_search = function (cbak) {
	if (!arguments.length) {
	    return xref_search_cbak;
	}
	xref_search_cbak = cbak;
	return genome_browser;
    };

    genome_browser.ensgene_search = function (cbak) {
	if (!arguments.length) {
	    return ensgene_search_cbak;
	}
	ensgene_search_cbak = cbak;
	return genome_browser;
    };

    return genome_browser;
};

