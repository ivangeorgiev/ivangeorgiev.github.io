  // var freq = $s.freq(data, 'prcStgTotal,prcChkTotal,prcTdTotal,tstartAdj,filter,isWeekend'.split(',')); 

    var margin = {top: 80, right: 80, bottom: 80, left: 80},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m-%d").parse;
    var parseTimeMinutes = d3.time.format("%m/%d/%Y %H:%M").parse;


    // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    var x = d3.time.scale().range([0, width]),
        // y = d3.scale.linear().range([height, 0]),
        scaleStartedRes = d3.scale.linear().range([height, 0]),
        scaleStartedDay = d3.scale.linear().range([height, 0]),
        xAxis = d3.svg.axis().scale(x).ticks(15).tickSize(-height), // .tickSubdivide(true),
        axisStartedRes = d3.svg.axis().scale(scaleStartedRes).ticks(4).orient("left");
        axisStartedDay = d3.svg.axis().scale(scaleStartedDay).ticks(4).orient("right");


    // Add an SVG element with the desired dimensions and margin.
    var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    // Add the clip path.
    svg.append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

   // Add Scale Labels
   var labels = svg.append("g")
       .attr("class","labels")
     
  labels.append("text")
      .attr("transform", "translate(0," + height + ")")
      .attr("x", (width - margin.right))
      .attr("text-anchor", "right")
      .attr("dx", "-1.0em")  
      .attr("dy", "2.0em")
      .text("[Date/Time]");
  labels.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Number of Jobs Running");
    
    
    var title = svg.append("g")
        .attr("class","title");
    title.append("text")
        .attr("x", (width / 2))
        .attr("y", -30 )
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .text("DataStage Jobs Execution");

