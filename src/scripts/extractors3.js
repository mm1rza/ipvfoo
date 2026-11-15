const NODE_KEY_MAP = {
  g: "g",
  path: "path",
  "#text": "text",
  title: "title",
  svg: "svg",
  defs: "defs",
  use: "use"
};
const SVG_INFO_KEYS = ["g", "path", "text", "title", "defs", "use", "svg"];

function extract_svg () {
  const images = $$("svg");
  const rows = [];
  let total_bytes = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const svginfo = { title: 0, text: 0, path: 0, g: 0, svg: 0, defs: 0, use: 0, other: 0 };

    const children = img.childNodes;
    for (let n = 0; n < children.length; n++) {
      const key = NODE_KEY_MAP[children[n].nodeName];
      svginfo[key ? key : "other"]++;
    }

    // Cache layout-triggering reads once
    const width = img.clientWidth;
    const height = img.clientHeight;
    const viewBox = img.getAttribute("viewBox") || "-";
    const id = img.id || "-";

    const nodeSummary = [];
    for (const key of SVG_INFO_KEYS) {
      if (svginfo[key] > 0) nodeSummary.push(`${key} (${svginfo[key]})`);
    }

    const svgnode = img.cloneNode(true);
    svgnode.setAttribute("style", "");
    const svg_content = svgnode.outerHTML;
    const byte_size = new Blob([svg_content]).size; // accurate byte count vs UTF-16 length
    total_bytes += byte_size;

    rows.push(`
      <tr>
        <td style='width:33%;'>${id}</td>
        <td><span class='nowrap'>${width}x${height}</span></td>
        <td>${viewBox}</td>
        <td>${nodeSummary.join(" ")}</td>
        <td>${byte_size}</td>
        <td class='svgouter' id='svg_preview_${i}'>${svg_content}</td>
        <td>
          <button class="btn iconbutton p-0" type="button" data-action='download' data-dlid='svg_preview_${i}' data-bs-toggle='tooltip' data-bs-title='download' data-tippy-delay='[500,0]'>
            <svg class="icon nopointer">
              <use xlink:href="#ico-arrow-down"></use>
            </svg>
          </button>
        </td>
      </tr>`);
  }

  if (rows.length) {
    sections.svg.out += `
      <div class='ad_seo_item'>
        <span class="attr_name">{{total_bytes}}</span> ${total_bytes}<br><br>
        <table cellspacing=0 class='table'>
          <tr><th>ID</th><th>CLIENT SIZE</th><th>VIEWBOX</th><th>1ST LEVEL NODES</th><th>BYTES</th><th>PREVIEW</th><th></th></tr>
          ${rows.join("")}
        </table>
      </div>`;
    sections.svg.count = 1;
  }
}