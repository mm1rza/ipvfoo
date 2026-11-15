chrome.storage.local.get(['page', 'sections'], function (result) {
    if (!result) result = {};
    var page = result.page || { url: window.location.href || "" };
    var sections = result.sections || {};

    const defaultSectionKeys = [
        "common", "hreflang", "social", "structureddata", "mobile",
        "videos", "markup", "links", "presentation",
        "externalr", "rhints", "security", "cms", "other", "svg"
    ];
    defaultSectionKeys.forEach(k => {
        if (!sections[k]) sections[k] = { out: "", count: 0 };
        else if (sections[k].out === undefined) sections[k].out = "";
    });

    var out = `
    <section id="url" data-title="Url">
      <h1>${page.url || ""}</h1>
    </section>  
    <section id="common" data-title="{{section_common}}">
        <h2>{{section_common}}</h2>
        <p>${sections.common.out}</p>
    </section>
    <section id="hreflang" class="c${sections.hreflang.count || 0}" data-title="{{section_hreflang}}">
        <h2>{{section_hreflang}}</h2>
        <p>${sections.hreflang.out}</p>
    </section>
    <section id="social" class="c${sections.social.count || 0}" data-title="SOCIAL">
        <h2>SOCIAL</h2>
        <p>${sections.social.out}</p>    
    </section>
    <section id="structureddata" class="c${sections.structureddata.count || 0}" data-title="{{section_structureddata}}">
        <h2>{{section_structureddata}}</h2>
        <p>${sections.structureddata.out}</p>        
    </section>
    <section id="mobile" data-title="MOBILE">
        <h2>MOBILE</h2>
        <p>${sections.mobile.out}</p>
    </section>
    <section id="videos" class="c${sections.videos.count || 0}" data-title="VIDEO AND AUDIO">
        <h2>VIDEO AND AUDIO</h2>
        <p>${sections.videos.out}</p>
    </section>
    <section id="markup" class="c${sections.markup.count || 0}" data-title="MARKUP">
        <h2>MARKUP</h2>
        <p>${sections.markup.out}</p>
    </section>
    <section id="links" class="c${sections.links.count || 0}" data-title="LINKS">
        <h2>LINKS</h2>
        <p>${sections.links.out}</p>    
    </section>
    <section id="presentation" class="c${sections.presentation.count || 0}" data-title="{{section_presentation}}">
        <h2>{{section_presentation}}</h2>
        <p>${sections.presentation.out}</p>    
    </section>
    <section id="externalr" class="c${sections.externalr.count || 0}" data-title="{{section_externalr}}">
        <h2>{{section_externalr}}</h2>
        <p>${sections.externalr.out}</p>    
    </section>
    <section id="rhints" class="c${sections.rhints.count || 0}" data-title="{{section_resourcehints}}">
        <h2>{{section_resourcehints}}</h2>
        <p>${sections.rhints.out}</p>    
    </section>
    <section id="security" class="c${sections.security.count || 0}" data-title="SECURITY">
        <h2>SECURITY</h2>
        <p>${sections.security.out}</p>   
    </section>
    <section id="cms" class="c${sections.cms.count || 0}" data-title="CMS">
        <h2>CMS</h2>
        <p>${sections.cms.out}</p>        
    </section>
    <section id="other" class="c${sections.other.count || 0}" data-title="{{section_othermetadata}}">
        <h2>{{section_othermetadata}}</h2>
        <p>${sections.other.out}</p>   
    </section>
    <section id="svg" class="c${sections.svg.count || 0}" data-title="{{section_othermetadata}}">
        <h2>{{section_inlinesvg}}</h2>
        <p>${sections.svg.out}</p>  
    </section>
    `;

    function getMsg(key) {
        if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
            const m = chrome.i18n.getMessage(key);
            if (m) return m;
        }
        const fallbackTitles = {
            "section_common": "COMMON",
            "section_hreflang": "HREFLANG / ALTERNATES",
            "section_structureddata": "STRUCTURED DATA",
            "section_presentation": "PRESENTATION",
            "section_externalr": "EXTERNAL RESOURCES",
            "section_resourcehints": "RESOURCE HINTS",
            "section_othermetadata": "OTHER META DATA",
            "section_inlinesvg": "INLINE SVG",
            "print": "PRINT",
            "copy": "COPY"
        };
        return fallbackTitles[key] || key.replace(/^section_/, "").toUpperCase();
    }

    out = out.replace(/\{\{(.+?)\}\}/g, function (match, contents) {
        return getMsg(contents);
    });

    var target = document.querySelector(".report");
    if (target) {
        target.insertAdjacentHTML("afterbegin", out);
    }

    out = "<ul>";

    document.querySelectorAll("section:not(.c0), .container").forEach(menuitem => {
        out += "<li" + (menuitem.tagName == "DIV" ? " class='subsection'" : "") + "><a href='#" + menuitem.id + "'>" + (menuitem.dataset.title || menuitem.id) + "<input type='checkbox'></a></li>";
    });
    out += "</ul><div style='display:flex;'>";
    out += "<button id='print'><img src='images/print-24px.svg'>" + getMsg("print") + "</button>";
    out += "</div>";

    out = out.replace(/\{\{(.+?)\}\}/g, function (match, contents) {
        return getMsg(contents);
    });

    target = document.querySelector(".section-nav");
    if (target) {
        target.insertAdjacentHTML("afterbegin", out);
    }

    const printBtn = document.getElementById('print');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute("id");
            const navLink = document.querySelector(`nav li a[href="#${id}"]`);
            if (navLink && navLink.parentElement) {
                if (entry.intersectionRatio > 0) {
                    navLink.parentElement.classList.add("active");
                } else {
                    navLink.parentElement.classList.remove("active");
                }
            }
        });
    });

    document.querySelectorAll("section:not(.c0), .container[id]").forEach(section => {
        observer.observe(section);
    });
});
