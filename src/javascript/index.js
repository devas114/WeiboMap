"use strict";
require("../stylesheet/index.scss");
require("./file_input.js");
require("./sidebar.js");

var animation = require("./animation.js");

var city_ref = {
    "安徽": "合肥",
    "河北": "石家庄",
    "山西": "太原",
    "内蒙古": "呼和浩特",
    "辽宁": "沈阳",
    "吉林": "长春",
    "黑龙江": "哈尔滨",
    "江苏": "南京",
    "浙江": "杭州",
    "安徽": "合肥",
    "福建": "福州",
    "江西": "南昌",
    "山东": "济南",
    "河南": "郑州",
    "湖北": "武汉",
    "湖南": "长沙",
    "广东": "广州",
    "广西": "南宁",
    "海南": "海口",
    "四川": "成都",
    "贵州": "贵阳",
    "云南": "昆明",
    "西藏": "拉萨",
    "陕西": "西安",
    "甘肃": "兰州",
    "青海": "西宁",
    "宁夏": "银川",
    "新疆": "乌鲁木齐",
    "海外": "其他"
}
var weiboData = {
    dataDict: {},
    provNest: {},
    linkRender: {},
    pointDict: {},
    timeDict: {},
    timeCollec: []
};

var myMap;

var rawData,
    china_cities;
/*
var proj = d3.geo.mercator().center([105, 38]).scale(750).translate([width / 2, height / 2]);
var path = d3.geo.path().projection(proj);
*/
d3.json("dist/data/cities.json", function(error, json) {
    if (error) {
        return console.log(error);
    } else {
        china_cities = json;
    }
});

function parseCSV() {
    var file = document.getElementById("entry-file").files[0]
    var config = {
        delimiter: "",
        newline: "",
        header: true,
        dynamicTyping: false,
        preview: 0,
        encoding: "",
        worker: false,
        comments: false,
        step: undefined,
        complete: function(results,file){
            rawData = results.data;
            renderContent();
        },
        error: undefined,
        download: undefined,
        skipEmptyLines: false,
        chunk: undefined,
        fastMode: undefined,
        beforeFirstChunk: undefined,
        withCredentials: undefined
    };
    Papa.parse(file,config);
}

function renderContent() {
    prepareData(rawData);
    buildMap();
    buildChart();
    buildTree();
}

