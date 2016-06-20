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
var myData;
var china_cities;
var svg_map, svg_tree, temp, dataMap, treeData, mark_a, mark_b;
var map_zoom = d3.behavior.zoom()
    .scaleExtent([0.8,5])
    .on("zoom", move_map);
var tree_zoom = d3.behavior.zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", move_tree);

var width = 0.765 * window.innerWidth,
    height = 0.8 * window.innerHeight;
var cities, provinces, circles, arclines, labels;

var proj = d3.geo.mercator().center([105, 38]).scale(750).translate([width / 2, height / 2]);
var path = d3.geo.path().projection(proj);
var map_overlay;
var map_feature, map_overlay;
var mapCollection;
var lineGroup;

d3.json("data/cities.json", function(error, json){
    if(error)return console.error(error);
    china_cities = json;
});

$("#parse").on("click", function(){
    if(!$("#choose").val()){
        $("#alert-no-file").css("display", "block");
    }
    else{
        $("#alert-no-file").css("display", "none");
        window.location="#t1";
        parseCSV();
    }
})
//document.getElementById("parse").addEventListener("click",parseCSV);
//document.getElementById("btn-map").addEventListener("click",showMap);
//document.getElementById("btn-tree").addEventListener("click",showTree);
document.getElementById("dept-view").addEventListener("click",function(){
    clearTree();
});
document.getElementById("bred-view").addEventListener("click",function(){
    clearTree();
});


function showMap(){
    document.getElementById("btn-map").className = "active";
    document.getElementById("btn-tree").removeAttribute("class");
    document.getElementById("chart-container").style.display="block";
    document.getElementById("tree-container").style.display="none";
    try{
        var element_tree = document.getElementById("tree-container-svg");
        element_tree.parentNode.removeChild(element_tree);
    }catch(err){}
    document.getElementById("map-container").style.display="block";
    if(mark_a && !mark_b){
        pickData("map")
    };
};

function showTree(){
    document.getElementById("btn-tree").className = "active";
    document.getElementById("btn-map").removeAttribute("class");
    document.getElementById("map-container").style.display="none";
    document.getElementById("chart-container").style.display="none";
    document.getElementById("tree-container").style.display="block";
    growTree(treeData[0]);
};


