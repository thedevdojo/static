//********* */
//
// Add your template to the templates array below.
//
// Add the slug which will be the name the user types at the end of
// the static new command. For example, if the slug is "blog" then
// the user will type "static new my-blog --blog" to create a new
// site using the blog template.
//
// Then add the repo which is the github repo URL
//
//********** */

const templates = [
    {
        slug: 'starter',
        repo: 'https://github.com/static-templates/starter'
    },
    {
        slug: 'aria',
        repo: 'https://github.com/static-templates/aria'
    },
    {
        slug: 'blog',
        repo: 'https://github.com/static-templates/blog'
    },
    {
        slug: 'stone',
        repo: 'https://github.com/static-templates/stone'
    }
];

module.exports = {
    get(template_slug){
        for(let i=0; i < templates.length; i++){
            if(templates[i].slug == template_slug){
                return templates[i];
            }
        }

        return templates[0];
    }
}