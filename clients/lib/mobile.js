function getLoc() {
    var url = document.createElement("a");
    url.href=document.URL;
    var loc = url.search;
    if (loc.indexOf("loc=") === 1) {   <!-- Search term starts by "loc=" -->
				       loc = loc.substring(5);
				       console.log("LOC TO PARSE IS: " + loc);
				   }
    return loc;
}

var epeek_theme = function() {
    "use strict";

    // Regular expressions for user input
    // TODO: species:gene?
    // TODO: Duplicated in default.js
    var loc_re = /^(\w+):(\w+):(\d+)-(\d+)$/;
    var ens_re = /^ENS\w+\d+$/;

    var gBrowser;
    var gBrowserTheme = function(gB, div) {
	gBrowser = gB;

	// Callbacks:
	// TODO: gBrowserTheme.highlight needs to be exported? I don't think so, rename to highlight?
	gBrowser.gene_info_callback = gene_info_callback;
	gBrowser.orthologues_callback = gBrowserTheme.orthologues_cbak;
	var loc = getLoc();

	if (gBrowserTheme.isLocation(loc)) {
	    gBrowserTheme.parseLocation(loc);
	} else {
	    gBrowser.gene(loc);
	}

	gBrowser(div);
	if (gBrowser.gene() !== undefined) {
	    gBrowser.get_gene(gBrowser.gene());
	} else {
	    gBrowser.start();
	}

	gBrowserTheme.orientationChange();

    };

    // TODO: What happens on error? i.e. if the string is not a valid location
    // TODO: We can make it smarter? allowing for examples species:gene?

    /** <strong>parseLocation</strong> takes a string as input and guesses a location
        The expected location should be on the form:
        species:chr:from-to
    */
    gBrowserTheme.parseLocation = function(loc) {
	var loc_arr = loc_re.exec(loc);
	gBrowser.species(loc_arr[1]);
	gBrowser.chr(loc_arr[2]);
	gBrowser.from(loc_arr[3]);
	gBrowser.to(loc_arr[4]);

	return gBrowserTheme;
    };

    // TODO: Can be abstracted out? (This is also defined in clients/lib/default.js)
    /** <strong>isLocation</strong> returns true if the argument looks like a location of the form
	species:chr:from-to or false otherwise
    */
    gBrowserTheme.isLocation = function(term) {
	if (term.match(loc_re)) {
	    return true;
	} else {
	    return false;
	}
    };


    /**
     */
    gBrowserTheme.orthologues_cbak = function (orthologues) {
	var orth_select = d3.select("#ePeek_orthologues_select")
	    .attr("id", "ePeek_orth_select");

	orth_select
	    .append("option")
	    .attr("class", "ePeek_orth_option")
	    .text("-- Jump to ortholog --")

	orth_select.selectAll("option2")
	    .data(orthologues, function(d){return d.id})
	    .enter()
	    .append("option")
	    .attr("class", "ePeek_orth_option")
	    .attr("value", function(d) {return d.id})
	    .text(function(d) {return d.id + " (" + d.species + " - " + d.type + ")"});
	
	// We fill the number of orthologues in the tab label
	d3.select("#ePeek_orthologues_label")
	    .html("Orthologues [" + (orthologues === undefined ? 0 : orthologues.length) + "]");


	// We listen on orthologues options
	orth_select.on("change", function() {
//	    d3.select("#ePeek_" + div_id + "_ensGene_select").remove();
	    gBrowser.ensGene_lookup(this.value);
	});
 

    };

    var gene_info_callback = function(gene) {
	// We first remove previous data and elements
//	d3.select("#gene_content div").remove();
	d3.select("#gene_content ul").remove();

	// We update the text of the header in the info div
	d3.select("#gene_info h1").text(gene.external_name);
	
	// We then populate the gene info
	var gene_info_items_list = d3.select("#gene_content")
	    .append("ul")
	    .attr("class", "edgetoedge scroll");

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .text("Gene Info")

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Ensembl ID: </em>" + gene.ID);

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Description: </em>" + gene.description);

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Source: </em>" + gene.logic_name);

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .html("Location");

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Current species: </em>" + gBrowser.species());

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .html("<em>Location: </em>" + gene.seq_region_name + ":" + gene.start + "-" + gene.end + " (Strand: " + (gene.strand === "1" ? "+" : "-") + ")");

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .attr("id", "ePeek_orthologues_label")
	    .html("Orthologues");

	gene_info_items_list
	    .append("li")
	    .attr("class", "rounded")
	    .append("select")
	    .attr("id", "ePeek_orthologues_select");

	gene_info_items_list
	    .append("li")
	    .attr("class", "sep")
	    .html("Open " + gene.external_name + " in...");

	gene_info_items_list
	    .append("li")
	    .attr("class", "arrow")
	    .append("a")
	    .attr("href", gBrowserTheme.buildEnsemblGeneLink(gene.ID))
	    .attr("target", "_blank")
	    .append("img")
	    .attr("src", "ensembl_logo_small.png");

	// Fill the orthologues select
	gBrowser.orthologues(gene.ID);

	// TODO: This way of getting to the gene_info div prevents the use of
	// transitions. We may find a better way!
	window.location.href="#gene_info";

    };

    // TODO: Duplicated in default.js
    /** <strong>buildEnsemblGeneLink</strong> returns the Ensembl url pointing to the gene summary given in as argument
	The gene id shouuld be a valid ensembl gene id of the form "ENSG......XXXX"
    */
    gBrowserTheme.buildEnsemblGeneLink = function(ensID) {
	//"http://www.ensembl.org/Homo_sapiens/Gene/Summary?g=ENSG00000139618"
	var url = "http://www.ensembl.org/" + gBrowser.species() + "/Gene/Summary?g=" + ensID;
	return url;
    };


    gBrowserTheme.orientationChange = function() {

	// Default Android browser based on the WebKit engine
	// which also powers the Safari browser on desktops, laptops and Apple's iOS-based mobile devices
	// doesn't seem to understand window.matchMedia, so we need to use this alternative.
	window.onorientationchange = function() {
	    // Strangely enough, default android browser reverses clientWidth and clientHeight?
	    // TODO: Post a question somewhere? (StackOverflow?) -> DONE
	    // TODO: It seems that introducing a short delay (500ms) the clientWidth and clientHeight are properly set
            setTimeout(function() {
		// This may be needed for IE for mobiles?
		//        var w=window.innerWidth
		//           || document.documentElement.clientWidth
		//           || document.body.clientWidth;
	    
		var w = document.documentElement.clientWidth;
		gBrowser.resize(w-20);
            }, 500);
	}
    };


    return gBrowserTheme;
    
};