function prepareData(rawData) {
    var l = rawData.length;
    var timeMarker;

    for (var i=0; i<l; i++) {
        var node = rawData[i];
        //update dataDict
        weiboData.dataDict[ node.mid ] = node;

        //resolve user's location
        if(node.user_location == undefined) { node.user_location = "其他 其他"; }
        var location = node.user_location.split(" ");
        var city = undefined,
            match = undefined;
        if (location[0] == "海外") { location = ["其他", "其他"]; }
        if (location.length == 2) {
            city = location[1];
            match = china_cities[city];
            if (match) { node.city = city; node.prov = match.prov; }
            else {
                city = location[0];
                match = china_cities[city];
                if (match) { node.city = city; node.prov = match.prov}
                else { console.log("fail in matching: " + city)}
            }
        } else if (location.length == 1) {
            if (city_ref[location[0]] != undefined) {
                city = city_ref[location[0]];
            } else { city = location[0]; }
            try {
                match = china_cities[city];
                node.city = city;
                node.prov = match.prov;
            } catch(err) { console.log(node); }
        } else { console.log("user location err for: " + location[0] + "please check your data"); }

        //calculate city reference
        if (node.city && match) {
            if (weiboData.pointDict[city]) {
                weiboData.pointDict[city].count += 1;
            } else {
                weiboData.pointDict[city] = {
                    name: city,
                    latt: match.latt,
                    logi: match.logi,
                    linkIn: [],
                    linkOut: [],
                    count: 1
                }
            }
        }

        //calculate province nest
        if(weiboData.provNest[node.prov]) {
            weiboData.provNest[node.prov].values += 1;}
        else{
            weiboData.provNest[node.prov] = {key: node.prov, values: 1};
        }

        // parse parent-children relationship
        var parent = weiboData.dataDict[ node.parent ];
        if (parent) {
            (parent.children || (parent.children = [])).push(node);

            //update link reference and point reference
            if (parent.city && node.city) {
                var link_name = parent.city + "-" + node.city;
                if (weiboData.linkRender[link_name]) {
                    weiboData.linkRender[link_name].count += 1;
                } else {
                    weiboData.linkRender[link_name] = {
                        from: parent.city,
                        to: node.city,
                        count: 1
                    };
                }
                weiboData.pointDict[node.city].linkIn.push({
                    from: parent.mid,
                    to: node.mid
                });
                weiboData.pointDict[parent.city].linkOut.push({
                    from: parent.mid,
                    to: node.mid
                });
            } else {
                console.log("link reference error:");
                console.log(parent);
                console.log(node);
            }
        } else {
            if (i != 0) {
                console.log("parent fail: ");
                console.log(node);
            }
        }


        //time-zone correction
        var timestemp = parseInt(node.t) * 1000;
        var timeLocal;
        if (!timestemp) {
            console.log("invalid time format: ");
            console.log(node);
        } else {
            var rawTime = new Date(timestemp);
            var fixTime = new Date(timestemp + rawTime.getTimezoneOffset() * 60000 + 8 * 60 * 60000);
            var timeFormat = fixTime.getFullYear() + "-" + (fixTime.getMonth() + 1) + "-" + fixTime.getDate() + "-" + fixTime.getHours() + "-" + fixTime.getMinutes();
            var timeParser = d3.time.format("%Y-%m-%d-%H-%M").parse;
            var timeLocalDate = timeParser(timeFormat);
            var timeLocalStrg = timeLocalDate.getTime()
            node.time = timeLocalStrg;
            node.date = timeLocalDate;
            if (i == 1) {
                timeMarker = timeLocalStrg;
            }
        }

        //update time dictionary
        if (weiboData.timeDict[timeLocalStrg]) {
            weiboData.timeDict[timeLocalStrg].values += 1;
        } else {
            weiboData.timeDict[timeLocalStrg] = {
                key: timeLocalDate,
                values: 1
            };
        }

        //update time collection
        if (timeLocalStrg - timeMarker >= 60000) {
            weiboData.timeCollec.push(weiboData.timeDict[timeMarker]);
            if (timeLocalStrg - timeMarker > 60000) {
                var nextTime = new Date(timeMarker + 60000);
                weiboData.timeCollec.push({
                    key: nextTime,
                    values: 0
                });
            }
            if (timeLocalStrg - timeMarker > 120000) {
                var prevTime = new Date(timeLocalStrg - 60000);
                weiboData.timeCollec.push({
                    key: prevTime,
                    values: 0
                });
            }
            timeMarker = timeLocalStrg;
        }
        if (i == l - 1) {
            weiboData.timeCollec.push(weiboData.timeDict[timeLocalStrg]);
        }
    //end of loop
    }
}

function buildMap() {
    myMap = new MapState();
    myMap.init();
}

