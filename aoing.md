## 1. 放在 web 项目中使用时步骤：
	1. 编译：gulp generic
	2. 将编译后的文件：\build\generic 下的文件 build 和 web 放到 web 项目的 webapp 目录下
	3. 将样式文件和 svg 图片拷贝过去，样式文件放到 web 目录下，图片放到 web/images 目录下
	4. 注意在 viewer.html 中引入样式文件
	5. 注意修改 script 标签，添加 type="module" ，否在会报错：Uncaught SyntaxError: Cannot use import statement outside a module
	![](https://aoing-1301320790.cos.ap-shanghai.myqcloud.com/markdown/20210314163928.png)
	![](https://aoing-1301320790.cos.ap-shanghai.myqcloud.com/markdown/20210314164012.png)

## 2. node 直接运行
	1. gulp server
	2. 打开网址：http://localhost:8888/web/viewer.html