console.time('Read Data');
d3.tsv("data/FDW_32000_MANUAL_Speed1.tsv", transformRecord, function(error, rawData) {
  if (error) {
    console.error(error);
    return;
  }
  
  console.timeEnd('Read Data');
  console.log(rawData.length + ' records received');

  /* --------------- Prepare the Data ----------------- */
  console.time('filter');
  var values = rawData.filter(recordFilter).map(function(d) {
        return {x: d.tstartAdj, y: d.prcStgTotal, tstart: d.tstart, tstop: d.tstop };
      });
  console.timeEnd('filter');
  console.log(values.length + ' filtered records');
  
  // Convert input data to start/stop events
  var dataEvents = values.map(function(r) { return {event: r.tstart, start: 1, stop: 0} })
        .concat(values.map(function(r) { return {event: r.tstop, start: 0, stop: 1} }));

  groupSecond = $s.agg.groupBy(dataEvents, function(r) { return Math.trunc(r.event.getTime()/1000) * 1000;});
  eventsSecond = $s.agg.aggregate(groupSecond, {
        ts: $s.agg.group,
        pj: $s.agg.sum.field('start'),   /* parallel jobs */
        start: $s.agg.sum.field('start'), /* started */
        stop: $s.agg.sum.field('stop')    /* finished */
  });
  
  var resolutionInterval = 5*60*1000, // 5 minutes in ms
      dayInterval = 24*60*60*1000;      // 24 hours in ms
  /* Normalize events (resolution) */
  groupRes = $s.agg.groupBy(eventsSecond, function(r) { return Math.trunc(r.ts/resolutionInterval) * resolutionInterval;});
  eventsRes = $s.agg.aggregate(groupRes, {
        ts: $s.agg.group,
        minpj: $s.agg.min.field('pj'),   /* min jobs in parallel */
        maxpj: $s.agg.max.field('pj'),   /* max jobs in parallel  */
        start: $s.agg.sum.field('start'), /* started */
        stop: $s.agg.sum.field('stop')    /* finished */
  });
 
  // eventsRes = $s.shiftField(eventsRes, 'ts', -1).concat(eventsRes);
  eventsRes = eventsRes.sort( function(a, b) { return a.ts - b.ts; } );
  addDateFromTs(eventsRes, 'ts', 'event');
  
  /* Calcualte domain for normalized (resolution) events */
  var domainRes = $s.agg.aggregate($s.agg.groupBy(eventsRes, function(r) { return 'all'; } ),
        {
            maxpj: $s.agg.max.field('maxpj'),   /* max jobs in parallel  */
            maxstart: $s.agg.max.field('start'), /* started */
            mints : $s.agg.min.field('ts'),
            maxts : $s.agg.max.field('ts'),
    });
  domainRes = domainRes[0];
  
  /* Prepare daily events */
  groupDay = $s.agg.groupBy(eventsSecond, function(r) { return Math.trunc(r.ts/dayInterval) * dayInterval;});
  eventsDay = $s.agg.aggregate(groupDay, {
        ts: $s.agg.group,
        minpj: $s.agg.min.field('pj'),   /* min jobs in parallel */
        maxpj: $s.agg.max.field('pj'),   /* max jobs in parallel  */
        start: $s.agg.sum.field('start'), /* started */
        stop: $s.agg.sum.field('stop')    /* finished */
  });
  eventsDay = eventsDay.sort( function(a, b) { return a.ts - b.ts; } );
  addDateFromTs(eventsDay, 'ts', 'event');
  
  /* Calcualte domain for daily events */
  var domainDay = $s.agg.aggregate($s.agg.groupBy(eventsDay, function(r) { return 'all'; } ),
        {
            maxpj: $s.agg.max.field('maxpj'),   /* max jobs in parallel  */
            maxstart: $s.agg.max.field('start'), /* started */
            mints : $s.agg.min.field('ts'),
            maxts : $s.agg.max.field('ts'),
    });
  domainDay = domainDay[0];
  
  // Globalize so can work on console.
  window.dataEvents = dataEvents;
  window.groupRes = groupRes;
  window.eventsRes = eventsRes;
  window.domainRes = domainRes;
  window.groupDay = groupDay;
  window.eventsDay = eventsDay;
  window.domainDay = domainDay;
        
  /* --------------- Prepare the Axis ----------------- */
    // Compute the minimum and maximum date, and the y range.
    x.domain([new Date(Number(domainRes.mints).valueOf()), new Date(Number(domainRes.maxts).valueOf())] );
    // y.domain([0, yMax] );
    scaleStartedRes.domain([0, domainRes.maxstart]);
    scaleStartedDay.domain([0, domainDay.maxstart]);
    
  

    // Add the y-axis for daily started.
    svg.append("g")
      .attr("class", "y axis dayStart")
      .attr("transform", "translate(" + width + ",0)")
      .call(axisStartedDay);

    // Add the y-axis for running/executed.
    svg.append("g")
      .attr("class", "y axis running")
      .attr("transform", "translate(" + 0 + ",0)")
      .call(axisStartedRes);

    // xAxis = 
    var xAxis = d3.svg.axis()    // .scale(x).ticks(15).tickSize(-height)
        .scale(x)
        .orient("bottom")
        .ticks(15)
        .tickSize(-height);
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    /* Define Property Accessors */
    function getEvent(row) { return row.event; }
    function getParallel(row) { return row.maxpj; }
    function getRunning(row) { return row.start; }
        
    /* Define Generators */
    
    var lineRunning = d3.svg.line()
        .x(function(d) { return x(getEvent(d)); })
        .y(function(d) { return scaleStartedRes(getRunning(d)); });

    var lineParallel = d3.svg.line()
        .x(function(d) { return x(getEvent(d)); })
        .y(function(d) { return scaleStartedRes(getParallel(d)); });


    var lineDaily = d3.svg.line()
        .x(function(d) { return x(getEvent(d)); })
        .y(function(d) { return scaleStartedDay(getRunning(d)); });


    var areaRunning = d3.svg.area()
        // .interpolate("monotone")
        .x(function(d) { return x(getEvent(d)); })
        .y0(height)
        .y1(function(d) { return scaleStartedRes(getRunning(d)); });
        
    /* Create the chart elements paths */
    
    svg.append("path")
          .attr("class", "area running")
          .attr("clip-path", "url(#clip)");
        
    svg.append("path")
        .attr("class", "line running")
        .attr("clip-path", "url(#clip)");
        
    svg.append("path")
        .attr("class", "line daily")
        .attr("clip-path", "url(#clip)");
        
    svg.append("path")
        .attr("class", "line parallel")
        .attr("clip-path", "url(#clip)");


    /* ------------------------------------------------------------*/
    
    var zoom = d3.behavior.zoom().scaleExtent([1, 1000]).on("zoom", drawZoom);
    svg.append("rect")
        .attr("class", "pane")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);
      
    zoom.x(x);
    // zoom.y(y);
    
    /* --------- assign data to chart elements --------------- */
    svg.select("path.line.running").data([eventsRes]);
    svg.select("path.area.running").data([eventsRes]);
    svg.select("path.line.parallel").data([eventsRes]);
    svg.select("path.line.daily").data([eventsDay]);
    
    drawZoom();

    // render the table
    var dataTable = tabulate(eventsDay, ["event", "start", "stop", "maxpj"]);

    function drawZoom() {
        svg.select("g.x.axis").call(xAxis);
        svg.select("path.area.running").attr("d", areaRunning);
        // svg.select("path.line.running").attr("d", lineRunning);
        svg.select("path.line.parallel").attr("d", lineParallel);
        svg.select("path.line.daily").attr("d", lineDaily);
    }
    
    
    
    
    
    // The table generation function
    function tabulate(data, columns) {
        var table = d3.select("body").append("table")
                .attr("style", "margin-left: 250px"),
            caption = table.append("caption").text("Daily Job Execution"),
            thead = table.append("thead"),
            tbody = table.append("tbody");

        // append the header row
        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
                .text(function(column) { return column; });

        // create a row for each object in the data
        var rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr");

        // create a cell in each row for each column
        var cells = rows.selectAll("td")
            .data(function(row) {
                return columns.map(function(column) {
                    return {column: column, value: row[column]};
                });
            })
            .enter()
            .append("td")
            .attr("style", "font-family: Courier") // sets the font style
                .html(function(d) { return d.value; });
        
        return table;
    }

});

/* Object property accessor factory */
function propertyAccessor(fld) {
    return function (obj) { return obj[fld]; }
}

var minDate = new Date(2015, 04, 01);
var maxDate = new Date(2035, 04, 13);
console.log(minDate);
function recordFilter(d) {
    return (d.filter) && (! d.isWeekend) && (minDate.getTime() <= d.tstart.getTime()) && (d.tstart.getTime() <= maxDate.getTime()) ;
}

// Transform the raw record.
function transformRecord(d) {
    d.prcStgTotal = Number.parseFloat(d.prcStgTotal.replace('%', ''));
    d.prcChkTotal = Number.parseFloat(d.prcChkTotal.replace('%', ''));
    d.prcTdTotal = Number.parseFloat(d.prcTdTotal.replace('%', ''));
    d.tstart = parseTimeMinutes(d.tstart);
    d.tstop = parseTimeMinutes(d.tstop);
    d.tstartAdj = parseDate(d.tstartAdj);
    d.filter = d.filter == 'TRUE';
    d.isWeekend = d.isWeekend == 'TRUE';
  return d;
}

function addDateFromTs(data, tsfield, datefield) {
    data.forEach(function(r) { r[datefield] = new Date(Number(r[tsfield]).valueOf()); });
    return data;
}


