# Flisk CLI Website

The official website for Flisk CLI. Start your services on your machine; no deploy or Compose file required.

## About

This is a Jekyll-based static site for Flisk CLI. The site features:

- 🎨 Modern Bootstrap 5 design
- 📱 Fully responsive layout
- 🔥 Dark/light theme ready
- 📝 Comprehensive documentation
- 🏎️ Fast performance (static site)

## Quick Start

### Prerequisites

- Ruby 2.6+ with Bundler
- Node.js 18+ (optional, for this website's asset build; the Flisk CLI npm package requires 22.12+)

### Installation

```bash
# Clone the repository
git clone https://github.com/flisk-sh/website.git
cd website

# Install Ruby dependencies
bundle install

# Start local server
bundle exec jekyll serve --livereload
```

Visit `http://localhost:4000` to view the site.

### Building for Production

```bash
# Build the site
bundle exec jekyll build

# The built site will be in `_site/` directory
```

## Project Structure

```
website/
├── _layouts/           # Jekyll layouts
│   └── default.html    # Main layout with navigation and footer
├── _includes/          # Reusable components
│   ├── navigation.html # Site navigation
│   └── footer.html   # Site footer
├── _sass/              # SCSS stylesheets (optional)
├── assets/             # Static assets
│   ├── css/          # Stylesheets
│   │   └── style.css # Main stylesheet
│   ├── js/           # JavaScript files
│   │   └── main.js   # Main JavaScript
│   └── images/       # Images
├── docs/               # Documentation pages
├── features/           # Features page
├── compare/            # Comparison page
├── index.html          # Homepage
├── _config.yml         # Jekyll configuration
├── Gemfile             # Ruby dependencies
└── README.md           # This file
```

## Design System

The site uses a custom design system with:

### Colors
- Primary: `#22C55E` (Purple)
- Background: `#fafafa` (Light gray)
- Text: `#18181b` (Near black)

### Typography
- Display: Space Grotesk
- Body: DM Sans
- Mono: JetBrains Mono

### Components
- Cards with hover effects
- Feature comparison tables
- Code blocks with syntax highlighting
- Responsive navigation

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for prerequisites, setup steps, the validation workflow, branch and pull request conventions, and commit message guidelines.

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ for developers who just want to write code.

Using Flisk in Slack or Discord? Get the [Flisk green thunder emoji](https://github.com/flisk-sh/flisk-emoji) (SVG and PNG, MIT).
