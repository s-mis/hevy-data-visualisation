
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; //import D3

//variable containing reference to data
var data;
var sets_per_week;
var benchData;
var deadliftData;
var squatData;

const color = "gold"

// area variables
var radialBarchartArea;
var pictogramsArea;
var lineChartsArea1;
var lineChartsArea2;
var lineChartsArea3;
var radialChartArea;
var horizontalBarArea;

const monthNames = ['NOV', 'DEC','JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'];

const rpeMap = new Map([
  [6, 4],
  [7, 3],
  [7.5, 2],
  [8, 2],
  [8.5, 1],
  [9, 1],
  [9.5, 0],
  [10, 0]
]);

const muscleGroups = ['Biceps', 'Calves', 'Chest', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Quads', 'Shoulders', 'Triceps', 'Upper Back'];

const muscleCategoryMap = new Map();


// selected week
var selected_week;
var previous_selected_week;
var tooltip;

var gradientSetsPerGroup;
var colorGr;

var colorRpe = d3.scaleLinear()
                .domain([6,7.5, 8, 10])
                .range([color,color, 'green', 'green']);;
                ;
var colorGr = d3.scaleLinear()
                .domain([0,12, 15,20,23, 29])
                .range([color,color, 'green', 'green',"red", "red"]);;

var colorRadBars = d3.scaleLinear()
                     .domain([0,90,100,111])
                     .range([color,'green','green',"red"])

/*Loading data from CSV file and editing the properties to province codes. Unary operator plus is used to save the data as numbers (originally imported as string)*/
d3.csv("./public/workout_data_preprocessed.csv", function(d) {
  return {
    title: d["title"],
    time: d["start_time"],
    exercise_title: d["exercise_title"],
    weight: +d["weight_kg"],
    reps: +d["reps"],
    rpe: +d["rpe"],
    week_of_a_year: +d["week_of_a_year"],
    muscle_group: d["muscle_group"]
  }
})
  .then(function(csvData) {
    //store loaded data in global variable
    data = csvData;
    sets_per_week = d3.rollup(data, (D) => D.length, (d) => d.week_of_a_year)
    benchData = data.filter(function(d){return d["exercise_title"] === "Bench Press (Barbell)" || d["exercise_title"] === "Incline Bench Press (Barbell)"})
    deadliftData = data.filter(function(d){return d["exercise_title"].includes("Deadlift")})
    squatData = data.filter(function(d){return d["exercise_title"].includes("Squat")})
    
    init();

    // data visualization
    visualization();
  });

/*----------------------
INITIALIZE VISUALIZATION
----------------------*/
function init() {
    
  //d3 canvases for svg elements
  muscleGroups.forEach(muscle => {
    if (muscle.toLowerCase().includes('bicep') || muscle.toLowerCase().includes('tricep')) {
      muscleCategoryMap.set(muscle, 'Arms');
    } else if (muscle.toLowerCase().includes('chest')) {
      muscleCategoryMap.set(muscle, 'Chest');
    } else if (muscle.toLowerCase().includes('back') || muscle.toLowerCase().includes('lat')) {
      muscleCategoryMap.set(muscle, 'Back');
    } else if (muscle.toLowerCase().includes('shoulder')) {
      muscleCategoryMap.set(muscle, 'Shoulders');
    } else if (muscle.toLowerCase().includes('leg') || muscle.toLowerCase().includes('quad') || muscle.toLowerCase().includes('hamstring') || muscle.toLowerCase().includes('glute') || muscle.toLowerCase().includes('calves')) {
      muscleCategoryMap.set(muscle, 'Legs');
    } else {
      muscleCategoryMap.set(muscle, 'Other');
    }
  });
  
  selected_week = 1;
  previous_selected_week = 1;

  lineChartsArea1 = d3.select("#lineCharts_div").append("svg")
    .attr("id", "lineChart1")
    .attr("width", d3.select("#lineCharts_div").node().clientWidth)
    .attr("height", d3.select("#lineCharts_div").node().clientHeight/3)
  lineChartsArea2 = d3.select("#lineCharts_div").append("svg")
    .attr("id", "lineChart2")
    .attr("width", d3.select("#lineCharts_div").node().clientWidth)
    .attr("height", d3.select("#lineCharts_div").node().clientHeight/3)
  lineChartsArea3 = d3.select("#lineCharts_div").append("svg")
    .attr("id", "lineChart3")
    .attr("width", d3.select("#lineCharts_div").node().clientWidth)
    .attr("height", d3.select("#lineCharts_div").node().clientHeight/3)
} 


/*----------------------
BEGINNING OF VISUALIZATION
----------------------*/
function visualization() {

  drawradialBarchart();
  drawlineCharts();
  drawPolarChart();
  drawHorizontalBarchart();
  drawPictogramsArea();
}


function drawradialBarchart(){
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = d3.select("#radialBarchart_div").node().clientWidth - margin.left - margin.right,
  height = d3.select("#radialBarchart_div").node().clientHeight - margin.top - margin.bottom,
  innerRadius = 90,
  outerRadius = Math.min(width, height) / 2;   // the outerRadius goes from the middle of the SVG area to the border

  radialBarchartArea = d3.select("#radialBarchart_div").append("svg")
    .attr("id", "radBarChart")
    .attr("width", d3.select("#radialBarchart_div").node().clientWidth)
    .attr("height", d3.select("#radialBarchart_div").node().clientHeight)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + ( height/2 )+ ")");
    

  var x = d3.scaleBand(
    d3.range(1,53),
    [ 0, 2 * Math.PI ]);

  var y = d3.scaleRadial()
            .range([innerRadius, outerRadius]) 
            .domain([0, 120]);

    // Color gradient legend
  var gradient = d3.select("#radialBarchart_div").select("svg").append("linearGradient")
                        .attr("id", "svgGradient")
                        .attr("x1", "0%")
                        .attr("y1", "0%")
                        .attr("x2", "0%")
                        .attr("y2", "100%")
  gradient.append("stop")
          .attr("offset","0%")
          .attr("stop-color",color)
  gradient.append("stop")
          .attr("offset","50%")
          .attr("stop-color","green")
  gradient.append("stop")
          .attr("offset","100%")
          .attr("stop-color","red")

  d3.select("#radialBarchart_div").select("svg").append("rect")
                 .attr("fill", "url(#svgGradient)")
                 .attr("x", width - 25)
                 .attr("y", height/6)
                 .attr("width", 25)
                 .attr("height", height/1.5)

  // add text to the legend
  d3.select("#radialBarchart_div").select("svg").append("text")
    .attr("class","descrleg")
    .attr("x", width - 30)
    .attr("y", height/6 + 10) 
    .attr("text-anchor","end")
    .text("Undertraining")
    .style("fill", "black")        
  d3.select("#radialBarchart_div").select("svg").append("text")
    .attr("class","descrleg")
    .attr("x", width - 30)
    .attr("y", height/6  + height/1.5) 
    .attr("text-anchor","end")
    .text("Overtraining")
    .style("fill", "black")     
  d3.select("#radialBarchart_div").select("svg").append("text")
    .attr("class","descrleg")
    .attr("x", width - 30)
    .attr("y", height/6  + (height/1.5)/2) 
    .attr("text-anchor","end")
    .text("Optimal")
    .style("fill", "black")     

  tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("position", "absolute")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

  for(let i=1; i <= 52; i++){
    let sets = sets_per_week.get(i) === undefined ? 0 : sets_per_week.get(i);
    radialBarchartArea
    .append("path")
    .attr("id", i)
    .attr("fill", colorRadBars(sets))
    .attr("d", d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(y(sets))
      .startAngle(x(i))
      .endAngle(x(i) + x.bandwidth())
      .padAngle(0.01)
      .padRadius(innerRadius))
    .on("click", function(d) {
      previous_selected_week = selected_week;
      selected_week = this.id;
      drawPolarChart();
      drawlineCharts();
      drawPolarChart();
      drawHorizontalBarchart();
    })
    .on("mouseover", function(d) {
      d3.select(this).transition()
        .duration('50')
        .attr('fill', 'black');
    
      tooltip.style("opacity", 1)
            .html("Number of sets: "+sets);
    })
    .on("mousemove", (event) => {
      tooltip
      .style('left', (d3.pointer(event)[0]+document.getElementById("radBarChart").width.animVal.value/2) + 10 + 'px')
      .style('top', (d3.pointer(event)[1]+document.getElementById("radBarChart").height.animVal.value/2) + 'px');
    })
    .on("mouseleave",function(d) {
      tooltip.style("opacity", 0)
    })
    .on("mouseout", function(d) {
      d3.select(this).transition()
        .duration('50')
        .attr('fill', colorRadBars(sets));

    });
    radialBarchartArea.append("g")
      .attr("text-anchor", (x(i) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start")
      .attr("transform", "rotate(" + ((x(i) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (innerRadius) + ",0)")
    .append("text")
      .text(i)
      .attr("class","text")
      .attr("transform", (x(i) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)")
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle")
  }
  
}

function drawlineCharts() {

  d3.select("#lineChart1").remove();
  d3.select("#lineChart2").remove();
  d3.select("#lineChart3").remove();
  var axisColor = "#E04836";
  var maxPerWeekBench = new Map([...(new Map([[0,60]])), ...d3.rollup(benchData, g => d3.max(g, D => calculateOneRM(D.weight, D.reps, D.rpe)), d => d.week_of_a_year)])
  var maxPerWeekDead = new Map([...(new Map([[0,60]])), ...d3.rollup(deadliftData, g => d3.max(g, D => calculateOneRM(D.weight, D.reps, D.rpe)), d => d.week_of_a_year)])
  var maxPerWeekSquat = new Map([...(new Map([[0,60]])), ...d3.rollup(squatData, g => d3.max(g, D => calculateOneRM(D.weight, D.reps, D.rpe)), d => d.week_of_a_year)])

  var margin = {top: 0, right: 15, bottom: 10, left: 15},
    width = d3.select("#lineCharts_div").node().clientWidth - margin.left - margin.right,
    height = d3.select("#lineCharts_div").node().clientHeight/3 - margin.top - margin.bottom;

  lineChartsArea1 = d3.select("#lineCharts_div").append("svg")
    .attr("id", "lineChart1")
    .attr("width", d3.select("#lineCharts_div").node().clientWidth)
    .attr("height", d3.select("#lineCharts_div").node().clientHeight/3)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
  
  lineChartsArea2 = d3.select("#lineCharts_div").append("svg")
    .attr("id", "lineChart2")
    .attr("width", d3.select("#lineCharts_div").node().clientWidth)
    .attr("height", d3.select("#lineCharts_div").node().clientHeight/3)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");;
  
  lineChartsArea3 = d3.select("#lineCharts_div").append("svg")
    .attr("id", "lineChart3")
    .attr("width", d3.select("#lineCharts_div").node().clientWidth)
    .attr("height", d3.select("#lineCharts_div").node().clientHeight/3)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");; 
  
  // Add X axes to all linecharts    
  var x = d3.scaleLinear()
    .domain([0,52])
    .range([ 0, width - margin.right ]);

  lineChartsArea1.append("g")
    .attr("transform", "translate("+margin.left+"," + (height - margin.bottom)+ ")")
    .attr("class", "axis")
    .call(d3.axisBottom(x));
  lineChartsArea2.append("g")
    .attr("transform", "translate("+margin.left+"," + (height - margin.bottom)+ ")")
    .attr("class", "axis")
    .call(d3.axisBottom(x));
  lineChartsArea3.append("g")
    .attr("transform", "translate("+margin.left+"," + (height - margin.bottom)+ ")")
    .attr("class", "axis")
    .call(d3.axisBottom(x));


  // Add Y axes to the three svgs
  var y1 = d3.scaleLinear()
    .domain([40, 100])
    .range([ height - margin.bottom, 5 ]);
  var y2 = d3.scaleLinear()
    .domain([60, 180])
    .range([ height - margin.bottom, 5 ]);
  var y3 = d3.scaleLinear()
    .domain([40, 120])
    .range([ height - margin.bottom, 5 ]);

  lineChartsArea1.append("g")
    .attr("transform", "translate("+margin.left+",0)")
    .attr("class", "axis")
    .call(d3.axisLeft(y1));
  lineChartsArea2.append("g")
    .attr("transform", "translate("+margin.left+",0)")
    .attr("class", "axis")
    .call(d3.axisLeft(y2));
  lineChartsArea3.append("g")
    .attr("transform", "translate("+margin.left+",0)")
    .attr("class", "axis")
    .call(d3.axisLeft(y3));

  lineChartsArea1.append("linearGradient")
    .attr("id", "line-gradient1")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y1(40))
    .attr("x2", 0)
    .attr("y2", y1(100))
    .selectAll("stop")
      .data([
        {offset: "0%", color: "yellow"},
        {offset: "100%", color: "green"}
      ])
    .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });
  lineChartsArea1.append("linearGradient")
    .attr("id", "line-gradient2")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y2(60))
    .attr("x2", 0)
    .attr("y2", y2(180))
    .selectAll("stop")
      .data([
        {offset: "0%", color: "yellow"},
        {offset: "100%", color: "green"}
      ])
    .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });
  lineChartsArea1.append("linearGradient")
    .attr("id", "line-gradient3")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", y3(40))
    .attr("x2", 0)
    .attr("y2", y3(120))
    .selectAll("stop")
      .data([
        {offset: "0%", color: "yellow"},
        {offset: "100%", color: "green"}
      ])
    .enter().append("stop")
      .attr("offset", function(d) { return d.offset; })
      .attr("stop-color", function(d) { return d.color; });



  // Plot the lines
  lineChartsArea1.append("path")
      .datum(maxPerWeekBench)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient1)")
      .attr("stroke-width", 1.5)
      .attr("transform", "translate("+margin.left+",0)")
      .attr("d", d3.line()
        .x(function(d) { return x(d[0]) })
        .y(function(d) { return y1(d[1]) })
        )
  lineChartsArea2.append("path")
      .datum(maxPerWeekDead)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient2)")
      .attr("stroke-width", 1.5)
      .attr("transform", "translate("+margin.left+",0)")
      .attr("d", d3.line()
        .x(function(d) { return x(d[0]) })
        .y(function(d) { return y2(d[1]) })
        )
  lineChartsArea3.append("path")
      .datum(maxPerWeekSquat)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient3)")
      .attr("stroke-width", 1.5)
      .attr("transform", "translate("+margin.left+",0)")
      .attr("d", d3.line()
        .x(function(d) { return x(d[0]) })
        .y(function(d) { return y3(d[1]) })
        )


  // Append vertical line at the selected week
  lineChartsArea1.append("line")
    .attr("class", "vertical-line")
    .attr("x1", x(previous_selected_week))
    .attr("y1", 0)
    .attr("x2", x(previous_selected_week))
    .attr("y2", height)
    .attr("transform", "translate("+margin.left+",0)")
    .style("stroke", "red") 
    .style("stroke-width", 2)
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x1", x(selected_week))
      .attr("x2", x(selected_week));

      
  lineChartsArea1.append("text")
    .attr("class","text")
    .attr("x", x(previous_selected_week) +  (selected_week < 26 ? +20 : -70))
    .attr("y", height - 15) 
    .text("Bench Press")
    .style("fill", "black")
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x", x(selected_week) + (selected_week < 26 ? +20 : -70));


  lineChartsArea1.append("text")
    .attr("class", "text")
    .attr("x", x(previous_selected_week) +  (selected_week < 26 ? +20 : -40))
    .attr("y", 15) 
    .text(maxPerWeekBench.get(+selected_week) === undefined ? "No data" : ((Math.round( maxPerWeekBench.get(+selected_week) * 100) / 100).toFixed(2) + " kg"))
    .style("fill", "black")
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x", x(selected_week) + (selected_week < 26 ? +20 : -40))
      .tween("text", function(d) {
        var that = this;
        var prevNumber = maxPerWeekBench.get(+previous_selected_week) === undefined ? 60.00 : (Math.round( maxPerWeekBench.get(+previous_selected_week) * 100) / 100).toFixed(2)
        var newNumber =  maxPerWeekBench.get(+selected_week) === undefined ? 60.00 : (Math.round( maxPerWeekBench.get(+selected_week) * 100) / 100).toFixed(2)
        var i = d3.interpolateNumber(prevNumber, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(maxPerWeekBench.get(+selected_week) === undefined ? "No data" : i(t).toFixed(2) + "kg");
        };
      });

  lineChartsArea2.append("line")
    .attr("class", "vertical-line")
    .attr("x1", x(previous_selected_week))
    .attr("y1", 0)
    .attr("x2", x(previous_selected_week))
    .attr("y2", height)
    .attr("transform", "translate("+margin.left+",0)")
    .style("stroke", "red")
    .style("stroke-width", 2)
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x1", x(selected_week))
      .attr("x2", x(selected_week));

  lineChartsArea2.append("text")
    .attr("class", "text")
    .attr("x", x(previous_selected_week) +  (selected_week < 26 ? +20 : -45))
    .attr("y", height - 15) 
    .text("Deadlift")
    .style("fill", "black")
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x", x(selected_week) + (selected_week < 26 ? +20 : -45));

  lineChartsArea2.append("text")
    .attr("class", "text")
    .attr("x", x(previous_selected_week) +  (selected_week < 26 ? +20 : -50))
    .attr("y", 15) 
    .text(maxPerWeekDead.get(+selected_week) === undefined ? "No data" : ((Math.round( maxPerWeekDead.get(+selected_week) * 100) / 100).toFixed(2) + " kg"))
    .style("fill", "black")
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x", x(selected_week) + (selected_week < 26 ? +20 : -50))
      .tween("text", function(d) {
        var that = this;
        var prevNumber = maxPerWeekDead.get(+previous_selected_week) === undefined ? 60.00 : (Math.round( maxPerWeekDead.get(+previous_selected_week) * 100) / 100).toFixed(2)
        var newNumber =  maxPerWeekDead.get(+selected_week) === undefined ? 60.00 : (Math.round( maxPerWeekDead.get(+selected_week) * 100) / 100).toFixed(2)
        var i = d3.interpolateNumber(prevNumber, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(maxPerWeekDead.get(+selected_week) === undefined ? "No data" : i(t).toFixed(2) + "kg");
        };
      });

  lineChartsArea3.append("line")
    .attr("class", "vertical-line")
    .attr("x1", x(previous_selected_week))
    .attr("y1", 0)
    .attr("x2", x(previous_selected_week))
    .attr("y2", height)
    .attr("transform", "translate("+margin.left+",0)")
    .style("stroke", "red") 
    .style("stroke-width", 2)
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x1", x(selected_week))
      .attr("x2", x(selected_week));

  lineChartsArea3.append("text")
    .attr("class", "text")
    .attr("x", x(previous_selected_week) +  (selected_week < 26 ? +20 : -30))
    .attr("y", height - 15) 
    .text("Squat")
    .style("fill", "black")
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x", x(selected_week) + (selected_week < 26 ? +20 : -30));

  lineChartsArea3.append("text")
    .attr("class", "text")
    .attr("x", x(previous_selected_week) +  (selected_week < 26 ? +20 : -50))
    .attr("y", 15) 
    .text(maxPerWeekSquat.get(+selected_week) === undefined ? "No data" : ((Math.round( maxPerWeekSquat.get(+selected_week) * 100) / 100).toFixed(2) + " kg"))
    .style("fill", "black")
    .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("x", x(selected_week) + (selected_week < 26 ? +20 : -50))
      .tween("text", function(d) {
        var that = this;
        var prevNumber = maxPerWeekSquat.get(+previous_selected_week) === undefined ? 60.00 : (Math.round( maxPerWeekSquat.get(+previous_selected_week) * 100) / 100).toFixed(2)
        var newNumber =  maxPerWeekSquat.get(+selected_week) === undefined ? 60.00 : (Math.round( maxPerWeekSquat.get(+selected_week) * 100) / 100).toFixed(2)
        var i = d3.interpolateNumber(prevNumber, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(maxPerWeekSquat.get(+selected_week) === undefined ? "No data" : i(t).toFixed(2) + "kg");
        };
      });


}



