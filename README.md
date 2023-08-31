# ⚡️ Static - The Pure Power of Simplicity.

<p><img src="https://raw.githubusercontent.com/thedevdojo/static/main/art/github-static-cover.png" alt="github cover" /></p>

A static site generator you're going to love. No more complicated configurations, bloated javascript frameworks, or feeling like you got kicked in the face by a horse! Here's the spiel:

- Static is **easy**. 
- HTML is **easy**. 
- Yet, somehow we lost **the simplicity** of building Static HTML websites

No longer will this stand! **Static** reclaims the throne of simplicity in static site generators."

**Static** brings the *power of simplicity* back into static site generators.
## 🛠️ Setup in a Snap

Make sure you have Node installed on your machine, and then copy/paste the following command in your terminal:

```
npm install -g @devdojo/static
```

Now you'll have the CLI tool `static` available on your machine. Allowing you to run the following:

- **static new folder-name** - Create a new website with the static starter template
- **static dev** - Serve up a development version of your static website
- **static build** - Build a production ready version of your website (available in the `_site` directory)

Next, head on over to the official documentation to learn more about building your site.

## 🖐️ Five reasons this might just be your jam!

### 1. Page-based Routing

Each file within the `pages` directory corresponds to a route on your website. With a structure like this:

```
pages
├── index.html
├── about.html
├── contact
│   ├── index.html
│   ├── form
│   │   ├── index.html
```

Your new site will have the following routes available:

```
http://localhost:3000
http://localhost:3000/about
http://localhost:3000/contact
http://localhost:3000/contact/form
```

### 2. Layouts

Design **layouts** that multiple pages can utilize.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body>
    {slot}
</body>
</html>
```

Then, use it in any page.

```
<layout title="Radical Righteousness" src="main.html">

    <h1>🏄‍♂️ Totally Tubuloso Website</h1>
    
</layout>
```
### 3. Includes

Create re-usable HTML partials with the `<include>` tag. Specify the HTML file with the `src` attribute.

```
<layout title="Behind the Scenes!" src="main.html">

    <include src="about-header.html"></include>
    <include src="about-copy.html"></include>

</layout>
```

### 4. TailwindCSS Integration

Add the TailwindCSS **shortcode** to the `<head>` of any layout and it will automatically be injected. Example:

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    {tailwindcss}
</head>
<body>
    {slot}
</body>
</html>
```

It will be replaced with the Tailwind CDN link in `dev`, and a minified CSS file will be compiled during `build`.

### 5. Collections

Add collections of data to your application. Here's an example collection located at **collections/menu.json**

```
[
    {
        "title" : "Home",
        "link" : "/"
    },
    {
        "title" : "About",
        "link" : "/about"
    }
]
```

Now, you can easily loop through this collection:

```
<ForEach collection="menu">
    <li>{menu.title}</h1>
</ForEach>
```

> Those are some of the hottest features available, but there's so much more to uncover and learn. You can learn more by visiting the documentation here.

## 🗂️ Structure

In the root of your project there will be a handful of other folders:

- pages
- layouts
- includes
- assets
- collections

Let's cover each folder below.

## 📄 Pages

Static uses a simple page-based routing system where each route is mapped to a file inside of the `pages` directory. You can either get started by running the `static new folder-name` command, or you can get started by creating a new `pages` directory in an empty folder.

Here is an example of how the page-based routing works:

- `pages/index.html` -> `http://localhost:3000`
- `pages/about.html` -> `http://localhost:3000/about`
- `pages/contact/index.html` -> `http://localhost:3000/contact`

Running `static dev` inside of your project folder will serve up your website on `http://localhost:3000`. Running `static build` will compile a minified version of your website inside of the `_site` folder.

Creating new pages is as easy as adding a new file or folder to the `pages` directory. If you add a file located at `pages/index.html` this will be the homepage of your application. There are two ways to create a route for the website, which include adding an `index.html` file to a folder, (for instance, adding a file located at `/pages/about/index.html` would serve up an `/about` page). You could also add this to the main `pages` directory like so `pages/about.html` and it would also resolve to the `/about` page.

## 📃 Layouts

The layouts directory contain all the HTML layouts that can be used for any of your pages. Any `.html` page file can inherit from a layout. Here is an example homepage `pages/index.html`:


```html
<layout title="This is the title of the page" src="main.html">

    Content for your page here
    
</layout>
```

As you'll see you can use the `<layout></layout>` tags to create a page and put the content for the page inside of those tags. The **layout** tag contains two attributes:

- **title** - The title for that specific page
- **src** - The src for the layout file that you want to use

Here is an example layout file:

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>[x-cloak]{ display:none; }</style>
    {tailwindcss}
</head>
<body>
    {slot}
    <script src="/assets/js/main.js"></script>
</body>
</html>
```

The content that you put inside the `<layout></layout>` tags will be rendered at the location of the `{slot}` shortcode. Inside of the **layout** tag can include any kind of HTML, like so:

```html
<layout title="This is the title of the page" src="main.html">

    <p>This will be rendered in place of the {slot} text</p>
    
</layout>
```

This is great, but what if we wanted to re-use multiple HTML code inside of a page. In that case we can make use of **includes**, let's talk about includes next.

# includes

The **includes** directory can contain partials of HTML snippets that you may want to re-use throughout your site. This can include navigations, footers, hero sections, and more.

Inludes are nothing more than HTML snippets, here is an example of an include located at `includes/message.html`:

```
<p>This is just a simple message snippet that can be re-used inside of any page</p>
```

Then, if you wanted to include this inside of a page, you can simple use the `<include></include>` tags, like so:

```html
<layout title="This is the title of the page" src="main.html">

    <include src="message.html"></include>
    
</layout>
```

Now, when this page is rendered you will have the following output:

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>[x-cloak]{ display:none; }</style>
    {tailwindcss}
</head>
<body>
    <p>This is just a simple message snippet that can be re-used inside of any page</p>
    <script src="/assets/js/main.js"></script>
</body>
</html>
```

> Notice the {tailwindcss}, this will inject Tailwind in the website and render the minified TailwindCSS in the final build.

# assets

Finally, you'll notice the **assets** folder, this is where we render the `main` assets for our website, which include:

- **assets/css/main.css**
- **assets/js/main.js**

You can add any custom CSS or custom Javascript in those files and they will be rendered in dev mode and shown on the page, or they will be minified and published to the `build` directory upon build.

---

That's it! Super simple static sites ⚡️
