import { insertAfter } from "./annotation_utils.js"
//import { PDFViewerApplication } from "../viewer.js"

/* 插入注释工具按钮 */
class AnnotationBar {

    constructor(params) {
        //this.config = PDFViewerApplication.appConfig;
    }

    insertAnnotationButton() {
        this.lineAnnotationButton = document.createElement("button");
        this.lineAnnotationButton.setAttribute("id", "lineAnnotation");
        this.lineAnnotationButton.setAttribute("class", "toolbarButton");
        this.lineAnnotationButton.setAttribute("title", "Line Tool");
        this.lineAnnotationButton.setAttribute("data-l10n-id", "line_annotation");
		this.lineAnnotationButton.nodeValue = "按钮";
        // 插入 lineAnnotationButton 到 toolbarViewerBottom 子元素
        this.toolbarViewerBottom.appendChild(this.lineAnnotationButton);
        var lineSpan = document.createElement("span");
        lineSpan.setAttribute("data-l10n-id", "line_annotation_label");
        lineSpan.nodeValue = "Line Annotation";
        // 插入 span 到 button 子元素
        this.lineAnnotationButton.appendChild(lineSpan);
    }

    /* 插入存放注释工具集的容器 */
    insertToolBarViewerBottom() {
		var toolbarContainer = document.getElementById("toolbarContainer");
		var toolbarViewer = document.getElementById("toolbarViewer");
		var viewerContainer = document.getElementById("viewerContainer");
		var sidebarContainer = document.getElementById("sidebarContainer");
		var toolbarSidebar = document.getElementById("toolbarSidebar");
		toolbarContainer.style.height = "64px";
		toolbarViewer.style.height = "64px";
		sidebarContainer.style.top = "64px";
		viewerContainer.style.top = "64px";
		toolbarSidebar.style.top = "64px";
        this.toolbarViewerBottom = document.createElement("div");
        this.toolbarViewerBottom.setAttribute("id", "toolbarViewerBottom");
		this.toolbarViewerBottom.style.top = "32px";
		this.toolbarViewerBottom.style.position = "absolute";

        var toolbarViewerMiddle = document.getElementById("toolbarViewerMiddle");

        insertAfter(toolbarViewerMiddle, this.toolbarViewerBottom);
    }
}

export {
    AnnotationBar,
}