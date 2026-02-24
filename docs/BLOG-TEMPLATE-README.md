# Blog Template System - Quick Start Guide

**Status:** ✅ Production Ready
**Date:** 2026-02-24
**Version:** 1.0.0

---

## Overview

Modular blog system for **project updates and development insights** (not JFK content). Built with reusable content blocks, category filtering, and Next.js/MDX migration path.

**Key Features:**
- **6 Content Block Types** - Text, Heading, Quote, Image, List, Callout
- **Category System** - About, Development, Research, Updates
- **Featured Posts** - Highlight important announcements
- **Related Posts** - Cross-linking between articles
- **MDX-Ready** - Block structure converts directly to MDX components
- **Archival Aesthetic** - Matches oswald.html design language

---

## Quick Start

### 1. Start Local Server
```bash
cd C:\Users\willh\Desktop\primary-sources\docs\ui
python -m http.server 8000
```

### 2. Test URLs

```
Blog Listing Page:
http://localhost:8000/blog.html

Mission Statement Post:
http://localhost:8000/blog-post.html?slug=mission-statement

Development Blog Launch:
http://localhost:8000/blog-post.html?slug=welcome-to-development

Design Philosophy:
http://localhost:8000/blog-post.html?slug=design-philosophy

Component Library Deep Dive:
http://localhost:8000/blog-post.html?slug=component-library-explained
```

---

## File Structure

```
docs/ui/
├── blog.html                          # Blog listing page ⭐ NEW
├── blog-post.html                     # Single post template ⭐ NEW
├── assets/
│   ├── js/
│   │   ├── blog-post.js               # Modular content block renderer ⭐ NEW
│   │   ├── components.js              # Existing
│   │   └── nav.js                     # Existing
│   ├── data/
│   │   └── mock-blog.json             # Blog post data ⭐ NEW
│   └── css/
│       └── main.css                   # Existing
```

---

## Content Block System

### Available Block Types

**1. Text Block**
```json
{
  "type": "text",
  "content": "Regular paragraph content with standard prose styling."
}
```

**2. Heading Block**
```json
{
  "type": "heading",
  "level": 2,
  "content": "Section Heading"
}
```
- `level`: 2 or 3 (H2 or H3)
- Renders with border-left accent

**3. Quote Block**
```json
{
  "type": "quote",
  "content": "Quote text here",
  "author": "Attribution (optional)"
}
```
- Border-left styling
- Italic text
- Optional attribution

**4. Image Block**
```json
{
  "type": "image",
  "src": "/path/to/image.jpg",
  "alt": "Image description",
  "caption": "Optional caption text"
}
```
- Figure with border
- Grayscale with hover color effect
- Optional caption footer

**5. List Block**
```json
{
  "type": "list",
  "ordered": false,
  "items": [
    "First item",
    "Second item",
    "Third item"
  ]
}
```
- `ordered: true` for numbered lists
- `ordered: false` for bullet lists

**6. Callout Block**
```json
{
  "type": "callout",
  "variant": "info",
  "title": "Callout Title (optional)",
  "content": "Important message here"
}
```
- **Variants:** `info`, `warning`, `success`, `tip`
- Color-coded borders and backgrounds
- Material icon for each variant
- Optional title

---

## Data Format

### Post Schema

```json
{
  "slug": "url-friendly-slug",
  "title": "Post Title",
  "excerpt": "Brief summary for listing page (1-2 sentences)",
  "category": "About | Development | Research | Updates",
  "date": "2026-02-24",
  "author": "Author Name",
  "featured": true,
  "hero_image": "/path/to/image.jpg (optional)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": [
    { /* content block 1 */ },
    { /* content block 2 */ }
  ],
  "related": ["slug-1", "slug-2"]
}
```

### Required Fields
- `slug` - Unique identifier, URL-safe
- `title` - Post title
- `excerpt` - Summary for cards
- `category` - Must match filter options
- `date` - ISO date format (YYYY-MM-DD)
- `content` - Array of content blocks

### Optional Fields
- `author` - Defaults to "Primary Sources Team"
- `featured` - Set `true` for hero display
- `hero_image` - Path to header image
- `tags` - Array of keywords
- `related` - Array of slugs for related posts section

---

## Adding a New Post

### Step 1: Create Content
Open `assets/data/mock-blog.json` and add new post object:

```json
{
  "slug": "my-new-post",
  "title": "My New Post Title",
  "excerpt": "Brief description of the post content",
  "category": "Development",
  "date": "2026-02-24",
  "content": [
    {
      "type": "heading",
      "level": 2,
      "content": "Introduction"
    },
    {
      "type": "text",
      "content": "First paragraph content..."
    },
    {
      "type": "callout",
      "variant": "tip",
      "title": "Pro Tip",
      "content": "Helpful advice for readers"
    }
  ],
  "tags": ["tag1", "tag2"],
  "related": ["other-post-slug"]
}
```

### Step 2: Test Locally
```
http://localhost:8000/blog-post.html?slug=my-new-post
```

### Step 3: Verify Listing
Check that post appears in:
- Blog grid: `http://localhost:8000/blog.html`
- Category filter: Click "Development" button
- Featured section: If `featured: true`

