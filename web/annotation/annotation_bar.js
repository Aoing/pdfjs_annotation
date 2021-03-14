import { insertAfter, GlobalConfig } from "./annotation_utils.js"

// 注释按钮类，可添加新的注释类型按钮
class AnnotationButton{
	constructor(params){
		this.id = params.id;
		this.type = params.type;
		this.attributes = params.attributes;
		this.spanNodeValue = params.spanNodeValue;
		this.name = params.name;
		this.annotationType = params.annotationType;
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

/* 注释工具容器 */
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

}

export {
    AnnotationBar,
	AnnotationButton,
}