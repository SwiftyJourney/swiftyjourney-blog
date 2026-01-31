# Swifty Journey Blog

Official blog for [Swifty Journey](https://swiftyjourney.com) - Exploring iOS, Swift and SwiftUI through articles, tutorials and development experiences.

## ✨ **Enhanced Features**

🎨 **Advanced Code Highlighting** - Powered by Shiki with dual theme support (light/dark)  
📋 **Enhanced Copy Code Functionality** - Intelligent copy system with visual feedback, automatic language labels, and legacy browser support  
🌍 **Multilingual Support** - Seamless English/Spanish content with linked translations  
📱 **Mobile-First Design** - Perfect reading experience on all devices  
🚀 **Lightning Fast** - Static generation with Astro for optimal performance  
🎯 **Interactive Components** - React-powered demos and enhanced UX  
📖 **Reading Time & Metadata** - Automatic calculation with comprehensive article info  

> **📚 For detailed feature documentation, see [BLOG_FEATURES.md](./BLOG_FEATURES.md)**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Troubleshooting
- If `astro build` fails with an `ImageNotFound` error after moving content, clear Astro's content cache:
  ```bash
  rm -rf .astro node_modules/.astro
  npm run build
  ```

## 🌐 Multilingual Support

The blog supports both English and Spanish with automatic language detection:

- **English**: `/en/` (default fallback)
- **Spanish**: `/es/`
- **Root**: Redirects to `/en/`

### URL Structure
```
/en/                    # English homepage
/en/blog/               # English blog index
/en/blog/article-slug/  # English article

/es/                    # Spanish homepage  
/es/blog/               # Spanish blog index
/es/blog/article-slug/  # Spanish article
```

## ✍️ Creating New Blog Posts

### 1. File Location
Place your markdown files in:
```
src/content/blog/
└── 2026/01/31/
    ├── en.md               # English version
    ├── es.md               # Spanish version
    └── hero.png            # Optional local assets
```

### 2. Frontmatter Structure
Each blog post must include the following frontmatter:

```markdown
---
title: 'Your Article Title'
description: 'A brief description of your article for SEO and social sharing'
pubDate: 'Dec 15 2025'
updatedDate: 'Dec 16 2025'  # Optional
heroImage: './hero.png'  # Optional
lang: 'en'  # or 'es'
translationKey: 'unique-article-key'  # Links translations together
slug: 'your-article-slug'
---

Your article content here...
```

### 3. Required Fields
- `title`: Article title
- `description`: SEO description (used in meta tags)
- `pubDate`: Publication date
- `lang`: Language code (`'en'` or `'es'`)
- `slug`: URL slug used in `/en/blog/<slug>/` and `/es/blog/<slug>/`

### 4. Optional Fields
- `updatedDate`: When the article was last updated
- `heroImage`: Path to hero image (relative to the markdown file)
- `translationKey`: Links related articles across languages

### 5. Translation Key System
To link English and Spanish versions of the same article:

```markdown
# English version (YYYY/MM/DD/en.md)
---
title: 'Building iOS Apps with SwiftUI'
lang: 'en'
translationKey: 'swiftui-ios-apps'
slug: 'building-ios-apps-with-swiftui'
---

# Spanish version (YYYY/MM/DD/es.md)  
---
title: 'Construyendo Apps iOS con SwiftUI'
lang: 'es'
translationKey: 'swiftui-ios-apps'  # Same key!
slug: 'construyendo-apps-ios-con-swiftui'
---
```

This enables the language toggle to work correctly on individual articles.

## 🖼️ Image Management

### Hero Images
Store hero images in the same post folder and reference them relatively:

```markdown
---
heroImage: './hero.png'
---
```

### Content Images
For images within your article content, keep assets in the same folder:

```markdown
![Alt text](./my-content-image.jpg)
```

### Image Best Practices
- **Format**: Use `.jpg` for photos, `.png` for graphics with transparency
- **Size**: Optimize images before adding (recommended max width: 1200px)
- **Naming**: Use descriptive, kebab-case filenames
- **Alt text**: Always provide meaningful alt text for accessibility

## 📝 Writing Guidelines

### Markdown Support
The blog supports full Markdown syntax plus:
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Lists (ordered and unordered)
- Links
- Images

### Enhanced Code Blocks
The blog features **Shiki-powered syntax highlighting** with advanced capabilities:

````markdown
```swift
import SwiftUI

struct ContentView: View {
    @State private var count = 0
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \(count)")
                .font(.largeTitle)
            
            Button("Increment") {
                count += 1
            }
            .buttonStyle(.borderedProminent)
        }
    }
}
```
````

**Supported Languages**: Swift, TypeScript, JavaScript, JSON, HTML, CSS, Bash, Python, and many more.

**Features**:
- 🎨 Dual theme support (automatically switches with site theme)
- 📋 Copy button on hover for easy code sharing
- 🏷️ Language labels automatically displayed
- 📱 Mobile-optimized with proper line wrapping

### Special Components
Use enhanced components for better content presentation:

````markdown
<Callout type="tip" title="Pro Tip">
Always test your SwiftUI previews on different device sizes!
</Callout>

<Callout type="warning" title="Important">
Remember to handle optional values safely in Swift.
</Callout>
````

### Internal Links
Link to other blog posts:
```markdown
[Check out our SwiftUI guide](/en/blog/swiftui-guide/)
```

## 🎨 Styling

The blog uses Tailwind CSS with a custom `.prose` class for article content. The styling automatically handles:
- Typography scaling
- Dark/light mode
- Responsive design
- Code block styling
- Link colors (orange theme)

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── BaseHead.astro      # SEO head tags
│   ├── Footer.astro        # Site footer
│   ├── Header.astro        # Site header  
│   ├── LangToggle.astro    # Language switcher
│   └── ThemeToggle.astro   # Dark/light mode toggle
├── content/
│   └── blog/               # Blog posts go here
├── layouts/
│   ├── BaseLayout.astro    # Main site layout
│   └── BlogPost.astro      # Individual post layout
├── pages/
│   ├── en/
│   │   ├── blog/
│   │   │   ├── [...slug].astro  # Dynamic post pages
│   │   │   └── index.astro      # Blog index
│   │   └── index.astro          # English homepage
│   ├── es/
│   │   ├── blog/
│   │   │   ├── [...slug].astro  # Dynamic post pages  
│   │   │   └── index.astro      # Blog index
│   │   └── index.astro          # Spanish homepage
│   └── index.astro              # Root redirect
└── styles/
    └── global.css          # Global styles and prose styling
```

### Adding New Features
1. **New Components**: Add to `src/components/`
2. **New Pages**: Add to appropriate language folder in `src/pages/`
3. **Styling**: Extend `src/styles/global.css` or use Tailwind classes

### Content Collections
The blog uses Astro's Content Collections for type-safe content management. The schema is defined in `src/content.config.ts`.

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy!

### Custom Domain Setup
For `blog.swiftyjourney.com`:
1. Add domain in Vercel dashboard
2. Update DNS records to point to Vercel
3. SSL certificates are handled automatically

### Environment Variables
Currently no environment variables are required for basic operation.

## 🔍 SEO Features

The blog includes built-in SEO optimization:
- **Meta tags**: Title, description, canonical URLs
- **hreflang**: Language-specific SEO for multilingual content
- **Open Graph**: Social media sharing optimization
- **Sitemap**: Automatically generated
- **RSS Feed**: Available at `/rss.xml`

## 📊 Analytics

To add analytics:
1. Add your analytics script to `src/layouts/BaseLayout.astro`
2. Or create a new component and import it in the layout

## 🤝 Contributing

### Writing Posts
1. Create your markdown file(s) with proper frontmatter
2. Add any required images to `src/assets/`
3. Test locally with `npm run dev`
4. Commit and push your changes

### Code Contributions
1. Follow the existing code style
2. Test changes locally
3. Ensure responsive design works
4. Update this README if adding new features

## 📚 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [Markdown Guide](https://www.markdownguide.org)

---

Built with ❤️ using [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
