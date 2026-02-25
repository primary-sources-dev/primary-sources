// blog-post.js
// Modular Content Block Renderer for Blog Posts
// Markdown-compatible design for Next.js/MDX migration
// Primary Sources Project - 2026-02-24

// Main loading function
async function loadBlogPost(slug) {
    try {
        const response = await fetch('/docs/ui/assets/data/blog.json');
        const allPosts = await response.json();
        const post = allPosts.find(p => p.slug === slug);

        if (!post) {
            showErrorState('Post not found');
            return;
        }

        // Populate header
        populateHeader(post);

        // Populate content blocks
        populateContent(post.content);

        // Populate tags
        if (post.tags && post.tags.length > 0) {
            populateTags(post.tags);
        }

        // Populate related posts
        if (post.related && post.related.length > 0) {
            populateRelatedPosts(post.related, allPosts);
        }

    } catch (err) {
        console.error('Failed to load blog post:', err);
        showErrorState('Failed to load post data');
    }
}

// Populate post header
function populateHeader(post) {
    // Breadcrumb
    document.getElementById('breadcrumb-current').textContent = post.title;

    // Category
    document.getElementById('post-category').textContent = post.category;

    // Date
    document.getElementById('post-date').textContent = formatDate(post.date);

    // Title
    document.getElementById('post-title').textContent = post.title;
    document.title = `${post.title} — Primary Sources`;

    // Author
    document.getElementById('post-author').textContent = post.author || 'Primary Sources Team';

    // Reading time
    const readingTime = calculateReadingTime(post.content);
    document.getElementById('post-reading-time').textContent = `${readingTime} min read`;

    // Hero image
    if (post.hero_image) {
        const heroSection = document.getElementById('hero-image-section');
        const heroImg = document.getElementById('hero-image');
        heroImg.src = post.hero_image;
        heroImg.alt = post.title;
        heroSection.style.display = '';
    }
}

// Populate modular content blocks
function populateContent(blocks) {
    const container = document.getElementById('post-content');
    if (!blocks || blocks.length === 0) return;

    container.innerHTML = blocks.map(block => renderBlock(block)).join('');
}

// Render individual content block
function renderBlock(block) {
    switch (block.type) {
        case 'text':
            return renderTextBlock(block);
        case 'heading':
            return renderHeadingBlock(block);
        case 'quote':
            return renderQuoteBlock(block);
        case 'image':
            return renderImageBlock(block);
        case 'list':
            return renderListBlock(block);
        case 'callout':
            return renderCalloutBlock(block);
        default:
            return '';
    }
}

// Block renderers
function renderTextBlock(block) {
    return `
        <div class="prose prose-invert max-w-none">
            <p class="text-sm text-archive-secondary/80 leading-relaxed">
                ${block.content}
            </p>
        </div>
    `;
}

function renderHeadingBlock(block) {
    const level = block.level || 2;
    const size = level === 2 ? 'text-2xl' : 'text-xl';
    return `
        <h${level} class="${size} font-bold text-archive-heading uppercase font-display border-l-4 border-primary pl-4">
            ${block.content}
        </h${level}>
    `;
}

function renderQuoteBlock(block) {
    return `
        <blockquote class="border-l-4 border-primary pl-6 py-4 bg-archive-dark/50">
            <p class="text-base text-archive-heading italic leading-relaxed mb-2">
                "${block.content}"
            </p>
            ${block.author ? `<cite class="text-xs text-archive-secondary/60 not-italic uppercase tracking-widest">— ${block.author}</cite>` : ''}
        </blockquote>
    `;
}

function renderImageBlock(block) {
    return `
        <figure class="border border-archive-secondary/20 overflow-hidden">
            <img src="${block.src}" alt="${block.alt || ''}" class="w-full object-cover grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            ${block.caption ? `<figcaption class="px-4 py-3 text-xs text-archive-secondary/60 bg-archive-dark/50">${block.caption}</figcaption>` : ''}
        </figure>
    `;
}

