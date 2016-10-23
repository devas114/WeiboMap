describe("Navigation bar on mobile device", ()=>{
    beforeEach(()=>{
        setFixtures(`
            <nav id="nav">
                <div class="nav-mobile mobile-open active">
                    <i class="fa fa-bars fa-3" aria-hidden="true"></i>
                </div>
                <div class="nav-mobile mobile-close">
                    <i class="fa fa-times fa-3" aria-hidden="true"></i>
                </div>
            </nav>
        `);
        require("../src/javascript/nav.js");
    });

    it("Menu bar can be opened", ()=>{
        const menuButton = $(".mobile-open");
        menuButton.trigger("click");
        expect(menuButton.hasClass("active")).toBeFalsy();
        expect($("#nav").hasClass("active")).toBeTruthy();
        expect($(".mobile-close").hasClass("active")).toBeTruthy();
    });

    it("Menu bar can be closed", ()=>{
        const menuClose = $(".mobile-close");
        menuClose.trigger("click");
        expect(menuClose.hasClass("active")).toBeFalsy();
        expect($("#nav").hasClass("active")).toBeFalsy();
        expect($(".mobile-open").hasClass("active")).toBeTruthy();
    });

})
