const fs = require('fs');
const path = require('path');
const currentDirectory = process.cwd();
let showdown  = require('showdown'),
    converter = new showdown.Converter();
let fm = require('front-matter');

module.exports = {
    processFile(filePath, build=false, url='relative') {

        let page = this.getPage(filePath);
    
        const layoutTagExists = /<layout[^>]*>[\s\S]*?<\/layout>/.test(page);

        if (layoutTagExists) {
            layoutAttributes = this.getLayoutAttributes(page);
            
            if(typeof layoutAttributes.src == 'undefined'){
                throw new Error('Layout Tag must include a src');
            }

            let layoutPath = path.join(currentDirectory, '/layouts/', layoutAttributes.src);
            let layout = fs.readFileSync(layoutPath, 'utf8');

            // parse any includes that are inside the layout template
            layout = this.parseIncludeContent(layout);

            // replace {slot} with content inside of Layout
            layout = layout.replace('{slot}', this.parseIncludeContent(this.getPageContent(page)));

            page = this.processCollectionLoops(this.parseShortCodes(this.replaceAttributesInLayout(layout, layoutAttributes), url, build));

            page = this.parseURLs(page, url);
        }

        return page;
    },

    processContent(contentPath, build=false, url='relative') {

        let content = fs.readFileSync(contentPath, 'utf8');

        let pagePath = this.getPageForContent(contentPath);
        console.log('page Path: ' + pagePath);
        let page = this.processFile(pagePath, build, url);

        let contentHTML = converter.makeHtml(this.removeFrontMatter(content));
        let contentAttributes = fm(content).attributes;

        let attrTags = "<script>document.addEventListener('DOMContentLoaded', (event) => { window.frontmatter=JSON.parse('" + JSON.stringify(contentAttributes) + "'); });</script>";
        
        // process frontmatter conditions
        page = this.processFrontMatterConditions(page, contentAttributes);
        page = this.processFrontMatterReplacements(page, contentAttributes);

        page = page.replace('{content}', contentHTML + attrTags);

        return page;

    },

    processFrontMatterReplacements(content, data) {
        const placeholderRegex = /{frontmatter\.([^}]+)}/g;
        
        return content.replace(placeholderRegex, (match, key) => {
            if (data.hasOwnProperty(key)) {
            return data[key];
            }
            return match; // If the key doesn't exist in data, don't replace.
        });
    },

    processFrontMatterConditions(content, data) {
        const conditionRegex = /<If condition="([^"]+)">([\s\S]*?)<\/If>/g;
    
        return content.replace(conditionRegex, (match, condition, body) => {
            // Evaluate the condition using the frontmatter data
            const evalContext = { frontmatter: data };
            let meetsCondition = false;
    
            try {
                const evalFunction = new Function('data', `with(data) { return ${condition}; }`);
                meetsCondition = evalFunction(evalContext);
            } catch (err) {
                console.warn(`Failed to evaluate condition: ${condition}`, err);
            }
    
            return meetsCondition ? body : '';
        });
    },

    // Parse down the directory tree until we find a `.html` file for this content
    getPageForContent(markdownFilePath) {
        const markdownDir = path.dirname(markdownFilePath);
        const markdownFileName = path.basename(markdownFilePath, '.md');
        const htmlFilePath = path.join(markdownDir, `${markdownFileName}.html`);
        const pageHTMLFilePath = htmlFilePath.replace(path.join(currentDirectory, '/content'), path.join(currentDirectory, '/pages'));

        console.log('checking for: ' + pageHTMLFilePath);
        if (fs.existsSync(pageHTMLFilePath)) {
            return pageHTMLFilePath;
        }

        let currentDir = markdownDir.replace(path.join(currentDirectory, '/content'), path.join(currentDirectory, '/pages'));
        let htmlFileName = `${markdownFileName}.html`;
        let inc = 0;
        while (currentDir !== '' && inc < 10) {
            const parentDir = path.dirname(currentDir);
            htmlFileName = path.basename(currentDir) + '.html';
            const parentHtmlFilePath = path.join(parentDir, htmlFileName);
            const indexHtmlFilePath = path.join(currentDir, 'index.html');

            console.log('checking for: ' + indexHtmlFilePath);
            if (fs.existsSync(indexHtmlFilePath)) {
            return indexHtmlFilePath;
            }

            console.log('checking for: ' + parentHtmlFilePath);
            if (fs.existsSync(parentHtmlFilePath)) {
            return parentHtmlFilePath;
            }

            inc++;
            currentDir = parentDir;
        }

        return null;
    },
    getPage(filePath) {
        page = fs.readFileSync(filePath, 'utf8');

        const pageTagRegex = /<page\s+src="([^"]+)"><\/page>/;
        const match = page.match(pageTagRegex);

        if (match) {
          const src = match[1];
          const filePath = path.join(currentDirectory, './pages/', src);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          page = fileContent;
        }
      
        return page;
    },
    removeFrontMatter(markdownContent) {
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = markdownContent.match(frontMatterRegex);
      
        if (match) {
          const frontMatter = match[0];
          const content = markdownContent.replace(frontMatter, '');
          return content.trim();
        }
      
        return markdownContent.trim();
    },
    parseURLs(html, URL) {
        const regex = /{ url\('([^']+)'\) }/g;
        return html.replace(regex, (match, url) => {
            if (URL === 'relative') {
            return url;
            } else {
            return URL.replace(/\/$/, '') + url;
            }
        });
    },

    getLayoutAttributes(page) {
        const layoutTagRegex = /<layout\s+([^>]*)>([\s\S]*?)<\/layout>/;
        const layoutTagMatch = page.match(layoutTagRegex);
    
        if (layoutTagMatch) {
            const attributesString = layoutTagMatch[1];
            const attributesRegex = /(\w+)="([^"]*)"/g;
            let attributeMatch;
            let attributes = {};
    
            while ((attributeMatch = attributesRegex.exec(attributesString)) !== null) {
                attributes[attributeMatch[1]] = attributeMatch[2];
            }
    
            return attributes;
        }
    
        return null;
    },

    replaceAttributesInLayout(layout, layoutAttributes) {
        for (let key in layoutAttributes) {
            let regex = new RegExp(`{${key}}`, 'g');
            layout = layout.replace(regex, layoutAttributes[key]);
        }
        return layout;
    },

    getPageContent(page) {
        const layoutTagRegex = /<layout[^>]*>([\s\S]*?)<\/layout>/;
        const layoutTagMatch = page.match(layoutTagRegex);
    
        if (layoutTagMatch) {
            return layoutTagMatch[1];
        }
    
        return null;
    },

    parseIncludeContent(slotContent){
        let includeTag;
        const includeRegex = /<include src="(.*)"><\/include>/g;
        while ((includeTag = includeRegex.exec(slotContent)) !== null) {
            const includeSrcPath = path.join(currentDirectory, '/includes/', includeTag[1]);
            const includeContent = fs.readFileSync(includeSrcPath, 'utf8');
            slotContent = slotContent.replace(includeTag[0], includeContent);
        }
        return slotContent;
    },

    parseShortCodes(content, url, build=false){
        // {tailwindcss} shortcode
        let assetURL = url.replace(/\/$/, '');
        if(url == 'relative'){ 
            assetURL = ''; 
        }
        let tailwindReplacement = build ? '<link href="' + assetURL + '/assets/css/main.css" rel="stylesheet">' : '<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script>';
        if(!build){
            const moduleExportsContent = this.getModuleExportsContent();
            tailwindReplacement += '<script>tailwind.config = ' + moduleExportsContent.replace(/;*$/, '') + '</script>';
        }
        content = content.replace('{tailwindcss}', tailwindReplacement);
        
        return content;
    },
    getModuleExportsContent() {
        const filePath = './tailwind.config.js';
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const startIndex = fileContent.indexOf('module.exports =') + 'module.exports ='.length;
        const moduleExportsContent = fileContent.substring(startIndex).trim();
        return moduleExportsContent;
    },

    processCollectionLoops(template) {
    
        // Regular expression to capture the ForEach sections
        const loopRegex = /<ForEach collection="([^"]+)">([\s\S]*?)<\/ForEach>/g;
    
        let match;
        while ((match = loopRegex.exec(template)) !== null) {
            const collectionName = match[1];
            const loopBody = match[2];
            
    
            // Load the corresponding JSON file
            const jsonData = JSON.parse(fs.readFileSync(path.join(currentDirectory, '/collections/', `${collectionName}.json`), 'utf8'));
    
            let loopResult = '';
    
            for (const item of jsonData) {
                let processedBody = loopBody;
                
                // Process conditions
                processedBody = this.processConditions(processedBody, item, collectionName);

                for (const key in item) {
                    // Regular expression to replace the placeholders
                    const placeholderRegex = new RegExp(`{${collectionName}.${key}}`, 'g');
                    let itemValue = item[key];
                    if(Array.isArray(item[key])){
                        itemValue = item[key].join("|");
                    }
                    processedBody = processedBody.replace(placeholderRegex, itemValue);
                }
    
                loopResult += processedBody;
            }
    
            template = template.replace(match[0], loopResult);
        }
    
        return template;
    },

    processConditions(content, data, parentCollection) {
        // Regular expression to capture the If sections
        const conditionRegex = /<If condition="([^"]+)">([\s\S]*?)<\/If>/g;
    
        return content.replace(conditionRegex, (match, condition, body) => {
            // Convert placeholder {collectionName.key} into JavaScript context variables
            condition = condition.replace(/{([^}]+)\.([^}]+)}/g, (m, collection, key) => {
                if (collection === parentCollection && typeof data[key] === 'string') {
                    return JSON.stringify(data[key]); // Ensure strings are properly escaped
                } else if (collection === parentCollection) {
                    return data[key];
                }
                return m; // If the collection doesn't match, don't replace.
            });
    
            let meetsCondition = false;
    
            // Prepare the evaluation context
            let evalContextNames = [parentCollection, ...Object.keys(data)];
            let evalContextValues = [{ ...data }, ...Object.values(data)];
    
            // Dynamically create a function with the condition and evaluate it
            try {
                const evalFunction = new Function(...evalContextNames, `return ${condition};`);
                meetsCondition = evalFunction(...evalContextValues);
            } catch (err) {
                console.warn(`Failed to evaluate condition: ${condition}`, err);
            }
    
            return meetsCondition ? body : '';
        });
    }
    
        
}