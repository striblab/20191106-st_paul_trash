import 'intersection-observer';
import * as d3 from 'd3';
import * as topojson from "topojson";
import us from '../sources/stpaul_pct.json';


class Map {

    constructor(target) {
        this.target = target;
        this.svg = d3.select(target + ' svg')
            .attr('width', $(target).outerWidth())
            .attr('height', $(target).outerHeight());
        this.g = this.svg.append('g');
        this.zoomed = false;
        this.scaled = $(target).width() / 520;
        this.colorScale = d3.scaleOrdinal()
            .domain(['d1', 'd2'])
            .range(['#B6AED4', '#DEA381']);
        this.colorScale2 = d3.scaleOrdinal()
            .domain(['d1', 'd2'])
            .range(['#B6AED4', '#DEA381']);
    }

    /********** PRIVATE METHODS **********/

    // Detect if the viewport is mobile or desktop, can be tweaked if necessary for anything in between
    _detect_mobile() {
        var winsize = $(window).width();

        if (winsize < 600) {
            return true;
        } else {
            return false;
        }
    }

    _clickmn(district) {
        //D3 CLICKY MAP BINDINGS
        jQuery.fn.d3Click = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        jQuery.fn.d3Down = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        jQuery.fn.d3Up = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };


        // Your mouse clicks are actually three events, which are simulated here to auto-zoom the map on a given id of a map path object
        $("[id='" + district + "']").d3Down();
        $("[id='" + district + "']").d3Up();
        $("[id='" + district + "']").d3Click();

    }

    _populate_colors(filtered, magnify, party, geo, race, data) {

        var self = this;

        var index = Number(filtered);

        if (filtered != "all") {
            $(".district").addClass("faded");
            $(".county").addClass("hidden");
            $("." + filtered).removeClass("faded");
            $(".CD1, .CD2, .CD3, .CD4, .CD5, .CD6, .CD7, .CD8").addClass("infocus");
            $(".district").removeClass("hidden");
            $("#P" + race).addClass("hidden");
        } else {
            $(".CD1, .CD2, .CD3, .CD4, .CD5, .CD6, .CD7, .CD8").removeClass("infocus");
            $(".CD1, .CD2, .CD3, .CD4, .CD5, .CD6, .CD7, .CD8").removeClass("hidden");
            $(".district").addClass("hidden");
            // $(".county").addClass("hidden");
        }

        //RENDER CANDIDATE KEYS
        var candidateThread = "";

        var candidateList = [];

        if (party == "GOP") {
            candidateList.push([self.colorScale("r1"), data[0].r1_name, data[0].r1]);
            candidateList.push([self.colorScale("r2"), data[0].r2_name, data[0].r2]);
           if (data[0].r3_name != null && data[0].r3_name != "null")  { candidateList.push([self.colorScale("r3"), data[0].r3_name, data[0].r3]); }
           if (data[0].r4_name != null && data[0].r4_name != "null")  { candidateList.push([self.colorScale("r4"), data[0].r4_name, data[0].r4]); }
        } else if (party == "DFL") {
            candidateList.push([self.colorScale("d1"), data[0].d1_name, data[0].d1]);
            candidateList.push([self.colorScale("d2"), data[0].d2_name, data[0].d2]);
            if (data[0].d3_name != null && data[0].d3_name != "null")  { candidateList.push([self.colorScale("d3"), data[0].d3_name, data[0].d3]); }
            if (data[0].d4_name != null && data[0].d4_name != "null")  { candidateList.push([self.colorScale("d4"), data[0].d4_name, data[0].d4]); }
            if (data[0].d5_name != null && data[0].d5_name != "null")  { candidateList.push([self.colorScale("d5"), data[0].d5_name, data[0].d5]); }
            if (data[0].d6_name != null && data[0].d6_name != "null")  { candidateList.push([self.colorScale("d6"), data[0].d6_name, data[0].d6]); }
        }

        function sortCandidates(a, b) {
            if (a[2] === b[2]) {
                return 0;
            } else {
                return (a[2] > b[2]) ? -1 : 1;
            }
        }

        candidateList.sort(sortCandidates);

            d3.helper = {};

            var tooltip = function(accessor) {
                return function(selection) {
                    var tooltipDiv;
                    var bodyNode = d3.select('body').node();
                    selection.on("mouseover", function(d, i) {
                            // Clean up lost tooltips
                            d3.select('body').selectAll('div.tooltip').remove();
                            // Append tooltip
                            tooltipDiv = d3.select('body').append('div').attr('class', 'tooltip');
                            var absoluteMousePos = d3.mouse(bodyNode);
                            tooltipDiv.style('left', (absoluteMousePos[0] + 10) + 'px')
                                .style('top', (absoluteMousePos[1] - 15) + 'px')
                                .style('position', 'absolute')
                                .style('z-index', 1001);
                            // Add text using the accessor function
                            var tooltipText = accessor(d, i) || '';
                            // Crop text arbitrarily
                            //tooltipDiv.style('width', function(d, i){return (tooltipText.length > 80) ? '300px' : null;})
                            //    .html(tooltipText);
                        })
                        .on('mousemove', function(d, i) {
                            // Move tooltip
                            var absoluteMousePos = d3.mouse(bodyNode);
                            tooltipDiv.style('left', (absoluteMousePos[0] + 10) + 'px')
                                .style('top', (absoluteMousePos[1] - 15) + 'px');
                            var tooltipText = accessor(d, i) || '';
                            tooltipDiv.html(tooltipText);
                            $("#tip").html(tooltipText);
                            if (self._detect_mobile() == true) {
                                $("#tip").show();
                                $(".key").hide();
                            }
                        })
                        .on("mouseout", function(d, i) {
                            // Remove tooltip
                            tooltipDiv.remove();
                            $("#tip").hide();
                            $(".key").show();
                            $("#tip").html("");
                        });

                };
            };

            this.g.selectAll('.precincts path')
                .call(tooltip(function(d, i) {
                    var candidates = [];
                    var votes = 0;
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].match == (d.properties.CountyID + d.properties.CongDist + d.properties.MNLegDist + d.properties.PCTCODE)) {
                            if (party == 'DFL') {
                                candidates.push([data[i].d1_name, data[i].d1, self.colorScale('d1')]);
                                candidates.push([data[i].d2_name, data[i].d2, self.colorScale('d2')]);
                                if (data[0].d3_name != null && data[0].d3_name != "null")  {candidates.push([data[i].d3_name, data[i].d3, self.colorScale('d3')]); }
                                if (data[0].d4_name != null && data[0].d4_name != "null")  {candidates.push([data[i].d4_name, data[i].d4, self.colorScale('d4')]); }
                                if (data[0].d5_name != null && data[0].d5_name != "null")  {candidates.push([data[i].d5_name, data[i].d5, self.colorScale('d5')]); }
                                if (data[0].d6_name != null && data[0].d6_name != "null") { candidates.push([data[i].d6_name, data[i].d6, self.colorScale('d6')]); }
                                votes = data[i].dVotes;
                            } else if (party == 'GOP') {
                                candidates.push([data[i].r1_name, data[i].r1, self.colorScale('r1')]);
                                candidates.push([data[i].r2_name, data[i].r2, self.colorScale('r2')]);
                                if (data[0].r3_name != null && data[0].r3_name != "null") { candidates.push([data[i].r3_name, data[i].r3, self.colorScale('r3')]); }
                                votes = data[i].rVotes;
                            }

                            function sortCandidates(a, b) {
                                if (a[1] === b[1]) {
                                    return 0;
                                } else {
                                    return (a[1] > b[1]) ? -1 : 1;
                                }
                            }

                            candidates.sort(sortCandidates);

                            var tipString = "";

                            for (var j=0; j < candidates.length; j++){
                                tipString = tipString + "<div class='tipRow'><div class='canName'>" + candidates[j][0] + "</div><div class='legendary votepct' style='background-color:" + candidates[j][2] + "'>" + d3.format(".1f")(candidates[j][1]) + "%</div></div>";
                            }
                            if (candidates[0][0] == 0) { return d.properties.Precinct + "<div>No results</div>"; } 
                            else { return d.properties.Precinct + " " + tipString + "<div class='votes'>Votes: " + d3.format(",")(votes) + "</div>"; }
                        }
                    }
                    return d.properties.Precinct + "<div>No results</div>";
                }))
                .transition()
                .duration(600)
                .attr('class', function(d){
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].match == (d.properties.CountyID + d.properties.CongDist + d.properties.MNLegDist + d.properties.PCTCODE)) {
                            return 'precinct CD' + d.properties.PrecinctID;
                        } 
                    }
                    return 'precinct noclicky CD' + d.properties.PrecinctID;
                })
                .style('fill', function(d) {
                    var winner = '';
                    var winner_sat = '';
                    var margin = '';
                    var candidates;
                    var count = 0;

                    for (var i = 0; i < data.length; i++) {
                        if (data[i].match == (d.properties.CountyID + d.properties.CongDist + d.properties.MNLegDist + d.properties.PCTCODE)) {
                            if (party == 'DFL') {
                                winner_sat = self.colorScale2(data[i].dWin);
                                winner = self.colorScale(data[i].dWin);
                                margin = data[i].dMargin;
                                candidates = [data[i].d1,data[i].d2,data[i].d3,data[i].d4,data[i].d5,data[i].d6];
                            }
                            for (var k=0; k < candidates.length; k++) { if (candidates[k] == margin) { count++; } }
                            var colorIntensity = d3.scaleLinear().domain([1, 100]).range([winner, winner_sat]);
                            if (margin != 0 && count < 2) { return colorIntensity(margin); }
                            else { return '#eeeeee'; }
                        }
                    }
                    return '#eeeeee';
                });

            if (magnify == "metro") {
                self._clickmn(self.target + "P271230760");
                $(".reset").hide();
            }

    }

    /********** PUBLIC METHODS **********/

    // Render the map
    render(filtered, magnify, party, geo, race, data) {
        var self = this;

            var projection = d3.geoAlbers().scale(5037).translate([50, 970]);

            var width = 520;
            var height = 400;
            var centered;

            var path = d3.geoPath(projection);

            var states = topojson.feature(us, us.objects.stpaul_pct);
            var state = states.features.filter(function(d) {
                return d.properties.CONGDIST == filtered;
            })[0];

            var b = path.bounds(state),
                s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

            var cachedWidth = window.innerWidth;
            d3.select(window).on('resize', function() {
                var newWidth = window.innerWidth;
                if (newWidth !== cachedWidth) {
                    cachedWidth = newWidth;
                }
            });


            //Draw precincts
            self.g.append('g')
                .attr('class', 'precincts') 
                .selectAll('path')
                .data((topojson.feature(us, us.objects.stpaul_pct).features).filter(function(d) {
                    if (filtered != "all") {
                        return d.properties.CONGDIST == race;
                    } else {
                        return d.properties.CONGDIST != 'blarg';
                    }
                }))
                .enter().append('path')
                .attr('d', path)
                .attr('id', function(d) {
                    return self.target + 'P' + d.properties.PrecinctID;
                })
                .style('stroke-width', '0.2px')
                .style('fill', '#dddddd')
                .on('mouseover', function(d) {

                })
                .on('click', function(d) {
                    clicked(d, 39);
                });

            function clicked(d, k) {
                var x, y, stroke;

                // if (d && centered !== d) {
                var centroid = path.centroid(d);
                x = centroid[0];
                y = centroid[1];
                centered = d;
                stroke = 0.2;

                $(".city-label").addClass("hidden");
                $(".mark").addClass("hidden");

                self.g.transition()
                    .duration(300)
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
                    .style('stroke-width', '0.2px');


                $('.reset').on('click touch', function(event) {
                    x = width / 2;
                    y = height / 2;
                    k = 1;
                    centered = null;
                    $(this).hide();
                    stroke = 1.5;
                    $("#tip").hide();
                    $(".key").show();
                    // self.g.selectAll('path')
                    //     .classed('active', centered && function(d) { return d === centered; });
                    self.g.transition()
                        .duration(300)
                        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
                        .style('stroke-width', stroke / k + 'px');
                    event.stopPropagation();

                    setTimeout(function() {
                        // $(".CD1, .CD2, .CD3, .CD4, .CD5, .CD6, .CD7, .CD8").removeClass("infocus");
                        // $(".district").removeClass("hidden");
                        $(".city-label").removeClass("hidden");
                        $(".mark").removeClass("hidden");
                    }, 400);
                });

            }


            var aspect = 520 / 400,
                chart = $(self.target + ' svg');
            var targetWidth = chart.parent().width();
            chart.attr('width', targetWidth);
            chart.attr('height', targetWidth / aspect);
            if ($(window).width() <= 520) {
                $(self.target + ' svg').attr('viewBox', '0 0 500 500');
            }

            $(window).on('resize', function() {
                targetWidth = chart.parent().width();
                chart.attr('width', targetWidth);
                chart.attr('height', targetWidth / aspect);
            });
        
        //COLOR THE MAP WITH LOADED DATA
            self._populate_colors(filtered, magnify, party, geo, race, data);


    }
}

export {
    Map as
    default
}