function MapState() {
    this.width = parseInt(document.querySelector(".content-map").offsetWidth) - 40;
    this.height = parseInt( this.width * 0.4);

    var width = this.width,
        height = this.height;

    this.tooltip1 = d3.select(".content-map").append("div")
        .attr("class", "hidden tooltip")
        .attr("arrow", "bottom");
    this.tooltip2 = d3.select(".content-map").append("div")
        .attr("class", "hidden tooltip")
        .attr("arrow", "bottom");

    this.circles = undefined;
    this.arclines = undefined;

    this.proj = d3.geo.mercator().center([105, 38]).scale(750).translate([this.width / 2, this.height / 2]);
    this.path = d3.geo.path().projection(this.proj);
    this.svgMap = d3.select(".content-map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "map")
        .style("display","block")
        .style("border","1px solid rgba(0, 0, 0, .5)");
    this.mapFeature = this.svgMap.append("g").attr("id","map-feature");
    this.mapOverlay = this.svgMap.append("g").attr("id","map-overlay");
    var mapFeature = this.mapFeature;
    var mapOverlay = this.mapOverlay;
    this.moveMap = function() {
        mapFeature.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        mapOverlay.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
    var moveMap = this.moveMap;
    this.mapZoom = d3.behavior.zoom()
        .scaleExtent([0.8,5])
        .on("zoom", moveMap);
    var mapZoom = this.mapZoom;
    this.svgMap = this.svgMap.call(mapZoom).append("g");
}

MapState.prototype.init = function() {
    var mapFeature = this.mapFeature;
    var path = this.path;
    d3.json("dist/data/china_provinces.json", function(err, states){
        if(err) throw err;
        mapFeature.selectAll(".states")
            .data(states.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "states")
            .attr("id", function(d){ return "prov-" + d.properties.name});
        var provNames = Object.keys(weiboData.provNest);
        provNames.forEach(function(item){
            var count = weiboData.provNest[item].values;
            var name = weiboData.provNest[item].key;
            var proportion = count / rawData.length;
            if(proportion>0.02 && proportion<=0.04){
                d3.select("#prov-" + name).attr("occupy",0)}
            else if(proportion>0.04 && proportion<=0.06){
                d3.select("#prov-" + name).attr("occupy",1)}
            else if(proportion>0.06 && proportion<=0.08){
                d3.select("#prov-" + name).attr("occupy",2)}
            else if(proportion>0.08 && proportion<=0.1){
                d3.select("#prov-" + name).attr("occupy",3)}
            else if(proportion>0.1 && proportion<=0.12){
                d3.select("#prov-" + name).attr("occupy",4)}
            else if(proportion>0.12 && proportion<=0.14){
                d3.select("#prov-" + name).attr("occupy",5)}
            else if(proportion>0.14 && proportion<=0.16){
                d3.select("#prov-" + name).attr("occupy",6)}
            else if(proportion>0.15){
                d3.select("#prov-" + name).attr("occupy",7)}
        })
    });
}

MapState.prototype.resetRender = function() {
    var trash = document.getElementById("map-overlay");
    while(trash.firstChild) {
        trash.removeChild(trash.firstChild);
    }
}

MapState.prototype.drawData = function(renderSet) {
    if(typeof renderSet[0] === "undefined") {
        console.log("nothing to render");
    } else {
        var myState = this;
        var nodeRender=[],
            linkRender=[];
        var nodeDict = {};
        var mapOverlay = this.mapOverlay,
            circles = this.circles,
            proj = this.proj;
        var l = renderSet.length;
        for (var i=0; i<l; i++) {
            var node = renderSet[i];
            var parent = weiboData.dataDict[node.parent];
            if(parent){
                if (typeof parent.city === "undefined" || typeof node.city === "undefined"){
                    console.log("location error");
                    console.log(parent);
                    console.log(node);
                } else {
                    nodeDict[parent.city] = nodeDict[parent.city] ? increment(nodeDict[parent.city], "out") : {key: parent.city, in: 0, out: 1};
                    nodeDict[node.city] = nodeDict[node.city] ? increment(nodeDict[node.city], "in") : {key: node.city, in: 1, out: 0};
                }
                linkRender.push(parent.city + "-" + node.city);
            }
        }
        var nestLink = d3.nest()
            .key(function(d){return d;})
            .rollup(function(leaves){return leaves.length;})
            .entries(linkRender);
        var nodeKeys = Object.keys(nodeDict);
        for (var j=0; j<nodeKeys.length; j++) {
            nodeRender.push(nodeDict[nodeKeys[j]]);
        }

        for (var k=0; k<nestLink.length; k++) {
            myState.createCurve(nestLink[k]);
        }
        circles = mapOverlay.selectAll(".bubble")
            .data(nodeRender)
            .enter().append("circle")
            .attr("cx", function(d) {return proj([china_cities[d.key].logi, china_cities[d.key].latt])[0];})
            .attr("cy", function(d) {return proj([china_cities[d.key].logi, china_cities[d.key].latt])[1];})
            .attr("r", "3px")
            .attr("id", function(d) {return "city-" + d.key})
            .attr("fill", function(d){
                if(d.in<=5){return "#ff6969";}
                else if(d.in>5 && d.in<=10){return "#ff0b0b";}
                else if(d.in>10 && d.in<=20){return "#a40000";}
                else if(d.in>20){return "#690000";}
            })
            .attr("class", "bubble")
            .attr("state","show")
            .attr("in", function(d) {
                return d.in;
            })
            .attr("out", function(d) {
                return d.out;
            })
            .on("mouseover", function(d){
                var name = d.key,
                    self = d3.select(this),
                    info = "In: " + d.in + " | Out: " + d.out,
                    transform = d3.transform(d3.select(this.parentNode).attr("transform")).translate,
                    scale = d3.transform(d3.select(this.parentNode).attr("transform")).scale;
                var cx = (+self.attr("cx") * scale[0]) + transform[0],
                    cy = (+self.attr("cy") * scale[0]) + transform[1];
                if(cy > 0 && cy < 50 && cx > 0 && cx < myState.width + 20) {
                    cy += 30;
                    cx -= 25;
                    myState.tooltip1.classed("hidden", false)
                        .attr("arrow", "top")
                        .attr("style", "left:" + cx + "px; top:" + cy + "px")
                        .html("<h3>" + name + "</h3><p>" + info + "</p>");
                } else if (cy >= 50 && cy <= myState.height && cx > 0 && cx < myState.width + 20) {
                    cy -= 30;
                    cx -= 25;
                    myState.tooltip1.classed("hidden", false)
                        .attr("style", "left:" + cx + "px; top:" + cy + "px")
                        .html("<h3>" + name + "</h3><p>" + info + "</p>");
                }
                d3.selectAll(".arcs").attr("state", "opaque");
                d3.selectAll("#map-overlay [id^=\""+ d.key + "\"]").attr("state", "show");
                d3.selectAll("#map-overlay [id$=\""+ d.key + "\"]").attr("state", "mark");
            })
            .on("mouseout", function(d){
                d3.selectAll(".arcs").attr("state", "show");
                myState.tooltip1.classed("hidden", true).attr("arrow", "bottom");
            })
    }
}

MapState.prototype.createCurve = function(lineMark) {
    var myState = this;
    var cName1 = lineMark.key.split("-")[0];
    var cName2 = lineMark.key.split("-")[1];
    var pt1 = {name:cName1, coordinate: [china_cities[cName1].logi, china_cities[cName1].latt]};
    var pt2 = {name:cName2, coordinate: [china_cities[cName2].logi, china_cities[cName2].latt]};

    var lineWidth;
    if(lineMark.values <= 5) { lineWidth = 2; }
    else if(lineMark.values > 5 && lineMark.values <= 10) { lineWidth = 4; }
    else if(lineMark.values > 10 && lineMark.values <= 20) { lineWidth = 6;}
    else if(lineMark.values > 20) { lineWidth = 8;}

    var B1 = function(x) {
        return 1 - 2 * x + x * x;
    };

    var B2 = function(x) {
        return 2 * x - 2 * x * x;
    };

    var B3 = function(x) {
        return x * x;
    };

    var curveCoordinates = [];

    var count = 30;
    var t, h, h2, lat3, lng3, j, t2;
    var LnArray = [];
    var i = 0;
    var inc = 0;

    var lat1 = parseFloat(pt1.coordinate[0]);
    var lat2 = parseFloat(pt2.coordinate[0]);
    var lng1 = parseFloat(pt1.coordinate[1]);
    var lng2 = parseFloat(pt2.coordinate[1]);
    var color = d3.interpolateLab("#a5dee4","#0d5661");
    if (lng2 > lng1) {
        if (parseFloat(lng2-lng1) > 180) {
            if (lng1 < 0) {
                lng1 = parseFloat(180 + 180 + lng1);
            }
        }
    }

    if (lng1 > lng2) {
        if (parseFloat(lng1-lng2) > 180) {
            if (lng2 < 0) {
                lng2 = parseFloat(180 + 180 + lng2);
            }
        }
    }
    j = 0;
    t2 = 0;
    if (lat2 == lat1) {
        t = 0;
        h = lng1 - lng2;
    } else if (lng2 == lng1) {
        t = Math.PI / 2;
        h = lat1 - lat2;
    } else {
        t = Math.atan((lat2 - lat1) / (lng2 - lng1));
        h = (lat2 - lat1) / Math.sin(t);
    }
    if (t2 == 0) {
        t2 = (t + (Math.PI / 5));
    }
    h2 = h / 2;
    lng3 = h2 * Math.cos(t2) + lng1;
    lat3 = h2 * Math.sin(t2) + lat1;

    for (i = 0; i < count + 1; i++) {
        curveCoordinates.push([
            (lat1 * B1(inc) + lat3 * B2(inc) + lat2 * B3(inc)),
            (lng1 * B1(inc) + lng3 * B2(inc) + lng2 * B3(inc))

        ]);
        inc = inc + (1 / count);
    }

    var route = [{type: "LineString", coordinates:curveCoordinates, lineWidth:lineWidth}];
    var arcs = myState.mapOverlay.selectAll(".arc").data(route);
    myState.arclines = arcs.enter()
        .append("path")
        .attr("fill", "none")
        .attr("class", "arcs")
        .attr("d", myState.path)
        .attr("state", "show")
        .style("stroke-width", function(d){return d.lineWidth})
        .attr("id", function(d){return pt1.name + "-" + pt2.name;})
        .on("mouseover", function(d){
            d3.selectAll(".arcs").attr("state", "opaque");
            d3.select(this).attr("state","show");
            var ct1 = myState.mapOverlay.select("#city-" + pt1.name),
                ct2 = myState.mapOverlay.select("#city-" + pt2.name);

            var infoCt1 = "In: " + ct1.attr("in") + " | Out: " + ct1.attr("out"),
                infoCt2 = "In: " + ct2.attr("in") + " | Out: " + ct2.attr("out"),
                transform = d3.transform(d3.select(this.parentNode).attr("transform")).translate,
                scale = d3.transform(d3.select(this.parentNode).attr("transform")).scale;
            var cx1 = +ct1.attr("cx") * scale[0] + transform[0],
                cy1 = +ct1.attr("cy") * scale[0] + transform[1],
                cx2 = +ct2.attr("cx") * scale[0] + transform[0],
                cy2 = +ct2.attr("cy") * scale[0] + transform[1];

            if(cy1 > 0 && cy1 < 50 && cx1 > 0 && cx1 < myState.width + 20) {
                cy1 += 30;
                cx1 -= 25;
                myState.tooltip1.classed("hidden", false)
                    .attr("arrow", "top")
                    .attr("style", "left:" + cx1 + "px; top:" + cy1 + "px")
                    .html("<h3>" + pt1.name + "</h3><p>" + infoCt1 + "</p>");
            } else if (cy1 >= 50 && cy1 <= myState.height && cx1 > 0 && cx1 < myState.width + 20) {
                cy1 -= 30;
                cx1 -= 25;
                myState.tooltip1.classed("hidden", false)
                    .attr("style", "left:" + cx1 + "px; top:" + cy1 + "px")
                    .html("<h3>" + pt1.name + "</h3><p>" + infoCt1 + "</p>");
            }

            if(cy2 > 0 && cy2 < 50 && cx2 > 0 && cx2 < myState.width + 20) {
                cy2 += 30;
                cx2 -= 25;
                myState.tooltip2.classed("hidden", false)
                    .attr("arrow", "top")
                    .attr("style", "left:" + cx2 + "px; top:" + cy2 + "px")
                    .html("<h3>" + pt2.name + "</h3><p>" + infoCt2 + "</p>");
            } else if (cy2 >= 50 && cy2 <= myState.height && cx2 > 0 && cx2 < myState.width + 20) {
                cy2 -= 30;
                cx2 -= 25;
                myState.tooltip2.classed("hidden", false)
                    .attr("style", "left:" + cx2 + "px; top:" + cy2 + "px")
                    .html("<h3>" + pt2.name + "</h3><p>" + infoCt2 + "</p>");
            }
        })
        .on("mouseout", function(d){
            d3.selectAll(".arcs").attr("state","show");
            myState.tooltip1.classed("hidden", true).attr("arrow", "bottom");
            myState.tooltip2.classed("hidden", true).attr("arrow", "bottom");
        });
}

function increment (obj, key) {
    obj[key] += 1;
    return obj;
}

function buildChart() {
    var width = parseInt(document.querySelector(".content-time").offsetWidth) - 40,
        height = 200;

    var chartContainer = d3.select(".content-time").append("svg")
        .attr("id", "chart-container-svg")
        .attr("width", width)
        .attr("height", height);
    var rectX,
        markA,
        markB;

    var offsetX = 40;

    var scaleX = d3.time.scale().range([0, width - offsetX]).domain(d3.extent(weiboData.timeCollec, function(d){return d.key;})),
        scaleY = d3.scale.linear().range([height - 30, 0]).domain([0, d3.max(weiboData.timeCollec, function(d){return d.values})]);

    var xAxis = d3.svg.axis().scale(scaleX).orient("bottom").ticks(10),
        yAxis = d3.svg.axis().scale(scaleY).orient("left").ticks(10);
    var chartLine = d3.svg.line().interpolate("linear")
        .x(function(d){return scaleX(d.key)})
        .y(function(d){return scaleY(d.values)});

    chartContainer.append("path")
        .datum(weiboData.timeCollec)
        .attr("class", "line")
        .attr("d", chartLine)
        .attr("transform", "translate(" + offsetX + ",10)")
        .attr("fill", "none");

    chartContainer.append("g")
        .attr("class","x axis")
        .attr("transform", "translate(" + offsetX + "," + (height - 20) + ")")
        .call(xAxis)

    chartContainer.append("g")
        .attr("class","y axis")
        .attr("transform", "translate(" + (offsetX - 5) + ",10)")
        .call(yAxis)

    //create additional layer to enable data selection
    var overlay = chartContainer.append("g")
        .append("rect")
        .attr("x", "0")
        .attr("y", "10")
        .attr("wdith", "0")
        .attr("height", height - 30);
    var lineCursor = chartContainer.append("line")
        .attr("x1", "0")
        .attr("y1", "10")
        .attr("x2", "0")
        .attr("y2", height - 20)
        .style({display: "none"})
        .style({stroke: "black", "stroke-width": "2px", opacity: "0.5"})

    chartContainer.on("mouseover", function() {
            lineCursor.style({display: null});
        })
        .on("mouseout", function() {
            lineCursor.style({display: "none"});
        })
        .on("mousedown", function() {
            var x0 = d3.mouse(this)[0];
            overlay.attr("width", "0")
                .attr("fill", "darkorange")
                .attr("opacity", "0.3")
                .style({display: null});
            if(x0 >= offsetX) {
                rectX = x0;
                markA = "";
                markB = "";
            }else{if(!rectX){rectX = offsetX;}}
        })
        .on("mousemove", function() {
            var x0 = d3.mouse(this)[0]
            if (x0 < offsetX) {
                if(rectX) {
                    overlay.attr("width", rectX - offsetX);
                }
                lineCursor.attr("x1", offsetX).attr("x2", offsetX);
            }else {
                lineCursor.attr("x1", x0);
                lineCursor.attr("x2", x0);
                if(rectX) {
                    if(rectX > x0) {
                        overlay.attr("x", x0).attr("width",rectX - x0);
                        markA = scaleX.invert(x0 - offsetX);
                        markB = scaleX.invert(rectX - offsetX);
                    }
                    else {
                        overlay.attr("x", rectX).attr("width",x0 - rectX);
                        markA = scaleX.invert(rectX - offsetX);
                        markB = scaleX.invert(x0 - offsetX);
                    }
                }
            }
        })
        .on("mouseup", function() {
            rectX = "";
            pickData(markA, markB);
        })
}

function pickData(timeFrom, timeTo) {
    var renderSet = [];
    for(var i=0; i<rawData.length; i++) {
        var date = new Date(parseInt(rawData[i].t) * 1000);
        var nodeTime = new Date(parseInt(rawData[i].t) * 1000 + date.getTimezoneOffset() * 60000 + 8 * 60 * 60000);
        if(nodeTime > timeFrom && nodeTime < timeTo) {
            renderSet.push(rawData[i]);
        }
    }
    myMap.resetRender();
    myMap.drawData(renderSet);
}

function buildTree() {}



//app starts!!
$(".file-icon").click(function(){
    var fileName = $("entry-file").val();

    if(!fileName){
        animation.Jump();
    } else {
        var partName = fileName.split(".");
        var extName = partName[partName.length - 1];
        if (extName !== "csv") {
            animation.Jump();
        } else {
            animation.In();
            setTimeout(parseCSV, 300);
            setTimeout(animation.Out, 2000);
            console.log(weiboData);
        }
    }
});
