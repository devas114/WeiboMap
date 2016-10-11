"use strict";
( function ($) {
    var input = $("#entry-file"),
        label = input.next("label"),
        labelVal = label.html();

    input.on("change", function (e) {
        var fileName = "";
        if (e.target.value) {
            fileName = e.target.value.split("\\").pop();
        }
        if (fileName) {
            label.find("span").html(fileName);
        } else {
            label.html(labelVal);
        }
    })
})( jQuery )
