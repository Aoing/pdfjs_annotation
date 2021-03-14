import { insertAfter, GlobalConfig } from "./annotation_utils.js"
//import { PDFViewerApplication } from "../viewer.js"

class AnnotationButton{
	constructor(params){
		this.id = params.id;
		this.type = params.type;
		this.attributes = params.attributes;
		this.spanNodeValue = params.spanNodeValue;
		this.name = params.name;
		//this.element = null; // 当前元素
	}
	
	// 创建元素并且配置属性，最后加入到全局配置中
	createElement(){

		this.button = document.createElement(this.type);
		this.button.setAttribute("id", this.id);
		this.button.style.position = "relative";

		// 添加属性
		if(this.attributes != null){
			for (var key in this.attributes) {
				this.button.setAttribute(key, this.attributes[key]);
			}
		}

		this.buttonSpan = document.createElement("span");
        this.buttonSpan.setAttribute("data-l10n-id", this.spanNodeValue);
        this.buttonSpan.nodeValue = this.spanNodeValue;
        // 插入 span 到 button 子元素
        this.button.appendChild(this.buttonSpan);

		/* 添加到全局配置中 */
		GlobalConfig.annotationButton[this.name] = this.button; 

		return this.button;
	}
	
}

/* 插入注释工具按钮 */
class AnnotationBar {

    constructor(params) {
        //this.config = PDFViewerApplication.appConfig;
		this.annotationButtons = params.annotationButtons;

		// 创建容器
        this.toolbarViewerBottom = document.createElement("div");
        this.toolbarViewerBottom.setAttribute("id", "toolbarViewerBottom");
		this.toolbarViewerBottom.style.top = "32px";
		this.toolbarViewerBottom.style.position = "absolute";
    }

	create(){
		if(this.annotationButtons != null && this.annotationButtons.length > 0){
			// 先改变由于增加一个容器导致的其他元素样式变化
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
			var toolbarViewerMiddle = document.getElementById("toolbarViewerMiddle");
        	insertAfter(toolbarViewerMiddle, this.toolbarViewerBottom);	// 插入容器

			// 插入按钮
			for (let i = 0; i < this.annotationButtons.length; i++) {
				const button = this.annotationButtons[i];
				// 插入 lineAnnotationButton 到 toolbarViewerBottom 子元素
				this.toolbarViewerBottom.appendChild(button);
				
			}
		}
	}

	// 插入注释按钮到注释工具集容器中
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
		GlobalConfig.annotationButton["lineAnnotationButton"] = this.lineAnnotationButton; 
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
	AnnotationButton,
}