function Render(data){
    //create map and its overlay
    svg_map = d3.select("#map-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display","block")
        .style("border","1px solid rgba(0, 0, 0, .5)")
        .call(map_zoom)
        .append("g");
    map_feature = svg_map.append("g").attr("id","map-feature");
    map_overlay = svg_map.append("g").attr("id","map-overlay");

    //preprocess location data and calculate clusters
    var prov_nest = {};
    myData.forEach(function(item){
        if(item.user_location == undefined){item.user_location = "其他 其他";}
        var loc = item.user_location.split(" ");
        var city, match;
        if(loc[0] == "海外"){loc=["其他","其他"];}
        if(loc.length == 2){
            city = loc[1];
            match = china_cities[city];
            if(match){item.city = city; item.prov = match.prov;}
            else{
                city = loc[0];
                match = china_cities[city];
                if(match){item.city = city; item.prov = match.prov;}
                else{console.log(item)}
            }

        }else if(loc.length == 1){
            if(city_ref[loc[0]] != undefined){ city = city_ref[loc[0]];}else{city=loc[0];}
            try{
                match = china_cities[city];
                item.city = city;
                item.prov = match.prov;
            }catch(err){
                console.log(item);
            }
        }else{ console.log("user_location error, Please check you data")};

        if(prov_nest[item.prov]){
            prov_nest[item.prov].values += 1;}
        else{
            prov_nest[item.prov] = {key: item.prov, values: 1};
        }
    });

    //read map data and create svg map
    d3.json("data/china_provinces.json", function(err, states){
        if(err) throw err;
        map_feature.selectAll(".states")
            .data(states.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "states")
            .attr("id", function(d){ return "prov-" + d.properties.name})
        var prov_names = Object.keys(prov_nest);
        prov_names.forEach(function(item){
            var count = prov_nest[item].values;
            var name = prov_nest[item].key;
            var proportion = count / myData.length;
            if(proportion>0.02 && proportion<=0.04){
                temp = d3.select("#prov-" + name).attr("occupy",0)}
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


    createTree(data);
    createChart();
}


//generateChart(weibo);
/*
function makeMap(error, counties, states) {
    cities = svg.selectAll(".counties")
        .data(counties.features)
        .enter()
        .append("path")
        //fill out the color
        //.attr("class", function(d) { return "q" + rateById.get(d.id); })
        .attr("d", path)
        .attr("id", function(d) {return d.id;})
        .attr("class", "counties")
        .attr("fill", "#d7c4bb");
        //.on("mouseover", function(d) {
        //    var m = d3.mouse(d3.select("body").node());
        //    tooltip.style("display", null)
        //        .style("left", m[0] + 10 + "px")
        //        .style("top", m[1] - 10 + "px");
        //    $("#tt_county").text(d.properties.name);
        //})
        //.on("mouseout", function() {
        //    tooltip.style("display", "none");
        //});

    provinces = svg.selectAll(".states")
        .data(states.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "states")



    labels = svg.selectAll(".place-label")
        .data(testdata)
        .enter()
        .append("text")
        .attr("class", "place-label")
        .attr("id", function(d){return d.name;})
        .attr("transform", function(d){return "translate(" + proj(d.coordinate) + ")";})
        .attr("dx", "6px")
        .attr("dy", ".35em")
        .attr("font-size", "24px")
        .attr("text-anchor", "start")
        .text(function(d){return d.name;})
        .attr("visibility", "hidden");
    mapCollection = d3.selectAll('#map-container g');
}
*/
function move_map(){
/*
    var t = d3.event.translate;
    var s = d3.event.scale;
    zscale=s;
    var h = height / 4;

    t[0] = Math.min(
        (width / height) * (s - 1),
        Math.max(width * (1-s), t[0])
    );

    t[1] = Math.min(
        h * (s - 1) + h * s,
        Math.max(height * (1 - s) - h * s, t[1])
    );

    map_zoom.translate(t);
    svg_map.attr("transform", "translate(" + t + ")scale(" + s + ")");
    circles.attr("r", 5 / s);
    lineGroup.style("stroke-width", function(d){d.width / s});
    labels.style("font-size", 18 / s).attr("dx", 6/s+"px").attr("dy", 0.35/s+"em");
*/
    var s = d3.event.scale;
    map_feature.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    map_overlay.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    try{
        labels.style("font-size", 18 / s).attr("dx", 6/s+"px").attr("dy", 0.35/s+"em")
    }catch(err){}
}
function move_tree(){
    svg_tree.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function createCurve(line_mark){
    var cname1 = line_mark.key.split("-")[0];
    var cname2 = line_mark.key.split("-")[1];
    var pt1 = {name:cname1, coordinate: [china_cities[cname1].logi, china_cities[cname1].latt]};
    var pt2 = {name:cname2, coordinate: [china_cities[cname2].logi, china_cities[cname2].latt]};

    var line_width;
    if(line_mark.values<=5){ line_width = 2;}
    else if(line_mark.values>5 && line_mark.values<=10){line_width = 4;}
    else if(line_mark.values>10 && line_mark.values<=20){line_width = 6;}
    else if(line_mark.values>20){line_width = 8;}

    var B1 = function(x){
        return 1 - 2 * x + x * x;
    };

    var B2 = function(x){
        return 2 * x - 2 * x * x;
    };

    var B3 = function(x){
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
    if (lng2 > lng1){
        if (parseFloat(lng2-lng1) > 180){
            if (lng1 < 0){
                lng1 = parseFloat(180 + 180 + lng1);
            }
        }
    }

    if (lng1 > lng2){
        if (parseFloat(lng1-lng2) > 180){
            if (lng2 < 0){
                lng2 = parseFloat(180 + 180 + lng2);
            }
        }
    }
    j = 0;
    t2 = 0;
    if (lat2 == lat1){
        t = 0;
        h = lng1 - lng2;
    } else if (lng2 == lng1){
        t = Math.PI / 2;
        h = lat1 - lat2;
    } else {
        t = Math.atan((lat2 - lat1) / (lng2 - lng1));
        h = (lat2 - lat1) / Math.sin(t);
    }
    if (t2 == 0){
        t2 = (t + (Math.PI / 5));
    }
    h2 = h / 2;
    lng3 = h2 * Math.cos(t2) + lng1;
    lat3 = h2 * Math.sin(t2) + lat1;

    for (i = 0; i < count + 1; i++){
        curveCoordinates.push([
            (lat1 * B1(inc) + lat3 * B2(inc) + lat2 * B3(inc)),
            (lng1 * B1(inc) + lng3 * B2(inc) + lng2 * B3(inc))

        ]);
        inc = inc + (1 / count);
    }

    var route = [{type: "LineString", coordinates:curveCoordinates, line_width:line_width}];
    var arcs = map_overlay.selectAll(".arc").data(route)
    lineGroup = arcs.enter()
        .append("path")
        .attr("fill", "none")
        .attr("class", "arcs")
        .attr("d", path)
        .attr("selected", "maybe")
        .style("stroke-width", function(d){return d.line_width})
        .attr("id", function(d){return pt1.name + "-" + pt2.name;})
        .on("mouseover", function(d){
            var marker1 = "#place-label-" + pt1.name;
            var marker2 = "#place-label-" + pt2.name;
            svg_map.select(marker1).attr("visibility", "visible");
            svg_map.select(marker2).attr("visibility", "visible");
            d3.selectAll(".arcs").attr("selected", "no");
            d3.select(this).attr("selected","yes");})
        .on("mouseout", function(d){
            var marker1 = "#place-label-" + pt1.name;
            var marker2 = "#place-label-" + pt2.name;
            svg_map.select(marker1).attr("visibility", "hidden");
            svg_map.select(marker2).attr("visibility", "hidden");
            d3.selectAll(".arcs").attr("selected","maybe");});

/*
    var l_collection = [];
    var line = d3.svg.line()
        .x(function(d){ return proj([d.latt,d.logi])[0]})
        .y(function(d){ return proj([d.latt,d.logi])[1]});

    for(i=1;i<curveCoordinates.length;i++){
        l_collection.push([
            {"latt":curveCoordinates[i-1][0],"logi":curveCoordinates[i-1][1]},
            {"latt":curveCoordinates[i][0],"logi":curveCoordinates[i][1]}
        ])
    }

    map_overlay.selectAll("#arc")
        .data(l_collection)
        .enter()
        .append("path")
        .attr("d", function(d){return line(d)})
        .style("stroke-width", "3px")
        .style("stroke", function(d,i){return color((parseInt(i)+1)/30)});
*/
}

function createTree(myData){
    treeData = [];
    dataMap = myData.reduce(function(map, node){
        map[node.mid] = node;
        return map;
    },{});
    myData.forEach(function(node){
        var parent = dataMap[node.parent];
        if (parent) {
            (parent.children || (parent.children = [])).push(node);
        }else{
            treeData.push(node);
        };
        var timestemp = parseInt(node.t)*1000;
        if (!timestemp){
            alert("invavlid time format")}
        else{
            var date = new Date(timestemp);
            var cdate = new Date(timestemp + date.getTimezoneOffset()*60000 + 8*60*60000);
            node.time = cdate.getFullYear()+"-"+(cdate.getMonth()+1)+"-"+cdate.getDate()+"-"+cdate.getHours()+"-"+cdate.getMinutes();
        };
    });
    var tree = d3.layout.tree().size([600, 960]);
    var nodes = tree.nodes(treeData[0]).reverse();
    root = treeData[0];
    console.log(root);
}

function growTree(source){
    var tree = d3.layout.tree().size([900,1200]);
    var diagonal = d3.svg.diagonal()
        .projection(function(d){return [d.y, d.x];});

    svg_tree = d3.select("#tree-container").append("svg")
        .attr("id","tree-container-svg")
        .attr("width", 960)
        .attr("height", 600)
        .call(tree_zoom)
        .append("g")
        .attr("transform", "translate(120,20)");
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);
    nodes.forEach(function(d){return d.y = d.depth * 180;});

    var link = svg_tree.selectAll(".link")
        .data(links);

    link.enter().append("line")
        .attr("class","link")
        .attr("id", function(d){ return "tree-link-" + d.target.mid})
        .attr("x1", function(d) { return d.source.y; })
        .attr("y1", function(d) { return d.source.x; })
        .attr("x2", function(d) { return d.target.y; })
        .attr("y2", function(d) { return d.target.x; })
        .attr("selected", "maybe");

    var node = svg_tree.selectAll(".node")
        .data(nodes, function(d){ return d.mid;});

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("id", function(d){return "tree-g-"+d.mid})
        .attr("transform", function(d){
            return "translate(" + d.y + "," + d.x + ")";
        })
        .on("mouseover", function(d){
            d3.select(this).select("text").attr("visibility","visible")
            d3.select(this).append("circle").attr("id","circle-marker").attr("r",6).style("stroke","black").attr("fill","none");
        })
        .on("mouseout", function(d){
            d3.select(this).select("text").attr("visibility","hidden")
            d3.select(this).select("#circle-marker").remove();
        })
        .on("click", function(d){
            if(mark_b){
                mark_a=""; mark_b=""
            }
            var leaf_node = d3.select(this);
            if(document.getElementById("dept-view").checked == true){
                clearTree()
                mark_a = leaf_node;
                traceBack(leaf_node, "no");
            }
            else if(document.getElementById("bred-view").checked == true){

                if(mark_a){
                    searchOut(mark_a, "yes");
                }
                mark_a = leaf_node;
                searchOut(leaf_node, "no");
            }

        });
    nodeEnter.append("circle")
        .attr("r", 1)
        .attr("id", function(d){return "tree-node-"+d.mid})
        .attr("selected", "no");
    nodeEnter.append("text")
        .attr("x", function(d){
            return d.children || d._children ? -13 : 13;})
        .attr("dy", ".35em")
        .attr("id", function(d){return "tree-text-"+d.mid})
        .attr("text-anchor", "start")
        .text(function(d){ return d.screen_name; })
        .style("fill-opacity", 0.8)
        .attr("visibility", "hidden");

    if(mark_a && !mark_b){
        if(document.getElementById("dept-view").checked == true){
            traceBack(mark_a, "no");
        }
        else if(document.getElementById("bred-view").checked == true){
            searchOut(mark_a, "no");
        }
    }else if(mark_a && mark_b){
        pickData("tree");
    }
}

function markTreeNode(node){
    node.select("circle")
        .attr("selected", "yes");
    node.select("text")
        .attr("visibility","visible");
};

function unmarkTreeNode(node){
    node.select("circle")
        .attr("selected", "no");
    node.select("text")
        .attr("visibility","hidden");
};

function traceBack(node, n_switch){
    var this_node = node.attr("id").split("-")[2];
    console.log(this_node);
    var next_node = dataMap[this_node].parent.mid;
    if(n_switch=="no"){
        markTreeNode(node);
    }else if(n_switch=="yes"){
        unmarkTreeNode(node);
    };
    if(next_node){
        var node_link = svg_tree.select("#tree-link-"+this_node);
        if(n_switch=="no"){
            node_link.attr("selected", "yes");
        }else if(n_switch=="yes"){
            node_link.attr("selected", "maybe");
        }else{console.log("fail to match")}
        traceBack(svg_tree.select("#tree-g-"+next_node), n_switch);
    }
    else if(!next_node){ return; }
};

function searchOut(node, n_switch){
    var leaf_id = node.attr("id").split("-")[2];
    var leaf_kin = dataMap[leaf_id].children;
    if(n_switch=="yes"){
        unmarkTreeNode(node);
        try{
            unmarkTreeNode(svg_tree.select("#tree-g-"+dataMap[leaf_id].parent.mid));
        }catch(err){console.log("no parent")}
        svg_tree.select("#tree-link-"+leaf_id).attr("selected", "maybe");
        if(leaf_kin){
            for(i=0;i<leaf_kin.length;i++){
                svg_tree.select("#tree-link-"+leaf_kin[i].mid).attr("selected", "maybe");
                unmarkTreeNode(d3.select("#tree-g-"+leaf_kin[i].mid));
            };
        }else{}
    }
    else if(n_switch=="no"){
        markTreeNode(node);
        try{
            markTreeNode(d3.select("#tree-g-"+dataMap[leaf_id].parent.mid));
        }catch(err){console.log("no parent")}
        console.log("id: "+leaf_id);
        if(leaf_kin){
            for(i=0;i<leaf_kin.length;i++){
                svg_tree.select("#tree-link-"+leaf_kin[i].mid).attr("selected", "yes");
                markTreeNode(d3.select("#tree-g-"+leaf_kin[i].mid));
            };
        }else{}
    };
}

//create time chart
function createChart(){
    var nested = d3.nest()
        .key(function(d){return d.time;})
        .rollup(function(leaves){return leaves.length;})
        .entries(myData);

    //a dictionary of time that easy to fetch a specific time
    var time_dic={};

    var chart_container = d3.select("#chart-container").append("svg")
        .attr("id", "chart-container-svg")
        .attr("width", width)
        .attr("height", height);
    var rect_x;
    var parseHour = d3.time.format("%Y-%m-%d-%H-%M").parse;

    //change time format
    nested.forEach(function(node){
        node.key= parseHour(node.key);
    })
    nested.forEach(function(node){
        time_dic[node.key] = node;
    })

    //data that acturally rendered in the time chart
    var chart_time = [];
    var time_extent = d3.extent(nested, function(d){return d.key;})
    chart_time.push(nested[0]);

    //insert additional data in order to prevent render error
    for(i=1; i<nested.length-1; i++){
        var this_time = nested[i].key;
        var prev_time = new Date(this_time.getTime() - 60000);
        var next_time = new Date(this_time.getTime() + 60000);
        if(!time_dic[prev_time]){
            chart_time.push({key:prev_time, values:0});
            time_dic[prev_time] = {key:prev_time, values:0};};
        chart_time.push(nested[i]);
        if(!time_dic[next_time]){
            chart_time.push({key:next_time, values:0});
            time_dic[next_time] = {key:next_time, values:0};};

    }

    var scale_x = d3.time.scale().range([0,width-60]).domain(d3.extent(chart_time, function(d){return d.key;})),
        scale_y = d3.scale.linear().range([height-30,0]).domain([0,d3.max(chart_time, function(d){return d.values})]);

    var xAxis = d3.svg.axis().scale(scale_x).orient("bottom").ticks(10),
        yAxis = d3.svg.axis().scale(scale_y).orient("left").ticks(10);
    var chartLine = d3.svg.line().interpolate("linear")
        .x(function(d){return scale_x(d.key)})
        .y(function(d){return scale_y(d.values)});

    chart_container.append("path")
        .datum(chart_time)
        .attr("class", "line")
        .attr("d", chartLine)
        .attr("transform", "translate(60,10)")
        .attr("fill", "none");

    chart_container.append("g")
        .attr("class","x axis")
        .attr("transform", "translate(60," + (height-20) + ")")
        .call(xAxis)

    chart_container.append("g")
        .attr("class","y axis")
        .attr("transform", "translate(55,10)")
        .call(yAxis)

    //create additional layer to enable data selection
    var overlay = chart_container.append("g")
        .append("rect")
        .attr("x", "0")
        .attr("y", "10")
        .attr("wdith", "0")
        .attr("height", height-30);
    var line_cursor = chart_container.append("line")
        .attr("x1", "0")
        .attr("y1", "10")
        .attr("x2", "0")
        .attr("y2", height-20)
        .style({display: "none"})
        .style({stroke: "black", "stroke-width": "2px", opacity: "0.5"})

    chart_container.on("mouseover", function(){
            line_cursor.style({display: null});
        })
        .on("mouseout", function(){
            line_cursor.style({display: "none"});
        })
        .on("mousedown", function(){
            var x0 = d3.mouse(this)[0];
            overlay.attr("width", "0")
                .attr("fill", "darkorange")
                .attr("opacity", "0.3")
                .style({display: null});
            if(x0>=60){
                rect_x = x0;
                mark_a = "";
                mark_b = "";
            }else{if(!rect_x){rect_x = 60;}}
        })
        .on("mousemove", function(){
            var x0 = d3.mouse(this)[0]
            if (x0<60){
                if(rect_x){
                    overlay.attr("width", rect_x-60);
                }
                line_cursor.attr("x1",60).attr("x2",60);
            }else{
                line_cursor.attr("x1", x0);
                line_cursor.attr("x2", x0);
                if(rect_x){
                    if(rect_x>x0){
                        overlay.attr("x", x0).attr("width",rect_x-x0);
                        mark_a = scale_x.invert(x0-60);
                        mark_b = scale_x.invert(rect_x-60);
                    }
                    else{
                        overlay.attr("x", rect_x).attr("width",x0-rect_x);
                        mark_a = scale_x.invert(rect_x-60);
                        mark_b = scale_x.invert(x0-60);
                    }
                }
            }
        })
        .on("mouseup", function(){
            rect_x = "";
            pickData("map");
        })

};


function parseCSV(weibo){
    var file = document.getElementById("choose").files[0]
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
            console.log("Results: ", results);
            myData=results.data;
            clearRender("map-container");
            clearRender("chart-container");
            Render(myData);
        },
        error: undefined,
        download: undefined,
        skipEmptyLines: false,
        chunk: undefined,
        fastMode: undefined,
        beforeFirstChunk: undefined,
        withCredentials: undefined
    };
    Papa.parse(file,config)
}

function pickData(kw){
    clearRender("map-overlay");
    var target_id;
    var render_set=[];
    if(mark_b){
        for(i=0; i<myData.length; i++){
            var date = new Date(parseInt(myData[i].t)*1000);
            var node_time = new Date(parseInt(myData[i].t)*1000 + date.getTimezoneOffset()*60000 + 8*60*60000);
            if(node_time>mark_a && node_time<mark_b){ render_set.push(myData[i]);}
        }
    }
    else{
        var target_id=mark_a.attr("id").split("-")[2];
        if(document.getElementById("dept-view").checked == true){
            trackLoad(target_id);
        }else if(document.getElementById("bred-view").checked == true){
            searchLoad(target_id);
        }
    }

    function trackLoad(mid){
        var this_id = mid;
        var next_id = dataMap[this_id].parent.mid;
        if(next_id){
            render_set.push(dataMap[this_id]);
            trackLoad(next_id);
        }else{}
    }

    function searchLoad(mid){
        var children = dataMap[mid].children;
        render_set.push(dataMap[mid]);
        if(children){
            for(i=0;i<children.length;i++){
                render_set.push(children[i]);
            }
        };
    }
    console.log(render_set);

    if(kw=="map"){
        drawData(render_set);
    }else if(kw=="tree"){
        markData(render_set);
    }
}

function drawData(render_set){
    if(!render_set[0]){console.log("nothing to render")}
    else{
        var render_nodes=[];
        var render_links=[];
        render_set.forEach(function(d){
            var parent = dataMap[d.parent.mid];
            render_nodes.push(d.city);
            if(parent){
                if (parent.city==undefined || d.city==undefined){
                    console.log("location error");
                    console.log(parent);
                    console.log(d);
                }
                render_links.push(parent.city + "-" + d.city);
            }
        })
        var nest_node = d3.nest()
            .key(function(d){return d;})
            .rollup(function(leaves){return leaves.length;})
            .entries(render_nodes);
        var nest_link = d3.nest()
            .key(function(d){return d;})
            .rollup(function(leaves){return leaves.length;})
            .entries(render_links);

//        console.log(nest_link);

        nest_link.forEach(function(d){
            var source = d.key.split("-")[0];
            if(source in render_nodes){}
            else{
                nest_node.push({key:source, values:0});
            }
            createCurve(d);
        })
        circles = map_overlay.selectAll(".bubble")
            .data(nest_node)
            .enter().append("circle")
            .attr("cx", function(d){return proj([china_cities[d.key].logi, china_cities[d.key].latt])[0];})
            .attr("cy", function(d){return proj([china_cities[d.key].logi, china_cities[d.key].latt])[1];})
            .attr("r", "3px")
            .attr("fill", function(d){
                if(d.values<=5){return "#ff6969";}
                else if(d.values>5 && d.values<=10){return "#ff0b0b";}
                else if(d.values>10 && d.values<=20){return "#a40000";}
                else if(d.values>20){return "#690000";}
            })
/*
            .attr("r", function(d){
                if(d.values<=5){return "4px";}
                else if(d.values>10 && d.values<=20){return "6px";}
                else if(d.values>20 && d.values<=40){return "8px";}
                else if(d.values>40){return "10px";}
            })
*/
            .attr("stroke", "#0089a7")
            .attr("stroke-width", "1px")
            .attr("class", "bubble")
            .attr("selected","no")
            .on("mouseover", function(d){
                var marker = "#place-label-" + d.key;
                map_overlay.select(marker).attr("visibility", "visible");
                d3.selectAll(".arcs").attr("selected", "no");
                d3.selectAll("[id^=\""+ d.key + "\"]").attr("selected", "maybe");
                d3.selectAll("[id$=\""+ d.key + "\"]").attr("selected", "yes");
            })
            .on("mouseout", function(d){
                var marker = "#place-label-" + d.key;
                map_overlay.select(marker).attr("visibility", "hidden");
                d3.selectAll(".arcs").attr("selected", "maybe");
            })
/*
            .on("click", function(d){
                var node_this = d3.select(this);
                if(node_this.attr("selected") == "no"){
                    node_this.attr("selected","yes");
                    var marker = "#place-label-" + d.key;
                    map_overlay.select(marker).attr("visibility", "visible");
                    d3.selectAll(".arcs").attr("selected", "no");
                    d3.selectAll("[id^=\""+ d.key + "\"]").attr("selected", "maybe");
                    d3.selectAll("[id$=\""+ d.key + "\"]").attr("selected", "yes");
                }
                else if(node_this.attr("selected") == "yes"){
                    node_this.attr("selected", "no");
                    var marker = "#place-label-" + d.key;
                    map_overlay.select(marker).attr("visibility", "hidden");
                    d3.selectAll(".arcs").attr("selected", "maybe");
                }
            });
*/
        labels = map_overlay.selectAll(".place-label")
            .data(nest_node)
            .enter()
            .append("text")
            .attr("class", "place-label")
            .attr("id", function(d){return "place-label-" + d.key;})
            .attr("transform", function(d){return "translate(" + proj([china_cities[d.key].logi, china_cities[d.key].latt]) + ")";})
            .attr("dx", "6px")
            .attr("dy", ".35em")
            .attr("font-size", "18px")
            .attr("text-anchor", "start")
            .text(function(d){return d.key+":"+d.values;})
            .attr("visibility", "hidden");

    }
}
// mark tree elements when chart is selected
function markData(render_set){
    if(render_set){
        svg_tree.selectAll("path").attr("selected","no")
        for(i=0;i<render_set.length;i++){
            var this_id = render_set[i].mid;
            var prev_id = render_set[i].parent.mid;
            svg_tree.select("#tree-link-" + this_id).attr("selected","yes");
            console.log("mark path: " + this_id);
            markTreeNode(svg_tree.select("#tree-g-"+ this_id));
            unmarkTreeNode(svg_tree.select("#tree-g-"+ prev_id));
        }
    }
    else{console.log("no element selected")}
}
/*
function clearMap(){
    var trash = document.getElementById("map-overlay");
    while(trash.firstChild){
        trash.removeChild(trash.firstChild);
    }
}
*/
function clearTree(){
    svg_tree.selectAll("line").attr("selected", "maybe");
    svg_tree.selectAll("circle").attr("selected", "no");
    svg_tree.selectAll("text").attr("visibility", "hidden");
}

function clearRender(entry){
    if(typeof(entry) === "string"){
        var trash = document.getElementById(entry);
        while(trash.firstChild){
            trash.removeChild(trash.firstChild);
        }
    }
}