function renderListBlock(block) {
    const Tag = block.ordered ? 'ol' : 'ul';
    const listClass = block.ordered ? 'list-decimal' : 'list-disc';

    return `
        <${Tag} class="${listClass} pl-6 space-y-2">
            ${block.items.map(item => `
                <li class="text-sm text-archive-secondary/80 leading-relaxed">${item}</li>
            `).join('')}
        </${Tag}>
    `;
}

function renderCalloutBlock(block) {
    const icons = {
        info: 'info',
        warning: 'warning',
        success: 'check_circle',
        tip: 'lightbulb'
    };

    const colors = {
        info: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
        warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
        success: 'border-green-500/40 bg-green-500/10 text-green-400',
        tip: 'border-primary/40 bg-primary/10 text-primary'
    };

    const variant = block.variant || 'info';
    const icon = icons[variant] || 'info';
    const color = colors[variant] || colors.info;

    return `
        <div class="border-l-4 ${color} p-6">
            <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-2xl flex-shrink-0">${icon}</span>
                <div>
                    ${block.title ? `<h4 class="text-sm font-bold uppercase tracking-wider mb-2">${block.title}</h4>` : ''}
                    <p class="text-sm leading-relaxed opacity-90">${block.content}</p>
                </div>
            </div>
        </div>
    `;
}

// Populate tags
function populateTags(tags) {
    const section = document.getElementById('tags-section');
    const list = document.getElementById('tags-list');

    list.innerHTML = tags.map(tag => `
        <span class="text-[10px] px-2 py-1 bg-archive-secondary/10 text-archive-secondary/60 uppercase tracking-wider">
            ${tag}
        </span>
    `).join('');

    section.style.display = '';
}

// Populate related posts
function populateRelatedPosts(relatedSlugs, allPosts) {
    const section = document.getElementById('related-posts-section');
    const grid = document.getElementById('related-posts-grid');

    const relatedPosts = relatedSlugs
        .map(slug => allPosts.find(p => p.slug === slug))
        .filter(p => p !== undefined);

    if (relatedPosts.length === 0) return;

    grid.innerHTML = relatedPosts.map(post => `
        <a href="/docs/ui/pages/blog-post.html?slug=${post.slug}" class="block border border-archive-secondary/20 bg-[#252021]/60 hover:border-primary transition-colors overflow-hidden group">
            <div class="p-6">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-[10px] px-2 py-1 bg-primary/20 text-primary uppercase tracking-widest">${post.category}</span>
                    <span class="text-[10px] text-archive-secondary/50 uppercase tracking-widest">${formatDate(post.date)}</span>
                </div>
                <h3 class="text-lg font-bold text-archive-heading uppercase font-display mb-2 group-hover:text-primary transition-colors">${post.title}</h3>
                <p class="text-xs text-archive-secondary/70 leading-relaxed">${post.excerpt}</p>
            </div>
        </a>
    `).join('');

    section.style.display = '';
}

// Helper functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function calculateReadingTime(blocks) {
    if (!blocks) return 5;

    const wordCount = blocks.reduce((total, block) => {
        const text = block.content || '';
        const words = text.split(/\s+/).length;
        return total + words;
    }, 0);

    const minutes = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
    return Math.max(1, minutes);
}

function showErrorState(message) {
    const container = document.getElementById('post-content');
    container.innerHTML = `
        <div class="text-center py-20">
            <span class="material-symbols-outlined text-6xl text-archive-secondary/20 mb-4 block">error</span>
            <p class="text-xs uppercase tracking-[0.3em] text-archive-secondary/40 mb-2">Error</p>
            <p class="text-sm text-archive-secondary/60 mb-6">${message}</p>
            <a href="/docs/ui/pages/blog.html" class="inline-flex items-center gap-2 text-xs text-primary hover:underline uppercase tracking-widest">
                <span class="material-symbols-outlined text-sm">arrow_back</span>
                Back to Blog
            </a>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (slug) {
        loadBlogPost(slug);
    } else {
        showErrorState('No post slug provided');
    }
});