---

## Block Renderer Examples

### Example 1: Mission Statement Structure
```json
{
  "content": [
    {
      "type": "heading",
      "level": 2,
      "content": "The Problem"
    },
    {
      "type": "text",
      "content": "Explanation of problem..."
    },
    {
      "type": "callout",
      "variant": "warning",
      "title": "Challenge",
      "content": "Key challenge description"
    },
    {
      "type": "quote",
      "content": "Relevant quote about the issue",
      "author": "Source"
    }
  ]
}
```

### Example 2: Feature Announcement
```json
{
  "content": [
    {
      "type": "heading",
      "level": 2,
      "content": "New Feature Launch"
    },
    {
      "type": "text",
      "content": "Introduction to the feature..."
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Step one of using the feature",
        "Step two of using the feature",
        "Step three of using the feature"
      ]
    },
    {
      "type": "callout",
      "variant": "success",
      "title": "Now Available",
      "content": "This feature is live in production!"
    }
  ]
}
```

### Example 3: Technical Deep Dive
```json
{
  "content": [
    {
      "type": "heading",
      "level": 2,
      "content": "Technical Architecture"
    },
    {
      "type": "text",
      "content": "Overview of the system..."
    },
    {
      "type": "image",
      "src": "assets/images/architecture-diagram.png",
      "alt": "System architecture diagram",
      "caption": "Component relationships and data flow"
    },
    {
      "type": "callout",
      "variant": "info",
      "title": "Technical Note",
      "content": "This uses the component card library pattern from person-v2 and event-v1 templates."
    }
  ]
}
```

---

## Design Features

### From Archival Aesthetic:
- ✅ Muted color palette (archive-bg, archive-secondary)
- ✅ Border-left accents on headings
- ✅ Uppercase tracking-widest on labels
- ✅ Lighter card backgrounds (`bg-[#252021]/60`)
- ✅ Material Icons for semantic meaning
- ✅ Grayscale images with hover color

### Blog-Specific:
- ✅ Category filtering system
- ✅ Featured post hero section
- ✅ Related posts grid (2-column responsive)
- ✅ Tags display (max 3 shown on cards)
- ✅ Reading time calculation (200 words/min)
- ✅ Empty state handling

---

## Next.js Migration Path

### Step 1: Convert to MDX
```mdx
---
title: "My Post Title"
excerpt: "Brief summary"
category: "Development"
date: "2026-02-24"
author: "Author Name"
tags: ["tag1", "tag2"]
---

## Introduction

Regular paragraph content...

<Callout variant="tip" title="Pro Tip">
Helpful advice for readers
</Callout>

> Quote text here
> — Attribution

### Subheading

More content...
```

### Step 2: Create MDX Components
```typescript
// components/MDXComponents.tsx
export const MDXComponents = {
  Callout: ({ variant, title, children }) => (
    <div className={`callout callout-${variant}`}>
      {title && <h4>{title}</h4>}
      <div>{children}</div>
    </div>
  ),
  // ... other components
};
```

### Step 3: Update Routes
```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  const MDXContent = await compileMDX(post.content);

  return (
    <article>
      <h1>{post.title}</h1>
      <MDXContent components={MDXComponents} />
    </article>
  );
}
```

---

## Testing Checklist

- [x] **Blog Listing** - All posts display in grid
- [x] **Featured Post** - Hero section shows featured post
- [x] **Category Filters** - All, About, Development, Research, Updates work
- [x] **Single Post** - Slug routing loads correct post
- [x] **Content Blocks** - All 6 block types render correctly
  - [x] Text blocks
  - [x] Heading blocks (H2, H3)
  - [x] Quote blocks (with/without author)
  - [x] Image blocks (with/without caption)
  - [x] List blocks (ordered/unordered)
  - [x] Callout blocks (all 4 variants)
- [x] **Reading Time** - Calculates based on word count
- [x] **Tags** - Display on cards (max 3)
- [x] **Related Posts** - Grid shows linked posts
- [x] **Empty State** - Shows when no posts match filter
- [x] **About Link** - Blog link present on about.html

---

## Troubleshooting

### Posts Not Showing
1. Check browser console for errors
2. Verify `mock-blog.json` is valid JSON
3. Ensure `category` matches filter options exactly
4. Check that `slug` is unique

### Content Blocks Not Rendering
1. Verify block `type` is one of 6 supported types
2. Check required fields for each block type
3. Look for missing commas in JSON array
4. Validate image paths (relative to HTML file)

### Featured Post Not Appearing
1. Verify `featured: true` is set
2. Check that post is first in array (or manually sort by date)
3. Ensure `excerpt` field exists

### Category Filter Not Working
1. Category must match exactly: `About`, `Development`, `Research`, `Updates`
2. Check JavaScript console for errors
3. Verify `filterByCategory()` function loaded

---

## Support

**Example Posts:** See `mock-blog.json` for 4 complete examples
**Event Template:** Similar patterns in `EVENT-TEMPLATE-README.md`
**Person Template:** Component card library in `PERSON-TEMPLATE-README.md`

---

**Last Updated:** 2026-02-24
**Version:** 1.0.0