function calculateOneRM(weight, reps, rpe){
  // 1RM calculation
  // Weight / ((100-((reps+rpeReps)*2.5))/100)
  return weight / ((100-((reps+rpeMap.get(rpe))*2.5))/100);
}

function getSetsPerWeek(selectedWeek){
  var weekData = d3.filter(data, function(d) {return d.week_of_a_year == selectedWeek});

  const unnestedData = weekData.flatMap(d => {
    const muscleGroups = d.muscle_group.split(';').map(group => group.trim());
    return muscleGroups.map(group => ({ muscle_group: group }));
  });

  var weekDataProcessed = d3.rollup(unnestedData, g => g.length, G => G.muscle_group);

  muscleGroups.forEach(key => {
    if (!weekDataProcessed.has(key)) {
      weekDataProcessed.set(key, 0);
    }
  });
  return weekDataProcessed;
}

function drawPolarChart(){
  d3.select("#radialChart_div").selectAll("*").remove();

  var lastWeekData = getSetsPerWeek(previous_selected_week);
  var currentWeekData = getSetsPerWeek(selected_week);

  //console.log(currentWeekData);
  var margin = {top: 5, right: 5, bottom: 10, left: 5},
    width = d3.select("#radialChart_div").node().clientWidth - margin.left - margin.right,
    height = d3.select("#radialChart_div").node().clientHeight - margin.top - margin.bottom;

  radialChartArea = d3.select("#radialChart_div").append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${(width / 2) + margin.left + margin.right},${(height / 2) + margin.bottom})`);

  const scale = d3.scaleLinear()
                  .domain([0,30])
                  .range([0,(Math.min(width, height) / 2)-margin.bottom]);

  const x = d3.scaleBand()
              .range([0, Math.PI*2])
              .domain(muscleGroups)


  // Iterate over sorted keys with forEach
  var indx = 0;
  muscleGroups.forEach(key => {
    var last_value = lastWeekData.get(key);
    var curr_value = currentWeekData.get(key);

    var arc = d3.arc()
      .innerRadius(0)
      .outerRadius(scale(last_value))
      .startAngle(x(key))
      .endAngle(x(key) + x.bandwidth());

    radialChartArea.append("path")
      .attr("fill", colorGr(last_value))
      .style("stroke", "none")
      .attr("d", arc)
      .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attrTween('d', (d) => {
        return (t) => {
          // Interpolate between previous and current outer radius and return it as a Interpolator function depending on frame
          const radius = d3.interpolate(scale(last_value), scale(curr_value))(t);
          arc.outerRadius(radius);
          return arc(null);
        };
    })
      .attr("fill", colorGr(curr_value));

    var rotateAngle = ((x(key) + x.bandwidth() / 2) * 180 / Math.PI)
    var textG = radialChartArea.append("g")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "rotate(" + (rotateAngle - 90) + ")"+"translate(" + (last_value <= 12 ? (scale(12) + 15) : (scale(last_value) + 15)) + ",0)"; });
    
    textG.transition()
          .duration(1000)
          .ease(d3.easeExpOut)
          .attr("transform", function(d) { return "rotate(" + (rotateAngle - 90) + ")"+"translate(" + (curr_value <= 12 ? (scale(12) + 15) : (scale(curr_value) + 15)) + ",0)"; })
    
    var textRotate =  (rotateAngle > 90 && rotateAngle < 270) ? 270 : 90;
    //console.log(key, textRotate);
    textG.append("text")
      .text(key+": "+curr_value)
      .attr("class","text")
      .attr("transform", "rotate("+textRotate+")")
      .attr("alignment-baseline", "middle")
    
    
    indx++;

  });


  }

  function getRpeData(week){
    var weekData = d3.filter(data, function(d) {return d.week_of_a_year == week});
    
    var weekData = weekData.flatMap(d => {
      const muscleGroups = d.muscle_group.split(';').map(group => group.trim());
      return muscleGroups.map(group => ({...d, muscle_group: group }));
    });
    weekData = weekData.map(row => ({ ...row, "muscle_group": muscleCategoryMap.get(row.muscle_group) }));


    weekData = d3.rollup(weekData, (D) =>  Math.round(d3.mean(D, d => d.rpe)*2)/2, (d) => d.muscle_group)

    muscleCategoryMap.forEach(key => {
      if (!weekData.has(key)) {
        weekData.set(key, "No data");
      }
    });
    
    return weekData;
  }

  function drawHorizontalBarchart(){
    d3.select("#horizontalBar_div").selectAll("*").remove();
    // previous data
    const prev_week = getRpeData(previous_selected_week);
    const curr_week = getRpeData(selected_week);

    //console.log(prev_week)
    var margin = {top: 20, right: 30, bottom: 40, left: 90},
    width = d3.select("#horizontalBar_div").node().clientWidth - margin.left - margin.right,
    height = d3.select("#horizontalBar_div").node().clientHeight - margin.top - margin.bottom;

    horizontalBarArea = d3.select("#horizontalBar_div")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    //console.log(Array.from(rpeMap.keys()))
    var x = d3.scalePoint()
            .domain(["No data"].concat(Array.from(rpeMap.keys())))
            .range([0, width])

    horizontalBarArea.append("g")
      .attr("transform", "translate(0," + height + ")")
      .style("color", "black")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("text-anchor", "middle")
        .style("color", "black");


    // Y axis
    var y = d3.scaleBand()
      .range([ 0, height ])
      .domain(Array.from(prev_week.keys()).sort())
      .padding(.3);
      
    horizontalBarArea.append("g")
      .call(d3.axisLeft(y))
      .style("color", "black")

    horizontalBarArea.selectAll(".tick text")
      .attr("font-size","150%");
    Array.from(prev_week.keys()).forEach(key => {
      horizontalBarArea
        .append("rect")
        .attr("x", 1 )
        .attr("y",  y(key) )
        .attr("width", x(prev_week.get(key)))
        .attr("height", y.bandwidth() )
        .attr("fill", colorRpe(prev_week.get(key)))
        .transition()
          .duration(1000)
          .ease(d3.easeExpOut)
          .attr("width", x(curr_week.get(key)))
          .attr("fill", colorRpe(curr_week.get(key)))
    });


    horizontalBarArea.append("line")
      .attr("class", "vertical-line")
      .attr("x1", x(8))
      .attr("y1", 0)
      .attr("x2", x(8))
      .attr("y2", height)
      .style("stroke", "red") 
      .style("stroke-width", 2)

    
  } 

function getMaxRM(){

  //function calculateOneRM(weight, reps, rpe){
  const benchMax = d3.max(benchData, function(d) { return calculateOneRM(+d.weight, +d.reps, +d.rpe)})
  const squatMax = d3.max(squatData, function(d) { return calculateOneRM(+d.weight, +d.reps, +d.rpe)})
  const deadliftMax = d3.max(deadliftData, function(d) { return calculateOneRM(+d.weight, +d.reps, +d.rpe)})

  console.log(benchMax)
  console.log(deadliftMax)
  console.log(squatMax)

  return {deadlift:deadliftMax, squat:squatMax, bench:benchMax};
}

function drawPictogramsArea(){
  console.log(d3.time)
  var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = d3.select("#pictograms_div").node().clientWidth - margin.left - margin.right,
    height = d3.select("#pictograms_div").node().clientHeight - margin.top - margin.bottom;
  pictogramsArea = d3.select("#pictograms_div").append("svg")
    .attr("id", "pictograms")
    .attr("width", width)
    .attr("height", height);

  let oneRm = getMaxRM();

  const myBw = 80;

  const benchY = oneRm.bench/(1.5*myBw);
  const deadY = oneRm.deadlift/(2.5*myBw)
  const squatY = oneRm.squat/(2*myBw)

  let imageSize = width/4
  pictogramsArea.append("svg:image")
    .attr('x', 0)
    .attr('y', height-imageSize)
    .attr('width', imageSize)
    .attr('height', imageSize)
    .attr("xlink:href", "public/images/d.png")
    .attr("transform", "translate("+imageSize/4+",0)")
  pictogramsArea.append("svg:image")
    .attr('x', width/3)
    .attr('y', height-imageSize)
    .attr('width', imageSize)
    .attr('height', imageSize)
    .attr("xlink:href", "public/images/s.png")
    .attr("transform", "translate("+imageSize/4+",0)")

  pictogramsArea.append("svg:image")
    .attr('x', width*(2/3))
    .attr('y', height-imageSize)
    .attr('width', imageSize)
    .attr('height', imageSize)
    .attr("xlink:href", "public/images/b.png")
    .attr("transform", "translate("+imageSize/4+",0)")



  const scale = d3.scaleLinear()
                  .domain([0,1])
                  .range([0,imageSize]);


  pictogramsArea.append("line")
    .attr("class", "vertical-line")
    .attr("x1", 0)
    .attr("y1", height)
    .attr("x2", width/3)
    .attr("y2", height)
    .style("stroke", color) 
    .style("stroke-width", 2)
    .transition()
    .duration(2500)
    .ease(d3.easeExpOut)
    .attr("y1", height-scale(deadY))
    .attr("y2", height-scale(deadY));

    

  pictogramsArea.append("text")
    .attr("class", "textpictograms")
    .attr("x", 0)
    .attr("y", height-5) 
    .text((0).toFixed(2)+"/"+2.5*myBw+"kg")
    .style("fill", "black")
    .transition()
      .duration(2500)
      .ease(d3.easeExpOut)
      .attr("y", height-scale(deadY)-5)
      .tween("text", function(d) {
        var that = this;
        var newNumber =  oneRm.deadlift.toFixed(2)
        var i = d3.interpolateNumber(0, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(i(t).toFixed(2)+"/"+2.5*myBw+"kg");
        };
      });

  pictogramsArea.append("text")
    .attr("class", "textpictograms")
    .attr("x", 0)
    .attr("y", height+15) 
    .text((0).toFixed(2)+"%")
    .style("fill", "black")
    .transition()
      .duration(2500)
      .ease(d3.easeExpOut)
      .attr("y", height-scale(deadY)+15)
      .tween("text", function(d) {
        var that = this;
        var newNumber =  (100*deadY).toFixed(2)
        var i = d3.interpolateNumber(0, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(i(t).toFixed(2)+"%");
        };
      });

  pictogramsArea.append("line")
    .attr("class", "vertical-line")
    .attr("x1", width/3)
    .attr("y1", height)
    .attr("x2", width*(2/3))
    .attr("y2", height)
    .style("stroke", color) 
    .style("stroke-width", 2)
    .transition()
    .duration(2500)
    .ease(d3.easeExpOut)
    .attr("y1", height-scale(squatY))
    .attr("y2", height-scale(squatY));
  
   pictogramsArea.append("text")
    .attr("class", "textpictograms")
    .attr("x", width/3)
    .attr("y", height-5) 
    .text((0).toFixed(2)+"/"+2*myBw+"kg")
    .style("fill", "black")
    .transition()
      .duration(2500)
      .ease(d3.easeExpOut)
      .attr("y", height-scale(squatY)-5)
      .tween("text", function(d) {
        var that = this;
        var newNumber =  oneRm.squat.toFixed(2)
        var i = d3.interpolateNumber(0, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(i(t).toFixed(2)+"/"+2*myBw+"kg");
        };
      });

  pictogramsArea.append("text")
    .attr("class", "textpictograms")
    .attr("x", width/3)
    .attr("y", height+15) 
    .text((0).toFixed(2)+"%")
    .style("fill", "black")
    .transition()
      .duration(2500)
      .ease(d3.easeExpOut)
      .attr("y", height-scale(squatY)+15)
      .tween("text", function(d) {
        var that = this;
        var newNumber = (100*squatY).toFixed(2)
        var i = d3.interpolateNumber(0, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(i(t).toFixed(2)+"%");
        };
      });

  pictogramsArea.append("line")
    .attr("class", "vertical-line")
    .attr("x1", width*(2/3))
    .attr("y1", height)
    .attr("x2", width)
    .attr("y2", height)
    .style("stroke", color) 
    .style("stroke-width", 2)
    .transition()
    .duration(2500)
    .ease(d3.easeExpOut)
    .attr("y1", height-scale(benchY))
    .attr("y2", height-scale(benchY));

  pictogramsArea.append("text")
    .attr("class", "textpictograms")
    .attr("x", width*(2/3))
    .attr("y", height-5) 
    .text((0).toFixed(2)+"/"+1.5*myBw+"kg")
    .style("fill", "black")
    .transition()
      .duration(2500)
      .ease(d3.easeExpOut)
      .attr("y", height-scale(benchY)-5)
      .tween("text", function(d) {
        var that = this;
        var newNumber = oneRm.bench.toFixed(2)
        var i = d3.interpolateNumber(0, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(i(t).toFixed(2)+"/"+1.5*myBw+"kg");
        };
      });

  pictogramsArea.append("text")
    .attr("class", "textpictograms")
    .attr("x", width*(2/3))
    .attr("y", height+15) 
    .text((0).toFixed(2)+"%")
    .style("fill", "black")
    .transition()
      .duration(2500)
      .ease(d3.easeExpOut)
      .attr("y", height-scale(benchY)+15)
      .tween("text", function(d) {
        var that = this;
        var newNumber = (100*benchY).toFixed(2)
        var i = d3.interpolateNumber(0, newNumber);  // Number(d.percentage.slice(0, -1))
        return function(t) {
            d3.select(that).text(i(t).toFixed(2)+"%");
        };
      });



  
}
