const fs = require('fs');
const path = require('path');
const currentDirectory = process.cwd();
let showdown  = require('showdown');
let toc = require('markdown-toc');
let fm = require('front-matter');
let isContentFile = false;
let env = require('./env.js');

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

            page = this.processCollectionLoops(this.processContentLoops(this.parseShortCodes(this.replaceAttributesInLayout(layout, layoutAttributes), url, build), filePath), filePath);

            page = this.processCollectionJSON(page);

            page = this.parseURLs(page, url);
        }

        return page;
    },

    processContent(contentPath, build=false, url='relative') {

        let content = fs.readFileSync(contentPath, 'utf8');

        let pagePath = this.getPageForContent(contentPath);
        let page = this.processFile(pagePath, build, url);

        showdown.setOption('ghCompatibleHeaderId', true);
        converter = new showdown.Converter();

        let tableOfContents = toc(content);
        let updatedContent = content.replace('[toc]', tableOfContents.content);

        let contentHTML = converter.makeHtml(this.removeFrontMatter(updatedContent));
        let contentAttributes = fm(content).attributes;

        let staticJS = "window.toc = JSON.parse('" + JSON.stringify(tableOfContents.json).replace(/'/g, "\\'") + "'); window.frontmatter=JSON.parse('" + JSON.stringify(contentAttributes).replace(/'/g, "\\'") + "');";
        let attrTags = "<script>" + staticJS + "</script>";

        // process frontmatter conditions
        page = this.processFrontMatterConditions(page, contentAttributes);
        page = this.processFrontMatterReplacements(page, contentAttributes);

        

        if(page.includes('{static_content_element}')){
            let staticContentElement = "<div id='static-content' style='display:none;' data-toc='" + JSON.stringify(tableOfContents.json).replace(/'/g, "\\'") + "' data-frontmatter='" + JSON.stringify(contentAttributes).replace(/'/g, "\\'") + "'></div>";
            page = page.replace('{static_content_element}', staticContentElement);
        }

        page = page.replace('</head>', attrTags + '\n</head>');
        page = page.replace('{content}', contentHTML);

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

    processCollectionJSON(body){
        const collectionRegex = /{collections\.([^}]+)\.json}/g;
        let match;
        while ((match = collectionRegex.exec(body)) !== null) {
            const collectionName = match[1];
            const collectionData = JSON.parse(fs.readFileSync(path.join(currentDirectory, `/collections/${collectionName}.json`), 'utf8'));
            const collectionDataString = JSON.stringify(collectionData);
            body = body.replace(match[0], collectionDataString);
        }
        return body;
    },

    // Parse down the directory tree until we find a `.html` file for this content
    getPageForContent(markdownFilePath) {
        const markdownDir = path.dirname(markdownFilePath);
        const markdownFileName = path.basename(markdownFilePath, '.md');
        const htmlFilePath = path.join(markdownDir, `${markdownFileName}.html`);
        const pageHTMLFilePath = htmlFilePath.replace(path.join(currentDirectory, '/content'), path.join(currentDirectory, '/pages'));

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
            const indexContentHtmlFilePath = path.join(currentDir, '[content].html');
            const indexHtmlFilePath = path.join(currentDir, 'index.html');

            if (fs.existsSync(indexContentHtmlFilePath)) {
                return indexContentHtmlFilePath;
            }

            if (fs.existsSync(indexHtmlFilePath)) {
                return indexHtmlFilePath;
            }

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

    getIncludeAttributes(page) {
        const includeTagRegex = /<include\s+([^>]*)>([\s\S]*?)<\/include>/;
        const includeTagMatch = page.match(includeTagRegex);
    
        if (includeTagMatch) {
            const attributesString = includeTagMatch[1];
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

    parseIncludeContent(htmlString){

        // while ((includeTag = includeRegex.exec(htmlString)) !== null) {
        //     const includeSrcPath = path.join(currentDirectory, '/includes/', includeTag[1]);
        //     const includeContent = fs.readFileSync(includeSrcPath, 'utf8');
        
        //     // Loop through the attributes of the include tag
        //     const attributeRegex = /(\w+)="([^"]+)"/g;
        //     let attributeMatch;
        //     while ((attributeMatch = attributeRegex.exec(includeTag[0])) !== null) {
        //         const attributeName = attributeMatch[1];
        //         const attributeValue = attributeMatch[2];
        
        //         // Replace attribute placeholders with attribute values in the include content
        //         const attributePlaceholderRegex = new RegExp(`{${attributeName}}`, 'g');
        //         includeContent = includeContent.replace(attributePlaceholderRegex, attributeValue);
        //     }
        
        //     htmlString = htmlString.replace(includeTag[0], includeContent);
        // }
        // return htmlString;

        

        let includeTag;
        const includeRegex = /<include\s+[^>]*src="([^"]+)"[^>]*><\/include>/g;

        
        while ((includeTag = includeRegex.exec(htmlString)) !== null) {
            
            const includeSrcPath = path.join(currentDirectory, '/includes/', includeTag[1]);
            
            let includeContent = fs.readFileSync(includeSrcPath, 'utf8');

            const includeAttributes = this.getIncludeAttributes(includeTag[0]);
            for (const [attribute, value] of Object.entries(includeAttributes)) {
                const regex = new RegExp(`{${attribute}}`, 'g');
                includeContent = includeContent.replace(regex, value);
            }

            htmlString = htmlString.replace(includeTag[0], includeContent);
        }
        return htmlString;
    },

    parseShortCodes(content, url, build=false){
        // {tailwindcss} shortcode
        let assetURL = url.replace(/\/$/, '');
        if(url == 'relative'){ 
            assetURL = ''; 
        }
        let tailwindReplacement = build ? '<link href="' + assetURL + '/assets/css/main.css" rel="stylesheet">' : '<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script>';
        if(!build){
            let moduleExportsContent = this.getModuleExportsContent();
            
            // the inline config does not need the plugins array
            const regex = /plugins:\s*\[[^\]]*\]/g;
            moduleExportsContent = moduleExportsContent.replace(regex, 'plugins: []');
            moduleExportsContent = moduleExportsContent.replace('plugins: [],', '');
            moduleExportsContent = moduleExportsContent.replace('plugins: []', '');

            tailwindReplacement += '<script>tailwind.config = ' + moduleExportsContent.replace(/;*$/, '') + '</script>';

            // If it is not build we also want to grab the contents inside the main.css file and add it to the head
            let cssContent = fs.readFileSync(currentDirectory + '/assets/css/main.css', 'utf8');
            // We also want to replace the tailwindcss @tailwind commands:
            cssContent = cssContent.replace('@tailwind base;', '').replace('@tailwind components;', '').replace('@tailwind utilities;', '');
            tailwindReplacement += `<style>${cssContent}</style>`;
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

    processContentLoops(body, filePath){
        const forEachContentTags = this.forEachContentTags(body);
        for(i=0; i < forEachContentTags.length; i++){
            const attributesAndValues = this.forEachAttributesAndValues(forEachContentTags[i]);
            const contentCollection = this.frontmatterLoops(currentDirectory + '/content/' + attributesAndValues.content);
            this.storeContentCollection(attributesAndValues.content, contentCollection);
        }
        return this.replaceForEachContentWithCollection( body );
    },

    replaceForEachContentWithCollection(body) {
        const regex = /<ForEach\s+([^>]+)>/g;
        const updatedBody = body.replace(regex, (match, attributes) => {
            const updatedAttributes = attributes.replace(/content="([^"]+)"/g, 'collection="content/$1"');
            //const updatedAttributes = attributes.replace(/content=/g, `collection="content/$&-index-${index}"`);
            //const updatedAttributes = attributes.replace(/content=/g, 'collection=');
          return `<ForEach ${updatedAttributes}>`;
        });
      
        return updatedBody;
    },

    frontmatterLoops(directoryPath, sortByKey = 'date', filePath = null) {
        const files = fs.readdirSync(directoryPath);

        const frontmatters = [];

        //const converter = new showdown.Converter();
        let hasSortByKey = false;

        files.forEach((file) => {
            const filePath = `${directoryPath}/${file}`;
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            // Extract the frontmatter from the markdown file
            const frontmatter = fm(fileContent).attributes; //fm.(fileContent, converter);

            if(frontmatter.hasOwnProperty(sortByKey)){
                hasSortByKey = true;
            }

            frontmatter.content = this.removeFrontMatter(fileContent);
            frontmatter.link = filePath.replace(/.*\/content(.*)\..*/, '$1');
            frontmatters.push(frontmatter);
        });

        // Sort the frontmatters array by the specified key
        if(hasSortByKey){
            frontmatters.sort((a, b) => a[sortByKey].localeCompare(b[sortByKey]));
        }

        return frontmatters;
    },

    forEachAttributesAndValues(string){
        const regex = /<ForEach\s+([^>]+)>/g;
        const attributes = {};

        let match;
        while ((match = regex.exec(string)) !== null) {
            const attributeString = match[1];
            const attributeRegex = /(\w+)="([^"]+)"/g;
            let attributeMatch;

            while ((attributeMatch = attributeRegex.exec(attributeString)) !== null) {
                const attributeName = attributeMatch[1];
                const attributeValue = attributeMatch[2];
                attributes[attributeName] = attributeValue;
            }
        }

        return attributes
    },

    forEachContentTags(body) {
        const regex = /<ForEach\s+([^>]+)>/g;
        const forEachTags = [];

        let match;
        while ((match = regex.exec(body)) !== null) {
            const forEachTag = match[0];
            const attributeString = match[1];
            const attributeRegex = /(\w+)="([^"]+)"/g;
            let attributeMatch;
            let hasContentAttribute = false;

            while ((attributeMatch = attributeRegex.exec(attributeString)) !== null) {
            const attributeName = attributeMatch[1];
            const attributeValue = attributeMatch[2];
            if (attributeName === 'content') {
                hasContentAttribute = true;
                break;
            }
            }

            if (hasContentAttribute) {
            forEachTags.push(forEachTag);
            }
        }

        return forEachTags;
    },

    storeContentCollection(collectionName, collectionData) {
        const contentCollectionFolderPath = path.join(currentDirectory, '/collections/content');
        if (!fs.existsSync(contentCollectionFolderPath)) {
            fs.mkdirSync(contentCollectionFolderPath);
        }
        
        const filePath = path.join(contentCollectionFolderPath, `${collectionName}.json`);
        const jsonData = JSON.stringify(collectionData, null, 2);
        fs.writeFileSync(filePath, jsonData);
    },

    processCollectionLoops(template, filePath) {
        // Regular expression to capture the ForEach sections
        const loopRegex = /<ForEach\s+([^>]+)>([\s\S]*?)<\/ForEach>/g;
    
        let match;
        while ((match = loopRegex.exec(template)) !== null) {
            const attributeString = match[1];
            const loopBody = match[2];

            const attributes = this.forEachAttributesAndValues('<ForEach ' + attributeString + '>');
    
            // Extract the collection name from the attributes
            //const collectionNameMatch = /collection="([^"]+)"/.exec(attributeString);
            if (!attributes.collection) {
                continue; // Skip if collection name is not found
            }
            
    
            // Load the corresponding JSON file
            const jsonData = JSON.parse(fs.readFileSync(path.join(currentDirectory, '/collections/', `${attributes.collection}.json`), 'utf8'));

            let loopKeyword = attributes.collection.replace(/\//g, '.');
            if (attributes.as) {
                loopKeyword = attributes.as;
            }

            let count = null;
            if(attributes.count){
                count = attributes.count;
            }

            let loopResult = '';
            let loop = 1;
            for (const item of jsonData) {
                let processedBody = loopBody;
                const data = { ...item, loop };

                // Process conditions
                processedBody = this.processConditions(processedBody, data, loopKeyword, loop);
    
                for (const key in item) {
                    // Regular expression to replace the placeholders
                    const placeholderRegex = new RegExp(`{${loopKeyword}.${key}}`, 'g');
                    let itemValue = item[key];
                    if (Array.isArray(item[key])) {
                        itemValue = item[key].join("|");
                    }
                    processedBody = processedBody.replace(placeholderRegex, itemValue);
                }
    
                loopResult += processedBody;
                loop++;

                if((loop-1) == count){
                    break;
                }
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

    // processConditions(content, data, parentCollection, loop) {
    //     // Regular expression to capture the If sections
    //     const conditionRegex = /<If condition="([^"]+)">([\s\S]*?)<\/If>/g;
    
    //     return content.replace(conditionRegex, (match, condition, body) => {
    //         // Convert placeholder {collectionName.key} into JavaScript context variables
    //         condition = condition.replace(/{([^}]+)\.([^}]+)}/g, (m, collection, key) => {
    //             if (collection === parentCollection && typeof data[key] === 'string') {
    //                 return JSON.stringify(data[key]); // Ensure strings are properly escaped
    //             } else if (collection === parentCollection) {
    //                 return data[key];
    //             }
    //             return m; // If the collection doesn't match, don't replace.
    //         });
    
    //         let meetsCondition = false;
    
    //         // Evaluate the condition expression using eval()
    //         try {
    //             meetsCondition = eval(condition);
    //         } catch (err) {
    //             console.warn(`Failed to evaluate condition: ${condition}`, err);
    //         }
    
    //         return meetsCondition ? body : '';
    //     });
    // }
    
        
}