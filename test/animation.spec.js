const animation = require("../src/javascript/animation.js");

describe("spinner rendering", ()=>{
    beforeEach(()=>{
        setFixtures(
            `<div>
                <div class="overlay"></div>
                <div class="content"></div>
            </div>`
        );
    });

    it("spinner should be activated", ()=>{
        animation.In();
        expect($(".overlay").hasClass("active")).toBeTruthy();
    });

    it("content should be displayed", ()=>{
        animation.In();
        expect($(".content").css("display")).toEqual("block");
    });
});

describe("spinner fadding", ()=>{
    beforeEach(()=>{
        setFixtures(
            `<div>
                <div class="overlay"></div>
                <div class="sidebar"></div>
                <div class="intro"></div>
                <div class="content">
                    <div class="content-map"></div>
                    <div class="content-time"></div>
                    <div class="content-tree"></div>
                </div>
                <footer></footer>
            </div>`
        );
    });

    it("spinner should disappear", ()=>{
        animation.Out();
        expect($(".overlay").hasClass("active")).toBeFalsy();
    });

    it("introduction tab should be hidden", ()=>{
        animation.Out();
        expect($(".intro").css("display")).toEqual("none");
    });

    it("footer should be hidden", ()=>{
        animation.Out();
        expect($("footer").css("display")).toEqual("none");
    });

    it("map should be rendered", ()=>{
        animation.Out();
        setTimeout(()=>{
            expect($(".content-map").css("top")).toEqual("0");
        }, 3000);
    });

    it("time should be rendered", ()=>{
        animation.Out();
        setTimeout(()=>{
            expect($(".content-time").css("top")).toEqual("0");
        }, 3000);
    });

    it("tree should be rendered", ()=>{
        animation.Out();
        setTimeout(()=>{
            expect($(".content-tree").css("top")).toEqual("0");
        }, 3000);
    });
});

describe("file button", ()=>{
    beforeEach(()=>{
        setFixtures(`
            <input type="file" name="entry-file" id="entry-file">
            <label for="entry-file" class="file-label">
                    <span>Choose a file</span>
            </label>
            `)
    });

    it("should start shaking", ()=>{
        animation.Jump();
        const input = $("#entry-file + label");
        expect(input.css("animation")).toBeTruthy();
    });

    it("should end shaking", ()=>{
        animation.Jump();
        const input = $("#entry-file + label");
        setTimeout(()=>{
            expect(input.css("animation")).toBeTruthy();
        }, 1100);
    });
})
