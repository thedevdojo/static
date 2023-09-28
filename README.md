# ⚡️ Static - The Pure Power of Simplicity.

<p><img src="https://raw.githubusercontent.com/thedevdojo/static/main/art/github-static-cover.png" alt="github cover" /></p>

A static site generator you're going to love. No more complicated configs, bloated frameworks, or feeling like you got kicked in the face by a horse! Here's the spiel:

- Static is **easy**. 
- HTML is **easy**. 
- Yet, somehow we lost the art of **crafting simple** Static HTML websites

No longer will this stand! <a href="https://static.devdojo.com" target="_blank"><strong>Static</strong></a> is here to reclaim the throne of simplicity!

## 🛠️ Setup in a Snap

Make sure you have Node installed on your machine, and then copy/paste the following command in your terminal:

```
npm install -g @devdojo/static
```

Now you'll have the **static** command available on your machine, allowing you to run the following:

- **static new folder-name** - Create a new website with the static starter template
- **static dev** - Start up a dev environment of your static website
- **static build** - Build a production ready version of your website (available in the `_site` directory)

Next, head on over to [the official documentation](https://static.devdojo.com/docs) to learn more about building your site.

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

> Those are just a few of the hot features available, but there's [so much more to uncover and learn](https://static.devdojo.com/docs).

# Learn More

You can learn about all the features available in Static by visiting the [official documentation](https://static.devdojo.com/docs). You may also be interested in checking out some of the [templates here](https://static.devdojo.com/templates).

Static HTML is King 👑
