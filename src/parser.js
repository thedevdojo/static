const fs = require('fs');
const path = require('path');
const currentDirectory = process.cwd();
let isBuild = false;

module.exports = {
    processFile(filePath, build=false) {
        isBuild = build;

        let page = fs.readFileSync(filePath, 'utf8');

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

            page = this.processCollectionLoops(this.parseShortCodes(this.replaceAttributesInLayout(layout, layoutAttributes)));
        }

        return page;
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

    parseShortCodes(content){
        // {tailwindcss} shortcode
        const tailwindReplacement = isBuild ? '<link href="/assets/css/main.css" rel="stylesheet">' : '<script src="https://cdn.tailwindcss.com?plugins=typography"></script>';
        content = content.replace('{tailwindcss}', tailwindReplacement);
        
        return content;
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
                
                for (const key in item) {
                    // Regular expression to replace the placeholders
                    const placeholderRegex = new RegExp(`{${collectionName}.${key}}`, 'g');
                    processedBody = processedBody.replace(placeholderRegex, item[key]);
                }
    
                loopResult += processedBody;
            }
    
            template = template.replace(match[0], loopResult);
        }
    
        return template;
    }
        
}